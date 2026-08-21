import os
from typing import List, Union, Optional
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "ResistanceIQ"
    APP_ENV: str = "development"  # "development" | "test" | "staging" | "production"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ResistanceIQ Scientific Intelligence Platform"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./resistanceiq_dev.db"
    DB_ECHO: bool = False

    # Security & Tokens
    JWT_SECRET: str = "super-secret-resistanceiq-jwt-key-minimum-32-chars"
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: Optional[List[str]] = None

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    ML_SERVICE_URL: str = "http://localhost:8001"
    MODEL_REGISTRY_PATH: str = "../storage/models"
    STORAGE_LOCAL_PATH: str = "../storage/reports"
    STORAGE_URL: str = "http://localhost:8000/storage"
    MODEL_ARTIFACT_PATH: str = "../storage/models/v2.0.0-gbrt-ecfp4.joblib"
    MODEL_ARTIFACT_SHA256: str = "6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622"

    ALLOW_DEV_SEEDING: bool = True
    ALLOW_DEV_FALLBACK_AUTH: bool = False
    ALLOW_SQLITE_IN_PROD: bool = False

    # Rate limiting configuration (requests per minute)
    RATE_LIMIT_PER_MINUTE: int = 120

    # Email Service Configuration
    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = "resistanceiq69@gmail.com"
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "resistanceiq69@gmail.com"
    SMTP_FROM_NAME: str = "ResistanceIQ"
    SMTP_USE_TLS: bool = True

    EMAIL_PROVIDER: str = "smtp"  # "smtp" | "transactional" | "dev"
    EMAIL_API_KEY: Optional[str] = None
    DEV_EMAIL_INBOX_DIR: str = "./storage/dev_emails"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_sqlite_path(cls, v: str) -> str:
        if v and isinstance(v, str) and v.startswith("sqlite:///") and "./" in v:
            # Resolve relative sqlite path to backend root directory
            backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            rel_path = v.replace("sqlite:///", "").lstrip("./")
            abs_path = os.path.join(backend_dir, rel_path).replace("\\", "/")
            return f"sqlite:///{abs_path}"
        return v

    @field_validator("DEV_EMAIL_INBOX_DIR", mode="before")
    @classmethod
    def resolve_dev_email_path(cls, v: str) -> str:
        if v and isinstance(v, str) and not os.path.isabs(v):
            # Anchor relative dev inbox path to project workspace root
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            clean_rel = v.lstrip("./")
            return os.path.join(root_dir, clean_rel).replace("\\", "/")
        return v

    @model_validator(mode="after")
    def sync_aliases_and_enforce_production_isolation(self):
        if self.JWT_SECRET_KEY and (not self.JWT_SECRET or self.JWT_SECRET.startswith("super-secret")):
            self.JWT_SECRET = self.JWT_SECRET_KEY
        if self.CORS_ORIGINS:
            self.BACKEND_CORS_ORIGINS = self.CORS_ORIGINS

        if self.APP_ENV.lower() == "production":
            self.ALLOW_DEV_SEEDING = False
            self.ALLOW_DEV_FALLBACK_AUTH = False
            self.DEBUG = False
            
            # Strict Database requirement in production
            if (not self.DATABASE_URL or self.DATABASE_URL.startswith("sqlite")) and not self.ALLOW_SQLITE_IN_PROD:
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: Production environment cannot use SQLite unless explicitly allowed. "
                    "A valid PostgreSQL connection URL (e.g. postgresql://user:pass@host:5432/dbname) "
                    "must be supplied in the DATABASE_URL environment variable."
                )
            
            # Strict JWT Secret requirement in production
            if not self.JWT_SECRET or self.JWT_SECRET == "super-secret-resistanceiq-jwt-key-minimum-32-chars" or len(self.JWT_SECRET) < 32:
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: Production environment requires a strong, unique JWT_SECRET "
                    "with a minimum length of 32 characters."
                )

            # Strict Email Provider requirement in production: fail closed if dev mailbox is requested
            if self.EMAIL_PROVIDER.lower() == "dev":
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: EMAIL_PROVIDER='dev' is strictly prohibited in production. "
                    "A valid SMTP server or transactional provider must be configured."
                )

            if self.EMAIL_PROVIDER.lower() == "smtp" and not (self.SMTP_HOST and self.SMTP_USERNAME and self.SMTP_PASSWORD):
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: Production SMTP provider requires SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD."
                )

            if not self.MODEL_ARTIFACT_SHA256 or len(self.MODEL_ARTIFACT_SHA256) != 64:
                raise ValueError(
                    "FATAL CONFIGURATION ERROR: Production environment requires a valid 64-character MODEL_ARTIFACT_SHA256."
                )
        return self

    model_config = SettingsConfigDict(
        env_file=[".env", "../.env", "../../.env"],
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
