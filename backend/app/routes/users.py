from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import User

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


@users_bp.get('')
def list_users():
    users = User.query.order_by(User.user_id).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.get('/<int:user_id>')
def get_user(user_id):
    user = db.get_or_404(User, user_id)
    return jsonify(user.to_dict())


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


@users_bp.put('/<int:user_id>')
def update_user(user_id):
    user = db.get_or_404(User, user_id)
    data = request.get_json() or {}

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.department = data.get('department', user.department)
    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.delete('/<int:user_id>')
def delete_user(user_id):
    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
