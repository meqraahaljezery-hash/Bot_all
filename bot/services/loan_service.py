"""
Loan Service & Group Restriction Manager.
Handles emergency loans, group muting/unmuting, and balance synchronization.
"""
from typing import Dict, Any, Optional
import logging
try:
    from aiogram import Bot
    from aiogram.types import ChatPermissions
except ImportError:
    Bot = Any
    class ChatPermissions:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
from bot.services.database import supabase
from bot.services.ledger_service import ledger_service
from bot.config import settings

logger = logging.getLogger("maqraah_loans")


class LoanService:
    def __init__(self):
        # In-memory fallback loans store
        self._loans: Dict[str, Dict[str, Any]] = {}

    def get_active_loan(self, user_id: Any) -> Optional[Dict[str, Any]]:
        uid = str(user_id)
        if uid in self._loans and self._loans[uid].get("status") == "active":
            return self._loans[uid]

        try:
            res = supabase.table('loans').select('*').eq('user_id', uid).eq('status', 'active').execute()
            if res.data:
                loan = res.data[0]
                self._loans[uid] = loan
                return loan
        except Exception:
            pass
        return None

    def give_loan(self, user_id: Any, amount: int = 15) -> bool:
        """إعطاء سلفة طارئة (15 دقيقة) لمرة واحدة حتى يتم السداد"""
        uid = str(user_id)
        if self.get_active_loan(uid):
            return False

        # Add to ledger balance
        ledger_service.add_balance(uid, amount, admin_id=0, reason="Emergency Loan")

        loan_record = {
            "user_id": uid,
            "amount": amount,
            "status": "active"
        }
        self._loans[uid] = loan_record

        try:
            supabase.table('loans').insert(loan_record).execute()
        except Exception:
            pass

        return True

    def repay_loan(self, user_id: Any) -> int:
        """خصم السلفة تلقائياً عند شحن الرصيد"""
        uid = str(user_id)
        loan = self.get_active_loan(uid)
        if not loan:
            return 0

        amount = loan.get('amount', 15)
        # Deduct the loan amount
        ledger_service.deduct_balance(uid, amount, admin_id=0, reason="Loan Repayment")

        # Mark loan as repaid
        loan['status'] = "repaid"
        self._loans[uid] = loan

        try:
            supabase.table('loans').update({"status": "repaid"}).eq('user_id', uid).execute()
        except Exception:
            pass

        return amount

    async def sync_group_status(self, bot: Bot, user_id: Any) -> bool:
        """التحقق من الرصيد وكتم أو فك كتم الطالب في المجموعات"""
        uid = int(user_id)
        bal = ledger_service.get_balance(uid)['current_minutes']
        loan = self.get_active_loan(uid)

        should_mute = (bal <= 0 and not loan)

        success = True
        for group_key, group_info in settings.STUDY_GROUPS.items():
            chat_id = group_info.get('chat_id')
            if not chat_id:
                continue
            try:
                if should_mute:
                    await bot.restrict_chat_member(
                        chat_id=chat_id,
                        user_id=uid,
                        permissions=ChatPermissions(
                            can_send_messages=False,
                            can_send_audios=False,
                            can_send_documents=False,
                            can_send_photos=False,
                            can_send_videos=False,
                            can_send_voice_notes=False,
                            can_send_polls=False,
                            can_send_other_messages=False,
                            can_add_web_page_previews=False
                        )
                    )
                else:
                    await bot.restrict_chat_member(
                        chat_id=chat_id,
                        user_id=uid,
                        permissions=ChatPermissions(
                            can_send_messages=True,
                            can_send_audios=True,
                            can_send_documents=True,
                            can_send_photos=True,
                            can_send_videos=True,
                            can_send_voice_notes=True,
                            can_send_polls=True,
                            can_send_other_messages=True,
                            can_add_web_page_previews=True
                        )
                    )
            except Exception as e:
                logger.debug(f"Could not change permissions in {group_key} for {uid}: {e}")
                # Don't fail the whole loop if student isn't in that particular group
        return success


loan_service = LoanService()