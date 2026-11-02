"""
Registration Handler - Strict FSM & Inline Callbacks
Saves data to Supabase as 'pending' and notifies supervisors.
"""
from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.keyboards.reply import get_cancel_keyboard
from bot.services.database import supabase
from bot.config import settings

router = Router(name="registration_router")

# ==========================================
# حالات التسجيل (FSM States)
# ==========================================
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

# ==========================================
# 1. بدء التسجيل
# ==========================================
@router.message(F.text.in_(["📝 التسجيل", "📝 Register", "📝 ምዝገባ"]))
async def start_registration(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "📝 *استمارة التسجيل*\n\nالرجاء إدخال اسمك الكامل (الثلاثي):",
        parse_mode="Markdown",
        reply_markup=get_cancel_keyboard()
    )
    await state.set_state(RegStates.full_name)

# ==========================================
# 2. إدخال الاسم والعمر والدولة والهاتف (نصوص)
# ==========================================
@router.message(RegStates.full_name)
async def process_name(message: Message, state: FSMContext):
    if message.text == "❌ إلغاء":
        await cancel_registration(message, state)
        return
    await state.update_data(full_name=message.text)
    await message.answer("🎂 كم عمرك؟ (أرقام فقط):")
    await state.set_state(RegStates.age)

@router.message(RegStates.age)
async def process_age(message: Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("❌ يرجى إدخال العمر بالأرقام فقط.")
        return
    await state.update_data(age=int(message.text))
    await message.answer("🌍 ما هي دولتك؟")
    await state.set_state(RegStates.country)

@router.message(RegStates.country)
async def process_country(message: Message, state: FSMContext):
    await state.update_data(country=message.text)
    
    # استخدام الأزرار التفاعلية للجنس (يمنع الخلط مع النصوص)
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👨 ذكر", callback_data="reg_gender_male")],
        [InlineKeyboardButton(text="👩 أنثى", callback_data="reg_gender_female")]
    ])
    await message.answer("⚧ يرجى اختيار الجنس:", reply_markup=kb)
    await state.set_state(RegStates.gender)

@router.callback_query(RegStates.gender, F.data.startswith("reg_gender_"))
async def process_gender(callback: CallbackQuery, state: FSMContext):
    gender = "male" if callback.data == "reg_gender_male" else "female"
    await state.update_data(gender=gender)
    await callback.message.edit_text("📱 يرجى إدخال رقم هاتفك (مع رمز الدولة):")
    await state.set_state(RegStates.phone)
    await callback.answer()

@router.message(RegStates.phone)
async def process_phone(message: Message, state: FSMContext):
    await state.update_data(phone=message.text)
    
    # اختيار البرنامج من الإعدادات أو قاعدة البيانات
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📖 التلقين وتصحيح الأداء", callback_data="reg_prog_talqeen")],
        [InlineKeyboardButton(text="📖 الحفظ المكثف", callback_data="reg_prog_hifz")],
        [InlineKeyboardButton(text="🎓 الإجازة برواية حفص", callback_data="reg_prog_ijazah_hafs")],
        [InlineKeyboardButton(text="🎓 الإجازة بالقراءات السبع", callback_data="reg_prog_ijazah_sabaa")]
    ])
    await message.answer("📚 يرجى اختيار البرنامج التعليمي:", reply_markup=kb)
    await state.set_state(RegStates.program)

# ==========================================
# 3. اختيارات الأزرار (البرنامج، الفترة، المستوى، الحفظ)
# ==========================================
@router.callback_query(RegStates.program, F.data.startswith("reg_prog_"))
async def process_program(callback: CallbackQuery, state: FSMContext):
    program = callback.data.replace("reg_prog_", "")
    await state.update_data(program_id=program)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌅 الفترة الصباحية", callback_data="reg_period_morning")],
        [InlineKeyboardButton(text="🌇 الفترة المسائية", callback_data="reg_period_evening")],
        [InlineKeyboardButton(text="🌙 الفترة الليلية", callback_data="reg_period_night")]
    ])
    await callback.message.edit_text("⏰ اختر الفترة التعليمية المناسبة لك:", reply_markup=kb)
    await state.set_state(RegStates.period)
    await callback.answer()

