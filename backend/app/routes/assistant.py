import json
import os

import anthropic
from anthropic import beta_tool
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Branch, Device, Maintenance, User
from app.utils.auth import require_permission

assistant_bp = Blueprint('assistant', __name__, url_prefix='/api/assistant')

MODEL = 'claude-haiku-4-5'
MAX_RESULTS = 25

SYSTEM_PROMPT = (
    "You are an IT assistant embedded in a Device Management System covering "
    "branches, devices, employee assignments, and maintenance history. Use the "
    "provided tools to ground your answers in real data rather than guessing. "
    "For troubleshooting questions about a device, first check its maintenance "
    "history for related past issues via the tools; if nothing relevant is "
    "found, suggest likely general causes and next steps using your own IT "
    "knowledge. Be concise. You are read-only: you cannot create, edit, or "
    "delete any records. If asked to make a change, explain that and point the "
    "user to the relevant page in the app instead.\n\n"
    "Search tools (search_devices, search_branches, search_maintenance, "
    "search_users) only return up to a limited number of matching records and "
    "report 'truncated': true when there were more matches than shown. Never "
    "count or rank from a search tool's results — for any 'how many' or "
    "'which X has the most/fewest' question, use the dedicated counting tools "
    "(count_devices, devices_by_branch, devices_by_status) instead, since "
    "those always reflect the true totals."
)


def _wrap_results(items, total):
    returned = len(items)
    return json.dumps({
        'total_matches': total,
        'returned': returned,
        'truncated': returned < total,
        'results': items,
    })


@beta_tool
def search_devices(query: str = '', branch_id: str = '', status: str = '', device_type: str = '') -> str:
    """Search devices by free text and optional exact filters.

    Args:
        query: free-text search across device name, type, serial number, and IP address.
        branch_id: exact branch ID to filter by.
        status: exact status to filter by (Active, Inactive, Under Maintenance, Retired).
        device_type: exact device type to filter by (e.g. Laptop, Printer, Router).
    """
    q = Device.query
    if branch_id:
        q = q.filter_by(branch_id=branch_id)
    if status:
        q = q.filter_by(status=status)
    if device_type:
        q = q.filter_by(device_type=device_type)
    devices = q.order_by(Device.device_id).all()
    if query:
        needle = query.lower()
        devices = [
            d for d in devices
            if needle in d.device_name.lower()
            or needle in d.device_type.lower()
            or needle in (d.serial_number or '').lower()
            or needle in (d.ip_address or '').lower()
        ]
    return _wrap_results([d.to_dict() for d in devices[:MAX_RESULTS]], len(devices))


@beta_tool
def count_devices(branch_id: str = '', status: str = '', device_type: str = '') -> str:
    """Count devices matching optional exact filters. Always use this (not search_devices)
    for "how many devices..." questions, since search results can be truncated.

    Args:
        branch_id: exact branch ID to filter by.
        status: exact status to filter by (Active, Inactive, Under Maintenance, Retired).
        device_type: exact device type to filter by (e.g. Laptop, Printer, Router).
    """
    q = Device.query
    if branch_id:
        q = q.filter_by(branch_id=branch_id)
    if status:
        q = q.filter_by(status=status)
    if device_type:
        q = q.filter_by(device_type=device_type)
    return json.dumps({'count': q.count()})


@beta_tool
def devices_by_branch() -> str:
    """Get the number of devices at every branch, sorted from most to fewest devices.
    Always use this (not search_devices) for "which branch has the most/fewest
    devices" or "devices per branch" questions.
    """
    rows = (
        db.session.query(Branch.branch_id, Branch.branch_name, db.func.count(Device.device_id))
        .outerjoin(Device, Device.branch_id == Branch.branch_id)
        .group_by(Branch.branch_id)
        .order_by(db.func.count(Device.device_id).desc())
        .all()
    )
    return json.dumps([
        {'branch_id': branch_id, 'branch_name': branch_name, 'device_count': count}
        for branch_id, branch_name, count in rows
    ])


@beta_tool
def devices_by_status() -> str:
    """Get the number of devices in each status (Active, Inactive, Under Maintenance,
    Retired). Always use this (not search_devices) for "how many devices are
    active/retired/etc." questions.
    """
    rows = db.session.query(Device.status, db.func.count(Device.device_id)).group_by(Device.status).all()
    return json.dumps({status: count for status, count in rows})


