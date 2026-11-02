"""
Supervisor & Admin Panel Handler - STRICT RBAC & FSM Protection
Includes: Student Management, Registrations, Payments, Balance Adjustments, Session Deductions, and Role Promotion.
"""
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.ledger_service import ledger_service
from bot.services.group_service import group_service

router = Router(name="admin_router")

# ==========================================
# حالات FSM الخاصة بالمشرف
# ==========================================
class AdminStates(StatesGroup):
    reg_reject_reason = State()
    add_balance_amount = State()
    add_balance_reason = State()

# ==========================================
# 1. القائمة الرئيسية للمشرف
# ==========================================
@router.message(F.text.in_(["👨‍🎓 إدارة الطلاب والمستخدمين", "👨‍🎓 إدارة الطلاب", "🛡 لوحة الإدارة"]))
@router.message(Command("admin"))
async def handle_admin_panel(message: Message):
    user_id = message.from_user.id
    
    # التحقق الصارم من الصلاحيات
    if not user_service.is_admin_or_supervisor(user_id):
        await message.answer("⛔ عذراً، لا تملك صلاحية الوصول إلى لوحة الإدارة.")
        return

    # جلب الإحصائيات (أرقام حقيقية من الخدمات)
    pending_regs = len(user_service.get_pending_registrations())
    pending_pays = len(ledger_service.get_pending_payments())

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=f"📝 طلبات التسجيل ({pending_regs})", callback_data="adm_view_regs")],
            [InlineKeyboardButton(text=f"💳 طلبات الدفع ({pending_pays})", callback_data="adm_view_pays")],
            [InlineKeyboardButton(text="👨‍🎓 إدارة الطلاب", callback_data="adm_search_student")],
            [InlineKeyboardButton(text="📊 الإحصائيات المالية", callback_data="adm_stats")],
        ]
    )

    await message.answer(
        text="🛡 *لوحة تحكم المشرف*\n\nمرحباً بك. يرجى اختيار الإجراء المطلوب:",
        parse_mode="Markdown",
        reply_markup=kb,
    )

