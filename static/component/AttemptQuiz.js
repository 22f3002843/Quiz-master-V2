export default {
  name: "AttemptQuiz",
  data() {
    return {
      quiz: null,
      questions: [],
      submitted: false,
      feedback: null,
      answers: {},
      timeLeft: "",
      timeLeftSeconds: 0,
      timer: null,
      loading: false,
      error: null,
    };
  },
  computed: {
    isQuizAvailable() {
      if (!this.quiz) return false;
      const now = new Date();
      const start = this.quiz.quiz_start_datetime ? new Date(this.quiz.quiz_start_datetime) : null;
      const end = this.quiz.quiz_end_datetime ? new Date(this.quiz.quiz_end_datetime) : null;
      return (!start || now >= start) && (!end || now <= end);
    },
    isFormValid() {
      return this.questions.every(q => this.answers[q.id] !== undefined);
    },
  },
  created() {
    this.loadQuiz();
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    async loadQuiz() {
      this.loading = true;
      const quizId = this.$route.params.quiz_id;
      try {
        const response = await fetch(`/api/user/attempt_quiz/${quizId}/attempt`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          this.quiz = data.quiz;
          this.questions = data.questions;
          if (this.quiz.time_duration) {
            this.startTimer(this.parseTimeDuration(this.quiz.time_duration));
          }
        } else {
          this.error = data.message || "Failed to load quiz.";
        }
      } catch (error) {
        this.error = "Network error. Please check your connection and try again.";
        console.error("Error loading quiz:", error);
      } finally {
        this.loading = false;
      }
    },
    parseTimeDuration(duration) {
      try {
        const parts = duration.split(":");
        if (parts.length < 2) throw new Error("Invalid time format");
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours * 3600 + minutes * 60;
      } catch (error) {
        console.error("Invalid time_duration format:", error);
        return 0;
      }
    },
    startTimer(totalSeconds) {
      if (totalSeconds <= 0) return;
      this.timeLeftSeconds = totalSeconds;
      const endTime = new Date().getTime() + totalSeconds * 1000;
      this.timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance <= 0) {
          clearInterval(this.timer);
          this.timeLeft = "Time's up!";
          if (!this.submitted) {
            this.submitQuiz();
          }
        } else {
          this.timeLeftSeconds = Math.floor(distance / 1000);
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          this.timeLeft = `${minutes}m ${seconds}s`;
        }
      }, 1000);
    },
    confirmSubmission() {
      if (confirm("Are you sure you want to submit the quiz?")) {
        this.submitQuiz();
      }
    },
    async submitQuiz() {
      if (this.submitted) return;
      this.submitted = true;
      const quizId = this.$route.params.quiz_id;
      const payload = {};
      for (const question of this.questions) {
        payload[`question_${question.id}`] = this.answers[question.id] || null;
      }

      try {
        const response = await fetch(`/api/user/attempt_quiz/${quizId}/attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          this.feedback = { score: data.score, total: data.total };
          clearInterval(this.timer);
        } else {
          this.submitted = false;
          this.error = data.message || "Failed to submit quiz.";
          alert(this.error);
        }
      } catch (error) {
        this.submitted = false;
        this.error = "Network error during submission. Please try again.";
        alert(this.error);
        console.error("Error submitting quiz:", error);
      }
    },
  },
  template: `
    <div class="container my-3">
      <div v-if="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="quiz">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Attempt Quiz - ID {{ quiz.id }}</h2>
          <div
            v-if="!submitted && quiz.time_duration"
            class="timer"
            :class="{ 'timer-warning': timeLeftSeconds <= 30 }"
            role="timer"
            aria-live="polite"
          >
            Time Left: <span>{{ timeLeft }}</span>
          </div>
        </div>
        <div v-if="feedback" class="alert alert-info mt-3">
          <h4>Feedback</h4>
          <p>You scored {{ feedback.score }} out of {{ feedback.total }}.</p>
          <button class="btn btn-secondary" @click="$router.push('/user/score')">View Score</button>
        </div>
        <div v-if="!submitted">
          <div v-if="!isQuizAvailable" class="alert alert-warning">
            <strong>This quiz is not available.</strong>
            <span v-if="quiz.quiz_start_datetime && new Date(quiz.quiz_start_datetime) > new Date()">
              It will start at {{ quiz.start_time }} on {{ quiz.date_of_quiz }}.
            </span>
            <span v-else-if="quiz.quiz_end_datetime && new Date(quiz.quiz_end_datetime) < new Date()">
              The quiz has ended.
            </span>
          </div>
          <form v-else @submit.prevent="confirmSubmission">
            <div v-for="(question, index) in questions" :key="question.id" class="card mb-3">
              <div class="card-header">
                <strong>Question {{ index + 1 }}:</strong> {{ question.question_statement }}
              </div>
              <div class="card-body">
                <div
                  v-for="option in [1, 2, 3, 4].filter(i => question['option' + i])"
                  :key="option"
                  class="form-check"
                >
                  <input
                    class="form-check-input"
                    type="radio"
                    :name="'question_' + question.id"
                    :value="option"
                    v-model="answers[question.id]"
                    :id="'question_' + question.id + '_option_' + option"
                  >
                  <label
                    class="form-check-label"
                    :for="'question_' + question.id + '_option_' + option"
                  >
                    {{ question['option' + option] }}
                  </label>
                </div>
              </div>
            </div>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!isFormValid"
              aria-label="Submit quiz"
            >
              Submit Quiz
            </button>
          </form>
        </div>
      </div>
      <div v-else class="alert alert-danger">
        {{ error || 'Failed to load quiz. Please try again later.' }}
      </div>
    </div>
  `,
};