"""referrals

Revision ID: 0002_referrals
Revises: 0001_initial
Create Date: 2026-04-16 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0002_referrals'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поля для реферальной системы
    op.add_column('users', sa.Column('referral_code', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_users_referral_code'), 'users', ['referral_code'], unique=True)
    
    op.add_column('users', sa.Column('referred_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    
    op.add_column('users', sa.Column('referral_bonus_granted', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'referral_bonus_granted')
    op.drop_column('users', 'referred_by')
    op.drop_index(op.f('ix_users_referral_code'), table_name='users')
    op.drop_column('users', 'referral_code')