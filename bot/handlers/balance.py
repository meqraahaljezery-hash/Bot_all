"""
Student Minutes Balance & Transaction History Handler.
Displays immutable financial ledger entries.
"""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
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