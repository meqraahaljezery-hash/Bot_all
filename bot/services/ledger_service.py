"""
Ledger Service - The Financial Core.
Handles atomic balance updates, preventing negative balances and double-spending.
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
import uuid
import datetime

@dataclass
class LedgerResult:
    success: bool
    message: str = ""
    balance_before: int = 0
    balance_after: int = 0
    transaction_id: str = ""

class LedgerService:
    def __init__(self):
        # ⚠️ مؤقتاً نستخدم الذاكرة، لكن في الإنتاج يجب أن تُستبدل باستعلامات قاعدة بيانات Supabase
        self._balances: Dict[str, int] = {} # user_id: current_minutes
        self._history: Dict[str, List[Dict]] = {} # user_id: list of transactions
        self._idempotency_keys: set = set() # لمنع تكرار العمليات
        self._pending_payments: Dict[str, Dict] = {} # طلبات الدفع المعلقة

    # ==========================================
    # 1. قراءة البيانات
    # ==========================================
    def get_balance(self, user_id: str) -> Dict[str, int]:
        return {"current_minutes": self._balances.get(str(user_id), 0)}

    def get_transaction_history(self, user_id: str) -> List[Dict]:
        return self._history.get(str(user_id), [])

    def get_pending_payments(self) -> List[Dict]:
        return [p for p in self._pending_payments.values() if p.get("status") == "pending"]

    # ==========================================
    # 2. العمليات المالية (آمنة)
    # ==========================================
    def add_balance(self, user_id: str, minutes: int, admin_id: int, reason: str) -> LedgerResult:
        if minutes <= 0:
            return LedgerResult(success=False, message="يجب أن يكون عدد الدقائق أكبر من صفر.")

        user_id = str(user_id)
        before = self.get_balance(user_id)["current_minutes"]
        after = before + minutes
        self._balances[user_id] = after

        tx_id = str(uuid.uuid4())
        transaction = {
            "id": tx_id,
            "user_id": user_id,
            "minutes_change": minutes,
            "balance_before": before,
            "balance_after": after,
            "reason": reason,
            "performed_by": str(admin_id),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "type": "admin_credit"
        }

        if user_id not in self._history:
            self._history[user_id] = []
        self._history[user_id].append(transaction)

        return LedgerResult(success=True, message="تمت الإضافة بنجاح.", balance_before=before, balance_after=after, transaction_id=tx_id)

    def deduct_balance(self, user_id: str, minutes: int, admin_id: int, reason: str) -> LedgerResult:
        if minutes <= 0:
            return LedgerResult(success=False, message="يجب أن تكون المدة أكبر من صفر.")

        user_id = str(user_id)
        before = self.get_balance(user_id)["current_minutes"]
        
        # 🛑 منع الرصيد السالب
        if before < minutes:
            return LedgerResult(success=False, message=f"رصيد الطالب غير كافٍ. (المتاح: {before})")

        after = before - minutes
        self._balances[user_id] = after

        tx_id = str(uuid.uuid4())
        transaction = {
            "id": tx_id,
            "user_id": user_id,
            "minutes_change": -minutes, # بالسالب
            "balance_before": before,
            "balance_after": after,
            "reason": reason,
            "performed_by": str(admin_id),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "type": "session_deduction"
        }

        if user_id not in self._history:
            self._history[user_id] = []
        self._history[user_id].append(transaction)

        return LedgerResult(success=True, message="تم الخصم بنجاح.", balance_before=before, balance_after=after, transaction_id=tx_id)

    # ==========================================
    # 3. نظام اعتماد المدفوعات (Idempotency)
    # ==========================================
    def process_payment_approval(self, payment_id: str, user_id: str, minutes: int, idempotency_key: str, approved_by: str) -> LedgerResult:
        # 🛑 منع تكرار اعتماد الدفع (Idempotency)
        if idempotency_key in self._idempotency_keys:
            return LedgerResult(success=False, message="هذا الدفع تم اعتماده مسبقاً (منع التكرار).")
        
        payment = self._pending_payments.get(payment_id)
        if not payment or payment.get("status") != "pending":
            return LedgerResult(success=False, message="طلب الدفع غير موجود أو تمت معالجته مسبقاً.")

        # تنفيذ الإضافة
        res = self.add_balance(user_id, minutes, int(approved_by), reason=f"Payment Approved (ID: {payment_id})")
        
        if res.success:
            self._pending_payments[payment_id]["status"] = "approved"
            self._pending_payments[payment_id]["reviewed_by"] = approved_by
            self._idempotency_keys.add(idempotency_key) # تسجيل المفتاح لمنع التكرار

        return res

# نسخة مفردة (Singleton) لاستخدامها في كل البوت
ledger_service = LedgerService()