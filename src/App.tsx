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
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, status: 'approved', assigned_group_id: assignedGroupId }
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

    const reg = registrations.find((r) => r.id === regId);
    logAudit(
      'قبول طلب تسجيل وتعيين حلقة',
      `Registration ${regId}`,
      `تم قبول الطالب ${reg?.student_name} وتعيينه في المجموعة ${assignedGroupId}`
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
              onCreateGroup={handleCreateGroup}
              onUpdateTelegramLink={handleUpdateTelegramLink}
              onToggleGroupStatus={handleToggleGroupStatus}
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
