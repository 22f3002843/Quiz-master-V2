from flask import current_app as app
from flask import request, jsonify, render_template
from flask_security import verify_password, auth_required, roles_required, roles_accepted, current_user, login_user, logout_user,login_required
from application.models import *
from application.database import db
from datetime import datetime, date ,timedelta
from sqlalchemy.orm import joinedload
from collections import defaultdict
from sqlalchemy import func, cast, String, or_ ,and_
from caching import cache
import csv
import io
from io import StringIO
from flask import make_response
from flask_mail import Message
from mailer import mail
from celery_context import FlaskTask
from flask_mail import Message
from mailer import mail
from app import celery_app
from celery_context import FlaskTask



@app.route("/")
def index():
    return render_template("index.html")



@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    # we r accessing  the datastore from the app security object
    user = app.security.datastore.find_user(email=email)
    if not user or not verify_password(password, user.password):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    login_user(user)
    token = user.get_auth_token()
    role = user.roles[0].name if user.roles else "user"

    return jsonify({
        "success": True,
        "token": token,
        "userId": str(user.id),
        "role": role,
        "redirect": "/admin/dashboard" if role == "admin" else "/user/dashboard",
        "message": "Login successful!"
    }), 200

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")
    qualification = data.get("qualification")
    dob = data.get("dob")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required!"}), 400
    if not email.endswith("@quizmaster.com"):
        return jsonify({"success": False, "message": "Email must end with @quizmaster.com"}), 400
    if len(password) < 7:
        return jsonify({"success": False, "message": "Password must be at least 7 characters long!"}), 400

    # we r Checking if user already exists
    if app.security.datastore.find_user(email=email):
        return jsonify({"success": False, "message": "User already exists!"}), 409

    # Get or create the user role
    role = app.security.datastore.find_role("user")
    if not role:
        app.security.datastore.create_role(name="user", description="This is a user")
        db.session.commit()
        role = app.security.datastore.find_role("user")

    # Create a new user with the additional fields
    user = app.security.datastore.create_user(
        email=email,
        password=password,  # Flask-Security will hash this
        full_name=full_name,
        qualification=qualification,
        dob=dob,
        roles=[role],
        active=True
    )
    db.session.commit()

    return jsonify({"success": True, "message": "User registered successfully!"}), 201


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logged out successfully."}), 200

@app.route("/api/admin/dashboard", methods=["GET"])
@login_required
def admin_dashboard():

    if not current_user.has_role('admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    all_subjects = Subject.query.options(
        joinedload(Subject.chapters)
        .joinedload(Chapter.quizzes)
        .joinedload(Quiz.questions)
    ).all()

    response_data = []
    for subject in all_subjects:
        subject_info = {
            'id': subject.id,
            'name': subject.name,
            'description': subject.description,
            'chapters': []
        }

        for chapter in subject.chapters:
            chapter_info = {
                'id': chapter.id,
                'name': chapter.name,
                'description': chapter.description,
                'quizzes': []
            }

            for quiz in chapter.quizzes:
                quiz_info = {
                    'id': quiz.id,
                    'date_of_quiz': quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
                    'start_time': quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
                    'time_duration': quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
                    'remarks': quiz.remarks,
                    'questions': []
                }

                quiz_info['questions'] = [
                    {
                        'id': question.id,
                        'question_statement': question.question_statement,
                        'option1': question.option1,
                        'option2': question.option2,
                        'option3': question.option3,
                        'option4': question.option4,
                        'correct_option': question.correct_option
                    }
                    for question in quiz.questions
                ]

                chapter_info['quizzes'].append(quiz_info)

            subject_info['chapters'].append(chapter_info)

        response_data.append(subject_info)

    return jsonify({'subjects': response_data}), 200

########################################################################
#Rutes for crud operations for subjects , chapter ,question and quiz   |
########################################################################

@app.route("/api/admin/subjects", methods=["GET"])
@login_required
@cache.cached(timeout=30)     # set anything timeout= ? but the default is 50 sec
def get_subjects():
 
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    all_subjects = Subject.query.all()
    subjects_list = [
        {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description
        }
        for subject in all_subjects
    ]

    return jsonify({"subjects": subjects_list}), 200


@app.route("/api/admin/subjects", methods=["POST"])
@login_required
def create_subject():
   
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    payload = request.json
    subject_name = payload.get("name")
    subject_description = payload.get("description")

    if not subject_name:
        return jsonify({"message": "Subject name is required"}), 400

    new_subject = Subject(name=subject_name, description=subject_description)
    db.session.add(new_subject)
    db.session.commit()

    return jsonify({
        "id": new_subject.id,
        "name": new_subject.name,
        "description": new_subject.description
    }), 201


@app.route("/api/admin/subjects/<int:subject_id>", methods=["GET"])
@login_required

def get_subject(subject_id):
    """
    Fetch a specific subject's details using its unique identifier.
    """
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    subject_record = Subject.query.get_or_404(subject_id)
    return jsonify({
        "id": subject_record.id,
        "name": subject_record.name,
        "description": subject_record.description
    }), 200


@app.route("/api/admin/subjects/<int:subject_id>", methods=["PUT"])
@login_required
def update_subject(subject_id):
 
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    subject_to_edit = Subject.query.get_or_404(subject_id)
    data = request.json
    subject_to_edit.name = data.get("name", subject_to_edit.name)
    subject_to_edit.description = data.get("description", subject_to_edit.description)

    db.session.commit()

    return jsonify({
        "id": subject_to_edit.id,
        "name": subject_to_edit.name,
        "description": subject_to_edit.description
    }), 200


@app.route("/api/admin/subjects/<int:subject_id>", methods=["DELETE"])
@login_required
def delete_subject(subject_id):

    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    subject_to_remove = Subject.query.get_or_404(subject_id)
    db.session.delete(subject_to_remove)
    db.session.commit()

    return jsonify({"message": "Subject deleted"}), 200

##############################################
# Chapter CRUD Routes------ Administrator
#################################################

