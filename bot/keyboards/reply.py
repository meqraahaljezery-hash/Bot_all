"""
Reply Keyboards - STRICT ROLE SEPARATION
"""
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service

def get_main_menu_keyboard(telegram_id: int, lang: str = "ar") -> ReplyKeyboardMarkup:
    # 1. Super Admin Menu
    if user_service.is_super_admin(telegram_id):
        keyboard = [
            [KeyboardButton(text="👨‍🎓 إدارة الطلاب والمستخدمين")],
            [KeyboardButton(text="📝 طلبات التسجيل"), KeyboardButton(text="💳 طلبات الدفع")],
            [KeyboardButton(text="⏱ خصم دقائق الجلسات"), KeyboardButton(text="🎁 تكريم الطلاب")],
            [KeyboardButton(text="📊 الإحصائيات المالية"), KeyboardButton(text="⚙️ الإعدادات")],
            [KeyboardButton(text="📢 الإعلانات"), KeyboardButton(text="🆘 الدعم")]
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 2. Supervisor/Admin Menu
    if user_service.is_admin_or_supervisor(telegram_id):
        keyboard = [
            [KeyboardButton(text="👨‍🎓 إدارة الطلاب")],
            [KeyboardButton(text="📝 طلبات التسجيل"), KeyboardButton(text="💳 طلبات الدفع")],
            [KeyboardButton(text="⏱ خصم دقائق الجلسات")],
            [KeyboardButton(text="🆘 الدعم")]
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 3. Student Menu (Default)
    keyboard = [
        [KeyboardButton(text="📖 التعريف بالمقرأة"), KeyboardButton(text="📚 البرامج")],
        [KeyboardButton(text="📝 التسجيل"), KeyboardButton(text="💳 باقات الدفع")],
        [KeyboardButton(text="⏱ رصيدي"), KeyboardButton(text="🆘 الدعم")]
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

def get_cancel_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="❌ إلغاء")]], resize_keyboard=True)