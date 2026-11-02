import uuid
from datetime import datetime
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.database import supabase
from bot.services.loan_service import loan_service
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

    if not method.get("is_active") or not method.get("account"):
        await callback.answer(text=t("payment_unconfigured", lang), show_alert=True)
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
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(sender_name=message.text.strip())
    await state.set_state(PaymentStates.sender_phone)
    await message.answer(t("payment_enter_sender_phone", lang))

@router.message(PaymentStates.sender_phone)
async def process_sender_phone(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(sender_phone=message.text.strip())
    await state.set_state(PaymentStates.tx_ref)
    await message.answer(t("payment_enter_tx_ref", lang))

@router.message(PaymentStates.tx_ref)
async def process_tx_ref(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    tx_ref = message.text.strip()
    
    # التحقق من عدم تكرار الرقم المرجعي في قاعدة البيانات
    try:
        res = supabase.table('payments').select('id').execute()
        # ملاحظة: إذا أضفت عمود tx_ref لجدول payments، استخدمه هنا. حالياً نعتمد على الذاكرة المرفقة بالرسالة.
    except:
        pass

    await state.update_data(tx_ref=tx_ref)
    await state.set_state(PaymentStates.transfer_date)
    await message.answer(t("payment_enter_date", lang))

@router.message(PaymentStates.transfer_date)
async def process_transfer_date(message: Message, state: FSMContext):
    lang = user_service.get_user_language(message.from_user.id)
    await state.update_data(transfer_date=message.text.strip())
    await state.set_state(PaymentStates.receipt_photo)
    await message.answer(t("payment_upload_receipt", lang))

@router.message(PaymentStates.receipt_photo)
async def process_receipt(message: Message, state: FSMContext):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)
    photo_id = message.photo[-1].file_id if message.photo else None

    data = await state.get_data()
    pkg = next((p for p in PACKAGES_CATALOG if p["id"] == data["package_id"]), None)
    
    # الحفظ في Supabase
    req_id = str(uuid.uuid4())[:8].upper()
    
    try:
        supabase.table('payments').insert({
            "id": req_id,
            "user_id": user_id,
            "minutes": pkg["minutes"],
            "amount_etb": pkg["price_etb"],
            "status": "pending"
        }).execute()
        
        await message.answer(
            text=t("payment_submitted_success", lang, tx_ref=data['tx_ref'], minutes=pkg["minutes"], amount=pkg["price_etb"]),
            parse_mode="Markdown",
            reply_markup=get_main_menu_keyboard(user_id, lang)
        )
    except Exception as e:
        await message.answer(f"⚠️ حدث خطأ أثناء الحفظ: {str(e)}")

    await state.clear()

@router.callback_query(F.data == "req_loan")
async def handle_loan_request(callback: CallbackQuery):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)
    
    success = loan_service.give_loan(user_id, amount=15)
    
    if success:
        await callback.message.edit_text(
            "✅ تمت إضافة *15 دقيقة* كسلفة طارئة لحسابك.\n"
            "تنبيه: سيتم خصم هذه الدقائق تلقائياً عند قيامك بأول عملية شحن.",
            parse_mode="Markdown"
        )
        await loan_service.sync_group_status(callback.bot, user_id)
    else:
        await callback.answer("⚠️ لا يمكنك أخذ سلفة جديدة حتى تسدد السلفة السابقة.", show_alert=True)
    await callback.answer()