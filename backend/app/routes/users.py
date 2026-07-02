import io

import openpyxl
from flask import Blueprint, jsonify, request, send_file

from app.extensions import db
from app.models import User
from app.utils.auth import require_auth
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows
from app.utils.id_gen import next_id

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


@users_bp.get('')
@require_auth
def list_users():
    users = User.query.order_by(User.user_id).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.get('/export')
@require_auth
def export_users():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Users'
    ws.append(['User ID', 'Name', 'Email', 'Department'])
    for u in User.query.order_by(User.user_id).all():
        ws.append([u.user_id, u.name, u.email, u.department])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='users.xlsx',
    )


@users_bp.get('/<user_id>')
@require_auth
def get_user(user_id):
    user = db.get_or_404(User, user_id)
    return jsonify(user.to_dict())


@users_bp.post('')
@require_auth
def create_user():
    data = request.get_json() or {}
    if not data.get('name') or not data.get('email'):
        return jsonify({'error': 'name and email are required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'a user with this email already exists'}), 409

    user_id = (data.get('user_id') or '').strip() or None
    if user_id is None:
        user_id = next_id([u.user_id for u in User.query.all()])
    elif db.session.get(User, user_id):
        return jsonify({'error': f"ID '{user_id}' already exists"}), 409

    user = User(user_id=user_id, name=data['name'], email=data['email'], department=data.get('department'))
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@users_bp.put('/<user_id>')
@require_auth
def update_user(user_id):
    user = db.get_or_404(User, user_id)
    data = request.get_json() or {}

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.department = data.get('department', user.department)
    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.delete('/<user_id>')
@require_auth
def delete_user(user_id):
    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204


@users_bp.post('/import')
@require_auth
def import_users():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(file.stream, required_headers=['Name', 'Email'])

        existing_ids = [u.user_id for u in User.query.all()]
        seen_ids = set(existing_ids)
        existing_emails = {email.lower() for (email,) in db.session.query(User.email).all()}
        seen_emails = {}
        errors = []
        imported = 0
        for row_number, record in rows:
            name = normalize_str(record.get('name'))
            email = normalize_str(record.get('email'))

            if not name or not email:
                errors.append((row_number, 'Name and Email are required'))
                continue

            email_key = email.lower()
            if email_key in existing_emails:
                errors.append((row_number, f"a user with email '{email}' already exists"))
                continue
            if email_key in seen_emails:
                errors.append(
                    (row_number, f"duplicate email '{email}' (already imported at row {seen_emails[email_key]})")
                )
                continue

            user_id_col = normalize_str(record.get('user id'))
            if user_id_col:
                if user_id_col in seen_ids:
                    errors.append((row_number, f"ID '{user_id_col}' already exists"))
                    continue
                user_id = user_id_col
            else:
                user_id = next_id(existing_ids)

            seen_ids.add(user_id)
            existing_ids.append(user_id)
            db.session.add(
                User(user_id=user_id, name=name, email=email, department=normalize_str(record.get('department')))
            )
            seen_emails[email_key] = row_number
            imported += 1
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    db.session.commit()
    return jsonify(build_import_response(imported, errors))
