export type Language = 'ar' | 'en' | 'am';

export type UserRole = 'super_admin' | 'admin' | 'supervisor' | 'teacher' | 'student';

export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  preferred_language: Language;
  role: UserRole;
  is_active: boolean;
  is_frozen: boolean;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  full_name: string;
  age: string;
  gender: 'male' | 'female';
  country: string;
  city: string;
  current_quran_level: string;
  memorized_amount: string;
  guardian_name?: string;
  guardian_phone?: string;
  notes?: string;
}

export interface EducationalProgram {
  id: string;
  name_ar: string;
  name_en: string;
  name_am: string;
  description_ar: string;
  description_en: string;
  description_am: string;
  objectives_ar: string;
  requirements_ar: string;
  target_audience_ar: string;
  minutes: number;
  is_active: boolean;
  display_order: number;
}

export interface RegistrationApplication {
  id: string;
  user_id: string;
  student_name: string;
  telegram_id: number;
  program_id: string;
  shift: 'morning' | 'evening';
  gender: 'male' | 'female';
  country: string;
  city: string;
  phone: string;
  email?: string;
  quran_level: string;
  riwayah: string;
  suitable_times: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_modification';
  rejection_reason?: string;
  assigned_group_id?: string;
  created_at: string;
}

export interface MinutePackage {
  id: string;
  minutes: number;
  price_etb: number;
  name_ar: string;
  name_en: string;
  name_am: string;
  desc_ar: string;
  is_active: boolean;
}

export interface PaymentMethodConfig {
  id: 'cbe' | 'boa' | 'telebirr' | 'mpesa';
  title_ar: string;
  title_en: string;
  title_am: string;
  beneficiary_name: string;
  account_number: string;
  instructions_ar: string;
  is_active: boolean;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  student_name: string;
  telegram_id: number;
  package_id: string;
  package_name: string;
  minutes: number;
  amount_etb: number;
  method_id: 'cbe' | 'boa' | 'telebirr' | 'mpesa';
  sender_name: string;
  sender_phone: string;
  transaction_ref: string;
  transfer_date: string;
  receipt_image_url?: string;
  idempotency_key: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface BalanceLedgerEntry {
  id: string;
  user_id: string;
  student_name: string;
  type: 'purchase' | 'session_deduction' | 'bonus' | 'admin_addition' | 'admin_deduction';
  minutes_change: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export interface StudentBalance {
  user_id: string;
  student_name: string;
  telegram_id: number;
  current_minutes: number;
  total_purchased: number;
  total_consumed: number;
  total_bonus: number;
}

export interface QuranGroup {
  id: string;
  name: string;
  program_id: string;
  program_name: string;
  teacher_id: string;
  teacher_name: string;
  gender: 'male' | 'female';
  shift: 'morning' | 'evening';
  current_members_count: number;
  max_members: number;
  telegram_invite_link?: string;
  is_active: boolean;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  student_name: string;
  telegram_id: number;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  messages: {
    id: string;
    sender: string;
    is_admin: boolean;
    text: string;
    time: string;
  }[];
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}
