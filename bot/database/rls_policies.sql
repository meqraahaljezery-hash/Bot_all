-- ==============================================================================
-- مقرأة الإمام الجزري للإقراء والإجازة بالسند
-- Row Level Security (RLS) Policies for Supabase
-- ==============================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is super_admin or admin
CREATE OR REPLACE FUNCTION is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_id IN ('super_admin', 'admin', 'supervisor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users policies
CREATE POLICY "Users can view their own record"
ON users FOR SELECT
USING (auth.uid() = id OR is_admin_or_supervisor());

CREATE POLICY "Users can update their own preferred language"
ON users FOR UPDATE
USING (auth.uid() = id OR is_admin_or_supervisor());

-- 2. User Profiles policies
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id OR is_admin_or_supervisor());

-- 3. Registrations policies
CREATE POLICY "Students can view own registration"
ON registrations FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());

CREATE POLICY "Students can insert own registration"
ON registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update pending registration"
ON registrations FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- 4. Balances policies (CRITICAL: Students CANNOT directly update balances)
CREATE POLICY "Students can view own balance"
ON balances FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());

-- 5. Balance Transactions (Read-only for students, append-only via server)
CREATE POLICY "Students can view own transactions"
ON balance_transactions FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());

-- 6. Payment Requests
CREATE POLICY "Students can view own payment requests"
ON payment_requests FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());

CREATE POLICY "Students can submit payment request"
ON payment_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 7. Groups (Students can ONLY see their assigned group)
CREATE POLICY "Students view only assigned groups"
ON groups FOR SELECT
USING (
    is_admin_or_supervisor() OR
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = groups.id AND gm.student_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM teachers t
        WHERE t.id = groups.teacher_id AND t.user_id = auth.uid()
    )
);

-- 8. Support Tickets
CREATE POLICY "Users view own tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());

CREATE POLICY "Users create own tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 9. Notifications
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id OR is_admin_or_supervisor());
