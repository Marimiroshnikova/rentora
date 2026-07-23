"""initial

Revision ID: 5801d4a484ab
Revises:
Create Date: 2026-07-18 21:38:54.240474

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5801d4a484ab"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Keep schema creation here so a fresh Render/SQLite disk can migrate
    # without relying on FastAPI startup create_all first.
    from app.database import Base
    from app import models  # noqa: F401

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    from app.database import Base
    from app import models  # noqa: F401

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
