export default {
  name: "UserViewQuiz",
  data() {
    return {
      quiz: null,
      numQuestions: 0,
      loading: true,
      error: null
    };
  },
  created() {
    this.loadQuiz();
  },
  watch: {
    '$route'(to, from) {
      if (to.path.startsWith('/user_view_quiz/') && to.params.quiz_id !== from.params.quiz_id) {
        this.loadQuiz();
      }
    }
  },
  methods: {
    async loadQuiz() {
      this.loading = true;
      this.error = null;
      const quizId = this.$route.params.quiz_id;
      try {
        const response = await fetch(`/api/user_view_quiz/${quizId}`, {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok) {
          this.quiz = data.quiz || {};
          this.numQuestions = data.num_questions || 0;
        } else {
          this.error = data.message || "Failed to load quiz details.";
          this.showToast("Error", this.error, "danger");
        }
      } catch (err) {
        console.error("Error loading quiz details:", err);
        this.error = err.message || "An error occurred while loading quiz details.";
        this.showToast("Error", this.error, "danger");
      } finally {
        this.loading = false;
      }
    },
    showToast(title, message, variant = 'success') {
      alert(`${title}: ${message}`);
    },
    attemptQuiz() {
      if (this.quiz) {
        this.$router.push(`/user/attempt_quiz/${this.quiz.id}/attempt`);
      }
    },
    goToDashboard() {
      this.$router.push("/user/dashboard");
    },
    goToUpcomingQuizzes() {
      this.$router.push("/upcoming_quizzes");
    },
    goToSummary() {
      this.$router.push("/user/summary");
    },
    goToScore() {
      this.$router.push("/user/score");
    }
  },
  mounted() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
      new bootstrap.Tooltip(element);
    });
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
                <a class="nav-link" href="#" @click.prevent="goToDashboard">
                  <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="goToUpcomingQuizzes">
                  <i class="fas fa-calendar-alt me-1"></i> Upcoming Quizzes
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="goToSummary">
                  <i class="fas fa-chart-pie me-1"></i> Summary
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="goToScore">
                  <i class="fas fa-star me-1"></i> Score
                </a>
              </li>
            </ul>
            <form class="d-flex" @submit.prevent>
              <div class="input-group">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Search quizzes..."
                  aria-label="Search"
                  disabled
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Search functionality not available on this page"
                />
                <button 
                  class="btn btn-outline-light" 
                  type="submit" 
                  data-bs-toggle="tooltip" 
                  data-bs-placement="top" 
                  title="Search not available"
                >
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="container-fluid py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-10">
            <h2 class="mb-4 text-primary">Quiz Details</h2>
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading quiz details...</p>
            </div>
            <div v-else>
              <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
              <div v-else class="card shadow border-0">
                <div class="card-header py-3 bg-secondary text-white">
                  <h5 
                    class="m-0 fw-bold" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    title="Details of the selected quiz"
                  >
                    <i class="fas fa-question-circle me-1"></i> Quiz ID: {{ quiz.id }}
                  </h5>
                </div>
                <div class="card-body">
                  <p><strong>Number of Questions:</strong> {{ numQuestions }}</p>
                  <p><strong>Date:</strong> {{ quiz.date_of_quiz || 'N/A' }}</p>
                  <p><strong>Start Time:</strong> {{ quiz.start_time || 'N/A' }}</p>
                  <p><strong>Duration:</strong> {{ quiz.time_duration || 'N/A' }} mins</p>
                  <p><strong>Remarks:</strong> {{ quiz.remarks || 'N/A' }}</p>
                  <div class="d-flex gap-2 mt-3">
                    <button 
                      class="btn btn-sm btn-warning" 
                      @click="attemptQuiz" 
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      title="Start this quiz"
                    >
                      Attempt Quiz
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-secondary" 
                      @click="goToDashboard" 
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      title="Return to dashboard"
                    >
                      Back to Dashboard
                    </button>
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