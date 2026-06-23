# Cabio Sales OS - Backend

FastAPI backend for Cabio Sales OS.

## Prerequisites

- Python 3.11+ (see note below)
- PostgreSQL 16 (via Supabase)

> **Python version note:** Architecture baseline targets Python 3.13.
> Current implementation has been validated on Python 3.11.9
> for local development compatibility.
> Future environments should standardize on Python 3.13
> unless otherwise approved.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -e ".[dev]"
```

## Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `APP_ENV` | `development`, `staging`, or `production` |
| `DATABASE_URL` | PostgreSQL connection string (Supabase direct connection) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for token validation |
| `CORS_ORIGINS` | JSON array of allowed origins |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING`, or `ERROR` |

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/api/v1/docs`

## Test

```bash
pytest
```

## Lint

```bash
ruff check .
ruff format .
```
