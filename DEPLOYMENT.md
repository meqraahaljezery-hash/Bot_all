# دليل النشر والتشغيل على الإنتاج (Production Deployment Guide)
## مقرأة الإمام الجزري للإقراء والإجازة بالسند

### 1. المتطلبات الأساسية للنشر
- خادم افتراضي خاص (VPS) بمعالج Dual-Core، ذاكرة 2GB RAM، ونظام Ubuntu 22.04 أو 24.04 LTS.
- Docker و Docker Compose مثبتين.
- نطاق (Domain Name) موجه للخادم مع شهادة SSL صالحة (Let's Encrypt).
- رمز البوت من BotFather (`BOT_TOKEN`).
- قاعدة بيانات Supabase أو PostgreSQL 16.

---

### 2. خطوات النشر عبر Docker Compose

```bash
# 1. استنساخ المستودع
git clone https://github.com/your-username/maqraah-imam-al-jazari-telegram-bot.git
cd maqraah-imam-al-jazari-telegram-bot

# 2. إنشاء ملف الإعدادات الحقيقي
cp .env.example .env
nano .env  # أدخل القيم الحقيقية لـ BOT_TOKEN و SUPER_ADMIN_TELEGRAM_ID

# 3. بناء الحاويات وتشغيلها بالخلفية
docker compose up -d --build

# 4. التحقق من حالة الحاويات
docker compose ps
docker compose logs -f bot
```

---

### 3. إعداد Webhook في الإنتاج مع Nginx

عند استخدام Webhook، قم بضبط إعدادات Nginx العكسي (Reverse Proxy):

```nginx
server {
    server_name bot.jazari-quran.com;

    location /api/telegram/webhook {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Telegram-Bot-Api-Secret-Token $http_x_telegram_bot_api_secret_token;
    }
}
```

ثم قم بتعيين المتغيرات في `.env`:
```env
BOT_MODE="webhook"
WEBHOOK_URL="https://bot.jazari-quran.com/api/telegram/webhook"
WEBHOOK_SECRET="a-very-strong-random-token-here"
```

وأعد تشغيل الحاوية:
```bash
docker compose restart bot
```
