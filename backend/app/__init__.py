from flask import Flask
from flask_cors import CORS

from app.extensions import db
from app.routes import register_blueprints
from config import Config


# Flask application factory: wires up config, database, CORS, and API routes.
def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    db.init_app(app)
    # Allow the frontend (running on a different origin/port) to call the API.
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    register_blueprints(app)

    @app.get('/api/health')
    def health_check():
        return {'status': 'ok'}

    # Create database tables on startup if they don't already exist.
    with app.app_context():
        db.create_all()
        from sqlalchemy import text
        for stmt in [
            "ALTER TABLE devices ADD COLUMN purchase_date DATE",
            "ALTER TABLE devices ADD COLUMN warranty_expiry DATE",
            "ALTER TABLE devices ADD COLUMN cost REAL",
        ]:
            try:
                db.session.execute(text(stmt))
                db.session.commit()
            except Exception:
                db.session.rollback()

    return app
