import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PROJECT_NAME = "CareerPilot AI"
    API_V1_STR = "/api/v1"
    
    # Database
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///careerpilot.db")
    
    # Gemini API Key
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    
    # Security
    SECRET_KEY = os.environ.get("SECRET_KEY", "DEVELOPMENT_SECRET_KEY_CHANGE_IN_PRODUCTION")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

settings = Config()