@app.route("/api/admin/chapters", methods=["GET"])
@login_required
def get_chapters():
    
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    all_chapters = Chapter.query.all()
    chapters_list = [
        {
            "id": chapter.id,
            "name": chapter.name,
            "description": chapter.description,
            "subject_id": chapter.subject_id
        }
        for chapter in all_chapters
    ]

    return jsonify({"chapters": chapters_list}), 200


@app.route("/api/admin/chapters", methods=["POST"])
@login_required
def create_chapter():
  
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    payload = request.get_json()
    chapter_name = payload.get("name")
    chapter_description = payload.get("description")
    parent_subject_id = payload.get("subject_id")

    if not chapter_name or not parent_subject_id:
        return jsonify({"message": "Chapter name and subject ID are required"}), 400

    new_chapter = Chapter(
        name=chapter_name,
        description=chapter_description,
        subject_id=parent_subject_id
    )
    db.session.add(new_chapter)
    db.session.commit()

    return jsonify({
        "id": new_chapter.id,
        "name": new_chapter.name,
        "description": new_chapter.description,
        "subject_id": new_chapter.subject_id
    }), 201


@app.route("/api/admin/chapters/<int:chapter_id>", methods=["GET"])
@login_required
def get_chapter(chapter_id):
  
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    chapter_record = Chapter.query.get_or_404(chapter_id)

    return jsonify({
        "id": chapter_record.id,
        "name": chapter_record.name,
        "description": chapter_record.description,
        "subject_id": chapter_record.subject_id
    }), 200


@app.route("/api/admin/chapters/<int:chapter_id>", methods=["PUT"])
@login_required
def update_chapter(chapter_id):
  
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    chapter_to_update = Chapter.query.get_or_404(chapter_id)
    updates = request.get_json()

    chapter_to_update.name = updates.get("name", chapter_to_update.name)
    chapter_to_update.description = updates.get("description", chapter_to_update.description)

    #  may be Optional: Update subject_id if provided
    if "subject_id" in updates:
        chapter_to_update.subject_id = updates["subject_id"]

    db.session.commit()

    return jsonify({
        "id": chapter_to_update.id,
        "name": chapter_to_update.name,
        "description": chapter_to_update.description,
        "subject_id": chapter_to_update.subject_id
    }), 200


@app.route("/api/admin/chapters/<int:chapter_id>", methods=["DELETE"])
@login_required
def delete_chapter(chapter_id):
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    chapter_to_remove = Chapter.query.get_or_404(chapter_id)
    db.session.delete(chapter_to_remove)
    db.session.commit()

    return jsonify({"message": "Chapter deleted"}), 200


# ##########################
# Quiz CRUD Routes #########
# ##########################

@app.route("/api/admin/quizzes", methods=["GET"])
@login_required
def get_quizzes():
  
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    all_quizzes = Quiz.query.all()
    quiz_entries = [
        {
            "id": quiz.id,
            "chapter_id": quiz.chapter_id,
            "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
            "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
            "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
            "remarks": quiz.remarks,
            "created_at": quiz.created_at.strftime('%Y-%m-%d %H:%M:%S') if quiz.created_at else None
        }
        for quiz in all_quizzes
    ]

    return jsonify({"quizzes": quiz_entries}), 200


