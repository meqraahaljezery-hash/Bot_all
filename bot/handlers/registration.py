from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.keyboards.reply import get_cancel_keyboard

router = Router(name="registration_router")

class RegStates(StatesGroup):
    full_name = State()
    age = State()
    country = State()
    gender = State() # سيكون Callback
    memorization = State() # سيكون Callback
    phone = State()
    review = State()

@router.message(F.text == "📝 التسجيل")
async def start_registration(message: Message, state: FSMContext):
    await message.answer("الرجاء إدخال الاسم الكامل:", reply_markup=get_cancel_keyboard())
    await state.set_state(RegStates.full_name)

@router.message(RegStates.full_name)
async def process_name(message: Message, state: FSMContext):
    if message.text == "❌ إلغاء":
        await state.clear()
        await message.answer("تم إلغاء التسجيل.")
        return
    await state.update_data(full_name=message.text)
    await message.answer("الرجاء إدخال العمر (أرقام فقط):")
    await state.set_state(RegStates.age)

@router.message(RegStates.age)
async def process_age(message: Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("❌ يرجى إدخال أرقام فقط للعمر.")
        return
    await state.update_data(age=message.text)
    
    # هنا نستخدم الأزرار الشفافة (Inline) للجنس
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="ذكر", callback_data="gender_male")],
        [InlineKeyboardButton(text="أنثى", callback_data="gender_female")]
    ])
    await message.answer("الرجاء اختيار الجنس:", reply_markup=kb)
    await state.set_state(RegStates.gender)

# ⚠️ هنا نستقبل الـ Callback وليس الـ Message
@router.callback_query(RegStates.gender, F.data.startswith("gender_"))
async def process_gender(callback: CallbackQuery, state: FSMContext):
    gender = "male" if callback.data == "gender_male" else "female"
    await state.update_data(gender=gender)
    
    # أزرار مقدار الحفظ
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="لم أحفظ بعد", callback_data="mem_none")],
        [InlineKeyboardButton(text="1-5 أجزاء", callback_data="mem_1_5")],
        [InlineKeyboardButton(text="حافظ كامل", callback_data="mem_full")]
    ])
    await callback.message.edit_text("اختر مقدار الحفظ:", reply_markup=kb)
    await state.set_state(RegStates.memorization)
    await callback.answer()

@router.callback_query(RegStates.memorization, F.data.startswith("mem_"))
async def process_mem(callback: CallbackQuery, state: FSMContext):
    await state.update_data(memorization=callback.data)
    
    # عرض ملخص المراجعة
    data = await state.get_data()
    summary = (
        f"📝 *مراجعة البيانات:*\n\n"
        f"👤 الاسم: {data['full_name']}\n"
        f"🎂 العمر: {data['age']}\n"
        f"⚧ الجنس: {data['gender']}\n"
        f"📖 الحفظ: {data['memorization']}\n\n"
        f"هل أنت متأكد من إرسال الطلب؟"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأكيد وإرسال", callback_data="confirm_reg")],
        [InlineKeyboardButton(text="❌ إلغاء", callback_data="cancel_reg")]
    ])
    await callback.message.edit_text(summary, parse_mode="Markdown", reply_markup=kb)
    await state.set_state(RegStates.review)
    await callback.answer()

@router.callback_query(RegStates.review, F.data == "confirm_reg")
async def submit_registration(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    # ⚠️ هنا تقوم بحفظ الطلب في قاعدة البيانات بحالة pending فقط!
    # request_id = db.create_registration_request(data, user_id=callback.from_user.id)
    
    await callback.message.edit_text("✅ تم إرسال طلبك بنجاح. طلبك الآن قيد المراجعة من قبل الإدارة.")
    await state.clear()
    await callback.answer()