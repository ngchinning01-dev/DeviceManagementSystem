import io

import openpyxl
from flask import Blueprint, jsonify, request, send_file

from app.extensions import db
from app.models import Branch
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows

# CRUD API for branches (/api/branches).
branches_bp = Blueprint('branches', __name__, url_prefix='/api/branches')


# List all branches.
@branches_bp.get('')
def list_branches():
    branches = Branch.query.order_by(Branch.branch_id).all()
    return jsonify([b.to_dict() for b in branches])


# Get a single branch by ID.
@branches_bp.get('/<int:branch_id>')
def get_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    return jsonify(branch.to_dict())


# Create a new branch.
@branches_bp.post('')
def create_branch():
    data = request.get_json() or {}
    if not data.get('branch_name'):
        return jsonify({'error': 'branch_name is required'}), 400

    branch = Branch(branch_name=data['branch_name'], location=data.get('location'))
    db.session.add(branch)
    db.session.commit()
    return jsonify(branch.to_dict()), 201


# Update an existing branch's name/location.
@branches_bp.put('/<int:branch_id>')
def update_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    data = request.get_json() or {}

    branch.branch_name = data.get('branch_name', branch.branch_name)
    branch.location = data.get('location', branch.location)
    db.session.commit()
    return jsonify(branch.to_dict())


# Delete a branch (and its devices, via cascade).
@branches_bp.delete('/<int:branch_id>')
def delete_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    db.session.delete(branch)
    db.session.commit()
    return '', 204


# Bulk-create branches from an uploaded .xlsx file (columns: Branch Name, Location).
@branches_bp.post('/import')
def import_branches():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(file.stream, required_headers=['Branch Name'])

        errors = []
        imported = 0
        for row_number, record in rows:
            branch_name = normalize_str(record.get('branch name'))
            if not branch_name:
                errors.append((row_number, 'Branch Name is required'))
                continue

            db.session.add(Branch(branch_name=branch_name, location=normalize_str(record.get('location'))))
            imported += 1
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    db.session.commit()
    return jsonify(build_import_response(imported, errors))


# Export all branches as a downloadable .xlsx file.
@branches_bp.get('/export')
def export_branches():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Branches'
    ws.append(['Branch ID', 'Branch Name', 'Location'])
    for b in Branch.query.order_by(Branch.branch_id).all():
        ws.append([b.branch_id, b.branch_name, b.location])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='branches.xlsx',
    )
