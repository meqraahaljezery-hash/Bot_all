"""
Central Administration Handler for Imam Al-Jazari Telegram Bot.
Includes:
- Pending Registrations Review & Group/Code Assignment
- Pending Payments Review & Balance Crediting + Auto Loan Repayment
- Student Directory with clickable Name + Code buttons
- Complete Student Action Dashboard:
  1) Deduct Session Minutes (خصم للجلسة)
  2) Direct Message to Student (رسالة خاص)
  3) Activate / Unrestrict Account (تفعيل الحساب)
  4) Mute Account in Group (كتم حساب)
  5) Ban Account from Group (حظر كلي)
  6) Delete Student (حذف)
  7) Add Balance Minutes (إضافة رصيد)
- Broadcast Announcements (إرسال إعلان عام)
"""

import uuid
from aiogram import Router, F, Bot
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, ChatPermissions
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.ledger_service import ledger_service
from bot.services.loan_service import loan_service
from bot.services.group_service import group_service
from bot.services.notification_service import notification_service
from bot.services.database import supabase
from bot.config import settings

router = Router(name="admin_router")


class AdminStates(StatesGroup):
    reg_reject_reason = State()
    pay_reject_reason = State()
    deduct_session_minutes = State()
    add_balance_minutes = State()
    send_student_dm = State()
    search_student_query = State()
    broadcast_message_text = State()


# ==========================================
# لوحة الإدارة الرئيسية
# ==========================================
@router.message(F.text.in_(["👨‍🎓 إدارة الطلاب والمستخدمين", "👨‍🎓 إدارة الطلاب", "🛡 لوحة الإدارة"]))
@router.message(Command("admin"))
async def handle_admin_panel(message: Message):
    user_id = message.from_user.id
    if not user_service.is_admin_or_supervisor(user_id):
        await message.answer(t("admin_access_denied", "ar"))
        return

    try:
        regs = supabase.table('registrations').select('id').eq('status', 'pending').execute()
        pays = supabase.table('payments').select('id').eq('status', 'pending').execute()
        pending_regs = len(regs.data) if regs.data else 0
        pending_pays = len(pays.data) if pays.data else 0
    except Exception:
        pending_regs, pending_pays = 0, 0

    students = user_service.get_all_students()
    total_students = len(students)

    text = (
        "🛡 *لوحة تحكم إدارة مقرأة الإمام الجزري*\n\n"
        f"📊 *إحصائيات سريعة:*\n"
        f"• طلبات التسجيل المعلقة: *{pending_regs}*\n"
        f"• طلبات الدفع المعلقة: *{pending_pays}*\n"
        f"• إجمالي الطلاب المسجلين: *{total_students}*\n\n"
        "اختر الإجراء المطلوب من القائمة أدناه:"
    )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=f"📝 طلبات التسجيل ({pending_regs})", callback_data="adm_view_regs"),
                InlineKeyboardButton(text=f"💳 طلبات الدفع ({pending_pays})", callback_data="adm_view_pays")
            ],
            [
                InlineKeyboardButton(text="👨‍🎓 قائمة الطلاب وإدارتهم", callback_data="adm_view_students"),
                InlineKeyboardButton(text="🔍 بحث عن طالب", callback_data="adm_search_student")
            ],
            [
                InlineKeyboardButton(text="🔔 فحص وتنبيه رصيد الطلاب", callback_data="adm_run_balance_alerts"),
                InlineKeyboardButton(text="⚠️ تقرير منخفضي الرصيد", callback_data="adm_low_balance_report")
            ],
            [
                InlineKeyboardButton(text="📢 إرسال إعلان عام", callback_data="adm_broadcast_start"),
                InlineKeyboardButton(text="🔄 تحديث اللوحة", callback_data="adm_refresh")
            ]
        ]
    )
    await message.answer(text, parse_mode="Markdown", reply_markup=kb)


@router.callback_query(F.data == "adm_refresh")
async def refresh_admin_panel(callback: CallbackQuery):
    try:
        regs = supabase.table('registrations').select('id').eq('status', 'pending').execute()
        pays = supabase.table('payments').select('id').eq('status', 'pending').execute()
        pending_regs = len(regs.data) if regs.data else 0
        pending_pays = len(pays.data) if pays.data else 0
    except Exception:
        pending_regs, pending_pays = 0, 0

    students = user_service.get_all_students()
    total_students = len(students)

    text = (
        "🛡 *لوحة تحكم إدارة مقرأة الإمام الجزري*\n\n"
        f"📊 *إحصائيات سريعة:*\n"
        f"• طلبات التسجيل المعلقة: *{pending_regs}*\n"
        f"• طلبات الدفع المعلقة: *{pending_pays}*\n"
        f"• إجمالي الطلاب المسجلين: *{total_students}*\n\n"
        "اختر الإجراء المطلوب من القائمة أدناه:"
    )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=f"📝 طلبات التسجيل ({pending_regs})", callback_data="adm_view_regs"),
                InlineKeyboardButton(text=f"💳 طلبات الدفع ({pending_pays})", callback_data="adm_view_pays")
            ],
            [
                InlineKeyboardButton(text="👨‍🎓 قائمة الطلاب وإدارتهم", callback_data="adm_view_students"),
                InlineKeyboardButton(text="🔍 بحث عن طالب", callback_data="adm_search_student")
            ],
            [
                InlineKeyboardButton(text="🔔 فحص وتنبيه رصيد الطلاب", callback_data="adm_run_balance_alerts"),
                InlineKeyboardButton(text="⚠️ تقرير منخفضي الرصيد", callback_data="adm_low_balance_report")
            ],
            [
                InlineKeyboardButton(text="📢 إرسال إعلان عام", callback_data="adm_broadcast_start"),
                InlineKeyboardButton(text="🔄 تحديث اللوحة", callback_data="adm_refresh")
            ]
        ]
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer("تم التحديث")


