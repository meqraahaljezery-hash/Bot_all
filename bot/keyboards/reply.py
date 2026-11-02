"""
Reply Keyboards for Imam Al-Jazari Telegram Bot.
"""

from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from bot.services.user_service import user_service

def get_main_menu_keyboard(telegram_id: int, lang: str = "ar") -> ReplyKeyboardMarkup:
    
    # 1. قائمة السوبر أدمن (لا يرى أزرار الطالب)
    if user_service.is_super_admin(telegram_id):
        keyboard = [
            [KeyboardButton(text="👨‍🎓 إدارة الطلاب والمستخدمين")],
            [KeyboardButton(text="📝 طلبات التسجيل"), KeyboardButton(text="💳 طلبات الدفع")],
            [KeyboardButton(text="⏱ خصم دقائق الجلسات"), KeyboardButton(text="🎁 تكريم الطلاب")],
            [KeyboardButton(text="📊 الإحصائيات المالية"), KeyboardButton(text="👥 إدارة المجموعات")],
            [KeyboardButton(text="📢 الإعلانات"), KeyboardButton(text="🆘 الدعم")],
            [KeyboardButton(text="⚙️ الإعدادات")]
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 2. قائمة المشرفين (Admin/Supervisor)
    if user_service.is_admin_or_supervisor(telegram_id):
        keyboard = [
            [KeyboardButton(text="👨‍🎓 إدارة الطلاب")],
            [KeyboardButton(text="📝 طلبات التسجيل"), KeyboardButton(text="💳 طلبات الدفع")],
            [KeyboardButton(text="⏱ خصم دقائق الجلسات")],
            [KeyboardButton(text="🆘 الدعم")]
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 3. قائمة المعلم
    if user_service.is_teacher(telegram_id):
        keyboard = [
            [KeyboardButton(text="👨‍🏫 بوابة المعلم")],
            [KeyboardButton(text="👥 مجموعتي"), KeyboardButton(text="🆘 الدعم")],
            [KeyboardButton(text="📖 التعريف بالمقرأة"), KeyboardButton(text="⚙️ إعداداتي")]
        ]
        return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

    # 4. قائمة الطالب (استعدنا كل الأزرار القديمة)
    keyboard = [
        [KeyboardButton(text="📖 التعريف بالمقرأة"), KeyboardButton(text="📚 البرامج")],
        [KeyboardButton(text="📝 التسجيل"), KeyboardButton(text="💳 باقات الدفع")],
        [KeyboardButton(text="⏱ رصيدي"), KeyboardButton(text="💰 طلباتي المالية")],
        [KeyboardButton(text="👥 مجموعتي"), KeyboardButton(text="🆘 الدعم")],
        [KeyboardButton(text="🔔 الإشعارات"), KeyboardButton(text="⚙️ إعداداتي")],
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, is_persistent=True)

def get_cancel_keyboard(lang: str = "ar") -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="❌ إلغاء")]], resize_keyboard=True)