@app.route("/api/admin/quizzes", methods=["POST"])
@login_required
def create_quiz():
   
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    payload = request.get_json()
    chapter_id = payload.get("chapter_id")
    date_str = payload.get("date_of_quiz")
    time_str = payload.get("start_time")
    duration_str = payload.get("time_duration")
    notes = payload.get("remarks")

    if not chapter_id:
        return jsonify({"message": "Chapter ID is required"}), 400

    try:
        quiz_date = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.utcnow()
    except Exception:
        return jsonify({"message": "Invalid date_of_quiz format. Use YYYY-MM-DD"}), 400

    try:
        start_at = datetime.strptime(time_str, "%H:%M").time() if time_str else None
    except Exception:
        return jsonify({"message": "Invalid start_time format. Use HH:MM"}), 400

    try:
        duration = datetime.strptime(duration_str, "%H:%M").time() if duration_str else None
    except Exception:
        return jsonify({"message": "Invalid time_duration format. Use HH:MM"}), 400

    new_quiz = Quiz(
        chapter_id=chapter_id,
        date_of_quiz=quiz_date,
        start_time=start_at,
        time_duration=duration,
        remarks=notes
    )
    db.session.add(new_quiz)
    db.session.commit()

    return jsonify({
        "id": new_quiz.id,
        "chapter_id": new_quiz.chapter_id,
        "date_of_quiz": new_quiz.date_of_quiz.strftime('%Y-%m-%d'),
        "start_time": new_quiz.start_time.strftime('%H:%M') if new_quiz.start_time else None,
        "time_duration": new_quiz.time_duration.strftime('%H:%M') if new_quiz.time_duration else None,
        "remarks": new_quiz.remarks,
        "created_at": new_quiz.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 201


@app.route("/api/admin/quizzes/<int:quiz_id>", methods=["GET"])
@login_required
def get_quiz(quiz_id):
    """
    Get detailed quiz info by quiz ID (Admin only).
    """
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    quiz = Quiz.query.get_or_404(quiz_id)

    return jsonify({
        "id": quiz.id,
        "chapter_id": quiz.chapter_id,
        "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
        "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
        "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
        "remarks": quiz.remarks,
        "created_at": quiz.created_at.strftime('%Y-%m-%d %H:%M:%S') if quiz.created_at else None
    }), 200


@app.route("/api/admin/quizzes/<int:quiz_id>", methods=["PUT"])
@login_required
def update_quiz(quiz_id):
 
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    quiz = Quiz.query.get_or_404(quiz_id)
    updates = request.get_json()

    if "chapter_id" in updates:
        quiz.chapter_id = updates["chapter_id"]

    if "date_of_quiz" in updates:
        try:
            quiz.date_of_quiz = datetime.strptime(updates["date_of_quiz"], "%Y-%m-%d")
        except Exception:
            return jsonify({"message": "Invalid date_of_quiz format. Use YYYY-MM-DD"}), 400

    if "start_time" in updates:
        try:
            quiz.start_time = datetime.strptime(updates["start_time"], "%H:%M").time()
        except Exception:
            return jsonify({"message": "Invalid start_time format. Use HH:MM"}), 400

    if "time_duration" in updates:
        try:
            quiz.time_duration = datetime.strptime(updates["time_duration"], "%H:%M").time()
        except Exception:
            return jsonify({"message": "Invalid time_duration format. Use HH:MM"}), 400

    quiz.remarks = updates.get("remarks", quiz.remarks)

    db.session.commit()

    return jsonify({
        "id": quiz.id,
        "chapter_id": quiz.chapter_id,
        "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d'),
        "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
        "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
        "remarks": quiz.remarks,
        "created_at": quiz.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 200


@app.route("/api/admin/quizzes/<int:quiz_id>", methods=["DELETE"])
@login_required
def delete_quiz(quiz_id):
 
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    target_quiz = Quiz.query.get_or_404(quiz_id)
    db.session.delete(target_quiz)
    db.session.commit()

    return jsonify({"message": "Quiz deleted"}), 200


# ###########################
# Question CRUD Routes ######
# ###########################

@app.route("/api/admin/questions", methods=["GET"])
@login_required
def get_questions():
   
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    question_records = Question.query.all()
    question_list = [
        {
            "id": item.id,
            "quiz_id": item.quiz_id,
            "question_statement": item.question_statement,
            "option1": item.option1,
            "option2": item.option2,
            "option3": item.option3,
            "option4": item.option4,
            "correct_option": item.correct_option
        }
        for item in question_records
    ]

    return jsonify({"questions": question_list}), 200


@app.route("/api/admin/questions", methods=["POST"])
@login_required
def create_question():
  
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    payload = request.get_json()
    quiz_id = payload.get("quiz_id")
    text = payload.get("question_statement")
    op1 = payload.get("option1")
    op2 = payload.get("option2")
    op3 = payload.get("option3")
    op4 = payload.get("option4")
    answer = payload.get("correct_option")

    if not quiz_id or not text or answer is None:
        return jsonify({"message": "Quiz ID, question text, and correct option are required"}), 400

    new_question = Question(
        quiz_id=quiz_id,
        question_statement=text,
        option1=op1,
        option2=op2,
        option3=op3,
        option4=op4,
        correct_option=answer
    )
    db.session.add(new_question)
    db.session.commit()

    return jsonify({
        "id": new_question.id,
        "quiz_id": new_question.quiz_id,
        "question_statement": new_question.question_statement,
        "option1": new_question.option1,
        "option2": new_question.option2,
        "option3": new_question.option3,
        "option4": new_question.option4,
        "correct_option": new_question.correct_option
    }), 201


@app.route("/api/admin/questions/<int:question_id>", methods=["GET"])
@login_required
def get_question(question_id):
    """
    Fetch details of a specific question by its ID (Admin only).
    """
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    question_item = Question.query.get_or_404(question_id)

    return jsonify({
        "id": question_item.id,
        "quiz_id": question_item.quiz_id,
        "question_statement": question_item.question_statement,
        "option1": question_item.option1,
        "option2": question_item.option2,
        "option3": question_item.option3,
        "option4": question_item.option4,
        "correct_option": question_item.correct_option
    }), 200


@app.route("/api/admin/questions/<int:question_id>", methods=["PUT"])
@login_required
def update_question(question_id):
 
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    question_entry = Question.query.get_or_404(question_id)
    updates = request.get_json()

    question_entry.quiz_id = updates.get("quiz_id", question_entry.quiz_id)
    question_entry.question_statement = updates.get("question_statement", question_entry.question_statement)
    question_entry.option1 = updates.get("option1", question_entry.option1)
    question_entry.option2 = updates.get("option2", question_entry.option2)
    question_entry.option3 = updates.get("option3", question_entry.option3)
    question_entry.option4 = updates.get("option4", question_entry.option4)
    question_entry.correct_option = updates.get("correct_option", question_entry.correct_option)

    db.session.commit()

    return jsonify({
        "id": question_entry.id,
        "quiz_id": question_entry.quiz_id,
        "question_statement": question_entry.question_statement,
        "option1": question_entry.option1,
        "option2": question_entry.option2,
        "option3": question_entry.option3,
        "option4": question_entry.option4,
        "correct_option": question_entry.correct_option
    }), 200


@app.route("/api/admin/questions/<int:question_id>", methods=["DELETE"])
@login_required
def delete_question(question_id):
 
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    question_to_delete = Question.query.get_or_404(question_id)
    db.session.delete(question_to_delete)
    db.session.commit()

    return jsonify({"message": "Question deleted"}), 200


# -------------------------------------------
# User Management CRUD Routes in admin portal
# -------------------------------------------

@app.route("/api/admin/users", methods=["GET"])
@login_required
def fetch_all_users():
    """Fetch all registered users (admin access only)."""
    if not current_user.has_role("admin"):
        return jsonify({"message": "Unauthorized access"}), 403

    user_data = []
    for user in User.query.all():
        user_data.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "qualification": user.qualification,
            "dob": user.dob,
            "active": user.active,
            "roles": [role.name for role in user.roles]
        })
    return jsonify({"users": user_data}), 200


@app.route("/api/admin/users/<int:user_id>", methods=["GET"])
@login_required
def fetch_user_by_id(user_id):
    """Retrieve specific user information using user ID (admin only)."""
    if not current_user.has_role("admin"):
        return jsonify({"message": "Unauthorized access"}), 403

    user = User.query.get_or_404(user_id)
    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "qualification": user.qualification,
        "dob": user.dob,
        "active": user.active,
        "roles": [role.name for role in user.roles]
    }), 200


