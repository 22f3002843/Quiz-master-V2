export default {
  name: "QuestionComponent",
  data() {
    return {
      questions: [],
      newQuestion: {
        quiz_id: "",
        question_statement: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correct_option: 1,
      },
      editingQuestion: null,
      updatedQuestion: {
        quiz_id: "",
        question_statement: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correct_option: 1,
      },
    };
  },
  created() {
    this.loadQuestions();
  },
  methods: {
    async loadQuestions() {
      try {
        const response = await fetch("/api/admin/questions", {
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (response.ok && data.questions) {
          this.questions = data.questions;
        } else {
          alert(data.message || "Failed to load questions.");
        }
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    },
    async addQuestion() {
      if (
        !this.newQuestion.quiz_id ||
        !this.newQuestion.question_statement ||
        this.newQuestion.correct_option === ""
      ) {
        alert("Quiz ID, question statement, and correct option are required.");
        return;
      }
      try {
        const response = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newQuestion),
        });
        const data = await response.json();
        if (response.ok) {
          this.questions.push(data);
          this.newQuestion = {
            quiz_id: "",
            question_statement: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            correct_option: 1,
          };
        } else {
          alert(data.message || "Failed to add question.");
        }
      } catch (error) {
        console.error("Error adding question:", error);
      }
    },
    startEditing(question) {
      this.editingQuestion = question;
      this.updatedQuestion = {
        quiz_id: question.quiz_id,
        question_statement: question.question_statement,
        option1: question.option1,
        option2: question.option2,
        option3: question.option3,
        option4: question.option4,
        correct_option: question.correct_option,
      };
    },
    cancelEditing() {
      this.editingQuestion = null;
      this.updatedQuestion = {
        quiz_id: "",
        question_statement: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correct_option: 1,
      };
    },
    async updateQuestion(question) {
      try {
        const response = await fetch(`/api/admin/questions/${question.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.updatedQuestion),
        });
        const data = await response.json();
        if (response.ok) {
          const index = this.questions.findIndex((q) => q.id === question.id);
          if (index !== -1) {
            this.questions.splice(index, 1, data);
          }
          this.cancelEditing();
        } else {
          alert(data.message || "Failed to update question.");
        }
      } catch (error) {
        console.error("Error updating question:", error);
      }
    },
    async deleteQuestion(question) {
      if (confirm("Are you sure you want to delete this question?")) {
        try {
          const response = await fetch(`/api/admin/questions/${question.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          });
          const data = await response.json();
          if (response.ok) {
            this.questions = this.questions.filter((q) => q.id !== question.id);
          } else {
            alert(data.message || "Failed to delete question.");
          }
        } catch (error) {
          console.error("Error deleting question:", error);
        }
      }
    },
    goToDashboard() {
      this.$router.push("/admin/dashboard");
    },
    addSubject() {
      this.$router.push("/admin/subjects");
    },
    addChapter() {
      this.$router.push("/admin/chapters");
    },
    addQuiz() {
      this.$router.push("/admin/quizzes");
    },
    manageUsers() {
      this.$router.push("/admin/users");
    },
    goToSummary() {
      this.$router.push("/admin/summary");
    },
  },
  template: `
    <div>
      <!-- Navigation Bar -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <i class="fas fa-question me-2"></i>Question Management
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="goToDashboard">
                  <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="addSubject">
                  <i class="fas fa-book me-1"></i> Add Subject
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="addChapter">
                  <i class="fas fa-file-alt me-1"></i> Add Chapter
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="addQuiz">
                  <i class="fas fa-question-circle me-1"></i> Add Quiz
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" href="#" @click.prevent>
                  <i class="fas fa-question me-1"></i> Add Question
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="manageUsers">
                  <i class="fas fa-users me-1"></i> Manage Users
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="goToSummary">
                  <i class="fas fa-chart-pie me-1"></i> Summary
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="container-fluid py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-10">
            <!-- Card for Adding New Question -->
            <div class="card shadow-sm mb-4 border-0">
              <div class="card-header bg-primary text-white">
                <h4 class="mb-0">Add New Question</h4>
              </div>
              <div class="card-body">
                <form @submit.prevent="addQuestion" class="p-2 bg-light rounded">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="quizId" class="form-label fw-bold">Quiz ID</label>
                      <input type="text" v-model="newQuestion.quiz_id" id="quizId" class="form-control" placeholder="Enter quiz ID" required />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="correctOption" class="form-label fw-bold">Correct Option (1-4)</label>
                      <input type="number" v-model.number="newQuestion.correct_option" id="correctOption" class="form-control" min="1" max="4" required />
                    </div>
                  </div>
                  <div class="mb-3">
                    <label for="questionStatement" class="form-label fw-bold">Question Statement</label>
                    <textarea v-model="newQuestion.question_statement" id="questionStatement" class="form-control" rows="3" placeholder="Enter question statement" required></textarea>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="option1" class="form-label fw-bold">Option 1</label>
                      <input type="text" v-model="newQuestion.option1" id="option1" class="form-control" placeholder="Enter option 1" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="option2" class="form-label fw-bold">Option 2</label>
                      <input type="text" v-model="newQuestion.option2" id="option2" class="form-control" placeholder="Enter option 2" />
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="option3" class="form-label fw-bold">Option 3</label>
                      <input type="text" v-model="newQuestion.option3" id="option3" class="form-control" placeholder="Enter option 3" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="option4" class="form-label fw-bold">Option 4</label>
                      <input type="text" v-model="newQuestion.option4" id="option4" class="form-control" placeholder="Enter option 4" />
                    </div>
                  </div>
                  <button type="submit" class="btn btn-warning w-100">
                    <i class="fas fa-plus me-1"></i> Add Question
                  </button>
                </form>
              </div>
            </div>

            <!-- Table for Questions List -->
            <div class="card shadow-sm border-0">
              <div class="card-header bg-success text-white">
                <h4 class="mb-0">Existing Questions</h4>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>Question ID</th>
                        <th>Quiz ID</th>
                        <th>Question Statement</th>
                        <th>Option 1</th>
                        <th>Option 2</th>
                        <th>Option 3</th>
                        <th>Option 4</th>
                        <th>Correct Option</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="question in questions" :key="question.id">
                        <td>{{ question.id }}</td>
                        <td>{{ question.quiz_id }}</td>
                        <td>{{ question.question_statement }}</td>
                        <td>{{ question.option1 || 'N/A' }}</td>
                        <td>{{ question.option2 || 'N/A' }}</td>
                        <td>{{ question.option3 || 'N/A' }}</td>
                        <td>{{ question.option4 || 'N/A' }}</td>
                        <td>{{ question.correct_option }}</td>
                        <td>
                          <div class="btn-group">
                            <button class="btn btn-outline-warning btn-sm" @click="startEditing(question)">
                              <i class="fas fa-edit me-1"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger btn-sm" @click="deleteQuestion(question)">
                              <i class="fas fa-trash me-1"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!questions.length">
                        <td colspan="9" class="text-center text-muted">No questions available</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Edit Form -->
            <div v-if="editingQuestion" class="card shadow-sm mt-4 border-0">
              <div class="card-header bg-primary text-white">
                <h4 class="mb-0">Edit Question (ID: {{ editingQuestion.id }})</h4>
              </div>
              <div class="card-body">
                <form @submit.prevent="updateQuestion(editingQuestion)" class="p-2 bg-light rounded">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="editQuizId" class="form-label fw-bold">Quiz ID</label>
                      <input type="text" v-model="updatedQuestion.quiz_id" id="editQuizId" class="form-control" placeholder="Enter quiz ID" required />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="editCorrectOption" class="form-label fw-bold">Correct Option (1-4)</label>
                      <input type="number" v-model.number="updatedQuestion.correct_option" id="editCorrectOption" class="form-control" min="1" max="4" required />
                    </div>
                  </div>
                  <div class="mb-3">
                    <label for="editQuestionStatement" class="form-label fw-bold">Question Statement</label>
                    <textarea v-model="updatedQuestion.question_statement" id="editQuestionStatement" class="form-control" rows="3" placeholder="Enter question statement" required></textarea>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="editOption1" class="form-label fw-bold">Option 1</label>
                      <input type="text" v-model="updatedQuestion.option1" id="editOption1" class="form-control" placeholder="Enter option 1" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="editOption2" class="form-label fw-bold">Option 2</label>
                      <input type="text" v-model="updatedQuestion.option2" id="editOption2" class="form-control" placeholder="Enter option 2" />
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="editOption3" class="form-label fw-bold">Option 3</label>
                      <input type="text" v-model="updatedQuestion.option3" id="editOption3" class="form-control" placeholder="Enter option 3" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="editOption4" class="form-label fw-bold">Option 4</label>
                      <input type="text" v-model="updatedQuestion.option4" id="editOption4" class="form-control" placeholder="Enter option 4" />
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-success flex-grow-1">
                      <i class="fas fa-save me-1"></i> Save
                    </button>
                    <button type="button" class="btn btn-outline-secondary flex-grow-1" @click="cancelEditing">
                      <i class="fas fa-times me-1"></i> Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};