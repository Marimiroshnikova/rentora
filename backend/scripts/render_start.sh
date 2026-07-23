#!/usr/bin/env bash
set -euo pipefail

# Ensure schema exists even if an older empty migration was stamped.
python - <<'PY'
from app.database import Base, engine
import app.models  # noqa: F401

Base.metadata.create_all(bind=engine)
print("schema ready")
PY

alembic upgrade head
python seed.py
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
