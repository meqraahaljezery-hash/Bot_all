"""
Configuration manager for Imam Al-Jazari Telegram Bot.
Loads settings from environment variables with safe defaults and validation.
"""

import os
from typing import Optional, List, Set

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Settings:
    # Bot Settings
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "9040406341:AAHjFYGQ0EcV60VpX1J7xQbVNcT29Drkl4M")
    BOT_MODE: str = os.getenv("BOT_MODE", "webhook").lower()
    
    # Webhook Settings
    WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "https://aljazari-quran-bot.onrender.com/api/telegram/webhook")
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "AljazariBotSecret2026XyZ")
    WEBHOOK_PORT: int = int(os.getenv("WEBHOOK_PORT", "8000"))
    WEBHOOK_HOST: str = os.getenv("WEBHOOK_HOST", "0.0.0.0")

    # Super Admin Info (التعرف التلقائي الذكي على السوبر أدمن من متغيرات رندر)
    @staticmethod
    def _parse_super_admin_ids() -> Set[int]:
        ids: Set[int] = {7334314796, 990161372}
        for env_var in ["SUPER_ADMIN_TELEGRAM_ID", "SUPER_ADMIN_ID", "SUPER_ADMIN_IDS", "ADMIN_IDS", "RENDER_SUPER_ADMIN_ID"]:
            val = os.getenv(env_var)
            if val:
                # Handle comma, semicolon, space separated IDs
                for part in str(val).replace(";", ",").replace(" ", ",").split(","):
                    clean = part.strip()
                    if clean.isdigit():
                        ids.add(int(clean))
        return ids

    SUPER_ADMIN_IDS: Set[int] = _parse_super_admin_ids()
    SUPER_ADMIN_TELEGRAM_ID: int = next(iter(SUPER_ADMIN_IDS), 7334314796)
    SUPER_ADMIN_EMAIL: str = os.getenv("SUPER_ADMIN_EMAIL", "khdahd241@gmail.com")

    # Official Center Contact
    CONTACT_PHONE: str = os.getenv("CONTACT_PHONE", "0990161372")
    CONTACT_EMAIL: str = os.getenv("CONTACT_EMAIL", "kalidahd7@gmil.com")
    CENTER_NAME_AR: str = "مقرأة الإمام الجزري للإقراء والإجازة بالسند"
    CENTER_NAME_EN: str = "Imam Al-Jazari Quran Recitation & Ijazah Center"
    CENTER_NAME_AM: str = "የኢማም አል-ጀዘሪ የቁርአን ንባብ እና የኢጃዛ ማዕከል"

    # Official 6 Study Groups
    STUDY_GROUPS = {
        "IM_MORNING": {
            "chat_id": -1003701915037,
            "link": "https://t.me/IM_MORNING_2",
            "gender": "male",
            "shift": "morning",
            "name": "الذكور - صباحي",
            "time_range": "09:00 - 12:00"
        },
        "IM_AFTERNOON": {
            "chat_id": -1003954336712,
            "link": "https://t.me/IM_AFTERNOON_3",
            "gender": "male",
            "shift": "afternoon",
            "name": "الذكور - مسائي",
            "time_range": "14:00 - 15:30"
        },
        "IM_NIGHT": {
            "chat_id": -1003771613278,
            "link": "https://t.me/IM_NIGHT_1",
            "gender": "male",
            "shift": "night",
            "name": "الذكور - ليلي",
            "time_range": "21:00 - 23:00"
        },
        "IF_MORNING": {
            "chat_id": -1004464170793,
            "link": "https://t.me/IF_MORNING",
            "gender": "female",
            "shift": "morning",
            "name": "الإناث - صباحي",
            "time_range": "09:00 - 12:00"
        },
        "IF_AFTERNOON": {
            "chat_id": -1004388200431,
            "link": "https://t.me/IF_AFTERNOON",
            "gender": "female",
            "shift": "afternoon",
            "name": "الإناث - مسائي",
            "time_range": "14:00 - 15:30"
        },
        "IF_NIGHT": {
            "chat_id": -1004297425702,
            "link": "https://t.me/IF_NIGHT",
            "gender": "female",
            "shift": "night",
            "name": "الإناث - ليلي",
            "time_range": "21:00 - 23:00"
        },
    }

    # Aliases for robust group lookup
    STUDY_GROUPS["IM_EVENING"] = STUDY_GROUPS["IM_AFTERNOON"]
    STUDY_GROUPS["IF_EVENING"] = STUDY_GROUPS["IF_AFTERNOON"]

    # Database & Supabase
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://vtqdfcqejyctvfkvyece.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Languages
    SUPPORTED_LANGUAGES: List[str] = ["ar", "en", "am"]
    DEFAULT_LANGUAGE: str = "ar"

    @property
    def is_webhook(self) -> bool:
        return self.BOT_MODE == "webhook" and bool(self.WEBHOOK_URL)


settings = Settings()