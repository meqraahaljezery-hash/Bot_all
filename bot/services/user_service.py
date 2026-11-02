"""
Centralized User, Identity & Role-Based Access Control (RBAC) Service.
Fully integrated with Supabase Database with in-memory persistence fallback.
"""

from typing import Optional, Set, Dict, Any, List
from bot.config import settings
from bot.services.database import supabase


class UserService:
    def __init__(self):
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
        # In-memory caches to support direct testing and rapid lookups
        self._roles: Dict[int, Set[str]] = {}
        self._users: Dict[int, Dict[str, Any]] = {}

    def _is_configured_super_admin(self, telegram_id: int) -> bool:
        return telegram_id in settings.SUPER_ADMIN_IDS

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
        
        # Check in-memory cache first if present
        if telegram_id in self._users:
            user = self._users[telegram_id]
            if self._is_configured_super_admin(telegram_id):
                user["role"] = "super_admin,teacher"
                self._roles[telegram_id] = {"super_admin", "teacher"}
            return user

        # Query database
        try:
            response = supabase.table('users').select('*').eq('telegram_id', telegram_id).execute()
            if response.data:
                user = response.data[0]
                if self._is_configured_super_admin(telegram_id):
                    user["role"] = "super_admin,teacher"
                    self._roles[telegram_id] = {"super_admin", "teacher"}
                    try:
                        supabase.table('users').update({"role": "super_admin,teacher"}).eq('telegram_id', telegram_id).execute()
                    except Exception:
                        pass
                else:
                    self._roles[telegram_id] = set(user.get("role", "student").split(","))
                self._users[telegram_id] = user
                return user
        except Exception:
            pass

        # Create new user record
        default_role = "super_admin,teacher" if self._is_configured_super_admin(telegram_id) else "student"
        new_user = {
            "telegram_id": telegram_id,
            "username": username or "",
            "first_name": first_name or "طالب",
            "last_name": last_name or "",
            "role": default_role,
            "preferred_language": "ar",
            "is_active": True,
            "is_muted": False,
            "is_banned": False,
            "student_code": "",
            "assigned_group": ""
        }

        self._users[telegram_id] = new_user
        self._roles[telegram_id] = set(default_role.split(","))

        try:
            insert_res = supabase.table('users').insert(new_user).execute()
            if insert_res.data:
                self._users[telegram_id] = insert_res.data[0]
                return insert_res.data[0]
        except Exception:
            pass

        return new_user

    def bind_super_admin(self, telegram_id: int, email: str, first_name: str) -> Dict[str, Any]:
        """Binds a super admin with specific credentials"""
        telegram_id = int(telegram_id)
        settings.SUPER_ADMIN_IDS.add(telegram_id)
        user = self.register_or_get_user(telegram_id, username="admin", first_name=first_name)
        user["role"] = "super_admin,teacher"
        user["email"] = email
        self._users[telegram_id] = user
        self._roles[telegram_id] = {"super_admin", "teacher"}
        try:
            supabase.table('users').update({"role": "super_admin,teacher"}).eq('telegram_id', telegram_id).execute()
        except Exception:
            pass
        return user

    def get_user(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        telegram_id = int(telegram_id)
        if telegram_id in self._users:
            return self._users[telegram_id]
        try:
            res = supabase.table('users').select('*').eq('telegram_id', telegram_id).execute()
            if res.data:
                user = res.data[0]
                self._users[telegram_id] = user
                self._roles[telegram_id] = set(user.get("role", "student").split(","))
                return user
        except Exception:
            pass
        return None

    # ==========================================
    # 2. إدارة اللغة (Language)
    # ==========================================
    def set_user_language(self, telegram_id: int, language_code: str) -> bool:
        telegram_id = int(telegram_id)
        if language_code not in settings.SUPPORTED_LANGUAGES:
            return False
        if telegram_id in self._users:
            self._users[telegram_id]["preferred_language"] = language_code
        try:
            supabase.table('users').update({"preferred_language": language_code}).eq('telegram_id', telegram_id).execute()
            return True
        except Exception:
            return True

    def get_user_language(self, telegram_id: int) -> str:
        user = self.get_user(telegram_id)
        return user.get("preferred_language", "ar") if user else "ar"

    # ==========================================
    # 3. إدارة الأدوار والصلاحيات (RBAC)
    # ==========================================
    def get_user_roles(self, telegram_id: int) -> Set[str]:
        telegram_id = int(telegram_id)
        if self._is_configured_super_admin(telegram_id):
            return {"super_admin", "teacher"}
        if telegram_id in self._roles:
            return self._roles[telegram_id]
        user = self.get_user(telegram_id)
        if not user or not user.get("role"):
            return {"student"}
        roles = set(user.get("role", "student").split(","))
        self._roles[telegram_id] = roles
        return roles

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
        telegram_id = int(telegram_id)
        if not self.is_super_admin(actor_id):
            return False
        roles = self.get_user_roles(telegram_id)
        roles.add(new_role)
        self._roles[telegram_id] = roles
        new_roles_str = ",".join(roles)
        if telegram_id in self._users:
            self._users[telegram_id]["role"] = new_roles_str
        try:
            supabase.table('users').update({"role": new_roles_str}).eq('telegram_id', telegram_id).execute()
            return True
        except Exception:
            return True

    # ==========================================
    # 4. قائمة الطلاب وإدارة الحالات
    # ==========================================
    def get_all_students(self) -> List[Dict[str, Any]]:
        """Retrieves list of all students for the admin panel"""
        students = []
        try:
            res = supabase.table('users').select('*').execute()
            for u in res.data:
                # filter out pure super admins if desired, but keep students
                students.append(u)
        except Exception:
            pass

        # Merge with in-memory users
        existing_ids = {s.get("telegram_id") for s in students}
        for tid, u in self._users.items():
            if tid not in existing_ids:
                students.append(u)

        return students

    def update_student_data(self, telegram_id: int, updates: Dict[str, Any]) -> bool:
        telegram_id = int(telegram_id)
        if telegram_id in self._users:
            self._users[telegram_id].update(updates)
        try:
            supabase.table('users').update(updates).eq('telegram_id', telegram_id).execute()
            return True
        except Exception:
            return True

    def delete_student(self, telegram_id: int) -> bool:
        telegram_id = int(telegram_id)
        if telegram_id in self._users:
            del self._users[telegram_id]
        if telegram_id in self._roles:
            del self._roles[telegram_id]
        try:
            supabase.table('users').delete().eq('telegram_id', telegram_id).execute()
            return True
        except Exception:
            return True

    # ==========================================
    # 5. إدارة طلبات التسجيل (Registrations)
    # ==========================================
    def get_pending_registrations(self) -> List[Dict]:
        try:
            res = supabase.table('registrations').select('*').eq('status', 'pending').execute()
            return res.data
        except Exception:
            return []

    def approve_registration(self, reg_id: str, admin_id: int) -> bool:
        try:
            reg_res = supabase.table('registrations').select('*').eq('id', reg_id).execute()
            if not reg_res.data:
                return False
                
            reg = reg_res.data[0]
            supabase.table('registrations').update({
                "status": "approved",
                "reviewed_by": int(admin_id)
            }).eq('id', reg_id).execute()

            if reg.get('user_id'):
                supabase.table('users').update({"role": "student"}).eq('telegram_id', int(reg['user_id'])).execute()

            return True
        except Exception:
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


user_service = UserService()