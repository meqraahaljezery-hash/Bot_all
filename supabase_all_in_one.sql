-- ==============================================================================
-- مقرأة الإمام الجزري للإقراء والإجازة بالسند
-- ملف SQL الشامل والموحد للتشغيل المباشر في Supabase SQL Editor
-- الحسابات البنكية المعتمدة باسم: Kalid Ahmed Mustefa
-- ==============================================================================

-- 0. تفعيل ملحق UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول المستخدمين (الهوية المركزية المرتبطة بـ Telegram ID)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'ar',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    freeze_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. جدول الصلاحيات التفصيلية
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    name_ar VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. جدول ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. جدول إسناد الأدوار للمستخدمين
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 6. جدول الملفات الشخصية للطلاب
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    age INT,
    gender VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    current_quran_level VARCHAR(100),
    memorized_amount VARCHAR(100),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. جدول البرامج التعليمية
CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(100) PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_am VARCHAR(255) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_am TEXT NOT NULL,
    objectives TEXT,
    requirements TEXT,
    target_audience TEXT,
    default_minutes_required INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. جدول طلبات التسجيل والالتحاق
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id VARCHAR(100) NOT NULL REFERENCES programs(id),
    shift VARCHAR(20) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    riwayah VARCHAR(100),
    suitable_times TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    modification_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);

