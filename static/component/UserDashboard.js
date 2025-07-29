export default {
  name: "UserDashboard",
  data() {
    return {
      upcomingQuizzes: [],
      allQuizzes: [],
      subjectResults: [],
      chapterResults: [],
      quizResults: [],
      q: "",
      isExporting: false
    };
  },
  created() {
    this.loadDashboard();
  },
  methods: {
    async loadDashboard() {
      let url = this.q.trim() 
        ? "/api/user/search?q=" + encodeURIComponent(this.q.trim())
        : "/api/user/dashboard";
      console.log("Loading dashboard data from:", url);
      try {
        const response = await fetch(url, {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok) {
          if (this.q.trim()) {
            this.subjectResults = data.subject_results || [];
            this.chapterResults = data.chapter_results || [];
            this.quizResults = data.quiz_results || [];
            this.upcomingQuizzes = [];
            this.allQuizzes = [];
          } else {
            this.upcomingQuizzes = data.upcoming_quizzes || [];
            this.allQuizzes = data.all_quizzes || [];
            this.subjectResults = [];
            this.chapterResults = [];
            this.quizResults = [];
          }
          console.log("Dashboard data loaded:", data);
        } else {
          alert(data.message || "Failed to load dashboard data.");
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        alert("Error: Failed to load dashboard data.");
      }
    },
    async exportQuizData() {
      this.isExporting = true;
      try {
        const response = await fetch('/api/user/export_quiz_data', {
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch CSV data');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quiz_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exporting CSV:", error);
        alert("Error: Failed to export CSV.");
      } finally {
        this.isExporting = false;
      }
    },
    search() {
      console.log("Search query:", this.q);
      this.loadDashboard();
    },
    attemptQuiz(quizId) {
      this.$router.push(`/user/attempt_quiz/${quizId}/attempt`);
    },
    viewQuiz(quizId) {
      this.$router.push(`/user_view_quiz/${quizId}`);
    }
  },
  computed: {
    currentUserFullName() {
      return localStorage.getItem("full_name") || "User";
    }
  },
  template: `
    <div>
      <!-- Navigation Bar -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <i class="fas fa-tachometer-alt me-2"></i>User Dashboard
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link active" href="#" @click.prevent="$router.push('/user/dashboard')">
                  <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="$router.push('/user/upcoming_quizzes')">
                  <i class="fas fa-calendar-alt me-1"></i> Upcoming Quizzes
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="$router.push('/user/summary')">
                  <i class="fas fa-chart-pie me-1"></i> View Summary
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="$router.push('/user/score')">
                  <i class="fas fa-star me-1"></i> Score
                </a>
              </li>
            </ul>
            <div class="d-flex align-items-center">
              <button class="btn btn-outline-light me-2" :disabled="isExporting" @click="exportQuizData">
                <i class="fas fa-download me-1"></i> {{ isExporting ? 'Exporting...' : 'Export Quiz Data' }}
              </button>
              <form class="d-flex" @submit.prevent="search">
                <div class="input-group">
                  <input
                    type="text"
                    v-model="q"
                    class="form-control"
                    placeholder="Search subjects, chapters, quiz id..."
                    aria-label="Search"
                  />
                  <button class="btn btn-outline-light" type="submit">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="container-fluid py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-10">
            <!-- Welcome Card -->
            <div class="card shadow mb-4 border-0">
              <div class="card-header py-3 bg-success text-white d-flex justify-content-between align-items-center">
                <h3 class="m-0 fw-bold">Welcome, {{ currentUserFullName }}!</h3>
              </div>
              <div class="card-body">
                <p class="card-text">
                  Welcome to your dashboard! Here you can attempt quizzes, view upcoming quizzes,
                  search for subjects, chapters, and also access your scores and view your summary.
                </p>
              </div>
            </div>

            <!-- Search Results -->
            <div v-if="q.trim()">
              <h4 class="mb-3">Search Results for "{{ q }}"</h4>

              <!-- Results by Subjects -->
              <div class="card shadow mb-4 border-0" v-if="subjectResults.length">
                <div class="card-header py-3 bg-primary text-white">
                  <h5 class="m-0 fw-bold">
                    <i class="fas fa-book me-1"></i> By Subjects ({{ subjectResults.length }})
                  </h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Subject</th>
                          <th>Chapter</th>
                          <th>Date</th>
                          <th>Start Time</th>
                          <th>Duration</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="quiz in subjectResults" :key="quiz.id">
                          <td>{{ quiz.chapter.subject.name }}</td>
                          <td>{{ quiz.chapter.name }}</td>
                          <td>{{ quiz.date_of_quiz || 'N/A' }}</td>
                          <td>{{ quiz.start_time || 'N/A' }}</td>
                          <td>{{ quiz.time_duration || 'N/A' }}</td>
                          <td>
                            <div class="btn-group">
                              <button class="btn btn-sm btn-primary" @click="attemptQuiz(quiz.id)">Attempt</button>
                              <button class="btn btn-sm btn-outline-secondary" @click="viewQuiz(quiz.id)">View</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Results by Chapters -->
              <div class="card shadow mb-4 border-0" v-if="chapterResults.length">
                <div class="card-header py-3 bg-primary text-white">
                  <h5 class="m-0 fw-bold">
                    <i class="fas fa-file-alt me-1"></i> By Chapters ({{ chapterResults.length }})
                  </h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Chapter</th>
                          <th>Date</th>
                          <th>Start Time</th>
                          <th>Duration</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="quiz in chapterResults" :key="quiz.id">
                          <td>{{ quiz.chapter.name }}</td>
                          <td>{{ quiz.date_of_quiz || 'N/A' }}</td>
                          <td>{{ quiz.start_time || 'N/A' }}</td>
                          <td>{{ quiz.time_duration || 'N/A' }}</td>
                          <td>
                            <div class="btn-group">
                              <button class="btn btn-sm btn-primary" @click="attemptQuiz(quiz.id)">Attempt</button>
                              <button class="btn btn-sm btn-outline-secondary" @click="viewQuiz(quiz.id)">View</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Results by Quizzes -->
              <div class="card shadow mb-4 border-0" v-if="quizResults.length">
                <div class="card-header py-3 bg-primary text-white">
                  <h5 class="m-0 fw-bold">
                    <i class="fas fa-question-circle me-1"></i> By Quizzes ({{ quizResults.length }})
                  </h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Quiz ID</th>
                          <th>Subject</th>
                          <th>Chapter</th>
                          <th>Date</th>
                          <th>Start Time</th>
                          <th>Duration</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="quiz in quizResults" :key="quiz.id">
                          <td>{{ quiz.id }}</td>
                          <td>{{ quiz.chapter.subject.name }}</td>
                          <td>{{ quiz.chapter.name }}</td>
                          <td>{{ quiz.date_of_quiz || 'N/A' }}</td>
                          <td>{{ quiz.start_time || 'N/A' }}</td>
                          <td>{{ quiz.time_duration || 'N/A' }}</td>
                          <td>
                            <div class="btn-group">
                              <button class="btn btn-sm btn-primary" @click="attemptQuiz(quiz.id)">Attempt</button>
                              <button class="btn btn-sm btn-outline-secondary" @click="viewQuiz(quiz.id)">View</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- No Results -->
              <div v-if="!subjectResults.length && !chapterResults.length && !quizResults.length">
                <div class="alert alert-warning" role="alert">
                  No results found for "{{ q }}".
                </div>
              </div>
            </div>

            <!-- All Quizzes -->
            <div v-else>
              <div class="card shadow mb-4 border-0">
                <div class="card-header py-3 bg-warning text-white">
                  <h5 class="m-0 fw-bold">
                    <i class="fas fa-question-circle me-1"></i> All Quizzes ({{ allQuizzes.length }})
                  </h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Quiz ID</th>
                          <th>Subject</th>
                          <th>Chapter</th>
                          <th>Date</th>
                          <th>Start Time</th>
                          <th>Duration</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="quiz in allQuizzes" :key="quiz.id">
                          <td>{{ quiz.id }}</td>
                          <td>{{ quiz.chapter.subject.name }}</td>
                          <td>{{ quiz.chapter.name }}</td>
                          <td>{{ quiz.date_of_quiz || 'N/A' }}</td>
                          <td>{{ quiz.start_time || 'N/A' }}</td>
                          <td>{{ quiz.time_duration || 'N/A' }}</td>
                          <td>
                            <div class="btn-group">
                              <button class="btn btn-sm btn-primary" @click="attemptQuiz(quiz.id)">Attempt</button>
                              <button class="btn btn-sm btn-outline-secondary" @click="viewQuiz(quiz.id)">View</button>
                            </div>
                          </td>
                        </tr>
                        <tr v-if="!allQuizzes.length">
                          <td colspan="7" class="text-center text-muted">No quizzes available</td>
                        </tr>
                      </tbody>
                    </table>
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