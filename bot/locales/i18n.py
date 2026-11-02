"""
Internationalization (i18n) engine for Imam Al-Jazari Telegram Bot.
Supports Arabic (ar - default), English (en), and Amharic (am).
"""

import json
import os
from typing import Dict, Any

LOCALES_DIR = os.path.dirname(__file__)

_translations: Dict[str, Dict[str, str]] = {}


def load_translations() -> None:
    for lang in ["ar", "en", "am"]:
        filepath = os.path.join(LOCALES_DIR, f"{lang}.json")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                _translations[lang] = json.load(f)
        else:
            _translations[lang] = {}


def t(key: str, lang: str = "ar", **kwargs: Any) -> str:
    """
    Get localized string by key and language code.
    Falls back to Arabic if key is missing in chosen language, then returns key.
    """
    if not _translations:
        load_translations()

    lang_dict = _translations.get(lang, _translations.get("ar", {}))
    text = lang_dict.get(key)
    
    if text is None:
        # Fallback to Arabic
        text = _translations.get("ar", {}).get(key, key)

    if kwargs and isinstance(text, str):
        try:
            return text.format(**kwargs)
        except Exception:
            return text

    return text


# Initialize on import
load_translations()
