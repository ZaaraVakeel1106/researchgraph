import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
# Keep secrets in backend/.env (or the process environment); never log settings.
load_dotenv(dotenv_path=BACKEND_ENV_FILE, override=False)


def _int_setting(name: str, default: int, minimum: int = 0) -> int:
    try:
        return max(minimum, int(os.getenv(name, str(default))))
    except (TypeError, ValueError):
        return default


def _float_setting(name: str, default: float, minimum: float = 0.0) -> float:
    try:
        return max(minimum, float(os.getenv(name, str(default))))
    except (TypeError, ValueError):
        return default

class Settings:
    PROJECT_NAME: str = "RESEARCHGRAPH API"
    VERSION: str = "1.0.0"
    OPENALEX_BASE_URL: str = os.getenv("OPENALEX_BASE_URL", "https://api.openalex.org")
    OPENALEX_MAILTO: str = os.getenv("OPENALEX_MAILTO", "researchgraph@example.com")
    OPENALEX_API_KEY: str = os.getenv("OPENALEX_API_KEY", "")
    OPENALEX_MAX_CONCURRENT_REQUESTS: int = min(100, _int_setting("OPENALEX_MAX_CONCURRENT_REQUESTS", 5, 1))
    OPENALEX_MAX_RETRIES: int = min(5, _int_setting("OPENALEX_MAX_RETRIES", 2, 0))
    OPENALEX_RETRY_BACKOFF_SECONDS: float = _float_setting("OPENALEX_RETRY_BACKOFF_SECONDS", 0.5)
    OPENALEX_MAX_RETRY_AFTER_SECONDS: float = _float_setting("OPENALEX_MAX_RETRY_AFTER_SECONDS", 5.0)
    OPENALEX_SEARCH_CACHE_TTL: int = _int_setting("OPENALEX_SEARCH_CACHE_TTL", 300)
    OPENALEX_WORK_CACHE_TTL: int = _int_setting("OPENALEX_WORK_CACHE_TTL", 86400)
    OPENALEX_RESPONSE_CACHE_TTL: int = _int_setting("OPENALEX_RESPONSE_CACHE_TTL", 1800)
    OPENALEX_GRAPH_CACHE_TTL: int = _int_setting("OPENALEX_GRAPH_CACHE_TTL", 300)
    OPENALEX_PAPER_STUDY_CACHE_TTL: int = _int_setting("OPENALEX_PAPER_STUDY_CACHE_TTL", 1800)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./researchgraph.db")
    CORS_ORIGINS: list[str] = [origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    ).split(",") if origin.strip()]

settings = Settings()
