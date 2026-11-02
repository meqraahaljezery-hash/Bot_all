"""
Start and Onboarding Handlers
"""
from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.config import settings
from bot.keyboards.reply import get_main_menu_keyboard
from bot.keyboards.inline import get_language_keyboard

router = Router(name="start_router")

@router.message(CommandStart())
async def handle_start(message: Message, state: FSMContext):
    await state.clear() # 🔥 يمسح أي حالة سابقة لكي لا يعلق البوت
    
    user_id = message.from_user.id
    
    user = user_service.register_or_get_user(
        telegram_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name,
    )
    lang = user.get("preferred_language", "ar")

    welcome_text = (
        f"{t('welcome', lang)}\n\n"
        f"🌿 *{settings.CENTER_NAME_AR}*\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"{t('main_menu_title', lang)}"
    )

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
    await callback.message.delete()

    menu_text = f"📖 *{t('main_menu_title', lang_code)}*"
    await callback.message.answer(
        text=menu_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(user_id, lang_code),
    )
    await callback.answer()