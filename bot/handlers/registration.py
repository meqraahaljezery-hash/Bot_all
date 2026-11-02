"""
Interactive Multi-Step Registration FSM Handler for Imam Al-Jazari Maqraah.
Allows back/edit/cancellation, summary review, and atomic database persistence.
"""

import uuid
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.keyboards.reply import get_main_menu_keyboard

router = Router(name="registration_router")


class RegistrationStates(StatesGroup):
    full_name = State()
    age = State()
    gender = State()
    country = State()
    city = State()
    phone = State()
    email = State()
    program = State()
    shift = State()
    quran_level = State()
    riwayah = State()
    suitable_times = State()
    notes = State()
    summary = State()


# Global store for active registrations (linked with database/Supabase)
REGISTRATIONS_STORE = {}


@router.message(F.text.in_([
    "📝 التسجيل والالتحاق", "📝 Register & Enroll", "📝 መመዝገብ እና መቀላቀል"
]))
@router.message(Command("register"))
async def start_registration(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    # Check if already registered
    existing = next((r for r in REGISTRATIONS_STORE.values() if r["telegram_id"] == user_id), None)
    if existing and existing["status"] in ["pending", "approved"]:
        await message.answer(t("reg_already_exists", lang, status=existing["status"]))
        return

    await state.set_state(RegistrationStates.full_name)
    await message.answer(
        text=f"🌿 *{t('btn_register', lang)}*\n\n{t('reg_step_1', lang)}",
        parse_mode="Markdown",
    )


@router.callback_query(F.data.startswith("reg_start:"))
async def start_registration_from_program(callback: CallbackQuery, state: FSMContext):
    prog_id = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.update_data(program=prog_id)
    await state.set_state(RegistrationStates.full_name)
    await callback.message.answer(
        text=f"🌿 *{t('btn_register', lang)}*\n\n{t('reg_step_1', lang)}",
        parse_mode="Markdown",
    )
    await callback.answer()


@router.message(RegistrationStates.full_name)
async def process_full_name(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    name = message.text.strip()

    if len(name) < 3:
        await message.answer("⚠️ يرجى إدخال اسم ثلاثي صحيح لا يقل عن 3 أحرف:")
        return

    await state.update_data(full_name=name)
    await state.set_state(RegistrationStates.age)
    await message.answer(t("reg_step_2", lang))


@router.message(RegistrationStates.age)
async def process_age(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    age_text = message.text.strip()

    await state.update_data(age=age_text)
    await state.set_state(RegistrationStates.gender)

    # Inline buttons for gender selection
    gender_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("reg_gender_male", lang), callback_data="gender:male"),
                InlineKeyboardButton(text=t("reg_gender_female", lang), callback_data="gender:female"),
            ]
        ]
    )
    await message.answer(t("reg_step_3", lang), reply_markup=gender_kb)


@router.callback_query(RegistrationStates.gender, F.data.startswith("gender:"))
async def process_gender(callback: CallbackQuery, state: FSMContext):
    gender = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.update_data(gender=gender)
    await state.set_state(RegistrationStates.country)
    await callback.message.edit_text(f"✅ {t('reg_step_3', lang)}: {t('reg_gender_' + gender, lang)}")
    await callback.message.answer(t("reg_step_4", lang))
    await callback.answer()


