"""add face onboarding flag

Revision ID: 0004_face_onboarding
Revises: 0003_add_onboarding
Create Date: 2026-05-07 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = '0004_face_onboarding'
down_revision = '0003_add_onboarding'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('face_onboarding_completed', sa.Boolean(), server_default=sa.text('false'), nullable=False))

def downgrade() -> None:
    op.drop_column('users', 'face_onboarding_completed')