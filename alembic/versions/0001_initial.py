"""Initial schema.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("google_sub", sa.String(255), nullable=True, unique=True),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("role", sa.String(32), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "wallets",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("trial_granted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "wallet_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(50), nullable=False),
        sa.Column("reference", sa.String(255), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_wallet_transactions_user_id"), "wallet_transactions", ["user_id"])

    op.create_table(
        "user_job_reservations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=True, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="reserved"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_user_job_reservations_user_id"), "user_job_reservations", ["user_id"])

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(30), nullable=False),
        sa.Column("provider_payment_id", sa.String(128), nullable=True, unique=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("generation_count", sa.Integer(), nullable=False),
        sa.Column("amount_kopecks", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="RUB"),
        sa.Column("confirmation_url", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(64), nullable=False, unique=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_payments_user_id"), "payments", ["user_id"])

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_email_verification_tokens_user_id"), "email_verification_tokens", ["user_id"])
    op.create_index(op.f("ix_email_verification_tokens_token_hash"), "email_verification_tokens", ["token_hash"])

    op.create_table(
        "trial_devices",
        sa.Column("device_hash", sa.String(64), primary_key=True),
        sa.Column("first_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "admin_action_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(128), nullable=False),
        sa.Column("target_type", sa.String(64), nullable=True),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("admin_action_logs")
    op.drop_table("trial_devices")
    op.drop_index(op.f("ix_email_verification_tokens_token_hash"), table_name="email_verification_tokens")
    op.drop_index(op.f("ix_email_verification_tokens_user_id"), table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")
    op.drop_index(op.f("ix_payments_user_id"), table_name="payments")
    op.drop_table("payments")
    op.drop_index(op.f("ix_user_job_reservations_user_id"), table_name="user_job_reservations")
    op.drop_table("user_job_reservations")
    op.drop_index(op.f("ix_wallet_transactions_user_id"), table_name="wallet_transactions")
    op.drop_table("wallet_transactions")
    op.drop_table("wallets")
    op.drop_table("users")
