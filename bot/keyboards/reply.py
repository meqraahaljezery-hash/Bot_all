"""
Reply Keyboards for Imam Al-Jazari Telegram Bot.
Organized, clean, and responsive with strict role separation.
"""

from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service

def get_main_menu_keyboard(telegram_id: int, lang: str = "ar") -> ReplyKeyboardMarkup:
    """
    Returns main menu reply keyboard formatted strictly according to user's role.
    """
    # 1. لوحة السوبر أدمن (Super Admin)
    if user_service.is_super_admin(telegram_id):
        keyboard = [
            [KeyboardButton(text=t("btn_admin_panel", lang))],
            [KeyboardButton(text=t("btn_admin_registrations", lang, count=0)), KeyboardButton(text=t("btn_admin_payments", lang, count=0))],
            [KeyboardButton(text=t("btn_admin_balances", lang)), KeyboardButton(text=t("btn_admin_broadcast", lang))],
            [KeyboardButton(text=t("btn_teacher_portal", lang))],
            [KeyboardButton(text=t("btn_settings", lang)), KeyboardButton(text=t("btn_about", lang))],
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 2. لوحة المشرفين (Admin/Supervisor)
    if user_service.is_admin_or_supervisor(telegram_id):
        keyboard = [
            [KeyboardButton(text=t("btn_admin_panel", lang))],
            [KeyboardButton(text=t("btn_settings", lang)), KeyboardButton(text=t("btn_about", lang))],
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 3. لوحة المعلم (Teacher)
    if user_service.is_teacher(telegram_id):
        keyboard = [
            [KeyboardButton(text=t("btn_teacher_portal", lang))],
            [KeyboardButton(text=t("btn_my_group", lang)), KeyboardButton(text=t("btn_support", lang))],
            [KeyboardButton(text=t("btn_about", lang)), KeyboardButton(text=t("btn_settings", lang))],
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 4. لوحة الطالب (Student) - الافتراضية
    keyboard = [
        [KeyboardButton(text=t("btn_about", lang)), KeyboardButton(text=t("btn_programs", lang))],
        [KeyboardButton(text=t("btn_register", lang)), KeyboardButton(text=t("btn_packages", lang))],
        [KeyboardButton(text=t("btn_balance", lang)), KeyboardButton(text=t("btn_payments", lang))],
        [KeyboardButton(text=t("btn_my_group", lang)), KeyboardButton(text=t("btn_support", lang))],
        [KeyboardButton(text=t("btn_notifications", lang)), KeyboardButton(text=t("btn_settings", lang))],
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)