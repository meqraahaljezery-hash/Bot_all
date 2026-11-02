"""
Database Connection using Supabase
"""
import os
from supabase import create_client, Client

# جلب المتغيرات من بيئة Render
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("⚠️ خطأ: متغيرات Supabase غير موجودة في البيئة (Environment Variables)!")

# إنشاء عميل الاتصال
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)