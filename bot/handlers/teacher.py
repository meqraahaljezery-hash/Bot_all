"""
Teacher Portal Handler.
Allows assigned teachers to view their groups, student rosters, and post group announcements.
Teachers cannot access other teachers' groups or modify balances.
"""

from aiogram import Router, F
from aiogram.types import Message
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.group_service import group_service

router = Router(name="teacher_router")


@router.message(F.text.in_([
    "👨‍🏫 بوابة المعلم", "👨‍🏫 Teacher Portal", "👨‍🏫 የአስተማሪ ፖርታል"
]))
async def handle_teacher_portal(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    if not user_service.is_teacher(user_id):
        await message.answer(t("admin_access_denied", lang))
        return

    teacher_groups = group_service.get_teacher_groups(str(user_id))

    text = (
        f"👨‍🏫 *بوابة المعلم والمقرئ*\n\n"
        f"مرحباً بك يا فضيلة الشيخ في مقرأة الإمام الجزري.\n"
        f"الحلقات المسندة إليك: *{len(teacher_groups)} حلقة*\n\n"
    )

    if not teacher_groups:
        text += "📌 لم يتم إسناد حلقات إليك حالياً من قبل الإدارة العامة."
    else:
        for g in teacher_groups:
            text += f"🌿 *{g['name']}* | {g['current_members_count']}/{g['max_members']} طالب | الفترة: {g['shift']}\n"

    await message.answer(text, parse_mode="Markdown")
