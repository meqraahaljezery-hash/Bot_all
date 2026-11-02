"""
Automated Notification Service for Imam Al-Jazari Quranic Maqraah.
Handles:
1. Immediate Telegram alerts when recitation minutes drop below threshold (default 15 mins) or reach 0.
2. Periodic scheduled scans checking all active students and warning them without spam.
3. Interactive CTA buttons (Request 15-min Emergency Advance, Packages, Support).
4. Detailed audit reports for supervisors and admins.
"""

from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timezone, timedelta
try:
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
except ImportError:
    class InlineKeyboardButton:
        def __init__(self, text: str, callback_data: str = "", url: str = ""):
            self.text = text
            self.callback_data = callback_data
            self.url = url

    class InlineKeyboardMarkup:
        def __init__(self, inline_keyboard: List[List[InlineKeyboardButton]] = None):
            self.inline_keyboard = inline_keyboard or []
from bot.services.database import supabase
from bot.services.user_service import user_service
from bot.services.ledger_service import ledger_service
from bot.services.loan_service import loan_service
from bot.locales.i18n import t

logger = logging.getLogger("maqraah_notifications")


class NotificationService:
    def __init__(self, default_threshold: int = 15):
        self.threshold: int = default_threshold
        # Cache for cooldown tracking: uid -> {"timestamp": datetime, "balance": int, "type": str}
        self._last_alerts: Dict[str, Dict[str, Any]] = {}
        # Notification history log
        self._history: List[Dict[str, Any]] = []

    def set_threshold(self, minutes: int) -> None:
        if minutes > 0:
            self.threshold = minutes

    def get_threshold(self) -> int:
        return self.threshold

    def get_low_balance_keyboard(self, lang: str = "ar") -> InlineKeyboardMarkup:
        """Interactive buttons attached to low-balance warnings"""
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="💳 شحن الرصيد / استعراض الباقات",
                        callback_data="view_packages_list"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🆘 طلب سلفة طارئة (15 دقيقة)",
                        callback_data="req_loan"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="💬 التواصل مع المشرف والدعم",
                        callback_data="open_ticket"
                    )
                ]
            ]
        )

    def get_zero_balance_keyboard(self, lang: str = "ar") -> InlineKeyboardMarkup:
        """Interactive buttons for zero-balance warning"""
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="💳 شحن باقة دقائق فوراً",
                        callback_data="view_packages_list"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🆘 تفعيل سلفة الـ 15 دقيقة الطارئة",
                        callback_data="req_loan"
                    )
                ]
            ]
        )

    def format_low_balance_message(
        self,
        current_balance: int,
        student_name: str = "أخي الطالب",
        student_code: str = "",
        reason: str = ""
    ) -> str:
        """صياغة تنبيه انخفاض الرصيد بأسلوب قرآني محفز وواضح"""
        code_str = f" (`{student_code}`)" if student_code else ""
        reason_str = f"\nسبب العملية: *{reason}*" if reason else ""

        return (
            "⚠️ *تنبيه: اقتراب نفاد رصيد دقائق الإقراء!*\n\n"
            f"حياكم الله طالبنا الكريم *{student_name}*{code_str} 🌿\n\n"
            f"نود إحاطتكم علماً بأن رصيدكم المتبقي للإقراء والتسميع قد انخفض إلى:\n"
            f"⏱ *{current_balance} دقيقة فقط* (أقل من الحد الآمن: {self.threshold} دقيقة).{reason_str}\n\n"
            "💡 *تنبيه هام:* عند وصول الرصيد إلى (0) دقيقة، سيتم إيقاف صلاحية الكتابة والمشاركة الصوتية "
            "في حلقات التسميع تلقائياً حتى تجديد الرصيد.\n\n"
            "✨ *ما يمكنك فعله الآن:*\n"
            "1. شحن باقة دقائق جديدة عبر الحسابات البنكية المعتمدة.\n"
            "2. طلب *سلفة طارئة (15 دقيقة)* لمرة واحدة لمواصلة تسميعك دون انقطاع.\n\n"
            "بارك الله في همتكم ونفع بكم القرآن العظيم."
        )

    def format_zero_balance_message(
        self,
        student_name: str = "أخي الطالب",
        student_code: str = "",
        reason: str = ""
    ) -> str:
        """صياغة تنبيه نفاد الرصيد بالكامل وكتم الحساب"""
        code_str = f" (`{student_code}`)" if student_code else ""
        reason_str = f"\nآخر عملية: *{reason}*" if reason else ""

        return (
            "🛑 *تنبيه هام: نفاد رصيد دقائق الإقراء بالكامل!*\n\n"
            f"المكرم الطالب *{student_name}*{code_str} 🌿\n\n"
            f"لقد استنفدت كامل رصيد دقائق الإقراء الخاص بك (الرصيد الحالي: *0 دقيقة*).{reason_str}\n\n"
            "⚠️ *حالة الحساب في المجموعات:* تم كتم إمكانية الكتابة والمشاركة في حلقة التسميع مؤقتاً.\n\n"
            "🔄 *لاستعادة المشاركة فوراً:*\n"
            "• بادر بشحن باقة دقائق جديدة وسيرفع الكتم فور اعتماد الدفع.\n"
            "• أو اضغط زر *السلفة الطارئة (15 دقيقة)* لتفعيلها لحظياً واستئناف التسميع الآن."
        )

    async def send_immediate_low_balance_alert(
        self,
        bot: Any,
        user_id: Any,
        current_balance: int,
        reason: str = ""
    ) -> bool:
        """
        إرسال تحذير فوري عبر تيليجرام للطالب عندما ينخفض رصيده إلى الحد الأدنى
        """
        uid = int(user_id)
        # Skip admins / supervisors
        if user_service.is_super_admin(uid):
            return False

        user = user_service.get_user(uid) or {}
        name = user.get("first_name", "طالب المقرأة")
        code = user.get("student_code", "")
        lang = user_service.get_user_language(uid)

        text = self.format_low_balance_message(
            current_balance=current_balance,
            student_name=name,
            student_code=code,
            reason=reason
        )
        kb = self.get_low_balance_keyboard(lang)

        success = False
        try:
            await bot.send_message(
                chat_id=uid,
                text=text,
                parse_mode="Markdown",
                reply_markup=kb
            )
            success = True
        except Exception as e:
            logger.warning(f"Failed to send immediate low-balance alert to {uid}: {e}")

        # Record in tracking cache and history
        now = datetime.now(timezone.utc)
        self._last_alerts[str(uid)] = {
            "timestamp": now,
            "balance": current_balance,
            "type": "low_balance"
        }
        self._log_notification(uid, "low_balance", current_balance, success)
        return success

    async def send_zero_balance_alert(
        self,
        bot: Any,
        user_id: Any,
        reason: str = ""
    ) -> bool:
        """إرسال تحذير فوري عند نفاد الرصيد بالكامل (0 دقيقة) وكتم الطالب"""
        uid = int(user_id)
        if user_service.is_super_admin(uid):
            return False

        user = user_service.get_user(uid) or {}
        name = user.get("first_name", "طالب المقرأة")
        code = user.get("student_code", "")
        lang = user_service.get_user_language(uid)

        text = self.format_zero_balance_message(
            student_name=name,
            student_code=code,
            reason=reason
        )
        kb = self.get_zero_balance_keyboard(lang)

        success = False
        try:
            await bot.send_message(
                chat_id=uid,
                text=text,
                parse_mode="Markdown",
                reply_markup=kb
            )
            success = True
        except Exception as e:
            logger.warning(f"Failed to send zero-balance alert to {uid}: {e}")

        now = datetime.now(timezone.utc)
        self._last_alerts[str(uid)] = {
            "timestamp": now,
            "balance": 0,
            "type": "zero_balance"
        }
        self._log_notification(uid, "zero_balance", 0, success)
        return success

    async def send_balance_change_alert_if_needed(
        self,
        bot: Any,
        user_id: Any,
        new_balance: int,
        reason: str = ""
    ) -> Optional[str]:
        """
        يُستدعى فوراً بعد أي عملية خصم من رصيد الطالب.
        إذا كان الرصيد <= 0 يرسل تحذير نفاد الرصيد وكتم المجموعات.
        إذا كان 0 < الرصيد <= الحد (15 دقيقة) يرسل تحذير قرب النفاد.
        """
        if new_balance <= 0:
            await self.send_zero_balance_alert(bot, user_id, reason=reason)
            return "zero_balance"
        elif new_balance <= self.threshold:
            await self.send_immediate_low_balance_alert(bot, user_id, new_balance, reason=reason)
            return "low_balance"
        return None

    async def check_and_notify_low_balance_students(
        self,
        bot: Any,
        threshold: Optional[int] = None,
        cooldown_hours: int = 24
    ) -> Dict[str, Any]:
        """
        الفحص الدوري التلقائي لجميع الطلاب المسجلين.
        يرسل التنبيهات للطلاب الذين رصيدهم منخفض دون تكرار مزعج (احترام فترة الـ cooldown).
        """
        check_threshold = threshold if threshold is not None else self.threshold
        now = datetime.now(timezone.utc)
        cooldown_delta = timedelta(hours=cooldown_hours)

        students = user_service.get_all_students()
        results = {
            "timestamp": now.isoformat(),
            "threshold": check_threshold,
            "students_checked": 0,
            "notified_low_balance": 0,
            "notified_zero_balance": 0,
            "muted_students": 0,
            "errors": 0
        }

        for std in students:
            uid = std.get("telegram_id")
            if not uid or user_service.is_super_admin(uid):
                continue

            results["students_checked"] += 1
            uid_str = str(uid)

            try:
                bal_data = ledger_service.get_balance(uid)
                bal = bal_data.get("current_minutes", 0)
                active_loan = loan_service.get_active_loan(uid)

                # 1. إذا كان الرصيد صفر أو أقل
                if bal <= 0 and not active_loan:
                    # Sync mute in study groups
                    try:
                        await loan_service.sync_group_status(bot, uid)
                        results["muted_students"] += 1
                    except Exception:
                        pass

                    # Check cooldown
                    last_alert = self._last_alerts.get(uid_str)
                    should_alert = True
                    if last_alert and last_alert.get("type") == "zero_balance":
                        if now - last_alert["timestamp"] < cooldown_delta:
                            should_alert = False

                    if should_alert:
                        sent = await self.send_zero_balance_alert(bot, uid, reason="فحص دوري للرصيد")
                        if sent:
                            results["notified_zero_balance"] += 1

                # 2. إذا كان الرصيد منخفضاً (أقل من أو يساوي الحد الأدنى وأكبر من صفر)
                elif bal <= check_threshold:
                    last_alert = self._last_alerts.get(uid_str)
                    should_alert = True
                    if last_alert:
                        # Alert if cooldown passed OR if balance dropped further since last alert
                        within_cooldown = (now - last_alert["timestamp"] < cooldown_delta)
                        if within_cooldown and bal >= last_alert.get("balance", bal):
                            should_alert = False

                    if should_alert:
                        sent = await self.send_immediate_low_balance_alert(
                            bot=bot,
                            user_id=uid,
                            current_balance=bal,
                            reason="فحص دوري لتذكير الطلاب"
                        )
                        if sent:
                            results["notified_low_balance"] += 1

            except Exception as e:
                logger.error(f"Error checking student {uid}: {e}")
                results["errors"] += 1

        return results

    def get_low_balance_students_report(self, threshold: Optional[int] = None) -> List[Dict[str, Any]]:
        """تقرير استعلامي للإدارة عن جميع الطلاب الذين رصيدهم تحت الحد الأدنى"""
        check_threshold = threshold if threshold is not None else self.threshold
        students = user_service.get_all_students()
        report = []

        for std in students:
            uid = std.get("telegram_id")
            if not uid or user_service.is_super_admin(uid):
                continue
            bal = ledger_service.get_balance(uid).get("current_minutes", 0)
            if bal <= check_threshold:
                report.append({
                    "telegram_id": uid,
                    "first_name": std.get("first_name", "طالب"),
                    "student_code": std.get("student_code", "-"),
                    "balance": bal,
                    "is_zero": (bal <= 0),
                    "has_loan": bool(loan_service.get_active_loan(uid)),
                    "shift": std.get("shift", ""),
                    "gender": std.get("gender", "")
                })

        report.sort(key=lambda x: x["balance"])
        return report

    def _log_notification(self, user_id: int, notif_type: str, balance: int, success: bool) -> None:
        entry = {
            "user_id": str(user_id),
            "type": notif_type,
            "balance": balance,
            "success": success,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._history.append(entry)
        try:
            supabase.table("notifications").insert(entry).execute()
        except Exception:
            pass


notification_service = NotificationService()