-- 9. جدول المعلمين والمقرئين
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ijazah_details TEXT,
    bio TEXT,
    max_students INT DEFAULT 30,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. جدول الحلقات والمجموعات القرآنية
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    program_id VARCHAR(100) NOT NULL REFERENCES programs(id),
    teacher_id UUID REFERENCES teachers(id),
    gender VARCHAR(10) NOT NULL,
    shift VARCHAR(20) NOT NULL,
    country_filter VARCHAR(100),
    max_members INT NOT NULL DEFAULT 20,
    current_members_count INT NOT NULL DEFAULT 0,
    telegram_chat_id BIGINT,
    telegram_invite_link VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. جدول أعضاء المجموعات (الطلاب المقيدين بالحلقات)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- 12. جدول باقات الدقائق والأسعار الرسمية
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(50) PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    minutes INT NOT NULL CHECK (minutes > 0),
    price_etb NUMERIC(10, 2) NOT NULL CHECK (price_etb > 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. جدول طرق وحسابات الدفع اليدوي
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(50) PRIMARY KEY,
    title_ar VARCHAR(100) NOT NULL,
    title_en VARCHAR(100) NOT NULL,
    title_am VARCHAR(100) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL DEFAULT '',
    account_number VARCHAR(100) NOT NULL DEFAULT '',
    instructions_ar TEXT NOT NULL DEFAULT '',
    instructions_en TEXT NOT NULL DEFAULT '',
    instructions_am TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. جدول طلبات الدفع والتحويلات البنكية
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id VARCHAR(50) NOT NULL REFERENCES packages(id),
    payment_method_id VARCHAR(50) NOT NULL REFERENCES payment_methods(id),
    minutes INT NOT NULL,
    amount_etb NUMERIC(10, 2) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    transfer_date DATE NOT NULL,
    receipt_image_url TEXT,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_txref ON payment_requests(transaction_ref);

-- 15. جدول أرصدة الطلاب من الدقائق
CREATE TABLE IF NOT EXISTS balances (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_minutes INT NOT NULL DEFAULT 0 CHECK (current_minutes >= 0),
    total_purchased_minutes INT NOT NULL DEFAULT 0,
    total_consumed_minutes INT NOT NULL DEFAULT 0,
    total_bonus_minutes INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. جدول الدفتر المالي الذري وسجل الحركات غير القابل للتعديل
CREATE TABLE IF NOT EXISTS balance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL,
    minutes_change INT NOT NULL,
    balance_before INT NOT NULL,
    balance_after INT NOT NULL,
    reason TEXT NOT NULL,
    related_payment_id UUID REFERENCES payment_requests(id),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_balance_tx_user ON balance_transactions(user_id);

-- 17. جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    title_am VARCHAR(255),
    message_ar TEXT NOT NULL,
    message_en TEXT,
    message_am TEXT,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    telegram_message_id BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 18. جدول الإعلانات والرسائل الجماعية
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT,
    content_am TEXT,
    target_role VARCHAR(50),
    target_program_id VARCHAR(100) REFERENCES programs(id),
    target_group_id UUID REFERENCES groups(id),
    sent_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. جدول تذاكر ومحادثات الدعم الفني
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. جدول سجل التدقيق والرقابة الأمنية
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 21. جدول إعدادات المقرأة وبيانات الاتصال
CREATE TABLE IF NOT EXISTS bot_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- إدراج البيانات الأولية (Seed Data)
-- ==============================================================================

-- 1. الأدوار
INSERT INTO roles (id, name_ar, name_en, name_am, description)
VALUES 
    ('super_admin', 'المدير العام', 'Super Admin', 'ዋና አስተዳዳሪ', 'صلاحيات كاملة لإدارة المقرأة'),
    ('admin', 'مدير النظام', 'System Admin', 'የስርዓት አስተዳዳሪ', 'إدارة العمليات الإدارية والفنية'),
    ('supervisor', 'مشرف تعليمي', 'Educational Supervisor', 'የትምህርት ተቆጣጣሪ', 'متابعة المعلمين والطلاب'),
    ('teacher', 'معلم مقرأة', 'Quran Teacher', 'የቁርአን አስተማሪ', 'إدارة الحلقات والطلاب المسندين'),
    ('student', 'طالب علم', 'Student', 'ተማሪ', 'الالتحاق بالبرامج ومتابعة الرصيد')
ON CONFLICT (id) DO NOTHING;

-- 2. الصلاحيات
INSERT INTO permissions (id, name_ar, name_en, category)
VALUES
    ('manage_users', 'إدارة المستخدمين والملفات الشخصية', 'Manage Users & Profiles', 'users'),
    ('review_registrations', 'مراجعة طلبات التسجيل وقبولها أو رفضها', 'Review Registrations', 'registrations'),
    ('review_payments', 'مراجعة طلبات الدفع واعتمادها', 'Review & Approve Payments', 'finance'),
    ('manage_balance', 'تعديل أرصدة الدقائق ومنح المكافآت', 'Manage Balances', 'finance'),
    ('manage_groups', 'إنشاء وإدارة المجموعات وتعيين المعلمين', 'Manage Groups', 'academic'),
    ('manage_programs', 'إضافة وتعديل البرامج التعليمية', 'Manage Educational Programs', 'academic'),
    ('manage_packages', 'تعديل الباقات وأسعار الدقائق', 'Manage Packages & Pricing', 'finance'),
    ('manage_payment_methods', 'تهيئة وتفعيل الحسابات البنكية', 'Manage Payment Methods', 'finance'),
    ('send_announcements', 'إرسال الإعلانات والرسائل الجماعية', 'Send Announcements', 'communication'),
    ('manage_support', 'الرد على تذاكر الدعم الفني', 'Manage Support Tickets', 'support'),
    ('view_audit_logs', 'الاطلاع على سجل التدقيق الأمني', 'View Security Audit Logs', 'security'),
    ('manage_settings', 'إدارة الإعدادات العامة للمقرأة', 'Manage General Settings', 'system')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
VALUES 
    ('supervisor', 'review_registrations'),
    ('supervisor', 'manage_groups'),
    ('supervisor', 'manage_support'),
    ('supervisor', 'send_announcements')
ON CONFLICT DO NOTHING;

-- 3. البرامج التعليمية الأساسية
INSERT INTO programs (id, name_ar, name_en, name_am, description_ar, description_en, description_am, objectives, requirements, target_audience, is_active, display_order)
VALUES 
    (
        'recitation-correction',
        'التلقين وتصحيح الأداء',
        'Recitation & Articulation Correction',
        'የአነባበብ እና የተጅዊድ ማስተካከያ',
        'برنامج متخصص لتصحيح التلاوة ومخارج الحروف وضبط أحكام التجويد العملية برواية حفص عن عاصم.',
        'A specialized program for correcting recitation, letter articulation points, and practical Tajweed rules.',
        'የቁርአን አነባበብን፣ የፊደላት መውጫዎችን እና የተጅዊድ ህጎችን በተግባር ለማስተካከል የተዘጋጀ ፕሮግራም።',
        'إتقان مخارج الحروف، وضبط أحكام التلاوة والتجويد، وتصحيح اللحن الجلي والخفي.',
        'القدرة على القراءة من المصحف الشريف.',
        'المبتدئون والراغبون في تحسين تلاوتهم من جميع الأعمار.',
        TRUE,
        1
    ),
    (
        'intensive-memorization',
        'الحفظ المكثف',
        'Intensive Quran Memorization',
        'ከፍተኛ የቁርአን ሂፍዝ (ማስታወስ)',
        'خطة محكمة لحفظ القرآن الكريم كاملاً مع المراجعة المستمرة والتثبيت تحت إشراف نخبة من الحفاظ المتقنين.',
        'A structured curriculum for full Quran memorization with rigorous revision and consolidation.',
        'ሙሉውን ቁርአን በጥሩ ክለሳ እና ክትትል በታላላቅ አስተማሪዎች ቁጥጥር ስር የማስታወስ ፕሮግራም።',
        'حفظ أجزاء من القرآن الكريم أو المصحف كاملاً بإتقان مع ضبط المتشابهات.',
        'إتقان القراءة مع معرفة أحكام التجويد الأساسية والالتزام بالجدول اليومي.',
        'الطلاب المتفرغون والجادون في إتمام حفظ كتاب الله تعالى.',
        TRUE,
        2
    ),
    (
        'ijazah-hafs',
        'الإجازة برواية حفص عن عاصم',
        'Ijazah in Hafs an Asim',
        'በሀፍስ አን አስም የኢጃዛ ፕሮግራም',
        'ختمة كاملة غيباً بالإتقان والتدقيق للحصول على السند المتصل إلى رسول الله ﷺ برواية حفص عن عاصم من طريق الشاطبية.',
        'Full Quran recitation from memory with precision to obtain a connected chain of transmission (Sanad) to the Prophet ﷺ in Hafs from Asim.',
        'የተገናኘ ሰነድ ወደ ነብዩ ﷺ ለማግኘት ሙሉውን ቁርአን በቃላቸው በማንበብ የሚሰጥ የኢጃዛ ፕሮግራም።',
        'نيل السند المتصل وضبط الأداء القرآني بأعلى درجات الإتقان والدقة.',
        'حفظ القرآن الكريم كاملاً مع دراسة منظومة الجزرية أو تحفة الأطفال واجتياز اختبار القبول.',
        'الحفاظ المتقنون الراغبون في نيل السند والإجازة القرآنية.',
        TRUE,
        3
    ),
    (
        'ijazah-seven-qiraat',
        'الإجازة بالقراءات السبع',
        'Ijazah in the Seven Qiraat',
        'በሰባቱ ቂራአቶች የኢጃዛ ፕሮግራም',
        'دراسة وإقراء بالقراءات السبع المتواترة من طريق الشاطبية جمعاً أو إفراداً ونيل الإجازة بالسند المتصل.',
        'Comprehensive study and recitation of the seven Mutawatir Qiraat via Shatibiyyah to earn Sanad and Ijazah.',
        'በሰባቱ ቂራአቶች የተገናኘ ሰነድ ለማግኘት የሚሰጥ ከፍተኛ ፕሮግራም።',
        'التمكن من أصول وفرش القراءات السبع وتخريج مقرئين مجازين.',
        'الحصول مسبقاً على إجازة متقنة برواية حفص أو ورش، وحفظ الشاطبية.',
        'القراء الحاصلون على إجازة سابقة والمؤهلون لجمع القراءات.',
        TRUE,
        4
    )
ON CONFLICT (id) DO UPDATE SET 
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am;

-- 4. باقات الدقائق بالأسعار المعتمدة بالـ ETB
INSERT INTO packages (id, name_ar, name_en, name_am, minutes, price_etb, description, display_order)
VALUES
    ('pkg-100', 'باقة 100 دقيقة', '100 Minutes Package', 'የ 100 ደቂቃ ፓኬጅ', 100, 500.00, 'باقة أساسية مناسبة للحصص التجريبية والمراجعة السريعة', 1),
    ('pkg-200', 'باقة 200 دقيقة', '200 Minutes Package', 'የ 200 ደቂቃ ፓኬጅ', 200, 1000.00, 'باقة منتظمة مناسبة لحصص تصحيح التلاوة الأسبوعية', 2),
    ('pkg-300', 'باقة 300 دقيقة', '300 Minutes Package', 'የ 300 ደቂቃ ፓኬጅ', 300, 1470.00, 'باقة مميزة مع خصم تشجيعي لطلاب المقرأة', 3),
    ('pkg-400', 'باقة 400 دقيقة', '400 Minutes Package', 'የ 400 ደቂቃ ፓኬጅ', 400, 1920.00, 'باقة مكثفة لطلاب الحفظ المنتظمين', 4),
    ('pkg-500', 'باقة 500 دقيقة', '500 Minutes Package', 'የ 500 ደቂቃ ፓኬጅ', 500, 2350.00, 'باقة متقدمة تناسب برامج الإجازة بالسند', 5),
    ('pkg-600', 'باقة 600 دقيقة', '600 Minutes Package', 'የ 600 ደቂቃ ፓኬጅ', 600, 2760.00, 'باقة ذهبية موفرة للبرامج المكثفة', 6),
    ('pkg-1000', 'باقة 1000 دقيقة', '1000 Minutes Package', 'የ 1000 ደቂቃ ፓኬጅ', 1000, 4500.00, 'الباقة الشاملة الكبرى بأفضل سعر للدقيقة لطلاب الختمات', 7)
ON CONFLICT (id) DO UPDATE SET 
    price_etb = EXCLUDED.price_etb,
    minutes = EXCLUDED.minutes;

-- 5. طرق الدفع الرسمية المعتمدة باسم: Kalid Ahmed Mustefa
INSERT INTO payment_methods (id, title_ar, title_en, title_am, beneficiary_name, account_number, instructions_ar, instructions_en, instructions_am, is_active, display_order)
VALUES
    (
        'cbe',
        'البنك التجاري الإثيوبي (CBE)',
        'Commercial Bank of Ethiopia (CBE)',
        'የኢትዮጵያ ንግድ ባንክ (CBE)',
        'Kalid Ahmed Mustefa',
        '1000285374425',
        'يرجى التحويل إلى حساب CBE الموضح أعلاه عبر تطبيق CBE Birr أو التحويل المباشر مع إرفاق صورة الإشعار والرقم المرجعي.',
        'Please transfer to the above account via CBE Birr or bank transfer, and upload the transfer receipt with transaction reference.',
        'እባክዎ ከላይ በተጠቀሰው የሂሳብ ቁጥር በCBE Birr ወይም ቀጥታ ያስተላልፉ እና ደረሰኙን ያያይዙ።',
        TRUE,
        1
    ),
    (
        'boa',
        'بنك الحبشة (Bank of Abyssinia)',
        'Bank of Abyssinia (BOA)',
        'አቢሲንያ ባንክ (BOA)',
        'Kalid Ahmed Mustefa',
        '226626646',
        'يرجى التحويل إلى حساب بنك الحبشة الموضح وتزويدنا برقم العملية وإشعار الدفع.',
        'Transfer via Bank of Abyssinia and provide transaction reference with receipt.',
        'በአቢሲንያ ባንክ በኩል ያስተላልፉ እና የግብይት ማጣቀሻውን ከደረሰኝ ጋር ያቅርቡ።',
        TRUE,
        2
    ),
    (
        'telebirr',
        'تيليبير (Telebirr)',
        'Telebirr',
        'ቴሌብር (Telebirr)',
        'Kalid Ahmed Mustefa',
        '099161372',
        'يرجى التحويل عبر تطبيق Telebirr إلى الرقم الموضح وإدخال رقم هاتف المرسل والمعرف المرجعي للعملية.',
        'Transfer via Telebirr app to the specified number and input sender phone and transaction ID.',
        'በቴሌብር መተግበሪያ ወደተገለጸው ቁጥር ያስተላልፉ እና የላኪውን ስልክ ቁጥር ያስገቡ።',
        TRUE,
        3
    ),
    (
        'mpesa',
        'إم-بيسا (M-Pesa Safaricom)',
        'M-Pesa Safaricom',
        'ኤም-ፔሳ (M-Pesa)',
        'Kalid Ahmed Mustefa',
        '0721009122',
        'يرجى إرسال المبلغ عبر Safaricom M-Pesa وإرفاق رسالة التأكيد أو لقطة الشاشة ورقم المرجع.',
        'Send via Safaricom M-Pesa and provide confirmation SMS / screenshot and transaction ref.',
        'በSafaricom M-Pesa በኩል ይላኩ እና የማረጋገጫ መልእክት ወይም ቅጽበታዊ ገጽ እይታ ያያይዙ።',
        TRUE,
        4
    )
ON CONFLICT (id) DO UPDATE SET
    beneficiary_name = EXCLUDED.beneficiary_name,
    account_number = EXCLUDED.account_number,
    is_active = EXCLUDED.is_active;

-- 6. الإعدادات الرسمية للمقرأة
INSERT INTO bot_settings (key, value, description)
VALUES
    ('center_name_ar', 'مقرأة الإمام الجزري للإقراء والإجازة بالسند', 'الاسم الرسمي للمقرأة بالعربية'),
    ('center_name_en', 'Imam Al-Jazari Quran Recitation & Ijazah Center', 'Official name in English'),
    ('center_name_am', 'የኢማም አል-ጀዘሪ የቁርአን ንባብ እና የኢጃዛ ማዕከል', 'Official name in Amharic'),
    ('contact_phone', '0990161372', 'رقم الهاتف الرسمي للتواصل والدعم'),
    ('contact_email', 'kalidahd7@gmil.com', 'البريد الإلكتروني الرسمي للتواصل والدعم'),
    ('super_admin_email', 'khdahd241@gmail.com', 'البريد الإلكتروني لحساب المدير العام الأساسي'),
    ('default_language', 'ar', 'اللغة الافتراضية للبوت')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==============================================================================
-- سياسات الأمان على مستوى الصفوف (Row Level Security - RLS)
-- ==============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_id IN ('super_admin', 'admin', 'supervisor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إسقاط وإعادة إنشاء السياسات بأمان لمنع أي تضارب
DROP POLICY IF EXISTS "Users can view their own record" ON users;
CREATE POLICY "Users can view their own record" ON users FOR SELECT USING (auth.uid() = id OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Students can view own registration" ON registrations;
CREATE POLICY "Students can view own registration" ON registrations FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Students can insert own registration" ON registrations;
CREATE POLICY "Students can insert own registration" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can view own balance" ON balances;
CREATE POLICY "Students can view own balance" ON balances FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Students can view own transactions" ON balance_transactions;
CREATE POLICY "Students can view own transactions" ON balance_transactions FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Students can view own payment requests" ON payment_requests;
CREATE POLICY "Students can view own payment requests" ON payment_requests FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Students can submit payment request" ON payment_requests;
CREATE POLICY "Students can submit payment request" ON payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students view only assigned groups" ON groups;
CREATE POLICY "Students view only assigned groups" ON groups FOR SELECT USING (
    is_admin_or_supervisor() OR
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM teachers t WHERE t.id = groups.teacher_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
CREATE POLICY "Users view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());
