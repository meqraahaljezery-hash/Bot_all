"""
Reply Keyboards for Imam Al-Jazari Telegram Bot.
Organized, clean, and responsive with role awareness and multilingual support.
"""

from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service


def get_main_menu_keyboard(telegram_id: int, lang: str = "ar") -> ReplyKeyboardMarkup:
    """
    Returns main menu reply keyboard formatted cleanly according to user's language and role.
    """
    keyboard = [
        [
            KeyboardButton(text=t("btn_about", lang)),
            KeyboardButton(text=t("btn_programs", lang)),
        ],
        [
            KeyboardButton(text=t("btn_register", lang)),
            KeyboardButton(text=t("btn_packages", lang)),
        ],
        [
            KeyboardButton(text=t("btn_balance", lang)),
            KeyboardButton(text=t("btn_payments", lang)),
        ],
        [
            KeyboardButton(text=t("btn_my_group", lang)),
            KeyboardButton(text=t("btn_support", lang)),
        ],
        [
            KeyboardButton(text=t("btn_notifications", lang)),
            KeyboardButton(text=t("btn_settings", lang)),
        ],
    ]

    # Add teacher portal if user is a teacher
    if user_service.is_teacher(telegram_id):
        keyboard.append([KeyboardButton(text=t("btn_teacher_portal", lang))])

    # Add admin panel button if user has management permissions
    if user_service.is_admin_or_supervisor(telegram_id):
        keyboard.append([KeyboardButton(text=t("btn_admin_panel", lang))])

    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        one_time_keyboard=False,
        is_persistent=True,
    )


def get_cancel_keyboard(lang: str = "ar") -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=t("btn_cancel", lang))]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
