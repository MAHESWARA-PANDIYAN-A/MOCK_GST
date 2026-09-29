import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mock GST Registration Portal (SIH26130 Prototype)"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment & Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/mock_gst.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "mock_gst_super_secret_jwt_key_sih26130_prototype_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Integration API Key (SIH Main Portal -> Mock GST Backend)
    MOCK_GST_API_KEY: str = os.getenv("MOCK_GST_API_KEY", "gst_sih26130_secret_api_key_mock_2026")
    
    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    MAIN_SIH_PORTAL_URL: str = os.getenv("MAIN_SIH_PORTAL_URL", "http://localhost:3000")
    WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "")
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
    
    # Mock OTP
    MOCK_OTP: str = os.getenv("MOCK_OTP", "123456")
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
