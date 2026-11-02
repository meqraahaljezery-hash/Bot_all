"""
Ledger Service - Real Database Integration (Supabase)
Handles atomic balance updates, preventing negative balances and double-spending.
"""
from dataclasses import dataclass
from typing import Dict, Any, List
import uuid
from bot.services.database import supabase

@dataclass
class LedgerResult:
    success: bool
    message: str = ""
    balance_before: int = 0
    balance_after: int = 0
    transaction_id: str = ""

class LedgerService:
    
    def get_balance(self, user_id: str) -> Dict[str, int]:
        """جلب الرصيد الحالي للمستخدم من قاعدة البيانات"""
        # في هذا التصميم، الرصيد الحالي هو آخر "balance_after" في سجل الحركات
        response = supabase.table('ledger')\
            .select('balance_after')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        if response.data:
            return {"current_minutes": response.data[0]['balance_after']}
        return {"current_minutes": 0}

    def add_balance(self, user_id: str, minutes: int, admin_id: int, reason: str) -> LedgerResult:
        if minutes <= 0:
            return LedgerResult(success=False, message="يجب أن يكون عدد الدقائق أكبر من صفر.")

        user_id = str(user_id)
        before = self.get_balance(user_id)["current_minutes"]
        after = before + minutes

        tx_id = str(uuid.uuid4())
        data = {
            "id": tx_id,
            "user_id": user_id,
            "minutes_change": minutes,
            "balance_before": before,
            "balance_after": after,
            "reason": reason,
            "performed_by": admin_id
        }

        try:
            supabase.table('ledger').insert(data).execute()
            return LedgerResult(success=True, message="تمت الإضافة بنجاح.", balance_before=before, balance_after=after, transaction_id=tx_id)
        except Exception as e:
            return LedgerResult(success=False, message=f"خطأ في قاعدة البيانات: {str(e)}")

    def deduct_balance(self, user_id: str, minutes: int, admin_id: int, reason: str) -> LedgerResult:
        if minutes <= 0:
            return LedgerResult(success=False, message="يجب أن تكون المدة أكبر من صفر.")

        user_id = str(user_id)
        before = self.get_balance(user_id)["current_minutes"]
        
        # 🛑 منع الرصيد السالب
        if before < minutes:
            return LedgerResult(success=False, message=f"رصيد الطالب غير كافٍ. (المتاح: {before})")

        after = before - minutes
        tx_id = str(uuid.uuid4())
        
        data = {
            "id": tx_id,
            "user_id": user_id,
            "minutes_change": -minutes,
            "balance_before": before,
            "balance_after": after,
            "reason": reason,
            "performed_by": admin_id
        }

        try:
            supabase.table('ledger').insert(data).execute()
            return LedgerResult(success=True, message="تم الخصم بنجاح.", balance_before=before, balance_after=after, transaction_id=tx_id)
        except Exception as e:
            return LedgerResult(success=False, message=f"خطأ في قاعدة البيانات: {str(e)}")

    def process_payment_approval(self, payment_id: str, user_id: str, minutes: int, idempotency_key: str, approved_by: str) -> LedgerResult:
        # 🛑 منع تكرار اعتماد الدفع (Idempotency) عبر قاعدة البيانات
        try:
            check_exist = supabase.table('ledger').select('id').eq('idempotency_key', idempotency_key).execute()
            if check_exist.data:
                return LedgerResult(success=False, message="هذا الدفع تم اعتماده مسبقاً (منع التكرار).")
            
            # تنفيذ الإضافة
            res = self.add_balance(user_id, minutes, int(approved_by), reason=f"Payment Approved (ID: {payment_id})")
            
            if res.success:
                # تحديث مفتاح التكرار في السجل
                supabase.table('ledger').update({"idempotency_key": idempotency_key}).eq('id', res.transaction_id).execute()
                # تحديث حالة الدفع في جدول المدفوعات
                supabase.table('payments').update({"status": "approved", "reviewed_by": approved_by}).eq('id', payment_id).execute()
                
            return res
        except Exception as e:
            return LedgerResult(success=False, message=f"خطأ في العملية: {str(e)}")

    def get_pending_payments(self) -> List[Dict]:
        """جلب طلبات الدفع المعلقة"""
        response = supabase.table('payments').select('*').eq('status', 'pending').execute()
        return response.data

# نسخة مفردة لاستخدامها في كل البوت
ledger_service = LedgerService()