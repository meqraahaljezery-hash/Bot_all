from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, CallbackQuery
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.config import settings
from bot.keyboards.reply import get_main_menu_keyboard
from bot.keyboards.inline import get_language_keyboard

router = Router(name="start_router")

@router.message(CommandStart())
async def handle_start(message: Message):
    user_id = message.from_user.id
    
    # جلب المستخدم أو تسجيله
    user = user_service.register_or_get_user(
        telegram_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name,
    )
    lang = user.get("preferred_language", "ar")

    # إرسال رسالة الترحيب مع القائمة الرئيسية مباشرة
    welcome_text = (
        f"{t('welcome', lang)}\n\n"
        f"🌿 *{settings.CENTER_NAME_AR}*\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"{t('main_menu_title', lang)}"
    )

    # إرسال القائمة (هذا سيقوم بمسح القائمة القديمة في تيليجرام)
    await message.answer(
        text=welcome_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(user_id, lang),
    )

@router.callback_query(F.data.startswith("set_lang:"))
async def handle_set_language(callback: CallbackQuery):
    lang_code = callback.data.split(":")[1]
    user_id = callback.from_user.id

    user_service.set_user_language(user_id, lang_code)
    await callback.message.delete() # حذف رسالة اختيار اللغة

    menu_text = f"📖 *{t('main_menu_title', lang_code)}*"
    await callback.message.answer(
        text=menu_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(user_id, lang_code),
    )
    await callback.answer()