class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class localdevelopmentConfig(Config):
    # here is the configuration for db 
    SQLALCHEMY_DATABASE_URI = "sqlite:///quizmasterdb.sqlite3"
    DEBUG = True 

    #Configuration for security 
    SECRET_KEY = "this-is-a-secret-key" # Hash user credintials and store in sessions.
    SECURITY_PASSWORD_HASH = "bcrypt" # Mechanism to hash credentials and store in databases.
    SECURITY_PASSWORD_SALT = "this-is-a-secret-key" # this is a string that is used to hash the user credentials to store in databases by security-password_hash mechanism.
    WTF_CSRF_ENABLED = False # Only for forms (frontend) ( set it true when u will add frontend for now it will be false ).
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token" # name u will be refrencening your aunthetication token .
    
    # Cache config
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT  = 6379
    CACHE_REDIS_DB = 0
    CACHE_DEFAULT_TIMEOUT = 50    #for 50 secconds
    
    
    # Flask-Mail config (for MailHog)
    MAIL_SERVER = 'localhost'
    MAIL_PORT = 1025
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_USERNAME = ''
    MAIL_PASSWORD = ''
    MAIL_DEFAULT_SENDER = 'admin@quizmaster.com'