# ==========================================
# 2. إدارة طلبات التسجيل (قبول/رفض)
# ==========================================
@router.callback_query(F.data == "adm_view_regs")
async def show_pending_registrations(callback: CallbackQuery):
    if not user_service.has_permission(callback.from_user.id, "review_registrations"):
        await callback.answer("⛔ لا تملك هذه الصلاحية.", show_alert=True)
        return

    regs = user_service.get_pending_registrations()
    if not regs:
        await callback.message.edit_text("✅ لا توجد طلبات تسجيل جديدة حالياً.")
        return

    # عرض أول طلب كمثال
    reg = regs[0]
    text = (
        f"📝 *طلب تسجيل جديد*\n\n"
        f"👤 الاسم: {reg.get('full_name', 'غير محدد')}\n"
        f"🎂 العمر: {reg.get('age', 'غير محدد')}\n"
        f"🌍 الدولة: {reg.get('country', 'غير محدد')}\n"
        f"📖 البرنامج: {reg.get('program_id', 'غير محدد')}\n"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ قبول", callback_data=f"adm_reg_app:{reg['id']}"),
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

    # تنفيذ القبول في قاعدة البيانات
    success = user_service.approve_registration(reg_id, admin_id)
    
    if success:
        await callback.message.edit_text(f"✅ تم قبول الطالب بنجاح وإنشاء حسابه.")
        # هنا يتم إرسال إشعار للطالب (يفضل استخدام دالة الإرسال الخاصة بك)
    else:
        await callback.message.edit_text("⚠️ حدث خطأ، ربما تمت معالجة الطلب مسبقاً.")
    await callback.answer()

@router.callback_query(F.data.startswith("adm_reg_rej:"))
async def reject_registration_start(callback: CallbackQuery, state: FSMContext):
    reg_id = callback.data.split(":")[1]
    await state.update_data(reject_reg_id=reg_id)
    await state.set_state(AdminStates.reg_reject_reason)
    await callback.message.edit_text("❌ يرجى كتابة سبب رفض طلب التسجيل (إلزامي):")
    await callback.answer()

@router.message(AdminStates.reg_reject_reason)
async def reject_registration_end(message: Message, state: FSMContext):
    data = await state.get_data()
    reg_id = data.get("reject_reg_id")
    reason = message.text.strip()
    
    user_service.reject_registration(reg_id, message.from_user.id, reason)
    await message.answer(f"❌ تم رفض الطلب. السبب: {reason}")
    await state.clear()

# ==========================================
# 3. إدارة الطلاب (بحث وملف)
# ==========================================
@router.callback_query(F.data == "adm_search_student")
async def search_student_prompt(callback: CallbackQuery):
    # (للتجربة) يرجى إرسال رقم ID الطالب للبحث عنه
    await callback.message.edit_text("🔍 يرجى إرسال (رقم ID) الطالب للبحث عنه:")
    await callback.answer()

# دالة عرض ملف الطالب (يجب استدعاؤها بعد البحث)
async def show_student_profile(message: Message, student_id: str):
    student = user_service.get_user(int(student_id))
    if not student:
        await message.answer("❌ لم يتم العثور على الطالب.")
        return

    bal = ledger_service.get_balance(student_id)
    
    text = (
        f"👤 *ملف الطالب*\n\n"
        f"الاسم: {student.get('first_name', 'غير محدد')}\n"
        f"الآي دي: `{student_id}`\n"
        f"الرصيد الحالي: *{bal.get('current_minutes', 0)} دقيقة*\n"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⏱ خصم دقائق", callback_data=f"adm_deduct:{student_id}"),
         InlineKeyboardButton(text="🎁 إضافة رصيد", callback_data=f"adm_add:{student_id}")],
        [InlineKeyboardButton(text="👨‍🏫 ترقية إلى معلم", callback_data=f"adm_promote_teacher:{student_id}")],
        [InlineKeyboardButton(text="🛡 ترقية إلى مشرف", callback_data=f"adm_promote_supervisor:{student_id}")],
        [InlineKeyboardButton(text="❄️ تجميد الحساب", callback_data=f"adm_freeze:{student_id}")],
        [InlineKeyboardButton(text="🔙 رجوع", callback_data="adm_menu_back")]
    ])
    await message.answer(text, parse_mode="Markdown", reply_markup=kb)

# --- ترقية إلى معلم ---
@router.callback_query(F.data.startswith("adm_promote_teacher:"))
async def promote_to_teacher(callback: CallbackQuery):
    student_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id
    
    # المدير العام فقط هو من يملك صلاحية الترقية
    if not user_service.is_super_admin(admin_id):
        await callback.answer("⛔ فقط المدير العام يمكنه ترقية المعلمين.", show_alert=True)
        return
        
    success = user_service.assign_role(int(student_id), "teacher", admin_id)
    if success:
        await callback.message.edit_text("✅ تمت ترقية المستخدم إلى رتبة (معلم) بنجاح.")
    else:
        await callback.message.edit_text("⚠️ حدث خطأ في الترقية.")
    await callback.answer()

# --- ترقية إلى مشرف عادي ---
@router.callback_query(F.data.startswith("adm_promote_supervisor:"))
async def promote_to_supervisor(callback: CallbackQuery):
    student_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id
    
    # المدير العام فقط هو من يملك صلاحية الترقية إلى مشرف
    if not user_service.is_super_admin(admin_id):
        await callback.answer("⛔ فقط المدير العام يمكنه ترقية المشرفين.", show_alert=True)
        return
        
    success = user_service.assign_role(int(student_id), "supervisor", admin_id)
    if success:
        await callback.message.edit_text("✅ تمت ترقية المستخدم إلى رتبة (مشرف) بنجاح.")
    else:
        await callback.message.edit_text("⚠️ حدث خطأ في الترقية.")
    await callback.answer()