@beta_tool
def get_device(device_id: str) -> str:
    """Get full details for one device by its exact ID, plus its recent maintenance history.

    Args:
        device_id: the exact device ID, e.g. DEV3000.
    """
    device = db.session.get(Device, device_id)
    if not device:
        return json.dumps({'error': f"no device with ID '{device_id}'"})
    records = (
        Maintenance.query.filter_by(device_id=device_id)
        .order_by(Maintenance.date.desc())
        .limit(10)
        .all()
    )
    return json.dumps({
        **device.to_dict(),
        'maintenance_history': [m.to_dict() for m in records],
    })


@beta_tool
def search_branches(query: str = '') -> str:
    """Search branches by name or location.

    Args:
        query: free-text search across branch name and location.
    """
    branches = Branch.query.order_by(Branch.branch_id).all()
    if query:
        needle = query.lower()
        branches = [
            b for b in branches
            if needle in b.branch_name.lower() or needle in (b.location or '').lower()
        ]
    return _wrap_results([b.to_dict() for b in branches[:MAX_RESULTS]], len(branches))


@beta_tool
def search_maintenance(device_id: str = '', query: str = '', open_only: bool = False) -> str:
    """Search maintenance/issue records, optionally for one device or matching text.

    Args:
        device_id: exact device ID to filter by.
        query: free-text search across issue and solution text.
        open_only: if true, only return unresolved (open) records.
    """
    q = Maintenance.query
    if device_id:
        q = q.filter_by(device_id=device_id)
    if open_only:
        q = q.filter(Maintenance.solution.is_(None))
    records = q.order_by(Maintenance.date.desc()).all()
    if query:
        needle = query.lower()
        records = [
            m for m in records
            if needle in m.issue.lower() or needle in (m.solution or '').lower()
        ]
    return _wrap_results([m.to_dict() for m in records[:MAX_RESULTS]], len(records))


@beta_tool
def count_maintenance(device_id: str = '', open_only: bool = False) -> str:
    """Count maintenance/issue records matching optional filters. Always use this
    (not search_maintenance) for "how many issues/maintenance records..." questions.

    Args:
        device_id: exact device ID to filter by.
        open_only: if true, only count unresolved (open) records.
    """
    q = Maintenance.query
    if device_id:
        q = q.filter_by(device_id=device_id)
    if open_only:
        q = q.filter(Maintenance.solution.is_(None))
    return json.dumps({'count': q.count()})


@beta_tool
def search_users(query: str = '', department: str = '') -> str:
    """Search employee records that devices can be assigned to, by name/email or department.

    Args:
        query: free-text search across name and email.
        department: exact department to filter by.
    """
    q = User.query
    if department:
        q = q.filter_by(department=department)
    users = q.order_by(User.user_id).all()
    if query:
        needle = query.lower()
        users = [
            u for u in users
            if needle in u.name.lower() or needle in u.email.lower()
        ]
    return _wrap_results([u.to_dict() for u in users[:MAX_RESULTS]], len(users))


TOOLS = [
    search_devices,
    count_devices,
    devices_by_branch,
    devices_by_status,
    get_device,
    search_branches,
    search_maintenance,
    count_maintenance,
    search_users,
]


@assistant_bp.post('/chat')
@require_permission('read')
def chat():
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        return jsonify({'error': 'AI assistant is not configured (missing ANTHROPIC_API_KEY)'}), 503

    data = request.get_json() or {}
    history = data.get('messages') or []
    if not history:
        return jsonify({'error': 'messages is required'}), 400

    messages = [{'role': m.get('role'), 'content': m.get('content')} for m in history]

    client = anthropic.Anthropic(api_key=api_key)
    try:
        runner = client.beta.messages.tool_runner(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )
        final_message = None
        for message in runner:
            final_message = message
    except anthropic.AuthenticationError:
        return jsonify({'error': 'AI assistant authentication failed (check ANTHROPIC_API_KEY)'}), 502
    except anthropic.RateLimitError:
        return jsonify({'error': 'AI assistant is rate-limited, please try again shortly'}), 502
    except anthropic.APIConnectionError:
        return jsonify({'error': 'could not reach the AI assistant service'}), 502
    except anthropic.APIStatusError as exc:
        return jsonify({'error': f'AI assistant request failed: {exc.message}'}), 502

    reply = next((b.text for b in final_message.content if b.type == 'text'), '') if final_message else ''
    return jsonify({'reply': reply})
