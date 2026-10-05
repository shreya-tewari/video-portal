

**Stack:** FastAPI + SQLAlchemy 2.0 + PostgreSQL (Neon) · React + Vite + react-router-dom

---

## Quick Start (Windows PowerShell)

### 1 · Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Open .env and fill in DATABASE_URL, JWT_SECRET, FIRST_SUPERADMIN_EMAIL, FIRST_SUPERADMIN_PASSWORD

# Start the server (creates tables and seeds data on first run)
uvicorn app.main:app --reload
# → http://localhost:8000
# → API docs at http://localhost:8000/docs
```

### 2 · Frontend

Open a second PowerShell window:

```powershell
cd frontend
copy .env.example .env   # adjust VITE_API_URL if needed
npm install
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

### backend/.env

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL URL (`postgresql+psycopg://...?sslmode=require`) or `sqlite:///./app.db` | `sqlite:///./app.db` |
| `JWT_SECRET` | Long random secret for JWT signing | (required) |
| `ACCESS_TOKEN_MINUTES` | JWT expiry in minutes | `60` |
| `FIRST_SUPERADMIN_EMAIL` | Email of the seeded super admin | `admin@example.com` |
| `FIRST_SUPERADMIN_PASSWORD` | Password of the seeded super admin | (required) |
| `FRONTEND_ORIGIN` | CORS allowed origin | `http://localhost:5173` |

### frontend/.env

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend | `http://localhost:8000` |

---

## Running Tests

```powershell
cd backend
.venv\Scripts\Activate.ps1
pytest -v
```


---

#

---
