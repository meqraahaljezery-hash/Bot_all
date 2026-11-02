"""
Authentication and User Registration Middleware for aiogram 3.x.
Ensures every Telegram user is mapped, cached, and context-injected.
"""

from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery
from bot.services.user_service import user_service


class AuthMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        from_user = None
        if isinstance(event, Message):
            from_user = event.from_user
        elif isinstance(event, CallbackQuery):
            from_user = event.from_user

        if from_user and not from_user.is_bot:
            user = user_service.register_or_get_user(
                telegram_id=from_user.id,
                username=from_user.username,
                first_name=from_user.first_name,
                last_name=from_user.last_name,
            )
            data["current_user"] = user
            data["user_lang"] = user.get("preferred_language", "ar")

        return await handler(event, data)
