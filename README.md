# Cabio Sales OS

A target-driven sales operating system for Calicut Bio Medicals. Built to manage the full
sales cycle — account coverage planning, opportunity pipeline, project tracking, and
installed base — across two Strategic Business Units (Imaging and Critical Care).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Backend | FastAPI + SQLAlchemy (Python 3.13) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth + JWT |

## Monorepo Structure

```
Calicut_Bio_Medicals/
  backend/          ← FastAPI API server
  sales-os-app/     ← React frontend
  docs/             ← Living reference documentation
  docs/ARCHIVE/     ← Completed process documents
```

## Getting Started

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env   # fill in Supabase credentials
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd sales-os-app
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev
```

Backend API docs: `http://localhost:8000/api/v1/docs`  
Frontend: `http://localhost:5173`

## Key Documentation

| Document | Purpose |
|---|---|
| `docs/Cabio Sales OS – Phase 1 - PRD.md` | Product vision and requirements |
| `docs/ADR.md` | Why architectural decisions were made |
| `docs/Business-Rules.md` | What the system enforces |
| `docs/Enterprise-Data-Model.md` | Entity relationships |
| `docs/Physical-Schema.sql` | Authoritative database schema |
| `backend/README.md` | Backend architecture, patterns, conventions |
| `sales-os-app/README.md` | Frontend architecture, patterns, conventions |
