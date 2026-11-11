from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / '.env',
        env_file_encoding='utf-8', extra='ignore',
    )
    gemini_api_key: SecretStr = SecretStr('')
    gemini_model: str = Field(default='', max_length=120, pattern=r'^[a-zA-Z0-9._/-]*$')
    gemini_free_tier_confirmed: bool = False
    gemini_timeout_seconds: float = Field(default=30, ge=1, le=60)
    gemini_max_requests_per_minute: int = Field(default=5, ge=1, le=60)
    cors_origins: list[str] = ['http://127.0.0.1:5173', 'http://localhost:5173']

    @property
    def ready(self) -> bool:
        return bool(self.gemini_api_key.get_secret_value().strip()
                    and self.gemini_model and self.gemini_free_tier_confirmed)