@app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@login_required
def modify_user_details(user_id):
    """Update user information (admin only)."""
    if not current_user.has_role("admin"):
        return jsonify({"message": "Unauthorized access"}), 403

    user = User.query.get_or_404(user_id)
    payload = request.json

    user.email = payload.get("email", user.email)
    user.full_name = payload.get("full_name", user.full_name)
    user.qualification = payload.get("qualification", user.qualification)
    user.dob = payload.get("dob", user.dob)
    if "active" in payload:
        user.active = payload["active"]

    db.session.commit()

    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "qualification": user.qualification,
        "dob": user.dob,
        "active": user.active,
        "roles": [role.name for role in user.roles]
    }), 200




@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@login_required
def remove_user(user_id):
    """Delete a user record (admin only)."""
    if not current_user.has_role("admin"):
        return jsonify({"message": "Unauthorized access"}), 403

    user = User.query.get_or_404(user_id)
    
    # Delete related score records
    Score.query.filter_by(user_id=user_id).delete()
    
    # Delete the user
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User successfully removed"}), 200

# @app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
# @login_required
# def remove_user(user_id):
#     """Delete a user record (admin only)."""
#     if not current_user.has_role("admin"):
#         return jsonify({"message": "Unauthorized access"}), 403

#     user = User.query.get_or_404(user_id)
#     db.session.delete(user)
#     db.session.commit()

#     return jsonify({"message": "User successfully removed"}), 200


@app.route("/api/admin/summary", methods=["GET"])
@login_required
def get_admin_summary():
    """Generate dashboard metrics including top scores, attempts, and performers."""
    # Bar Chart: Top scores by subject
    top_scores = (
        db.session.query(Subject.name, db.func.max(Score.total_scored).label('max_score'))
        .join(Chapter, Subject.id == Chapter.subject_id)
        .join(Quiz, Chapter.id == Quiz.chapter_id)
        .join(Score, Quiz.id == Score.quiz_id)
        .group_by(Subject.id)
        .all()
    )
    bar_labels = [subject for subject, _ in top_scores]
    bar_scores = [score for _, score in top_scores]

    # Pie Chart: Total quiz attempts per subject
    attempt_data = (
        db.session.query(Subject.name, db.func.count(Score.id).label('total_attempts'))
        .join(Chapter, Subject.id == Chapter.subject_id)
        .join(Quiz, Chapter.id == Quiz.chapter_id)
        .join(Score, Quiz.id == Score.quiz_id)
        .group_by(Subject.id)
        .all()
    )
    pie_labels = [subject for subject, _ in attempt_data]
    pie_values = [attempts for _, attempts in attempt_data]

    # Table: Top performers across quizzes
    max_scores_subq = (
        db.session.query(
            Score.user_id,
            Score.quiz_id,
            db.func.max(Score.total_scored).label("score")
        )
        .group_by(Score.user_id, Score.quiz_id)
        .subquery()
    )

    top_performers = (
        db.session.query(
            User.full_name,
            db.func.sum(max_scores_subq.c.score).label("total_score"),
            db.func.count(max_scores_subq.c.score).label("quiz_attempts")
        )
        .join(max_scores_subq, max_scores_subq.c.user_id == User.id)
        .group_by(User.id)
        .order_by(db.func.sum(max_scores_subq.c.score).desc())
        .limit(5)
        .all()
    )

    leaderboard = []
    for performer in top_performers:
        leaderboard.append({
            "full_name": performer.full_name,
            "total_score": performer.total_score,
            "attempts": performer.quiz_attempts
        })

    return jsonify({
        "subject_labels_bar": bar_labels,
        "subject_top_scores_data": bar_scores,
        "subject_labels_pie": pie_labels,
        "subject_attempts_data": pie_values,
        "top_performers": leaderboard
    }), 200

# --------------------------------------------------------
# Admin Search for Subjects                               |
# --------------------------------------------------------
@app.route("/api/admin/search/subjects", methods=["GET"])
@login_required
def find_subjects():
    """Allow admin to search for subjects by name (case-insensitive)."""
    if not current_user.has_role("admin"):
        return jsonify({"message": "Access denied"}), 403

    search_term = request.args.get("q", "").strip()

    matched_subjects = Subject.query.filter(Subject.name.ilike(f"%{search_term}%")).all()

    response = []
    for subject in matched_subjects:
        response.append({
            "id": subject.id,
            "name": subject.name,
            "description": subject.description
        })

    return jsonify({"subjects": response}), 200


# -----------------------------
# Admin Search for Chapters   |
# -----------------------------
@app.route("/api/admin/search/chapters", methods=["GET"])
@login_required
def find_chapters():
    
    if not current_user.has_role("admin"):
        return jsonify({"message": "Access denied"}), 403

    keyword = request.args.get("q", "").strip()

    matching_chapters = Chapter.query.filter(Chapter.name.ilike(f"%{keyword}%")).all()

    chapter_list = []
    for chapter in matching_chapters:
        chapter_list.append({
            "id": chapter.id,
            "name": chapter.name,
            "description": chapter.description,
            "subject_id": chapter.subject_id
        })

    return jsonify({"chapters": chapter_list}), 200


# -----------------------------
# Admin Search for a Quiz by ID
# -----------------------------
@app.route("/api/admin/search/quizzes", methods=["GET"])
@login_required
def find_quiz_by_id():
    if not current_user.has_role("admin"):
        return jsonify({"message": "Access denied"}), 403

    quiz_id = request.args.get("quiz_id")
    if not quiz_id:
        return jsonify({"message": "Missing quiz_id query parameter"}), 400

    quiz = Quiz.query.filter_by(id=quiz_id).first()
    if quiz is None:
        return jsonify({"message": "No quiz found with the provided ID"}), 404

    quiz_data = {
        "id": quiz.id,
        "chapter_id": quiz.chapter_id,
        "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
        "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
        "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
        "remarks": quiz.remarks,
        "created_at": quiz.created_at.strftime('%Y-%m-%d %H:%M:%S') if quiz.created_at else None
    }

    return jsonify({"quiz": quiz_data}), 200


