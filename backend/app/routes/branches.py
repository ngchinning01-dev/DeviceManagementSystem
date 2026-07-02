import io

import openpyxl
from flask import Blueprint, jsonify, request, send_file

from app.extensions import db
from app.models import Branch
from app.utils.auth import require_auth
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows
from app.utils.id_gen import next_id

branches_bp = Blueprint('branches', __name__, url_prefix='/api/branches')


@branches_bp.get('')
@require_auth
def list_branches():
    branches = Branch.query.order_by(Branch.branch_id).all()
    return jsonify([b.to_dict() for b in branches])


@branches_bp.get('/export')
@require_auth
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


@branches_bp.get('/<branch_id>')
@require_auth
def get_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    return jsonify(branch.to_dict())


@branches_bp.post('')
@require_auth
def create_branch():
    data = request.get_json() or {}
    if not data.get('branch_name'):
        return jsonify({'error': 'branch_name is required'}), 400

    branch_id = (data.get('branch_id') or '').strip() or None
    if branch_id is None:
        branch_id = next_id([b.branch_id for b in Branch.query.all()])
    elif db.session.get(Branch, branch_id):
        return jsonify({'error': f"ID '{branch_id}' already exists"}), 409

    branch = Branch(branch_id=branch_id, branch_name=data['branch_name'], location=data.get('location'))
    db.session.add(branch)
    db.session.commit()
    return jsonify(branch.to_dict()), 201


@branches_bp.put('/<branch_id>')
@require_auth
def update_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    data = request.get_json() or {}

    branch.branch_name = data.get('branch_name', branch.branch_name)
    branch.location = data.get('location', branch.location)
    db.session.commit()
    return jsonify(branch.to_dict())


@branches_bp.delete('/<branch_id>')
@require_auth
def delete_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    db.session.delete(branch)
    db.session.commit()
    return '', 204


@branches_bp.post('/import')
@require_auth
def import_branches():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(file.stream, required_headers=['Branch Name'])

        existing_ids = [b.branch_id for b in Branch.query.all()]
        seen_ids = set(existing_ids)
        errors = []
        imported = 0
        for row_number, record in rows:
            branch_name = normalize_str(record.get('branch name'))
            if not branch_name:
                errors.append((row_number, 'Branch Name is required'))
                continue

            branch_id_col = normalize_str(record.get('branch id'))
            if branch_id_col:
                if branch_id_col in seen_ids:
                    errors.append((row_number, f"ID '{branch_id_col}' already exists"))
                    continue
                branch_id = branch_id_col
            else:
                branch_id = next_id(existing_ids)

            seen_ids.add(branch_id)
            existing_ids.append(branch_id)
            db.session.add(
                Branch(branch_id=branch_id, branch_name=branch_name, location=normalize_str(record.get('location')))
            )
            imported += 1
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    db.session.commit()
    return jsonify(build_import_response(imported, errors))
