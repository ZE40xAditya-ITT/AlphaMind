from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password

def create_user(db: Session, data: UserCreate) -> User:
    """Create a new user after hashing their password."""
    password_hash = hash_password(data.password)
    user = User(
        username=data.username,
        email=data.email,
        password_hash=password_hash,
        role=data.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_users(db: Session) -> list[User]:
    """Retrieve all users."""
    return db.query(User).all()

def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Retrieve a user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def update_user(db: Session, user_id: int, data: UserUpdate) -> User | None:
    """Partially update an existing user."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.password_hash = hash_password(update_data["password"])
        del update_data["password"]
        
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user."""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