# ==========================================
# 1. إدارة ومراجعة طلبات التسجيل
# ==========================================
@router.callback_query(F.data == "adm_view_regs")
async def show_pending_registrations(callback: CallbackQuery):
    if not user_service.has_permission(callback.from_user.id, "review_registrations"):
        await callback.answer("⛔ لا تملك هذه الصلاحية.", show_alert=True)
        return

    try:
        res = supabase.table('registrations').select('*').eq('status', 'pending').limit(1).execute()
        records = res.data
    except Exception:
        records = []

    if not records:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ رجوع للوحة الإدارة", callback_data="adm_refresh")]
        ])
        await callback.message.edit_text("✅ لا توجد طلبات تسجيل جديدة قيد الانتظار حالياً.", reply_markup=kb)
        await callback.answer()
        return

    reg = records[0]
    gender_ar = "ذكر 👨" if reg.get('gender') == 'male' else "أنثى 👩"
    period_names = {"morning": "صباحية (09:00 - 12:00)", "afternoon": "مسائية (14:00 - 15:30)", "night": "ليلية (21:00 - 23:00)"}
    period_lbl = period_names.get(reg.get('period', 'morning'), reg.get('period', 'morning'))

    text = (
        f"📝 *طلب تسجيل جديد قيد المراجعة*\n\n"
        f"👤 *الاسم:* {reg.get('full_name')}\n"
        f"🎂 *العمر:* {reg.get('age')}\n"
        f"🌍 *الدولة:* {reg.get('country')}\n"
        f"⚧ *الجنس:* {gender_ar}\n"
        f"📱 *الهاتف:* {reg.get('phone', 'غير متوفر')}\n"
        f"📚 *البرنامج:* {reg.get('program_id')}\n"
        f"⏰ *الفترة المطلوبة:* {period_lbl}\n"
        f"🆔 *معرف الطالب:* `{reg.get('user_id')}`\n"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ قبول وتوزيع وتوليد كود", callback_data=f"adm_reg_app:{reg.get('id')}"),
            InlineKeyboardButton(text="❌ رفض مع السبب", callback_data=f"adm_reg_rej:{reg.get('id')}")
        ],
        [InlineKeyboardButton(text="⬅️ رجوع للوحة الإدارة", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data.startswith("adm_reg_app:"))
async def approve_registration(callback: CallbackQuery):
    reg_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id

    try:
        reg_res = supabase.table('registrations').select('*').eq('id', reg_id).execute()
        if not reg_res.data:
            await callback.answer("⚠️ الطلب غير موجود.", show_alert=True)
            return
        reg = reg_res.data[0]
    except Exception:
        await callback.answer("⚠️ تعذر جلب الطلب.", show_alert=True)
        return

    student_id = int(reg['user_id'])
    gender = reg.get('gender', 'male')
    raw_period = reg.get('period', 'morning')
    period = "afternoon" if raw_period in ["evening", "afternoon"] else raw_period

    # Generate student code (IM-xxxx or IF-xxxx)
    student_code = group_service.generate_student_code(gender)

    # Determine group key
    group_prefix = "IM" if gender == "male" else "IF"
    group_key = f"{group_prefix}_{period.upper()}"
    group_info = settings.STUDY_GROUPS.get(group_key) or settings.STUDY_GROUPS.get(f"{group_prefix}_MORNING")

    # 1. Update registration status
    try:
        supabase.table('registrations').update({"status": "approved", "reviewed_by": admin_id, "student_code": student_code}).eq('id', reg_id).execute()
    except Exception:
        pass

    # 2. Update user profile with student code & group
    user_service.update_student_data(student_id, {
        "role": "student",
        "student_code": student_code,
        "assigned_group": group_key,
        "gender": gender,
        "first_name": reg.get('full_name')
    })

    # 3. Add 30 welcome bonus minutes
    ledger_service.adjust_balance(
        user_id=student_id,
        minutes_change=30,
        reason="رصيد ترحيبي عند قبول التسجيل",
        performed_by=admin_id,
        is_bonus=True
    )

    # 4. Send welcome message to student
    welcome_text = (
        f"🎉 *تهانينا! تم قبول طلب تسجيلك في مقرأة الإمام الجزري!*\n\n"
        f"🏷 *كود الطالب الخاص بك:* `{student_code}`\n"
        f"⏱ *الرصيد الترحيبي:* تم إضافة *30 دقيقة* مجانية لحسابك.\n"
        f"👥 *مجموعتك الدراسية:* {group_info.get('name', group_key)}\n"
        f"🕒 *أوقات الحلقة:* {group_info.get('time_range', 'بحسب الجدول')}\n\n"
        f"🔗 *رابط الانضمام للمجموعة الرسمية:*\n{group_info.get('link')}\n\n"
        "نتمنى لك رحلة قرآنية مباركة حافلة بالإتقان والإجازة بالسند!"
    )
    try:
        await callback.bot.send_message(chat_id=student_id, text=welcome_text, parse_mode="Markdown")
    except Exception:
        pass

    success_msg = (
        f"✅ *تم قبول الطالب وتوزيعه بنجاح!*\n\n"
        f"👤 الطالب: {reg.get('full_name')}\n"
        f"🏷 الكود المُنشأ: `{student_code}`\n"
        f"👥 المجموعة: {group_info.get('name', group_key)}\n"
        f"⏱ الرصيد المضاف: 30 دقيقة ترحيبية"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📝 الطلب التالي", callback_data="adm_view_regs")],
        [InlineKeyboardButton(text="⬅️ لوحة الإدارة", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(success_msg, parse_mode="Markdown", reply_markup=kb)
    await callback.answer("تم قبول التسجيل")


@router.callback_query(F.data.startswith("adm_reg_rej:"))
async def reject_registration_start(callback: CallbackQuery, state: FSMContext):
    reg_id = callback.data.split(":")[1]
    await state.update_data(reject_reg_id=reg_id)
    await state.set_state(AdminStates.reg_reject_reason)
    await callback.message.edit_text("❌ *يرجى كتابة سبب رفض طلب التسجيل (سيتم إرساله للطالب):*", parse_mode="Markdown")
    await callback.answer()


@router.message(AdminStates.reg_reject_reason)
async def reject_registration_end(message: Message, state: FSMContext):
    data = await state.get_data()
    reg_id = data.get("reject_reg_id")
    reason = message.text.strip()
    admin_id = message.from_user.id

    try:
        reg_res = supabase.table('registrations').select('*').eq('id', reg_id).execute()
        if reg_res.data:
            reg = reg_res.data[0]
            student_id = int(reg['user_id'])
            try:
                await message.bot.send_message(
                    chat_id=student_id,
                    text=f"نعتذر منك، لم تتم الموافقة على طلب تسجيلك في المقرأة.\n\n📌 *السبب:* {reason}",
                    parse_mode="Markdown"
                )
            except Exception:
                pass
        supabase.table('registrations').update({
            "status": "rejected",
            "rejection_reason": reason,
            "reviewed_by": admin_id
        }).eq('id', reg_id).execute()
    except Exception:
        pass

    await message.answer(f"❌ تم رفض الطلب بنجاح.\nالسبب المسجل: {reason}")
    await state.clear()


# ==========================================
# 2. إدارة ومراجعة طلبات الدفع
# ==========================================
@router.callback_query(F.data == "adm_view_pays")
async def show_pending_payments(callback: CallbackQuery):
    if not user_service.has_permission(callback.from_user.id, "review_payments"):
        await callback.answer("⛔ لا تملك صلاحية مراجعة المدفوعات.", show_alert=True)
        return

    try:
        res = supabase.table('payments').select('*').eq('status', 'pending').limit(1).execute()
        records = res.data
    except Exception:
        records = []

    if not records:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ رجوع للوحة الإدارة", callback_data="adm_refresh")]
        ])
        await callback.message.edit_text("✅ لا توجد طلبات دفع معلقة حالياً.", reply_markup=kb)
        await callback.answer()
        return

    pay = records[0]
    text = (
        f"💳 *طلب شحن رصيد / دفع قيد المراجعة*\n\n"
        f"👤 *آي دي الطالب:* `{pay.get('user_id')}`\n"
        f"⏱ *الدقائق المطلوبة:* *{pay.get('minutes', 0)} دقيقة*\n"
        f"💰 *المبلغ:* *{pay.get('amount_etb', 0)} ETB*\n"
        f"🔢 *رقم الحوالة المرجعي:* `{pay.get('tx_ref', pay.get('id', ''))}`\n"
        f"🏦 *طريقة الدفع:* {pay.get('method_id', 'تحويل بنكي')}\n"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ اعتماد وإضافة الرصيد", callback_data=f"adm_pay_app:{pay.get('id')}"),
            InlineKeyboardButton(text="❌ رفض الطلب", callback_data=f"adm_pay_rej:{pay.get('id')}")
        ],
        [InlineKeyboardButton(text="⬅️ رجوع للوحة الإدارة", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data.startswith("adm_pay_app:"))
async def handle_admin_approve_payment(callback: CallbackQuery):
    pay_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id

    try:
        pay_res = supabase.table('payments').select('*').eq('id', pay_id).execute()
        if not pay_res.data:
            await callback.answer("⚠️ الطلب غير موجود.", show_alert=True)
            return
        pay = pay_res.data[0]
    except Exception:
        await callback.answer("⚠️ تعذر جلب الطلب.", show_alert=True)
        return

    if pay.get('status') != 'pending':
        await callback.answer("⚠️ تم اعتماد هذا الطلب مسبقاً.", show_alert=True)
        return

    user_id = pay.get('user_id')
    minutes = int(pay.get('minutes', 0))
    idempotency_key = f"pay_{pay_id}_{user_id}"

    # Process atomic credit
    res = ledger_service.process_payment_approval(
        payment_id=pay_id,
        user_id=user_id,
        minutes=minutes,
        idempotency_key=idempotency_key,
        approved_by=admin_id
    )

    if not res.success:
        await callback.answer(f"⚠️ {res.message}", show_alert=True)
        return

    # Check and repay emergency loan if any
    deducted_loan = loan_service.repay_loan(user_id)

    # Lift any mute restriction in Telegram groups
    await loan_service.sync_group_status(callback.bot, user_id)

    # Notify student
    student_msg = (
        f"✅ *تم اعتماد عملية الدفع بنجاح!*\n\n"
        f"⏱ تمت إضافة *{minutes} دقيقة* إلى رصيدك.\n"
        f"🟢 رصيدك الحالي المتاح: *{res.balance_after - deducted_loan} دقيقة*."
    )
    if deducted_loan > 0:
        student_msg += f"\n⚠️ تم سداد السلفة الطارئة ({deducted_loan} دقيقة) تلقائياً."

    try:
        await callback.bot.send_message(chat_id=int(user_id), text=student_msg, parse_mode="Markdown")
    except Exception:
        pass

    admin_summary = f"✅ تم اعتماد الدفع وإضافة {minutes} دقيقة للمستخدم `{user_id}`."
    if deducted_loan > 0:
        admin_summary += f"\n(تم استرداد سلفة بقيمة {deducted_loan} دقيقة)."

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 الطلب التالي", callback_data="adm_view_pays")],
        [InlineKeyboardButton(text="⬅️ لوحة الإدارة", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(admin_summary, parse_mode="Markdown", reply_markup=kb)
    await callback.answer("تم اعتماد الدفع")


@router.callback_query(F.data.startswith("adm_pay_rej:"))
async def handle_admin_reject_payment(callback: CallbackQuery, state: FSMContext):
    pay_id = callback.data.split(":")[1]
    await state.update_data(reject_pay_id=pay_id)
    await state.set_state(AdminStates.pay_reject_reason)
    await callback.message.edit_text("❌ *يرجى كتابة سبب رفض عملية الدفع:*", parse_mode="Markdown")
    await callback.answer()


@router.message(AdminStates.pay_reject_reason)
async def process_payment_rejection(message: Message, state: FSMContext):
    data = await state.get_data()
    pay_id = data.get("reject_pay_id")
    reason = message.text.strip()
    admin_id = message.from_user.id

    try:
        pay_res = supabase.table('payments').select('*').eq('id', pay_id).execute()
        if pay_res.data:
            pay = pay_res.data[0]
            try:
                await message.bot.send_message(
                    chat_id=int(pay['user_id']),
                    text=f"❌ *تم رفض طلب الدفع الخاص بك*\n\nالسبب: {reason}\nيرجى التواصل مع الدعم أو إعادة إرسال إشعار صحيح.",
                    parse_mode="Markdown"
                )
            except Exception:
                pass
        supabase.table('payments').update({
            "status": "rejected",
            "rejection_reason": reason,
            "reviewed_by": admin_id
        }).eq('id', pay_id).execute()
    except Exception:
        pass

    await message.answer(f"❌ تم رفض الدفع بنجاح.\nالسبب: {reason}")
    await state.clear()


# ==========================================
# 3. قائمة الطلاب والأزرار التفاعلية الفعالة (Request 7)
# ==========================================
@router.callback_query(F.data == "adm_view_students")
async def show_students_directory(callback: CallbackQuery):
    students = user_service.get_all_students()

    if not students:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ لوحة الإدارة", callback_data="adm_refresh")]
        ])
        await callback.message.edit_text("لا يوجد طلاب مسجلون حالياً.", reply_markup=kb)
        await callback.answer()
        return

    # Build interactive buttons for students
    buttons = []
    for s in students[:25]: # Page 1: up to 25 students
        tid = s.get("telegram_id")
        name = s.get("first_name", "طالب")
        code = s.get("student_code") or f"ID-{str(tid)[-4:]}"
        btn_text = f"[{code}] {name}"
        buttons.append([InlineKeyboardButton(text=btn_text, callback_data=f"adm_std:{tid}")])

    # Add navigation and search buttons
    buttons.append([InlineKeyboardButton(text="🔍 بحث بكود أو معرف الطالب", callback_data="adm_search_student")])
    buttons.append([InlineKeyboardButton(text="⬅️ رجوع للوحة الإدارة", callback_data="adm_refresh")])

    kb = InlineKeyboardMarkup(inline_keyboard=buttons)
    text = (
        "👨‍🎓 *قائمة الطلاب المسجلين بالمقرأة*\n\n"
        "انقر على اسم أي طالب لفتح ملفه وإجراء العمليات:\n"
        "• خصم للجلسة مباشرة\n"
        "• إرسال رسالة خاص\n"
        "• كتم الحساب أو تفعيله\n"
        "• الحظر الكلي أو الحذف"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data.startswith("adm_std:"))
async def show_student_card(callback: CallbackQuery):
    user_id = int(callback.data.split(":")[1])
    user = user_service.get_user(user_id) or user_service.register_or_get_user(user_id)
    
    bal_info = ledger_service.get_balance(user_id)
    curr_balance = bal_info["current_minutes"]
    code = user.get("student_code") or "لم يُحدد بعد"
    name = user.get("first_name", "طالب")
    group_name = user.get("assigned_group") or "غير معين"

    # Status badge
    if user.get("is_banned"):
        status_lbl = "🚫 محظور كلياً"
    elif user.get("is_muted"):
        status_lbl = "🔇 مكتوم في الحلقة"
    else:
        status_lbl = "🟢 نشط"

    text = (
        f"👤 *ملف الطالب:* *{name}*\n"
        f"🏷 *كود الطالب:* `{code}`\n"
        f"🆔 *معرف تيليجرام:* `{user_id}`\n"
        f"⏱ *الرصيد الحالي:* *{curr_balance} دقيقة*\n"
        f"👥 *المجموعة الدراسية:* {group_name}\n"
        f"🛡 *حالة الحساب:* {status_lbl}\n\n"
        "👇 *اختر الإجراء المراد تنفيذه على حساب الطالب:*"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⏱ خصم للجلسة", callback_data=f"std_act:deduct:{user_id}"),
            InlineKeyboardButton(text="➕ إضافة رصيد", callback_data=f"std_act:add:{user_id}")
        ],
        [
            InlineKeyboardButton(text="💬 رسالة خاص", callback_data=f"std_act:dm:{user_id}"),
            InlineKeyboardButton(text="✅ تفعيل الحساب", callback_data=f"std_act:unmute:{user_id}")
        ],
        [
            InlineKeyboardButton(text="🔇 كتم حساب", callback_data=f"std_act:mute:{user_id}"),
            InlineKeyboardButton(text="🚫 حظر الكلي", callback_data=f"std_act:ban:{user_id}")
        ],
        [
            InlineKeyboardButton(text="🗑 حذف الطالب", callback_data=f"std_act:delete:{user_id}"),
            InlineKeyboardButton(text="⬅️ قائمة الطلاب", callback_data="adm_view_students")
        ]
    ])

    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


# ----------------------------------------------------
# 3.1 الإجراء الأول: خصم للجلسة (Deduct Session Minutes)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:deduct:"))
async def start_deduct_session(callback: CallbackQuery, state: FSMContext):
    target_id = int(callback.data.split(":")[2])
    await state.update_data(target_student_id=target_id)
    await state.set_state(AdminStates.deduct_session_minutes)

    user = user_service.get_user(target_id) or {}
    name = user.get("first_name", "الطالب")
    bal = ledger_service.get_balance(target_id)["current_minutes"]

    text = (
        f"⏱ *خصم دقائق جلسة التسميع*\n\n"
        f"👤 الطالب: *{name}*\n"
        f"🟢 الرصيد المتاح: *{bal} دقيقة*\n\n"
        "📝 *اكتب عدد الدقائق المراد خصمها مباشرة (أدخل رقماً فقط، مثال: 30):*"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ إلغاء", callback_data=f"adm_std:{target_id}")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.message(AdminStates.deduct_session_minutes)
async def process_deduct_session(message: Message, state: FSMContext):
    data = await state.get_data()
    target_id = data.get("target_student_id")
    text = message.text.strip()

    if not text.isdigit() or int(text) <= 0:
        await message.answer("⚠️ يرجى إدخال رقم صحيح وموجب لعدد الدقائق:")
        return

    minutes = int(text)
    admin_id = message.from_user.id

    # Deduct atomically
    res = ledger_service.adjust_balance(
        user_id=target_id,
        minutes_change=-minutes,
        reason="خصم جلسة تسميع وتصحيح تلاوة",
        performed_by=admin_id
    )

    if not res.success:
        await message.answer(f"❌ لم يتم الخصم: {res.message}")
        await state.clear()
        return

    # Notify student in private
    student_alert = (
        f"⏱ *إشعار خصم من رصيدك بمقرأة الإمام الجزري*\n\n"
        f"تم خصم *{minutes} دقيقة* مقابل جلسة تسميع.\n"
        f"🟢 رصيدك المتبقي الحالي: *{res.balance_after} دقيقة*."
    )
    try:
        await message.bot.send_message(chat_id=target_id, text=student_alert, parse_mode="Markdown")
    except Exception:
        pass

    # Send automated immediate low-balance warning (<= 15 mins) or zero-balance alert (0 mins)
    await notification_service.send_balance_change_alert_if_needed(
        bot=message.bot,
        user_id=target_id,
        new_balance=res.balance_after,
        reason=f"خصم جلسة تسميع ({minutes} دقيقة)"
    )

    # If balance reached 0, sync mute status in group
    if res.balance_after <= 0:
        await loan_service.sync_group_status(message.bot, target_id)

    reply_text = (
        f"✅ *تم خصم {minutes} دقيقة بنجاح!*\n\n"
        f"• الرصيد السابق: {res.balance_before} دقيقة\n"
        f"• الرصيد الجديد: *{res.balance_after} دقيقة*\n"
        f"• تم إشعار الطالب في الخاص تلقائياً."
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 العودة لملف الطالب", callback_data=f"adm_std:{target_id}")],
        [InlineKeyboardButton(text="👨‍🎓 قائمة الطلاب", callback_data="adm_view_students")]
    ])
    await message.answer(reply_text, parse_mode="Markdown", reply_markup=kb)
    await state.clear()


# ----------------------------------------------------
# 3.2 الإجراء الثاني: إضافة رصيد (Add Balance)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:add:"))
async def start_add_balance(callback: CallbackQuery, state: FSMContext):
    target_id = int(callback.data.split(":")[2])
    await state.update_data(target_student_id=target_id)
    await state.set_state(AdminStates.add_balance_minutes)

    user = user_service.get_user(target_id) or {}
    name = user.get("first_name", "الطالب")
    bal = ledger_service.get_balance(target_id)["current_minutes"]

    text = (
        f"➕ *إضافة دقائق لحساب الطالب*\n\n"
        f"👤 الطالب: *{name}*\n"
        f"🟢 الرصيد الحالي: *{bal} دقيقة*\n\n"
        "📝 *اكتب عدد الدقائق المراد إضافتها (مثال: 60):*"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ إلغاء", callback_data=f"adm_std:{target_id}")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.message(AdminStates.add_balance_minutes)
async def process_add_balance(message: Message, state: FSMContext):
    data = await state.get_data()
    target_id = data.get("target_student_id")
    text = message.text.strip()

    if not text.isdigit() or int(text) <= 0:
        await message.answer("⚠️ يرجى إدخال رقم صحيح وموجب:")
        return

    minutes = int(text)
    admin_id = message.from_user.id

    res = ledger_service.adjust_balance(
        user_id=target_id,
        minutes_change=minutes,
        reason="إضافة رصيد / مكافأة من الإدارة",
        performed_by=admin_id,
        is_bonus=True
    )

    # Lift any mute restriction
    await loan_service.sync_group_status(message.bot, target_id)

    # Notify student
    try:
        await message.bot.send_message(
            chat_id=target_id,
            text=f"🎁 *تمت إضافة {minutes} دقيقة إلى رصيدك من قبل إدارة المقرأة!*\nرصيدك الحالي: *{res.balance_after} دقيقة*.",
            parse_mode="Markdown"
        )
    except Exception:
        pass

    reply_text = (
        f"✅ *تمت إضافة {minutes} دقيقة بنجاح!*\n\n"
        f"• الرصيد السابق: {res.balance_before} دقيقة\n"
        f"• الرصيد الجديد: *{res.balance_after} دقيقة*"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 العودة لملف الطالب", callback_data=f"adm_std:{target_id}")]
    ])
    await message.answer(reply_text, parse_mode="Markdown", reply_markup=kb)
    await state.clear()


# ----------------------------------------------------
# 3.3 الإجراء الثالث: رسالة خاص (Direct Message to Student)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:dm:"))
async def start_student_dm(callback: CallbackQuery, state: FSMContext):
    target_id = int(callback.data.split(":")[2])
    await state.update_data(target_student_id=target_id)
    await state.set_state(AdminStates.send_student_dm)

    user = user_service.get_user(target_id) or {}
    name = user.get("first_name", "الطالب")

    text = (
        f"💬 *إرسال رسالة خاصة للطالب*\n\n"
        f"👤 الطالب: *{name}* (`{target_id}`)\n\n"
        "✍️ *اكتب الآن نص الرسالة التي تريد إرسالها للطالب في الخاص:*"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ إلغاء", callback_data=f"adm_std:{target_id}")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.message(AdminStates.send_student_dm)
async def process_student_dm(message: Message, state: FSMContext):
    data = await state.get_data()
    target_id = data.get("target_student_id")
    msg_text = message.text.strip()

    student_dm_content = (
        "📨 *رسالة خاصة من إدارة مقرأة الإمام الجزري:*\n\n"
        f"{msg_text}\n\n"
        "🌿 وفقكم الله لكل خير."
    )

    try:
        await message.bot.send_message(chat_id=target_id, text=student_dm_content, parse_mode="Markdown")
        success = True
    except Exception as e:
        success = False
        error_msg = str(e)

    if success:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="👤 العودة لملف الطالب", callback_data=f"adm_std:{target_id}")]
        ])
        await message.answer("✅ *تم إرسال الرسالة إلى الطالب في الخاص بنجاح!*", parse_mode="Markdown", reply_markup=kb)
    else:
        await message.answer(f"⚠️ تعذر إرسال الرسالة للطالب: {error_msg}")

    await state.clear()


