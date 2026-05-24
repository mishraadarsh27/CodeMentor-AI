import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base, get_db
from backend.models import User, Project, File
from backend.utils.streak import update_streak

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_streak_logic(db_session):
    # Create a temporary user directly in DB
    user = User(
        email="streak@example.com",
        username="streakuser",
        hashed_password="somepassword"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # 1. Initial streak update
    update_streak(user, db_session)
    db_session.commit()
    assert user.current_streak == 1
    assert user.max_streak == 1
    assert user.last_activity_date is not None

    # Save last active
    original_last_active = user.last_activity_date

    # 2. Activity on consecutive day (yesterday)
    # Simulate yesterday's date
    yesterday = datetime.utcnow() - timedelta(days=1)
    user.last_activity_date = yesterday
    db_session.add(user)
    db_session.commit()

    update_streak(user, db_session)
    db_session.commit()
    assert user.current_streak == 2
    assert user.max_streak == 2

    # 3. Activity on same day (today)
    update_streak(user, db_session)
    db_session.commit()
    assert user.current_streak == 2 # Remains unchanged
    assert user.max_streak == 2

    # 4. Activity after break (2 days ago)
    two_days_ago = datetime.utcnow() - timedelta(days=2)
    user.last_activity_date = two_days_ago
    db_session.add(user)
    db_session.commit()

    update_streak(user, db_session)
    db_session.commit()
    assert user.current_streak == 1 # Resets to 1
    assert user.max_streak == 2 # Max streak stays 2

def test_profile_endpoint():
    # 1. Create a user
    signup_response = client.post(
        "/api/auth/signup",
        json={"username": "profileuser", "email": "profile@example.com", "password": "password123"}
    )
    assert signup_response.status_code == 200
    token = signup_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch profile
    response = client.get("/api/auth/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "profileuser"
    assert data["email"] == "profile@example.com"
    assert "current_streak" in data
    assert "max_streak" in data
    assert "total_analyses" in data
    assert "total_projects" in data

def test_file_deletion_flow():
    # 1. Signup / Login
    signup_response = client.post(
        "/api/auth/signup",
        json={"username": "fileuser", "email": "fileuser@example.com", "password": "password123"}
    )
    assert signup_response.status_code == 200
    token = signup_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create project
    proj_response = client.post(
        "/api/projects",
        json={"name": "My Project", "description": "Test project"},
        headers=headers
    )
    assert proj_response.status_code == 200
    project_id = proj_response.json()["id"]

    # 3. Create file in project
    file_response = client.post(
        f"/api/projects/{project_id}/files",
        json={"name": "main.py", "content": "print('hello')", "language": "python", "project_id": project_id},
        headers=headers
    )
    assert file_response.status_code == 200
    file_id = file_response.json()["id"]

    # 4. Delete file
    delete_response = client.delete(f"/api/projects/files/{file_id}", headers=headers)
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "File deleted successfully"}

    # 5. Delete file that doesn't exist anymore should return 404
    delete_again_response = client.delete(f"/api/projects/files/{file_id}", headers=headers)
    assert delete_again_response.status_code == 404
