"""add phone to users

Revision ID: 0a4901b9fcdf
Revises: 5801d4a484ab
Create Date: 2026-07-19 21:28:06.230572

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0a4901b9fcdf"
down_revision: Union[str, None] = "5801d4a484ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "users" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("users")}
    if "phone" in cols:
        return
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("phone", sa.String(length=30), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "users" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("users")}
    if "phone" not in cols:
        return
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("phone")