# ----------------------------------------------------
# 3.4 الإجراء الرابع: تفعيل الحساب ورفع القيود (Activate)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:unmute:"))
async def process_unmute_account(callback: CallbackQuery):
    target_id = int(callback.data.split(":")[2])
    bot: Bot = callback.bot

    # Update in user service & DB
    user_service.update_student_data(target_id, {"is_active": True, "is_muted": False, "is_banned": False})

    # Restore full permissions in all study groups
    for group_key, ginfo in settings.STUDY_GROUPS.items():
        cid = ginfo.get("chat_id")
        if cid:
            try:
                await bot.restrict_chat_member(
                    chat_id=cid,
                    user_id=target_id,
                    permissions=ChatPermissions(
                        can_send_messages=True,
                        can_send_audios=True,
                        can_send_documents=True,
                        can_send_photos=True,
                        can_send_videos=True,
                        can_send_voice_notes=True,
                        can_send_polls=True,
                        can_send_other_messages=True,
                        can_add_web_page_previews=True
                    )
                )
            except Exception:
                pass

    # Notify student
    try:
        await bot.send_message(
            chat_id=target_id,
            text="✅ *تم تفعيل حسابك ورفع كافة القيود في مجموعات المقرأة بنجاح!*\nأهلاً بك مجدداً.",
            parse_mode="Markdown"
        )
    except Exception:
        pass

    await callback.answer("✅ تم تفعيل الحساب ورفع الكتم بنجاح!", show_alert=True)
    # Refresh student card
    await show_student_card(callback)