# ==========================================
# 4. خصم دقائق الجلسة (مع تأكيد)
# ==========================================
@router.callback_query(F.data.startswith("adm_deduct:"))
async def select_session_duration(callback: CallbackQuery):
    student_id = callback.data.split(":")[1]
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="15 دقيقة", callback_data=f"adm_ded_conf:{student_id}:15"),
         InlineKeyboardButton(text="30 دقيقة", callback_data=f"adm_ded_conf:{student_id}:30")],
        [InlineKeyboardButton(text="45 دقيقة", callback_data=f"adm_ded_conf:{student_id}:45"),
         InlineKeyboardButton(text="60 دقيقة", callback_data=f"adm_ded_conf:{student_id}:60")],
        [InlineKeyboardButton(text="🔙 إلغاء", callback_data="adm_menu_back")]
    ])
    
    await callback.message.edit_text("⏱ اختر مدة الجلسة التي تم إنجازها:", reply_markup=kb)
    await callback.answer()

@router.callback_query(F.data.startswith("adm_ded_conf:"))
async def confirm_deduction(callback: CallbackQuery):
    _, student_id, minutes = callback.data.split(":")
    minutes = int(minutes)
    
    bal = ledger_service.get_balance(student_id)
    current_bal = bal.get('current_minutes', 0)
    
    if current_bal < minutes:
        await callback.answer(f"⚠️ رصيد الطالب ({current_bal}) أقل من المدة المطلوبة!", show_alert=True)
        return
        
    text = (
        f"⚠️ *تأكيد خصم الجلسة*\n\n"
        f"مدة الجلسة: *{minutes} دقيقة*\n"
        f"الرصيد قبل الخصم: {current_bal} دقيقة\n"
        f"الرصيد بعد الخصم: *{current_bal - minutes} دقيقة*\n\n"
        f"هل أنت متأكد من تنفيذ الخصم؟"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأكيد وخصم", callback_data=f"adm_ded_exec:{student_id}:{minutes}")],
        [InlineKeyboardButton(text="❌ إلغاء", callback_data="adm_menu_back")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()

@router.callback_query(F.data.startswith("adm_ded_exec:"))
async def execute_deduction(callback: CallbackQuery):
    _, student_id, minutes = callback.data.split(":")
    minutes = int(minutes)
    admin_id = callback.from_user.id
    
    res = ledger_service.deduct_balance(student_id, minutes, admin_id, reason="Recitation Session")
    
    if res.success:
        await callback.message.edit_text(
            f"✅ تم خصم {minutes} دقيقة بنجاح.\n"
            f"الرصيد الجديد: *{res.balance_after}* دقيقة."
        )
    else:
        await callback.message.edit_text(f"⚠️ فشل الخصم: {res.message}")
        
    await callback.answer()

# ==========================================
# 5. إضافة رصيد / تكريم
# ==========================================
@router.callback_query(F.data.startswith("adm_add:"))
async def add_balance_start(callback: CallbackQuery, state: FSMContext):
    student_id = callback.data.split(":")[1]
    await state.update_data(add_student_id=student_id)
    await state.set_state(AdminStates.add_balance_amount)
    
    await callback.message.edit_text("🎁 كم عدد الدقائق المراد إضافتها؟ (أرسل رقماً فقط):")
    await callback.answer()

@router.message(AdminStates.add_balance_amount)
async def add_balance_amount_step(message: Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("❌ يرجى إرسال أرقام فقط.")
        return
        
    await state.update_data(add_minutes=int(message.text))
    await state.set_state(AdminStates.add_balance_reason)
    await message.answer("📝 يرجى كتابة سبب إضافة الرصيد (مثال: تكريم حفظ، تعويض، الخ):")

@router.message(AdminStates.add_balance_reason)
async def add_balance_exec_step(message: Message, state: FSMContext):
    reason = message.text
    data = await state.get_data()
    student_id = data['add_student_id']
    minutes = data['add_minutes']
    admin_id = message.from_user.id
    
    res = ledger_service.add_balance(student_id, minutes, admin_id, reason=reason)
    
    if res.success:
        await message.answer(
            f"✅ تمت إضافة *{minutes} دقيقة* للطالب.\n"
            f"السبب: {reason}\n"
            f"الرصيد الحالي: *{res.balance_after}* دقيقة.",
            parse_mode="Markdown"
        )
    else:
        await message.answer(f"⚠️ فشلت العملية: {res.message}")
        
    await state.clear()

# ==========================================
# 6. العودة للقائمة الرئيسية
# ==========================================
@router.callback_query(F.data == "adm_menu_back")
async def back_to_admin_menu(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await handle_admin_panel(callback.message)
    await callback.answer()