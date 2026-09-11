from logging.config import fileConfig
import asyncio
import selectors
import sys

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.config import settings
from app.database import Base

# Import all models so Alembic can detect them.
from app.models import (
    AnalysisJob,
    CodeEmbedding,
    GitHubAccount,
    PullRequest,
    Repository,
    Review,
    ReviewComment,
    ReviewFinding,
    User,
    UserSettings,
)


# Alembic Config object
config = context.config


# Use the asyncpg database URL directly.
# IMPORTANT:
# Do NOT remove "+asyncpg".
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL,
)


# Configure Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# SQLAlchemy metadata used by Alembic autogenerate.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in offline mode.

    This generates SQL without creating a live database connection.
    """

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """
    Run migrations using an active database connection.
    """

    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Create an async SQLAlchemy engine and run Alembic migrations.
    """

    connectable = async_engine_from_config(
        config.get_section(
            config.config_ini_section,
            {},
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

    finally:
        await connectable.dispose()


def run_migrations_online() -> None:
    """
    Run migrations in online mode.

    Windows + Python 3.14 defaults to ProactorEventLoop,
    which is incompatible with psycopg's async implementation.

    We explicitly use SelectorEventLoop on Windows.
    """

    if sys.platform == "win32":
        asyncio.run(
            run_async_migrations(),
            loop_factory=lambda: asyncio.SelectorEventLoop(
                selectors.SelectSelector()
            ),
        )
    else:
        asyncio.run(
            run_async_migrations()
        )


# Decide whether to run offline or online migrations.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()