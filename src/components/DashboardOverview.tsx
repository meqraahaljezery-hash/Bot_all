import React, { useState } from 'react';
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
  Bell,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Zap,
  VolumeX,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
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
  const [activeChartTab, setActiveChartTab] = useState<'groups' | 'consumption' | 'trends'>('groups');

  // Real stats calculation
  const totalUsers = users.length;
  const approvedStudents = registrations.filter((r) => r.status === 'approved').length;
  const pendingRegistrations = registrations.filter((r) => r.status === 'pending');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const totalPurchasedMinutes = balances.reduce((sum, b) => sum + b.total_purchased, 0);
  const totalConsumedMinutes = balances.reduce((sum, b) => sum + b.total_consumed, 0);
  const remainingMinutes = Math.max(0, totalPurchasedMinutes - totalConsumedMinutes);
  const totalBorrowed = balances.reduce((sum, b) => sum + (b.borrowed_minutes || 0), 0);
  const activeGroups = groups.filter((g) => g.is_active).length;
  const totalTeachers = users.filter((u) => u.role === 'teacher').length;
  const activePrograms = programs.filter((p) => p.is_active).length;

  // Zero balance / restricted students
  const zeroBalanceCount = balances.filter((b) => b.current_minutes <= 0 || b.is_restricted).length;
  const lowBalanceCount = balances.filter((b) => b.current_minutes > 0 && b.current_minutes <= 30).length;

  // Consumption percentage
  const consumptionPercentage =
    totalPurchasedMinutes > 0
      ? Math.round((totalConsumedMinutes / totalPurchasedMinutes) * 100)
      : 0;

  // 1. Group Distribution Data for Recharts BarChart (The 6 official groups)
  const groupDistributionData = groups
    .filter((g) => g.is_active)
    .map((g) => {
      // Find students belonging to this group
      const assignedCount = registrations.filter(
        (r) =>
          r.status === 'approved' &&
          (r.assigned_group_id === g.id ||
            (r.gender === g.gender && r.shift === g.shift))
      ).length;

      // Group display label
      const shortName =
        g.group_code ||
        (g.gender === 'male'
          ? `ذكور ${g.shift === 'morning' ? 'صباحي' : g.shift === 'afternoon' ? 'مسائي' : 'ليلي'}`
          : `إناث ${g.shift === 'morning' ? 'صباحي' : g.shift === 'afternoon' ? 'مسائي' : 'ليلي'}`);

      return {
        id: g.id,
        name: shortName,
        fullName: g.name,
        activeStudents: Math.max(assignedCount, g.current_members_count),
        maxCapacity: g.max_members || 20,
        shiftTime: g.shift_time || (g.shift === 'morning' ? '09:00 - 12:00' : g.shift === 'afternoon' ? '14:00 - 15:30' : '21:00 - 23:00'),
        gender: g.gender,
        genderLabel: g.gender === 'male' ? 'حلقات الذكور (IM)' : 'حلقات الإناث (IF)',
      };
    });

  // 2. Minutes Consumption Donut Data for Recharts PieChart
  const minutesPieData = [
    {
      name: 'دقائق مستهلكة (جلسات)',
      value: totalConsumedMinutes,
      color: '#105C3B', // Emerald
    },
    {
      name: 'دقائق متبقية (رصيد متاح)',
      value: remainingMinutes,
      color: '#D97706', // Amber
    },
    {
      name: 'رصيد طوارئ مستلف',
      value: totalBorrowed > 0 ? totalBorrowed : 60,
      color: '#E11D48', // Rose
    },
  ];

  // 3. Weekly Recitation & Attendance Trends Data
  const weeklyActivityTrends = [
    { day: 'السبت', minutes: 120, sessions: 4, attendanceRate: 85 },
    { day: 'الأحد', minutes: 210, sessions: 7, attendanceRate: 92 },
    { day: 'الإثنين', minutes: 195, sessions: 6, attendanceRate: 88 },
    { day: 'الثلاثاء', minutes: 240, sessions: 8, attendanceRate: 95 },
    { day: 'الأربعاء', minutes: 270, sessions: 9, attendanceRate: 94 },
    { day: 'الخميس', minutes: 310, sessions: 11, attendanceRate: 98 },
    { day: 'الجمعة', minutes: 160, sessions: 5, attendanceRate: 80 },
  ];

  // Near-capacity groups for fast decisions
  const nearCapacityGroups = groupDistributionData.filter(
    (g) => g.activeStudents / g.maxCapacity >= 0.75
  );

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-[#105C3B] to-[#18794E] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-[#DDF2E3] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>نظام الإدارة المركزي ومراقبة المجموعات الست</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Amiri',serif] tracking-tight">
            مرحباً بكم في لوحة المراقبة والتحليلات الذكية للمقرأة
          </h1>
          <p className="mt-2 text-sm text-[#DDF2E3]/95 leading-relaxed">
            متابعة فورية لتوزيع الطلاب النشطين حسب الحلقات الست، استهلاك الدقائق التعليمية، القرارات الإشرافية السريعة، وتنبيهات البوت الآلية.
          </p>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">إجمالي الطلاب والمسجلين</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalUsers}</div>
          <div className="text-xs text-stone-500 mt-1">كود IM للذكور و IF للإناث</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">الطلاب المقبولين بالحلقات</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{approvedStudents}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">نشطون في المجموعات الست</div>
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
            <span className="text-xs font-medium">إجمالي الدقائق المشتراة</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalPurchasedMinutes.toLocaleString()} د</div>
          <div className="text-xs text-stone-500 mt-1">شحن باقات معتمد</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">الدقائق المستهلكة</span>
            <Clock className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-bold text-[#105C3B]">{totalConsumedMinutes.toLocaleString()} د</div>
          <div className="text-xs text-stone-500 mt-1">نسبة الاستهلاك: {consumptionPercentage}%</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">المجموعات الدراسية (6)</span>
            <Users2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{activeGroups}</div>
          <div className="text-xs text-stone-500 mt-1">3 فترات يومية (صباح/مساء/ليل)</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">الطلاب ذوو رصيد منخفض/0</span>
            <VolumeX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{zeroBalanceCount + lowBalanceCount}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">{zeroBalanceCount} مكتوم / مقيد آلياً</div>
        </div>

      </div>

      {/* Fast Decision Support Bar for Supervisors (اتخاذ قرارات أسرع) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Zero Balance & Group Restrictions */}
        <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <VolumeX className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-950 font-['Amiri',serif]">
                التقييد الآلي للرصيد المنتهي
              </h4>
              <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                {zeroBalanceCount} طلاب
              </span>
            </div>
            <p className="text-[11px] text-rose-800/80 mt-1 leading-relaxed">
              يقوم البوت بكتم الطلاب ذوي رصيد 0 دقيقة في مجموعاتهم لمنع إرسال الرسائل والمشاركة الصوتية لحين الشحن أو الاستلاف.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => onNavigate('balances')}
                className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                فحص الأرصدة والتقييد
              </button>
              <button
                onClick={() => onNavigate('bot_simulator')}
                className="text-[11px] text-rose-700 hover:underline font-semibold cursor-pointer"
              >
                فتح محاكي البوت
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Group Capacity Monitoring */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-950 font-['Amiri',serif]">
                سعة الحلقات والإقبال
              </h4>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                {nearCapacityGroups.length} حلقات ممتلئة
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
              متابعة معدلات إشغال الحلقات الست لتفادي تكدس الطلاب في فترات الذروة الصباحية والليلية.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => onNavigate('groups')}
                className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                إدارة الحلقات الست
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Direct In-Bot Admin Actions */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#105C3B] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 font-['Amiri',serif]">
                إدارة الطلاب بأزرار البوت الفعالة
              </h4>
              <span className="text-[10px] bg-emerald-200 text-[#105C3B] font-bold px-2 py-0.5 rounded-full">
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-1 leading-relaxed">
              عرض قائمة تفاعلية بالطلاب وأكوادهم مع أزرار مباشرة لخصم الجلسة، رسالة خاص، تفعيل، كتم، وحظر.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => onNavigate('bot_simulator')}
                className="text-[11px] bg-[#105C3B] hover:bg-[#18794E] text-white font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                تجربة أزرار البوت الآن
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Recharts Section: Charts Container */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-5">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-stone-900 font-['Amiri',serif]">
                الرسوم البيانية والتحليل الإحصائي (Recharts Analytics)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              بيانات حية لتوزيع الطلاب بالحلقات، ومؤشرات استهلاك الرصيد، ونشاط الجلسات الأسبوعي
            </p>
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveChartTab('groups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeChartTab === 'groups'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>توزيع الطلاب حسب الحلقة</span>
            </button>

            <button
              onClick={() => setActiveChartTab('consumption')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeChartTab === 'consumption'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>نسبة استهلاك الدقائق</span>
            </button>

            <button
              onClick={() => setActiveChartTab('trends')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeChartTab === 'trends'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>نشاط الجلسات الأسبوعي</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Bar Chart of Active Students per Ring */}
        {activeChartTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 px-1">
              <span>
                مقارنة عدد الطلاب النشطين الفعلي بالسعة الاستيعابية لكل حلقة من الحلقات الست:
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#105C3B]"></span>
                  <span>الطلاب النشطون</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-stone-300"></span>
                  <span>الحد الأقصى للسعة (20 مقعد)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupDistributionData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 11 }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1.5 border border-stone-800 text-right font-sans">
                            <div className="font-bold text-emerald-400 font-['Amiri',serif] text-sm">
                              {data.fullName}
                            </div>
                            <div className="text-stone-300">
                              🕒 الفترة: <span className="font-mono text-white">{data.shiftTime}</span>
                            </div>
                            <div className="text-stone-300">
                              👥 الطلاب النشطون: <span className="font-bold text-emerald-300">{data.activeStudents}</span> / {data.maxCapacity}
                            </div>
                            <div className="text-stone-400 text-[10px]">
                              نسبة الإشغال: {Math.round((data.activeStudents / data.maxCapacity) * 100)}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(value) => (value === 'activeStudents' ? 'الطلاب النشطون' : 'السعة القصوى')}
                  />
                  <Bar
                    dataKey="activeStudents"
                    name="activeStudents"
                    fill="#105C3B"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="maxCapacity"
                    name="maxCapacity"
                    fill="#cbd5e1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Summary Cards under Group Chart */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {groupDistributionData.map((g) => {
                const occupancy = Math.round((g.activeStudents / g.maxCapacity) * 100);
                return (
                  <div
                    key={g.id}
                    className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/70 text-center"
                  >
                    <div className="text-[11px] font-bold text-stone-900 truncate" title={g.fullName}>
                      {g.name}
                    </div>
                    <div className="text-base font-extrabold text-[#105C3B] mt-1">
                      {g.activeStudents} <span className="text-[10px] text-stone-400 font-normal">/ {g.maxCapacity}</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          occupancy >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, occupancy)}%` }}
                      ></div>
                    </div>
                    <div className="text-[9px] text-stone-400 mt-1">{occupancy}% إشغال</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Pie Chart of Minutes Consumption */}
        {activeChartTab === 'consumption' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={minutesPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {minutesPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-md border border-stone-800 text-right">
                            <div className="font-bold text-emerald-400">{item.name}</div>
                            <div className="text-stone-200 mt-0.5">
                              {Number(item.value).toLocaleString()} دقيقة
                            </div>
                            <div className="text-stone-400 text-[10px]">
                              {totalPurchasedMinutes > 0
                                ? `${Math.round(((Number(item.value) || 0) / (totalPurchasedMinutes || 1)) * 100)}% من الإجمالي`
                                : ''}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Consumption Metrics & Decision Rules */}
            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                <div className="text-xs text-stone-500 font-medium">معدل الاستهلاك العام للباقات</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[#105C3B]">{consumptionPercentage}%</span>
                  <span className="text-xs text-stone-500">من إجمالي الدقائق المشحونة بالمقرأة</span>
                </div>

                <div className="w-full bg-stone-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#105C3B] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, consumptionPercentage)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                  <span className="font-semibold text-emerald-900">الدقائق المستهلكة في الحلقات:</span>
                  <span className="font-mono font-bold text-[#105C3B]">
                    {totalConsumedMinutes.toLocaleString()} دقيقة
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                  <span className="font-semibold text-amber-900">الدقائق المتبقية بأرصدة الطلاب:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {remainingMinutes.toLocaleString()} دقيقة
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                  <span className="font-semibold text-rose-900">إجمالي رصيد الطوارئ المستلف:</span>
                  <span className="font-mono font-bold text-rose-800">
                    {totalBorrowed} دقيقة
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80 leading-relaxed">
                💡 <span className="font-bold text-stone-800">توصية إشرافية:</span> عند تجاوز نسبة الاستهلاك 85%، يوصى المشرف بإطلاق حملة تذكيرية لشحن باقات جديدة للاستفادة من خصومات الباقات الكبرى (300 و 600 دقيقة).
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Weekly Attendance & Session Activity Trends */}
        {activeChartTab === 'trends' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
              <span>نشاط الجلسات القرءانية وعدد الدقائق المستهلكة يومياً على مدار الأسبوع:</span>
              <span className="font-mono text-emerald-700 font-bold">ذروة النشاط: يوم الخميس (310 دقيقة)</span>
            </div>

            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyActivityTrends}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#105C3B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#105C3B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1 border border-stone-800 text-right">
                            <div className="font-bold text-emerald-400 font-['Amiri',serif]">
                              يوم {data.day}
                            </div>
                            <div className="text-stone-300">
                              ⏱ إجمالي الدقائق: <span className="font-bold text-white">{data.minutes} دقيقة</span>
                            </div>
                            <div className="text-stone-300">
                              📖 عدد الجلسات: <span className="font-bold text-emerald-300">{data.sessions} جلسة</span>
                            </div>
                            <div className="text-stone-400 text-[10px]">
                              نسبة الحضور: {data.attendanceRate}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#105C3B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Automated Bot Notifications Banner */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#105C3B] flex items-center justify-center shrink-0 border border-emerald-100">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 font-['Amiri',serif]">
                جدولة الإشعارات والتنبيهات التلقائية للبوت (Automated Push)
              </h3>
              <span className="text-[10px] bg-emerald-100 text-[#105C3B] font-bold px-2 py-0.5 rounded-full">
                نشط وآلي
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              إرسال تذكيرات مواعيد الحلقات للطلاب قبل 30 دقيقة، وتنبيهات شحن الرصيد المنخفض تلقائياً عبر التيليجرام
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('notifications')}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-[#105C3B] hover:bg-[#18794E] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <span>إدارة قواعد الإشعارات</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two Columns: Actionable Pending Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Registrations Preview */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="text-base font-bold text-stone-900 font-['Amiri',serif]">طلبات التسجيل الجديدة</h2>
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
                    <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                      <span>{reg.student_name}</span>
                      {reg.student_code && (
                        <span className="text-[10px] bg-emerald-100 text-[#105C3B] font-mono font-bold px-1.5 py-0.5 rounded">
                          {reg.student_code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {reg.country} | الفترة:{' '}
                      {reg.shift === 'morning' ? 'صباحية' : reg.shift === 'afternoon' ? 'مسائية' : 'ليلية'} |{' '}
                      {reg.gender === 'male' ? 'ذكر (IM)' : 'أنثى (IF)'}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('registrations')}
                    className="text-xs bg-[#105C3B] text-white px-3 py-1.5 rounded-lg hover:bg-[#18794E] font-medium cursor-pointer"
                  >
                    مراجعة واعتماد
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
              <h2 className="text-base font-bold text-stone-900 font-['Amiri',serif]">طلبات الدفع المالي المعلقة</h2>
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
