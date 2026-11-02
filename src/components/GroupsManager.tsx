import React, { useState } from 'react';
import { QuranGroup, User, EducationalProgram } from '../types';
import {
  Users2,
  Plus,
  Edit3,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Calendar,
  X,
} from 'lucide-react';

interface GroupsManagerProps {
  groups: QuranGroup[];
  teachers: User[];
  programs: EducationalProgram[];
  onCreateGroup: (group: Partial<QuranGroup>) => void;
  onUpdateTelegramLink: (groupId: string, newLink: string) => void;
  onToggleGroupStatus: (groupId: string) => void;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({
  groups,
  teachers,
  programs,
  onCreateGroup,
  onUpdateTelegramLink,
  onToggleGroupStatus,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupForLink, setSelectedGroupForLink] = useState<QuranGroup | null>(null);
  const [newTelegramLink, setNewTelegramLink] = useState('');

  // Form state for creating group
  const [groupName, setGroupName] = useState('');
  const [programId, setProgramId] = useState(programs[0]?.id || 'recitation-correction');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [maxMembers, setMaxMembers] = useState(15);
  const [inviteLink, setInviteLink] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const prog = programs.find((p) => p.id === programId);
    const teacher = teachers.find((t) => t.id === teacherId);

    onCreateGroup({
      name: groupName.trim(),
      program_id: programId,
      program_name: prog ? prog.name_ar : '',
      teacher_id: teacherId,
      teacher_name: teacher ? teacher.first_name + ' ' + (teacher.last_name || '') : 'المقرئ المشرف',
      gender,
      shift,
      max_members: maxMembers,
      telegram_invite_link: inviteLink.trim() || undefined,
      is_active: true,
    });

    setIsCreating(false);
    setGroupName('');
    setInviteLink('');
  };

  const handleSaveLink = () => {
    if (selectedGroupForLink && newTelegramLink.trim()) {
      onUpdateTelegramLink(selectedGroupForLink.id, newTelegramLink.trim());
      setSelectedGroupForLink(null);
      setNewTelegramLink('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            المجموعات والحلقات القرآنية
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            إدارة الحلقات التعليمية، إسناد المعلمين، وضبط روابط مجموعات التيليجرام الخاصة بكل حلقة
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء حلقة تعليمية جديدة</span>
        </button>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#105C3B] shrink-0" />
        <span>
          <strong>حماية خصوصية الحلقات:</strong> لا يستطيع أي طالب رؤية رابط تيليجرام إلا إذا كان منتمياً رسمياً للحلقة ومسجلاً فيها من قبل الإدارة.
        </span>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
              group.is_active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 block mb-0.5">
                  {group.program_name}
                </span>
                <h3 className="font-bold text-stone-900 text-base leading-tight font-['Amiri',serif]">
                  {group.name}
                </h3>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  group.is_active
                    ? 'bg-emerald-100 text-[#105C3B]'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {group.is_active ? 'نشطة' : 'متوقفة'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-stone-600 py-2 border-y border-stone-100 my-3">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">المعلم المشرف:</span>
                <span className="font-semibold text-stone-800">{group.teacher_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">الفترة والجنس:</span>
                <span className="font-semibold text-stone-800">
                  {group.shift === 'morning' ? 'صباحية' : 'مسائية'} ({group.gender === 'male' ? 'رجال' : 'نساء'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">الأعضاء المقيدين:</span>
                <span className="font-bold text-emerald-800">
                  {group.current_members_count} / {group.max_members} طالب
                </span>
              </div>
            </div>

            {/* Telegram Link Preview & Update */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs truncate font-mono text-stone-400 max-w-[160px]">
                {group.telegram_invite_link ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 inline" />
                    <span>رابط تيليجرام مهيأ</span>
                  </span>
                ) : (
                  <span className="text-amber-600">لم يضبط الرابط</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedGroupForLink(group);
                    setNewTelegramLink(group.telegram_invite_link || '');
                  }}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer text-xs flex items-center gap-1"
                  title="تعديل رابط التيليجرام"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>الرابط</span>
                </button>
                <button
                  onClick={() => onToggleGroupStatus(group.id)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer text-xs"
                >
                  {group.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  <option value="male">رجال</option>
                  <option value="female">نساء</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الفترة:
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as 'morning' | 'evening')}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value="morning">صباحية</option>
                  <option value="evening">مسائية</option>
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
                  onChange={(e) => setMaxMembers(parseInt(e.target.value) || 15)}
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
                placeholder="https://t.me/+join_group_link"
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
                placeholder="https://t.me/+..."
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
