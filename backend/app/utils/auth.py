import secrets
from functools import wraps

from flask import g, jsonify, request

from app.extensions import db
from app.models import AdminSession

PERMISSION_COLUMNS = {
    'read': 'can_read',
    'add': 'can_add',
    'edit': 'can_edit',
    'delete': 'can_delete',
}


def generate_token(admin_id):
    """Create a new per-login session row and return its token."""
    token = secrets.token_hex(32)
    db.session.add(AdminSession(token=token, admin_id=admin_id))
    db.session.commit()
    return token


def _resolve_admin():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    session = AdminSession.query.filter_by(token=auth[7:]).first()
    return session.admin if session else None


def require_auth(f):
    """Resolve the caller's admin from their session token; no permission check."""
    @wraps(f)
    def decorated(*args, **kwargs):
        admin = _resolve_admin()
        if admin is None:
            return jsonify({'error': 'unauthorized'}), 401
        g.current_admin = admin
        return f(*args, **kwargs)
    return decorated


def require_permission(perm):
    """Resolve the caller and require the matching can_<perm> flag."""
    column = PERMISSION_COLUMNS[perm]

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            admin = _resolve_admin()
            if admin is None:
                return jsonify({'error': 'unauthorized'}), 401
            if not getattr(admin, column):
                return jsonify({'error': 'forbidden'}), 403
            g.current_admin = admin
            return f(*args, **kwargs)
        return decorated
    return decorator


def require_admin(f):
    """Resolve the caller and require is_admin=True (admin-management routes)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        admin = _resolve_admin()
        if admin is None:
            return jsonify({'error': 'unauthorized'}), 401
        if not admin.is_admin:
            return jsonify({'error': 'forbidden'}), 403
        g.current_admin = admin
        return f(*args, **kwargs)
    return decorated