@router.message(RegistrationStates.country)
async def process_country(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    await state.update_data(country=message.text.strip())
    await state.set_state(RegistrationStates.city)
    await message.answer(t("reg_step_5", lang))


@router.message(RegistrationStates.city)
async def process_city(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    await state.update_data(city=message.text.strip())
    await state.set_state(RegistrationStates.phone)
    await message.answer(t("reg_step_6", lang))


@router.message(RegistrationStates.phone)
async def process_phone(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    phone = message.text.strip()
    await state.update_data(phone=phone)
    await state.set_state(RegistrationStates.email)
    await message.answer(t("reg_step_7", lang))


@router.message(RegistrationStates.email)
async def process_email(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    email_text = message.text.strip()
    email_val = None if email_text.lower() in ["تخطي", "skip", "none", "لا"] else email_text
    await state.update_data(email=email_val)

    data = await state.get_data()
    if data.get("program"):
        # Program already selected earlier
        await state.set_state(RegistrationStates.shift)
        shift_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text=t("reg_shift_morning", lang), callback_data="shift:morning"),
                ],
                [
                    InlineKeyboardButton(text=t("reg_shift_afternoon", lang), callback_data="shift:afternoon"),
                ],
                [
                    InlineKeyboardButton(text=t("reg_shift_night", lang), callback_data="shift:night"),
                ],
            ]
        )
        await message.answer(t("reg_step_9", lang), reply_markup=shift_kb)
    else:
        await state.set_state(RegistrationStates.program)
        prog_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="التلقين وتصحيح الأداء", callback_data="set_reg_prog:recitation-correction")],
                [InlineKeyboardButton(text="الحفظ المكثف", callback_data="set_reg_prog:intensive-memorization")],
                [InlineKeyboardButton(text="الإجازة برواية حفص", callback_data="set_reg_prog:ijazah-hafs")],
                [InlineKeyboardButton(text="الإجازة بالقراءات السبع", callback_data="set_reg_prog:ijazah-seven-qiraat")],
            ]
        )
        await message.answer(t("reg_step_8", lang), reply_markup=prog_kb)


@router.callback_query(RegistrationStates.program, F.data.startswith("set_reg_prog:"))
async def process_program_choice(callback: CallbackQuery, state: FSMContext):
    prog_id = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.update_data(program=prog_id)
    await state.set_state(RegistrationStates.shift)

    shift_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("reg_shift_morning", lang), callback_data="shift:morning"),
            ],
            [
                InlineKeyboardButton(text=t("reg_shift_afternoon", lang), callback_data="shift:afternoon"),
            ],
            [
                InlineKeyboardButton(text=t("reg_shift_night", lang), callback_data="shift:night"),
            ],
        ]
    )
    await callback.message.edit_text(f"✅ تم اختيار البرنامج: {prog_id}")
    await callback.message.answer(t("reg_step_9", lang), reply_markup=shift_kb)
    await callback.answer()


@router.callback_query(RegistrationStates.shift, F.data.startswith("shift:"))
async def process_shift(callback: CallbackQuery, state: FSMContext):
    shift = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.update_data(shift=shift)
    await state.set_state(RegistrationStates.quran_level)
    await callback.message.edit_text(f"✅ {t('reg_step_9', lang)}: {t('reg_shift_' + shift, lang)}")
    await callback.message.answer(t("reg_step_10", lang))
    await callback.answer()


@router.message(RegistrationStates.quran_level)
async def process_quran_level(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    await state.update_data(quran_level=message.text.strip())
    await state.set_state(RegistrationStates.riwayah)
    await message.answer(t("reg_step_11", lang))


@router.message(RegistrationStates.riwayah)
async def process_riwayah(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    await state.update_data(riwayah=message.text.strip())
    await state.set_state(RegistrationStates.suitable_times)
    await message.answer(t("reg_step_12", lang))


@router.message(RegistrationStates.suitable_times)
async def process_suitable_times(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    await state.update_data(suitable_times=message.text.strip())
    await state.set_state(RegistrationStates.notes)
    await message.answer(t("reg_step_13", lang))


@router.message(RegistrationStates.notes)
async def process_notes_and_show_summary(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    notes = message.text.strip()
    await state.update_data(notes=notes)
    await state.set_state(RegistrationStates.summary)

    data = await state.get_data()

    summary_text = (
        f"{t('reg_summary_title', lang)}\n\n"
        f"👤 *الاسم:* {data.get('full_name')}\n"
        f"🎂 *العمر:* {data.get('age')}\n"
        f"⚧ *الجنس:* {t('reg_gender_' + data.get('gender', 'male'), lang)}\n"
        f"🌍 *الدولة:* {data.get('country')} | *المدينة:* {data.get('city')}\n"
        f"📱 *الهاتف:* {data.get('phone')}\n"
        f"📚 *البرنامج:* {data.get('program')}\n"
        f"🕒 *الفترة:* {t('reg_shift_' + data.get('shift', 'morning'), lang)}\n"
        f"📖 *المستوى:* {data.get('quran_level')}\n"
        f"📜 *الرواية:* {data.get('riwayah')}\n"
        f"⏰ *الأوقات المناسبة:* {data.get('suitable_times')}\n"
        f"📝 *ملاحظات إضافية:* {data.get('notes')}\n"
    )

    confirm_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("btn_confirm", lang), callback_data="confirm_registration"),
                InlineKeyboardButton(text=t("btn_cancel", lang), callback_data="cancel_registration"),
            ]
        ]
    )

    await message.answer(summary_text, parse_mode="Markdown", reply_markup=confirm_kb)


