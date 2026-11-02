"""
Student Educational Groups & Telegram Link Handler.
Enforces privacy: students can ONLY see their assigned group.
"""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.group_service import group_service
from bot.keyboards.inline import get_telegram_group_keyboard

router = Router(name="groups_router")


@router.message(F.text.in_([
    "👥 مجموعتي التعليمية", "👥 My Quranic Group", "👥 የትምህርት ክፍሌ (ሀለቃ)"
]))
@router.message(Command("mygroup"))
async def handle_my_group(message: Message):
    user_id = str(message.from_user.id)
    lang = user_service.get_user_language(int(user_id))

    group = group_service.get_student_group(user_id)

    if not group:
        await message.answer(
            text=f"{t('group_title', lang)}{t('group_not_assigned', lang)}",
            parse_mode="Markdown",
        )
        return

    text = (
        f"{t('group_title', lang)}"
        f"{t('group_details', lang, name=group['name'], program=group['program_id'], teacher='الشيخ المشرف', shift=group['shift'], members=group['current_members_count'], max_members=group['max_members'])}"
    )

    reply_markup = None
    if group.get("telegram_invite_link"):
        reply_markup = get_telegram_group_keyboard(group["telegram_invite_link"], lang)

    await message.answer(text, parse_mode="Markdown", reply_markup=reply_markup)