# ----------------------------------------------------
# 3.5 الإجراء الخامس: كتم حساب (Mute Account in Groups)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:mute:"))
async def process_mute_account(callback: CallbackQuery):
    target_id = int(callback.data.split(":")[2])
    bot: Bot = callback.bot

    # Update state
    user_service.update_student_data(target_id, {"is_muted": True})

    # Restrict messages across study groups
    for group_key, ginfo in settings.STUDY_GROUPS.items():
        cid = ginfo.get("chat_id")
        if cid:
            try:
                await bot.restrict_chat_member(
                    chat_id=cid,
                    user_id=target_id,
                    permissions=ChatPermissions(
                        can_send_messages=False,
                        can_send_audios=False,
                        can_send_documents=False,
                        can_send_photos=False,
                        can_send_videos=False,
                        can_send_voice_notes=False,
                        can_send_polls=False,
                        can_send_other_messages=False,
                        can_add_web_page_previews=False
                    )
                )
            except Exception:
                pass

    # Notify student
    try:
        await bot.send_message(
            chat_id=target_id,
            text="🔇 *تم كتم حسابك في مجموعة التسميع من قبل إدارة المقرأة.*\nيرجى التواصل مع المشرف لمعرفة التفاصيل.",
            parse_mode="Markdown"
        )
    except Exception:
        pass

    await callback.answer("🔇 تم كتم حساب الطالب في المجموعات!", show_alert=True)
    await show_student_card(callback)


