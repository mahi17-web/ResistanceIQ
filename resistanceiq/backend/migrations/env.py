from logging.config import fileConfig
import os
import sys
from typing import Any
from sqlalchemy import create_engine, pool, text, Table, MetaData, Column, String, PrimaryKeyConstraint
from alembic import context
from alembic.ddl.impl import DefaultImpl

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import Base
import app.models  # load all declarative models

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Ensure alembic version table definition supports long revision identifiers (>32 chars)
def custom_version_table_impl(
    self,
    *,
    version_table: str,
    version_table_schema: str | None = None,
    version_table_pk: bool = True,
    **kw: Any,
) -> Table:
    vt = Table(
        version_table,
        MetaData(),
        Column("version_num", String(255), nullable=False),
        schema=version_table_schema,
    )
    if version_table_pk:
        vt.append_constraint(
            PrimaryKeyConstraint(
                "version_num", name=f"{version_table}_pkc"
            )
        )
    return vt

DefaultImpl.version_table_impl = custom_version_table_impl

config = context.config
config.set_main_option("sqlalchemy.url", db_url.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        db_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # If running on PostgreSQL, ensure existing alembic_version column is expanded to VARCHAR(255)
        if connection.dialect.name == "postgresql":
            try:
                connection.execute(text(
                    "DO $$ BEGIN "
                    "IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alembic_version') THEN "
                    "  ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(255); "
                    "END IF; "
                    "END $$;"
                ))
                connection.commit()
            except Exception:
                pass

        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
