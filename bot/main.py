"""
Main entry point for Imam Al-Jazari Telegram Bot.
Supports polling (local development/testing) and webhook (production).
Integrated with FastAPI for webhooks and health endpoints.
"""

import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
import uvicorn

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import settings
from bot.middlewares.auth import AuthMiddleware
from bot.middlewares.throttling import ThrottlingMiddleware
from bot.handlers.start import router as start_router
from bot.handlers.registration import router as registration_router
from bot.handlers.programs import router as programs_router
from bot.handlers.packages import router as packages_router
from bot.handlers.payments import router as payments_router
from bot.handlers.balance import router as balance_router
from bot.handlers.groups import router as groups_router
from bot.handlers.support import router as support_router
from bot.handlers.teacher import router as teacher_router
from bot.handlers.admin import router as admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("maqraah_bot")


def build_dispatcher() -> Dispatcher:
    dp = Dispatcher(storage=MemoryStorage())
    
    # Register Middlewares
    dp.message.middleware(AuthMiddleware())
    dp.callback_query.middleware(AuthMiddleware())
    dp.message.middleware(ThrottlingMiddleware())

    # Register Routers
    dp.include_router(start_router)
    dp.include_router(registration_router)
    dp.include_router(programs_router)
    dp.include_router(packages_router)
    dp.include_router(payments_router)
    dp.include_router(balance_router)
    dp.include_router(groups_router)
    dp.include_router(support_router)
    dp.include_router(teacher_router)
    dp.include_router(admin_router)

    return dp


def create_bot() -> Bot:
    return Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN),
    )


# FastAPI Application for Webhook mode
@asynccontextmanager
async def lifespan(app: FastAPI):
    bot = create_bot()
    dp = build_dispatcher()
    app.state.bot = bot
    app.state.dp = dp

    if settings.is_webhook:
        logger.info(f"Setting webhook to {settings.WEBHOOK_URL}")
        await bot.set_webhook(
            url=settings.WEBHOOK_URL,
            secret_token=settings.WEBHOOK_SECRET,
            drop_pending_updates=True,
        )
    yield
    if settings.is_webhook:
        await bot.delete_webhook()
    await bot.session.close()


app = FastAPI(title="Imam Al-Jazari Telegram Bot API", lifespan=lifespan)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "bot_mode": settings.BOT_MODE,
        "center": settings.CENTER_NAME_AR,
    }


@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    bot: Bot = request.app.state.bot
    dp: Dispatcher = request.app.state.dp

    # Verify secret token header
    secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    if secret != settings.WEBHOOK_SECRET:
        return Response(status_code=403, content="Forbidden")

    data = await request.json()
    from aiogram.types import Update
    update = Update.model_validate(data, context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"ok": True}


async def main():
    logger.info("Starting Imam Al-Jazari Telegram Bot in Polling Mode...")
    bot = create_bot()
    dp = build_dispatcher()

    try:
        await dp.start_polling(bot, drop_pending_updates=True)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    if settings.is_webhook:
        logger.info(f"Starting Webhook Server on {settings.WEBHOOK_HOST}:{settings.WEBHOOK_PORT}")
        uvicorn.run(app, host=settings.WEBHOOK_HOST, port=settings.WEBHOOK_PORT)
    else:
        import asyncio
        asyncio.run(main())
