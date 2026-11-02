"""
Unit and Integration Tests for Automated Low-Balance Telegram Notification System.
Tests:
1. Immediate warning dispatch when balance drops <= threshold (15 minutes).
2. Zero-balance alert dispatch when balance drops to 0.
3. Safe balance (no alert when balance > 15 minutes).
4. Cooldown throttling in periodic background scans.
5. Report generation for admins/supervisors.
"""

import unittest
import asyncio
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from bot.services.notification_service import NotificationService, notification_service
from bot.services.user_service import UserService
from bot.services.ledger_service import LedgerService
from bot.services.loan_service import LoanService


class MockBot:
    """Mock Telegram Bot for asserting messages and keyboards sent"""
    def __init__(self):
        self.sent_messages = []
        self.restrictions = []

    async def send_message(self, chat_id, text, parse_mode=None, reply_markup=None):
        msg = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "reply_markup": reply_markup
        }
        self.sent_messages.append(msg)
        return msg

    async def restrict_chat_member(self, chat_id, user_id, permissions):
        self.restrictions.append({
            "chat_id": chat_id,
            "user_id": user_id,
            "permissions": permissions
        })
        return True


class TestLowBalanceNotifications(unittest.TestCase):
    def setUp(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.bot = MockBot()
        self.service = NotificationService(default_threshold=15)
        self.user_service = UserService()
        self.ledger_service = LedgerService()

    def tearDown(self):
        self.loop.close()

    def test_threshold_getter_setter(self):
        """التحقق من إمكانية ضبط وقراءة حد التنبيه"""
        self.assertEqual(self.service.get_threshold(), 15)
        self.service.set_threshold(20)
        self.assertEqual(self.service.get_threshold(), 20)
        self.service.set_threshold(15)

    def test_format_low_balance_message(self):
        """التحقق من صياغة رسالة التنبيه ووجود التفاصيل المطلوبة"""
        msg = self.service.format_low_balance_message(
            current_balance=10,
            student_name="محمد عبد الله",
            student_code="IM-1001",
            reason="خصم جلسة تسميع"
        )
        self.assertIn("محمد عبد الله", msg)
        self.assertIn("IM-1001", msg)
        self.assertIn("10 دقيقة", msg)
        self.assertIn("سلفة طارئة (15 دقيقة)", msg)

    def test_format_zero_balance_message(self):
        """التحقق من رسالة نفاد الرصيد وكتم الحساب"""
        msg = self.service.format_zero_balance_message(
            student_name="فاطمة أحمد",
            student_code="IF-2002"
        )
        self.assertIn("نفاد رصيد دقائق الإقراء بالكامل", msg)
        self.assertIn("فاطمة أحمد", msg)
        self.assertIn("0 دقيقة", msg)

    def test_immediate_low_balance_trigger(self):
        """إرسال تحذير فوري عند انخفاض الرصيد إلى 12 دقيقة (أقل من 15)"""
        student_id = 99887711
        self.user_service.register_or_get_user(student_id, first_name="عمر الفاروق")

        result = self.loop.run_until_complete(
            self.service.send_balance_change_alert_if_needed(
                bot=self.bot,
                user_id=student_id,
                new_balance=12,
                reason="خصم جلسة 18 دقيقة"
            )
        )
        self.assertEqual(result, "low_balance")
        self.assertEqual(len(self.bot.sent_messages), 1)
        sent = self.bot.sent_messages[0]
        self.assertEqual(sent["chat_id"], student_id)
        self.assertIn("12 دقيقة", sent["text"])

        # Buttons attached
        kb = sent["reply_markup"]
        btn_data = [btn.callback_data for row in kb.inline_keyboard for btn in row]
        self.assertIn("req_loan", btn_data)
        self.assertIn("view_packages_list", btn_data)

    def test_immediate_zero_balance_trigger(self):
        """إرسال تحذير نفاد الرصيد فوراً عند وصوله إلى 0"""
        student_id = 99887722
        self.user_service.register_or_get_user(student_id, first_name="يحيى")

        result = self.loop.run_until_complete(
            self.service.send_balance_change_alert_if_needed(
                bot=self.bot,
                user_id=student_id,
                new_balance=0,
                reason="خصم جلسة استنفدت الرصيد"
            )
        )
        self.assertEqual(result, "zero_balance")
        self.assertEqual(len(self.bot.sent_messages), 1)
        sent = self.bot.sent_messages[0]
        self.assertIn("نفاد رصيد", sent["text"])

    def test_no_alert_when_balance_safe(self):
        """عدم إرسال أي تنبيه إذا كان الرصيد المتبقي آمناً (مثلاً 45 دقيقة)"""
        student_id = 99887733
        result = self.loop.run_until_complete(
            self.service.send_balance_change_alert_if_needed(
                bot=self.bot,
                user_id=student_id,
                new_balance=45
            )
        )
        self.assertIsNone(result)
        self.assertEqual(len(self.bot.sent_messages), 0)

    def test_periodic_scan_and_cooldown_throttling(self):
        """اختبار الفحص الدوري ومنع تكرار الإشعارات المزعجة للمستخدم"""
        student_id = 99887744
        # Setup student with low balance
        from bot.services.user_service import user_service
        user_service.register_or_get_user(student_id, first_name="صهيب")
        from bot.services.ledger_service import ledger_service
        ledger_service.adjust_balance(student_id, 10, "رصيد تجريبي")

        # First scan -> Should notify
        scan_1 = self.loop.run_until_complete(
            self.service.check_and_notify_low_balance_students(self.bot, threshold=15, cooldown_hours=24)
        )
        self.assertGreaterEqual(scan_1["notified_low_balance"], 1)
        initial_msg_count = len(self.bot.sent_messages)

        # Immediate second scan -> Should NOT spam due to cooldown
        scan_2 = self.loop.run_until_complete(
            self.service.check_and_notify_low_balance_students(self.bot, threshold=15, cooldown_hours=24)
        )
        self.assertEqual(scan_2["notified_low_balance"], 0)
        self.assertEqual(len(self.bot.sent_messages), initial_msg_count)

    def test_low_balance_students_report(self):
        """اختبار توليد تقرير الإدارة للطلاب ذوي الرصيد المنخفض"""
        student_id = 99887755
        from bot.services.user_service import user_service
        from bot.services.ledger_service import ledger_service
        user_service.register_or_get_user(student_id, first_name="حذيفة")
        user_service.update_student_data(student_id, {"student_code": "IM-3300"})
        ledger_service.adjust_balance(student_id, 8, "رصيد منخفض")

        report = self.service.get_low_balance_students_report(threshold=15)
        found = any(s["telegram_id"] == student_id for s in report)
        self.assertTrue(found)


if __name__ == "__main__":
    unittest.main()
