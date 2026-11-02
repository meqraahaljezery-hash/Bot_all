"""
Inline Keyboards for Imam Al-Jazari Telegram Bot.
Includes language selection, programs, packages, payment options, and admin actions.
"""

from typing import List, Dict, Any, Optional
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from bot.locales.i18n import t


def get_language_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🇸🇦 العربية", callback_data="set_lang:ar"),
                InlineKeyboardButton(text="🇬🇧 English", callback_data="set_lang:en"),
                InlineKeyboardButton(text="🇪🇹 አማርኛ", callback_data="set_lang:am"),
            ]
        ]
    )


def get_programs_keyboard(programs: List[Dict[str, Any]], lang: str = "ar") -> InlineKeyboardMarkup:
    buttons = []
    for prog in programs:
        name = prog.get(f"name_{lang}", prog.get("name_ar", prog["id"]))
        buttons.append([InlineKeyboardButton(text=f"📖 {name}", callback_data=f"prog:{prog['id']}")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_program_details_keyboard(program_id: str, lang: str = "ar") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_register", lang), callback_data=f"reg_start:{program_id}")],
            [InlineKeyboardButton(text=t("btn_back", lang), callback_data="view_programs_list")],
        ]
    )


def get_packages_keyboard(packages: List[Dict[str, Any]], lang: str = "ar") -> InlineKeyboardMarkup:
    buttons = []
    for pkg in packages:
        name = pkg.get(f"name_{lang}", pkg.get("name_ar", f"{pkg['minutes']} دقيقة"))
        price = pkg["price_etb"]
        buttons.append([
            InlineKeyboardButton(
                text=f"📦 {name} — {price} ETB",
                callback_data=f"pkg:{pkg['id']}"
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_package_details_keyboard(package_id: str, lang: str = "ar") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_buy_package", lang), callback_data=f"buy_pkg:{package_id}")],
            [InlineKeyboardButton(text=t("btn_back", lang), callback_data="view_packages_list")],
        ]
    )


def get_payment_methods_keyboard(methods: List[Dict[str, Any]], package_id: str, lang: str = "ar") -> InlineKeyboardMarkup:
    buttons = []
    for method in methods:
        title = method.get(f"title_{lang}", method.get("title_ar", method["id"].upper()))
        status_indicator = "🟢" if method.get("is_active") else "⚪️"
        buttons.append([
            InlineKeyboardButton(
                text=f"{status_indicator} {title}",
                callback_data=f"pay_method:{package_id}:{method['id']}"
            )
        ])
    buttons.append([InlineKeyboardButton(text=t("btn_cancel", lang), callback_data="cancel_payment")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_payment_confirm_keyboard(package_id: str, method_id: str, lang: str = "ar") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_i_transferred", lang), callback_data=f"transferred:{package_id}:{method_id}")],
            [InlineKeyboardButton(text=t("btn_cancel", lang), callback_data="cancel_payment")],
        ]
    )


def get_confirmation_keyboard(confirm_code: str, cancel_code: str, lang: str = "ar") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("btn_confirm", lang), callback_data=confirm_code),
                InlineKeyboardButton(text=t("btn_cancel", lang), callback_data=cancel_code),
            ]
        ]
    )


def get_telegram_group_keyboard(invite_link: str, lang: str = "ar") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_join_telegram_group", lang), url=invite_link)]
        ]
    )


def get_admin_payment_review_keyboard(payment_id: str, lang: str = "ar") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("btn_approve", lang), callback_data=f"adm_pay_app:{payment_id}"),
                InlineKeyboardButton(text=t("btn_reject", lang), callback_data=f"adm_pay_rej:{payment_id}"),
            ]
        ]
    )
