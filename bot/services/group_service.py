"""
Educational Group & Matching Service for Imam Al-Jazari Maqraah.
Enforces strict privacy: students only see their group; teachers only see their assigned students.
"""

import uuid
from typing import Optional, List, Dict, Any


class GroupService:
    def __init__(self):
        self._groups: Dict[str, Dict[str, Any]] = {}
        self._group_members: List[Dict[str, Any]] = []

    def create_group(
        self,
        name: str,
        program_id: str,
        gender: str,
        shift: str,
        teacher_id: Optional[str] = None,
        max_members: int = 20,
        telegram_invite_link: Optional[str] = None,
    ) -> Dict[str, Any]:
        group_id = str(uuid.uuid4())
        group = {
            "id": group_id,
            "name": name,
            "program_id": program_id,
            "gender": gender,
            "shift": shift,
            "teacher_id": teacher_id,
            "max_members": max_members,
            "current_members_count": 0,
            "telegram_invite_link": telegram_invite_link,
            "is_active": True,
        }
        self._groups[group_id] = group
        return group

    def find_matching_group(self, program_id: str, gender: str, shift: str) -> Optional[Dict[str, Any]]:
        """
        Finds an active group matching program, gender, and shift with available seats.
        """
        for group in self._groups.values():
            if (
                group["is_active"]
                and group["program_id"] == program_id
                and group["gender"] == gender
                and group["shift"] == shift
                and group["current_members_count"] < group["max_members"]
            ):
                return group
        return None

    def assign_student_to_group(self, group_id: str, student_id: str) -> bool:
        group = self._groups.get(group_id)
        if not group or group["current_members_count"] >= group["max_members"]:
            return False

        # Check if already a member
        for m in self._group_members:
            if m["group_id"] == group_id and m["student_id"] == student_id:
                return True

        self._group_members.append({
            "group_id": group_id,
            "student_id": student_id,
            "status": "active",
        })
        group["current_members_count"] += 1
        return True

    def get_student_group(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Students can ONLY view their assigned group.
        """
        for m in self._group_members:
            if m["student_id"] == student_id and m["status"] == "active":
                return self._groups.get(m["group_id"])
        return None

    def get_teacher_groups(self, teacher_id: str) -> List[Dict[str, Any]]:
        """
        Teachers can only view groups assigned to them.
        """
        return [g for g in self._groups.values() if g.get("teacher_id") == teacher_id]


group_service = GroupService()
