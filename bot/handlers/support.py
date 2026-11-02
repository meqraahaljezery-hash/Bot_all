"""
Support, Contact & Ticketing Handler for Imam Al-Jazari Maqraah.
Official Contact Information:
- Phone: 0990161372
- Email: kalidahd7@gmil.com
"""

import uuid
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.config import settings

router = Router(name="support_router")


class SupportStates(StatesGroup):
    subject = State()
    message = State()


SUPPORT_TICKETS_STORE = {}


@router.message(F.text.in_([
    "💬 التواصل والدعم", "💬 Contact & Support", "💬 ድጋፍ እና ግንኙነት"
]))
@router.message(Command("support"))
async def handle_support_info(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    text = t(
        "support_info",
        lang,
        phone=settings.CONTACT_PHONE,
        email=settings.CONTACT_EMAIL,
    )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("support_open_ticket", lang), callback_data="open_ticket")]
        ]
    )

    await message.answer(text, parse_mode="Markdown", reply_markup=kb)


@router.callback_query(F.data == "open_ticket")
async def start_ticket_creation(callback: CallbackQuery, state: FSMContext):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.set_state(SupportStates.subject)
    await callback.message.edit_text(t("support_enter_subject", lang))
    await callback.answer()


@router.message(SupportStates.subject)
async def process_ticket_subject(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.update_data(subject=message.text.strip())
    await state.set_state(SupportStates.message)
    await message.answer(t("support_enter_message", lang))


@router.message(SupportStates.message)
async def process_ticket_message(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    data = await state.get_data()

    ticket_number = f"TK-{str(uuid.uuid4())[:6].upper()}"
    SUPPORT_TICKETS_STORE[ticket_number] = {
        "ticket_number": ticket_number,
        "user_id": str(user_id),
        "subject": data.get("subject"),
        "message": message.text.strip(),
        "status": "open",
        "replies": [],
    }

    await state.clear()
    await message.answer(
        text=t("support_ticket_created", lang, ticket_number=ticket_number),
        parse_mode="Markdown",
    )
