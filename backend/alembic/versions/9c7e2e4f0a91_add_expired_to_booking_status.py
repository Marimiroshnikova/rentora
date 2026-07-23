"""add expired to booking status

Revision ID: 9c7e2e4f0a91
Revises: 2526d55efdc0
Create Date: 2026-07-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c7e2e4f0a91'
down_revision: Union[str, None] = '2526d55efdc0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'EXPIRED'")


def downgrade() -> None:
    pass
