import sys
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
import uvicorn

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, Update

from bot.config import settings
from bot.services.database import supabase
from bot.services.ledger_service import ledger_service
from bot.services.user_service import user_service
from bot.locales.i18n import t

# استيراد الـ Middlewares والـ Routers
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

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s")
logger = logging.getLogger("maqraah_bot")

def build_dispatcher() -> Dispatcher:
    dp = Dispatcher(storage=MemoryStorage())
    dp.message.middleware(AuthMiddleware())
    dp.callback_query.middleware(AuthMiddleware())
    dp.message.middleware(ThrottlingMiddleware())

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
    return Bot(token=settings.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN))

# === مهمة التنبيهات في الخلفية ===
async def send_low_balance_alerts(bot: Bot):
    while True:
        try:
            res = supabase.table('users').select('telegram_id').execute()
            for user in res.data:
                uid = user['telegram_id']
                bal = ledger_service.get_balance(uid)['current_minutes']
                
                if bal <= 15:
                    lang = user_service.get_user_language(uid)
                    kb = InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text=t("loan_btn", lang), callback_data="req_loan")],
                    ])
                    try:
                        await bot.send_message(uid, t("low_balance_alert", lang, balance=bal), reply_markup=kb)
                    except: pass
        except Exception as e:
            logger.error(f"Error in alert task: {e}")
        await asyncio.sleep(8 * 60 * 60) # كل 8 ساعات

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
            drop_pending_updates=True  # 🔥 تنظيف الرسائل العالقة
        )
    
    # تشغيل المهمة في الخلفية
    asyncio.create_task(send_low_balance_alerts(bot))
    
    yield
    
    if settings.is_webhook:
        await bot.delete_webhook()
    await bot.session.close()

app = FastAPI(title="Imam Al-Jazari Bot API", lifespan=lifespan)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "bot_mode": settings.BOT_MODE}

@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    bot: Bot = request.app.state.bot
    dp: Dispatcher = request.app.state.dp
    secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    
    if secret != settings.WEBHOOK_SECRET:
        return Response(status_code=403, content="Forbidden")

    data = await request.json()
    update = Update.model_validate(data, context={"bot": bot})
    
    try:
        await dp.feed_update(bot, update)
    except Exception as e:
        logger.error(f"Error handling update: {e}")
        # نرجع 200 حتى لا تعيد تيليجرام المحاولة وتتسبب في خطأ 500 متكرر
        return {"ok": True} 
        
    return {"ok": True}

async def main():
    logger.info("Starting Bot in Polling Mode...")
    bot = create_bot()
    dp = build_dispatcher()
    try:
        await dp.start_polling(bot, drop_pending_updates=True)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    if settings.is_webhook:
        uvicorn.run(app, host=settings.WEBHOOK_HOST, port=settings.WEBHOOK_PORT)
    else:
        asyncio.run(main())