export default {
  name: "UpcomingQuizzes",
  data() {
    return {
      upcomingQuizzes: []
    };
  },
  created() {
    this.loadUpcomingQuizzes();
  },
  watch: {
    '$route'(to, from) {
      if (to.path === '/upcoming_quizzes') {
        this.loadUpcomingQuizzes();
      }
    }
  },
  methods: {
    async loadUpcomingQuizzes() {
      try {
        const response = await fetch("/api/user/upcoming_quizzes", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok && data.upcoming_quizzes) {
          this.upcomingQuizzes = data.upcoming_quizzes;
        } else {
          this.showToast("Error", data.message || "Failed to load upcoming quizzes", "danger");
        }
      } catch (error) {
        console.error("Error loading upcoming quizzes:", error);
        this.showToast("Error", "Failed to load upcoming quizzes", "danger");
      }
    },
    showToast(title, message, variant = 'success') {
      alert(`${title}: ${message}`);
    },
    attemptQuiz(quiz) {
      if (confirm("Are you sure you want to start this quiz?")) {
        this.$router.push({
          path: `/user/attempt_quiz/${quiz.id}/attempt`,
          query: { subjectId: quiz.chapter?.subject?.id, chapterId: quiz.chapter_id }
        });
      }
    },
    viewQuiz(quiz) {
      this.$router.push({
        path: `/user_view_quiz/${quiz.id}`,
        query: { subjectId: quiz.chapter?.subject?.id, chapterId: quiz.chapter_id }
      });
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
            <i class="fas fa-tachometer-alt me-2"></i>Upcoming Quizzes
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="$router.push('/user/dashboard')">
                  <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" href="#" @click.prevent="$router.push('/user/upcoming_quizzes')">
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
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="container-fluid py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-10">
            <!-- Upcoming Quizzes Card -->
            <div class="card shadow mb-4 border-0">
              <div class="card-header py-3 bg-warning text-white">
                <h5 class="m-0 fw-bold">
                  <i class="fas fa-calendar-alt me-1"></i> Upcoming Quizzes ({{ upcomingQuizzes.length }})
                </h5>
              </div>
              <div class="card-body">
                <div v-if="upcomingQuizzes.length">
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
                          <th>Remarks</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="quiz in upcomingQuizzes" :key="quiz.id">
                          <td>{{ quiz.id }}</td>
                          <td>{{ quiz.chapter?.subject?.name || 'N/A' }}</td>
                          <td>{{ quiz.chapter?.name || 'N/A' }}</td>
                          <td>{{ quiz.date_of_quiz || 'N/A' }}</td>
                          <td>{{ quiz.start_time || 'N/A' }}</td>
                          <td>{{ quiz.time_duration }} mins</td>
                          <td>{{ quiz.remarks || 'N/A' }}</td>
                          <td>
                            <div class="btn-group">
                              <button 
                                @click="attemptQuiz(quiz)" 
                                class="btn btn-sm btn-info" 
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Start this quiz"
                              >
                                Attempt
                              </button>
                              <button 
                                @click="viewQuiz(quiz)" 
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
                  No upcoming quizzes available.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};