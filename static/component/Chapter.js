export default {
  name: "ChapterComponent",
  data() {
    return {
      chapters: [],
      subjects: [],
      newChapter: {
        name: "",
        description: "",
        subject_id: ""
      },
      editingChapter: null,
      updatedChapter: {
        name: "",
        description: "",
        subject_id: ""
      }
    };
  },
  created() {
    this.loadChapters();
    this.loadSubjects();
  },
  methods: {
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
    async addChapter() {
      try {
        if (!this.newChapter.subject_id) {
          alert("Please select a subject.");
          return;
        }
        const response = await fetch("/api/admin/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newChapter)
        });
        const data = await response.json();
        if (response.ok) {
          this.chapters.push(data);
          this.newChapter = { name: "", description: "", subject_id: "" };
        } else {
          alert(data.message || "Failed to add chapter.");
        }
      } catch (error) {
        console.error("Error adding chapter:", error);
      }
    },
    startEditing(chapter) {
      this.editingChapter = chapter;
      this.updatedChapter = { 
        name: chapter.name, 
        description: chapter.description, 
        subject_id: chapter.subject_id 
      };
    },
    cancelEditing() {
      this.editingChapter = null;
      this.updatedChapter = { name: "", description: "", subject_id: "" };
    },
    async updateChapter(chapter) {
      try {
        const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.updatedChapter)
        });
        const data = await response.json();
        if (response.ok) {
          const index = this.chapters.findIndex(c => c.id === chapter.id);
          if (index !== -1) {
            this.chapters.splice(index, 1, data);
          }
          this.cancelEditing();
        } else {
          alert(data.message || "Failed to update chapter.");
        }
      } catch (error) {
        console.error("Error updating chapter:", error);
      }
    },
    async deleteChapter(chapter) {
      if (confirm("Are you sure you want to delete this chapter?")) {
        try {
          const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          const data = await response.json();
          if (response.ok) {
            this.chapters = this.chapters.filter(c => c.id !== chapter.id);
          } else {
            alert(data.message || "Failed to delete chapter.");
          }
        } catch (error) {
          console.error("Error deleting chapter:", error);
        }
      }
    },
    goToDashboard() {
      this.$router.push("/admin/dashboard");
    },
    addSubject() {
      this.$router.push("/admin/subjects");
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
            <i class="fas fa-file-alt me-2"></i>Chapter Management
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
                  <i class="fas fa-file-alt me-1"></i> Add Chapter
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
                  <div class="col-12 col-md-4 border-end pe-md-4">
                    <h4 class="text-muted mb-4">Create New Chapter</h4>
                    <form @submit.prevent="addChapter" class="p-2">
                      <div class="mb-3">
                        <label for="chapterName" class="form-label fw-bold">Chapter Name</label>
                        <input 
                          id="chapterName"
                          type="text" 
                          v-model="newChapter.name" 
                          class="form-control" 
                          placeholder="Enter chapter name"
                          required 
                        />
                      </div>
                      <div class="mb-3">
                        <label for="chapterDesc" class="form-label fw-bold">Description</label>
                        <textarea 
                          id="chapterDesc"
                          v-model="newChapter.description" 
                          class="form-control" 
                          rows="3"
                          placeholder="Enter description"
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label for="subjectSelect" class="form-label fw-bold">Subject</label>
                        <select 
                          id="subjectSelect"
                          v-model="newChapter.subject_id" 
                          class="form-select" 
                          required
                        >
                          <option value="" disabled>Select Subject</option>
                          <option 
                            v-for="subject in subjects" 
                            :value="subject.id" 
                            :key="subject.id"
                          >
                            {{ subject.name }}
                          </option>
                        </select>
                      </div>
                      <button 
                        type="submit" 
                        class="btn btn-primary w-100"
                      >
                        <i class="fas fa-plus me-1"></i> Add Chapter
                      </button>
                    </form>
                  </div>

                  <div class="col-12 col-md-8 ps-md-4">
                    <h4 class="text-muted mb-4">Existing Chapters</h4>
                    <div class="list-group">
                      <div 
                        v-for="chapter in chapters" 
                        :key="chapter.id" 
                        class="list-group-item list-group-item-action p-3 mb-2 rounded shadow-sm"
                      >
                        <div v-if="editingChapter && editingChapter.id === chapter.id">
                          <div class="mb-3">
                            <label for="editChapterName" class="form-label fw-bold">Chapter Name</label>
                            <input 
                              id="editChapterName"
                              type="text" 
                              v-model="updatedChapter.name" 
                              class="form-control" 
                              placeholder="Chapter name"
                            />
                          </div>
                          <div class="mb-3">
                            <label for="editChapterDesc" class="form-label fw-bold">Description</label>
                            <textarea 
                              id="editChapterDesc"
                              v-model="updatedChapter.description" 
                              class="form-control" 
                              rows="3"
                              placeholder="Description"
                            ></textarea>
                          </div>
                          <div class="mb-3">
                            <label for="editSubjectSelect" class="form-label fw-bold">Subject</label>
                            <select 
                              id="editSubjectSelect"
                              v-model="updatedChapter.subject_id" 
                              class="form-select"
                            >
                              <option value="" disabled>Select Subject</option>
                              <option 
                                v-for="subject in subjects" 
                                :value="subject.id" 
                                :key="subject.id"
                              >
                                {{ subject.name }}
                              </option>
                            </select>
                          </div>
                          <div class="d-flex gap-2">
                            <button 
                              class="btn btn-success flex-grow-1" 
                              @click="updateChapter(chapter)"
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

                        <div v-else class="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 class="mb-1 fw-bold">{{ chapter.name }}</h5>
                            <p class="mb-1 text-muted">{{ chapter.description || 'No description' }}</p>
                            <p class="mb-0 text-muted">
                              <strong>Subject:</strong> 
                              {{ subjects.find(s => s.id === chapter.subject_id)?.name || 'Unknown' }}
                            </p>
                          </div>
                          <div class="btn-group">
                            <button 
                              class="btn btn-outline-warning" 
                              @click="startEditing(chapter)"
                            >
                              <i class="fas fa-edit me-1"></i> Edit
                            </button>
                            <button 
                              class="btn btn-outline-danger" 
                              @click="deleteChapter(chapter)"
                            >
                              <i class="fas fa-trash me-1"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <div 
                        v-if="!chapters.length" 
                        class="list-group-item text-center text-muted p-4"
                      >
                        No chapters available
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