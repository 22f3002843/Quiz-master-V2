export default {
    name: "SubjectComponent",
    data() {
      return {
        subjects: [],
        newSubject: {
          name: "",
          description: ""
        },
        editingSubject: null,
        updatedSubject: {
          name: "",
          description: ""
        }
      };
    },
    created() {
      this.loadSubjects();
    },
    methods: {
      async loadSubjects() {
        try {
          const response = await fetch("/api/admin/subjects", {
            headers: { "Content-Type": "application/json" }
          });
          const data = await response.json();
          if (response.ok && data.subjects) {
            this.subjects = data.subjects;
          } else {
            alert(data.message || "Failed to load subjects.");
          }
        } catch (error) {
          console.error("Error loading subjects:", error);
        }
      },
      async addSubject() {
        try {
          const response = await fetch("/api/admin/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.newSubject)
          });
          const data = await response.json();
          if (response.ok) {
            this.subjects.push(data);
            this.newSubject = { name: "", description: "" };
          } else {
            alert(data.message || "Failed to add subject.");
          }
        } catch (error) {
          console.error("Error adding subject:", error);
        }
      },
      startEditing(subject) {
        this.editingSubject = subject;
        this.updatedSubject = { name: subject.name, description: subject.description };
      },
      cancelEditing() {
        this.editingSubject = null;
        this.updatedSubject = { name: "", description: "" };
      },
      async updateSubject(subject) {
        try {
          const response = await fetch(`/api/admin/subjects/${subject.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.updatedSubject)
          });
          const data = await response.json();
          if (response.ok) {
            const index = this.subjects.findIndex(s => s.id === subject.id);
            if (index !== -1) {
              this.subjects.splice(index, 1, data);
            }
            this.cancelEditing();
          } else {
            alert(data.message || "Failed to update subject.");
          }
        } catch (error) {
          console.error("Error updating subject:", error);
        }
      },
      async deleteSubject(subject) {
        if (confirm("Are you sure you want to delete this subject?")) {
          try {
            const response = await fetch(`/api/admin/subjects/${subject.id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            if (response.ok) {
              this.subjects = this.subjects.filter(s => s.id !== subject.id);
            } else {
              alert(data.message || "Failed to delete subject.");
            }
          } catch (error) {
            console.error("Error deleting subject:", error);
          }
        }
      },
      goToDashboard() {
        this.$router.push("/admin/dashboard");
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
              <i class="fas fa-book me-2"></i>Subject Management
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
                  <a class="nav-link active" href="#" @click.prevent>
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
                    <!-- Add New Subject Section -->
                    <div class="col-12 col-md-4 border-end pe-md-4">
                      <h4 class="text-muted mb-4">Create New Subject</h4>
                      <form @submit.prevent="addSubject" class="p-2">
                        <div class="mb-3">
                          <label for="subjectName" class="form-label fw-bold">Subject Name</label>
                          <input 
                            id="subjectName"
                            type="text" 
                            v-model="newSubject.name" 
                            class="form-control" 
                            placeholder="Enter subject name"
                            required 
                          />
                        </div>
                        <div class="mb-3">
                          <label for="subjectDesc" class="form-label fw-bold">Description</label>
                          <textarea 
                            id="subjectDesc"
                            v-model="newSubject.description" 
                            class="form-control" 
                            rows="3"
                            placeholder="Enter description"
                          ></textarea>
                        </div>
                        <button 
                          type="submit" 
                          class="btn btn-success w-100"
                        >
                          <i class="fas fa-plus me-1"></i> Add Subject
                        </button>
                      </form>
                    </div>

                    <!-- Subjects List Section -->
                    <div class="col-12 col-md-8 ps-md-4">
                      <h4 class="text-muted mb-4">Existing Subjects</h4>
                      <div class="list-group">
                        <div 
                          v-for="subject in subjects" 
                          :key="subject.id" 
                          class="list-group-item list-group-item-action p-3 mb-2 rounded shadow-sm"
                        >
                          <!-- Editing Mode -->
                          <div v-if="editingSubject && editingSubject.id === subject.id">
                            <div class="mb-3">
                              <label for="editSubjectName" class="form-label fw-bold">Subject Name</label>
                              <input 
                                id="editSubjectName"
                                type="text" 
                                v-model="updatedSubject.name" 
                                class="form-control" 
                                placeholder="Subject name"
                                required
                              />
                            </div>
                            <div class="mb-3">
                              <label for="editSubjectDesc" class="form-label fw-bold">Description</label>
                              <textarea 
                                id="editSubjectDesc"
                                v-model="updatedSubject.description" 
                                class="form-control" 
                                rows="3"
                                placeholder="Description"
                              ></textarea>
                            </div>
                            <div class="d-flex gap-2">
                              <button 
                                class="btn btn-success flex-grow-1" 
                                @click="updateSubject(subject)"
                              >
                                <i class="fas fa-save me-1"></i> Save Changes
                              </button>
                              <button 
                                class="btn btn-outline-secondary flex-grow-1" 
                                @click="cancelEditing"
                              >
                                <i class="fas fa-times me-1"></i> Cancel
                              </button>
                            </div>
                          </div>

                          <!-- Display Mode -->
                          <div v-else class="d-flex justify-content-between align-items-start">
                            <div>
                              <h5 class="mb-1 fw-bold">{{ subject.name }}</h5>
                              <p class="mb-0 text-muted">{{ subject.description || 'No description' }}</p>
                            </div>
                            <div class="btn-group">
                              <button 
                                class="btn btn-outline-warning" 
                                @click="startEditing(subject)"
                              >
                                <i class="fas fa-edit me-1"></i> Edit
                              </button>
                              <button 
                                class="btn btn-outline-danger" 
                                @click="deleteSubject(subject)"
                              >
                                <i class="fas fa-trash me-1"></i> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                        <div 
                          v-if="!subjects.length" 
                          class="list-group-item text-center text-muted p-4"
                        >
                          No subjects available
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