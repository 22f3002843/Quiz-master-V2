export default {
  name: "Navbar",
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem("authToken");
    }
  },
  methods: {
    goToDashboard() {
      const userRole = localStorage.getItem("role");
      if (userRole === "admin") {
        this.$router.push("/admin/dashboard");
      } else if (userRole === "user") {
        this.$router.push("/user/dashboard");
      } else {
        // If for some reason no role is found navigate to login
        alert("Please log in to access the dashboard!");
        this.$router.push("/login");
      }
    },
    async logout() {
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("role");
          this.$router.push("/login");
        } else {
          throw new Error(data.message || "Logout failed!");
        }
      } catch (error) {
        console.error("Logout Error:", error);
        alert(error.message);
      }
    }
  },
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #0d1b2a;">
      <div class="container">
        <!-- Brand -->
        <router-link class="navbar-brand" to="/">
          <i class="fas fa-question-circle me-2"></i>Quiz Master
        </router-link>
        <!-- Toggler -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <!-- Navbar Content -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <!-- If not logged in, show Login/Register -->
            <template v-if="!isLoggedIn">
              <li class="nav-item me-2">
                <router-link class="btn btn-outline-light" to="/login">
                  <i class="fas fa-sign-in-alt me-2"></i>Login
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="btn btn-primary" to="/register">
                  <i class="fas fa-user-plus me-2"></i>Register
                </router-link>
              </li>
            </template>
            <!-- If logged in, show Dashboard/Logout -->
            <template v-else>
              <li class="nav-item me-2">
                <button class="btn btn-secondary" @click="goToDashboard">
                  <i class="fas fa-tachometer-alt me-2"></i>My Dashboard
                </button>
              </li>
              <li class="nav-item">
                <button class="btn btn-danger" @click.prevent="logout">
                  <i class="fas fa-sign-out-alt me-2"></i>Logout
                </button>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  `
};