-- ==============================================================================
-- مقرأة الإمام الجزري للإقراء والإجازة بالسند
-- Imam Al-Jazari Quran Recitation and Ijazah Center - Complete Schema
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Central Identity mapped to Telegram User ID)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'ar', -- 'ar', 'en', 'am'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    freeze_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY, -- 'super_admin', 'admin', 'supervisor', 'teacher', 'student'
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'manage_users', 'review_registrations', 'approve_payments', 'manage_balance'
    name_ar VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. User Roles (Supports multiple roles, e.g. super_admin + teacher for khdahd241@gmail.com)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 6. User Profiles (Extended details)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    age INT,
    gender VARCHAR(10) NOT NULL, -- 'male', 'female'
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    current_quran_level VARCHAR(100),
    memorized_amount VARCHAR(100),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Educational Programs
CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(100) PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_am VARCHAR(255) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_am TEXT NOT NULL,
    objectives TEXT,
    requirements TEXT,
    target_audience TEXT,
    default_minutes_required INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Registration Applications (Multi-step student application)
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id VARCHAR(100) NOT NULL REFERENCES programs(id),
    shift VARCHAR(20) NOT NULL, -- 'morning', 'evening'
    gender VARCHAR(10) NOT NULL, -- 'male', 'female'
    riwayah VARCHAR(100),
    suitable_times TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_modification'
    rejection_reason TEXT,
    modification_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);

-- 9. Teachers
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ijazah_details TEXT,
    bio TEXT,
    max_students INT DEFAULT 30,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Educational Groups (Halaqat)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    program_id VARCHAR(100) NOT NULL REFERENCES programs(id),
    teacher_id UUID REFERENCES teachers(id),
    gender VARCHAR(10) NOT NULL, -- 'male', 'female'
    shift VARCHAR(20) NOT NULL, -- 'morning', 'evening'
    country_filter VARCHAR(100),
    max_members INT NOT NULL DEFAULT 20,
    current_members_count INT NOT NULL DEFAULT 0,
    telegram_chat_id BIGINT,
    telegram_invite_link VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Group Members & Enrollments
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id),
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'transferred'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- 12. Packages & Minute Pricing
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(50) PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    minutes INT NOT NULL CHECK (minutes > 0),
    price_etb NUMERIC(10, 2) NOT NULL CHECK (price_etb > 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Payment Methods (CBE, BOA, Telebirr, M-Pesa)
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(50) PRIMARY KEY, -- 'cbe', 'boa', 'telebirr', 'mpesa'
    title_ar VARCHAR(100) NOT NULL,
    title_en VARCHAR(100) NOT NULL,
    title_am VARCHAR(100) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL DEFAULT '',
    account_number VARCHAR(100) NOT NULL DEFAULT '',
    instructions_ar TEXT NOT NULL DEFAULT '',
    instructions_en TEXT NOT NULL DEFAULT '',
    instructions_am TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT FALSE, -- Disabled by default until configured
    display_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Payment Requests & Verification
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id VARCHAR(50) NOT NULL REFERENCES packages(id),
    payment_method_id VARCHAR(50) NOT NULL REFERENCES payment_methods(id),
    minutes INT NOT NULL,
    amount_etb NUMERIC(10, 2) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    transfer_date DATE NOT NULL,
    receipt_image_url TEXT,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL, -- Prevents duplicate approval/processing
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_txref ON payment_requests(transaction_ref);

-- 15. Student Minute Balances
CREATE TABLE IF NOT EXISTS balances (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_minutes INT NOT NULL DEFAULT 0 CHECK (current_minutes >= 0),
    total_purchased_minutes INT NOT NULL DEFAULT 0,
    total_consumed_minutes INT NOT NULL DEFAULT 0,
    total_bonus_minutes INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Financial & Minutes Transaction Ledger (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS balance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL, -- 'purchase', 'session_deduction', 'bonus', 'admin_adjustment', 'refund'
    minutes_change INT NOT NULL, -- positive for additions, negative for deductions
    balance_before INT NOT NULL,
    balance_after INT NOT NULL,
    reason TEXT NOT NULL,
    related_payment_id UUID REFERENCES payment_requests(id),
    performed_by UUID REFERENCES users(id), -- NULL for automated system
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_balance_tx_user ON balance_transactions(user_id);

-- 17. Notifications System
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    title_am VARCHAR(255),
    message_ar TEXT NOT NULL,
    message_en TEXT,
    message_am TEXT,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    telegram_message_id BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 18. Announcements (Broadcasts)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT,
    content_am TEXT,
    target_role VARCHAR(50), -- NULL for all
    target_program_id VARCHAR(100) REFERENCES programs(id),
    target_group_id UUID REFERENCES groups(id),
    sent_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Support Tickets & Thread Messages
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 21. Bot Settings & Official Contact
CREATE TABLE IF NOT EXISTS bot_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
