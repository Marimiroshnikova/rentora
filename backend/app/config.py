from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


DEV_SECRET = "rentora-dev-secret-change-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), extra="ignore")

    database_url: str = f"sqlite:///{BASE_DIR / 'rentora.db'}"
    secret_key: str = DEV_SECRET
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: str = "uploads"
    algorithm: str = "HS256"
    environment: str = "development"

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() in {"prod", "production"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        path = BASE_DIR / self.upload_dir
        path.mkdir(parents=True, exist_ok=True)
        return path

    def validate_for_runtime(self) -> None:
        if not self.is_production:
            return
        if not self.secret_key or self.secret_key == DEV_SECRET:
            raise SystemExit(
                "SECRET_KEY must be set to a non-default value when ENVIRONMENT=production"
            )
        if "*" in self.cors_origin_list:
            raise SystemExit("CORS_ORIGINS must not include '*' in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
