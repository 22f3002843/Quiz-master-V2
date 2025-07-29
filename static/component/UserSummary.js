export default {
  name: "UserSummary",
  data() {
    return {
      subjectLabels: [],
      subjectData: [],
      pieLabels: [],
      pieData: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    await this.loadSummary();
    this.$nextTick(() => {
      this.renderPieChart();
      this.renderLineChart();
      // Initialize Bootstrap tooltips
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
        new bootstrap.Tooltip(element);
      });
    });
  },
  watch: {
    // Watch for route changes to refresh summary data
    '$route'(to, from) {
      if (to.path === '/user/summary') {
        this.loadSummary().then(() => {
          this.$nextTick(() => {
            this.renderPieChart();
            this.renderLineChart();
          });
        });
      }
    }
  },
  methods: {
    async loadSummary() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch("/api/user/summary", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        
        if (response.ok) {
          this.subjectLabels = data.subject_labels || [];
          this.subjectData = data.subject_data || [];
          this.pieLabels = data.pie_labels || [];
          this.pieData = data.pie_data || [];
        } else {
          this.error = data.message || "Failed to load summary data.";
          this.showToast("Error", this.error, "danger");
        }
      } catch (err) {
        console.error("Error loading summary data:", err);
        this.error = err.message || "An error occurred while loading summary data.";
        this.showToast("Error", this.error, "danger");
      } finally {
        this.loading = false;
      }
    },
    showToast(title, message, variant = 'success') {
      alert(`${title}: ${message}`);
    },
    renderPieChart() {
      if (this.$refs.pieChart) {
        const ctxPie = this.$refs.pieChart.getContext("2d");
        new Chart(ctxPie, {
          type: "pie",
          data: {
            labels: this.pieLabels.length ? this.pieLabels : ["No Data Available"],
            datasets: [{
              label: "Quiz Attempts by Month",
              data: this.pieData.length ? this.pieData : [1],
              backgroundColor: [
                "#FF6384", // Red
                "#36A2EB", // Blue
                "#FFCE56", // Yellow
                "#4BC0C0", // Teal
                "#9966FF", // Purple
                "#FF9F40"  // Orange
              ],
              borderColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40"
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Quiz Attempts by Month",
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 }
              },
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 14 },
                  padding: 20
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 12 }
              }
            }
          }
        });
      } else {
        console.error("Pie chart canvas not found.");
      }
    },
    renderLineChart() {
      if (this.$refs.lineChart) {
        const ctxLine = this.$refs.lineChart.getContext("2d");
        new Chart(ctxLine, {
          type: "line",
          data: {
            labels: this.subjectLabels.length ? this.subjectLabels : ["No Data Available"],
            datasets: [{
              label: "Quiz Attempts by Subject",
              data: this.subjectData.length ? this.subjectData : [1],
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "#36A2EB",
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#36A2EB",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "#36A2EB"
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Quiz Attempts by Subject",
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 }
              },
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 14 },
                  padding: 20
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 12 }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                title: {
                  display: true,
                  text: "Subjects",
                  font: { size: 14 }
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Number of Attempts",
                  font: { size: 14 }
                }
              }
            }
          }
        });
      } else {
        console.error("Line chart canvas not found.");
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
                <a class="nav-link" href="#" @click.prevent="$router.push('/user/upcoming_quizzes')">
                  <i class="fas fa-calendar-alt me-1"></i> Upcoming Quizzes
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" href="#" @click.prevent="goToSummary">
                  <i class="fas fa-chart-pie me-1"></i> View Summary
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="goToScore">
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
            <h2 class="mb-4 text-primary">Summary</h2>
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading summary data...</p>
            </div>
            <div v-else>
              <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
              <div v-else class="row">
                <div class="col-md-6 mb-4">
                  <div class="card shadow border-0 h-100">
                    <div class="card-header py-3 bg-success text-white">
                      <h5 
                        class="m-0 fw-bold" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Distribution of quiz attempts across months"
                      >
                        Quiz Attempts by Month
                      </h5>
                    </div>
                    <div class="card-body">
                      <canvas ref="pieChart"></canvas>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <div class="card shadow border-0 h-100">
                    <div class="card-header py-3 bg-success text-white">
                      <h5 
                        class="m-0 fw-bold" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Number of quiz attempts per subject"
                      >
                        Quiz Attempts by Subject
                      </h5>
                    </div>
                    <div class="card-body">
                      <canvas ref="lineChart"></canvas>
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