from pydantic import BaseModel, EmailStr
class LoginRequest(BaseModel):
    email: str
    password: str
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    class Config:
        from_attributes = True