from flask import Blueprint, jsonify, request

from app.models import Admin
from app.utils.auth import generate_token, require_auth

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.post('/login')
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    return jsonify({'token': generate_token(admin.id)})


@auth_bp.get('/me')
@require_auth
def me():
    return jsonify({'ok': True})
