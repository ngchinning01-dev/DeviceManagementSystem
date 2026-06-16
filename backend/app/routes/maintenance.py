import io

import openpyxl
from flask import Blueprint, jsonify, request, send_file

from app.extensions import db
from app.models import Device, Maintenance
from app.utils.dates import parse_date
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows

# CRUD API for maintenance records (/api/maintenance).
maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')


# List maintenance records (most recent first), optionally filtered by device_id.
@maintenance_bp.get('')
def list_maintenance():
    query = Maintenance.query

    device_id = request.args.get('device_id', type=int)
    if device_id is not None:
        query = query.filter_by(device_id=device_id)

    if request.args.get('open', '').lower() in ('true', '1', 'yes'):
        query = query.filter(Maintenance.solution.is_(None))

    records = query.order_by(Maintenance.date.desc()).all()
    return jsonify([m.to_dict() for m in records])


# Get a single maintenance record by ID.
@maintenance_bp.get('/<int:maintenance_id>')
def get_maintenance(maintenance_id):
    record = db.get_or_404(Maintenance, maintenance_id)
    return jsonify(record.to_dict())


# Create a new maintenance record for an existing device.
@maintenance_bp.post('')
def create_maintenance():
    data = request.get_json() or {}

    if not data.get('device_id') or not data.get('issue'):
        return jsonify({'error': 'device_id and issue are required'}), 400

    if not db.session.get(Device, data['device_id']):
        return jsonify({'error': 'device_id does not refer to an existing device'}), 400

    try:
        record_date = parse_date(data['date']) if data.get('date') else None
    except ValueError:
        return jsonify({'error': 'date must be in YYYY-MM-DD format'}), 400

    record = Maintenance(
        device_id=data['device_id'],
        issue=data['issue'],
        solution=data.get('solution'),
        **({'date': record_date} if record_date else {}),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


# Update an existing maintenance record's issue, solution, and/or date.
@maintenance_bp.put('/<int:maintenance_id>')
def update_maintenance(maintenance_id):
    record = db.get_or_404(Maintenance, maintenance_id)
    data = request.get_json() or {}

    for field in ('issue', 'solution'):
        if field in data:
            setattr(record, field, data[field])

    if 'date' in data:
        try:
            record.date = parse_date(data['date'])
        except ValueError:
            return jsonify({'error': 'date must be in YYYY-MM-DD format'}), 400

    db.session.commit()
    return jsonify(record.to_dict())


# Delete a maintenance record.
@maintenance_bp.delete('/<int:maintenance_id>')
def delete_maintenance(maintenance_id):
    record = db.get_or_404(Maintenance, maintenance_id)
    db.session.delete(record)
    db.session.commit()
    return '', 204


# Bulk-create maintenance records from an uploaded .xlsx file. Columns: Issue, Solution,
# Date, Device Serial Number, Device Name. Each row must identify its device by serial
# number (preferred) or, if blank, by a uniquely-matching device name.
@maintenance_bp.post('/import')
def import_maintenance():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(file.stream, required_headers=['Issue'])

        devices_by_serial = {}
        devices_by_name = {}
        for device in Device.query.all():
            if device.serial_number:
                devices_by_serial[device.serial_number.lower()] = device
            devices_by_name.setdefault(device.device_name.lower(), []).append(device)

        errors = []
        imported = 0
        for row_number, record in rows:
            issue = normalize_str(record.get('issue'))
            if not issue:
                errors.append((row_number, 'Issue is required'))
                continue

            serial_number = normalize_str(record.get('device serial number'))
            device_name = normalize_str(record.get('device name'))

            device = None
            if serial_number:
                device = devices_by_serial.get(serial_number.lower())
                if device is None:
                    errors.append((row_number, f"device with serial number '{serial_number}' not found"))
                    continue
            elif device_name:
                matches = devices_by_name.get(device_name.lower(), [])
                if not matches:
                    errors.append((row_number, f"device '{device_name}' not found"))
                    continue
                if len(matches) > 1:
                    errors.append(
                        (row_number, f"multiple devices named '{device_name}' found; specify Device Serial Number")
                    )
                    continue
                device = matches[0]
            else:
                errors.append((row_number, 'Device Serial Number or Device Name is required'))
                continue

            date_value = record.get('date')
            record_date = None
            if date_value not in (None, ''):
                try:
                    record_date = parse_date(date_value)
                except ValueError:
                    errors.append((row_number, 'Date must be in YYYY-MM-DD format'))
                    continue

            db.session.add(
                Maintenance(
                    device_id=device.device_id,
                    issue=issue,
                    solution=normalize_str(record.get('solution')),
                    **({'date': record_date} if record_date else {}),
                )
            )
            imported += 1
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    db.session.commit()
    return jsonify(build_import_response(imported, errors))


# Export all maintenance records as a downloadable .xlsx file.
@maintenance_bp.get('/export')
def export_maintenance():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Maintenance'
    ws.append(['ID', 'Device Name', 'Device Serial Number', 'Issue', 'Solution', 'Date'])
    for m in Maintenance.query.order_by(Maintenance.date.desc()).all():
        info = m.to_dict()
        device = db.session.get(Device, m.device_id)
        ws.append([
            m.maintenance_id, info['device_name'], device.serial_number if device else None,
            m.issue, m.solution, str(m.date) if m.date else None,
        ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='maintenance.xlsx',
    )
