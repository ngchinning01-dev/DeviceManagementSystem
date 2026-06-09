from flask import Blueprint, jsonify

from app.extensions import db
from app.models import Branch, Device, Maintenance

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.get('/summary')
def summary():
    total_devices = db.session.query(Device).count()
    total_branches = db.session.query(Branch).count()
    active_devices = db.session.query(Device).filter_by(status='Active').count()
    open_maintenance = (
        db.session.query(Maintenance).filter(Maintenance.solution.is_(None)).count()
    )

    devices_by_status = dict(
        db.session.query(Device.status, db.func.count(Device.device_id))
        .group_by(Device.status)
        .all()
    )

    devices_by_branch = [
        {'branch_name': branch_name, 'device_count': device_count}
        for branch_name, device_count in (
            db.session.query(Branch.branch_name, db.func.count(Device.device_id))
            .outerjoin(Device, Device.branch_id == Branch.branch_id)
            .group_by(Branch.branch_id)
            .all()
        )
    ]

    return jsonify(
        {
            'total_devices': total_devices,
            'total_branches': total_branches,
            'active_devices': active_devices,
            'open_maintenance': open_maintenance,
            'devices_by_status': devices_by_status,
            'devices_by_branch': devices_by_branch,
        }
    )
