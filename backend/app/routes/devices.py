import io

import openpyxl
from flask import Blueprint, jsonify, request, send_file

from app.extensions import db
from app.models import Branch, Device, User
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows
from app.utils.id_gen import next_id

devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')


@devices_bp.get('')
def list_devices():
    query = Device.query

    branch_id = request.args.get('branch_id')
    if branch_id:
        query = query.filter_by(branch_id=branch_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    assigned_user_id = request.args.get('assigned_user_id')
    if assigned_user_id:
        query = query.filter_by(assigned_user_id=assigned_user_id)

    devices = query.order_by(Device.device_id).all()
    return jsonify([d.to_dict() for d in devices])


@devices_bp.get('/export')
def export_devices():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Devices'
    ws.append(['Device ID', 'Device Name', 'Device Type', 'Serial Number', 'IP Address',
               'Status', 'Branch ID', 'Assigned User ID'])
    for d in Device.query.order_by(Device.device_id).all():
        ws.append([
            d.device_id, d.device_name, d.device_type, d.serial_number, d.ip_address,
            d.status, d.branch_id, d.assigned_user_id,
        ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='devices.xlsx',
    )


@devices_bp.get('/<device_id>')
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

    assigned_user_id = data.get('assigned_user_id') or None
    if assigned_user_id and not db.session.get(User, assigned_user_id):
        return jsonify({'error': 'assigned_user_id does not refer to an existing user'}), 400

    device_id = (data.get('device_id') or '').strip() or None
    if device_id is None:
        device_id = next_id([d.device_id for d in Device.query.all()])
    elif db.session.get(Device, device_id):
        return jsonify({'error': f"ID '{device_id}' already exists"}), 409

    device = Device(
        device_id=device_id,
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


@devices_bp.put('/<device_id>')
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
        assigned_user_id = data['assigned_user_id'] or None
        if assigned_user_id and not db.session.get(User, assigned_user_id):
            return jsonify({'error': 'assigned_user_id does not refer to an existing user'}), 400
        device.assigned_user_id = assigned_user_id

    db.session.commit()
    return jsonify(device.to_dict())


@devices_bp.delete('/<device_id>')
def delete_device(device_id):
    device = db.get_or_404(Device, device_id)
    db.session.delete(device)
    db.session.commit()
    return '', 204


@devices_bp.post('/import')
def import_devices():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(
            file.stream, required_headers=['Device Name', 'Device Type', 'Branch ID']
        )

        existing_ids = [d.device_id for d in Device.query.all()]
        seen_ids = set(existing_ids)
        valid_branch_ids = {b.branch_id for b in Branch.query.all()}
        valid_user_ids = {u.user_id for u in User.query.all()}

        errors = []
        imported = 0
        for row_number, record in rows:
            device_name = normalize_str(record.get('device name'))
            device_type = normalize_str(record.get('device type'))
            branch_id = normalize_str(record.get('branch id'))

            if not device_name or not device_type or not branch_id:
                errors.append((row_number, 'Device Name, Device Type, and Branch ID are required'))
                continue

            if branch_id not in valid_branch_ids:
                errors.append((row_number, f"branch ID '{branch_id}' not found"))
                continue

            assigned_user_id = normalize_str(record.get('assigned user'))
            if assigned_user_id:
                if assigned_user_id not in valid_user_ids:
                    errors.append((row_number, f"user ID '{assigned_user_id}' not found"))
                    continue
            else:
                assigned_user_id = None

            device_id_col = normalize_str(record.get('device id'))
            if device_id_col:
                if device_id_col in seen_ids:
                    errors.append((row_number, f"ID '{device_id_col}' already exists"))
                    continue
                device_id = device_id_col
            else:
                device_id = next_id(existing_ids)

            seen_ids.add(device_id)
            existing_ids.append(device_id)
            db.session.add(
                Device(
                    device_id=device_id,
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
