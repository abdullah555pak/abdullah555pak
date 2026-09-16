"""
Declarative base for future SQLAlchemy models.

No models are defined yet (this step is connection/configuration
foundation only). When the first real feature needs persistence, its
model imports into this Base's metadata and an Alembic migration is
generated from the diff.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