# ----------------------------------------------------
# 3.6 الإجراء السادس: حظر الكلي (Ban Student Completely)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:ban:"))
async def process_ban_account(callback: CallbackQuery):
    target_id = int(callback.data.split(":")[2])
    bot: Bot = callback.bot

    # Mark banned
    user_service.update_student_data(target_id, {"is_banned": True, "is_active": False})

    # Ban from all groups
    for group_key, ginfo in settings.STUDY_GROUPS.items():
        cid = ginfo.get("chat_id")
        if cid:
            try:
                await bot.ban_chat_member(chat_id=cid, user_id=target_id)
            except Exception:
                pass

    try:
        await bot.send_message(
            chat_id=target_id,
            text="🚫 *تم حظر حسابك من مقرأة الإمام الجزري.*",
            parse_mode="Markdown"
        )
    except Exception:
        pass

    await callback.answer("🚫 تم حظر الطالب كلياً من المجموعات!", show_alert=True)
    await show_student_card(callback)


# ----------------------------------------------------
# 3.7 الإجراء السابع: حذف الطالب (Delete Student)
# ----------------------------------------------------
@router.callback_query(F.data.startswith("std_act:delete:"))
async def process_delete_student(callback: CallbackQuery):
    target_id = int(callback.data.split(":")[2])
    
    # Delete from service
    user_service.delete_student(target_id)

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👨‍🎓 العودة لقائمة الطلاب", callback_data="adm_view_students")]
    ])
    await callback.message.edit_text(f"🗑 *تم حذف الطالب ({target_id}) من النظام بنجاح.*", parse_mode="Markdown", reply_markup=kb)
    await callback.answer("تم الحذف")


