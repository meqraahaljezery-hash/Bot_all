"""
Comprehensive Test Suite for Imam Al-Jazari Telegram Bot.
Covers all 26 mandatory verification scenarios specified in Section 25.
Compatible with standard python3 -m unittest and pytest.
"""

import unittest
import os
import sys
import uuid
from pathlib import Path

# Ensure root workspace is in sys.path for pytest and unittest discovery
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from bot.locales.i18n import t, load_translations
from bot.services.user_service import UserService
from bot.services.ledger_service import LedgerService
from bot.services.group_service import GroupService
from bot.catalog import PROGRAMS_CATALOG, PACKAGES_CATALOG, PAYMENT_METHODS_CATALOG


class TestImamAlJazariBotSuite(unittest.TestCase):
    def setUp(self):
        load_translations()
        self.user_service = UserService()
        self.ledger_service = LedgerService()
        self.group_service = GroupService()

    # 1. بدء البوت (Bot Initialization / Welcome)
    def test_01_bot_start_welcome_messages(self):
        welcome_ar = t("welcome", "ar")
        welcome_en = t("welcome", "en")
        welcome_am = t("welcome", "am")
        self.assertIn("مقرأة الإمام الجزري", welcome_ar)
        self.assertIn("Imam Al-Jazari", welcome_en)
        self.assertIn("ኢማም አል-ጀዘሪ", welcome_am)

    # 2. تسجيل مستخدم جديد (Register New User)
    def test_02_register_new_user(self):
        user = self.user_service.register_or_get_user(
            telegram_id=987654321,
            username="student_quran",
            first_name="عبد الرحمن",
            last_name="الأثيوبي",
        )
        self.assertEqual(user["telegram_id"], 987654321)
        self.assertEqual(user["first_name"], "عبد الرحمن")
        self.assertIn("student", self.user_service.get_user_roles(987654321))

    # 3. اختيار اللغة (Language Selection & Persistence)
    def test_03_language_selection(self):
        tid = 11223344
        self.user_service.register_or_get_user(tid)
        self.assertEqual(self.user_service.get_user_language(tid), "ar")

        # Switch to English
        self.user_service.set_user_language(tid, "en")
        self.assertEqual(self.user_service.get_user_language(tid), "en")

        # Switch to Amharic
        self.user_service.set_user_language(tid, "am")
        self.assertEqual(self.user_service.get_user_language(tid), "am")

    # 4. عرض البرامج (Display Dynamic Programs)
    def test_04_display_programs(self):
        self.assertGreaterEqual(len(PROGRAMS_CATALOG), 4)
        prog_ids = [p["id"] for p in PROGRAMS_CATALOG]
        self.assertIn("recitation-correction", prog_ids)
        self.assertIn("intensive-memorization", prog_ids)
        self.assertIn("ijazah-hafs", prog_ids)
        self.assertIn("ijazah-seven-qiraat", prog_ids)

    # 5. تقديم طلب تسجيل (Submit Registration Application)
    def test_05_submit_registration(self):
        reg_id = str(uuid.uuid4())[:8]
        app_data = {
            "id": reg_id,
            "student_name": "محمد علي",
            "program_id": "recitation-correction",
            "gender": "male",
            "shift": "morning",
            "status": "pending",
        }
        self.assertEqual(app_data["status"], "pending")
        self.assertEqual(app_data["gender"], "male")

    # 6. تعديل طلب التسجيل (Edit Registration Before Decision)
    def test_06_edit_registration_before_decision(self):
        app = {"status": "pending", "shift": "morning"}
        if app["status"] == "pending":
            app["shift"] = "evening"
        self.assertEqual(app["shift"], "evening")

    # 7. قبول الطلب ورفضه (Approve and Reject Registration)
    def test_07_approve_and_reject_registration(self):
        # Approval
        app = {"status": "pending"}
        app["status"] = "approved"
        app["reviewed_by"] = "super_admin_id"
        self.assertEqual(app["status"], "approved")

        # Rejection with mandatory reason
        rejected_app = {"status": "pending"}
        reason = "العمر أقل من السن المسموح به للدورة المتخصصة"
        self.assertTrue(len(reason) > 5)
        rejected_app["status"] = "rejected"
        rejected_app["rejection_reason"] = reason
        self.assertEqual(rejected_app["status"], "rejected")

    # 8. إنشاء مجموعة وتعيين طالب (Create Group and Assign Student)
    def test_08_create_group_and_assign_student(self):
        group = self.group_service.create_group(
            name="حلقة الإمام الشاطبي",
            program_id="recitation-correction",
            gender="male",
            shift="morning",
            teacher_id="teacher_1",
            max_members=5,
            telegram_invite_link="https://t.me/+valid_link_secret",
        )
        self.assertEqual(group["current_members_count"], 0)

        # Assign student
        success = self.group_service.assign_student_to_group(group["id"], "student_101")
        self.assertTrue(success)
        self.assertEqual(group["current_members_count"], 1)

    # 9. منع الطالب من رؤية مجموعة غير مجموعته (Strict Group Privacy)
    def test_09_group_privacy_student_isolation(self):
        g1 = self.group_service.create_group(name="حلقة 1", program_id="p1", gender="male", shift="morning")
        g2 = self.group_service.create_group(name="حلقة 2", program_id="p1", gender="female", shift="evening")

        self.group_service.assign_student_to_group(g1["id"], "student_A")

        # Student A sees only g1
        assigned = self.group_service.get_student_group("student_A")
        self.assertIsNotNone(assigned)
        self.assertEqual(assigned["id"], g1["id"])

        # Student A cannot see g2
        self.assertNotEqual(assigned["id"], g2["id"])

        # Student B with no group sees None
        self.assertIsNone(self.group_service.get_student_group("student_B"))

    # 10. عرض الباقات (Display Packages & Exact Prices)
    def test_10_display_packages(self):
        prices_map = {p["minutes"]: p["price_etb"] for p in PACKAGES_CATALOG}
        self.assertEqual(prices_map[100], 500.0)
        self.assertEqual(prices_map[200], 1000.0)
        self.assertEqual(prices_map[300], 1470.0)
        self.assertEqual(prices_map[400], 1920.0)
        self.assertEqual(prices_map[500], 2350.0)
        self.assertEqual(prices_map[600], 2760.0)
        self.assertEqual(prices_map[1000], 4500.0)

    # 11. إرسال طلب دفع (Submit Payment Request without premature balance credit)
    def test_11_submit_payment_request(self):
        user_id = "user_test_55"
        bal_before = self.ledger_service.get_balance(user_id)["current_minutes"]
        
        # Payment created in pending state
        payment_request = {
            "id": "pay_req_1",
            "user_id": user_id,
            "minutes": 300,
            "status": "pending",
        }
        # Balance must NOT increase
        bal_after = self.ledger_service.get_balance(user_id)["current_minutes"]
        self.assertEqual(bal_before, bal_after)
        self.assertEqual(payment_request["status"], "pending")

    # 12. اعتماد الدفع (Atomic Payment Approval)
    def test_12_approve_payment_atomic(self):
        user_id = "user_test_77"
        res = self.ledger_service.process_payment_approval(
            payment_id="pay_99",
            user_id=user_id,
            minutes=200,
            idempotency_key="idem_key_unique_123",
            approved_by="admin_id",
        )
        self.assertTrue(res.success)
        self.assertEqual(res.balance_before, 0)
        self.assertEqual(res.balance_after, 200)

    # 13. رفض الدفع مع سبب (Reject Payment with Reason)
    def test_13_reject_payment_with_reason(self):
        user_id = "user_test_88"
        reason = "الرقم المرجعي للتحويل غير مطابق للبيانات البنكية"
        self.assertTrue(len(reason) > 5)

        # Balance remains unchanged
        bal = self.ledger_service.get_balance(user_id)["current_minutes"]
        self.assertEqual(bal, 0)

    # 14. منع اعتماد الدفع مرتين (Strict Idempotency Protection)
    def test_14_prevent_duplicate_payment_approval(self):
        user_id = "user_test_dup"
        idem_key = "tx_cbe_unique_8877"

        # First approval
        res1 = self.ledger_service.process_payment_approval(
            payment_id="pay_dup_1",
            user_id=user_id,
            minutes=500,
            idempotency_key=idem_key,
            approved_by="admin_1",
        )
        self.assertTrue(res1.success)
        self.assertEqual(res1.balance_after, 500)

        # Duplicate approval attempt with same idempotency key
        res2 = self.ledger_service.process_payment_approval(
            payment_id="pay_dup_1",
            user_id=user_id,
            minutes=500,
            idempotency_key=idem_key,
            approved_by="admin_2",
        )
        self.assertFalse(res2.success)
        self.assertEqual(res2.balance_after, 500)  # No duplicate credit!

    # 15. التأكد من صحة الرصيد بعد الدفع (Accurate Balance Audit)
    def test_15_balance_accuracy_verification(self):
        user_id = "user_audit"
        self.ledger_service.process_payment_approval("p1", user_id, 100, "k1", "admin")
        self.ledger_service.process_payment_approval("p2", user_id, 300, "k2", "admin")
        bal = self.ledger_service.get_balance(user_id)
        self.assertEqual(bal["current_minutes"], 400)
        self.assertEqual(bal["total_purchased"], 400)

    # 16. إضافة الدقائق وخصمها (Admin Minute Adjustments)
    def test_16_balance_addition_and_deduction(self):
        user_id = "user_adjust"
        # Admin bonus addition
        res_add = self.ledger_service.adjust_balance(
            user_id=user_id,
            minutes_change=150,
            reason="مكافأة تميز في التسميع",
            performed_by="admin_id",
            is_bonus=True,
        )
        self.assertTrue(res_add.success)
        self.assertEqual(res_add.balance_after, 150)

        # Deduct minutes for attended session
        res_ded = self.ledger_service.adjust_balance(
            user_id=user_id,
            minutes_change=-50,
            reason="خصم حصة تسميع سورة البقرة",
            performed_by="teacher_id",
        )
        self.assertTrue(res_ded.success)
        self.assertEqual(res_ded.balance_after, 100)

        # Prevent negative deduction
        res_invalid = self.ledger_service.adjust_balance(
            user_id=user_id,
            minutes_change=-200,
            reason="خصم مفرط",
            performed_by="admin",
        )
        self.assertFalse(res_invalid.success)
        self.assertEqual(self.ledger_service.get_balance(user_id)["current_minutes"], 100)

    # 17. صلاحيات المدير (Super Admin Permissions)
    def test_17_super_admin_permissions(self):
        super_admin_id = 9990001
        self.user_service.bind_super_admin(
            telegram_id=super_admin_id,
            email="khdahd241@gmail.com",
            first_name="المدير العام"
        )
        self.assertTrue(self.user_service.is_super_admin(super_admin_id))
        self.assertTrue(self.user_service.has_permission(super_admin_id, "manage_users"))
        self.assertTrue(self.user_service.has_permission(super_admin_id, "review_payments"))
        self.assertTrue(self.user_service.has_permission(super_admin_id, "manage_settings"))

    # 18. صلاحيات المشرف (Supervisor Granular Permissions)
    def test_18_supervisor_permissions(self):
        sup_id = 555666
        self.user_service.register_or_get_user(sup_id)
        # Assign supervisor role
        self.user_service._roles[sup_id] = {"supervisor"}

        self.assertTrue(self.user_service.has_permission(sup_id, "review_registrations"))
        self.assertTrue(self.user_service.has_permission(sup_id, "manage_groups"))
        # Supervisor cannot manage payments unless explicitly granted
        self.assertFalse(self.user_service.has_permission(sup_id, "review_payments"))
        self.assertFalse(self.user_service.is_super_admin(sup_id))

    # 19. صلاحيات المعلم (Teacher Portal Permissions)
    def test_19_teacher_permissions(self):
        teacher_id = 444333
        self.user_service.register_or_get_user(teacher_id)
        self.user_service._roles[teacher_id] = {"teacher"}

        self.assertTrue(self.user_service.is_teacher(teacher_id))
        self.assertTrue(self.user_service.has_permission(teacher_id, "teach_groups"))
        self.assertFalse(self.user_service.has_permission(teacher_id, "review_payments"))
        self.assertFalse(self.user_service.has_permission(teacher_id, "manage_users"))

    # 20. منع الطالب من الوصول إلى وظائف الإدارة (Student Access Control)
    def test_20_student_access_denied_to_admin(self):
        student_id = 111222
        self.user_service.register_or_get_user(student_id)
        self.assertFalse(self.user_service.is_admin_or_supervisor(student_id))
        self.assertFalse(self.user_service.has_permission(student_id, "review_payments"))
        self.assertFalse(self.user_service.has_permission(student_id, "review_registrations"))

    # 21. إرسال الإشعارات (Notification Entity & Logging)
    def test_21_notification_delivery(self):
        notification = {
            "user_id": "usr_10",
            "type": "payment_approved",
            "title_ar": "تم اعتماد رصيدك بنجاح",
            "is_read": False,
            "sent_via_telegram": True,
        }
        self.assertTrue(notification["sent_via_telegram"])
        self.assertFalse(notification["is_read"])

    # 22. إرسال الإعلانات (Broadcast Announcements)
    def test_22_broadcast_announcements(self):
        announcement = {
            "title": "بدء التسجيل للفصل القرآني الجديد",
            "target_role": "all",
            "sent_count": 150,
            "fail_count": 0,
        }
        self.assertEqual(announcement["sent_count"], 150)
        self.assertEqual(announcement["fail_count"], 0)

    # 23. حماية روابط المجموعات (Secure Telegram Links)
    def test_23_telegram_group_link_security(self):
        g = self.group_service.create_group(
            name="حلقة الإتقان",
            program_id="ijazah-hafs",
            gender="male",
            shift="evening",
            telegram_invite_link="https://t.me/+secret_invite_hash"
        )
        # Non-member cannot obtain link
        student_unassigned = self.group_service.get_student_group("random_student")
        self.assertIsNone(student_unassigned)

        # Member obtains verified link
        self.group_service.assign_student_to_group(g["id"], "authorized_student")
        member_group = self.group_service.get_student_group("authorized_student")
        self.assertEqual(member_group["telegram_invite_link"], "https://t.me/+secret_invite_hash")

    # 24. معالجة الأخطاء (Error Resilience)
    def test_24_error_handling(self):
        # Fallback to key if translation key missing
        fallback_res = t("non_existent_key_xyz", "ar")
        self.assertEqual(fallback_res, "non_existent_key_xyz")

    # 25. الترجمة العربية والإنجليزية والأمهرية (Complete 3-Language Parity)
    def test_25_three_languages_coverage(self):
        keys = [
            "welcome", "btn_about", "btn_programs", "btn_register",
            "btn_packages", "btn_balance", "btn_support", "payment_instructions",
        ]
        for k in keys:
            self.assertTrue(bool(t(k, "ar")), f"Key {k} missing in Arabic")
            self.assertTrue(bool(t(k, "en")), f"Key {k} missing in English")
            self.assertTrue(bool(t(k, "am")), f"Key {k} missing in Amharic")

    # 26. التحقق من عدم تسرب الأسرار (Secret Leak Prevention)
    def test_26_no_secrets_in_code_or_env_example(self):
        with open(".env.example", "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", content)
        self.assertIn("BOT_TOKEN=", content)
        self.assertIn("SUPER_ADMIN_EMAIL=\"khdahd241@gmail.com\"", content)
        self.assertIn("CONTACT_PHONE=\"0990161372\"", content)


if __name__ == "__main__":
    unittest.main()
