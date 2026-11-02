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
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "9040406341:AAHjFYGQ0EcV60VpX1J7xQbVNcT29Drkl4M")
    BOT_MODE: str = os.getenv("BOT_MODE", "polling").lower()  # "polling" or "webhook"
    
    # Webhook Settings
    WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "")
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "super-secret-webhook-key")
    WEBHOOK_PORT: int = int(os.getenv("WEBHOOK_PORT", "8000"))
    WEBHOOK_HOST: str = os.getenv("WEBHOOK_HOST", "0.0.0.0")

    # Super Admin Info
    SUPER_ADMIN_TELEGRAM_ID: int = int(os.getenv("SUPER_ADMIN_TELEGRAM_ID", "7334314796"))
    SUPER_ADMIN_EMAIL: str = os.getenv("SUPER_ADMIN_EMAIL", "khdahd241@gmail.com")

    # Official Center Contact
    CONTACT_PHONE: str = os.getenv("CONTACT_PHONE", "0990161372")
    CONTACT_EMAIL: str = os.getenv("CONTACT_EMAIL", "kalidahd7@gmil.com")
    CENTER_NAME_AR: str = "مقرأة الإمام الجزري للإقراء والإجازة بالسند"
    CENTER_NAME_EN: str = "Imam Al-Jazari Quran Recitation & Ijazah Center"
    CENTER_NAME_AM: str = "የኢማም አል-ጀዘሪ የቁርአን ንባብ እና የኢጃዛ ማዕከል"

    # Official 6 Study Groups Moderated by Bot (Divided by Gender & 3 Shifts)
    STUDY_GROUPS = {
        "IM_MORNING": {
            "chat_id": -1003701915037,
            "link": "https://t.me/IM_MORNING_2",
            "gender": "male",
            "shift": "morning",
            "time": "09:00 - 12:00",
            "name": "مجموعة الذكور - الفترة الصباحية (IM Morning)",
        },
        "IM_AFTERNOON": {
            "chat_id": -1003954336712,
            "link": "https://t.me/IM_AFTERNOON_3",
            "gender": "male",
            "shift": "afternoon",
            "time": "14:00 - 15:30",
            "name": "مجموعة الذكور - الفترة المسائية (IM Afternoon)",
        },
        "IM_NIGHT": {
            "chat_id": -1003771613278,
            "link": "https://t.me/IM_NIGHT_1",
            "gender": "male",
            "shift": "night",
            "time": "21:00 - 23:00",
            "name": "مجموعة الذكور - الفترة الليلية (IM Night)",
        },
        "IF_MORNING": {
            "chat_id": -1004464170793,
            "link": "https://t.me/IF_MORNING",
            "gender": "female",
            "shift": "morning",
            "time": "09:00 - 12:00",
            "name": "مجموعة الإناث - الفترة الصباحية (IF Morning)",
        },
        "IF_AFTERNOON": {
            "chat_id": -1004388200431,
            "link": "https://t.me/IF_AFTERNOON",
            "gender": "female",
            "shift": "afternoon",
            "time": "14:00 - 15:30",
            "name": "مجموعة الإناث - الفترة المسائية (IF Afternoon)",
        },
        "IF_NIGHT": {
            "chat_id": -1004297425702,
            "link": "https://t.me/IF_NIGHT",
            "gender": "female",
            "shift": "night",
            "time": "21:00 - 23:00",
            "name": "مجموعة الإناث - الفترة الليلية (IF Night)",
        },
    }

    # Public Forums
    PUBLIC_FORUMS = {
        "FORUM_MEN": "https://t.me/IM_GENERAL_FORUM",
        "FORUM_WOMEN": "https://t.me/IF_GENERAL_FORUM",
        "FORUM_CENTER": "https://t.me/JazariCenterOfficial",
    }

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
