QuizMaster App - README

This document provides instructions for setting up and running the QuizMaster application, including details for Redis and MailHog.
Running the Application
Open Project: Open the project folder in Visual Studio Code.
Open Terminal: Open a WSL terminal in VS Code.
Start Application: Run the following command to start the application:
python3 app.py


Access Development Server: After running the command, the development server will be available at:
http://127.0.0.1:5000
Administrator Login:
Email: admin@quizmaster.com
Password: admin123
Redis Server Setup
Install Redis:
sudo apt install redis-server -y


Start Redis Server:
redis-server

Stop Redis Server:
If the terminal is open: Press Ctrl+C
If the terminal is closed:
sudo service redis-server stop


Default Redis Port: Redis runs by default on: localhost:6379
MailHog (for Email Testing)
Start MailHog:
~/go/bin/MailHog


Access MailHog: MailHog will be accessible at:
http://localhost:8025
Celery Task Queue Setup
Order of Operations: Start these in order in separate terminal tabs or splits:
Start Celery Worker:
celery -A app.celery_app worker --loglevel=info


Start Celery Beat (Task Scheduler):
celery -A app.celery_app beat --loglevel=info


Miscellaneous
Clear Identifier File (WSL): To clear the identifier file in WSL, go to:
c:\Users\ansh1\Documents\Desktop\quiz celery\lis.txt
