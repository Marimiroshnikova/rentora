"""add notifications, message is_system, booking updated_at

Revision ID: 2526d55efdc0
Revises: 0a4901b9fcdf
Create Date: 2026-07-19 22:20:10.309675

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2526d55efdc0"
down_revision: Union[str, None] = "0a4901b9fcdf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "bookings" in tables:
        booking_cols = {c["name"] for c in inspector.get_columns("bookings")}
        if "updated_at" not in booking_cols:
            with op.batch_alter_table("bookings", schema=None) as batch_op:
                batch_op.add_column(
                    sa.Column(
                        "updated_at",
                        sa.DateTime(timezone=True),
                        server_default=sa.text("(CURRENT_TIMESTAMP)"),
                        nullable=False,
                    )
                )

    if "messages" in tables:
        message_cols = {c["name"] for c in inspector.get_columns("messages")}
        if "is_system" not in message_cols:
            with op.batch_alter_table("messages", schema=None) as batch_op:
                batch_op.add_column(
                    sa.Column(
                        "is_system",
                        sa.Boolean(),
                        server_default=sa.text("0"),
                        nullable=False,
                    )
                )

    if "notifications" not in tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("booking_id", sa.Integer(), nullable=False),
            sa.Column(
                "type",
                sa.Enum(
                    "BOOKING_REQUESTED",
                    "BOOKING_ACCEPTED",
                    "BOOKING_DECLINED",
                    "PAYMENT_SUCCEEDED",
                    "PAYMENT_FAILED",
                    "BOOKING_CANCELLED",
                    "BOOKING_COMPLETED",
                    "NEW_MESSAGE",
                    name="notificationtype",
                ),
                nullable=False,
            ),
            sa.Column("is_read", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("(CURRENT_TIMESTAMP)"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        with op.batch_alter_table("notifications", schema=None) as batch_op:
            batch_op.create_index(batch_op.f("ix_notifications_user_id"), ["user_id"], unique=False)
            batch_op.create_index(
                batch_op.f("ix_notifications_booking_id"), ["booking_id"], unique=False
            )
            batch_op.create_index(batch_op.f("ix_notifications_is_read"), ["is_read"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "notifications" in tables:
        op.drop_table("notifications")

    if "messages" in tables:
        message_cols = {c["name"] for c in inspector.get_columns("messages")}
        if "is_system" in message_cols:
            with op.batch_alter_table("messages", schema=None) as batch_op:
                batch_op.drop_column("is_system")

    if "bookings" in tables:
        booking_cols = {c["name"] for c in inspector.get_columns("bookings")}
        if "updated_at" in booking_cols:
            with op.batch_alter_table("bookings", schema=None) as batch_op:
                batch_op.drop_column("updated_at")
