import React, { useState } from 'react';
import { QuranGroup, User, EducationalProgram, StudentBalance, StudyShift } from '../types';
import {
  Users2,
  Plus,
  Edit3,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Calendar,
  X,
  Clock,
  Copy,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Send,
  Sparkles,
  Radio,
  VolumeX,
  Volume2,
  Zap,
  Info,
} from 'lucide-react';

interface GroupsManagerProps {
  groups: QuranGroup[];
  teachers: User[];
  programs: EducationalProgram[];
  balances?: StudentBalance[];
  onCreateGroup: (group: Partial<QuranGroup>) => void;
  onUpdateTelegramLink: (groupId: string, newLink: string) => void;
  onToggleGroupStatus: (groupId: string) => void;
  onRestrictStudent?: (userId: string, reason: string) => void;
  onUnrestrictStudent?: (userId: string) => void;
  onBorrowMinutes?: (userId: string, minutes: number) => void;
  onSendLowBalanceWarning?: (userId: string) => void;
  onTriggerLessonReminder?: (groupId: string) => void;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({
  groups,
  teachers,
  programs,
  balances = [],
  onCreateGroup,
  onUpdateTelegramLink,
  onToggleGroupStatus,
  onRestrictStudent,
  onUnrestrictStudent,
  onBorrowMinutes,
  onSendLowBalanceWarning,
  onTriggerLessonReminder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'moderation' | 'credentials'>('groups');
  const [groupFilter, setGroupFilter] = useState<'all' | 'male' | 'female' | 'forums'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupForLink, setSelectedGroupForLink] = useState<QuranGroup | null>(null);
  const [newTelegramLink, setNewTelegramLink] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notificationSuccessMsg, setNotificationSuccessMsg] = useState<string | null>(null);

  // Form state for creating group
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [programId, setProgramId] = useState(programs[0]?.id || 'recitation-correction');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [shift, setShift] = useState<StudyShift>('morning');
  const [shiftTime, setShiftTime] = useState('09:00 - 12:00');
  const [maxMembers, setMaxMembers] = useState(25);
  const [inviteLink, setInviteLink] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const prog = programs.find((p) => p.id === programId);
    const teacher = teachers.find((t) => t.id === teacherId);

    onCreateGroup({
      name: groupName.trim(),
      group_code: groupCode.trim() || undefined,
      telegram_chat_id: telegramChatId.trim() || undefined,
      program_id: programId,
      program_name: prog ? prog.name_ar : '',
      teacher_id: teacherId,
      teacher_name: teacher ? teacher.first_name + ' ' + (teacher.last_name || '') : 'المقرئ المشرف',
      gender,
      shift,
      shift_time: shiftTime,
      max_members: maxMembers,
      telegram_invite_link: inviteLink.trim() || undefined,
      bot_is_admin: true,
      is_active: true,
    });

