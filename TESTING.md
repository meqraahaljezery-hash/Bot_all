# سجل وتقارير اختبارات الجودة (Quality Assurance & Test Suite)
## مقرأة الإمام الجزري للإقراء والإجازة بالسند

تم تنفيذ 26 اختباراً شاملاً بنجاح 100% لتغطية جميع المتطلبات الواردة في البند الخامس والعشرين:

### جدول نتائج الاختبارات المنفذة فعلياً:

| # | اسم الاختبار | النتيجة | الوصف |
|---|--------------|---------|-------|
| 1 | `test_01_bot_start_welcome_messages` | ✅ نجح | اختبار بدء البوت وعرض الترحيب في اللغات الثلاث |
| 2 | `test_02_register_new_user` | ✅ نجح | تسجيل مستخدم جديد وربطه برقم تيليجرام ودور طالب |
| 3 | `test_03_language_selection` | ✅ نجح | تبديل وتخزين لغة المستخدم (عربية، إنجليزية، أمهرية) |
| 4 | `test_04_display_programs` | ✅ نجح | استرجاع البرامج الأربعة التعليمية بتفاصيلها |
| 5 | `test_05_submit_registration` | ✅ نجح | تقديم طلب التسجيل بحالة معلقة `pending` |
| 6 | `test_06_edit_registration_before_decision` | ✅ نجح | تعديل بيانات الطلب قبل صدور قرار المشرف |
| 7 | `test_07_approve_and_reject_registration` | ✅ نجح | اعتماد الطلب، والرفض مع اشتراط سبب الرفض |
| 8 | `test_08_create_group_and_assign_student` | ✅ نجح | إنشاء حلقة تعليمية وإسناد طالب وزيادة العداد |
| 9 | `test_09_group_privacy_student_isolation` | ✅ نجح | عزل الحلقات: الطالب لا يرى إلا حلقته المعينة |
| 10 | `test_10_display_packages` | ✅ نجح | استرجاع باقات الدقائق والأسعار الدقيقة بالـ ETB |
| 11 | `test_11_submit_payment_request` | ✅ نجح | عدم إضافة الرصيد مسبقاً عند مجرد تقديم الطلب |
| 12 | `test_12_approve_payment_atomic` | ✅ نجح | اعتماد الدفع الذري وإضافة الدقائق بنجاح |
| 13 | `test_13_reject_payment_with_reason` | ✅ نجح | رفض الدفع وتوثيق السبب وبقاء الرصيد دون تغيير |
| 14 | `test_14_prevent_duplicate_payment_approval` | ✅ نجح | منع اعتماد العملية مرتين عبر `idempotency_key` |
| 15 | `test_15_balance_accuracy_verification` | ✅ نجح | صحة تراكم الأرصدة وسجل المشتريات |
| 16 | `test_16_balance_addition_and_deduction` | ✅ نجح | إضافة رصيد مكافأة وخصم دقائق ومنع الرصيد السالب |
| 17 | `test_17_super_admin_permissions` | ✅ نجح | صلاحيات المدير العام (`khdahd241@gmail.com`) الكاملة |
| 18 | `test_18_supervisor_permissions` | ✅ نجح | صلاحيات المشرف الدقيقة ومنعه من العمليات المالية |
| 19 | `test_19_teacher_permissions` | ✅ نجح | صلاحيات المعلم وحصر وصوله لطلابه وحلقاته |
| 20 | `test_20_student_access_denied_to_admin` | ✅ نجح | منع الطلاب العاديين من أقسام الإدارة نهائياً |
| 21 | `test_21_notification_delivery` | ✅ نجح | تسجيل إشعارات القرارات الإدارية وحالة القراءة |
| 22 | `test_22_broadcast_announcements` | ✅ نجح | البث الإعلاني وحصر عدد الرسائل المرسلة والفاشلة |
| 23 | `test_23_telegram_group_link_security` | ✅ نجح | حماية رابط تيليجرام وحجبه عن غير المنتمين للحلقة |
| 24 | `test_24_error_handling` | ✅ نجح | مرونة النظام ومعالجة الأخطاء والمفاتيح المفقودة |
| 25 | `test_25_three_languages_coverage` | ✅ نجح | تكافؤ مفاتيح الترجمة بين اللغات الثلاث |
| 26 | `test_26_no_secrets_in_code_or_env_example` | ✅ نجح | التحقق من عدم تسرب المفاتيح السرية في الأكواد |

```bash
# سجل تشغيل الاختبارات الأخير:
Ran 26 tests in 0.021s
OK
```
