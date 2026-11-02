"""
In-Bot Administration Panel Handler for Imam Al-Jazari Maqraah.
Enforces strict RBAC via user_service and atomic financial transactions.
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
from bot.handlers.payments import PAYMENT_REQUESTS_STORE
from bot.handlers.registration import REGISTRATIONS_STORE

router = Router(name="admin_router")


class AdminStates(StatesGroup):
    rejection_reason = State()
    adjust_user = State()
    adjust_amount = State()
    adjust_reason = State()
    broadcast_text = State()


@router.message(F.text.in_([
    "🛡 لوحة الإدارة", "🛡 Admin Panel", "🛡 የአስተዳደር ፓነል"
]))
@router.message(Command("admin"))
async def handle_admin_panel(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    if not user_service.is_admin_or_supervisor(user_id):
        await message.answer(t("admin_access_denied", lang))
        return

    pending_regs = len([r for r in REGISTRATIONS_STORE.values() if r["status"] == "pending"])
    pending_pays = len([p for p in PAYMENT_REQUESTS_STORE.values() if p["status"] == "pending"])

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("admin_btn_registrations", lang, count=pending_regs), callback_data="adm_view_regs")],
            [InlineKeyboardButton(text=t("admin_btn_payments", lang, count=pending_pays), callback_data="adm_view_pays")],
            [InlineKeyboardButton(text=t("admin_btn_balances", lang), callback_data="adm_adjust_balance_start")],
            [InlineKeyboardButton(text=t("admin_btn_broadcast", lang), callback_data="adm_broadcast_start")],
        ]
    )

    await message.answer(
        text=t("admin_menu_title", lang),
        parse_mode="Markdown",
        reply_markup=kb,
    )


@router.callback_query(F.data == "adm_view_pays")
async def handle_admin_view_payments(callback: CallbackQuery):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    if not user_service.has_permission(user_id, "review_payments"):
        await callback.answer(t("admin_access_denied", lang), show_alert=True)
        return

    pending = [p for p in PAYMENT_REQUESTS_STORE.values() if p["status"] == "pending"]

    if not pending:
        await callback.message.edit_text("✅ لا توجد طلبات دفع معلقة تتطلب المراجعة حالياً.")
        await callback.answer()
        return

    p = pending[0]
    text = (
        f"💳 *طلب دفع قيد المراجعة:*\n\n"
        f"🔢 المعرف: `{p['id']}`\n"
        f"👤 اسم المحوِّل: *{p['sender_name']}*\n"
        f"📱 هاتف المرسل: `{p['sender_phone']}`\n"
        f"⏱ الدقائق: *{p['minutes']} دقيقة*\n"
        f"💰 المبلغ: *{p['amount_etb']} ETB*\n"
        f"🏦 طريقة الدفع: {p['method_id'].upper()}\n"
        f"🔖 رقم العملية: `{p['tx_ref']}`\n"
        f"📅 تاريخ التحويل: {p['transfer_date']}\n"
    )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ اعتماد وإضافة الرصيد", callback_data=f"adm_pay_app:{p['id']}"),
                InlineKeyboardButton(text="❌ رفض الطلب", callback_data=f"adm_pay_rej:{p['id']}"),
            ],
            [InlineKeyboardButton(text=t("btn_back", lang), callback_data="adm_menu_back")]
        ]
    )

    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data.startswith("adm_pay_app:"))
async def handle_admin_approve_payment(callback: CallbackQuery):
    pay_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id
    lang = user_service.get_user_language(admin_id)

    if not user_service.has_permission(admin_id, "review_payments"):
        await callback.answer(t("admin_access_denied", lang), show_alert=True)
        return

    pay = PAYMENT_REQUESTS_STORE.get(pay_id)
    if not pay or pay["status"] != "pending":
        await callback.answer(t("admin_payment_already_processed", lang), show_alert=True)
        return

    # Atomic execution via ledger service
    res = ledger_service.process_payment_approval(
        payment_id=pay_id,
        user_id=pay["user_id"],
        minutes=pay["minutes"],
        idempotency_key=pay["idempotency_key"],
        approved_by=str(admin_id),
    )

    if res.success:
        pay["status"] = "approved"
        pay["reviewed_by"] = str(admin_id)

        await callback.message.edit_text(
            f"✅ *تم اعتماد الدفع بنجاح!*\n"
            f"تمت إضافة *{pay['minutes']} دقيقة* لرصيد الطالب `{pay['user_id']}`.\n"
            f"الرصيد السابق: {res.balance_before} | الرصيد الحالي: *{res.balance_after}*",
            parse_mode="Markdown"
        )
    else:
        await callback.message.edit_text(f"⚠️ تعذر الاعتماد: {res.message}")

    await callback.answer()


@router.callback_query(F.data.startswith("adm_pay_rej:"))
async def handle_admin_reject_payment_start(callback: CallbackQuery, state: FSMContext):
    pay_id = callback.data.split(":")[1]
    admin_id = callback.from_user.id
    lang = user_service.get_user_language(admin_id)

    if not user_service.has_permission(admin_id, "review_payments"):
        await callback.answer(t("admin_access_denied", lang), show_alert=True)
        return

    await state.update_data(reject_payment_id=pay_id)
    await state.set_state(AdminStates.rejection_reason)
    await callback.message.edit_text("❌ يرجى كتابة سبب رفض طلب الدفع (مطلوب وإلزامي لتوثيقه وإرساله للمستخدم):")
    await callback.answer()


@router.message(AdminStates.rejection_reason)
async def handle_admin_rejection_reason(message: Message, state: FSMContext):
    admin_id = message.from_user.id
    lang = user_service.get_user_language(admin_id)
    reason = message.text.strip()

    data = await state.get_data()
    pay_id = data.get("reject_payment_id")

    if pay_id and pay_id in PAYMENT_REQUESTS_STORE:
        pay = PAYMENT_REQUESTS_STORE[pay_id]
        pay["status"] = "rejected"
        pay["rejection_reason"] = reason
        pay["reviewed_by"] = str(admin_id)

        await message.answer(
            f"❌ تم رفض طلب الدفع `{pay_id}` بنجاح وتوثيق السبب: *{reason}*.",
            parse_mode="Markdown"
        )

    await state.clear()
