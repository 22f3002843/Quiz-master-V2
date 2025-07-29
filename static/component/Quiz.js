export default {
  name: "QuizComponent",
  data() {
    return {
      quizzes: [],
      chapters: [],
      newQuiz: {
        chapter_id: "",
        date_of_quiz: "",
        start_time: "",
        time_duration: "",
        remarks: ""
      },
      editingQuiz: null,
      updatedQuiz: {
        chapter_id: "",
        date_of_quiz: "",
        start_time: "",
        time_duration: "",
        remarks: ""
      }
    };
  },
  created() {
    this.loadQuizzes();
    this.loadChapters();
  },
  methods: {
    async loadQuizzes() {
      try {
        const response = await fetch("/api/admin/quizzes", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok && data.quizzes) {
          this.quizzes = data.quizzes;
        } else {
          alert(data.message || "Failed to load quizzes.");
        }
      } catch (error) {
        console.error("Error loading quizzes:", error);
      }
    },
    async loadChapters() {
      try {
        const response = await fetch("/api/admin/chapters", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok && data.chapters) {
          this.chapters = data.chapters;
        } else {
          alert(data.message || "Failed to load chapters.");
        }
      } catch (error) {
        console.error("Error loading chapters:", error);
      }
    },
    async addQuiz() {
      if (!this.newQuiz.chapter_id) {
        alert("Please select a chapter.");
        return;
      }
      try {
        const response = await fetch("/api/admin/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newQuiz)
        });
        const data = await response.json();
        if (response.ok) {
          this.quizzes.push(data);
          this.newQuiz = { chapter_id: "", date_of_quiz: "", start_time: "", time_duration: "", remarks: "" };
        } else {
          alert(data.message || "Failed to add quiz.");
        }
      } catch (error) {
        console.error("Error adding quiz:", error);
      }
    },
    startEditing(quiz) {
      this.editingQuiz = quiz;
      this.updatedQuiz = { 
        chapter_id: quiz.chapter_id, 
        date_of_quiz: quiz.date_of_quiz, 
        start_time: quiz.start_time, 
        time_duration: quiz.time_duration, 
        remarks: quiz.remarks 
      };
    },
    cancelEditing() {
      this.editingQuiz = null;
      this.updatedQuiz = { chapter_id: "", date_of_quiz: "", start_time: "", time_duration: "", remarks: "" };
    },
    async updateQuiz(quiz) {
      try {
        const response = await fetch(`/api/admin/quizzes/${quiz.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.updatedQuiz)
        });
        const data = await response.json();
        if (response.ok) {
          const index = this.quizzes.findIndex(q => q.id === quiz.id);
          if (index !== -1) {
            this.quizzes.splice(index, 1, data);
          }
          this.cancelEditing();
        } else {
          alert(data.message || "Failed to update quiz.");
        }
      } catch (error) {
        console.error("Error updating quiz:", error);
      }
    },
    async deleteQuiz(quiz) {
      if (confirm("Are you sure you want to delete this quiz?")) {
        try {
          const response = await fetch(`/api/admin/quizzes/${quiz.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          const data = await response.json();
          if (response.ok) {
            this.quizzes = this.quizzes.filter(q => q.id !== quiz.id);
          } else {
            alert(data.message || "Failed to delete quiz.");
          }
        } catch (error) {
          console.error("Error deleting quiz:", error);
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
    addQuestion() {
      this.$router.push("/admin/questions");
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
            <i class="fas fa-question-circle me-2"></i>Quiz Management
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
                <a class="nav-link active" href="#" @click.prevent>
                  <i class="fas fa-question-circle me-1"></i> Add Quiz
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
            <div class="card shadow-sm border-0">
              <div class="card-body">
                <div class="row">
                  <!-- Form to Add New Quiz -->
                  <div class="col-12 col-md-4 border-end pe-md-4">
                    <h4 class="text-muted mb-4">Add New Quiz</h4>
                    <form @submit.prevent="addQuiz" class="p-2 bg-light rounded">
                      <div class="mb-3">
                        <label for="chapterSelect" class="form-label fw-bold">Select Chapter</label>
                        <select v-model="newQuiz.chapter_id" id="chapterSelect" class="form-select" required>
                          <option disabled value="">Select Chapter</option>
                          <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                            {{ chapter.name }}
                          </option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label for="dateOfQuiz" class="form-label fw-bold">Date of Quiz</label>
                        <input type="date" v-model="newQuiz.date_of_quiz" id="dateOfQuiz" class="form-control" required />
                      </div>
                      <div class="mb-3">
                        <label for="startTime" class="form-label fw-bold">Start Time</label>
                        <input type="time" v-model="newQuiz.start_time" id="startTime" class="form-control" />
                      </div>
                      <div class="mb-3">
                        <label for="timeDuration" class="form-label fw-bold">Time Duration (minutes)</label>
                        <input type="text" v-model="newQuiz.time_duration" id="timeDuration" class="form-control" required />
                      </div>
                      <div class="mb-3">
                        <label for="remarks" class="form-label fw-bold">Remarks</label>
                        <textarea v-model="newQuiz.remarks" id="remarks" class="form-control" rows="3" placeholder="Enter remarks"></textarea>
                      </div>
                      <button type="submit" class="btn btn-success w-100">
                        <i class="fas fa-plus me-1"></i> Add Quiz
                      </button>
                    </form>
                  </div>

                  <!-- List of Quizzes -->
                  <div class="col-12 col-md-8 ps-md-4">
                    <h4 class="text-muted mb-4">Existing Quizzes</h4>
                    <div class="list-group">
                      <div v-for="quiz in quizzes" :key="quiz.id" class="list-group-item list-group-item-action p-3 mb-2 rounded shadow-sm">
                        <div v-if="editingQuiz && editingQuiz.id === quiz.id">
                          <div class="mb-3">
                            <label for="editChapterSelect" class="form-label fw-bold">Select Chapter</label>
                            <select v-model="updatedQuiz.chapter_id" id="editChapterSelect" class="form-select" required>
                              <option disabled value="">Select Chapter</option>
                              <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                                {{ chapter.name }}
                              </option>
                            </select>
                          </div>
                          <div class="mb-3">
                            <label for="editDateOfQuiz" class="form-label fw-bold">Date of Quiz</label>
                            <input type="date" v-model="updatedQuiz.date_of_quiz" id="editDateOfQuiz" class="form-control" required />
                          </div>
                          <div class="mb-3">
                            <label for="editStartTime" class="form-label fw-bold">Start Time</label>
                            <input type="time" v-model="updatedQuiz.start_time" id="editStartTime" class="form-control" />
                          </div>
                          <div class="mb-3">
                            <label for="editTimeDuration" class="form-label fw-bold">Time Duration (minutes)</label>
                            <input type="text" v-model="updatedQuiz.time_duration" id="editTimeDuration" class="form-control" required />
                          </div>
                          <div class="mb-3">
                            <label for="editRemarks" class="form-label fw-bold">Remarks</label>
                            <textarea v-model="updatedQuiz.remarks" id="editRemarks" class="form-control" rows="3" placeholder="Enter remarks"></textarea>
                          </div>
                          <div class="d-flex gap-2">
                            <button class="btn btn-success flex-grow-1" @click="updateQuiz(quiz)">
                              <i class="fas fa-save me-1"></i> Save
                            </button>
                            <button class="btn btn-outline-secondary flex-grow-1" @click="cancelEditing">
                              <i class="fas fa-times me-1"></i> Cancel
                            </button>
                          </div>
                        </div>
                        <div v-else class="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 class="mb-1 fw-bold">Quiz ID: {{ quiz.id }}</h5>
                            <p class="mb-1 text-muted"><strong>Chapter:</strong> {{ chapters.find(c => c.id === quiz.chapter_id)?.name || 'Unknown' }}</p>
                            <p class="mb-1 text-muted"><strong>Date:</strong> {{ quiz.date_of_quiz }}</p>
                            <p class="mb-1 text-muted"><strong>Start Time:</strong> {{ quiz.start_time || 'N/A' }}</p>
                            <p class="mb-1 text-muted"><strong>Duration:</strong> {{ quiz.time_duration }} minutes</p>
                            <p class="mb-0 text-muted"><strong>Remarks:</strong> {{ quiz.remarks || 'None' }}</p>
                          </div>
                          <div class="btn-group">
                            <button class="btn btn-outline-warning" @click="startEditing(quiz)">
                              <i class="fas fa-edit me-1"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger" @click="deleteQuiz(quiz)">
                              <i class="fas fa-trash me-1"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <div v-if="!quizzes.length" class="list-group-item text-center text-muted p-4">
                        No quizzes available
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};