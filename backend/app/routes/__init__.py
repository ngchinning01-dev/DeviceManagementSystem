from app.routes.branches import branches_bp
from app.routes.dashboard import dashboard_bp
from app.routes.devices import devices_bp
from app.routes.maintenance import maintenance_bp
from app.routes.users import users_bp


def register_blueprints(app):
    app.register_blueprint(branches_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(dashboard_bp)
