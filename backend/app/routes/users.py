from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import User
from app.utils.excel_import import build_import_response, normalize_str, read_excel_rows

# CRUD API for users (/api/users).
users_bp = Blueprint('users', __name__, url_prefix='/api/users')


# List all users.
@users_bp.get('')
def list_users():
    users = User.query.order_by(User.user_id).all()
    return jsonify([u.to_dict() for u in users])


# Get a single user by ID.
@users_bp.get('/<int:user_id>')
def get_user(user_id):
    user = db.get_or_404(User, user_id)
    return jsonify(user.to_dict())


# Create a new user (email must be unique).
@users_bp.post('')
def create_user():
    data = request.get_json() or {}
    if not data.get('name') or not data.get('email'):
        return jsonify({'error': 'name and email are required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'a user with this email already exists'}), 409

    user = User(name=data['name'], email=data['email'], department=data.get('department'))
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


# Update an existing user's details.
@users_bp.put('/<int:user_id>')
def update_user(user_id):
    user = db.get_or_404(User, user_id)
    data = request.get_json() or {}

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.department = data.get('department', user.department)
    db.session.commit()
    return jsonify(user.to_dict())


# Delete a user.
@users_bp.delete('/<int:user_id>')
def delete_user(user_id):
    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204


# Bulk-create users from an uploaded .xlsx file (columns: Name, Email, Department).
@users_bp.post('/import')
def import_users():
    file = request.files.get('file')
    if not file or not file.filename.lower().endswith('.xlsx'):
        return jsonify({'error': 'an .xlsx file is required'}), 400

    try:
        rows = read_excel_rows(file.stream, required_headers=['Name', 'Email'])

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

            db.session.add(User(name=name, email=email, department=normalize_str(record.get('department'))))
            seen_emails[email_key] = row_number
            imported += 1
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    db.session.commit()
    return jsonify(build_import_response(imported, errors))
