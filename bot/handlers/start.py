"""
Start and Onboarding Handlers for Imam Al-Jazari Telegram Bot.
Handles /start, language selection, welcome presentation, and main menu routing.
"""

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
    user = user_service.register_or_get_user(
        telegram_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name,
    )
    lang = user.get("preferred_language", "ar")

    # Welcome message with language selector
    welcome_text = (
        f"{t('welcome', lang)}\n\n"
        f"🌿 *{settings.CENTER_NAME_AR}*\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"{t('choose_language', lang)}"
    )

    await message.answer(
        text=welcome_text,
        parse_mode="Markdown",
        reply_markup=get_language_keyboard(),
    )


@router.callback_query(F.data.startswith("set_lang:"))
async def handle_set_language(callback: CallbackQuery):
    lang_code = callback.data.split(":")[1]
    user_id = callback.from_user.id

    user_service.set_user_language(user_id, lang_code)
    
    confirm_text = t("lang_set", lang_code)
    await callback.message.edit_text(confirm_text)

    # Send main menu
    menu_text = (
        f"📖 *{t('main_menu_title', lang_code)}*\n\n"
        f"🌿 مرحباً بك مجدداً في مقرأة الإمام الجزري للإقراء والإجازة بالسند."
    )
    await callback.message.answer(
        text=menu_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(user_id, lang_code),
    )
    await callback.answer()


@router.message(Command("language"))
async def handle_language_command(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    await message.answer(
        text=t("choose_language", lang),
        reply_markup=get_language_keyboard(),
    )


@router.message(F.text.in_([
    "📖 التعريف بالمقرأة", "📖 About the Center", "📖 ስለ ማዕከሉ"
]))
async def handle_about(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    about_text = t(
        "about_text",
        lang,
        phone=settings.CONTACT_PHONE,
        email=settings.CONTACT_EMAIL,
    )
    await message.answer(about_text, parse_mode="Markdown")
