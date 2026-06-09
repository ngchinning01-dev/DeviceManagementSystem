from flask import Flask
from flask_cors import CORS

from app.extensions import db
from app.routes import register_blueprints
from config import Config


def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    register_blueprints(app)

    @app.get('/api/health')
    def health_check():
        return {'status': 'ok'}

    with app.app_context():
        db.create_all()

    return app
