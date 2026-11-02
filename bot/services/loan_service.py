"""
Loan Service & Group Restriction Manager
Handles automatic loans, group muting/unmuting, and balance alerts.
"""
from aiogram import Bot
from aiogram.types import ChatPermissions
from bot.services.database import supabase
from bot.services.ledger_service import ledger_service
from bot.config import settings

class LoanService:
    
    def get_active_loan(self, user_id: int):
        res = supabase.table('loans').select('*').eq('user_id', user_id).eq('status', 'active').execute()
        return res.data[0] if res.data else None

    def give_loan(self, user_id: int, amount: int = 15) -> bool:
        """إعطاء سلفة تلقائية مرة واحدة فقط"""
        if self.get_active_loan(user_id):
            return False # لا يمكن أخذ سلفة ثانية

        # إضافة السلفة للرصيد
        ledger_service.add_balance(user_id, amount, admin_id=0, reason="Automatic Loan")
        
        # تسجيل السلفة في قاعدة البيانات
        supabase.table('loans').insert({
            "user_id": user_id,
            "amount": amount,
            "status": "active"
        }).execute()
        return True

    def repay_loan(self, user_id: int) -> int:
        """خصم السلفة تلقائياً عند شحن الرصيد"""
        loan = self.get_active_loan(user_id)
        if not loan:
            return 0
            
        amount = loan['amount']
        # خصم المبلغ من الرصيد
        res = ledger_service.deduct_balance(user_id, amount, admin_id=0, reason="Loan Repayment")
        
        # تحديث حالة السلفة إلى مسددة (حتى لو لم يكف الرصيد، نسددها لتجنب التعقيد)
        supabase.table('loans').update({"status": "repaid"}).eq('id', loan['id']).execute()
        return amount

    async def sync_group_status(self, bot: Bot, user_id: int):
        """التحقق من الرصيد وحظر/فك حظر الطالب في المجموعات"""
        bal = ledger_service.get_balance(user_id)['current_minutes']
        loan = self.get_active_loan(user_id)
        
        should_mute = (bal <= 0 and not loan)
        
        for group_key, group_info in settings.STUDY_GROUPS.items():
            chat_id = group_info['chat_id']
            try:
                if should_mute:
                    await bot.restrict_chat_member(
                        chat_id=chat_id,
                        user_id=user_id,
                        permissions=ChatPermissions(can_send_messages=False)
                    )
                else:
                    await bot.restrict_chat_member(
                        chat_id=chat_id,
                        user_id=user_id,
                        permissions=ChatPermissions(can_send_messages=True, can_send_media_messages=True, can_send_other_messages=True, can_add_web_page_previews=True)
                    )
            except Exception as e:
                print(f"⚠️ لم نتمكن من تعديل صلاحيات المستخدم في {group_key}: {e}")

loan_service = LoanService()