export default {
  name: "ManageUser",
  data() {
    return {
      users: [],
      editingUser: null,
      updatedUser: {
        email: "",
        full_name: "",
        qualification: "",
        dob: "",
        active: true
      }
    };
  },
  created() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        const response = await fetch("/api/admin/users", {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok && data.users) {
          this.users = data.users;
        } else {
          alert(data.message || "Failed to load users.");
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }
    },
    startEditing(user) {
      this.editingUser = user;
      this.updatedUser = {
        email: user.email,
        full_name: user.full_name,
        qualification: user.qualification,
        dob: user.dob,
        active: user.active
      };
    },
    cancelEditing() {
      this.editingUser = null;
      this.updatedUser = {
        email: "",
        full_name: "",
        qualification: "",
        dob: "",
        active: true
      };
    },
    async updateUser(user) {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.updatedUser)
        });
        const data = await response.json();
        if (response.ok) {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users.splice(index, 1, data);
          }
          this.cancelEditing();
        } else {
          alert(data.message || "Failed to update user.");
        }
      } catch (error) {
        console.error("Error updating user:", error);
      }
    },
    async deleteUser(user) {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok) {
          this.users = this.users.filter(u => u.id !== user.id);
        } else {
          alert(data.message || "Failed to delete user.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
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
            <i class="fas fa-users me-2"></i>User Management
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
                <a class="nav-link active" href="#" @click.prevent>
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
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th class="ps-4">ID</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Qualification</th>
                        <th>Date of Birth</th>
                        <th>Status</th>
                        <th class="text-end pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="user in users" :key="user.id">
                        <td class="ps-4">{{ user.id }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.full_name }}</td>
                        <td>{{ user.qualification || '-' }}</td>
                        <td>{{ user.dob || '-' }}</td>
                        <td>
                          <span class="badge" :class="user.active ? 'bg-success' : 'bg-secondary'">
                            {{ user.active ? "Active" : "Inactive" }}
                          </span>
                        </td>
                        <td class="text-end pe-4">
                          <div class="btn-group" v-if="!user.roles.includes('admin')">
                            <button class="btn btn-outline-warning btn-sm" @click="startEditing(user)">
                              <i class="fas fa-edit me-1"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger btn-sm" @click="deleteUser(user)">
                              <i class="fas fa-trash me-1"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!users.length">
                        <td colspan="7" class="text-center text-muted">No users available</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Modal -->
        <div v-if="editingUser" class="modal-backdrop fade show"></div>
        <div v-if="editingUser" class="modal show d-block" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content shadow">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Edit User: {{ editingUser.email }}</h5>
                <button type="button" class="btn-close" @click="cancelEditing" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="editEmail" class="form-label fw-bold">Email</label>
                      <input type="email" v-model="updatedUser.email" id="editEmail" class="form-control" required />
                    </div>
                    <div class="col-md-6">
                      <label for="editFullName" class="form-label fw-bold">Full Name</label>
                      <input type="text" v-model="updatedUser.full_name" id="editFullName" class="form-control" required />
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="editQualification" class="form-label fw-bold">Qualification</label>
                      <input type="text" v-model="updatedUser.qualification" id="editQualification" class="form-control" placeholder="Enter qualification" />
                    </div>
                    <div class="col-md-6">
                      <label for="editDob" class="form-label fw-bold">Date of Birth</label>
                      <input type="date" v-model="updatedUser.dob" id="editDob" class="form-control" />
                    </div>
                  </div>
                  <div class="mb-3">
                    <label for="editStatus" class="form-label fw-bold">Status</label>
                    <select v-model="updatedUser.active" id="editStatus" class="form-select">
                      <option :value="true">Active</option>
                      <option :value="false">Inactive</option>
                    </select>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="cancelEditing">
                  <i class="fas fa-times me-1"></i> Cancel
                </button>
                <button type="button" class="btn btn-primary" @click="updateUser(editingUser)">
                  <i class="fas fa-save me-1"></i> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};