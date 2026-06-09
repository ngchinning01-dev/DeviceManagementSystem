# AI-Powered Device Management System

A centralized web app for tracking devices, branches, user assignments, and
maintenance history across multiple branches (see `Project_Planning.md` for
the full spec).

- `backend/` — Flask REST API (app factory + blueprints, SQLAlchemy, SQLite for dev)
- `frontend/` — React + Vite SPA (Tailwind CSS, React Router, Axios)

## Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python run.py
```

The API runs at `http://localhost:5000/api`. SQLite tables are created
automatically on first run (`backend/instance/app.db`).

## Frontend setup

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and talks to the Flask API via
`VITE_API_BASE_URL` (defaults to `http://localhost:5000/api`).

## API overview

| Resource | Endpoints |
|---|---|
| Branches | `GET/POST /api/branches`, `GET/PUT/DELETE /api/branches/<id>` |
| Devices | `GET/POST /api/devices`, `GET/PUT/DELETE /api/devices/<id>` (filter by `?branch_id=` / `?status=`) |
| Users | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/<id>` |
| Maintenance | `GET/POST /api/maintenance`, `GET/PUT/DELETE /api/maintenance/<id>` (filter by `?device_id=`) |
| Dashboard | `GET /api/dashboard/summary` — totals, status breakdown, devices per branch |
| Health | `GET /api/health` |

## Next steps

- Add the AI Assistant features (natural-language search, troubleshooting)
  described in `Project_Planning.md` section 4.6, e.g. a `/api/assistant`
  blueprint that wraps an LLM API call.
- Add authentication for admin access.
- Switch `DATABASE_URL` to MySQL/PostgreSQL for production.
