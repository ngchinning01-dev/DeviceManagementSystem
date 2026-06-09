from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Branch, Device, User

devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')


@devices_bp.get('')
def list_devices():
    query = Device.query

    branch_id = request.args.get('branch_id', type=int)
    if branch_id is not None:
        query = query.filter_by(branch_id=branch_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    devices = query.order_by(Device.device_id).all()
    return jsonify([d.to_dict() for d in devices])


@devices_bp.get('/<int:device_id>')
def get_device(device_id):
    device = db.get_or_404(Device, device_id)
    return jsonify(device.to_dict())


@devices_bp.post('')
def create_device():
    data = request.get_json() or {}

    required = ('device_name', 'device_type', 'branch_id')
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({'error': f"missing required field(s): {', '.join(missing)}"}), 400

    if not db.session.get(Branch, data['branch_id']):
        return jsonify({'error': 'branch_id does not refer to an existing branch'}), 400

    assigned_user_id = data.get('assigned_user_id')
    if assigned_user_id and not db.session.get(User, assigned_user_id):
        return jsonify({'error': 'assigned_user_id does not refer to an existing user'}), 400

    device = Device(
        device_name=data['device_name'],
        device_type=data['device_type'],
        serial_number=data.get('serial_number'),
        ip_address=data.get('ip_address'),
        status=data.get('status', 'Active'),
        branch_id=data['branch_id'],
        assigned_user_id=assigned_user_id,
    )
    db.session.add(device)
    db.session.commit()
    return jsonify(device.to_dict()), 201


@devices_bp.put('/<int:device_id>')
def update_device(device_id):
    device = db.get_or_404(Device, device_id)
    data = request.get_json() or {}

    for field in ('device_name', 'device_type', 'serial_number', 'ip_address', 'status'):
        if field in data:
            setattr(device, field, data[field])

    if 'branch_id' in data:
        if not db.session.get(Branch, data['branch_id']):
            return jsonify({'error': 'branch_id does not refer to an existing branch'}), 400
        device.branch_id = data['branch_id']

    if 'assigned_user_id' in data:
        assigned_user_id = data['assigned_user_id']
        if assigned_user_id and not db.session.get(User, assigned_user_id):
            return jsonify({'error': 'assigned_user_id does not refer to an existing user'}), 400
        device.assigned_user_id = assigned_user_id

    db.session.commit()
    return jsonify(device.to_dict())


@devices_bp.delete('/<int:device_id>')
def delete_device(device_id):
    device = db.get_or_404(Device, device_id)
    db.session.delete(device)
    db.session.commit()
    return '', 204
