import React, { useState } from 'react';
import { User, StudentBalance, RegistrationApplication, QuranGroup } from '../types';
import {
  Users,
  Search,
  Clock,
  Award,
  Ban,
  PauseCircle,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
  Sparkles,
  ExternalLink,
  BookOpen,
  Calendar,
  AlertTriangle,
  History,
  X,
  UserCheck
} from 'lucide-react';

interface SupervisorStudentsManagerProps {
  users: User[];
  registrations: RegistrationApplication[];
  balances: StudentBalance[];
  groups: QuranGroup[];
  onDeductMinutes: (userId: string, minutes: number, reason: string) => void;
  onRewardMinutes: (userId: string, minutes: number, reason: string) => void;
  onFreezeStudent: (userId: string, reason?: string) => void;
  onBanStudent: (userId: string, reason?: string) => void;
  onActivateStudent: (userId: string) => void;
}

export const SupervisorStudentsManager: React.FC<SupervisorStudentsManagerProps> = ({
  users,
  registrations,
  balances,
  groups,
  onDeductMinutes,
  onRewardMinutes,
  onFreezeStudent,
  onBanStudent,
  onActivateStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Dialog state for deduct / reward
  const [actionType, setActionType] = useState<'deduct' | 'reward' | null>(null);
  const [actionMinutes, setActionMinutes] = useState<number>(20);
  const [actionReason, setActionReason] = useState<string>('');

  // Extract all students (users with role 'student' or who have registrations)
  const studentsList = users.filter((u) => u.role === 'student' || registrations.some(r => r.user_id === u.id || r.telegram_id === u.telegram_id));

  // Merge each student with registration and balance info
  const enhancedStudents = studentsList.map((st) => {
    const reg = registrations.find((r) => r.user_id === st.id || r.telegram_id === st.telegram_id);
    const bal = balances.find((b) => b.user_id === st.id || b.user_id === String(st.telegram_id))?.current_minutes || 0;
    const group = groups.find((g) => g.id === reg?.assigned_group_id);

    const gender = reg?.gender || (st.student_code?.startsWith('IF') ? 'female' : 'male');
    const shift = reg?.shift || 'morning';

    // Account state
    let statusState: 'active' | 'frozen' | 'banned' = 'active';
    if ((st as any).is_banned) {
      statusState = 'banned';
    } else if (st.is_frozen) {
      statusState = 'frozen';
    }

    return {
      ...st,
      student_code: st.student_code || reg?.student_code || (gender === 'female' ? `IF-${st.telegram_id.toString().slice(-4)}` : `IM-${st.telegram_id.toString().slice(-4)}`),
      gender,
      shift,
      balance: bal,
      group_name: group?.name || 'غير محدد',
      group_link: group?.telegram_invite_link || reg?.assigned_telegram_link,
      registration: reg,
      statusState,
    };
  });

  // Filter students
  const filteredStudents = enhancedStudents.filter((st) => {
    const fullName = `${st.first_name} ${st.last_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      st.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.telegram_id.toString().includes(searchTerm) ||
      (st.phone && st.phone.includes(searchTerm));

    const matchesGender = genderFilter === 'all' || st.gender === genderFilter;
    const matchesShift = shiftFilter === 'all' || st.shift === shiftFilter;

    return matchesSearch && matchesGender && matchesShift;
  });

  // Default to selecting the first student if none selected
  const activeSelectedStudent = enhancedStudents.find((s) => s.id === selectedStudentId) || (filteredStudents.length > 0 ? filteredStudents[0] : null);

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedStudent) return;

    if (actionType === 'deduct') {
      onDeductMinutes(
        activeSelectedStudent.id,
        actionMinutes,
        actionReason || `خصم جلسة تسميع (${actionMinutes} دقيقة)`
      );
    } else if (actionType === 'reward') {
      onRewardMinutes(
        activeSelectedStudent.id,
        actionMinutes,
        actionReason || `مكافأة تكريم وإتقان في الحفظ (+${actionMinutes} دقيقة)`
      );
    }
    setActionType(null);
    setActionReason('');
    setActionMinutes(20);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#105C3B] p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Amiri',serif]">
              إدارة وملفات الطلاب التفاعلية
            </h2>
            <span className="bg-emerald-700/60 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {enhancedStudents.length} طالباً مسجلاً
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">
            اختر أي طالب من القائمة بالأزرار لاستعراض كامل بياناته وتنفيذ الإجراءات الفورية (خصم، تجميد، حظر، تفعيل، تكريم)
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-300 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الكود (IM/IF)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-emerald-950/40 text-white placeholder-emerald-300/60 border border-emerald-600/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400 w-52"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="text-xs py-1.5 px-2 bg-emerald-950/40 text-emerald-100 border border-emerald-600/50 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">كل الفئات (رجال وإناث)</option>
            <option value="male">رجال (IM)</option>
            <option value="female">إناث (IF)</option>
          </select>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="text-xs py-1.5 px-2 bg-emerald-950/40 text-emerald-100 border border-emerald-600/50 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">كل الفترات</option>
            <option value="morning">صباحية 🌅</option>
            <option value="afternoon">مسائية ☀️</option>
            <option value="night">ليلية 🌙</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Student Buttons List (Left) + Student Dossier & 5 Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 1. Student Selection Buttons List (5 Columns on Desktop) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>قائمة الطلاب بالأزرار ({filteredStudents.length}):</span>
            </span>
            <span className="text-[11px] text-stone-400">انقر على الطالب للاختيار</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              لا يوجد طلاب يطابقون خيارات البحث الحالية.
            </div>
          ) : (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredStudents.map((st) => {
                const isSelected = activeSelectedStudent?.id === st.id;
                const isZero = st.balance <= 0;
                const isLow = st.balance > 0 && st.balance <= 15;

                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          st.gender === 'female'
                            ? 'bg-pink-100 text-pink-700 border border-pink-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {st.student_code.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{st.first_name} {st.last_name || ''}</span>
                          {st.statusState === 'banned' && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">محظور</span>
                          )}
                          {st.statusState === 'frozen' && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">مجمّد</span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500 flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-700 font-bold">{st.student_code}</span>
                          <span>•</span>
                          <span>{st.shift === 'morning' ? 'صباحي' : st.shift === 'night' ? 'ليلي' : 'مسائي'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Balance badge */}
                    <div className="text-left shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg font-mono inline-block ${
                          isZero
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {st.balance} د
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Detailed Student Profile & The 5 Action Buttons (7 Columns on Desktop) */}
        <div className="lg:col-span-7">
          {activeSelectedStudent ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-6 p-6">
              
              {/* Dossier Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-stone-200 gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                      activeSelectedStudent.gender === 'female'
                        ? 'bg-pink-100 text-pink-700 border-2 border-pink-200'
                        : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                    }`}
                  >
                    {activeSelectedStudent.student_code.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-stone-900 font-['Amiri',serif]">
                        {activeSelectedStudent.first_name} {activeSelectedStudent.last_name || ''}
                      </h3>
                      <span className="text-xs bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md font-mono text-stone-700 font-bold">
                        {activeSelectedStudent.student_code}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <span>Telegram ID: <b className="font-mono">{activeSelectedStudent.telegram_id}</b></span>
                      {activeSelectedStudent.username && (
                        <span>(@{activeSelectedStudent.username})</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="text-left sm:text-right">
                  {activeSelectedStudent.statusState === 'banned' ? (
                    <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
                      <Ban className="w-3.5 h-3.5" />
                      <span>الحساب محظور كلياً</span>
                    </span>
                  ) : activeSelectedStudent.statusState === 'frozen' ? (
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>الحساب مجمد / مكفوف مؤقتاً</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>الحساب نشط ومعتمد</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Dossier Information Grid (سرد بيانات الطالب) */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>سرد بيانات وسجل الطالب:</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">رصيد الدقائق المتاح</span>
                    <span className={`text-base font-bold font-mono mt-0.5 block ${
                      activeSelectedStudent.balance <= 0
                        ? 'text-rose-600'
                        : activeSelectedStudent.balance <= 15
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}>
                      {activeSelectedStudent.balance} دقيقة
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">الفترة والموعد</span>
                    <span className="font-semibold text-stone-800 mt-0.5 block">
                      {activeSelectedStudent.shift === 'morning' ? 'صباحية (09:00-12:00)' : activeSelectedStudent.shift === 'night' ? 'ليلية (21:00-23:00)' : 'مسائية (14:00-15:30)'}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">الجنس</span>
                    <span className="font-semibold text-stone-800 mt-0.5 block">
                      {activeSelectedStudent.gender === 'female' ? 'أنثى 👩 (IF)' : 'ذكر 👨 (IM)'}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">الحلقة المخصصة</span>
                    <span className="font-semibold text-stone-800 mt-0.5 block truncate">
                      {activeSelectedStudent.group_name}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">رقم الهاتف</span>
                    <span className="font-mono font-semibold text-stone-800 mt-0.5 block" dir="ltr">
                      {activeSelectedStudent.phone || activeSelectedStudent.registration?.phone || '---'}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">الدولة / المدينة</span>
                    <span className="font-semibold text-stone-800 mt-0.5 block truncate">
                      {activeSelectedStudent.registration?.country || 'إثيوبيا'} / {activeSelectedStudent.registration?.city || 'أديس أبابا'}
                    </span>
                  </div>
                </div>

                {activeSelectedStudent.group_link && (
                  <div className="mt-3 bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-900">
                    <span>رابط مجموعة تيليجرام التابعة للطالب:</span>
                    <a
                      href={activeSelectedStudent.group_link}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <span>{activeSelectedStudent.group_link}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* The 5 Actions Area (أزرار خصم الدقايق وطرد وتوقيف او تجميد وتفعيل وتكريم) */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>إجراءات المشرف على الطالب (فورية ومباشرة):</span>
                  </h4>
                  <span className="text-[11px] text-stone-500">اختر الإجراء المطلوب لتنفيذه</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  
                  {/* 1. خصم الدقائق */}
                  <button
                    onClick={() => {
                      setActionType('deduct');
                      setActionMinutes(20);
                      setActionReason('خصم جلسة تسميع وإقراء');
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition-all cursor-pointer text-xs font-bold gap-1 active:scale-95 shadow-2xs"
                  >
                    <Clock className="w-5 h-5 text-amber-700" />
                    <span>خصم الدقائق</span>
                  </button>

                  {/* 2. توقيف أو تجميد */}
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من تجميد وتوقيف حساب الطالب (${activeSelectedStudent.first_name})؟`)) {
                        onFreezeStudent(activeSelectedStudent.id, 'تجميد إداري من لوحة المشرف');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 transition-all cursor-pointer text-xs font-bold gap-1 active:scale-95 shadow-2xs"
                  >
                    <PauseCircle className="w-5 h-5 text-blue-700" />
                    <span>توقيف / تجميد</span>
                  </button>

                  {/* 3. طرد وحظر كلي */}
                  <button
                    onClick={() => {
                      if (confirm(`⚠️ تحذير: هل أنت متأكد من طرد وحظر الطالب (${activeSelectedStudent.first_name}) كلياً من المقرأة ومجموعاتها؟`)) {
                        onBanStudent(activeSelectedStudent.id, 'حظر كلي ومخالفة للضوابط');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 transition-all cursor-pointer text-xs font-bold gap-1 active:scale-95 shadow-2xs"
                  >
                    <Ban className="w-5 h-5 text-rose-700" />
                    <span>طرد / حظر كلي</span>
                  </button>

                  {/* 4. تفعيل الحساب */}
                  <button
                    onClick={() => {
                      onActivateStudent(activeSelectedStudent.id);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 transition-all cursor-pointer text-xs font-bold gap-1 active:scale-95 shadow-2xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>تفعيل الحساب</span>
                  </button>

                  {/* 5. تكريم وإضافة رصيد */}
                  <button
                    onClick={() => {
                      setActionType('reward');
                      setActionMinutes(30);
                      setActionReason('تكريم ومكافأة تميز في الإتقان والتلاوة');
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 transition-all cursor-pointer text-xs font-bold gap-1 active:scale-95 shadow-2xs col-span-2 sm:col-span-1"
                  >
                    <Award className="w-5 h-5 text-purple-700" />
                    <span>تكريم الطالب 🎁</span>
                  </button>

                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-400 text-sm">
              اختر طالباً من القائمة بالجانب لعرض ملفه وإجراءاته
            </div>
          )}
        </div>

      </div>

      {/* Action Dialog Modal (for Deduct or Reward) */}
      {actionType && activeSelectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden text-right">
            
            <div className={`p-4 text-white flex items-center justify-between ${
              actionType === 'deduct' ? 'bg-amber-700' : 'bg-purple-700'
            }`}>
              <div className="flex items-center gap-2">
                {actionType === 'deduct' ? <Clock className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                <h3 className="font-bold font-['Amiri',serif] text-base">
                  {actionType === 'deduct' ? 'خصم دقائق جلسة تسميع' : 'تكريم الطالب وإضافة دقائق هدية'}
                </h3>
              </div>
              <button
                onClick={() => setActionType(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-5 space-y-4 text-stone-800 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-stone-400 block text-[11px]">الطالب:</span>
                  <span className="font-bold text-stone-900 text-sm">{activeSelectedStudent.first_name} ({activeSelectedStudent.student_code})</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-stone-400 block text-[11px]">الرصيد الحالي:</span>
                  <span className="font-bold text-emerald-700 text-sm">{activeSelectedStudent.balance} دقيقة</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {actionType === 'deduct' ? 'عدد الدقائق المراد خصمها:' : 'عدد دقائق التكريم المراد إضافتها:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={actionType === 'deduct' ? activeSelectedStudent.balance || 999 : 600}
                    value={actionMinutes}
                    onChange={(e) => setActionMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full text-base font-bold font-mono py-2 px-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-stone-500 font-bold shrink-0">دقيقة</span>
                </div>
                {/* Quick preset buttons */}
                <div className="flex gap-1.5 mt-2">
                  {[10, 15, 20, 30, 45, 60].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setActionMinutes(m)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-mono text-[11px] font-bold cursor-pointer"
                    >
                      {m}د
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  السبب أو الملاحظات (تظهر للطالب):
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionType === 'deduct' ? 'مثال: تسميع ربع حزب من سورة البقرة' : 'مثال: إتقان أحكام التجويد والتميز'}
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 cursor-pointer font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors ${
                    actionType === 'deduct'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {actionType === 'deduct' ? 'تأكيد الخصم الفوري' : 'تأكيد منح التكريم'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
