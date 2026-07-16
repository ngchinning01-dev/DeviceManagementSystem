# Application configuration, sourced from environment variables with local defaults.
import os

class Config:
    # Production (Railway)
    if os.getenv('FLASK_ENV') == 'production':
        SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    else:
        # Local dev
        SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')