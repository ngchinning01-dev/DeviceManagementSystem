import io

import openpyxl
from flask import Blueprint, jsonify, request, send_file

from app.extensions import db
from app.models import Device, Maintenance
from app.utils.dates import parse_date
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows
from app.utils.id_gen import next_id

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')


@maintenance_bp.get('')
def list_maintenance():
    query = Maintenance.query

    device_id = request.args.get('device_id')
    if device_id:
        query = query.filter_by(device_id=device_id)

    if request.args.get('open', '').lower() in ('true', '1', 'yes'):
        query = query.filter(Maintenance.solution.is_(None))

    records = query.order_by(Maintenance.date.desc()).all()
    return jsonify([m.to_dict() for m in records])


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


@maintenance_bp.get('/<maintenance_id>')
def get_maintenance(maintenance_id):
    record = db.get_or_404(Maintenance, maintenance_id)
    return jsonify(record.to_dict())


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

    maintenance_id = (data.get('maintenance_id') or '').strip() or None
    if maintenance_id is None:
        maintenance_id = next_id([m.maintenance_id for m in Maintenance.query.all()])
    elif db.session.get(Maintenance, maintenance_id):
        return jsonify({'error': f"ID '{maintenance_id}' already exists"}), 409

    record = Maintenance(
        maintenance_id=maintenance_id,
        device_id=data['device_id'],
        issue=data['issue'],
        solution=data.get('solution') or None,
        **({'date': record_date} if record_date else {}),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@maintenance_bp.put('/<maintenance_id>')
def update_maintenance(maintenance_id):
    record = db.get_or_404(Maintenance, maintenance_id)
    data = request.get_json() or {}

    if 'issue' in data:
        record.issue = data['issue']
    if 'solution' in data:
        record.solution = data['solution'] or None

    if 'date' in data:
        try:
            record.date = parse_date(data['date'])
        except ValueError:
            return jsonify({'error': 'date must be in YYYY-MM-DD format'}), 400

    db.session.commit()
    return jsonify(record.to_dict())


@maintenance_bp.delete('/<maintenance_id>')
def delete_maintenance(maintenance_id):
    record = db.get_or_404(Maintenance, maintenance_id)
    db.session.delete(record)
    db.session.commit()
    return '', 204


@maintenance_bp.post('/import')
def import_maintenance():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(file.stream, required_headers=['Device ID', 'Issue'])

        existing_ids = [m.maintenance_id for m in Maintenance.query.all()]
        seen_ids = set(existing_ids)
        valid_device_ids = {d.device_id for d in Device.query.all()}

        errors = []
        imported = 0
        for row_number, record in rows:
            device_id = normalize_str(record.get('device id'))
            issue = normalize_str(record.get('issue'))

            if not device_id or not issue:
                errors.append((row_number, 'Device ID and Issue are required'))
                continue

            if device_id not in valid_device_ids:
                errors.append((row_number, f"device ID '{device_id}' not found"))
                continue

            date_value = record.get('date')
            record_date = None
            if date_value not in (None, ''):
                try:
                    record_date = parse_date(date_value)
                except ValueError:
                    errors.append((row_number, 'Date must be in YYYY-MM-DD format'))
                    continue

            maintenance_id_col = normalize_str(record.get('maintenance id'))
            if maintenance_id_col:
                if maintenance_id_col in seen_ids:
                    errors.append((row_number, f"ID '{maintenance_id_col}' already exists"))
                    continue
                maintenance_id = maintenance_id_col
            else:
                maintenance_id = next_id(existing_ids)

            seen_ids.add(maintenance_id)
            existing_ids.append(maintenance_id)
            db.session.add(
                Maintenance(
                    maintenance_id=maintenance_id,
                    device_id=device_id,
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
