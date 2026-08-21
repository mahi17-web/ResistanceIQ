import pytest
import sys
import os
from fastapi.testclient import TestClient

# Put backend root on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.db.seed import seed_development_data
from app.ingestion.registry import initialize_data_sources
from app.core.security import create_access_token


from app.core.config import settings
from app.services.email_service import email_service


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    settings.APP_ENV = "test"
    settings.EMAIL_PROVIDER = "dev"
    email_service.app_env = "test"
    Base.metadata.create_all(bind=engine)
    seed_development_data()
    db = SessionLocal()
    try:
        initialize_data_sources(db)
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    # Issue a real JWT token for test user
    token = create_access_token(
        subject="usr_001",
        role="ADMIN",
        organization_id="org_bindwell_001",
    )
    with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as c:
        yield c


@pytest.fixture
def unauthenticated_client():
    with TestClient(app) as c:
        yield c
