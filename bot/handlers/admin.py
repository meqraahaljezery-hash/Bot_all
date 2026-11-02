"""
Supervisor & Admin Panel Handler - Complete Edition
Includes automatic group assignment and welcome bonus.
"""
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.ledger_service import ledger_service
from bot.services.database import supabase
from bot.config import settings

router = Router(name="admin_router")

class AdminStates(StatesGroup):
    reg_reject_reason = State()
    add_balance_amount = State()
    add_balance_reason = State()

@router.message(F.text.in_(["👨‍🎓 إدارة الطلاب والمستخدمين", "👨‍🎓 إدارة الطلاب", "🛡 لوحة الإدارة"]))
@router.message(Command("admin"))
async def handle_admin_panel(message: Message):
    user_id = message.from_user.id
    if not user_service.is_admin_or_supervisor(user_id):
        await message.answer("⛔ لا تملك صلاحية.")
        return

    pending_regs = len(user_service.get_pending_registrations())
    pending_pays = len(ledger_service.get_pending_payments())

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=f"📝 طلبات التسجيل ({pending_regs})", callback_data="adm_view_regs")],
            [InlineKeyboardButton(text=f"💳 طلبات الدفع ({pending_pays})", callback_data="adm_view_pays")],
            [InlineKeyboardButton(text="👨‍🎓 إدارة الطلاب", callback_data="adm_search_student")],
        ]
    )
    await message.answer("🛡 *لوحة تحكم المشرف*", parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data == "adm_view_regs")
async def show_pending_registrations(callback: CallbackQuery):
    if not user_service.has_permission(callback.from_user.id, "review_registrations"):
        await callback.answer("⛔ لا تملك هذه الصلاحية.", show_alert=True)
        return

    regs = user_service.get_pending_registrations()
    if not regs:
        await callback.message.edit_text("✅ لا توجد طلبات تسجيل جديدة حالياً.")
        return

    reg = regs[0]
    text = (
        f"📝 *طلب تسجيل جديد*\n\n"
        f"👤 الاسم: {reg.get('full_name')}\n"
        f"🎂 العمر: {reg.get('age')}\n"
        f"🌍 الدولة: {reg.get('country')}\n"
        f"⚧ الجنس: {reg.get('gender')}\n"
        f"📖 البرنامج: {reg.get('program_id')}\n"
        f"⏰ الفترة: {reg.get('period')}\n"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ قبول وتوزيع", callback_data=f"adm_reg_app:{reg['id']}"),
         InlineKeyboardButton(text="❌ رفض", callback_data=f"adm_reg_rej:{reg['id']}")],
        [InlineKeyboardButton(text="🔙 رجوع", callback_data="adm_menu_back")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()

@router.callback_query(F.data.startswith("adm_reg_app:"))
async def approve_registration(callback: CallbackQuery):
    reg_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id

    if not user_service.has_permission(admin_id, "approve_registrations"):
        await callback.answer("⛔ لا تملك الصلاحية.", show_alert=True)
        return

    reg_res = supabase.table('registrations').select('*').eq('id', reg_id).execute()
    if not reg_res.data:
        await callback.answer("⚠️ الطلب غير موجود.", show_alert=True)
        return
    
    reg = reg_res.data[0]
    gender = reg.get('gender', 'male')
    period = reg.get('period', 'morning')
    
    group_key = f"IM_{period.upper()}" if gender == 'male' else f"IF_{period.upper()}"
    group_info = settings.STUDY_GROUPS.get(group_key)
    
    if not group_info:
        await callback.message.edit_text(f"⚠️ لم يتم العثور على مجموعة {group_key} في الإعدادات.")
        return

    # 1. تحديث حالة الطلب
    supabase.table('registrations').update({"status": "approved", "reviewed_by": admin_id}).eq('id', reg_id).execute()
    
    # 2. إضافة الرصيد الترحيبي (30 دقيقة)
    ledger_service.add_balance(reg['user_id'], 30, admin_id, reason="Welcome Bonus")
    
    # 3. إرسال رسالة التهنئة ورابط المجموعة
    lang = user_service.get_user_language(reg['user_id'])
    welcome_msg = (
        f"🎉 *تهانينا! تم قبول تسجيلك في مقرأة الإمام الجزري.*\n\n"
        f"📚 تم إضافة *30 دقيقة* كرصيد ترحيبي لحسابك.\n\n"
        f"🔗 *رابط مجموعتك ({group_key}):*\n"
        f"{group_info['link']}\n\n"
        f"نسأل الله أن يوفقك في رحلتك مع القرآن الكريم."
    )
    try:
        await callback.bot.send_message(chat_id=reg['user_id'], text=welcome_msg, parse_mode="Markdown")
    except Exception:
        pass 
        
    await callback.message.edit_text(f"✅ تم قبول الطالب وتوزيعه على {group_key} وإضافة 30 دقيقة.")
    await callback.answer()

@router.callback_query(F.data.startswith("adm_reg_rej:"))
async def reject_registration_start(callback: CallbackQuery, state: FSMContext):
    reg_id = callback.data.split(":")[1]
    await state.update_data(reject_reg_id=reg_id)
    await state.set_state(AdminStates.reg_reject_reason)
    await callback.message.edit_text("❌ يرجى كتابة سبب الرفض (إلزامي):")
    await callback.answer()

@router.message(AdminStates.reg_reject_reason)
async def reject_registration_end(message: Message, state: FSMContext):
    data = await state.get_data()
    reg_id = data.get("reject_reg_id")
    reason = message.text.strip()
    
    user_service.reject_registration(reg_id, message.from_user.id, reason)
    await message.answer(f"❌ تم الرفض. السبب: {reason}")
    await state.clear()

@router.callback_query(F.data == "adm_menu_back")
async def back_to_admin_menu(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await handle_admin_panel(callback.message)
    await callback.answer()