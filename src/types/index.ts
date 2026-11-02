export type Language = 'ar' | 'en' | 'am';

export type UserRole = 'super_admin' | 'admin' | 'supervisor' | 'teacher' | 'student';

export interface User {
  id: string;
  telegram_id: number;
  student_code?: string; // IM-XXXX for male, IF-XXXX for female
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
  student_code?: string;
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

export type StudyShift = 'morning' | 'afternoon' | 'night' | 'evening';

export interface RegistrationApplication {
  id: string;
  user_id: string;
  student_code?: string; // e.g. IM-1001 or IF-1001
  student_name: string;
  telegram_id: number;
  program_id: string;
  shift: StudyShift;
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
  assigned_telegram_link?: string;
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
  student_code?: string;
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
  type: 'purchase' | 'session_deduction' | 'bonus' | 'admin_addition' | 'admin_deduction' | 'emergency_borrow';
  minutes_change: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export interface StudentBalance {
  user_id: string;
  student_code?: string; // IM-XXXX or IF-XXXX
  student_name: string;
  telegram_id: number;
  current_minutes: number;
  total_purchased: number;
  total_consumed: number;
  total_bonus: number;
  is_restricted?: boolean; // Restricted/muted in Telegram group due to zero balance
  restriction_reason?: string;
  restricted_at?: string;
  assigned_group_id?: string;
  assigned_group_name?: string;
  assigned_telegram_link?: string;
  borrowed_minutes?: number; // Minutes borrowed if requested
}

export interface QuranGroup {
  id: string;
  name: string;
  group_code?: string; // IM_MORNING, IM_AFTERNOON, IM_NIGHT, IF_MORNING, IF_AFTERNOON, IF_NIGHT, FORUM_MEN, FORUM_WOMEN, FORUM_CENTER
  telegram_chat_id?: string; // Numeric ID: -100...
  program_id: string;
  program_name: string;
  teacher_id: string;
  teacher_name: string;
  gender: 'male' | 'female' | 'all';
  shift: StudyShift | 'all';
  shift_time?: string; // e.g. "09:00 - 12:00"
  current_members_count: number;
  max_members: number;
  telegram_invite_link?: string;
  is_general_forum?: boolean;
  bot_is_admin?: boolean;
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

export type NotificationCategory = 'lesson_reminder' | 'payment_reminder' | 'exam_alert' | 'general';
export type NotificationTargetType = 'all_students' | 'specific_group' | 'low_balance_students' | 'specific_program';
export type NotificationScheduleType = 'before_lesson' | 'recurring_daily' | 'recurring_weekly' | 'low_balance_auto' | 'one_time';

export interface ScheduledNotification {
  id: string;
  title: string;
  category: NotificationCategory;
  message_template: string;
  target_type: NotificationTargetType;
  target_group_id?: string;
  target_program_id?: string;
  low_balance_threshold?: number;
  schedule_type: NotificationScheduleType;
  scheduled_time?: string; // e.g. "17:45" or specific ISO datetime
  lead_time_minutes?: number; // e.g. 15, 30, 60 minutes before
  days_of_week?: number[]; // [0 = Sun, 1 = Mon, ...]
  action_button_text?: string;
  action_button_url?: string;
  status: 'active' | 'paused' | 'completed';
  last_sent_at?: string;
  next_run_at?: string;
  total_dispatched_count: number;
  created_at: string;
  created_by: string;
}

export interface NotificationDispatchLog {
  id: string;
  notification_id: string;
  notification_title: string;
  category: NotificationCategory;
  sent_at: string;
  recipients_count: number;
  success_count: number;
  failed_count: number;
  channel: string;
  message_snippet: string;
}