@router.callback_query(RegStates.period, F.data.startswith("reg_period_"))
async def process_period(callback: CallbackQuery, state: FSMContext):
    period = callback.data.replace("reg_period_", "")
    await state.update_data(period=period)
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌱 مبتدئ", callback_data="reg_level_beginner")],
        [InlineKeyboardButton(text="🌿 متوسط", callback_data="reg_level_intermediate")],
        [InlineKeyboardButton(text="🌳 متقدم", callback_data="reg_level_advanced")],
        [InlineKeyboardButton(text="🎓 مجاز", callback_data="reg_level_ijazah")]
    ])
    await callback.message.edit_text("📈 ما هو مستواك القرآني الحالي؟", reply_markup=kb)
    await state.set_state(RegStates.level)
    await callback.answer()

@router.callback_query(RegStates.level, F.data.startswith("reg_level_"))
async def process_level(callback: CallbackQuery, state: FSMContext):
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
    await callback.message.edit_text("📖 كم مقدار الحفظ السابق لديك؟", reply_markup=kb)
    await state.set_state(RegStates.memorization)
    await callback.answer()

# ==========================================
# 4. المراجعة النهائية والإرسال إلى Supabase
# ==========================================
@router.callback_query(RegStates.memorization, F.data.startswith("reg_mem_"))
async def process_memorization(callback: CallbackQuery, state: FSMContext):
    mem = callback.data.replace("reg_mem_", "")
    await state.update_data(memorization=mem)
    
    # جلب جميع البيانات وعرضها للمراجعة
    data = await state.get_data()
    
    summary = (
        f"📝 *مراجعة بيانات التسجيل:*\n\n"
        f"👤 الاسم: {data['full_name']}\n"
        f"🎂 العمر: {data['age']}\n"
        f"🌍 الدولة: {data['country']}\n"
        f"⚧ الجنس: {data['gender']}\n"
        f"📱 الهاتف: {data['phone']}\n"
        f"📚 البرنامج: {data['program_id']}\n"
        f"⏰ الفترة: {data['period']}\n"
        f"📈 المستوى: {data['level']}\n"
        f"📖 الحفظ: {data['memorization']}\n\n"
        f"هل أنت متأكد من إرسال الطلب؟"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأكيد وإرسال", callback_data="reg_submit")],
        [InlineKeyboardButton(text="❌ إلغاء", callback_data="reg_cancel")]
    ])
    
    await callback.message.edit_text(summary, parse_mode="Markdown", reply_markup=kb)
    await state.set_state(RegStates.review)
    await callback.answer()

@router.callback_query(RegStates.review, F.data == "reg_submit")
async def submit_registration(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    user_id = callback.from_user.id
    
    # حفظ البيانات في جدول registrations في Supabase
    try:
        reg_data = {
            "user_id": user_id,
            "full_name": data['full_name'],
            "age": data['age'],
            "country": data['country'],
            "gender": data['gender'],
            "program_id": data['program_id'],
            "status": "pending"
        }
        
        response = supabase.table('registrations').insert(reg_data).execute()
        reg_id = response.data[0]['id']
        
        # إرسال إشعار للسوبر أدمن أو المشرفين
        try:
            await callback.bot.send_message(
                chat_id=settings.SUPER_ADMIN_TELEGRAM_ID,
                text=f"🔔 *طلب تسجيل جديد!*\n"
                     f"الاسم: {data['full_name']}\n"
                     f"البرنامج: {data['program_id']}\n"
                     f"رقم الطلب: `{reg_id}`\n"
                     f"يرجى الدخول للوحة الإدارة للمراجعة.",
                parse_mode="Markdown"
            )
        except Exception as e:
            print(f"فشل إرسال الإشعار: {e}")

        await callback.message.edit_text(
            "✅ *تم إرسال طلب التسجيل بنجاح.*\n\n"
            "طلبك الآن قيد مراجعة إدارة المقرأة. سيتم إشعارك عند اتخاذ القرار.\n"
            "تنبيه: إرسال الطلب لا يعني قبول التسجيل.",
            parse_mode="Markdown"
        )
    except Exception as e:
        await callback.message.edit_text(f"⚠️ حدث خطأ أثناء حفظ الطلب: {str(e)}")
    
    await state.clear()
    await callback.answer()

# ==========================================
# 5. إلغاء التسجيل
# ==========================================
@router.callback_query(F.data == "reg_cancel")
async def cancel_callback(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("❌ تم إلغاء طلب التسجيل.")
    await callback.answer()

async def cancel_registration(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("❌ تم إلغاء طلب التسجيل.")