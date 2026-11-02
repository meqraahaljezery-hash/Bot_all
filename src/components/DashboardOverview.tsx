import React from 'react';
import {
  Users,
  GraduationCap,
  Clock,
  CreditCard,
  BookOpen,
  Users2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  User,
  RegistrationApplication,
  PaymentRequest,
  QuranGroup,
  EducationalProgram,
  StudentBalance,
} from '../types';
import { NavTab } from './Sidebar';

interface DashboardOverviewProps {
  users: User[];
  registrations: RegistrationApplication[];
  payments: PaymentRequest[];
  groups: QuranGroup[];
  programs: EducationalProgram[];
  balances: StudentBalance[];
  onNavigate: (tab: NavTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  users,
  registrations,
  payments,
  groups,
  programs,
  balances,
  onNavigate,
}) => {
  // Real stats calculation
  const totalUsers = users.length;
  const approvedStudents = registrations.filter((r) => r.status === 'approved').length;
  const pendingRegistrations = registrations.filter((r) => r.status === 'pending');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const totalPurchasedMinutes = balances.reduce((sum, b) => sum + b.total_purchased, 0);
  const totalConsumedMinutes = balances.reduce((sum, b) => sum + b.total_consumed, 0);
  const activeGroups = groups.filter((g) => g.is_active).length;
  const totalTeachers = users.filter((u) => u.role === 'teacher').length;
  const activePrograms = programs.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-[#105C3B] to-[#18794E] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-[#DDF2E3] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>نظام الإدارة المركزي المستقل</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Amiri',serif] tracking-tight">
            مرحباً بكم في لوحة تحكم مقرأة الإمام الجزري للإقراء
          </h1>
          <p className="mt-2 text-sm text-[#DDF2E3]/95 leading-relaxed">
            متابعة فورية لطلبات التسجيل، اعتمادات الدفع اليدوي، توزيع الحلقات، الدفتر المالي الذري، ومحاكي البوت الحي.
          </p>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">إجمالي المستخدمين</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalUsers}</div>
          <div className="text-xs text-stone-500 mt-1">مسجلين في البوت</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">الطلاب المقبولين</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{approvedStudents}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">ملتحقين بالحلقات</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs cursor-pointer hover:border-amber-300 transition-colors" onClick={() => onNavigate('registrations')}>
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">طلبات تسجيل معلقة</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingRegistrations.length}</div>
          <div className="text-xs text-stone-500 mt-1">تتطلب فحص واعتماد</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs cursor-pointer hover:border-rose-300 transition-colors" onClick={() => onNavigate('payments')}>
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">طلبات دفع معلقة</span>
            <CreditCard className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{pendingPayments.length}</div>
          <div className="text-xs text-stone-500 mt-1">تحويلات تتطلب التدقيق</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">الدقائق المشتراة</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalPurchasedMinutes.toLocaleString()}</div>
          <div className="text-xs text-stone-500 mt-1">إجمالي مشحون</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">الدقائق المستهلكة</span>
            <Clock className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalConsumedMinutes.toLocaleString()}</div>
          <div className="text-xs text-stone-500 mt-1">حصص وتسميع منجز</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">المجموعات النشطة</span>
            <Users2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activeGroups}</div>
          <div className="text-xs text-stone-500 mt-1">حلقات قرآنية قائمة</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">البرامج التعليمية</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activePrograms}</div>
          <div className="text-xs text-stone-500 mt-1">{totalTeachers} مشايخ معلمين</div>
        </div>

      </div>

      {/* Two Columns: Actionable Pending Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Registrations Preview */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="text-base font-bold text-stone-900">طلبات التسجيل الجديدة</h2>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {pendingRegistrations.length}
              </span>
            </div>
            <button
              onClick={() => onNavigate('registrations')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              لا توجد طلبات تسجيل معلقة حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRegistrations.slice(0, 3).map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 rounded-lg border border-stone-100 bg-stone-50/70 flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-semibold text-stone-900">{reg.student_name}</div>
                    <div className="text-xs text-stone-500">
                      {reg.country} | الفترة: {reg.shift === 'morning' ? 'صباحية' : 'مسائية'} | {reg.riwayah}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('registrations')}
                    className="text-xs bg-[#105C3B] text-white px-3 py-1.5 rounded-lg hover:bg-[#18794E] font-medium cursor-pointer"
                  >
                    مراجعة
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Payments Preview */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h2 className="text-base font-bold text-stone-900">طلبات الدفع المالي المعلقة</h2>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                {pendingPayments.length}
              </span>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              جميع طلبات الدفع تمت مراجعتها واعتمادها.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.slice(0, 3).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-lg border border-stone-100 bg-stone-50/70 flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-semibold text-stone-900">{pay.student_name}</div>
                    <div className="text-xs text-stone-500">
                      {pay.package_name} ({pay.amount_etb} ETB) | بنك: {pay.method_id.toUpperCase()}
                    </div>
                    <div className="text-[11px] font-mono text-stone-400">
                      المرجع: {pay.transaction_ref}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('payments')}
                    className="text-xs bg-[#105C3B] text-white px-3 py-1.5 rounded-lg hover:bg-[#18794E] font-medium cursor-pointer"
                  >
                    تدقيق واعتماد
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
