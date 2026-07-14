from flask import Blueprint, g, jsonify, request

from app.extensions import db
from app.models import Admin, AdminSession
from app.utils.auth import generate_token, require_auth

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _admin_payload(admin):
    return {
        'id': admin.id,
        'username': admin.username,
        'is_admin': admin.is_admin,
        'permissions': {
            'read': admin.can_read,
            'add': admin.can_add,
            'edit': admin.can_edit,
            'delete': admin.can_delete,
        },
    }


@auth_bp.post('/login')
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    return jsonify({'token': generate_token(admin.id), 'admin': _admin_payload(admin)})


@auth_bp.get('/me')
@require_auth
def me():
    return jsonify(_admin_payload(g.current_admin))


@auth_bp.post('/logout')
@require_auth
def logout():
    token = request.headers.get('Authorization', '')[7:]
    AdminSession.query.filter_by(token=token).delete()
    db.session.commit()
    return '', 204