# -----------------------------
# Admin Search for Users
# -----------------------------
@app.route("/api/admin/search/users", methods=["GET"])
@login_required
def search_users():
    if not current_user.has_role("admin"):
        return jsonify({"message": "Unauthorized"}), 403

    query = request.args.get("q", "")
    # Search by full name or email (case-insensitive)
    users = User.query.filter(
        or_(
            User.full_name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%")
        )
    ).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "qualification": u.qualification,
            "dob": u.dob,
            "active": u.active,
            "roles": [role.name for role in u.roles]
        })
    return jsonify({"users": results}), 200

# ----------------------------------
# User Dashboard & Quiz Attempt Routes
# ----------------------------------


@app.route('/api/user/dashboard', methods=["GET"])
@login_required
def load_user_dashboard():
    """
    Serve dashboard data for a logged-in user:
    - Upcoming quizzes (future only)
    - All quizzes
    """
    uid = current_user.id
    today = date.today()
    current_time = datetime.now().time()

    # Fetch upcoming quizzes (future date/time)
    upcoming = Quiz.query.options(
        joinedload(Quiz.chapter).joinedload(Chapter.subject)
    ).filter(
        (Quiz.date_of_quiz > today) |
        ((Quiz.date_of_quiz == today) & (Quiz.start_time > current_time))
    ).order_by(Quiz.date_of_quiz, Quiz.start_time).all()

    # All quizzes regardless of timing
    full_list = Quiz.query.options(
        joinedload(Quiz.chapter).joinedload(Chapter.subject)
    ).order_by(Quiz.date_of_quiz, Quiz.start_time).all()

    query_term = request.args.get('q', '').strip()
    search_subjects = []
    search_chapters = []
    search_quizzes = []

    if query_term:
        search_subjects = Quiz.query.options(
            joinedload(Quiz.chapter).joinedload(Chapter.subject)
        ).join(Quiz.chapter).join(Chapter.subject).filter(
            Subject.name.ilike(f"%{query_term}%")
        ).all()

        search_chapters = Quiz.query.options(
            joinedload(Quiz.chapter).joinedload(Chapter.subject)
        ).join(Quiz.chapter).filter(
            Chapter.name.ilike(f"%{query_term}%")
        ).all()

        search_quizzes = Quiz.query.options(
            joinedload(Quiz.chapter).joinedload(Chapter.subject)
        ).filter(
            cast(Quiz.id, String).ilike(f"%{query_term}%")
        ).all()

    def quiz_info(q):
        return {
            "id": q.id,
            "chapter_id": q.chapter_id,
            "date_of_quiz": q.date_of_quiz.strftime('%Y-%m-%d') if q.date_of_quiz else None,
            "start_time": q.start_time.strftime('%H:%M') if q.start_time else None,
            "time_duration": q.time_duration.strftime('%H:%M') if q.time_duration else None,
            "remarks": q.remarks,
            "chapter": {
                "id": q.chapter.id,
                "name": q.chapter.name,
                "subject": {
                    "id": q.chapter.subject.id,
                    "name": q.chapter.subject.name
                } if q.chapter.subject else None
            }
        }

    return jsonify({
        "upcoming_quizzes": [quiz_info(qz) for qz in upcoming],
        "all_quizzes": [quiz_info(qz) for qz in full_list],
        "q": query_term,
        "subject_results": [quiz_info(qz) for qz in search_subjects],
        "chapter_results": [quiz_info(qz) for qz in search_chapters],
        "quiz_results": [quiz_info(qz) for qz in search_quizzes]
    }), 200


@app.route('/api/user_view_quiz/<int:quiz_id>', methods=["GET"])
@login_required
def view_quiz_details(quiz_id):
    """
    Fetch quiz and related questions.
    """
    quiz = Quiz.query.options(
        joinedload(Quiz.chapter).joinedload(Chapter.subject)
    ).get_or_404(quiz_id)

    question_data = [{
        "id": q.id,
        "question_statement": q.question_statement,
        "option1": q.option1,
        "option2": q.option2,
        "option3": q.option3,
        "option4": q.option4,
        "correct_option": q.correct_option
    } for q in quiz.questions]

    return jsonify({
        "quiz": {
            "id": quiz.id,
            "chapter": {
                "id": quiz.chapter.id,
                "name": quiz.chapter.name,
                "subject": {
                    "id": quiz.chapter.subject.id,
                    "name": quiz.chapter.subject.name
                } if quiz.chapter.subject else None
            },
            "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
            "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
            "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
            "remarks": quiz.remarks,
            "created_at": quiz.created_at.strftime('%Y-%m-%d %H:%M:%S') if quiz.created_at else None
        },
        "num_questions": len(quiz.questions),
        "questions": question_data
    }), 200


# @app.route('/api/user/upcoming_quizzes', methods=["GET"])
# @login_required
# def fetch_upcoming_quizzes():
#     """
#     Return list of future quizzes for students.
#     """
#     today = date.today()
#     current_time = datetime.now().time()

#     upcoming_quizzes = Quiz.query.filter(
#         (Quiz.date_of_quiz > today) |
#         ((Quiz.date_of_quiz == today) & (Quiz.start_time > current_time))
#     ).order_by(Quiz.date_of_quiz, Quiz.start_time).all()

#     def format_quiz(q):
#         return {
#             "id": q.id,
#             "chapter_id": q.chapter_id,
#             "date_of_quiz": q.date_of_quiz.strftime('%Y-%m-%d') if q.date_of_quiz else None,
#             "start_time": q.start_time.strftime('%H:%M') if q.start_time else None,
#             "time_duration": q.time_duration.strftime('%H:%M') if q.time_duration else None,
#             "remarks": q.remarks
#         }

#     return jsonify({
#         "upcoming_quizzes": [format_quiz(qz) for qz in upcoming_quizzes]
#     }), 200

