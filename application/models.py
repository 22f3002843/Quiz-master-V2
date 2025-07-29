
from flask_sqlalchemy import SQLAlchemy  
from flask_security import UserMixin , RoleMixin
from .database import db 
from datetime import datetime



class User(db.Model, UserMixin): #user(Table name ) 

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    full_name = db.Column(db.String(255))
    qualification = db.Column(db.String(255))
    dob = db.Column(db.String(255))
    fs_uniquifier = db.Column(db.String,unique = True, nullable=False)# Encrypted version of email and password --> Token  .
    active = db.Column(db.Boolean, nullable=False)
    roles = db.relationship('Role', backref='users', secondary='user_roles',cascade="all")


class Role(db.Model,RoleMixin): # role (Table name )
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String)
    
class UserRoles(db.Model): # user_roles (Table name )
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))
    
class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    chapters = db.relationship('Chapter', backref='subject', lazy=True,cascade="all, delete-orphan")

class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100),unique=True, nullable=False)
    description = db.Column(db.Text)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id', ondelete="CASCADE"), nullable=False)
    quizzes = db.relationship('Quiz', backref='chapter', lazy=True,cascade="all, delete-orphan")

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id', ondelete="CASCADE"), nullable=False)
    date_of_quiz = db.Column(db.DateTime, default=datetime.utcnow)  # Stores full date and time of quiz
    start_time = db.Column(db.Time, nullable=True)
    time_duration = db.Column(db.Time(5))  # Format  is HH:MM
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship('Question', backref='quiz', lazy=True,cascade="all, delete-orphan")

    scores = db.relationship('Score', backref='quiz', lazy=True,cascade="all, delete-orphan")

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id', ondelete="CASCADE"), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(255))
    option2 = db.Column(db.String(255))
    option3 = db.Column(db.String(255))
    option4 = db.Column(db.String(255))
    correct_option = db.Column(db.Integer)  # option can b 1,2,3,4

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id', ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"), nullable=False)
    time_stamp_of_attempt = db.Column(db.DateTime, default=datetime.utcnow)  # Timestamp of the quiz attempt
    total_scored = db.Column(db.Integer)
    # Relationship to access user details .....
    user = db.relationship('User', backref=db.backref('scores', lazy=True))
