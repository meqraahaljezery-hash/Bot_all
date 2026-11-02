import React, { useState } from 'react';
import {
  INITIAL_PROGRAMS,
  INITIAL_PACKAGES,
  INITIAL_PAYMENT_METHODS,
  INITIAL_USERS,
  INITIAL_REGISTRATIONS,
  INITIAL_PAYMENT_REQUESTS,
  INITIAL_BALANCES,
  INITIAL_LEDGER,
  INITIAL_GROUPS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SCHEDULED_NOTIFICATIONS,
  INITIAL_NOTIFICATION_LOGS,
} from './data/initialData';
import {
  Language,
  RegistrationApplication,
  PaymentRequest,
  StudentBalance,
  BalanceLedgerEntry,
  QuranGroup,
  EducationalProgram,
  MinutePackage,
  PaymentMethodConfig,
  User,
  SupportTicket,
  AuditLog,
  ScheduledNotification,
  NotificationDispatchLog,
} from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { RegistrationsManager } from './components/RegistrationsManager';
import { PaymentsManager } from './components/PaymentsManager';
import { BalancesLedger } from './components/BalancesLedger';
import { GroupsManager } from './components/GroupsManager';
import { ProgramsManager } from './components/ProgramsManager';
import { PackagesManager } from './components/PackagesManager';
import { PaymentMethodsManager } from './components/PaymentMethodsManager';
import { UsersManager } from './components/UsersManager';
import { SupervisorsManager } from './components/SupervisorsManager';
import { NotificationsManager } from './components/NotificationsManager';
import { AnnouncementsManager } from './components/AnnouncementsManager';
import { SupportManager } from './components/SupportManager';
import { AuditLogView } from './components/AuditLogView';
import { SettingsManager } from './components/SettingsManager';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Application State
  const [programs, setPrograms] = useState<EducationalProgram[]>(INITIAL_PROGRAMS);
  const [packages, setPackages] = useState<MinutePackage[]>(INITIAL_PACKAGES);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(INITIAL_PAYMENT_METHODS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [registrations, setRegistrations] = useState<RegistrationApplication[]>(INITIAL_REGISTRATIONS);
  const [payments, setPayments] = useState<PaymentRequest[]>(INITIAL_PAYMENT_REQUESTS);
  const [balances, setBalances] = useState<StudentBalance[]>(INITIAL_BALANCES);
  const [ledger, setLedger] = useState<BalanceLedgerEntry[]>(INITIAL_LEDGER);
  const [groups, setGroups] = useState<QuranGroup[]>(INITIAL_GROUPS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<ScheduledNotification[]>(INITIAL_SCHEDULED_NOTIFICATIONS);
  const [dispatchLogs, setDispatchLogs] = useState<NotificationDispatchLog[]>(INITIAL_NOTIFICATION_LOGS);

  // Settings State
  const [contactPhone, setContactPhone] = useState('0990161372');
  const [contactEmail, setContactEmail] = useState('kalidahd7@gmil.com');
  const superAdminEmail = 'khdahd241@gmail.com';

  const logAudit = (action: string, entity: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      actor: `المدير العام (${superAdminEmail})`,
      action,
      entity,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1. Approve Registration & Assign Group
  const handleApproveRegistration = (regId: string, assignedGroupId: string) => {
    const assignedGroup = groups.find((g) => g.id === assignedGroupId);
    const reg = registrations.find((r) => r.id === regId);
    
    // Generate sequential student code if not present (IM-XXXX for male, IF-XXXX for female)
    const genderPrefix = reg?.gender === 'female' ? 'IF' : 'IM';
    const codeCount = registrations.filter((r) => r.student_code?.startsWith(genderPrefix)).length + 1001;
    const finalCode = reg?.student_code || `${genderPrefix}-${codeCount}`;

    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? {
              ...r,
              status: 'approved',
              student_code: finalCode,
              assigned_group_id: assignedGroupId,
              assigned_telegram_link: assignedGroup?.telegram_invite_link,
            }
          : r
      )
    );

    // Increment group member count
    setGroups((prev) =>
      prev.map((g) =>
        g.id === assignedGroupId
          ? { ...g, current_members_count: g.current_members_count + 1 }
          : g
      )
    );

    // Also update balances state with student code and group
    setBalances((prev) => {
      const exists = prev.find((b) => b.user_id === reg?.user_id);
      if (exists) {
        return prev.map((b) =>
          b.user_id === reg?.user_id
            ? {
                ...b,
                student_code: finalCode,
                assigned_group_id: assignedGroupId,
                assigned_group_name: assignedGroup?.name,
                assigned_telegram_link: assignedGroup?.telegram_invite_link,
              }
            : b
        );
      }
      return [
        ...prev,
        {
          user_id: reg?.user_id || `usr-${Date.now()}`,
          student_code: finalCode,
          student_name: reg?.student_name || 'طالب جديد',
          telegram_id: reg?.telegram_id || 12345678,
          current_minutes: 0,
          total_purchased: 0,
          total_consumed: 0,
          total_bonus: 0,
          is_restricted: false,
          assigned_group_id: assignedGroupId,
          assigned_group_name: assignedGroup?.name,
          assigned_telegram_link: assignedGroup?.telegram_invite_link,
        },
      ];
    });

    logAudit(
      'قبول طلب تسجيل وتعيين حلقة',
      `Registration ${regId}`,
      `تم قبول الطالب ${reg?.student_name} (كود: ${finalCode}) وتعيينه في المجموعة ${assignedGroup?.name || assignedGroupId}`
    );
  };

  // 2. Reject Registration
  const handleRejectRegistration = (regId: string, reason: string) => {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, status: 'rejected', rejection_reason: reason }
          : r
      )
    );

    logAudit(
      'رفض طلب تسجيل',
      `Registration ${regId}`,
      `السبب: ${reason}`
    );
  };

  // 3. Atomic Payment Approval
  const handleApprovePayment = (paymentId: string) => {
    const pay = payments.find((p) => p.id === paymentId);
    if (!pay || pay.status !== 'pending') return;

    // Check student current balance
    const existingBalance = balances.find((b) => b.user_id === pay.user_id);
    const beforeMinutes = existingBalance ? existingBalance.current_minutes : 0;
    const afterMinutes = beforeMinutes + pay.minutes;

    // Update or insert balance
    if (existingBalance) {
      setBalances((prev) =>
        prev.map((b) =>
          b.user_id === pay.user_id
            ? {
                ...b,
                current_minutes: afterMinutes,
                total_purchased: b.total_purchased + pay.minutes,
              }
            : b
        )
      );
    } else {
      setBalances((prev) => [
        ...prev,
        {
          user_id: pay.user_id,
          student_name: pay.student_name,
          telegram_id: pay.telegram_id,
          current_minutes: afterMinutes,
          total_purchased: pay.minutes,
          total_consumed: 0,
          total_bonus: 0,
        },
      ]);
    }

    // Write immutable ledger entry
    const newLedgerEntry: BalanceLedgerEntry = {
      id: `LED-${Date.now().toString().slice(-4)}`,
      user_id: pay.user_id,
      student_name: pay.student_name,
      type: 'purchase',
      minutes_change: pay.minutes,
      balance_before: beforeMinutes,
      balance_after: afterMinutes,
      reason: `اعتماد سداد باقة ${pay.package_name} (${pay.amount_etb} ETB) - مرجع: ${pay.transaction_ref}`,
      performed_by: `المدير العام (${superAdminEmail})`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setLedger((prev) => [newLedgerEntry, ...prev]);

    // Update payment request status
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'approved',
              reviewed_by: 'المدير العام',
              reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : p
      )
    );

    logAudit(
      'اعتماد دفع وإضافة رصيد ذري',
      `PaymentRequest ${paymentId}`,
      `إضافة ${pay.minutes} دقيقة للطالب ${pay.student_name} (رصيد سابق: ${beforeMinutes} ⬅️ جديد: ${afterMinutes})`
    );
  };

  // 4. Reject Payment
  const handleRejectPayment = (paymentId: string, reason: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'rejected',
              rejection_reason: reason,
              reviewed_by: 'المدير العام',
              reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : p
      )
    );

    logAudit(
      'رفض طلب دفع مالي',
      `PaymentRequest ${paymentId}`,
      `السبب الموثق: ${reason}`
    );
  };

  // 5. Admin Balance Adjustment
  const handleAdjustBalance = (
    userId: string,
    minutesChange: number,
    reason: string,
    isBonus: boolean = false
  ) => {
    const student = balances.find((b) => b.user_id === userId);
    if (!student) return;

    const before = student.current_minutes;
    const after = before + minutesChange;
    if (after < 0) return;

    setBalances((prev) =>
      prev.map((b) =>
        b.user_id === userId
          ? {
              ...b,
              current_minutes: after,
              total_bonus: isBonus ? b.total_bonus + minutesChange : b.total_bonus,
              total_consumed: minutesChange < 0 ? b.total_consumed + Math.abs(minutesChange) : b.total_consumed,
              total_purchased: (!isBonus && minutesChange > 0) ? b.total_purchased + minutesChange : b.total_purchased,
            }
          : b
      )
    );

    const newLedgerEntry: BalanceLedgerEntry = {
      id: `LED-${Date.now().toString().slice(-4)}`,
      user_id: userId,
      student_name: student.student_name,
      type: isBonus ? 'bonus' : minutesChange > 0 ? 'admin_addition' : 'admin_deduction',
      minutes_change: minutesChange,
      balance_before: before,
      balance_after: after,
      reason,
      performed_by: `المدير العام (${superAdminEmail})`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setLedger((prev) => [newLedgerEntry, ...prev]);

    logAudit(
      'تعديل رصيد دقائق',
      `User ${userId}`,
      `${minutesChange > 0 ? 'إضافة' : 'خصم'} ${Math.abs(minutesChange)} دقيقة. السبب: ${reason}`
    );
  };

  // 6. Groups Management
  const handleCreateGroup = (newGroup: Partial<QuranGroup>) => {
    const group: QuranGroup = {
      id: `grp-${Date.now().toString().slice(-4)}`,
      name: newGroup.name || 'حلقة جديدة',
      program_id: newGroup.program_id || 'recitation-correction',
      program_name: newGroup.program_name || '',
      teacher_id: newGroup.teacher_id || 'usr-1',
      teacher_name: newGroup.teacher_name || 'الشيخ المشرف',
      gender: newGroup.gender || 'male',
      shift: newGroup.shift || 'morning',
      current_members_count: 0,
      max_members: newGroup.max_members || 15,
      telegram_invite_link: newGroup.telegram_invite_link,
      is_active: true,
    };
    setGroups((prev) => [...prev, group]);
    logAudit('إنشاء حلقة جديدة', `Group ${group.id}`, `اسم الحلقة: ${group.name}`);
  };

  const handleUpdateTelegramLink = (groupId: string, newLink: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, telegram_invite_link: newLink } : g))
    );
    logAudit('تحديث رابط تيليجرام للحلقة', `Group ${groupId}`, `رابط جديد: ${newLink}`);
  };

  const handleToggleGroupStatus = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, is_active: !g.is_active } : g))
    );
  };

  // Telegram Group Moderation & Balance Handlers
  const handleRestrictStudent = (userId: string, reason: string) => {
    const student = balances.find((b) => b.user_id === userId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setBalances((prev) =>
      prev.map((b) =>
        b.user_id === userId
          ? { ...b, is_restricted: true, restriction_reason: reason, restricted_at: nowStr }
          : b
      )
    );
    logAudit(
      'تقييد طالب في مجموعة التيليجرام',
      `User ${userId}`,
      `تم تقييد الطالب ${student?.student_name} في مجموعته بسبب: ${reason}`
    );
  };

  const handleUnrestrictStudent = (userId: string) => {
    const student = balances.find((b) => b.user_id === userId);
    setBalances((prev) =>
      prev.map((b) =>
        b.user_id === userId
          ? { ...b, is_restricted: false, restriction_reason: undefined, restricted_at: undefined }
          : b
      )
    );
    logAudit(
      'رفع التقييد واستعادة صلاحيات الطالب في التيليجرام',
      `User ${userId}`,
      `تم رفع الحظر والتقييد عن الطالب ${student?.student_name} واستعادة صلاحيات الكتابة والمشاركة الصوتية`
    );
  };

  const handleBorrowMinutes = (userId: string, minutes: number = 30) => {
    const student = balances.find((b) => b.user_id === userId);
    if (!student) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const before = student.current_minutes;
    const after = before + minutes;

    setBalances((prev) =>
      prev.map((b) =>
        b.user_id === userId
          ? {
              ...b,
              current_minutes: after,
              borrowed_minutes: (b.borrowed_minutes || 0) + minutes,
              is_restricted: false,
              restriction_reason: undefined,
              restricted_at: undefined,
            }
          : b
      )
    );

    const newEntry: BalanceLedgerEntry = {
      id: `LED-${Date.now().toString().slice(-4)}`,
      user_id: userId,
      student_name: student.student_name,
      type: 'emergency_borrow',
      minutes_change: minutes,
      balance_before: before,
      balance_after: after,
      reason: `منح استلاف رصيد طوارئ (+${minutes} دقيقة) لرفع الحظر عن المجموعة وتمكين الطالب من الحضور`,
      performed_by: `المدير العام (${superAdminEmail})`,
      created_at: nowStr,
    };
    setLedger((prev) => [newEntry, ...prev]);

    logAudit(
      'منح استلاف رصيد طوارئ وفك الحظر',
      `User ${userId}`,
      `إضافة ${minutes} دقيقة استلاف للطالب ${student.student_name} ورفع تقييد المجموعة`
    );
  };

  const handleSendLowBalanceWarning = (userId: string) => {
    const student = balances.find((b) => b.user_id === userId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLog: NotificationDispatchLog = {
      id: `nlog-${Date.now()}`,
      notification_id: 'notif-low-balance-auto',
      notification_title: 'تنبيه آلي خاص: قرب نفاد الرصيد وتفادي تقييد المجموعة',
      category: 'payment_reminder',
      sent_at: nowStr,
      recipients_count: 1,
      success_count: 1,
      failed_count: 0,
      channel: 'Telegram Direct Message API',
      message_snippet: `تنبيه خاص للطالب ${student?.student_name} (الكود: ${student?.student_code || 'IM-1001'}) بالرصيد المتبقي ${student?.current_minutes} دقيقة.`,
    };
    setDispatchLogs((prev) => [newLog, ...prev]);
    logAudit(
      'إرسال تنبيه نفاذ رصيد خاص',
      `User ${userId}`,
      `تم إرسال إشعار تحذيري للطالب ${student?.student_name} لتفادي تقييد التيليجرام`
    );
  };

  const handleTriggerLessonReminder = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLog: NotificationDispatchLog = {
      id: `nlog-${Date.now()}`,
      notification_id: `notif-manual-${groupId}`,
      notification_title: `تذكير درس بمشاعر إيمانية: ${group?.name}`,
      category: 'lesson_reminder',
      sent_at: nowStr,
      recipients_count: group?.current_members_count || 8,
      success_count: group?.current_members_count || 8,
      failed_count: 0,
      channel: 'Telegram Bot Group Broadcast API',
      message_snippet: `🌿 أقبلوا إلى مائدة القرآن ونور الفرقان... تذكير موعد حلقة ${group?.name} (${group?.shift_time || 'الدرس اليومي'}).`,
    };
    setDispatchLogs((prev) => [newLog, ...prev]);
    logAudit(
      'بث تذكير درس للمجموعة',
      `Group ${groupId}`,
      `إرسال تذكير بكلمات طيبة لمجموعة ${group?.name}`
    );
  };

  // 7. Payment Methods Management
  const handleUpdatePaymentMethod = (updated: PaymentMethodConfig) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    logAudit(
      'تحديث وسيلة دفع',
      `PaymentMethod ${updated.id.toUpperCase()}`,
      `الحساب: ${updated.account_number} | المستفيد: ${updated.beneficiary_name} | الحالة: ${updated.is_active ? 'مفعلة' : 'معطلة'}`
    );
  };

  // 8. Package Pricing Update
  const handleUpdatePackagePrice = (packageId: string, newPrice: number) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === packageId ? { ...p, price_etb: newPrice } : p))
    );
    logAudit('تعديل سعر باقة دقائق', `Package ${packageId}`, `السعر الجديد: ${newPrice} ETB`);
  };

  // 9. Support Ticket Reply
  const handleReplyTicket = (ticketId: string, replyText: string) => {
    setTickets((prev) =>
      prev.map((tkt) =>
        tkt.id === ticketId
          ? {
              ...tkt,
              messages: [
                ...tkt.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'إدارة المقرأة',
                  is_admin: true,
                  text: replyText,
                  time: 'الآن',
                },
              ],
            }
          : tkt
      )
    );
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
  };

  // 10. User Freeze / Unfreeze
  const handleToggleFreezeUser = (userId: string, reason?: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_frozen: !u.is_frozen } : u))
    );
    logAudit('تغيير حالة تجميد الحساب', `User ${userId}`, reason || 'تحديث إداري');
  };

  // 11. Automated Notifications Handlers
  const handleAddNotification = (newNotif: ScheduledNotification) => {
    setNotifications((prev) => [newNotif, ...prev]);
    logAudit('جدولة إشعار آلي جديد', `Notification ${newNotif.id}`, `العنوان: ${newNotif.title}`);
  };

  const handleUpdateNotification = (updated: ScheduledNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    logAudit('تعديل إشعار مجدول', `Notification ${updated.id}`, `العنوان: ${updated.title}`);
  };

  const handleDeleteNotification = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    logAudit('حذف إشعار مجدول', `Notification ${notifId}`, `تم حذف: ${notif?.title || notifId}`);
  };

  const handleTriggerNotification = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId);
    if (!notif) return;

    let targetCount = 1;
    if (notif.target_type === 'specific_group') {
      const g = groups.find((grp) => grp.id === notif.target_group_id);
      targetCount = g?.current_members_count || 8;
    } else if (notif.target_type === 'low_balance_students') {
      const threshold = notif.low_balance_threshold || 30;
      targetCount = balances.filter((b) => b.current_minutes <= threshold).length || 3;
    } else if (notif.target_type === 'all_students') {
      targetCount = users.filter((u) => u.role === 'student').length || balances.length;
    } else if (notif.target_type === 'specific_program') {
      targetCount = 6;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Update notification last_sent_at and total count
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId
          ? {
              ...n,
              last_sent_at: nowStr,
              total_dispatched_count: n.total_dispatched_count + targetCount,
            }
          : n
      )
    );

    // Add log
    const newLog: NotificationDispatchLog = {
      id: `nlog-${Date.now()}`,
      notification_id: notif.id,
      notification_title: notif.title,
      category: notif.category,
      sent_at: nowStr,
      recipients_count: targetCount,
      success_count: targetCount,
      failed_count: 0,
      channel: 'Telegram Bot Push API',
      message_snippet: notif.message_template.slice(0, 75) + '...',
    };
    setDispatchLogs((prev) => [newLog, ...prev]);

    logAudit(
      'تشغيل وبث إشعار آلي فوري',
      `Notification ${notif.id}`,
      `تم إرسال "${notif.title}" إلى ${targetCount} طالب عبر التيليجرام بنجاح`
    );
  };

  const handleToggleNotificationStatus = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId
          ? { ...n, status: n.status === 'active' ? 'paused' : 'active' }
          : n
      )
    );
    const notif = notifications.find((n) => n.id === notifId);
    logAudit(
      'تغيير حالة الإشعار المجدول',
      `Notification ${notifId}`,
      notif?.status === 'active' ? 'إيقاف مؤقت' : 'استئناف وتفعيل'
    );
  };


  const pendingRegistrationsCount = registrations.filter((r) => r.status === 'pending').length;
  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'open').length;
  const teachersList = users.filter((u) => u.role === 'teacher' || u.role === 'super_admin');

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-['Cairo',sans-serif] flex flex-col">
      {/* Top Brand Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenSimulator={() => setActiveTab('bot_simulator')}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingRegistrationsCount={pendingRegistrationsCount}
          pendingPaymentsCount={pendingPaymentsCount}
          openTicketsCount={openTicketsCount}
        />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              users={users}
              registrations={registrations}
              payments={payments}
              groups={groups}
              programs={programs}
              balances={balances}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'registrations' && (
            <RegistrationsManager
              registrations={registrations}
              groups={groups}
              programs={programs}
              onApprove={handleApproveRegistration}
              onReject={handleRejectRegistration}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsManager
              payments={payments}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
            />
          )}

          {activeTab === 'balances' && (
            <BalancesLedger
              balances={balances}
              ledger={ledger}
              onAdjustBalance={handleAdjustBalance}
            />
          )}

          {activeTab === 'groups' && (
            <GroupsManager
              groups={groups}
              teachers={teachersList}
              programs={programs}
              balances={balances}
              onCreateGroup={handleCreateGroup}
              onUpdateTelegramLink={handleUpdateTelegramLink}
              onToggleGroupStatus={handleToggleGroupStatus}
              onRestrictStudent={handleRestrictStudent}
              onUnrestrictStudent={handleUnrestrictStudent}
              onBorrowMinutes={handleBorrowMinutes}
              onSendLowBalanceWarning={handleSendLowBalanceWarning}
              onTriggerLessonReminder={handleTriggerLessonReminder}
            />
          )}

          {activeTab === 'programs' && (
            <ProgramsManager
              programs={programs}
              onToggleProgramStatus={(id) =>
                setPrograms((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
                )
              }
              onUpdateProgram={(updated) =>
                setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
              onCreateProgram={(created) => setPrograms((prev) => [...prev, created])}
            />
          )}

          {activeTab === 'packages' && (
            <PackagesManager
              packages={packages}
              onUpdatePackagePrice={handleUpdatePackagePrice}
              onTogglePackageStatus={(id) =>
                setPackages((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
                )
              }
            />
          )}

          {activeTab === 'payment_methods' && (
            <PaymentMethodsManager
              methods={paymentMethods}
              onUpdateMethod={handleUpdatePaymentMethod}
            />
          )}

          {activeTab === 'users' && (
            <UsersManager
              users={users}
              onToggleFreeze={handleToggleFreezeUser}
            />
          )}

          {activeTab === 'supervisors' && (
            <SupervisorsManager users={users} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsManager
              notifications={notifications}
              onAddNotification={handleAddNotification}
              onUpdateNotification={handleUpdateNotification}
              onDeleteNotification={handleDeleteNotification}
              onTriggerNotification={handleTriggerNotification}
              onToggleStatus={handleToggleNotificationStatus}
              dispatchLogs={dispatchLogs}
              groups={groups}
              programs={programs}
              balances={balances}
              users={users}
              contactPhone={contactPhone}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsManager
              programs={programs}
              totalStudentsCount={users.length}
            />
          )}

          {activeTab === 'support' && (
            <SupportManager
              tickets={tickets}
              onReplyTicket={handleReplyTicket}
              onResolveTicket={handleResolveTicket}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView logs={auditLogs} />
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              superAdminEmail={superAdminEmail}
              onUpdateContacts={(p, e) => {
                setContactPhone(p);
                setContactEmail(e);
                logAudit('تحديث بيانات التواصل الرسمية', 'Settings', `هاتف: ${p} | بريد: ${e}`);
              }}
            />
          )}

          {activeTab === 'bot_simulator' && (
            <TelegramBotSimulator />
          )}
        </main>
      </div>
    </div>
  );
}