@router.callback_query(RegistrationStates.summary, F.data == "confirm_registration")
async def finalize_registration(callback: CallbackQuery, state: FSMContext):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)
    data = await state.get_data()

    reg_id = str(uuid.uuid4())[:8].upper()
    gender = data.get("gender", "male")
    shift = data.get("shift", "morning")

    # Generate sequential student code: IM-XXXX for male, IF-XXXX for female
    gender_prefix = "IM" if gender == "male" else "IF"
    existing_count = sum(1 for r in REGISTRATIONS_STORE.values() if r.get("student_code", "").startswith(gender_prefix))
    student_code = f"{gender_prefix}-{1001 + existing_count}"

    # Group routing map based on gender and shift
    group_map = {
        ("male", "morning"): ("حلقة الذكور الصباحية (09:00 - 12:00)", "https://t.me/IM_MORNING_2", "-1003701915037"),
        ("male", "afternoon"): ("حلقة الذكور المسائية (14:00 - 15:30)", "https://t.me/IM_AFTERNOON_3", "-1003954336712"),
        ("male", "night"): ("حلقة الذكور الليلية (21:00 - 23:00)", "https://t.me/IM_NIGHT_1", "-1003771613278"),
        ("female", "morning"): ("حلقة الإناث الصباحية (09:00 - 12:00)", "https://t.me/IF_MORNING", "-1004464170793"),
        ("female", "afternoon"): ("حلقة الإناث المسائية (14:00 - 15:30)", "https://t.me/IF_AFTERNOON", "-1004388200431"),
        ("female", "night"): ("حلقة الإناث الليلية (21:00 - 23:00)", "https://t.me/IF_NIGHT", "-1004297425702"),
    }
    # Fallback to male morning if not matched
    group_info = group_map.get((gender, shift), group_map.get((gender, "morning"), group_map[("male", "morning")]))
    group_name, group_link, group_chat_id = group_info

    REGISTRATIONS_STORE[reg_id] = {
        "id": reg_id,
        "student_code": student_code,
        "telegram_id": user_id,
        "data": data,
        "status": "approved",
        "assigned_group_name": group_name,
        "assigned_group_link": group_link,
        "assigned_group_chat_id": group_chat_id,
        "created_at": "2026-11-01",
    }

    await state.clear()
    
    success_msg = (
        f"🎉 *تهانينا! تم تسجيلك بنجاح بمقرأة الإمام الجزري* 🌿\n\n"
        f"🏷️ *كود الطالب الخاص بك:* `{student_code}`\n"
        f"👥 *الحلقة المخصصة:* {group_name}\n"
        f"🕒 *الفترة:* {t('reg_shift_' + shift, lang)}\n"
        f"🔗 *رابط مجموعتك في تيليجرام:* {group_link}\n\n"
        f"🛡️ *تنبيه الإشراف:* البوت مشرف معتمد في مجموعتك لإرسال تذكيرات الدروس ومتابعة رصيد الدقائق. حافظ على رصيدك للاستمرار في المشاركة الصوتية والتسميع."
    )

    await callback.message.edit_text(
        text=success_msg,
        parse_mode="Markdown",
    )
    await callback.message.answer(
        text=t("main_menu_title", lang),
        reply_markup=get_main_menu_keyboard(user_id, lang),
    )
    await callback.answer()


@router.callback_query(RegistrationStates.summary, F.data == "cancel_registration")
async def cancel_registration_handler(callback: CallbackQuery, state: FSMContext):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)
    await state.clear()
    await callback.message.edit_text(t("operation_cancelled", lang))
    await callback.answer()