# ==========================================
# 4. البحث عن طالب (Search Student)
# ==========================================
@router.callback_query(F.data == "adm_search_student")
async def start_search_student(callback: CallbackQuery, state: FSMContext):
    await state.set_state(AdminStates.search_student_query)
    text = "🔍 *أدخل كود الطالب (مثل IM-1001 أو IF-1002) أو اسمه أو معرف تيليجرام:*"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ إلغاء", callback_data="adm_view_students")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.message(AdminStates.search_student_query)
async def process_search_student(message: Message, state: FSMContext):
    query = message.text.strip().lower()
    students = user_service.get_all_students()

    matched = []
    for s in students:
        tid = str(s.get("telegram_id", ""))
        name = str(s.get("first_name", "")).lower()
        code = str(s.get("student_code", "")).lower()
        if query in tid or query in name or query in code:
            matched.append(s)

    if not matched:
        await message.answer(f"⚠️ لم يتم العثور على أي طالب يطابق: `{query}`")
        await state.clear()
        return

    buttons = []
    for s in matched[:10]:
        tid = s.get("telegram_id")
        name = s.get("first_name", "طالب")
        code = s.get("student_code") or f"ID-{str(tid)[-4:]}"
        buttons.append([InlineKeyboardButton(text=f"[{code}] {name}", callback_data=f"adm_std:{tid}")])

    buttons.append([InlineKeyboardButton(text="⬅️ قائمة الطلاب", callback_data="adm_view_students")])
    kb = InlineKeyboardMarkup(inline_keyboard=buttons)
    await message.answer(f"🔍 نتائج البحث عن `{query}` ({len(matched)} طالب):", parse_mode="Markdown", reply_markup=kb)
    await state.clear()


