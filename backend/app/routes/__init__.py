from app.routes.auth import auth_bp
from app.routes.branches import branches_bp
from app.routes.dashboard import dashboard_bp
from app.routes.devices import devices_bp
from app.routes.maintenance import maintenance_bp
from app.routes.users import users_bp


# Registers all API blueprints (one per resource) on the Flask app.
def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(branches_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(dashboard_bp)
