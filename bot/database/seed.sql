-- ==============================================================================
-- مقرأة الإمام الجزري للإقراء والإجازة بالسند
-- Seed Data - Default Roles, Programs, Packages, and Unconfigured Payment Methods
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (id, name_ar, name_en, name_am, description)
VALUES 
    ('super_admin', 'المدير العام', 'Super Admin', 'ዋና አስተዳዳሪ', 'صلاحيات كاملة وغير مقيدة لإدارة المقرأة'),
    ('admin', 'مدير النظام', 'System Admin', 'የስርዓት አስተዳዳሪ', 'إدارة العمليات الإدارية والفنية'),
    ('supervisor', 'مشرف تعليمي', 'Educational Supervisor', 'የትምህርት ተቆጣጣሪ', 'متابعة المعلمين والطلاب وتنسيق الحلقات'),
    ('teacher', 'معلم مقرأة', 'Quran Teacher', 'የቁርአን አስተማሪ', 'إدارة الحلقات والطلاب المسندين وتسجيل التسميع'),
    ('student', 'طالب علم', 'Student', 'ተማሪ', 'الالتحاق بالبرامج وحضور الحلقات ومتابعة الرصيد')
ON CONFLICT (id) DO NOTHING;

-- 2. Permissions
INSERT INTO permissions (id, name_ar, name_en, category)
VALUES
    ('manage_users', 'إدارة المستخدمين والملفات الشخصية', 'Manage Users & Profiles', 'users'),
    ('review_registrations', 'مراجعة طلبات التسجيل وقبولها أو رفضها', 'Review Registrations', 'registrations'),
    ('review_payments', 'مراجعة طلبات الدفع واعتمادها', 'Review & Approve Payments', 'finance'),
    ('manage_balance', 'تعديل أرصدة الدقائق ومنح المكافآت', 'Manage Balances', 'finance'),
    ('manage_groups', 'إنشاء وإدارة المجموعات وتعيين المعلمين', 'Manage Groups', 'academic'),
    ('manage_programs', 'إضافة وتعديل البرامج التعليمية', 'Manage Educational Programs', 'academic'),
    ('manage_packages', 'تعديل الباقات وأسعار الدقائق', 'Manage Packages & Pricing', 'finance'),
    ('manage_payment_methods', 'تهيئة وتفعيل الحسابات البنكية وطرق الدفع', 'Manage Payment Methods', 'finance'),
    ('send_announcements', 'إرسال الإعلانات والرسائل الجماعية', 'Send Announcements', 'communication'),
    ('manage_support', 'الرد على تذاكر الدعم الفني', 'Manage Support Tickets', 'support'),
    ('view_audit_logs', 'الاطلاع على سجل التدقيق الأمني', 'View Security Audit Logs', 'security'),
    ('manage_settings', 'إدارة الإعدادات العامة للمقرأة', 'Manage General Settings', 'system')
ON CONFLICT (id) DO NOTHING;

-- Assign permissions to roles
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

-- 3. Educational Programs
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
        'الإجازة برواية حفص',
        'Ijazah in Hafs an Asim',
        'በሀፍስ አን አስም የኢጃዛ ፕሮግራም',
        'ختمة كاملة غيباً بالإتقان والتدقيق للحصول على السند المتصل إلى رسول الله ﷺ برواية حفص عن عاصم من طريق الشاطبية.',
        'Full Quran recitation from memory with precision to obtain a connected chain of transmission (Sanad) to the Prophet ﷺ in Hafs from Asim via Shatibiyyah.',
        'የተገናኘ ሰነድ (ሰነድ ሙተሲል) ወደ ነብዩ ﷺ ለማግኘት ሙሉውን ቁርአን በቃላቸው በማንበብ የሚሰጥ የኢጃዛ ፕሮግራም።',
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
        'በሰባቱ ቂራአቶች (የአነባበብ መንገዶች) የተገናኘ ሰነድ ለማግኘት የሚሰጥ ከፍተኛ ፕሮግራም።',
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

-- 4. Packages & Minutes Pricing (Exact requirements)
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

-- 5. Payment Methods (CBE, BOA, Telebirr, M-Pesa with official accounts)
INSERT INTO payment_methods (id, title_ar, title_en, title_am, beneficiary_name, account_number, instructions_ar, instructions_en, instructions_am, is_active, display_order)
VALUES
    (
        'cbe',
        'البنك التجاري الإثيوبي (CBE)',
        'Commercial Bank of Ethiopia (CBE)',
        'የኢትዮጵያ ንግድ ባንክ (CBE)',
        'Kalid Ahmed Mustefa',
        '1000285374425',
        'يرجى التحويل إلى حساب CBE الموضح أعلاه عبر تطبيق CBE Birr أو التحويل المباشر، وتصوير إشعار التحويل وإرفاقه مع رقم المرجع.',
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
        'يرجى التحويل إلى حساب المقرأة عبر بنك الحبشة وتزويدنا برقم العملية وإشعار الدفع.',
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
        'إم-بيسا (M-Pesa)',
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

-- 6. Bot Settings (Official information)
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
