"""
Registration Handler - Strict FSM, Multilingual & Inline Callbacks.
Collects applicant information and saves registration request.
"""
from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.keyboards.reply import get_cancel_keyboard
from bot.services.database import supabase
from bot.services.user_service import user_service
from bot.locales.i18n import t
from bot.config import settings

router = Router(name="registration_router")


class RegStates(StatesGroup):
    full_name = State()
    age = State()
    country = State()
    gender = State()
    phone = State()
    program = State()
    period = State()
    level = State()
    memorization = State()
    review = State()


@router.message(F.text.in_(["📝 التسجيل", "📝 Register", "📝 ምዝገባ", "📝 التسجيل والالتحاق"]))
async def start_registration(message: Message, state: FSMContext):
    await state.clear()
    lang = user_service.get_user_language(message.from_user.id)
    await message.answer(t("reg_step_1", lang), reply_markup=get_cancel_keyboard(lang))
    await state.set_state(RegStates.full_name)


@router.message(RegStates.full_name)
async def process_name(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    if message.text in ["❌ إلغاء", "❌ Cancel", "❌ ሰርዝ"]:
        await state.clear()
        await message.answer("❌ Cancelled.")
        return
    await state.update_data(full_name=message.text.strip())
    await message.answer(t("reg_step_2", lang))
    await state.set_state(RegStates.age)


@router.message(RegStates.age)
async def process_age(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    text = message.text.strip()
    if not text.isdigit() or int(text) < 4 or int(text) > 100:
        await message.answer("⚠️ يرجى إدخال عمر صحيح بالأرقام:")
        return
    await state.update_data(age=int(text))
    await message.answer(t("reg_step_4", lang))
    await state.set_state(RegStates.country)


@router.message(RegStates.country)
async def process_country(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(country=message.text.strip())
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👨 " + t("reg_gender_male", lang), callback_data="reg_gender_male")],
        [InlineKeyboardButton(text="👩 " + t("reg_gender_female", lang), callback_data="reg_gender_female")]
    ])
    await message.answer(t("reg_step_3", lang), reply_markup=kb)
    await state.set_state(RegStates.gender)


@router.callback_query(RegStates.gender, F.data.startswith("reg_gender_"))
async def process_gender(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    gender = "male" if callback.data == "reg_gender_male" else "female"
    await state.update_data(gender=gender)
    await callback.message.edit_text(t("reg_step_6", lang))
    await state.set_state(RegStates.phone)
    await callback.answer()


@router.message(RegStates.phone)
async def process_phone(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(phone=message.text.strip())
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📖 تصحيح التلاوة وتلقين القرآن", callback_data="reg_prog_talqeen")],
        [InlineKeyboardButton(text="📖 الحفظ المكثف والمراجعة", callback_data="reg_prog_hifz")],
        [InlineKeyboardButton(text="🎓 إجازة بالسند (حفص عن عاصم)", callback_data="reg_prog_ijazah_hafs")],
        [InlineKeyboardButton(text="🎓 إجازة القراءات السبع / العشر", callback_data="reg_prog_ijazah_sabaa")]
    ])
    await message.answer(t("reg_step_8", lang), reply_markup=kb)
    await state.set_state(RegStates.program)


@router.callback_query(RegStates.program, F.data.startswith("reg_prog_"))
async def process_program(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    program = callback.data.replace("reg_prog_", "")
    await state.update_data(program_id=program)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌅 صباحية (09:00 - 12:00)", callback_data="reg_period_morning")],
        [InlineKeyboardButton(text="☀️ مسائية (14:00 - 15:30)", callback_data="reg_period_afternoon")],
        [InlineKeyboardButton(text="🌙 ليلية (21:00 - 23:00)", callback_data="reg_period_night")]
    ])
    await callback.message.edit_text(t("reg_step_9", lang), reply_markup=kb)
    await state.set_state(RegStates.period)
    await callback.answer()


@router.callback_query(RegStates.period, F.data.startswith("reg_period_"))
async def process_period(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    raw_period = callback.data.replace("reg_period_", "")
    # Normalize 'evening' -> 'afternoon'
    period = "afternoon" if raw_period in ["evening", "afternoon"] else raw_period
    await state.update_data(period=period)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌱 مبتدئ (تأسيس)", callback_data="reg_level_beginner")],
        [InlineKeyboardButton(text="🌿 متوسط (ضبط أحكام التجويد)", callback_data="reg_level_intermediate")],
        [InlineKeyboardButton(text="🌳 متقدم (إتقان مخارج وصفات)", callback_data="reg_level_advanced")],
        [InlineKeyboardButton(text="🎓 خاتم مؤهل للإجازة", callback_data="reg_level_ijazah")]
    ])
    await callback.message.edit_text(t("reg_step_10", lang), reply_markup=kb)
    await state.set_state(RegStates.level)
    await callback.answer()


