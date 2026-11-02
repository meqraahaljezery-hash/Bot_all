"""
Database Layer with Supabase Integration and Resilient Offline/In-Memory Fallback.
Guarantees zero-crash startup even if Supabase keys are not yet configured or supabase package is not installed.
"""
import os
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("maqraah_db")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://vtqdfcqejyctvfkvyece.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

class DBResponse:
    def __init__(self, data: Any):
        self.data = data if data is not None else []


class InMemoryTable:
    def __init__(self, name: str):
        self.name = name
        self.records: List[Dict[str, Any]] = []

    def insert(self, record_or_list: Any) -> DBResponse:
        if isinstance(record_or_list, list):
            inserted = []
            for item in record_or_list:
                row = dict(item)
                if "id" not in row:
                    row["id"] = str(uuid.uuid4())
                if "created_at" not in row:
                    row["created_at"] = datetime.now(timezone.utc).isoformat()
                self.records.append(row)
                inserted.append(row)
            return DBResponse(inserted)
        else:
            row = dict(record_or_list)
            if "id" not in row:
                row["id"] = str(uuid.uuid4())
            if "created_at" not in row:
                row["created_at"] = datetime.now(timezone.utc).isoformat()
            self.records.append(row)
            return DBResponse([row])

    def query(self) -> "InMemoryQuery":
        return InMemoryQuery(self)


class InMemoryQuery:
    def __init__(self, table: InMemoryTable):
        self.table = table
        self._action = "select"
        self._select_cols = "*"
        self._filters = []
        self._order_col = None
        self._order_desc = False
        self._limit = None
        self._update_data = None

    def select(self, cols: str = "*") -> "InMemoryQuery":
        self._action = "select"
        self._select_cols = cols
        return self

    def insert(self, data: Any) -> "InMemoryQuery":
        self._action = "insert"
        self._update_data = data
        return self

    def update(self, data: Dict[str, Any]) -> "InMemoryQuery":
        self._action = "update"
        self._update_data = data
        return self

    def delete(self) -> "InMemoryQuery":
        self._action = "delete"
        return self

    def eq(self, column: str, value: Any) -> "InMemoryQuery":
        self._filters.append((column, value))
        return self

    def order(self, column: str, desc: bool = False) -> "InMemoryQuery":
        self._order_col = column
        self._order_desc = desc
        return self

    def limit(self, count: int) -> "InMemoryQuery":
        self._limit = count
        return self

    def execute(self) -> DBResponse:
        if self._action == "insert":
            return self.table.insert(self._update_data)

        # Apply filters
        matched = []
        for row in self.table.records:
            match = True
            for col, val in self._filters:
                row_val = row.get(col)
                # allow loose comparison (e.g. string vs int for user_id/telegram_id)
                if str(row_val) != str(val):
                    match = False
                    break
            if match:
                matched.append(row)

        if self._action == "update":
            updated = []
            for row in matched:
                row.update(self._update_data)
                updated.append(dict(row))
            return DBResponse(updated)

        if self._action == "delete":
            deleted = []
            for row in matched:
                if row in self.table.records:
                    self.table.records.remove(row)
                    deleted.append(dict(row))
            return DBResponse(deleted)

        # Select action
        res = [dict(r) for r in matched]
        if self._order_col:
            try:
                res.sort(key=lambda x: x.get(self._order_col, ""), reverse=self._order_desc)
            except Exception:
                pass

        if self._limit is not None:
            res = res[:self._limit]

        return DBResponse(res)


class InMemoryClient:
    def __init__(self):
        self._tables: Dict[str, InMemoryTable] = {}

    def table(self, table_name: str):
        if table_name not in self._tables:
            self._tables[table_name] = InMemoryTable(table_name)
        query_obj = self._tables[table_name].query()
        return query_obj


# Initialize real or fallback client
supabase: Any = None
is_mock_db: bool = False

if SUPABASE_URL and SUPABASE_KEY and SUPABASE_KEY.strip():
    try:
        from supabase import create_client, Client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Connected to remote Supabase database successfully.")
    except Exception as e:
        logger.warning(f"Failed to connect to Supabase ({e}). Using resilient in-memory database.")
        supabase = InMemoryClient()
        is_mock_db = True
else:
    logger.info("Supabase credentials not configured in environment. Using in-memory database store.")
    supabase = InMemoryClient()
    is_mock_db = True