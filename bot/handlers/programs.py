"""
Educational Programs Handler.
Programs are read dynamically from the database or catalog service.
"""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.keyboards.inline import get_programs_keyboard, get_program_details_keyboard
from bot.catalog import PROGRAMS_CATALOG

router = Router(name="programs_router")


@router.message(F.text.in_([
    "📚 البرامج التعليمية", "📚 Educational Programs", "📚 የትምህርት ፕሮግራሞች"
]))
@router.message(Command("programs"))
async def handle_programs_list(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    active_programs = [p for p in PROGRAMS_CATALOG if p.get("is_active", True)]

    text = t("programs_title", lang)
    await message.answer(
        text=text,
        parse_mode="Markdown",
        reply_markup=get_programs_keyboard(active_programs, lang),
    )


@router.callback_query(F.data == "view_programs_list")
async def handle_programs_callback(callback: CallbackQuery):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)
    active_programs = [p for p in PROGRAMS_CATALOG if p.get("is_active", True)]

    await callback.message.edit_text(
        text=t("programs_title", lang),
        parse_mode="Markdown",
        reply_markup=get_programs_keyboard(active_programs, lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("prog:"))
async def handle_program_detail(callback: CallbackQuery):
    program_id = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    prog = next((p for p in PROGRAMS_CATALOG if p["id"] == program_id), None)
    if not prog:
        await callback.answer(t("error_generic", lang), show_alert=True)
        return

    name = prog.get(f"name_{lang}", prog.get("name_ar"))
    desc = prog.get(f"description_{lang}", prog.get("description_ar"))
    objs = prog.get(f"objectives_{lang}", prog.get("objectives_ar", "تلقي القرآن بالسند"))
    reqs = prog.get(f"requirements_{lang}", prog.get("requirements_ar", "اجتياز اختبار القبول"))
    target = prog.get(f"target_audience_{lang}", prog.get("target_audience_ar", "عموم الطلاب الراغبين"))

    detail_text = t(
        "program_details",
        lang,
        name=name,
        description=desc,
        objectives=objs,
        requirements=reqs,
        target_audience=target,
        minutes=prog["minutes"],
    )

    await callback.message.edit_text(
        text=detail_text,
        parse_mode="Markdown",
        reply_markup=get_program_details_keyboard(program_id, lang),
    )
    await callback.answer()
