export default {
  template: `
    <div class="container-fluid bg-gradient-auth min-vh-100 d-flex align-items-center">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-xl-4 col-lg-5 col-md-6">
            <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div class="card-header py-4 text-center" style="background: linear-gradient(to right, #0d6efd, #20c997);">

                <div class="d-flex align-items-center justify-content-center mb-2">
                  <i class="bi bi-shield-lock text-white fs-1 me-3"></i>
                  <h2 class="text-white mb-0 fw-bold">Welcome Back</h2>
                </div>
                <p class="text-white-50 mb-0">Sign in to continue your learning journey</p>
              </div>
              
              <div class="card-body p-4 p-xl-5 bg-white">
                <form @submit.prevent="loginUser">
                  <div class="form-floating mb-4">
                    <input
                      type="email"
                      id="email"
                      class="form-control rounded-3 border-light"
                      placeholder="name@example.com"
                      v-model="formData.email"
                      required
                    />
                    <label for="email" class="text-muted">Email Address</label>
                  </div>
                  
                  <div class="form-floating mb-4">
                    <input
                      type="password"
                      id="password"
                      class="form-control rounded-3 border-light"
                      placeholder="Password"
                      v-model="formData.password"
                      required
                    />
                    <label for="password" class="text-muted">Password</label>
                  </div>
                  
                  <button type="submit" class="btn btn-success btn-lg w-100 rounded-3 py-3 fw-bold" style="background: linear-gradient(to right, #198754, #20c997);">
                    <i class="bi bi-box-arrow-in-right me-2"></i>Sign In
                  </button>
                  
                  <div class="text-center mt-4 pt-3 border-top">
                    <p class="text-muted mb-0">Don't have an account? 
                      <router-link to="/register" class="text-success text-decoration-none fw-bold">
                        Create Account
                      </router-link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
    .bg-gradient-auth {
      background: linear-gradient(135deg, #147b4bff 0%, #20c997 100%);
    }
    </style>
  `,
  data() {
    return {
      formData: {
        email: "",
        password: "",
      },
    };
  },
  methods: {
    async loginUser() {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(this.formData),
        });

        const data = await response.json();
        console.log("Login Response:", data);

        if (response.ok && data.success) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("role", data.role);

          if (data.role === "admin") {
            alert("Welcome, Admin!");
            this.$router.push("/admin/dashboard");
          } else {
            alert("Welcome!");
            this.$router.push("/user/dashboard");
          }
        } else {
          throw new Error(data.message || "Login failed!");
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert(error.message);
      }
    },
  },
};