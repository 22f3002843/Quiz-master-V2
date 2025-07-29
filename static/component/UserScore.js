export default {
  name: "UserScore",
  data() {
    return {
      scores: [],
      loading: true,
      error: null,
      isExporting: false
    };
  },
  created() {
    this.loadScores();
  },
  watch: {
    '$route'(to, from) {
      if (to.path === '/user/score') {
        this.loadScores();
      }
    }
  },
  methods: {
    async loadScores() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch("/api/user/score", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok) {
          this.scores = data.scores || [];
        } else {
          this.error = data.message || "Failed to load scores.";
          this.showToast("Error", this.error, "danger");
        }
      } catch (err) {
        console.error("Error loading scores:", err);
        this.error = err.message || "An error occurred while loading scores.";
        this.showToast("Error", this.error, "danger");
      } finally {
        this.loading = false;
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
        this.showToast("Error", "Failed to export CSV.", "danger");
      } finally {
        this.isExporting = false;
      }
    },
    showToast(title, message, variant = 'success') {
      alert(`${title}: ${message}`);
    },
    viewQuiz(quiz) {
      this.$router.push(`/user_view_quiz/${quiz.quiz_id}`);
    },
    goToDashboard() {
      this.$router.push("/user/dashboard");
    },
    goToUpcomingQuizzes() {
      this.$router.push("/user/upcoming_quizzes");
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
                <a class="nav-link active" href="#" @click.prevent="goToScore">
                  <i class="fas fa-star me-1"></i> Score
                </a>
              </li>
            </ul>
            <div class="d-flex align-items-center">
              <button class="btn btn-outline-light me-2" :disabled="isExporting" @click="exportQuizData">
                <i class="fas fa-download me-1"></i> {{ isExporting ? 'Exporting...' : 'Export Quiz Data' }}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="container-fluid py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-10">
            <h2 class="mb-4 text-primary">Your Quiz Scores</h2>
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading scores...</p>
            </div>
            <div v-else>
              <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
              <div v-else class="card shadow border-0">
                <div class="card-header py-3 bg-success text-white">
                  <h5 
                    class="m-0 fw-bold" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    title="Your quiz attempt scores"
                  >
                    <i class="fas fa-star me-1"></i> Quiz Scores ({{ scores.length }})
                  </h5>
                </div>
                <div class="card-body">
                  <div v-if="scores.length">
                    <div class="table-responsive">
                      <table class="table table-bordered table-hover">
                        <thead class="table-light">
                          <tr>
                            <th>Quiz ID</th>
                            <th>Score</th>
                            <th>Score (%)</th>
                            <th>Attempt Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="score in scores" :key="score.id">
                            <td>{{ score.quiz_id }}</td>
                            <td>{{ score.total_scored }}</td>
                            <td>{{ score.score_percentage }}%</td>
                            <td>{{ score.time_stamp_of_attempt || 'N/A' }}</td>
                            <td>
                              <div class="d-flex gap-2">
                                <button 
                                  @click="viewQuiz(score)" 
                                  class="btn btn-sm btn-outline-secondary" 
                                  data-bs-toggle="tooltip" 
                                  data-bs-placement="top" 
                                  title="View quiz details"
                                >
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="alert alert-info" role="alert">
                    No scores available.
                  </div>
                  <div class="d-flex gap-2 mt-3">
                    <button 
                      class="btn btn-sm btn-success" 
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
