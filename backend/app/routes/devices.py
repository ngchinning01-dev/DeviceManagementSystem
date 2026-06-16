from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Branch, Device, User
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows

# CRUD API for devices (/api/devices).
devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')


# List devices, optionally filtered by branch_id and/or status query params.
@devices_bp.get('')
def list_devices():
    query = Device.query

    branch_id = request.args.get('branch_id', type=int)
    if branch_id is not None:
        query = query.filter_by(branch_id=branch_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    assigned_user_id = request.args.get('assigned_user_id', type=int)
    if assigned_user_id is not None:
        query = query.filter_by(assigned_user_id=assigned_user_id)

    devices = query.order_by(Device.device_id).all()
    return jsonify([d.to_dict() for d in devices])


# Get a single device by ID.
@devices_bp.get('/<int:device_id>')
def get_device(device_id):
    device = db.get_or_404(Device, device_id)
    return jsonify(device.to_dict())


# Create a new device, validating that its branch and (optional) assigned user exist.
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


# Update device fields, re-validating branch/assigned user if those are changed.
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


# Delete a device (and its maintenance records, via cascade).
@devices_bp.delete('/<int:device_id>')
def delete_device(device_id):
    device = db.get_or_404(Device, device_id)
    db.session.delete(device)
    db.session.commit()
    return '', 204


# Bulk-create devices from an uploaded .xlsx file. Columns: Device Name, Device Type,
# Serial Number, IP Address, Status, Branch Name, Assigned User Email. Branch Name and
# Assigned User Email are resolved to IDs by case-insensitive lookup.
@devices_bp.post('/import')
def import_devices():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(
            file.stream, required_headers=['Device Name', 'Device Type', 'Branch Name']
        )

        branches_by_name = {b.branch_name.lower(): b.branch_id for b in Branch.query.all()}
        users_by_email = {u.email.lower(): u.user_id for u in User.query.all()}

        errors = []
        imported = 0
        for row_number, record in rows:
            device_name = normalize_str(record.get('device name'))
            device_type = normalize_str(record.get('device type'))
            branch_name = normalize_str(record.get('branch name'))

            if not device_name or not device_type or not branch_name:
                errors.append((row_number, 'Device Name, Device Type, and Branch Name are required'))
                continue

            branch_id = branches_by_name.get(branch_name.lower())
            if branch_id is None:
                errors.append((row_number, f"branch '{branch_name}' not found"))
                continue

            assigned_user_id = None
            assigned_user_email = normalize_str(record.get('assigned user email'))
            if assigned_user_email:
                assigned_user_id = users_by_email.get(assigned_user_email.lower())
                if assigned_user_id is None:
                    errors.append((row_number, f"assigned user email '{assigned_user_email}' not found"))
                    continue

            db.session.add(
                Device(
                    device_name=device_name,
                    device_type=device_type,
                    serial_number=normalize_str(record.get('serial number')),
                    ip_address=normalize_str(record.get('ip address')),
                    status=normalize_str(record.get('status')) or 'Active',
                    branch_id=branch_id,
                    assigned_user_id=assigned_user_id,
                )
            )
            imported += 1
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    db.session.commit()
    return jsonify(build_import_response(imported, errors))
