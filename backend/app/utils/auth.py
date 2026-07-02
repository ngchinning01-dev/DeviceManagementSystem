import secrets
from functools import wraps

from flask import jsonify, request

# Generated once per server start. All logged-in clients share this token.
# If the server restarts, clients must log in again.
_SESSION_TOKEN = secrets.token_hex(32)


def generate_token(_admin_id):
    return _SESSION_TOKEN


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer ') or auth[7:] != _SESSION_TOKEN:
            return jsonify({'error': 'unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated
