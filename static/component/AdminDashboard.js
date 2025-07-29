export default {
  name: "AdminDashboard",
  data() {
    return {
      subjects: [],
      searchQuery: "",
      subjectResults: [],
      chapterResults: [],
      quizResults: [],
      userResults: [],
      isLoading: false,
      isExporting: false
    };
  },
  async mounted() {
    await this.loadData();
  },
  watch: {
    // route changes to refresh dashboard when returning from question creation
    '$route'(to, from) {
      if (to.path === '/admin/dashboard' && from.path === '/admin/questions') {
        this.loadData();
      }
    }
  },
  methods: {
    async loadData() {
      this.isLoading = true;
      try {
        const response = await fetch("/api/admin/dashboard", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok && data.subjects) {
          this.subjects = data.subjects;
        } else {
          this.showToast("Error", data.message || "Failed to load dashboard data", "danger");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        this.showToast("Error", "Failed to load dashboard data", "danger");
      } finally {
        this.isLoading = false;
      }
    },

    showToast(title, message, variant = 'success') {
      alert(`${title}: ${message}`);
    },

    async addSubject() {
      this.$router.push("/admin/subjects");
    },

    async deleteSubject(subjectId) {
      if (confirm("Are you sure you want to permanently delete this subject and all its associated chapters, quizzes, and questions?")) {
        try {
          const response = await fetch(`/api/admin/subjects/${subjectId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          const data = await response.json();
          if (response.ok) {
            this.subjects = this.subjects.filter(s => s.id !== subjectId);
            this.showToast("Success", "Subject deleted successfully");
          } else {
            this.showToast("Error", data.message || "Failed to delete subject", "danger");
          }
        } catch (error) {
          console.error("Error deleting subject:", error);
          this.showToast("Error", "Failed to delete subject", "danger");
        }
      }
    },

    addChapter() {
      this.$router.push("/admin/chapters");
    },

    async deleteChapter(chapterId) {
      if (confirm("Are you sure you want to permanently delete this chapter and all its associated quizzes and questions?")) {
        try {
          const response = await fetch(`/api/admin/chapters/${chapterId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          const data = await response.json();
          if (response.ok) {
            this.showToast("Success", "Chapter deleted successfully");
            await this.loadData();
          } else {
            this.showToast("Error", data.message || "Failed to delete chapter", "danger");
          }
        } catch (error) {
          console.error("Error deleting chapter:", error);
          this.showToast("Error", "Failed to delete chapter", "danger");
        }
      }
    },

    addQuiz() {
      this.$router.push("/admin/quizzes");
    },

    addQuestion(subjectId, chapterId = null) {
      this.$router.push({
        path: "/admin/questions",
        query: { subjectId, chapterId }
      });
    },

    manageUsers() {
      this.$router.push("/admin/users");
    },

    manageQuizzes() {
      this.$router.push("/admin/quizzes");
    },

    summary() {
      this.$router.push("/admin/summary");
    },

    logout() {
      // Clear any authentication data  if needed
      localStorage.removeItem('authToken'); // Example: Clear token
      this.$router.push('/');
    },

    async searchAdmin() {
      if (!this.searchQuery.trim()) {
        this.showToast("Info", "Please enter a search term", "info");
        return;
      }
      
      this.isLoading = true;
      try {
        const query = encodeURIComponent(this.searchQuery.trim());
        
        const [subjectsRes, chaptersRes, quizRes, usersRes] = await Promise.all([
          fetch(`/api/admin/search/subjects?q=${query}`).then(r => r.json()),
          fetch(`/api/admin/search/chapters?q=${query}`).then(r => r.json()),
          !isNaN(this.searchQuery.trim()) 
            ? fetch(`/api/admin/search/quizzes?quiz_id=${this.searchQuery.trim()}`).then(r => r.json())
            : Promise.resolve({}),
          fetch(`/api/admin/search/users?q=${query}`).then(r => r.json())
        ]);

        this.subjectResults = subjectsRes.subjects || [];
        this.chapterResults = chaptersRes.chapters || [];
        this.quizResults = quizRes.quiz ? [quizRes.quiz] : [];
        this.userResults = usersRes.users || [];

        if (!this.subjectResults.length && !this.chapterResults.length && 
            !this.quizResults.length && !this.userResults.length) {
          this.showToast("Info", "No results found", "info");
        }
      } catch (error) {
        console.error("Search error:", error);
        this.showToast("Error", "Search failed", "danger");
      } finally {
        this.isLoading = false;
      }
    },

    exportDashboardData() {
      this.isExporting = true;
      try {
        // Trigger download directly
        const link = document.createElement('a');
        link.href = '/api/admin/export_dashboard_data';
        link.download = ''; // Browser will use the filename from Content-Disposition
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error exporting CSV:", error);
        this.showToast("Error", "Failed to export dashboard data", "danger");
      } finally {
        this.isExporting = false;
      }
    }
  },
  template: `
    <div>
      <!-- Navigation Bar -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <i class="fas fa-tachometer-alt me-2"></i>Admin Dashboard
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
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
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="summary">
                  <i class="fas fa-chart-pie me-1"></i> Summary
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="logout" style="color: red;">
                  <i class="fas fa-sign-out-alt me-1"></i> Logout
                </a>
              </li>
            </ul>
            <div class="d-flex align-items-center">
              <button class="btn btn-outline-light me-2" :disabled="isExporting" @click="exportDashboardData">
                <i class="fas fa-download me-1"></i>
                {{ isExporting ? 'Exporting...' : 'Export Panel Data' }}
              </button>
              <form class="d-flex" @submit.prevent="searchAdmin">
                <div class="input-group">
                  <input
                    type="text"
                    v-model="searchQuery"
                    class="form-control"
                    placeholder="Search subjects, chapters, quizzes, users..."
                    aria-label="Search"
                  />
                  <button 
                    class="btn btn-outline-light" 
                    type="submit" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    title="Search"
                  >
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
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading data...</p>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchQuery.trim()">
          <!-- Subjects Results -->
          <div class="card shadow mb-4" v-if="subjectResults.length">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">
                <i class="fas fa-book me-1"></i> Subjects ({{ subjectResults.length }})
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Subject</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="subject in subjectResults" :key="subject.id">
                      <td>{{ subject.name }}</td>
                      <td>{{ subject.description || 'N/A' }}</td>
                      <td>
                        <button 
                          @click="deleteSubject(subject.id)" 
                          class="btn btn-sm btn-outline-danger" 
                          data-bs-toggle="tooltip" 
                          data-bs-placement="top" 
                          title="Delete Subject"
                        >
                          Delete Subject
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Chapters Results -->
          <div class="card shadow-md mb-4" v-if="chapterResults.length">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">
                <i class="fas fa-file-alt me-1"></i> Chapters ({{ chapterResults.length }})
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Chapter</th>
                      <th>Description</th>
                      <th>Subject ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="chapter in chapterResults" :key="chapter.id">
                      <td>{{ chapter.name }}</td>
                      <td>{{ chapter.description || 'N/A' }}</td>
                      <td>{{ chapter.subject_id }}</td>
                      <td>
                        <button 
                          @click="deleteChapter(chapter.id)" 
                          class="btn btn-sm btn-outline-danger" 
                          data-bs-toggle="tooltip" 
                          data-bs-placement="top" 
                          title="Delete Chapter"
                        >
                          Delete Chapter
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Quizzes Results -->
          <div class="card shadow mb-4" v-if="quizResults.length">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">
                <i class="fas fa-question-circle me-1"></i> Quizzes ({{ quizResults.length }})
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Quiz ID</th>
                      <th>Chapter ID</th>
                      <th>Date</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="quiz in quizResults" :key="quiz.id">
                      <td>{{ quiz.id }}</td>
                      <td>{{ quiz.chapter_id }}</td>
                      <td>{{ quiz.date_of_quiz }}</td>
                      <td>{{ quiz.start_time }}</td>
                      <td>{{ quiz.time_duration }} mins</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Users Results -->
          <div class="card shadow mb-4" v-if="userResults.length">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">
                <i class="fas fa-users me-1"></i> Users ({{ userResults.length }})
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered table-hover">
                  <thead class="thead-dark">
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Qualification</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in userResults" :key="user.id">
                      <td>{{ user.id }}</td>
                      <td>{{ user.full_name }}</td>
                      <td>{{ user.email }}</td>
                      <td>{{ user.qualification || 'N/A' }}</td>
                      <td>
                        <span :class="{'badge bg-success': user.active, 'badge bg-secondary': !user.active}">
                          {{ user.active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Content -->
        <div v-else>
          <div class="row">
            <div class="col-lg-6 mb-4" v-for="subject in subjects" :key="subject.id">
              <div class="card shadow-md h-100">
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-book me-1"></i> {{ subject.name }}
                  </h6>
                  <div class="d-flex gap-2">
                    <button 
                      @click="deleteSubject(subject.id)" 
                      class="btn btn-sm btn-outline-danger" 
                      data-bs-toggle="tooltip" 
                      data-bs-placement="top" 
                      title="Delete this subject and all its contents"
                    >
                      Delete Subject
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Chapter</th>
                          <th>Quizzes</th>
                          <th>Questions</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="chapter in subject.chapters" :key="chapter.id">
                          <td>{{ chapter.name }}</td>
                          <td>
                            <span v-if="chapter.quizzes && chapter.quizzes.length">
                              {{ chapter.quizzes.length }} quiz(es)
                            </span>
                            <span v-else class="text-muted">No quizzes</span>
                          </td>
                          <td>
                            <span v-if="chapter.quizzes && chapter.quizzes.length">
                              {{ chapter.quizzes.reduce((acc, quiz) => acc + (quiz.questions ? quiz.questions.length : 0), 0) }} total
                            </span>
                            <span v-else class="text-muted">0</span>
                          </td>
                          <td>
                            <div class="d-flex gap-2">
                              <button 
                                @click="addQuestion(subject.id, chapter.id)" 
                                class="btn btn-outline-info" 
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Add a new question to this chapter"
                              >
                                Add Question
                              </button>
                              <button 
                                @click="deleteChapter(chapter.id)" 
                                class="btn btn-sm btn-outline-danger" 
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Delete this chapter and its contents"
                              >
                                Delete Chapter
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr v-if="!subject.chapters || !subject.chapters.length">
                          <td colspan="4" class="text-center text-muted">No chapters yet</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="card-footer bg-transparent">
                  <button 
                    @click="addChapter" 
                    class="btn btn-sm btn-success" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    title="Add a new chapter to this subject"
                  >
                    <i class="fas fa-plus me-1"></i> Add Chapter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};