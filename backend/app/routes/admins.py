# Admin-account management (/api/admins): create/update/delete login accounts
# and their is_admin/permission flags. All routes require is_admin=True.
# Guards against ever locking everyone out by refusing to strip admin status
# from, or delete, the last remaining admin account.
from flask import Blueprint, g, jsonify, request

from app.extensions import db
from app.models import Admin, AdminSession
from app.utils.auth import require_admin

admins_bp = Blueprint('admins', __name__, url_prefix='/api/admins')


def _payload(admin):
    return {
        'id': admin.id,
        'username': admin.username,
        'is_admin': admin.is_admin,
        'can_read': admin.can_read,
        'can_add': admin.can_add,
        'can_edit': admin.can_edit,
        'can_delete': admin.can_delete,
    }


def _admin_count():
    return Admin.query.filter_by(is_admin=True).count()


@admins_bp.get('')
@require_admin
def list_admins():
    admins = Admin.query.order_by(Admin.username).all()
    return jsonify([_payload(a) for a in admins])


@admins_bp.post('')
@require_admin
def create_admin():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    if Admin.query.filter_by(username=username).first():
        return jsonify({'error': f"username '{username}' already exists"}), 409

    admin = Admin(
        username=username,
        is_admin=bool(data.get('is_admin', False)),
        can_read=bool(data.get('can_read', False)),
        can_add=bool(data.get('can_add', False)),
        can_edit=bool(data.get('can_edit', False)),
        can_delete=bool(data.get('can_delete', False)),
    )
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    return jsonify(_payload(admin)), 201


@admins_bp.put('/<int:admin_id>')
@require_admin
def update_admin(admin_id):
    admin = db.get_or_404(Admin, admin_id)
    data = request.get_json() or {}

    if 'is_admin' in data and admin.is_admin and not data['is_admin'] and _admin_count() <= 1:
        return jsonify({'error': 'cannot remove admin status from the last remaining admin'}), 400

    for field in ('is_admin', 'can_read', 'can_add', 'can_edit', 'can_delete'):
        if field in data:
            setattr(admin, field, bool(data[field]))
    db.session.commit()

    # Force the target admin to re-authenticate so the change takes effect immediately.
    AdminSession.query.filter_by(admin_id=admin.id).delete()
    db.session.commit()
    return jsonify(_payload(admin))


@admins_bp.post('/<int:admin_id>/reset-password')
@require_admin
def reset_password(admin_id):
    admin = db.get_or_404(Admin, admin_id)
    new_password = (request.get_json() or {}).get('new_password') or ''
    if len(new_password) < 6:
        return jsonify({'error': 'new_password must be at least 6 characters'}), 400
    admin.set_password(new_password)
    AdminSession.query.filter_by(admin_id=admin.id).delete()
    db.session.commit()
    return jsonify({'ok': True})


@admins_bp.delete('/<int:admin_id>')
@require_admin
def delete_admin(admin_id):
    admin = db.get_or_404(Admin, admin_id)
    if admin.id == g.current_admin.id:
        return jsonify({'error': 'cannot delete your own account'}), 400
    if admin.is_admin and _admin_count() <= 1:
        return jsonify({'error': 'cannot delete the last remaining admin account'}), 400
    AdminSession.query.filter_by(admin_id=admin.id).delete()
    db.session.delete(admin)
    db.session.commit()
    return '', 204
