"""
Ledger & Financial Transaction Service.
Ensures strict atomicity, idempotency, and audit trails for all minute balances.
No student can directly edit balance; only authorized transactions or admins can.
"""

import uuid
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class TransactionResult:
    success: bool
    balance_before: int
    balance_after: int
    minutes_changed: int
    message: str
    transaction_id: Optional[str] = None


class LedgerService:
    def __init__(self):
        # In-memory store for standalone mock/testing or when DB is not directly connected
        self._balances: Dict[str, Dict[str, int]] = {}
        self._transactions: list = []
        self._processed_idempotency_keys: set = set()

    def get_balance(self, user_id: str) -> Dict[str, int]:
        if user_id not in self._balances:
            self._balances[user_id] = {
                "current_minutes": 0,
                "total_purchased": 0,
                "total_consumed": 0,
                "total_bonus": 0,
            }
        return self._balances[user_id]

    def process_payment_approval(
        self,
        payment_id: str,
        user_id: str,
        minutes: int,
        idempotency_key: str,
        approved_by: str,
    ) -> TransactionResult:
        """
        Atomic approval of a payment request.
        Guarantees that an idempotency key cannot be processed twice.
        """
        if idempotency_key in self._processed_idempotency_keys:
            return TransactionResult(
                success=False,
                balance_before=self.get_balance(user_id)["current_minutes"],
                balance_after=self.get_balance(user_id)["current_minutes"],
                minutes_changed=0,
                message="Transaction already processed (Idempotency check failed).",
            )

        balance = self.get_balance(user_id)
        before = balance["current_minutes"]
        after = before + minutes

        balance["current_minutes"] = after
        balance["total_purchased"] += minutes

        tx_id = str(uuid.uuid4())
        self._transactions.append({
            "id": tx_id,
            "user_id": user_id,
            "type": "purchase",
            "minutes_change": minutes,
            "balance_before": before,
            "balance_after": after,
            "reason": f"اعتماد طلب الدفع رقم {payment_id}",
            "payment_id": payment_id,
            "performed_by": approved_by,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        self._processed_idempotency_keys.add(idempotency_key)

        return TransactionResult(
            success=True,
            balance_before=before,
            balance_after=after,
            minutes_changed=minutes,
            message="Payment approved and minutes added successfully.",
            transaction_id=tx_id,
        )

    def adjust_balance(
        self,
        user_id: str,
        minutes_change: int,
        reason: str,
        performed_by: str,
        is_bonus: bool = False,
    ) -> TransactionResult:
        """
        Admin addition or deduction of minutes with audit log.
        Deductions cannot drop balance below 0.
        """
        balance = self.get_balance(user_id)
        before = balance["current_minutes"]
        after = before + minutes_change

        if after < 0:
            return TransactionResult(
                success=False,
                balance_before=before,
                balance_after=before,
                minutes_changed=0,
                message="Cannot deduct minutes: balance would become negative.",
            )

        balance["current_minutes"] = after
        if minutes_change > 0:
            if is_bonus:
                balance["total_bonus"] += minutes_change
            else:
                balance["total_purchased"] += minutes_change
        else:
            balance["total_consumed"] += abs(minutes_change)

        tx_id = str(uuid.uuid4())
        self._transactions.append({
            "id": tx_id,
            "user_id": user_id,
            "type": "bonus" if is_bonus else ("admin_addition" if minutes_change > 0 else "admin_deduction"),
            "minutes_change": minutes_change,
            "balance_before": before,
            "balance_after": after,
            "reason": reason,
            "performed_by": performed_by,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        return TransactionResult(
            success=True,
            balance_before=before,
            balance_after=after,
            minutes_changed=minutes_change,
            message="Balance adjusted successfully.",
            transaction_id=tx_id,
        )

    def get_transaction_history(self, user_id: str) -> list:
        return [tx for tx in self._transactions if tx["user_id"] == user_id]


ledger_service = LedgerService()