@app.route('/api/user/upcoming_quizzes', methods=["GET"])
@login_required
def fetch_upcoming_quizzes():
    """
    Return list of future quizzes for students.
    """
    today = date.today()
    current_time = datetime.now().time()

    upcoming_quizzes = Quiz.query.filter(
        (Quiz.date_of_quiz > today) |
        ((Quiz.date_of_quiz == today) & (Quiz.start_time > current_time))
    ).order_by(Quiz.date_of_quiz, Quiz.start_time).all()

    def format_quiz(q):
        return {
            "id": q.id,
            "chapter_id": q.chapter_id,
            "chapter": {
                "id": q.chapter.id,
                "name": q.chapter.name,
                "subject": {
                    "id": q.chapter.subject.id,
                    "name": q.chapter.subject.name
                }
            },
            "date_of_quiz": q.date_of_quiz.strftime('%Y-%m-%d') if q.date_of_quiz else None,
            "start_time": q.start_time.strftime('%H:%M') if q.start_time else None,
            "time_duration": q.time_duration.strftime('%H:%M') if q.time_duration else None,
            "remarks": q.remarks
        }

    return jsonify({
        "upcoming_quizzes": [format_quiz(qz) for qz in upcoming_quizzes]
    }), 200

@app.route('/api/user/attempt_quiz/<int:quiz_id>/attempt', methods=["GET", "POST"])
@login_required
def handle_quiz_attempt(quiz_id):
    """
    GET: Show quiz content for attempt.
    POST: Save submitted responses and calculate score.
    """
    quiz = Quiz.query.get_or_404(quiz_id)
    now = datetime.now()

    if not quiz.start_time:
        return jsonify({"message": "Start time missing. Contact admin."}), 400

    start_datetime = datetime.combine(quiz.date_of_quiz, quiz.start_time)

    if now < start_datetime:
        return jsonify({
            "message": f"Quiz not started. Opens at {quiz.start_time.strftime('%H:%M')} on {quiz.date_of_quiz.strftime('%Y-%m-%d')}."
        }), 400

    if request.method == "GET":
        questions_payload = [{
            "id": q.id,
            "question_statement": q.question_statement,
            "option1": q.option1,
            "option2": q.option2,
            "option3": q.option3,
            "option4": q.option4,
            "correct_option": q.correct_option
        } for q in quiz.questions]

        return jsonify({
            "quiz": {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
                "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
                "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
                "remarks": quiz.remarks
            },
            "questions": questions_payload,
            "quiz_start_datetime": start_datetime.strftime('%Y-%m-%d %H:%M:%S'),
            "now": now.strftime('%Y-%m-%d %H:%M:%S')
        }), 200

    if request.method == "POST":
        correct_answers = 0
        for question in quiz.questions:
            selected = request.json.get(f"question_{question.id}")
            if selected and int(selected) == question.correct_option:
                correct_answers += 1

        score_entry = Score(
            quiz_id=quiz_id,
            user_id=current_user.id,
            total_scored=correct_answers,
            time_stamp_of_attempt=datetime.utcnow()
        )
        db.session.add(score_entry)
        db.session.commit()

        return jsonify({
            "message": "Submission successful",
            "score": correct_answers,
            "total": len(quiz.questions)
        }), 200


@app.route('/api/user/score', methods=["GET"])
@login_required
def fetch_user_scores():
    """
    Fetch a list of quiz scores for the logged-in user, most recent first, including score percentage.
    """
    user_id = current_user.id
    user_scores = Score.query.options(
        joinedload(Score.quiz).joinedload(Quiz.chapter),
        joinedload(Score.quiz).joinedload(Quiz.questions)
    ).filter_by(user_id=user_id).order_by(Score.time_stamp_of_attempt.desc()).all()

    result = []
    for entry in user_scores:
        # Calculating total possible score as there is 1 point per question
        total_questions = len(entry.quiz.questions)
        score_percentage = (entry.total_scored / total_questions * 100) if total_questions > 0 else 0

        result.append({
            "id": entry.id,
            "quiz_id": entry.quiz_id,
            "total_scored": entry.total_scored,
            "score_percentage": round(score_percentage, 2),  # Rounded to 2 decimal places
            "time_stamp_of_attempt": entry.time_stamp_of_attempt.strftime('%Y-%m-%d %H:%M:%S') if entry.time_stamp_of_attempt else 'N/A'
        })

    return jsonify({"scores": result}), 200


@app.route('/api/user/summary', methods=["GET"])
@login_required
def fetch_user_summary():
    """
    Returns quiz attempt stats grouped by subject and by month.
    """
    user_id = current_user.id

    # Count attempts per subject
    subject_stats = (
        db.session.query(Subject.name, func.count(Score.id))
        .join(Chapter, Subject.id == Chapter.subject_id)
        .join(Quiz, Chapter.id == Quiz.chapter_id)
        .join(Score, Quiz.id == Score.quiz_id)
        .filter(Score.user_id == user_id)
        .group_by(Subject.id)
        .all()
    )

    subject_labels = [label for label, _ in subject_stats]
    subject_values = [count for _, count in subject_stats]

    # Monthly distribution of attempts
    all_scores = Score.query.filter_by(user_id=user_id).all()
    monthly_count = defaultdict(int)
    for score in all_scores:
        month_name = score.time_stamp_of_attempt.strftime("%B")
        monthly_count[month_name] += 1

    month_labels = list(monthly_count.keys())
    month_values = list(monthly_count.values())

    return jsonify({
        "subject_labels": subject_labels,
        "subject_data": subject_values,
        "pie_labels": month_labels,
        "pie_data": month_values
    }), 200


