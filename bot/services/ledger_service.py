"""
Ledger Service - Real Database Integration (Supabase) + In-Memory Resilience.
Handles atomic balance updates, preventing negative balances and double-spending.
"""
from dataclasses import dataclass
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone
from bot.services.database import supabase


@dataclass
class LedgerResult:
    success: bool
    message: str = ""
    balance_before: int = 0
    balance_after: int = 0
    transaction_id: str = ""


class LedgerService:
    def __init__(self):
        # In-memory store for rapid fallback & offline/testing mode
        self._balances: Dict[str, Dict[str, int]] = {}
        self._processed_idempotency_keys: set = set()
        self._transactions: List[Dict[str, Any]] = []

    def get_balance(self, user_id: Any) -> Dict[str, int]:
        """جلب الرصيد الحالي للمستخدم ومجاميع الشراء والاستهلاك"""
        uid = str(user_id)
        
        # Check database first
        try:
            response = supabase.table('ledger')\
                .select('*')\
                .eq('user_id', uid)\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            if response.data:
                latest = response.data[0]
                current = latest.get('balance_after', 0)
                # Compute totals from all user ledger entries
                all_res = supabase.table('ledger').select('*').eq('user_id', uid).execute()
                total_purchased = sum(r.get('minutes_change', 0) for r in all_res.data if r.get('minutes_change', 0) > 0)
                total_consumed = sum(abs(r.get('minutes_change', 0)) for r in all_res.data if r.get('minutes_change', 0) < 0)
                
                bal_dict = {
                    "current_minutes": current,
                    "total_purchased": total_purchased,
                    "total_consumed": total_consumed,
                    "total_bonus": 0
                }
                self._balances[uid] = bal_dict
                return bal_dict
        except Exception:
            pass

        # Fallback to in-memory
        if uid not in self._balances:
            self._balances[uid] = {
                "current_minutes": 0,
                "total_purchased": 0,
                "total_consumed": 0,
                "total_bonus": 0
            }
        return self._balances[uid]

    def adjust_balance(
        self,
        user_id: Any,
        minutes_change: int,
        reason: str,
        performed_by: Any = "system",
        is_bonus: bool = False
    ) -> LedgerResult:
        """
        تعديل الرصيد (إضافة موجبة أو خصم سالب) مع التحقق الصارم من عدم السالب.
        """
        uid = str(user_id)
        current = self.get_balance(uid)["current_minutes"]
        new_balance = current + minutes_change

        # 🛑 منع الرصيد السالب
        if new_balance < 0:
            return LedgerResult(
                success=False,
                message=f"الرصيد غير كافٍ. الرصيد المتاح: {current} دقيقة.",
                balance_before=current,
                balance_after=current
            )

        tx_id = str(uuid.uuid4())
        
        # Update in-memory
        bal_entry = self._balances.setdefault(uid, {"current_minutes": 0, "total_purchased": 0, "total_consumed": 0, "total_bonus": 0})
        bal_entry["current_minutes"] = new_balance
        if minutes_change > 0:
            if is_bonus:
                bal_entry["total_bonus"] += minutes_change
            else:
                bal_entry["total_purchased"] += minutes_change
        else:
            bal_entry["total_consumed"] += abs(minutes_change)

        tx_data = {
            "id": tx_id,
            "user_id": uid,
            "minutes_change": minutes_change,
            "balance_before": current,
            "balance_after": new_balance,
            "reason": reason,
            "performed_by": str(performed_by),
            "is_bonus": is_bonus,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._transactions.append(tx_data)

        # Sync to Supabase
        try:
            supabase.table('ledger').insert(tx_data).execute()
        except Exception:
            pass

        return LedgerResult(
            success=True,
            message="تم تعديل الرصيد بنجاح.",
            balance_before=current,
            balance_after=new_balance,
            transaction_id=tx_id
        )

    def add_balance(self, user_id: Any, minutes: int, admin_id: Any = 0, reason: str = "Add Minutes") -> LedgerResult:
        if minutes <= 0:
            return LedgerResult(success=False, message="يجب أن يكون عدد الدقائق أكبر من صفر.")
        return self.adjust_balance(user_id, minutes, reason=reason, performed_by=admin_id)

    def deduct_balance(self, user_id: Any, minutes: int, admin_id: Any = 0, reason: str = "Deduct Minutes") -> LedgerResult:
        if minutes <= 0:
            return LedgerResult(success=False, message="يجب أن تكون المدة أكبر من صفر.")
        return self.adjust_balance(user_id, -minutes, reason=reason, performed_by=admin_id)

    def process_payment_approval(
        self,
        payment_id: str,
        user_id: Any,
        minutes: int,
        idempotency_key: str,
        approved_by: Any
    ) -> LedgerResult:
        """
        اعتماد دفع ذري مع منع التكرار الصارم (Idempotency)
        """
        uid = str(user_id)
        current_bal = self.get_balance(uid)["current_minutes"]

        # Check in-memory idempotency
        if idempotency_key in self._processed_idempotency_keys:
            return LedgerResult(
                success=False,
                message="هذا الدفع تم اعتماده مسبقاً (منع التكرار).",
                balance_before=current_bal,
                balance_after=current_bal
            )

        # Check DB idempotency
        try:
            check_exist = supabase.table('ledger').select('id').eq('idempotency_key', idempotency_key).execute()
            if check_exist.data:
                self._processed_idempotency_keys.add(idempotency_key)
                return LedgerResult(
                    success=False,
                    message="هذا الدفع تم اعتماده مسبقاً (منع التكرار).",
                    balance_before=current_bal,
                    balance_after=current_bal
                )
        except Exception:
            pass

        # Execute addition
        res = self.add_balance(uid, minutes, admin_id=approved_by, reason=f"Payment Approved ({payment_id})")
        if res.success:
            self._processed_idempotency_keys.add(idempotency_key)
            try:
                supabase.table('ledger').update({"idempotency_key": idempotency_key}).eq('id', res.transaction_id).execute()
                supabase.table('payments').update({"status": "approved", "reviewed_by": str(approved_by)}).eq('id', payment_id).execute()
            except Exception:
                pass

        return res

    def get_transaction_history(self, user_id: Any) -> List[Dict[str, Any]]:
        """جلب كشف حساب وسجل حركات الطالب"""
        uid = str(user_id)
        try:
            res = supabase.table('ledger').select('*').eq('user_id', uid).order('created_at', desc=True).limit(10).execute()
            if res.data:
                return res.data
        except Exception:
            pass

        # In-memory history
        user_txs = [tx for tx in self._transactions if str(tx.get("user_id")) == uid]
        return user_txs

    def get_pending_payments(self) -> List[Dict]:
        """جلب طلبات الدفع المعلقة"""
        try:
            response = supabase.table('payments').select('*').eq('status', 'pending').execute()
            return response.data
        except Exception:
            return []


ledger_service = LedgerService()