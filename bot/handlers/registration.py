"""
Registration Handler - Strict FSM, Multilingual & Inline Callbacks
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

@router.message(F.text.in_(["📝 التسجيل", "📝 Register", "📝 ምዝገባ"]))
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
        await message.answer(t("operation_cancelled", lang), reply_markup=get_main_menu_keyboard(message.from_user.id, lang))
        return
    await state.update_data(full_name=message.text)
    await message.answer(t("reg_step_2", lang))
    await state.set_state(RegStates.age)

@router.message(RegStates.age)
async def process_age(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    if not message.text.isdigit():
        await message.answer("❌ يرجى إدخال العمر بالأرقام فقط.")
        return
    await state.update_data(age=int(message.text))
    await message.answer(t("reg_step_4", lang)) # تخطينا الدولة للمدينة حسب الكود السابق
    await state.set_state(RegStates.country)

@router.message(RegStates.country)
async def process_country(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(country=message.text)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("reg_gender_male", lang), callback_data="reg_gender_male")],
        [InlineKeyboardButton(text=t("reg_gender_female", lang), callback_data="reg_gender_female")]
    ])
    await message.answer(t("reg_step_3", lang), reply_markup=kb)
    await state.set_state(RegStates.gender)

# 🛑 حماية: منع الكتابة في خطوة الجنس
@router.message(RegStates.gender)
async def warn_gender_text(message: Message):
    await message.answer("⚠️ يرجى اختيار الجنس من الأزرار الموجودة بالأعلى (ذكر / أنثى)، أو أرسل /start للبدء من جديد.")

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
    await state.update_data(phone=message.text)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📖 التلقين وتصحيح الأداء", callback_data="reg_prog_talqeen")],
        [InlineKeyboardButton(text="📖 الحفظ المكثف", callback_data="reg_prog_hifz")],
        [InlineKeyboardButton(text="🎓 الإجازة برواية حفص", callback_data="reg_prog_ijazah_hafs")],
        [InlineKeyboardButton(text="🎓 الإجازة بالقراءات السبع", callback_data="reg_prog_ijazah_sabaa")]
    ])
    await message.answer(t("reg_step_8", lang), reply_markup=kb)
    await state.set_state(RegStates.program)

# 🛑 حماية: منع الكتابة في خطوة البرنامج
@router.message(RegStates.program)
async def warn_program_text(message: Message):
    await message.answer("⚠️ يرجى اختيار البرنامج من الأزرار الموجودة بالأعلى، أو أرسل /start للبدء من جديد.")

@router.callback_query(RegStates.program, F.data.startswith("reg_prog_"))
async def process_program(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    program = callback.data.replace("reg_prog_", "")
    await state.update_data(program_id=program)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("reg_shift_morning", lang), callback_data="reg_period_morning")],
        [InlineKeyboardButton(text=t("reg_shift_afternoon", lang), callback_data="reg_period_afternoon")],
        [InlineKeyboardButton(text=t("reg_shift_night", lang), callback_data="reg_period_night")]
    ])
    await callback.message.edit_text(t("reg_step_9", lang), reply_markup=kb)
    await state.set_state(RegStates.period)
    await callback.answer()

# 🛑 حماية: منع الكتابة في خطوة الفترة
@router.message(RegStates.period)
async def warn_period_text(message: Message):
    await message.answer("⚠️ يرجى اختيار الفترة من الأزرار الموجودة بالأعلى، أو أرسل /start للبدء من جديد.")

@router.callback_query(RegStates.period, F.data.startswith("reg_period_"))
async def process_period(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    period = callback.data.replace("reg_period_", "")
    await state.update_data(period=period)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌱 مبتدئ", callback_data="reg_level_beginner")],
        [InlineKeyboardButton(text="🌿 متوسط", callback_data="reg_level_intermediate")],
        [InlineKeyboardButton(text="🌳 متقدم", callback_data="reg_level_advanced")],
        [InlineKeyboardButton(text="🎓 مجاز", callback_data="reg_level_ijazah")]
    ])
    await callback.message.edit_text(t("reg_step_10", lang), reply_markup=kb)
    await state.set_state(RegStates.level)
    await callback.answer()

# 🛑 حماية: منع الكتابة في خطوة المستوى
@router.message(RegStates.level)
async def warn_level_text(message: Message):
    await message.answer("⚠️ يرجى اختيار المستوى من الأزرار الموجودة بالأعلى، أو أرسل /start للبدء من جديد.")

@router.callback_query(RegStates.level, F.data.startswith("reg_level_"))
async def process_level(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    level = callback.data.replace("reg_level_", "")
    await state.update_data(level=level)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="0 - لم أحفظ بعد", callback_data="reg_mem_none")],
        [InlineKeyboardButton(text="1-5 أجزاء", callback_data="reg_mem_1_5")],
        [InlineKeyboardButton(text="6-10 أجزاء", callback_data="reg_mem_6_10")],
        [InlineKeyboardButton(text="11-20 جزءاً", callback_data="reg_mem_11_20")],
        [InlineKeyboardButton(text="21-30 جزءاً", callback_data="reg_mem_21_30")],
        [InlineKeyboardButton(text="🕌 حافظ كامل", callback_data="reg_mem_full")]
    ])
    await callback.message.edit_text(t("reg_step_13", lang), reply_markup=kb)
    await state.set_state(RegStates.memorization)
    await callback.answer()

# 🛑 حماية: منع الكتابة في خطوة الحفظ (هذه هي المشكلة التي واجهتها)
@router.message(RegStates.memorization)
async def warn_memorization_text(message: Message):
    await message.answer("⚠️ يرجى اختيار مقدار الحفظ من الأزرار الزرقاء الموجودة بالأعلى، أو أرسل /start للبدء من جديد.")

@router.callback_query(RegStates.memorization, F.data.startswith("reg_mem_"))
async def process_memorization(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    mem = callback.data.replace("reg_mem_", "")
    await state.update_data(memorization=mem)
    
    data = await state.get_data()
    summary = (
        f"📝 *{t('reg_summary_title', lang)}*\n\n"
        f"👤 {t('reg_step_1', lang)}: {data.get('full_name')}\n"
        f"🎂 {t('reg_step_2', lang)}: {data.get('age')}\n"
        f"🌍 {t('reg_step_4', lang)}: {data.get('country')}\n"
        f"⚧ {t('reg_step_3', lang)}: {data.get('gender')}\n"
        f"📱 {t('reg_step_6', lang)}: {data.get('phone')}\n"
        f"📚 {t('reg_step_8', lang)}: {data.get('program_id')}\n"
        f"⏰ {t('reg_step_9', lang)}: {data.get('period')}\n"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأكيد الإرسال", callback_data="reg_submit")],
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
    
    try:
        reg_data = {
            "user_id": user_id,
            "full_name": data['full_name'],
            "age": data['age'],
            "country": data['country'],
            "gender": data['gender'],
            "program_id": data['program_id'],
            "period": data['period'],
            "status": "pending"
        }
        supabase.table('registrations').insert(reg_data).execute()
        
        await callback.bot.send_message(
            chat_id=settings.SUPER_ADMIN_TELEGRAM_ID,
            text=f"🔔 *طلب تسجيل جديد!*\nالاسم: {data['full_name']}\nالفترة: {data['period']}"
        )
        await callback.message.edit_text(t("reg_submitted_success", lang), parse_mode="Markdown")
    except Exception as e:
        await callback.message.edit_text(f"⚠️ Error: {str(e)}")
    
    await state.clear()
    await callback.answer()

@router.callback_query(F.data == "reg_cancel")
async def cancel_callback(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    lang = user_service.get_user_language(callback.from_user.id)
    await callback.message.edit_text(t("operation_cancelled", lang))
    await callback.answer()