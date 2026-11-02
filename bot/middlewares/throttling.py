"""
Rate Limiting and Anti-Flood Throttling Middleware.
Protects Telegram Bot API limits and prevents abuse.
"""

import time
from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message


class ThrottlingMiddleware(BaseMiddleware):
    def __init__(self, rate_limit: float = 0.5):
        self.rate_limit = rate_limit
        self.last_seen: Dict[int, float] = {}

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        if isinstance(event, Message) and event.from_user:
            user_id = event.from_user.id
            current_time = time.time()
            last_time = self.last_seen.get(user_id, 0)

            if current_time - last_time < self.rate_limit:
                # Silently drop or warn
                return None

            self.last_seen[user_id] = current_time

        return await handler(event, data)
