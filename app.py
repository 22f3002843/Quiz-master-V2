from flask import Flask
from application.database import db
from application.config import localdevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore, hash_password
from application.models import User, Role
from mailer import mail
from caching import cache

app = None

def create_celery(app):
    from celery import Celery
    celery = Celery(app.import_name)
    import celery_config
    celery.config_from_object(celery_config)
    return celery

def create_app():
    app = Flask(__name__)
    app.config.from_object(localdevelopmentConfig)
    db.init_app(app)
    
    # Initializing the cache
    cache.init_app(app)
    
    # Initializing the Flask-Mail
    mail.init_app(app)
    
    # Initialize Flask-Security
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    
  
    celery = create_celery(app)
    
 
    app.app_context().push()
    
    return app, celery

app, celery_app = create_app()

with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name="admin", description="This is an admin.")
    app.security.datastore.find_or_create_role(name="user", description="This is a user.")
    db.session.commit()

    if not app.security.datastore.find_user(email="admin@quizmaster.com"):
        app.security.datastore.create_user(
            email="admin@quizmaster.com",
            password=hash_password("admin123"),
            roles=["admin"])
    
    if not app.security.datastore.find_user(email="user@quizmaster.com"):
        app.security.datastore.create_user(
            email="user@quizmaster.com",
            password=hash_password("user123"),
            roles=["user"])
    
    db.session.commit()

from application.routes import *

if __name__ == "__main__":
    app.run(debug=True)