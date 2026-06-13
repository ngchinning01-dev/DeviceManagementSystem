from datetime import datetime

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Device, Maintenance

# CRUD API for maintenance records (/api/maintenance).
maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')


# Parse a 'YYYY-MM-DD' string into a date object; raises ValueError if invalid.
def _parse_date(value):
    return datetime.strptime(value, '%Y-%m-%d').date()


# List maintenance records (most recent first), optionally filtered by device_id.
@maintenance_bp.get('')
def list_maintenance():
    query = Maintenance.query

    device_id = request.args.get('device_id', type=int)
    if device_id is not None:
        query = query.filter_by(device_id=device_id)

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
        record_date = _parse_date(data['date']) if data.get('date') else None
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
            record.date = _parse_date(data['date'])
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
