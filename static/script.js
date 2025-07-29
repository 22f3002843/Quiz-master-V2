
import Home from './component/Home.js';
import Navbar from './component/Navbar.js';
import Login from './component/Login.js';
import Register from './component/Register.js';
import AdminDashboard from './component/AdminDashboard.js'; 
import AdminSummary from './component/AdminSummary.js';
import AttemptQuiz from './component/AttemptQuiz.js';
import ChapterComponent from './component/Chapter.js';
import QuestionComponent from './component/Question.js';
import UserDashboard from './component/UserDashboard.js'; 
import ManageUser from './component/ManageUser.js'; 
import UpcomingQuizzes from './component/UpcomingQuizzes.js';
import UserViewQuiz from './component/UserViewQuiz.js';
import UserScore from './component/UserScore.js';
import SubjectComponent from './component/Subject.js';
import QuizComponent from './component/Quiz.js';
import UserSummary from './component/UserSummary.js';



const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/admin/dashboard', component: AdminDashboard },
  { path: '/admin/summary', component: AdminSummary },
  { path: '/user/dashboard', component: UserDashboard },
  { path: '/admin/users', component: ManageUser },
  { path: '/user/upcoming_quizzes', component: UpcomingQuizzes },
  { path: '/user/attempt_quiz/:quiz_id/attempt', component: AttemptQuiz },
  { path: '/user_view_quiz/:quiz_id', component: UserViewQuiz },
  { path: '/user/score', component: UserScore },
  { path: '/user/summary', component: UserSummary },
  { path: '/admin/subjects', component: SubjectComponent },
  { path: '/admin/chapters', component: ChapterComponent },
  { path: '/admin/quizzes', component: QuizComponent },
  { path: '/admin/questions', component: QuestionComponent },
];

const router = new VueRouter({
  routes,

});

// Override push to ignore NavigationDuplicated errors globally
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name === 'NavigationDuplicated') {
      return err;
    }
    throw err;
  });
};

const app = new Vue({
  el: '#app',
  router,
  template: `
    <div>
      <Navbar></Navbar>
      <div class="flex-grow-1">
        <router-view></router-view>
      </div>
    </div>`
  ,
  components: {
    Navbar,

  },
});