@app.route('/api/user/search', methods=["GET"])
@login_required
def search_user_quizzes():
    """
    Allows users to search quizzes by subject name, chapter name, or quiz ID.
    """
    keyword = request.args.get('q', '').strip()
    if not keyword:
        return jsonify({"message": "Query parameter 'q' is required"}), 400

    # Lookup by subject
    matches_by_subject = Quiz.query.options(
        joinedload(Quiz.chapter).joinedload(Chapter.subject)
    ).join(Quiz.chapter).join(Chapter.subject).filter(
        Subject.name.ilike(f"%{keyword}%")
    ).all()

    # Lookup by chapter
    matches_by_chapter = Quiz.query.options(
        joinedload(Quiz.chapter).joinedload(Chapter.subject)
    ).join(Quiz.chapter).filter(
        Chapter.name.ilike(f"%{keyword}%")
    ).all()

    # Lookup by quiz ID
    matches_by_id = Quiz.query.options(
        joinedload(Quiz.chapter).joinedload(Chapter.subject)
    ).filter(
        cast(Quiz.id, String).ilike(f"%{keyword}%")
    ).all()

    def format_quiz(quiz):
        return {
            "id": quiz.id,
            "chapter_id": quiz.chapter_id,
            "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
            "start_time": quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
            "time_duration": quiz.time_duration.strftime('%H:%M') if quiz.time_duration else None,
            "remarks": quiz.remarks,
            "chapter": {
                "id": quiz.chapter.id,
                "name": quiz.chapter.name,
                "subject": {
                    "id": quiz.chapter.subject.id,
                    "name": quiz.chapter.subject.name
                } if quiz.chapter.subject else None
            }
        }

    return jsonify({
        "q": keyword,
        "subject_results": [format_quiz(qz) for qz in matches_by_subject],
        "chapter_results": [format_quiz(qz) for qz in matches_by_chapter],
        "quiz_results": [format_quiz(qz) for qz in matches_by_id]
    }), 200
    



@app.route('/api/admin/search', methods=["GET"])
@login_required
def admin_search_api():
    """
    Search for subjects, chapters, quizzes, and users based on query parameter 'q'.
    """
    if not current_user.has_role('admin'):
        return jsonify({"message": "Unauthorized"}), 403

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({"message": "Query parameter 'q' is required."}), 400

    # Search subjects by name
    subjects = Subject.query.filter(Subject.name.ilike(f"%{query}%")).all()

    # Search chapters by name
    chapters = Chapter.query.filter(Chapter.name.ilike(f"%{query}%")).all()

    # Search quizzes by remarks (since there's no 'name' column)
    quizzes = Quiz.query.filter(Quiz.remarks.ilike(f"%{query}%")).all()

    # Search users by full name or email
    users = User.query.filter(
        (User.full_name.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))
    ).all()

    def serialize_subject(s):
        return {"id": s.id, "name": s.name, "type": "Subject"}

    def serialize_chapter(c):
        return {"id": c.id, "name": c.name, "type": "Chapter"}

    def serialize_quiz(q):
        return {"id": q.id, "remarks": q.remarks, "type": "Quiz"}

    def serialize_user(u):
        return {"id": u.id, "name": u.full_name, "type": "User"}

    results = (
        [serialize_subject(s) for s in subjects] +
        [serialize_chapter(c) for c in chapters] +
        [serialize_quiz(q) for q in quizzes] +
        [serialize_user(u) for u in users]
    )

    return jsonify(results), 200


@app.route('/api/user/update_profile', methods=['POST'])
@login_required
def update_profile():
    data = request.get_json()
    full_name = data.get('full_name')
    if not full_name:
        return jsonify({'message': 'Full name is required'}), 400
    current_user.full_name = full_name
    db.session.commit()
    return jsonify({'message': 'Profile updated'})


#####################
# FOR EXPORTS CSV   |
#####################


