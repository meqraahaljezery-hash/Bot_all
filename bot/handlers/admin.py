from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.ledger_service import ledger_service
from bot.services.loan_service import loan_service
from bot.services.database import supabase
from bot.config import settings

router = Router(name="admin_router")

class AdminStates(StatesGroup):
    reg_reject_reason = State()
    add_balance_amount = State()
    add_balance_reason = State()
    rejection_reason = State()

@router.message(F.text.in_(["👨‍🎓 إدارة الطلاب والمستخدمين", "👨‍🎓 إدارة الطلاب", "🛡 لوحة الإدارة"]))
@router.message(Command("admin"))
async def handle_admin_panel(message: Message):
    user_id = message.from_user.id
    if not user_service.is_admin_or_supervisor(user_id):
        await message.answer("⛔ عذراً، لا تملك صلاحية الوصول إلى لوحة الإدارة.")
        return

    try:
        regs = supabase.table('registrations').select('id').eq('status', 'pending').execute()
        pays = supabase.table('payments').select('id').eq('status', 'pending').execute()
        pending_regs = len(regs.data)
        pending_pays = len(pays.data)
    except:
        pending_regs, pending_pays = 0, 0

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=f"📝 طلبات التسجيل ({pending_regs})", callback_data="adm_view_regs")],
            [InlineKeyboardButton(text=f"💳 طلبات الدفع ({pending_pays})", callback_data="adm_view_pays")],
        ]
    )
    await message.answer("🛡 *لوحة تحكم المشرف*", parse_mode="Markdown", reply_markup=kb)

# ==========================================
# إدارة طلبات التسجيل
# ==========================================
@router.callback_query(F.data == "adm_view_regs")
async def show_pending_registrations(callback: CallbackQuery):
    if not user_service.has_permission(callback.from_user.id, "review_registrations"):
        await callback.answer("⛔ لا تملك هذه الصلاحية.", show_alert=True)
        return

    res = supabase.table('registrations').select('*').eq('status', 'pending').limit(1).execute()
    if not res.data:
        await callback.message.edit_text("✅ لا توجد طلبات تسجيل جديدة حالياً.")
        return

    reg = res.data[0]
    text = (
        f"📝 *طلب تسجيل جديد*\n\n"
        f"👤 الاسم: {reg.get('full_name')}\n"
        f"⚧ الجنس: {reg.get('gender')}\n"
        f"⏰ الفترة: {reg.get('period')}\n"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ قبول وتوزيع", callback_data=f"adm_reg_app:{reg['id']}"),
         InlineKeyboardButton(text="❌ رفض", callback_data=f"adm_reg_rej:{reg['id']}")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()

@router.callback_query(F.data.startswith("adm_reg_app:"))
async def approve_registration(callback: CallbackQuery):
    reg_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id

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
    
    # 3. إرسال رسالة التهنئة
    welcome_msg = (
        f"🎉 *تهانينا! تم قبول تسجيلك.*\n\n"
        f"📚 تم إضافة *30 دقيقة* كرصيد ترحيبي.\n\n"
        f"🔗 *رابط مجموعتك ({group_key}):*\n{group_info['link']}"
    )
    try:
        await callback.bot.send_message(chat_id=reg['user_id'], text=welcome_msg, parse_mode="Markdown")
    except: pass
        
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
    
    supabase.table('registrations').update({"status": "rejected", "rejection_reason": reason, "reviewed_by": message.from_user.id}).eq('id', reg_id).execute()
    await message.answer(f"❌ تم الرفض. السبب: {reason}")
    await state.clear()

# ==========================================
# إدارة طلبات الدفع (مع خصم السلفة وفك الحظر)
# ==========================================
@router.callback_query(F.data == "adm_view_pays")
async def show_pending_payments(callback: CallbackQuery):
    res = supabase.table('payments').select('*').eq('status', 'pending').limit(1).execute()
    if not res.data:
        await callback.message.edit_text("✅ لا توجد طلبات دفع معلقة.")
        return

    pay = res.data[0]
    text = f"💳 *طلب دفع جديد*\n\n👤 آي دي الطالب: `{pay['user_id']}`\n⏱ الدقائق: *{pay['minutes']}*\n💰 المبلغ: *{pay['amount_etb']} ETB*"
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ اعتماد وإضافة", callback_data=f"adm_pay_app:{pay['id']}"),
         InlineKeyboardButton(text="❌ رفض", callback_data=f"adm_pay_rej:{pay['id']}")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()

@router.callback_query(F.data.startswith("adm_pay_app:"))
async def handle_admin_approve_payment(callback: CallbackQuery):
    pay_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id

    pay_res = supabase.table('payments').select('*').eq('id', pay_id).execute()
    if not pay_res.data:
        await callback.answer("⚠️ الطلب غير موجود.", show_alert=True)
        return
    
    pay = pay_res.data[0]
    if pay['status'] != 'pending':
        await callback.answer("⚠️ تم اعتماد هذا الدفع مسبقاً.", show_alert=True)
        return

    # 1. تحديث الحالة
    supabase.table('payments').update({"status": "approved", "reviewed_by": admin_id}).eq('id', pay_id).execute()

    # 2. إضافة الرصيد
    ledger_service.add_balance(pay['user_id'], pay['minutes'], admin_id, reason="Package Purchase")
    
    # 3. خصم السلفة إن وجدت
    deducted_loan = loan_service.repay_loan(pay['user_id'])
    
    # 4. فك الحظر
    await loan_service.sync_group_status(callback.bot, pay['user_id'])

    msg = f"✅ تم اعتماد الدفع وإضافة {pay['minutes']} دقيقة."
    if deducted_loan > 0:
        msg += f"\n⚠️ تم خصم {deducted_loan} دقيقة لسداد السلفة."
        
    await callback.message.edit_text(msg)
    await callback.answer()

@router.callback_query(F.data.startswith("adm_pay_rej:"))
async def handle_admin_reject_payment(callback: CallbackQuery, state: FSMContext):
    pay_id = callback.data.split(":")[1]
    await state.update_data(reject_pay_id=pay_id)
    await state.set_state(AdminStates.rejection_reason)
    await callback.message.edit_text("❌ يرجى كتابة سبب رفض الدفع:")
    await callback.answer()

@router.message(AdminStates.rejection_reason)
async def process_payment_rejection(message: Message, state: FSMContext):
    data = await state.get_data()
    pay_id = data.get("reject_pay_id")
    reason = message.text.strip()
    
    supabase.table('payments').update({"status": "rejected", "rejection_reason": reason, "reviewed_by": message.from_user.id}).eq('id', pay_id).execute()
    await message.answer(f"❌ تم رفض الدفع. السبب: {reason}")
    await state.clear()