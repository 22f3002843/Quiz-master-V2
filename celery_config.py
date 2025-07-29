from celery.schedules import crontab

broker_url = 'redis://localhost:6379/1'
result_backend = 'redis://localhost:6379/2'
timezone = 'Asia/Kolkata'
beat_schedule = {
    'send-daily-quiz-reminders': {
        'task': 'application.routes.send_daily_quiz_reminders',
        'schedule': crontab(hour=18, minute=0),  # 6 PM daily reminder
    },
    'send-monthly-activity-report': {
        'task': 'application.routes.send_monthly_activity_report',
        'schedule': crontab(hour=9, minute=0, day_of_month=1),  #  will send at 9 AM  on the 1st
    },
}