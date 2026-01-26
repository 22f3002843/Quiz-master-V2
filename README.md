# QuizMaster App - README

QuizMaster V2 is a comprehensive web application designed for managing and conducting online quizzes. It features distinct portals for administrators and users, ensuring a smooth and efficient examination process.

## Features

### Admin Portal
- **Subject & Chapter Management**: Admins can add, delete, and edit subjects and chapters.
- **Quiz Management**: Create and schedule quizzes for specific dates and times.
- **Question Management**: Add and manage questions, including setting the number of questions for each quiz.

### User Portal
- **Take Quizzes**: Users can access and take quizzes at the scheduled time.
- **Timed Exams**: Quizzes are equipped with a timer to ensure strictly timed assessments.

### Advanced Features
- **Email Notifications**: Automated emails are sent to users at specified times.
- **Caching with Redis**: Implemented Redis caching to enhance application performance and speed.

---

This document provides instructions for setting up and running the QuizMaster application, including details for Redis and MailHog.

## Running the Application

1. **Open Project**: Open the project folder in Visual Studio Code.
2. **Open Terminal**: Open a WSL terminal in VS Code.
3. **Start Application**: Run the following command to start the application:

   ```bash
   python3 app.py
   ```

4. **Access Development Server**: After running the command, the development server will be available at: http://127.0.0.1:5000

### Administrator Login
- **Email**: `admin@quizmaster.com`
- **Password**: `admin123`

## Redis Server Setup

### Install Redis
```bash
sudo apt install redis-server -y
```

### Start Redis Server
```bash
redis-server
```

### Stop Redis Server
- **If the terminal is open**: Press `Ctrl+C`
- **If the terminal is closed**:
  ```bash
  sudo service redis-server stop
  ```

**Default Redis Port**: Redis runs by default on `localhost:6379`

## MailHog (for Email Testing)

### Start MailHog
```bash
~/go/bin/MailHog
```

### Access MailHog
MailHog will be accessible at: http://localhost:8025

## Celery Task Queue Setup

**Order of Operations**: Start these in order in separate terminal tabs or splits:

### 1. Start Celery Worker
```bash
celery -A app.celery_app worker --loglevel=info
```

### 2. Start Celery Beat (Task Scheduler)
```bash
celery -A app.celery_app beat --loglevel=info
```

## Miscellaneous

### Clear Identifier File (WSL)
To clear the identifier file in WSL, go to:
`c:\Users\ansh1\Documents\Desktop\quiz celery\lis.txt`
