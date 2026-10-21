"""Write the backend's OpenAPI document to a file, from the code on disk.

Usage: python scripts/export_openapi.py OUT.json [BACKEND_DIR]
BACKEND_DIR defaults to this repo's backend/. Run with backend/.venv's
python. `npm run generate:types` and .githooks/check-api-types.sh use it.

Why (2026-10-20, Progress-Archive-2026-10): `api.ts` used to be built from
the running server, so it was skipped when the server was down and once
copied another session's unfinished change. This reads the code instead.
Placeholder settings are set so no secret is read and nothing connects to
a database (the engine only connects on first use).
"""

import json
import os
import sys
from pathlib import Path

_PLACEHOLDERS = {
    "DATABASE_URL": "postgresql://openapi:openapi@localhost:1/openapi",
    "ADMIN_DATABASE_URL": "postgresql://openapi:openapi@localhost:1/openapi",
    "SUPABASE_URL": "http://localhost",
    "SUPABASE_ANON_KEY": "openapi-export",
}

if __name__ == "__main__":
    out = Path(sys.argv[1]).resolve()
    backend = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).resolve().parents[1] / "backend").resolve()
    os.environ.update(_PLACEHOLDERS)
    os.chdir(backend.parent)  # not backend/, so its .env is never loaded
    sys.path.insert(0, str(backend))

    from app.main import app

    out.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False), encoding="utf-8")
