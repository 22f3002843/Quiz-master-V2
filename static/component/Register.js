export default {
  template: `
    <div class="container-fluid d-flex align-items-center justify-content-center"
     style="min-height: 100vh; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">

      <div class="row justify-content-center w-100">
        <div class="col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="card-header py-4 text-center" style="background: linear-gradient(to right, #198754, #20c997);">
              <div class="d-flex align-items-center justify-content-center mb-2">
                <i class="bi bi-person-plus-fill text-white fs-1 me-3"></i>
                <h2 class="text-white mb-0 fw-bold">Create Your Account</h2>
              </div>
              <p class="text-white-50 mb-0">Join Quiz Master to unlock your potential</p>
            </div>
            <div class="card-body p-4 p-md-5">
              <form @submit.prevent="handleRegister">
                <div class="form-floating mb-4">
                  <input
                    type="email"
                    id="email"
                    class="form-control rounded-3"
                    placeholder="name@example.com"
                    v-model="formData.email"
                    required
                  />
                  <label for="email" class="fw-medium">Email Address</label>
                  
                </div>
                
                <div class="form-floating mb-4">
                  <input
                    type="text"
                    id="full_name"
                    class="form-control rounded-3"
                    placeholder="John Doe"
                    v-model="formData.full_name"
                    required
                  />
                  <label for="full_name" class="fw-medium">Full Name</label>
                </div>
                
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        type="date"
                        id="dob"
                        class="form-control rounded-3"
                        v-model="formData.dob"
                        required
                      />
                      <label for="dob" class="fw-medium">Date of Birth</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        type="text"
                        id="qualification"
                        class="form-control rounded-3"
                        placeholder="BSc Computer Science"
                        v-model="formData.qualification"
                        required
                      />
                      <label for="qualification" class="fw-medium">Qualification</label>
                    </div>
                  </div>
                </div>
                
                <div class="form-floating mb-4">
                  <input
                    type="password"
                    id="password"
                    class="form-control rounded-3"
                    placeholder="Password"
                    v-model="formData.password"
                    required
                  />
                  <label for="password" class="fw-medium">Password</label>
                  
                </div>
                
                <button type="submit" class="btn btn-success btn-lg w-100 rounded-3 py-3 fw-bold mt-2" style="background: linear-gradient(to right, #198754, #20c997);">
                  <i class="bi bi-person-plus me-2"></i>Register Now
                </button>
                
                <div class="text-center mt-4">
                  <p class="text-muted">Already have an account? 
                    <router-link to="/login" class="text-primary text-decoration-none fw-bold">Sign In</router-link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      formData: {
        email: "",
        full_name: "",
        dob: "",
        qualification: "",
        password: "",
      },
    };
  },
  methods: {
    async handleRegister() {
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.formData),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          alert("Registration successful! Please log in.");
          this.$router.push("/login");
        } else {
          throw new Error(data.message || "Registration failed!");
        }
      } catch (error) {
        console.error("Registration Error:", error);
        alert(error.message);
      }
    },
  },
};