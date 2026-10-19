import os
from dotenv import load_dotenv

# Load .env file if present (ignored if file does not exist)
load_dotenv()

class Settings:
    PROJECT_NAME: str = "RESEARCHGRAPH API"
    VERSION: str = "1.0.0"
    OPENALEX_BASE_URL: str = os.getenv("OPENALEX_BASE_URL", "https://api.openalex.org")
    OPENALEX_MAILTO: str = os.getenv("OPENALEX_MAILTO", "researchgraph@example.com")
    OPENALEX_API_KEY: str = os.getenv("OPENALEX_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./researchgraph.db")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]

settings = Settings()