# ==========================================
# 5. إرسال إعلان عام (Broadcast Announcement)
# ==========================================
@router.callback_query(F.data == "adm_broadcast_start")
async def start_broadcast(callback: CallbackQuery, state: FSMContext):
    await state.set_state(AdminStates.broadcast_message_text)
    text = (
        "📢 *إرسال إعلان عام لجميع الطلاب والمجموعات*\n\n"
        "اكتب الآن نص الإعلان وسيقوم البوت بإرساله فوراً:"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ إلغاء", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.message(AdminStates.broadcast_message_text)
async def process_broadcast(message: Message, state: FSMContext):
    text_to_broadcast = message.text.strip()
    announcement_msg = (
        "📢 *إعلان رسمي من إدارة مقرأة الإمام الجزري*\n\n"
        f"{text_to_broadcast}\n\n"
        "🌿 بارك الله فيكم ونفع بكم."
    )

    students = user_service.get_all_students()
    sent_count = 0

    # Broadcast to registered users
    for s in students:
        tid = s.get("telegram_id")
        if tid:
            try:
                await message.bot.send_message(chat_id=int(tid), text=announcement_msg, parse_mode="Markdown")
                sent_count += 1
            except Exception:
                pass

    # Broadcast to official 6 groups
    for gkey, ginfo in settings.STUDY_GROUPS.items():
        cid = ginfo.get("chat_id")
        if cid:
            try:
                await message.bot.send_message(chat_id=cid, text=announcement_msg, parse_mode="Markdown")
            except Exception:
                pass

    await message.answer(f"✅ *تم بث الإعلان بنجاح إلى {sent_count} طالباً ومجموعات المقرأة الرسمية!*", parse_mode="Markdown")
    await state.clear()


# ----------------------------------------------------
# 5. نظام الإشعارات وفحص الرصيد المنخفض
# ----------------------------------------------------
@router.callback_query(F.data == "adm_run_balance_alerts")
async def trigger_manual_balance_check(callback: CallbackQuery):
    user_id = callback.from_user.id
    if not user_service.is_admin_or_supervisor(user_id):
        await callback.answer(t("admin_access_denied", "ar"), show_alert=True)
        return

    await callback.answer("⏳ جاري الفحص وإرسال التنبيهات...", show_alert=False)
    results = await notification_service.check_and_notify_low_balance_students(callback.bot)

    summary_text = (
        "🔔 *نتائج فحص وإرسال تنبيهات الرصيد:*\n\n"
        f"• الحد الأدنى المعتمد للتنبيه: *{results['threshold']} دقيقة*\n"
        f"• إجمالي الطلاب المفحوصين: *{results['students_checked']}*\n"
        f"• إشعارات رصيد منخفض تم إرسالها (≤ 15 د): *{results['notified_low_balance']}*\n"
        f"• إشعارات نفاد رصيد تم إرسالها (0 د): *{results['notified_zero_balance']}*\n"
        f"• طلاب تم كتمهم لانتهاء الرصيد: *{results['muted_students']}*\n"
        f"• أخطاء أثناء الإرسال: *{results['errors']}*\n\n"
        "✨ تم إرسال التنبيهات في الخاص للطلاب المستحقين بنجاح."
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚠️ استعراض تقرير الطلاب", callback_data="adm_low_balance_report")],
        [InlineKeyboardButton(text="🔙 العودة للوحة الإدارة", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(summary_text, parse_mode="Markdown", reply_markup=kb)


@router.callback_query(F.data == "adm_low_balance_report")
async def show_low_balance_report(callback: CallbackQuery):
    user_id = callback.from_user.id
    if not user_service.is_admin_or_supervisor(user_id):
        await callback.answer(t("admin_access_denied", "ar"), show_alert=True)
        return

    report = notification_service.get_low_balance_students_report()
    thresh = notification_service.get_threshold()

    if not report:
        text = (
            f"✅ *تقرير الأرصدة مطمئن وممتاز!*\n\n"
            f"لا يوجد أي طالب رصيده أقل من أو يساوي {thresh} دقيقة حالياً.\n"
            "جميع الطلاب يمتلكون رصيداً كافياً لمواصلة التسميع."
        )
    else:
        text = (
            f"⚠️ *تقرير الطلاب ذوي الرصيد المنخفض (≤ {thresh} دقيقة):*\n"
            f"إجمالي الطلاب: *{len(report)}*\n\n"
        )
        for idx, item in enumerate(report[:25], 1):
            status_icon = "🛑 نفد (0د)" if item["is_zero"] else f"⚠️ متبقي {item['balance']}د"
            loan_badge = " [سلفة مفعلة]" if item["has_loan"] else ""
            text += f"{idx}. *{item['first_name']}* (`{item['student_code']}`) - {status_icon}{loan_badge}\n"

        if len(report) > 25:
            text += f"\n... و {len(report) - 25} طالب إضافي."

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔔 إرسال تنبيهات لهؤلاء الطلاب الآن", callback_data="adm_run_balance_alerts")],
        [InlineKeyboardButton(text="🔙 العودة للوحة الإدارة", callback_data="adm_refresh")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()