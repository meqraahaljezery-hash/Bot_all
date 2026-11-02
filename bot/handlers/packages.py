"""
Packages and Minutes Pricing Handlers.
Displays packages, pricing in ETB, and initiates purchase flow without premature balance credit.
"""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from bot.locales.i18n import t
from bot.services.user_service import user_service
from bot.keyboards.inline import (
    get_packages_keyboard,
    get_package_details_keyboard,
    get_payment_methods_keyboard,
)
from bot.catalog import PACKAGES_CATALOG, PAYMENT_METHODS_CATALOG

router = Router(name="packages_router")


@router.message(F.text.in_([
    "💳 الباقات وشراء الدقائق", "💳 Packages & Buy Minutes", "💳 ፓኬጆች እና ደቂቃዎች"
]))
@router.message(Command("packages"))
async def handle_packages_list(message: Message):
    user_id = message.from_user.id
    lang = user_service.get_user_language(user_id)

    await message.answer(
        text=t("packages_title", lang),
        parse_mode="Markdown",
        reply_markup=get_packages_keyboard(PACKAGES_CATALOG, lang),
    )


@router.callback_query(F.data == "view_packages_list")
async def handle_packages_callback(callback: CallbackQuery):
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    await callback.message.edit_text(
        text=t("packages_title", lang),
        parse_mode="Markdown",
        reply_markup=get_packages_keyboard(PACKAGES_CATALOG, lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("pkg:"))
async def handle_package_detail(callback: CallbackQuery):
    pkg_id = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    pkg = next((p for p in PACKAGES_CATALOG if p["id"] == pkg_id), None)
    if not pkg:
        await callback.answer(t("error_generic", lang), show_alert=True)
        return

    name = pkg.get(f"name_{lang}", pkg.get("name_ar"))
    desc = pkg.get(f"desc_{lang}", pkg.get("desc_ar", ""))

    text = t(
        "package_card",
        lang,
        name=name,
        minutes=pkg["minutes"],
        price=pkg["price_etb"],
        description=desc,
    )

    await callback.message.edit_text(
        text=text,
        parse_mode="Markdown",
        reply_markup=get_package_details_keyboard(pkg_id, lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("buy_pkg:"))
async def handle_buy_package_start(callback: CallbackQuery):
    pkg_id = callback.data.split(":")[1]
    user_id = callback.from_user.id
    lang = user_service.get_user_language(user_id)

    # Show available payment methods
    text = t("payment_instructions", lang)
    await callback.message.edit_text(
        text=text,
        parse_mode="Markdown",
        reply_markup=get_payment_methods_keyboard(PAYMENT_METHODS_CATALOG, pkg_id, lang),
    )
    await callback.answer()