@router.callback_query(RegStates.level, F.data.startswith("reg_level_"))
async def process_level(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    level = callback.data.replace("reg_level_", "")
    await state.update_data(level=level)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔹 لا أحفظ شيئاً أو جزء عم", callback_data="reg_mem_none")],
        [InlineKeyboardButton(text="🔹 أحفظ من 1 إلى 5 أجزاء", callback_data="reg_mem_1_5")],
        [InlineKeyboardButton(text="🔹 أحفظ أكثر من 15 جزءاً", callback_data="reg_mem_15_plus")],
        [InlineKeyboardButton(text="🔹 خاتم للقرآن الكريم كاملاً", callback_data="reg_mem_full")]
    ])
    await callback.message.edit_text("كم تحفظ من القرآن الكريم؟", reply_markup=kb)
    await state.set_state(RegStates.memorization)
    await callback.answer()


@router.callback_query(RegStates.memorization, F.data.startswith("reg_mem_"))
async def process_memorization(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    mem = callback.data.replace("reg_mem_", "")
    await state.update_data(memorization=mem)
    
    data = await state.get_data()
    gender_ar = "ذكر 👨" if data.get('gender') == 'male' else "أنثى 👩"
    period_names = {
        "morning": "صباحية (09:00 - 12:00)",
        "afternoon": "مسائية (14:00 - 15:30)",
        "night": "ليلية (21:00 - 23:00)"
    }
    period_label = period_names.get(data.get('period', 'morning'), data.get('period', 'morning'))

    summary = (
        f"📋 *{t('reg_summary_title', lang)}*\n\n"
        f"👤 الاسم: {data.get('full_name')}\n"
        f"🎂 العمر: {data.get('age')}\n"
        f"🌍 الدولة: {data.get('country')}\n"
        f"⚧ الجنس: {gender_ar}\n"
        f"📱 الهاتف: {data.get('phone')}\n"
        f"📚 البرنامج: {data.get('program_id')}\n"
        f"⏰ الفترة: {period_label}\n"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأكيد وإرسال الطلب", callback_data="reg_submit")],
        [InlineKeyboardButton(text="❌ إلغاء", callback_data="reg_cancel")]
    ])
    await callback.message.edit_text(summary, parse_mode="Markdown", reply_markup=kb)
    await state.set_state(RegStates.review)
    await callback.answer()


@router.callback_query(RegStates.review, F.data == "reg_submit")
async def submit_registration(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)
    
    reg_data = {
        "user_id": user_id,
        "full_name": data.get('full_name', ''),
        "age": data.get('age', 0),
        "country": data.get('country', ''),
        "gender": data.get('gender', 'male'),
        "phone": data.get('phone', ''),
        "program_id": data.get('program_id', ''),
        "period": data.get('period', 'morning'),
        "level": data.get('level', ''),
        "memorization": data.get('memorization', ''),
        "status": "pending"
    }

    try:
        supabase.table('registrations').insert(reg_data).execute()
    except Exception:
        pass

    # Ensure user record exists
    user_service.register_or_get_user(
        telegram_id=user_id,
        username=callback.from_user.username,
        first_name=data.get('full_name')
    )

    # Notify admins
    admin_alert = (
        f"🔔 *طلب تسجيل جديد في المقرأة!*\n\n"
        f"👤 الاسم: {data.get('full_name')}\n"
        f"⚧ الجنس: {data.get('gender')}\n"
        f"⏰ الفترة: {data.get('period')}\n"
        f"📱 الهاتف: {data.get('phone')}\n"
        f"🆔 المعرف: `{user_id}`"
    )
    for admin_id in settings.SUPER_ADMIN_IDS:
        try:
            await callback.bot.send_message(chat_id=admin_id, text=admin_alert, parse_mode="Markdown")
        except Exception:
            pass

    success_text = (
        "🎉 *تم تقديم طلب التسجيل بنجاح!*\n\n"
        "طلبك قيد المراجعة لدى اللجنة العلمية بالمقرأة.\n"
        "سيصلك إشعار فوري هنا بالقبول ورابط مجموعتك فور اعتماده بإذن الله."
    )
    await callback.message.edit_text(success_text, parse_mode="Markdown")
    await state.clear()
    await callback.answer()


@router.callback_query(F.data == "reg_cancel")
async def cancel_callback(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("❌ تم إلغاء التسجيل.")
    await callback.answer()