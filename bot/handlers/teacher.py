"""
Teacher Portal Handler - Interactive & Secure
Allows teachers to view their groups, student rosters, and send announcements.
"""
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.group_service import group_service
from bot.config import settings

router = Router(name="teacher_router")

# حالات FSM الخاصة بالمعلم
class TeacherStates(StatesGroup):
    waiting_for_announcement = State()

# ==========================================
# 1. القائمة الرئيسية للمعلم
# ==========================================
@router.message(F.text.in_([
    "👨‍🏫 بوابة المعلم", "👨‍🏫 Teacher Portal", "👨‍🏫 የአስተማሪ ፖርታል"
]))
async def handle_teacher_portal(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    # التحقق الصارم من الرتبة
    if not user_service.is_teacher(user_id):
        await message.answer(t("admin_access_denied", lang))
        return

    # جلب الحلقات من الخدمة
    teacher_groups = group_service.get_teacher_groups(str(user_id))

    if not teacher_groups:
        await message.answer("📌 لم يتم إسناد حلقات إليك حالياً من قبل الإدارة العامة.")
        return

    # بناء أزرار للحلقات التي يدرسها
    kb_buttons = []
    for g in teacher_groups:
        kb_buttons.append([InlineKeyboardButton(
            text=f"🌿 {g['name']} ({g.get('current_members_count', 0)} طالب)", 
            callback_data=f"tch_group:{g['group_id']}"
        )])

    kb = InlineKeyboardMarkup(inline_keyboard=kb_buttons)
    
    await message.answer(
        text="👨‍🏫 *بوابة المعلم والمقرئ*\n\nيرجى اختيار الحلقة للبدء:",
        parse_mode="Markdown",
        reply_markup=kb
    )

# ==========================================
# 2. تفاصيل الحلقة
# ==========================================
@router.callback_query(F.data.startswith("tch_group:"))
async def show_group_details(callback: CallbackQuery):
    group_id = callback.data.split(":")[1]
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👥 قائمة الطلاب", callback_data=f"tch_students:{group_id}")],
        [InlineKeyboardButton(text="📢 إرسال إعلان للحلقة", callback_data=f"tch_announce:{group_id}")],
        [InlineKeyboardButton(text="🔙 رجوع", callback_data="tch_back")]
    ])
    
    await callback.message.edit_text(
        text=f"📚 *إدارة الحلقة*\n\nماذا تريد أن تفعل في هذه الحلقة؟",
        parse_mode="Markdown",
        reply_markup=kb
    )
    await callback.answer()

@router.callback_query(F.data == "tch_back")
async def back_to_teacher_menu(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await handle_teacher_portal(callback.message)
    await callback.answer()

# ==========================================
# 3. عرض قائمة طلاب الحلقة
# ==========================================
@router.callback_query(F.data.startswith("tch_students:"))
async def show_group_students(callback: CallbackQuery):
    group_id = callback.data.split(":")[1]
    
    students = group_service.get_group_students(group_id)
    
    if not students:
        await callback.message.edit_text(
            "👥 لا يوجد طلاب مسجلون في هذه الحلقة حتى الآن.", 
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🔙 رجوع", callback_data=f"tch_group:{group_id}")]])
        )
        return

    text = "👥 *قائمة طلاب الحلقة:*\n\n"
    for idx, st in enumerate(students, 1):
        text += f"{idx}. {st.get('first_name', 'طالب')} (ID: `{st.get('telegram_id')}`)\n"
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 رجوع", callback_data=f"tch_group:{group_id}")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()

# ==========================================
# 4. إرسال إعلان للحلقة
# ==========================================
@router.callback_query(F.data.startswith("tch_announce:"))
async def start_announcement(callback: CallbackQuery, state: FSMContext):
    group_id = callback.data.split(":")[1]
    await state.update_data(announce_group_id=group_id)
    await state.set_state(TeacherStates.waiting_for_announcement)
    
    await callback.message.edit_text("📢 يرجى كتابة نص الإعلان الذي تريد إرساله لجميع طلاب هذه الحلقة:")
    await callback.answer()

@router.message(TeacherStates.waiting_for_announcement)
async def send_announcement(message: Message, state: FSMContext):
    data = await state.get_data()
    group_id = data['announce_group_id']
    announcement_text = message.text
    
    # البحث عن شات المجموعة من الإعدادات
    group_info = settings.STUDY_GROUPS.get(group_id) 
    
    if group_info and group_info.get("chat_id"):
        try:
            await message.bot.send_message(
                chat_id=group_info["chat_id"],
                text=f"📢 *إعلان من المعلم:*\n\n{announcement_text}",
                parse_mode="Markdown"
            )
            await message.answer("✅ تم إرسال الإعلان إلى الحلقة بنجاح.")
        except Exception as e:
            await message.answer(f"⚠️ فشل الإرسال إلى شات الحلقة: {str(e)}\n(تأكد أن البوت مشرف في المجموعة)")
    else:
        await message.answer("⚠️ لا يوجد شات مرتبط بهذه الحلقة في الإعدادات.")
        
    await state.clear()