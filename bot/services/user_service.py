"""
Centralized User, Identity & Role-Based Access Control (RBAC) Service.
Now fully integrated with Supabase Database.
"""

from typing import Optional, Set, Dict, Any, List
from bot.config import settings
from bot.services.database import supabase

class UserService:
    def __init__(self):
        # الصلاحيات ثابتة في الكود (لا تحتاج قاعدة بيانات)
        self._permissions: Dict[str, Set[str]] = {
            "super_admin": {
                "manage_users", "review_registrations", "review_payments",
                "manage_balance", "manage_groups", "manage_programs",
                "manage_packages", "manage_payment_methods", "send_announcements",
                "manage_support", "view_audit_logs", "manage_settings", "manage_supervisors",
                "teach_groups", "promote_users"
            },
            "admin": {
                "manage_users", "review_registrations", "review_payments",
                "manage_balance", "manage_groups", "manage_programs",
                "manage_packages", "send_announcements", "manage_support", "view_audit_logs"
            },
            "supervisor": {
                "review_registrations", "manage_groups", "send_announcements", "manage_support"
            },
            "teacher": {
                "teach_groups", "view_assigned_students", "send_group_announcements"
            },
            "student": {
                "submit_registration", "view_own_balance", "submit_payment",
                "view_assigned_group", "create_support_ticket"
            }
        }

    # ==========================================
    # 1. إدارة المستخدمين (Users)
    # ==========================================
    def register_or_get_user(
        self,
        telegram_id: int,
        username: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        telegram_id = int(telegram_id)
        
        # 1. البحث عن المستخدم في قاعدة البيانات
        try:
            response = supabase.table('users').select('*').eq('telegram_id', telegram_id).execute()
            
            if response.data:
                return response.data[0]
        except Exception as e:
            print(f"⚠️ خطأ في جلب المستخدم من Supabase: {e}")
            # إرجاع قاموس مؤقت لتجنب توقف البوت إذا فشلت قاعدة البيانات
            return {"telegram_id": telegram_id, "first_name": first_name or "طالب", "role": "student", "preferred_language": "ar"}

        # 2. إذا لم يكن موجوداً، نقوم بإنشائه
        default_role = "student"
        if settings.SUPER_ADMIN_TELEGRAM_ID and telegram_id == settings.SUPER_ADMIN_TELEGRAM_ID:
            default_role = "super_admin,teacher" # السوبر أدمن يمتلك صلاحيات المعلم أيضاً

        new_user = {
            "telegram_id": telegram_id,
            "username": username,
            "first_name": first_name or "طالب",
            "last_name": last_name,
            "role": default_role,
            "preferred_language": "ar",
            "is_active": True
        }

        try:
            insert_res = supabase.table('users').insert(new_user).execute()
            return insert_res.data[0]
        except Exception as e:
            print(f"⚠️ خطأ في إنشاء مستخدم جديد: {e}")
            return new_user # إرجاع البيانات محلياً كحل مؤقت

    def get_user(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        try:
            res = supabase.table('users').select('*').eq('telegram_id', int(telegram_id)).execute()
            return res.data[0] if res.data else None
        except Exception:
            return None

    # ==========================================
    # 2. إدارة اللغة (Language)
    # ==========================================
    def set_user_language(self, telegram_id: int, language_code: str) -> bool:
        if language_code not in settings.SUPPORTED_LANGUAGES:
            return False
        try:
            supabase.table('users').update({"preferred_language": language_code}).eq('telegram_id', int(telegram_id)).execute()
            return True
        except Exception:
            return False

    def get_user_language(self, telegram_id: int) -> str:
        user = self.get_user(telegram_id)
        return user.get("preferred_language", "ar") if user else "ar"

    # ==========================================
    # 3. إدارة الأدوار والصلاحيات (RBAC)
    # ==========================================
    def get_user_roles(self, telegram_id: int) -> Set[str]:
        user = self.get_user(telegram_id)
        if not user or not user.get("role"):
            return {"student"}
        
        # فصل الأدوار المخزنة كنص (مثلاً "super_admin,teacher" -> {"super_admin", "teacher"})
        roles_str = user.get("role", "student")
        return set(roles_str.split(","))

    def has_role(self, telegram_id: int, role: str) -> bool:
        return role in self.get_user_roles(telegram_id)

    def has_permission(self, telegram_id: int, permission: str) -> bool:
        user_roles = self.get_user_roles(telegram_id)
        for role in user_roles:
            role_perms = self._permissions.get(role, set())
            if permission in role_perms:
                return True
        return False

    def is_super_admin(self, telegram_id: int) -> bool:
        return "super_admin" in self.get_user_roles(telegram_id)

    def is_admin_or_supervisor(self, telegram_id: int) -> bool:
        roles = self.get_user_roles(telegram_id)
        return bool(roles.intersection({"super_admin", "admin", "supervisor"}))

    def is_teacher(self, telegram_id: int) -> bool:
        return "teacher" in self.get_user_roles(telegram_id)

    def assign_role(self, telegram_id: int, new_role: str, actor_id: int) -> bool:
        """ترقية مستخدم وإضافة دور جديد له في قاعدة البيانات"""
        if not self.is_super_admin(actor_id):
            return False
            
        user = self.get_user(telegram_id)
        if not user:
            return False

        current_roles = self.get_user_roles(telegram_id)
        current_roles.add(new_role)
        new_roles_str = ",".join(current_roles)

        try:
            supabase.table('users').update({"role": new_roles_str}).eq('telegram_id', int(telegram_id)).execute()
            return True
        except Exception as e:
            print(f"⚠️ فشل تحديث الدور: {e}")
            return False

    # ==========================================
    # 4. إدارة طلبات التسجيل (Registrations)
    # ==========================================
    def get_pending_registrations(self) -> List[Dict]:
        try:
            res = supabase.table('registrations').select('*').eq('status', 'pending').execute()
            return res.data
        except Exception:
            return []

    def approve_registration(self, reg_id: str, admin_id: int) -> bool:
        try:
            # 1. جلب تفاصيل الطلب
            reg_res = supabase.table('registrations').select('*').eq('id', reg_id).execute()
            if not reg_res.data:
                return False
                
            reg = reg_res.data[0]
            
            # 2. تحديث حالة الطلب
            supabase.table('registrations').update({
                "status": "approved",
                "reviewed_by": int(admin_id)
            }).eq('id', reg_id).execute()

            # 3. ترقية المستخدم (إذا كان موجوداً) أو إنشاؤه كطالب
            if reg.get('user_id'):
                supabase.table('users').update({"role": "student"}).eq('telegram_id', int(reg['user_id'])).execute()

            return True
        except Exception as e:
            print(f"⚠️ فشل قبول التسجيل: {e}")
            return False

    def reject_registration(self, reg_id: str, admin_id: int, reason: str) -> bool:
        try:
            supabase.table('registrations').update({
                "status": "rejected",
                "rejection_reason": reason,
                "reviewed_by": int(admin_id)
            }).eq('id', reg_id).execute()
            return True
        except Exception:
            return False

# نسخة مفردة لاستخدامها في كل البوت
user_service = UserService()