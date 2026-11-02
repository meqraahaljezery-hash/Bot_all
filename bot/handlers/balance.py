"""
Student Minutes Balance & Transaction History Handler.
Displays immutable financial ledger entries.
"""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.services.ledger_service import ledger_service

router = Router(name="balance_router")


@router.message(F.text.in_([
    "⏱ رصيدي من الدقائق", "⏱ My Minutes Balance", "⏱ የደቂቃ ሂሳቤ"
]))
@router.message(Command("balance"))
async def handle_balance_inquiry(message: Message):
    user_id = str(message.from_user.id)
    lang = user_service.get_user_language(int(user_id))
    user = user_service.register_or_get_user(int(user_id))

    bal = ledger_service.get_balance(user_id)
    history = ledger_service.get_transaction_history(user_id)

    # Format header
    text = t(
        "balance_title",
        lang,
        name=user.get("first_name", "الطالب"),
        balance=bal["current_minutes"],
        total_purchased=bal["total_purchased"],
        total_consumed=bal["total_consumed"],
        total_bonus=bal["total_bonus"],
    )

    if not history:
        text += f"\n{t('no_transactions', lang)}"
    else:
        for tx in history[-5:]:  # show latest 5
            sign = "+" if tx["minutes_change"] > 0 else ""
            date_short = tx.get("created_at", "")[:10]
            
            # إصلاح الخطأ هنا: فصل المتغير لتجنب تداخل علامات الاقتباس
            change_value = f"{sign}{tx['minutes_change']}"
            
            text += f"\n{t('transaction_row', lang, date=date_short, change=change_value, reason=tx['reason'], after=tx['balance_after'])}"

    await message.answer(text, parse_mode="Markdown")


@router.callback_query(F.data == "req_loan")
async def handle_request_loan(callback: CallbackQuery):
    from bot.services.loan_service import loan_service
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    success = loan_service.give_loan(user_id, amount=15)
    if success:
        # Restore permissions in groups
        await loan_service.sync_group_status(callback.bot, user_id)
        bal = ledger_service.get_balance(user_id)["current_minutes"]
        await callback.message.edit_text(
            f"✅ *تمت الموافقة على السلفة الطارئة (15 دقيقة)!*\n\n"
            f"🟢 رصيدك الحالي أصبح: *{bal} دقيقة*.\n"
            "تم فك الكتم واستعادة إمكانية المشاركة في حلقتك.\n"
            "⚠️ سيتم استقطاع السلفة تلقائياً عند أول عملية شحن رصيد.",
            parse_mode="Markdown"
        )
    else:
        await callback.answer(t("loan_already_active", lang), show_alert=True)