    setIsCreating(false);
    setGroupName('');
    setGroupCode('');
    setTelegramChatId('');
    setInviteLink('');
  };

  const handleSaveLink = () => {
    if (selectedGroupForLink && newTelegramLink.trim()) {
      onUpdateTelegramLink(selectedGroupForLink.id, newTelegramLink.trim());
      setSelectedGroupForLink(null);
      setNewTelegramLink('');
    }
  };

  const handleTriggerReminder = (group: QuranGroup) => {
    if (onTriggerLessonReminder) {
      onTriggerLessonReminder(group.id);
    }
    setNotificationSuccessMsg(`تم إرسال تذكير موعد الدرس بكلمات طيبة لمجموعة: ${group.name}`);
    setTimeout(() => setNotificationSuccessMsg(null), 4000);
  };

  const filteredGroups = groups.filter((g) => {
    if (groupFilter === 'male') return g.gender === 'male' && !g.is_general_forum;
    if (groupFilter === 'female') return g.gender === 'female' && !g.is_general_forum;
    if (groupFilter === 'forums') return g.is_general_forum;
    return true;
  });

  const restrictedStudentsCount = balances.filter((b) => b.is_restricted || b.current_minutes <= 0).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
              إدارة المجموعات الدراسية وإشراف البوت المركزي
            </h2>
            <span className="bg-emerald-100 text-[#105C3B] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              البوت مشرف نشط في 6 مجموعات
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            إدارة المجموعات الست (ذكور وإناث عبر 3 فترات)، والملتقيات العامة، وتنبيهات الدروس، والتقييد الآلي لنفاد الرصيد
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حلقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg cursor-pointer transition-colors ${
            activeSubTab === 'groups'
              ? 'bg-[#105C3B] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>المجموعات الست والملتقيات ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('moderation')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg cursor-pointer transition-colors relative ${
            activeSubTab === 'moderation'
              ? 'bg-[#105C3B] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <VolumeX className="w-4 h-4" />
          <span>إشراف البوت والتقييدات التلقائية</span>
          {restrictedStudentsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {restrictedStudentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('credentials')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg cursor-pointer transition-colors ${
            activeSubTab === 'credentials'
              ? 'bg-[#105C3B] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>بيانات الربط وصلاحيات البوت</span>
        </button>
      </div>

      {notificationSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: GROUPS VIEW */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          
          {/* Quick Schedule Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-800">الفترة الصباحية (Morning)</div>
                <div className="text-base font-bold text-stone-900 font-['Amiri',serif]">09:00 ص - 12:00 م</div>
                <div className="text-[10px] text-amber-900/70 mt-0.5">تذكير البوت: 08:30 صباحاً بكلمات إيمانية</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-200/60 flex items-center justify-center text-amber-800 font-bold text-xs">
                صباحي
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 border border-sky-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-sky-800">الفترة المسائية (Afternoon)</div>
                <div className="text-base font-bold text-stone-900 font-['Amiri',serif]">02:00 م - 03:30 م</div>
                <div className="text-[10px] text-sky-900/70 mt-0.5">تذكير البوت: 01:30 ظهراً بكلمات إيمانية</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-sky-200/60 flex items-center justify-center text-sky-800 font-bold text-xs">
                مسائي
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-indigo-800">الفترة الليلية (Night)</div>
                <div className="text-base font-bold text-stone-900 font-['Amiri',serif]">09:00 م - 11:00 م</div>
                <div className="text-[10px] text-indigo-900/70 mt-0.5">تذكير البوت: 08:30 مساءً بكلمات إيمانية</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-200/60 flex items-center justify-center text-indigo-800 font-bold text-xs">
                ليلي
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-semibold">تصفية العرض:</span>
            <button
              onClick={() => setGroupFilter('all')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                groupFilter === 'all' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              الكل ({groups.length})
            </button>
            <button
              onClick={() => setGroupFilter('male')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                groupFilter === 'male' ? 'bg-[#105C3B] text-white font-bold' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              مجموعات الذكور IM (3)
            </button>
            <button
              onClick={() => setGroupFilter('female')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                groupFilter === 'female' ? 'bg-purple-700 text-white font-bold' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              مجموعات الإناث IF (3)
            </button>
            <button
              onClick={() => setGroupFilter('forums')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                groupFilter === 'forums' ? 'bg-emerald-700 text-white font-bold' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              الملتقيات العامة (3)
            </button>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => {
              const isMale = group.gender === 'male';
              const isFemale = group.gender === 'female';
              const isForum = group.is_general_forum;

              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                    group.is_active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50'
                  }`}
                >
                  <div>
                    {/* Header with Group Code & Bot Admin Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {group.group_code && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                              {group.group_code}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isForum
                                ? 'bg-emerald-50 text-emerald-800'
                                : isMale
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {isForum ? 'ملتقى عام' : isMale ? 'ذكور (IM)' : 'إناث (IF)'}
                          </span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-base leading-snug font-['Amiri',serif]">
                          {group.name}
                        </h3>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          group.is_active ? 'bg-emerald-100 text-[#105C3B]' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {group.is_active ? 'نشطة' : 'متوقفة'}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-2 text-xs text-stone-600 py-2.5 border-y border-stone-100 my-3">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">الفترة والتوقيت:</span>
                        <span className="font-semibold text-stone-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{group.shift_time || '09:00 - 12:00'}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">معرف التيليجرام:</span>
                        <div className="flex items-center gap-1">
                          <code className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {group.telegram_chat_id || 'غير محدد'}
                          </code>
                          {group.telegram_chat_id && (
                            <button
                              onClick={() => copyToClipboard(group.telegram_chat_id!, `chat-${group.id}`)}
                              className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                              title="نسخ المعرف"
                            >
                              {copiedId === `chat-${group.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">المشرف / المقرئ:</span>
                        <span className="font-semibold text-stone-800">{group.teacher_name}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">الطلاب المنتسبون:</span>
                        <span className="font-bold text-emerald-800">
                          {group.current_members_count} / {group.max_members} عضو
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-stone-400">إشراف البوت:</span>
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          مشرف كامل الصلاحيات
                        </span>
                      </div>
                    </div>

                    {/* Telegram Link Preview */}
                    <div className="text-xs bg-stone-50 p-2 rounded-lg border border-stone-200/70 mb-3 flex items-center justify-between">
                      <div className="truncate max-w-[190px] font-mono text-[11px] text-stone-600" dir="ltr">
                        {group.telegram_invite_link || 'لا يوجد رابط'}
                      </div>
                      {group.telegram_invite_link && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(group.telegram_invite_link!, `link-${group.id}`)}
                            className="text-stone-500 hover:text-stone-800 p-1 cursor-pointer"
                            title="نسخ الرابط"
                          >
                            {copiedId === `link-${group.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={group.telegram_invite_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                            title="فتح الرابط"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleTriggerReminder(group)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#105C3B] font-bold text-[11px] py-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="إرسال تذكير بكلمات جميلة إلى المجموعة الآن"
                    >
                      <Send className="w-3 h-3" />
                      <span>تذكير الدرس</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedGroupForLink(group);
                        setNewTelegramLink(group.telegram_invite_link || '');
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-xs"
                      title="تعديل رابط التيليجرام"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onToggleGroupStatus(group.id)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      {group.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BOT MODERATION & GROUP RESTRICTIONS */}
      {activeSubTab === 'moderation' && (
        <div className="space-y-5">
          
          {/* Policy Explanation Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-[#105C3B] text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-bold text-base font-['Amiri',serif]">
                  نظام التقييد الآلي والحظر الذكي لنفاد رصيد الطلاب في التيليجرام
                </h3>
                <p className="text-xs text-emerald-100 leading-relaxed mt-1.5 max-w-4xl">
                  <strong>آلية عمل البوت:</strong> عندما يصل رصيد الطالب إلى <strong>(0 دقيقة)</strong>، يقوم البوت فوراً بالتعرف عليه وإرسال تنبيه خاص ومؤدب في المحادثة الفردية يحثه على شحن الرصيد أو طلب استلاف رصيد طوارئ. وإذا لم يقم بالشحن أو الاستلاف، يقوم البوت بصفته مشرفاً بتقييد الطالب في مجموعة التيليجرام التي يخصه (كتم وإيقاف صلاحيات الكتابة والمشاركة في البث الصوتي). وبمجرد شحن باقة جديدة أو منحه رصيد استلاف، يرفع البوت الحظر تلقائياً ويستعيد كامل الصلاحيات.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500">إجمالي الطلاب المسجلين</div>
                <div className="text-xl font-bold text-stone-900 mt-0.5">{balances.length} طالب</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
                <Users2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500">الطلاب المقيدون بالمجموعات</div>
                <div className="text-xl font-bold text-red-600 mt-0.5">
                  {balances.filter((b) => b.is_restricted).length} طلاب
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                <VolumeX className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500">صلاحيات البوت الإشرافية</div>
                <div className="text-xl font-bold text-emerald-600 mt-0.5">كاملة ومفعلة 100%</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Check className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Students Moderation Table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">
                  قائمة الطلاب وحالة التقييد في مجموعات التيليجرام
                </h4>
                <p className="text-xs text-stone-500">
                  يمكن للمشرف رفع التقييد يدوياً، أو منح دقائق استلاف، أو إرسال تنبيه فوري بالخاص
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="p-3 font-semibold">كود الطالب</th>
                    <th className="p-3 font-semibold">اسم الطالب</th>
                    <th className="p-3 font-semibold">المجموعة المخصصة</th>
                    <th className="p-3 font-semibold text-center">الرصيد المتاح</th>
                    <th className="p-3 font-semibold">حالة المجموعة</th>
                    <th className="p-3 font-semibold text-center">الإجراء الإشرافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {balances.map((student) => {
                    const isZero = student.current_minutes <= 0;
                    const isRestricted = student.is_restricted || (isZero && !student.borrowed_minutes);

                    return (
                      <tr key={student.user_id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-800 border border-stone-200">
                            {student.student_code || (student.telegram_id.toString().slice(-4))}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-stone-900">{student.student_name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">ID: {student.telegram_id}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-stone-800">
                            {student.assigned_group_name || 'حلقة الذكور الصباحية'}
                          </div>
                          {student.assigned_telegram_link && (
                            <a
                              href={student.assigned_telegram_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              <span>رابط المجموعة</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
                              student.current_minutes > 30
                                ? 'bg-emerald-100 text-emerald-800'
                                : student.current_minutes > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {student.current_minutes} دقيقة
                          </span>
                        </td>

                        <td className="p-3">
                          {isRestricted ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                <VolumeX className="w-3 h-3 text-red-600" />
                                <span>مقيد وممنوع من المشاركة (Muted)</span>
                              </span>
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                {student.restriction_reason || 'نفاد الرصيد وعدم الشحن'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Volume2 className="w-3 h-3 text-emerald-600" />
                              <span>نشط ومصرح له بالمشاركة</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {isRestricted ? (
                              <button
                                onClick={() => {
                                  if (onUnrestrictStudent) onUnrestrictStudent(student.user_id);
                                  setNotificationSuccessMsg(`تم رفع التقييد عن الطالب ${student.student_name} واستعادة صلاحيات الكتابة والمشاركة الصوتية.`);
                                  setTimeout(() => setNotificationSuccessMsg(null), 4000);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>فك التقييد</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (onRestrictStudent) onRestrictStudent(student.user_id, 'تقييد إداري');
                                  setNotificationSuccessMsg(`تم تقييد الطالب ${student.student_name} في مجموعة التيليجرام.`);
                                  setTimeout(() => setNotificationSuccessMsg(null), 4000);
                                }}
                                className="text-stone-500 hover:text-red-700 hover:bg-red-50 font-medium text-[11px] px-2 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1 border border-stone-200"
                              >
                                <Lock className="w-3 h-3" />
                                <span>تقييد يدوي</span>
                              </button>
                            )}

                            {/* Emergency Borrow Button */}
                            <button
                              onClick={() => {
                                if (onBorrowMinutes) onBorrowMinutes(student.user_id, 30);
                                setNotificationSuccessMsg(`تم منح الطالب ${student.student_name} استلاف طوارئ 30 دقيقة وفك التقييد تلقائياً.`);
                                setTimeout(() => setNotificationSuccessMsg(null), 4000);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] px-2 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1 border border-amber-200"
                              title="منح استلاف طوارئ 30 دقيقة وفك التقييد"
                            >
                              <Zap className="w-3 h-3 text-amber-600" />
                              <span>استلاف (+30)</span>
                            </button>

                            {/* Send DM Warning */}
                            <button
                              onClick={() => {
                                if (onSendLowBalanceWarning) onSendLowBalanceWarning(student.user_id);
                                setNotificationSuccessMsg(`تم إرسال تنبيه خاص إلى هاتف وتيليجرام الطالب ${student.student_name}.`);
                                setTimeout(() => setNotificationSuccessMsg(null), 4000);
                              }}
                              className="text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-[11px] p-1 rounded-md cursor-pointer transition-colors"
                              title="إرسال رسالة تنبيه نفاذ الرصيد بالخاص"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CREDENTIALS & INTEGRATION */}
      {activeSubTab === 'credentials' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-stone-900 font-['Amiri',serif]">
              بيانات الاعتماد الرسمية للربط مع التيليجرام
            </h3>
            <p className="text-xs text-stone-500">
              هذه البيانات مستخدمة رسمياً لتشغيل بوت مقرأة الإمام الجزري والإشراف على المجموعات الست
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-xs font-semibold text-stone-500 block">توكن البوت (TELEGRAM_BOT_TOKEN):</span>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-stone-200 font-mono text-xs">
                  <span className="truncate">9040406341:AAHjFYGQ0EcV60VpX1J7xQbVNcT29Drkl4M</span>
                  <button
                    onClick={() => copyToClipboard('9040406341:AAHjFYGQ0EcV60VpX1J7xQbVNcT29Drkl4M', 'token')}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    {copiedId === 'token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>معتمد ومربوط في الخادم وبوت التيليجرام</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-xs font-semibold text-stone-500 block">معرف المدير العام (SUPER_ADMIN_TELEGRAM_ID):</span>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-stone-200 font-mono text-xs">
                  <span>7334314796</span>
                  <button
                    onClick={() => copyToClipboard('7334314796', 'super_admin_id')}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    {copiedId === 'super_admin_id' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>صاحب أعلى صلاحية غير مقيدة (الشيخ خالد أحمد)</span>
                </div>
              </div>
            </div>

            {/* Official Study Groups Summary Table */}
            <div className="pt-4">
              <h4 className="font-bold text-stone-900 text-xs mb-2">
                جدول المجموعات الست المعتمدة ورموزها ومعرفاتها الرسمية:
              </h4>
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                    <tr>
                      <th className="p-2.5">المجموعة</th>
                      <th className="p-2.5">الكود</th>
                      <th className="p-2.5">معرف الدردشة (Chat ID)</th>
                      <th className="p-2.5">التوقيت</th>
                      <th className="p-2.5">الرابط الرسمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    <tr>
                      <td className="p-2.5 font-sans font-medium">ذكور - صباحي</td>
                      <td className="p-2.5 text-blue-700 font-bold">IM_MORNING</td>
                      <td className="p-2.5 text-stone-600">-1003701915037</td>
                      <td className="p-2.5 font-sans">09:00 - 12:00</td>
                      <td className="p-2.5 text-emerald-700" dir="ltr">https://t.me/IM_MORNING_2</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium">ذكور - مسائي</td>
                      <td className="p-2.5 text-blue-700 font-bold">IM_AFTERNOON</td>
                      <td className="p-2.5 text-stone-600">-1003954336712</td>
                      <td className="p-2.5 font-sans">14:00 - 15:30</td>
                      <td className="p-2.5 text-emerald-700" dir="ltr">https://t.me/IM_AFTERNOON_3</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium">ذكور - ليلي</td>
                      <td className="p-2.5 text-blue-700 font-bold">IM_NIGHT</td>
                      <td className="p-2.5 text-stone-600">-1003771613278</td>
                      <td className="p-2.5 font-sans">21:00 - 23:00</td>
                      <td className="p-2.5 text-emerald-700" dir="ltr">https://t.me/IM_NIGHT_1</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium">إناث - صباحي</td>
                      <td className="p-2.5 text-purple-700 font-bold">IF_MORNING</td>
                      <td className="p-2.5 text-stone-600">-1004464170793</td>
                      <td className="p-2.5 font-sans">09:00 - 12:00</td>
                      <td className="p-2.5 text-emerald-700" dir="ltr">https://t.me/IF_MORNING</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium">إناث - مسائي</td>
                      <td className="p-2.5 text-purple-700 font-bold">IF_AFTERNOON</td>
                      <td className="p-2.5 text-stone-600">-1004388200431</td>
                      <td className="p-2.5 font-sans">14:00 - 15:30</td>
                      <td className="p-2.5 text-emerald-700" dir="ltr">https://t.me/IF_AFTERNOON</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium">إناث - ليلي</td>
                      <td className="p-2.5 text-purple-700 font-bold">IF_NIGHT</td>
                      <td className="p-2.5 text-stone-600">-1004297425702</td>
                      <td className="p-2.5 font-sans">21:00 - 23:00</td>
                      <td className="p-2.5 text-emerald-700" dir="ltr">https://t.me/IF_NIGHT</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
                إنشاء حلقة تعليمية جديدة
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                اسم الحلقة:
              </label>
              <input
                type="text"
                required
                placeholder="مثال: حلقة الإمام نافع المدني (رجال)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  كود المجموعة (مثال: IM_SPECIAL):
                </label>
                <input
                  type="text"
                  placeholder="IM_..."
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  معرف التيليجرام (Chat ID):
                </label>
                <input
                  type="text"
                  placeholder="-100..."
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  البرنامج التعليمي:
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name_ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  المعلم المشرف:
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الجنس:
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="male">رجال (IM)</option>
                  <option value="female">نساء (IF)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الفترة:
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as StudyShift)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="morning">صباحية (9-12)</option>
                  <option value="afternoon">مسائية (2-3:30)</option>
                  <option value="night">ليلية (9-11)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الحد الأقصى:
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value) || 25)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                رابط مجموعة تيليجرام الخاصة بالحلقة:
              </label>
              <input
                type="url"
                placeholder="https://t.me/..."
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
              >
                إنشاء الحلقة وتثبيتها
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Telegram Link Modal */}
      {selectedGroupForLink && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
              تحديث رابط تيليجرام: {selectedGroupForLink.name}
            </h3>
            <p className="text-xs text-stone-500">
              أدخل رابط دعوة تيليجرام الفعلي للحلقة. سيظهر الرابط فقط للطلاب المقبولين والمنتمين لهذه الحلقة:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                رابط الدعوة (Telegram Invite Link):
              </label>
              <input
                type="url"
                placeholder="https://t.me/..."
                value={newTelegramLink}
                onChange={(e) => setNewTelegramLink(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setSelectedGroupForLink(null)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveLink}
                className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
              >
                حفظ وتحديث الرابط
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
