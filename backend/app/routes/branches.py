from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Branch

branches_bp = Blueprint('branches', __name__, url_prefix='/api/branches')


@branches_bp.get('')
def list_branches():
    branches = Branch.query.order_by(Branch.branch_id).all()
    return jsonify([b.to_dict() for b in branches])


@branches_bp.get('/<int:branch_id>')
def get_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    return jsonify(branch.to_dict())


@branches_bp.post('')
def create_branch():
    data = request.get_json() or {}
    if not data.get('branch_name'):
        return jsonify({'error': 'branch_name is required'}), 400

    branch = Branch(branch_name=data['branch_name'], location=data.get('location'))
    db.session.add(branch)
    db.session.commit()
    return jsonify(branch.to_dict()), 201


@branches_bp.put('/<int:branch_id>')
def update_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    data = request.get_json() or {}

    branch.branch_name = data.get('branch_name', branch.branch_name)
    branch.location = data.get('location', branch.location)
    db.session.commit()
    return jsonify(branch.to_dict())


@branches_bp.delete('/<int:branch_id>')
def delete_branch(branch_id):
    branch = db.get_or_404(Branch, branch_id)
    db.session.delete(branch)
    db.session.commit()
    return '', 204
