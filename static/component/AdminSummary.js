export default {
  name: "AdminSummary",
  data() {
    return {
      subjectLabelsBar: [],
      subjectTopScoresData: [],
      subjectLabelsPie: [],
      subjectAttemptsData: [],
      topPerformers: [],
      loading: true,
      error: null,
    };
  },
  async mounted() {
    try {
      await this.loadSummary();
      this.$nextTick(() => {
        this.renderBarChart();
        this.renderPieChart();
        this.renderTopPerformersChart();
      });
    } catch (err) {
      console.error("Error during component mount:", err);
    }
  },
  methods: {
    async loadSummary() {
      try {
        const response = await fetch("/api/admin/summary", {
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (response.ok) {
          this.subjectLabelsBar = data.subject_labels_bar || [];
          this.subjectTopScoresData = data.subject_top_scores_data || [];
          this.subjectLabelsPie = data.subject_labels_pie || [];
          this.subjectAttemptsData = data.subject_attempts_data || [];
          this.topPerformers = data.top_performers || [];
        } else {
          this.error = data.message || "Failed to load summary data.";
        }
      } catch (err) {
        console.error("Error loading summary data:", err);
        this.error = err.message || "An error occurred while loading summary data.";
      } finally {
        this.loading = false;
      }
    },
    renderBarChart() {
      if (this.$refs.barChart) {
        const ctxBar = this.$refs.barChart.getContext("2d");
        new Chart(ctxBar, {
          type: "bar",
          data: {
            labels: this.subjectLabelsBar.length ? this.subjectLabelsBar : ["No Data"],
            datasets: [
              {
                label: "Top Scores",
                data: this.subjectTopScoresData.length ? this.subjectTopScoresData : [1],
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Subject-wise Top Scores",
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 },
              },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Score' } },
              x: { title: { display: true, text: 'Subjects' } },
            },
          },
        });
      } else {
        console.error("Bar chart canvas not found.");
      }
    },
    renderPieChart() {
      if (this.$refs.pieChart) {
        const ctxPie = this.$refs.pieChart.getContext("2d");
        new Chart(ctxPie, {
          type: "pie",
          data: {
            labels: this.subjectLabelsPie.length ? this.subjectLabelsPie : ["No Data"],
            datasets: [
              {
                label: "Attempts",
                data: this.subjectAttemptsData.length ? this.subjectAttemptsData : [1],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.6)",
                  "rgba(54, 162, 235, 0.6)",
                  "rgba(255, 206, 86, 0.6)",
                  "rgba(75, 192, 192, 0.6)",
                  "rgba(153, 102, 255, 0.6)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                  "rgba(153, 102, 255, 1)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Subject-wise Attempts",
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 },
              },
              legend: {
                position: 'right',
              },
            },
          },
        });
      } else {
        console.error("Pie chart canvas not found.");
      }
    },
    renderTopPerformersChart() {
      if (this.$refs.topPerformersChart) {
        const ctxTop = this.$refs.topPerformersChart.getContext("2d");
        const labels = this.topPerformers.map((tp) => tp.full_name);
        const totalScores = this.topPerformers.map((tp) => tp.total_score);
        const attempts = this.topPerformers.map((tp) => tp.attempts);
        new Chart(ctxTop, {
          type: "bar",
          data: {
            labels: labels.length ? labels : ["No Data"],
            datasets: [
              {
                label: "Total Score",
                data: totalScores.length ? totalScores : [1],
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
              {
                label: "Attempts",
                data: attempts.length ? attempts : [1],
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Top Performers",
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 },
              },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Value' } },
              x: { title: { display: true, text: 'Performers' } },
            },
          },
        });
      } else {
        console.error("Top performers chart canvas not found.");
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
    addQuestion() {
      this.$router.push("/admin/questions");
    },
    manageUsers() {
      this.$router.push("/admin/users");
    },
  },
  template: `
    <div>
      <!-- Navigation Bar -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <i class="fas fa-chart-pie me-2"></i>Admin Summary
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
                <a class="nav-link" href="#" @click.prevent="addQuiz">
                  <i class="fas fa-question-circle me-1"></i> Add Quiz
                </a>
              </li>
            
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="manageUsers">
                  <i class="fas fa-users me-1"></i> Manage Users
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="container-fluid py-4">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading summary data...</p>
        </div>

        <!-- Error Handling -->
        <div v-else>
          <div v-if="error" class="alert alert-danger text-center">{{ error }}</div>
          
          <!-- Charts Section -->
          <div v-else>
            <div class="row">
              <!-- Bar Chart: Subject-wise Top Scores -->
              <div class="col-lg-6 mb-4">
                <div class="card shadow-sm h-100">
                  <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">
                      <i class="fas fa-chart-bar me-1"></i> Subject-wise Top Scores
                    </h6>
                  </div>
                  <div class="card-body">
                    <canvas ref="barChart"></canvas>
                  </div>
                </div>
              </div>
              
              <!-- Pie Chart: Subject-wise Attempts -->
              <div class="col-lg-6 mb-4">
                <div class="card shadow-sm h-100">
                  <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">
                      <i class="fas fa-chart-pie me-1"></i> Subject-wise Attempts
                    </h6>
                  </div>
                  <div class="card-body">
                    <canvas ref="pieChart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bar Chart: Top Performers -->
            <div class="row">
              <div class="col-lg-12 mb-4">
                <div class="card shadow-sm h-100">
                  <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">
                      <i class="fas fa-star me-1"></i> Top Performers
                    </h6>
                  </div>
                  <div class="card-body">
                    <canvas ref="topPerformersChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};