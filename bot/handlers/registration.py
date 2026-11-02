"""
Registration Handler - Strict FSM, Multilingual & Inline Callbacks
Saves data to Supabase as 'pending'.
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
    await message.answer(t("reg_enter_name", lang), reply_markup=get_cancel_keyboard(lang))
    await state.set_state(RegStates.full_name)

@router.message(RegStates.full_name)
async def process_name(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    if message.text in ["❌ إلغاء", "❌ Cancel", "❌ ሰርዝ"]:
        await state.clear()
        await message.answer("❌ Cancelled.")
        return
    await state.update_data(full_name=message.text)
    await message.answer(t("reg_enter_age", lang))
    await state.set_state(RegStates.age)

@router.message(RegStates.age)
async def process_age(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    if not message.text.isdigit():
        await message.answer(t("reg_invalid_age", lang))
        return
    await state.update_data(age=int(message.text))
    await message.answer(t("reg_enter_country", lang))
    await state.set_state(RegStates.country)

@router.message(RegStates.country)
async def process_country(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(country=message.text)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("reg_male", lang), callback_data="reg_gender_male")],
        [InlineKeyboardButton(text=t("reg_female", lang), callback_data="reg_gender_female")]
    ])
    await message.answer(t("reg_choose_gender", lang), reply_markup=kb)
    await state.set_state(RegStates.gender)

@router.callback_query(RegStates.gender, F.data.startswith("reg_gender_"))
async def process_gender(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    gender = "male" if callback.data == "reg_gender_male" else "female"
    await state.update_data(gender=gender)
    await callback.message.edit_text(t("reg_enter_phone", lang))
    await state.set_state(RegStates.phone)
    await callback.answer()

@router.message(RegStates.phone)
async def process_phone(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(phone=message.text)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📖 " + t("prog_talqeen", lang), callback_data="reg_prog_talqeen")],
        [InlineKeyboardButton(text="📖 " + t("prog_hifz", lang), callback_data="reg_prog_hifz")],
        [InlineKeyboardButton(text="🎓 " + t("prog_ijazah_hafs", lang), callback_data="reg_prog_ijazah_hafs")],
        [InlineKeyboardButton(text="🎓 " + t("prog_ijazah_sabaa", lang), callback_data="reg_prog_ijazah_sabaa")]
    ])
    await message.answer(t("reg_choose_program", lang), reply_markup=kb)
    await state.set_state(RegStates.program)

@router.callback_query(RegStates.program, F.data.startswith("reg_prog_"))
async def process_program(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    program = callback.data.replace("reg_prog_", "")
    await state.update_data(program_id=program)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("reg_morning", lang), callback_data="reg_period_morning")],
        [InlineKeyboardButton(text=t("reg_evening", lang), callback_data="reg_period_evening")],
        [InlineKeyboardButton(text=t("reg_night", lang), callback_data="reg_period_night")]
    ])
    await callback.message.edit_text(t("reg_choose_period", lang), reply_markup=kb)
    await state.set_state(RegStates.period)
    await callback.answer()

@router.callback_query(RegStates.period, F.data.startswith("reg_period_"))
async def process_period(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    period = callback.data.replace("reg_period_", "")
    await state.update_data(period=period)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("level_beginner", lang), callback_data="reg_level_beginner")],
        [InlineKeyboardButton(text=t("level_intermediate", lang), callback_data="reg_level_intermediate")],
        [InlineKeyboardButton(text=t("level_advanced", lang), callback_data="reg_level_advanced")],
        [InlineKeyboardButton(text=t("level_ijazah", lang), callback_data="reg_level_ijazah")]
    ])
    await callback.message.edit_text(t("reg_choose_level", lang), reply_markup=kb)
    await state.set_state(RegStates.level)
    await callback.answer()

@router.callback_query(RegStates.level, F.data.startswith("reg_level_"))
async def process_level(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    level = callback.data.replace("reg_level_", "")
    await state.update_data(level=level)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("mem_none", lang), callback_data="reg_mem_none")],
        [InlineKeyboardButton(text=t("mem_1_5", lang), callback_data="reg_mem_1_5")],
        [InlineKeyboardButton(text=t("mem_full", lang), callback_data="reg_mem_full")]
    ])
    await callback.message.edit_text(t("reg_choose_mem", lang), reply_markup=kb)
    await state.set_state(RegStates.memorization)
    await callback.answer()

@router.callback_query(RegStates.memorization, F.data.startswith("reg_mem_"))
async def process_memorization(callback: CallbackQuery, state: FSMContext):
    lang = user_service.get_user_language(callback.from_user.id)
    mem = callback.data.replace("reg_mem_", "")
    await state.update_data(memorization=mem)
    
    data = await state.get_data()
    summary = (
        f"📝 *{t('reg_review_title', lang)}*\n\n"
        f"👤 {t('reg_name', lang)}: {data['full_name']}\n"
        f"🎂 {t('reg_age', lang)}: {data['age']}\n"
        f"🌍 {t('reg_country', lang)}: {data['country']}\n"
        f"⚧ {t('reg_gender', lang)}: {t('reg_male', lang) if data['gender'] == 'male' else t('reg_female', lang)}\n"
        f"📱 {t('reg_phone', lang)}: {data['phone']}\n"
        f"📚 {t('reg_program', lang)}: {data['program_id']}\n"
        f"⏰ {t('reg_period', lang)}: {data['period']}\n"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("reg_confirm_btn", lang), callback_data="reg_submit")],
        [InlineKeyboardButton(text=t("reg_cancel_btn", lang), callback_data="reg_cancel")]
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
        await callback.message.edit_text(t("reg_success", lang))
    except Exception as e:
        await callback.message.edit_text(f"⚠️ Error: {str(e)}")
    
    await state.clear()
    await callback.answer()

@router.callback_query(F.data == "reg_cancel")
async def cancel_callback(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("❌ Cancelled.")
    await callback.answer()