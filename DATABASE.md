# توثيق قاعدة البيانات (Database Architecture & Dictionary)
## مقرأة الإمام الجزري للإقراء والإجازة بالسند

تعتمد المقرأة على قاعدة بيانات علائقية متينة (PostgreSQL / Supabase) تتكون من الجداول التالية:

---

### جدول الكيانات الرئيسية (Core Entities)

| اسم الجدول | الوصف | المفتاح الأساسي | العلاقات والفهارس |
|------------|-------|-----------------|-------------------|
| `users` | سجل الهوية المركزية المرتبط بـ Telegram ID | `id` (UUID) | `telegram_id` UNIQUE, `phone`, `email` |
| `roles` | أدوار النظام (super_admin, admin, supervisor, teacher, student) | `id` (VARCHAR) | - |
| `permissions` | الصلاحيات التفصيلية للنظام | `id` (VARCHAR) | تصنيفات الصلاحيات |
| `role_permissions` | ربط الصلاحيات بالأدوار | `(role_id, permission_id)` | مرجع للأدوار والصلاحيات |
| `user_roles` | إسناد الأدوار للمستخدمين | `(user_id, role_id)` | يدعم الجمع بين الأدوار (مدير عام + معلم) |
| `user_profiles` | التفاصيل الشخصية والأكاديمية للطالب | `user_id` (UUID) | مربوط بـ `users.id` |
| `programs` | البرامج التعليمية (تلقين، حفظ، إجازة حفص، إجازة سبع) | `id` (VARCHAR) | ديناميكي، متعدد اللغات |
| `registrations` | طلبات التسجيل والالتحاق ومراحلها | `id` (UUID) | مربوط بـ `users.id`, `programs.id`, حالة `status` |
| `teachers` | بيانات المعلمين والمقرئين المجازين | `id` (UUID) | مربوط بـ `users.id` |
| `groups` | الحلقات القرآنية ومواعيدها | `id` (UUID) | مربوط بالبرنامج والمعلم والجنس والفترة |
| `group_members` | تسجيل الطلاب في الحلقات | `id` (UUID) | `UNIQUE(group_id, student_id)` |
| `packages` | باقات الدقائق والأسعار الرسمية | `id` (VARCHAR) | 100 إلى 1000 دقيقة بأسعار ETB |
| `payment_methods` | طرق الدفع (CBE, BOA, Telebirr, M-Pesa) | `id` (VARCHAR) | غير مفعّلة افتراضياً حتى يضبطها المدير |
| `payment_requests` | طلبات الشحن والتحويلات البنكية | `id` (UUID) | `idempotency_key` UNIQUE لمنع التكرار |
| `balances` | رصيد الدقائق الفعلي لكل طالب | `user_id` (UUID) | لا يسمح بأي تعديل مباشر من المستخدم |
| `balance_transactions` | دفتر الحسابات المالي غير القابل للتعديل | `id` (UUID) | يسجل الرصيد قبل وبعد كل عملية |
| `notifications` | إشعارات البوت والقرارات الإدارية | `id` (UUID) | حالة القراءة والإرسال عبر تيليجرام |
| `announcements` | الرسائل والإعلانات الجماعية | `id` (UUID) | استهداف حسب البرنامج أو الحلقة |
| `support_tickets` | تذاكر الدعم الفني والاستفسارات | `id` (UUID) | رقم تذكرة تسلسلي `ticket_number` |
| `support_messages` | محادثات ورسائل الدعم الفني | `id` (UUID) | مربوط برقم التذكرة |
| `audit_logs` | سجل التدقيق والرقابة الأمنية | `id` (UUID) | يسجل كل عمليات الإدارة والمالية |
| `bot_settings` | إعدادات المقرأة وبيانات الاتصال | `key` (VARCHAR) | الهاتف والبريد الرسمي |

---

### ملفات التشغيل:
- المخطط الشامل: `bot/database/schema.sql`
- البيانات الأولية والباقات: `bot/database/seed.sql`
- سياسات الأمان RLS: `bot/database/rls_policies.sql`
