from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, create_access_token
from datetime import timedelta

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate a user by email and password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def create_token_for_user(user: User) -> str:
    """Generate a JWT token for the authenticated user."""
    return create_access_token(data={"sub": str(user.id)})
