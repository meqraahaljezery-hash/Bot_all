"""
Centralized User, Identity & Role-Based Access Control (RBAC) Service.
Never relies on display names or username alone; checks Telegram User ID and cryptographic/configured links.
"""

from typing import Optional, Set, Dict, Any, List
from bot.config import settings


class UserService:
    def __init__(self):
        self._users: Dict[int, Dict[str, Any]] = {}
        self._roles: Dict[int, Set[str]] = {}
        self._permissions: Dict[str, Set[str]] = {
            "super_admin": {
                "manage_users", "review_registrations", "review_payments",
                "manage_balance", "manage_groups", "manage_programs",
                "manage_packages", "manage_payment_methods", "send_announcements",
                "manage_support", "view_audit_logs", "manage_settings", "manage_supervisors",
                "teach_groups"
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

        # Initialize super admin if configured in env
        if settings.SUPER_ADMIN_TELEGRAM_ID:
            self.bind_super_admin(
                telegram_id=settings.SUPER_ADMIN_TELEGRAM_ID,
                email=settings.SUPER_ADMIN_EMAIL,
                first_name="المدير العام"
            )

    def register_or_get_user(
        self,
        telegram_id: int,
        username: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        if telegram_id not in self._users:
            # Check if this telegram ID matches the super admin config
            roles = {"student"}
            if settings.SUPER_ADMIN_TELEGRAM_ID and telegram_id == settings.SUPER_ADMIN_TELEGRAM_ID:
                roles = {"super_admin", "teacher"}

            self._users[telegram_id] = {
                "telegram_id": telegram_id,
                "username": username,
                "first_name": first_name or "طالب",
                "last_name": last_name,
                "phone": None,
                "email": settings.SUPER_ADMIN_EMAIL if (settings.SUPER_ADMIN_TELEGRAM_ID and telegram_id == settings.SUPER_ADMIN_TELEGRAM_ID) else None,
                "preferred_language": "ar",
                "is_active": True,
                "is_frozen": False,
            }
            self._roles[telegram_id] = roles

        return self._users[telegram_id]

    def bind_super_admin(self, telegram_id: int, email: str, first_name: str = "المدير العام") -> bool:
        """
        Securely binds the primary super admin email (khdahd241@gmail.com)
        to the authorized telegram_id, giving both super_admin and teacher roles.
        """
        if email.lower() != settings.SUPER_ADMIN_EMAIL.lower():
            return False

        if telegram_id not in self._users:
            self._users[telegram_id] = {
                "telegram_id": telegram_id,
                "first_name": first_name,
                "email": email,
                "preferred_language": "ar",
                "is_active": True,
                "is_frozen": False,
            }
        self._roles[telegram_id] = {"super_admin", "teacher"}
        return True

    def get_user_roles(self, telegram_id: int) -> Set[str]:
        return self._roles.get(telegram_id, {"student"})

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

    def set_user_language(self, telegram_id: int, language_code: str) -> bool:
        if language_code not in settings.SUPPORTED_LANGUAGES:
            return False
        user = self.register_or_get_user(telegram_id)
        user["preferred_language"] = language_code
        return True

    def get_user_language(self, telegram_id: int) -> str:
        user = self.register_or_get_user(telegram_id)
        return user.get("preferred_language", "ar")

    def assign_role(self, telegram_id: int, role: str, actor_id: int) -> bool:
        """
        Only super_admin can assign supervisor or admin roles.
        Nobody can elevate themselves to super_admin.
        """
        if not self.is_super_admin(actor_id):
            return False
        if role == "super_admin" and actor_id != telegram_id:
            return False
        if telegram_id not in self._roles:
            self._roles[telegram_id] = {"student"}
        self._roles[telegram_id].add(role)
        return True


user_service = UserService()
