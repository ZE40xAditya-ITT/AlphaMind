from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.dependencies import get_db, get_current_user
from app.schemas.auth import LoginRequest, TokenResponse, UserInfo
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service, user_service
from app.models.user import User
from google.oauth2 import id_token
from google.auth.transport import requests
import os

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user with email and password, returning a JWT token."""
    user = auth_service.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    token = auth_service.create_token_for_user(user)
    return TokenResponse(access_token=token, token_type="bearer")

@router.get("/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.post("/signup", response_model=UserResponse)
def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """User self-registration. Role is strictly forced to 'user'."""
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Force role to user
    user_data.role = "user"
    return user_service.create_user(db, user_data)

from pydantic import BaseModel
class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/google", response_model=TokenResponse)
def google_login(
    req: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate or register user via Google SSO."""
    try:
        from app.core.config import settings
        client_id = settings.GOOGLE_CLIENT_ID or None
        # Verify token with 60s clock skew tolerance
        idinfo = id_token.verify_oauth2_token(
            req.token,
            requests.Request(),
            client_id,
            clock_skew_in_seconds=60
        )

        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google token does not contain email.")

        google_id = idinfo.get("sub")
        raw_name = idinfo.get("name", "").replace(" ", "").lower() or f"user_{google_id[:5]}"

        # Find user by google_id or email
        user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()

        if not user:
            # Ensure username is unique
            name = raw_name
            counter = 1
            while db.query(User).filter(User.username == name).first():
                name = f"{raw_name}_{counter}"
                counter += 1

            # Register new user
            user = User(
                username=name,
                email=email,
                role="user",
                is_active=True,
                google_id=google_id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update google_id if matched by email
            if not user.google_id:
                user.google_id = google_id
                db.commit()

        token = auth_service.create_token_for_user(user)
        return TokenResponse(access_token=token, token_type="bearer")

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Google SSO Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

