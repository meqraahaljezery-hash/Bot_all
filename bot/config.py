"""
Configuration manager for Imam Al-Jazari Telegram Bot.
Loads settings from environment variables with safe defaults and validation.
"""

import os
from typing import Optional, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Settings:
    # Bot Settings
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ")
    BOT_MODE: str = os.getenv("BOT_MODE", "polling").lower()  # "polling" or "webhook"
    
    # Webhook Settings
    WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "")
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "super-secret-webhook-key")
    WEBHOOK_PORT: int = int(os.getenv("WEBHOOK_PORT", "8000"))
    WEBHOOK_HOST: str = os.getenv("WEBHOOK_HOST", "0.0.0.0")

    # Super Admin Info
    SUPER_ADMIN_TELEGRAM_ID: int = int(os.getenv("SUPER_ADMIN_TELEGRAM_ID", "0"))
    SUPER_ADMIN_EMAIL: str = os.getenv("SUPER_ADMIN_EMAIL", "khdahd241@gmail.com")

    # Official Center Contact
    CONTACT_PHONE: str = os.getenv("CONTACT_PHONE", "0990161372")
    CONTACT_EMAIL: str = os.getenv("CONTACT_EMAIL", "kalidahd7@gmil.com")
    CENTER_NAME_AR: str = "مقرأة الإمام الجزري للإقراء والإجازة بالسند"
    CENTER_NAME_EN: str = "Imam Al-Jazari Quran Recitation & Ijazah Center"
    CENTER_NAME_AM: str = "የኢማም አል-ጀዘሪ የቁርአን ንባብ እና የኢጃዛ ማዕከል"

    # Database & Supabase
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://orxrsylppnlxeyqyhnzt.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Redis Cache (Optional)
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")

    # Languages supported
    SUPPORTED_LANGUAGES: List[str] = ["ar", "en", "am"]
    DEFAULT_LANGUAGE: str = "ar"

    @property
    def is_webhook(self) -> bool:
        return self.BOT_MODE == "webhook" and bool(self.WEBHOOK_URL)


settings = Settings()
