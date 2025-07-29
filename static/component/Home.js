export default {
  template: `
    <div class="d-flex flex-column min-vh-100">
      <!-- Main Content -->
      <div class="container-fluid bg-light flex-grow-1 d-flex align-items-center">
        <div class="container my-5">
          <div class="row justify-content-center">
            <div class="col-lg-8">
              <div class="bg-white p-4 p-md-5 text-center rounded-3 shadow-lg">
                <div class="mb-4">
                  <i class="bi bi-trophy-fill text-warning" style="font-size: 3rem;"></i>
                  <h1 class="display-3 fw-bold mb-1">Quiz Master </h1>
                  <p class="lead fs-2 mb-4 text-secondary">Master Your Knowledge with Quiz Master</p>
                  
                  <div class="mx-auto mb-4" style="height: 4px; width: 120px; background: linear-gradient(to right, #0d6efd, #20c997);"></div>
                  
                  <p class="mb-4 fs-5 text-muted">Join thousands of students acing their exams with our interactive quizzes</p>
                </div>
                
                <div class="d-grid gap-3 d-sm-flex justify-content-sm-center mb-4">
                  <router-link 
                    to="/login" 
                    class="btn btn-success btn-lg px-4 me-sm-3 fw-bold"
                  >
                    <i class="bi bi-box-arrow-in-right me-2"></i>Sign In
                  </router-link>
                  
                  <router-link 
                    to="/register" 
                    class="btn btn-primary btn-lg px-4 fw-bold"
                  >
                    <i class="bi bi-person-plus me-2"></i>Register
                  </router-link>
                </div>
                
                <div class="mt-4 pt-3 border-top">
                  <div class="row g-4">
                    <div class="col-md-4">
                      <div class="p-3">
                        <i class="bi bi-collection-fill text-info fs-2 mb-3"></i>
                        <h3 class="h5">Frequent Quizzes</h3>
                        <p class="small text-muted">Wide variety of subjects</p>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3">
                        <i class="bi bi-graph-up-arrow text-success fs-2 mb-3"></i>
                        <h3 class="h5">Track Progress</h3>
                        <p class="small text-muted">Monitor your improvement</p>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="p-3">
                        <i class="bi bi-award-fill text-warning fs-2 mb-3"></i>
                        <h3 class="h5">Challenge Yourself</h3>
                        <p class="small text-muted">Measure your abilities</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <footer class="bg-dark text-white py-4 mt-auto">
        <div class="container">
          <div class="row">
            <div class="col-md-4 mb-3 mb-md-0">
              <h5 class="text-warning">Quiz Master V2</h5>
              <p class="small text-muted">The ultimate platform for exam preparation and knowledge testing.</p>
            </div>
            <div class="col-md-4 mb-3 mb-md-0">
              <h5 class="text-warning">Quick Links</h5>
              <ul class="list-unstyled">
                <li><router-link to="/about" class="text-white text-decoration-none small">About Us</router-link></li>
                <li><router-link to="/contact" class="text-white text-decoration-none small">Contact</router-link></li>
                <li><router-link to="/privacy" class="text-white text-decoration-none small">Privacy Policy</router-link></li>
              </ul>
            </div>
            <div class="col-md-4">
              <h5 class="text-warning">Connect With Us</h5>
              <div class="d-flex gap-3">
                <a href="#" class="text-white"><i class="bi bi-facebook fs-5"></i></a>
                <a href="#" class="text-white"><i class="bi bi-twitter fs-5"></i></a>
                <a href="#" class="text-white"><i class="bi bi-instagram fs-5"></i></a>
                <a href="#" class="text-white"><i class="bi bi-linkedin fs-5"></i></a>
              </div>
              <p class="small text-muted mt-2">support@quizmaster.com</p>
            </div>
          </div>
          <hr class="my-3 bg-secondary">
          <div class="text-center small text-muted">
            &copy; ${new Date().getFullYear()} Quiz Master V2. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `
};