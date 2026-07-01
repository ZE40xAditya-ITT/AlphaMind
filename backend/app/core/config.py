from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PROJECT_NAME: str = "AlphaMind AI"
    API_V1_STR: str = "/api/v1"
    # Database
    DATABASE_URL: str
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    # Billing
    RATE_PER_SEARCH: float = 20.0  # INR per search
    # Invoice storage
    INVOICE_DIR: str = "./invoices"
    # Auth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_API_KEY: str = ""
    # Finnhub
    FINNHUB_API_KEY: str = ""
    # Email (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "digest@alphamind.ai"
    class Config:
        env_file = ".env"
settings = Settings()