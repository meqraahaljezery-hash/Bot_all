"""
Manual Payment Processing and Verification Handler.
Enforces strict financial safeguards:
1. No automatic credit on request creation.
2. Idempotency key per transaction.
3. Reviewable by admin with receipt and reference.
"""

import uuid
from datetime import datetime
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.catalog import PACKAGES_CATALOG, PAYMENT_METHODS_CATALOG
from bot.keyboards.inline import get_payment_confirm_keyboard
from bot.keyboards.reply import get_main_menu_keyboard

router = Router(name="payments_router")


class PaymentStates(StatesGroup):
    sender_name = State()
    sender_phone = State()
    tx_ref = State()
    transfer_date = State()
    receipt_photo = State()
    confirm = State()


# Store for submitted payment requests
PAYMENT_REQUESTS_STORE = {}


@router.callback_query(F.data.startswith("pay_method:"))
async def handle_payment_method_choice(callback: CallbackQuery):
    _, pkg_id, method_id = callback.data.split(":")
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    method = next((m for m in PAYMENT_METHODS_CATALOG if m["id"] == method_id), None)
    pkg = next((p for p in PACKAGES_CATALOG if p["id"] == pkg_id), None)

    if not method or not pkg:
        await callback.answer(t("error_generic", lang), show_alert=True)
        return

    # If method is unconfigured (empty account and inactive)
    if not method.get("is_active") or not method.get("account"):
        await callback.answer(
            text=t("payment_unconfigured", lang),
            show_alert=True,
        )
        return

    bank_name = method.get(f"title_{lang}", method.get("title_ar"))
    instr = method.get(f"instructions_{lang}", method.get("instructions_ar"))

    text = (
        f"💳 *تفاصيل سداد {pkg['name_ar']}*\n"
        f"💰 المبلغ المطلوب: *{pkg['price_etb']} ETB*\n"
        f"⏱ الدقائق المكتسبة: *{pkg['minutes']} دقيقة*\n\n"
        f"{t('payment_details_prompt', lang, bank=bank_name, beneficiary=method.get('beneficiary', 'مقرأة الإمام الجزري'), account=method.get('account', '---'), instructions=instr)}"
    )

    await callback.message.edit_text(
        text=text,
        parse_mode="Markdown",
        reply_markup=get_payment_confirm_keyboard(pkg_id, method_id, lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("transferred:"))
async def start_payment_form(callback: CallbackQuery, state: FSMContext):
    _, pkg_id, method_id = callback.data.split(":")
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await state.update_data(package_id=pkg_id, method_id=method_id)
    await state.set_state(PaymentStates.sender_name)

    await callback.message.edit_text(t("payment_enter_sender_name", lang))
    await callback.answer()


@router.message(PaymentStates.sender_name)
async def process_sender_name(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    name = message.text.strip()
    await state.update_data(sender_name=name)
    await state.set_state(PaymentStates.sender_phone)
    await message.answer(t("payment_enter_sender_phone", lang))


@router.message(PaymentStates.sender_phone)
async def process_sender_phone(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    phone = message.text.strip()
    await state.update_data(sender_phone=phone)
    await state.set_state(PaymentStates.tx_ref)
    await message.answer(t("payment_enter_tx_ref", lang))


@router.message(PaymentStates.tx_ref)
async def process_tx_ref(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    tx_ref = message.text.strip()
    # Check if duplicate tx ref exists
    if any(p["tx_ref"] == tx_ref for p in PAYMENT_REQUESTS_STORE.values()):
        await message.answer("⚠️ هذا الرقم المرجعي للمعاملة مسجل مسبقاً. يرجى التحقق من الرقم المرجعي الصحيح وإعادة إدخاله:")
        return

    await state.update_data(tx_ref=tx_ref)
    await state.set_state(PaymentStates.transfer_date)
    await message.answer(t("payment_enter_date", lang))


@router.message(PaymentStates.transfer_date)
async def process_transfer_date(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    date_str = message.text.strip()
    await state.update_data(transfer_date=date_str)
    await state.set_state(PaymentStates.receipt_photo)
    await message.answer(t("payment_upload_receipt", lang))


@router.message(PaymentStates.receipt_photo)
async def process_receipt(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    photo_id = None
    if message.photo:
        photo_id = message.photo[-1].file_id

    data = await state.get_data()
    pkg_id = data["package_id"]
    pkg = next(p for p in PACKAGES_CATALOG if p["id"] == pkg_id)

    req_id = str(uuid.uuid4())[:8].upper()
    idempotency_key = f"pay_{data['tx_ref']}_{req_id}"

    PAYMENT_REQUESTS_STORE[req_id] = {
        "id": req_id,
        "user_id": str(user_id),
        "package_id": pkg_id,
        "minutes": pkg["minutes"],
        "amount_etb": pkg["price_etb"],
        "method_id": data["method_id"],
        "sender_name": data["sender_name"],
        "sender_phone": data["sender_phone"],
        "tx_ref": data["tx_ref"],
        "transfer_date": data["transfer_date"],
        "receipt_photo_id": photo_id,
        "idempotency_key": idempotency_key,
        "status": "pending",
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
    }

    await state.clear()

    await message.answer(
        text=t(
            "payment_submitted_success",
            lang,
            tx_ref=data["tx_ref"],
            minutes=pkg["minutes"],
            amount=pkg["price_etb"],
        ),
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(user_id, lang),
    )


@router.message(F.text.in_([
    "💰 طلباتي المالية", "💰 My Payment Orders", "💰 የክፍያ ጥያቄዎቼ"
]))
@router.message(Command("payments"))
async def list_user_payments(message: Message):
    user_id = str(message.from_user.id)
    lang = user_service.get_user_language(int(user_id))

    user_payments = [p for p in PAYMENT_REQUESTS_STORE.values() if p["user_id"] == user_id]

    if not user_payments:
        await message.answer("📌 لا توجد طلبات دفع مسجلة لحسابك حالياً.")
        return

    text = "💰 *طلبات الدفع الخاصة بك:*\n\n"
    for p in user_payments:
        status_symbol = "⏳ قيد المراجعة" if p["status"] == "pending" else ("✅ معتمد" if p["status"] == "approved" else "❌ مرفوض")
        text += f"• `{p['id']}` | {p['minutes']} دقيقة | {p['amount_etb']} ETB\n  الحالة: {status_symbol}\n  المرجع: `{p['tx_ref']}` ({p['created_at']})\n\n"

    await message.answer(text, parse_mode="Markdown")