@app.route('/api/admin/export_dashboard_data', methods=['GET'])
@login_required
def export_admin_dashboard_data():
  
    if not current_user.has_role('admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Subject-wise Top Scores
    top_scores = (
        db.session.query(Subject.name, func.max(Score.total_scored).label('max_score'))
        .join(Chapter, Subject.id == Chapter.subject_id)
        .join(Quiz, Chapter.id == Quiz.chapter_id)
        .join(Score, Quiz.id == Score.quiz_id)
        .group_by(Subject.id)
        .all()
    )
    writer.writerow(['Subject-wise Top Scores'])
    writer.writerow(['Subject', 'Top Score'])
    for subject, score in top_scores:
        writer.writerow([subject, score if score is not None else 'N/A'])
    writer.writerow([])  # Blank row for separation

    # Subject-wise Attempts
    attempt_data = (
        db.session.query(Subject.name, func.count(Score.id).label('total_attempts'))
        .join(Chapter, Subject.id == Chapter.subject_id)
        .join(Quiz, Chapter.id == Quiz.chapter_id)
        .join(Score, Quiz.id == Score.quiz_id)
        .group_by(Subject.id)
        .all()
    )
    writer.writerow(['Subject-wise Attempts'])
    writer.writerow(['Subject', 'Total Attempts'])
    for subject, attempts in attempt_data:
        writer.writerow([subject, attempts])
    writer.writerow([])  # Blank row for separation

    # User Information
    user_scores = (
        db.session.query(
            User.id,
            User.full_name,
            User.email,
            func.sum(Score.total_scored).label('total_score'),
            func.count(Score.id).label('total_attempts')
        )
        .outerjoin(Score, User.id == Score.user_id)
        .group_by(User.id)
        .all()
    )
    writer.writerow(['User Information'])
    writer.writerow(['User ID', 'Full Name', 'Email', 'Total Score', 'Total Attempts'])
    for user_id, full_name, email, total_score, total_attempts in user_scores:
        writer.writerow([
            user_id,
            full_name or 'N/A',
            email,
            total_score if total_score is not None else 0,
            total_attempts
        ])
    writer.writerow([])  # Blank row for separation

    # Summary: Total Number of Users
    total_users = db.session.query(func.count(User.id)).scalar()
    writer.writerow(['Summary'])
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Total Users', total_users])

    # Prepare response
    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = f'attachment; filename=admin_dashboard_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    response.headers['Content-Type'] = 'text/csv'
    
    return response

#for users............ 


@app.route('/api/user/export_quiz_data', methods=['GET'])
@login_required
def export_quiz_data():
    # Fetch user's quiz scores
    scores = (db.session.query(Score, Quiz, Chapter, Subject)
              .join(Quiz, Score.quiz_id == Quiz.id)
              .join(Chapter, Quiz.chapter_id == Chapter.id)
              .join(Subject, Chapter.subject_id == Subject.id)
              .filter(Score.user_id == current_user.id)
              .all())

    # Prepare CSV data
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Quiz ID', 'Subject', 'Chapter', 'Score (%)', 'Attempt Time'])

    for score, quiz, chapter, subject in scores:
        # Calculate total possible score (assuming 1 point per question)
        total_questions = db.session.query(Question).filter_by(quiz_id=quiz.id).count()
        score_percentage = (score.total_scored / total_questions * 100) if total_questions > 0 else 0
        attempt_time = score.time_stamp_of_attempt.strftime('%Y-%m-%d %H:%M:%S') if score.time_stamp_of_attempt else 'N/A'
        
        writer.writerow([
            quiz.id,
            subject.name,
            chapter.name,
            f"{score_percentage:.2f}",
            attempt_time
        ])

    # Create response
    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=quiz_data.csv'
    response.headers['Content-Type'] = 'text/csv'
    return response



####################################################
#############CELEERY TASKS#3#######################


@celery_app.task(base=FlaskTask)
def send_daily_quiz_reminders():
    """
    Send daily reminders to all active users (except admin@quizmaster.com as this is admin) about new quizzes created in the last 24 hours.
    """
    time_threshold = datetime.utcnow() - timedelta(days=1)  # Last 24 hours

    # Find new quizzes
    new_quizzes = (
        Quiz.query
        .join(Chapter, Quiz.chapter_id == Chapter.id)
        .join(Subject, Chapter.subject_id == Subject.id)
        .filter(Quiz.created_at >= time_threshold)
        .all()
    )

    # If no new quizzes, skip sending emails
    if not new_quizzes:
        app.logger.info("No new quizzes found for reminder.")
        return 0

    # Get all active users
    users = User.query.filter(User.active == True).all()
    if not users:
        app.logger.info("No active users found for reminder.")
        return 0

    # Prepare email content
    subject = "QuizMaster: New Quizzes Await You!"
    sent_count = 0
    for user in users:
        # Skiping admin@quizmaster.com
        if user.email == 'admin@quizmaster.com':
            app.logger.info(f"Skipping reminder email for {user.email}")
            continue

        body = f"Hello {user.full_name or user.email},\n\n"
        body += "New quizzes are available on QuizMaster:\n"
        for quiz in new_quizzes:
            subject_name = quiz.chapter.subject.name
            body += f"- Quiz ID {quiz.id} in {subject_name}\n"
        body += "\nLog in to attempt these quizzes: http://127.0.0.1:5000/#/user/dashboard\n\n"
        body += "Best,\nQuizMaster Team"

        msg = Message(
            subject=subject,
            recipients=[user.email],
            body=body
        )
        try:
            mail.send(msg)
            app.logger.info(f"Sent reminder email to {user.email}")
            sent_count += 1
        except Exception as e:
            app.logger.error(f"Failed to send email to {user.email}: {str(e)}")

    return sent_count


################################
# for  momthly reports
###############################

@celery_app.task(base=FlaskTask)
def send_monthly_activity_report():
    """
    Send a monthly activity report to all active users (except admin@quizmaster.com) on the 1st of each month.
    Report lists new quizzes created in the previous month.
    """
    # Determine previous month's start and end
    today = datetime.utcnow()
    first_day_current_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_day_prev_month = first_day_current_month - timedelta(seconds=1)
    first_day_prev_month = last_day_prev_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Get new quizzes from the previous month
    new_quizzes = (
        Quiz.query
        .join(Chapter, Quiz.chapter_id == Chapter.id)
        .join(Subject, Chapter.subject_id == Subject.id)
        .filter(
            Quiz.created_at >= first_day_prev_month,
            Quiz.created_at <= last_day_prev_month
        )
        .all()
    )

    # Get all active users
    users = User.query.filter(User.active == True).all()
    if not users:
        app.logger.info("No active users found for monthly report.")
        return 0

    # Prepare HTML email content
    sent_count = 0
    for user in users:
        
        if user.email == 'admin@quizmaster.com':
            app.logger.info(f"Skipping monthly report for {user.email}")
            continue

        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
                    .header {{ background-color: #007bff; color: white; padding: 10px; text-align: center; }}
                    .content {{ background-color: white; padding: 20px; border-radius: 5px; }}
                    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                    .footer {{ text-align: center; font-size: 12px; color: #777; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>QuizMaster Monthly Activity Report</h2>
                    </div>
                    <div class="content">
                        <p>Hello {user.full_name or user.email},</p>
                        <p>Your activity report for {first_day_prev_month.strftime('%B %Y')} is here!</p>
                        <ul>
                            <li><strong>Account Status:</strong> Active</li>
                            <li><strong>New Quizzes Added:</strong> {len(new_quizzes)}</li>
                        </ul>
                        {'<h3>New Quizzes This Month</h3>' if new_quizzes else '<p>No new quizzes were added this month.</p>'}
                        {'' if not new_quizzes else '''
                        <table>
                            <tr>
                                <th>Quiz ID</th>
                                <th>Subject</th>
                                <th>Chapter</th>
                                <th>Created Date</th>
                            </tr>
                            ''' + ''.join(f'''
                            <tr>
                                <td>{q.id}</td>
                                <td>{q.chapter.subject.name}</td>
                                <td>{q.chapter.name}</td>
                                <td>{q.created_at.strftime('%Y-%m-%d')}</td>
                            </tr>
                            ''' for q in new_quizzes) + '</table>'}
                        <p>Explore these quizzes and test your knowledge!</p>
                        <p><a href="http://localhost:5000/user/dashboard" style="color: #007bff;">Go to Dashboard</a></p>
                    </div>
                    <div class="footer">
                        <p>QuizMaster Team &copy; 2025</p>
                    </div>
                </div>
            </body>
        </html>
        """

        # Send email
        msg = Message(
            subject=f"QuizMaster Monthly Activity Report - {first_day_prev_month.strftime('%B %Y')}",
            recipients=[user.email],
            html=html_content
        )
        try:
            mail.send(msg)
            app.logger.info(f"Sent monthly report to {user.email}")
            sent_count += 1
        except Exception as e:
            app.logger.error(f"Failed to send monthly report to {user.email}: {str(e)}")

    return sent_count


