import pytest
import sys
import os
from fastapi.testclient import TestClient

# Put backend root on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.db.seed import seed_development_data
from app.core.security import create_access_token


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    seed_development_data()
    yield


@pytest.fixture
def client():
    token = create_access_token(
        subject="usr_001",
        role="ADMIN",
        organization_id="org_bindwell_001",
    )
    with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as c:
        yield c
