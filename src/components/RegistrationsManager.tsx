import React, { useState } from 'react';
import {
  RegistrationApplication,
  QuranGroup,
  EducationalProgram,
} from '../types';
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  UserCheck,
  BookOpen,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';

interface RegistrationsManagerProps {
  registrations: RegistrationApplication[];
  groups: QuranGroup[];
  programs: EducationalProgram[];
  onApprove: (registrationId: string, assignedGroupId: string) => void;
  onReject: (registrationId: string, reason: string) => void;
}

export const RegistrationsManager: React.FC<RegistrationsManagerProps> = ({
  registrations,
  groups,
  programs,
  onApprove,
  onReject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedReg, setSelectedReg] = useState<RegistrationApplication | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone.includes(searchTerm) ||
      reg.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenApproveModal = (reg: RegistrationApplication) => {
    setSelectedReg(reg);
    // Find matching group by gender and shift among official 6 groups
    const matching = groups.find(
      (g) =>
        g.is_active &&
        !g.is_general_forum &&
        g.gender === reg.gender &&
        g.shift === reg.shift &&
        g.current_members_count < g.max_members
    ) || groups.find(
      (g) =>
        g.is_active &&
        !g.is_general_forum &&
        g.gender === reg.gender
    );
    setSelectedGroupId(matching ? matching.id : groups[0]?.id || '');
    setIsApproving(true);
    setIsRejecting(false);
  };

  const handleOpenRejectModal = (reg: RegistrationApplication) => {
    setSelectedReg(reg);
    setRejectionReason('');
    setIsRejecting(true);
    setIsApproving(false);
  };

  const confirmApproval = () => {
    if (selectedReg && selectedGroupId) {
      onApprove(selectedReg.id, selectedGroupId);
      setIsApproving(false);
      setSelectedReg(null);
    }
  };

  const confirmRejection = () => {
    if (selectedReg && rejectionReason.trim()) {
      onReject(selectedReg.id, rejectionReason.trim());
      setIsRejecting(false);
      setSelectedReg(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            طلبات التسجيل والالتحاق بالمقرأة
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مراجعة بيانات الطلاب، فحص المؤهلات والروايات، وتوزيع المقبولين على الحلقات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو المعرف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 w-56"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-amber-500 text-stone-950 font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              مقبول
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'rejected' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              مرفوض
            </button>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-600 text-xs font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">اسم الطالب</th>
                <th className="py-3.5 px-4">البرنامج المطلوب</th>
                <th className="py-3.5 px-4">الفترة والنوع</th>
                <th className="py-3.5 px-4">الدولة / المدينة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">تاريخ التقديم</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    لا توجد طلبات تسجيل مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => {
                  const prog = programs.find((p) => p.id === reg.program_id);
                  const assignedGroup = groups.find((g) => g.id === reg.assigned_group_id);

                  return (
                    <tr key={reg.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-stone-700">{reg.id}</div>
                        {reg.student_code && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-[#105C3B] rounded border border-emerald-200">
                            {reg.student_code}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{reg.student_name}</div>
                        <div className="text-xs text-stone-400 font-mono" dir="ltr">{reg.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-stone-700">
                        {prog ? prog.name_ar : reg.program_id}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-600">
                        <div className="font-semibold">
                          {reg.gender === 'male' ? '👨 رجال (IM)' : '👩 نساء (IF)'}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {reg.shift === 'morning'
                            ? '🌅 صباحية (9-12)'
                            : reg.shift === 'afternoon'
                            ? '☀️ مسائية (2-3:30)'
                            : reg.shift === 'night'
                            ? '🌙 ليلية (9-11)'
                            : 'مسائية'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-600">
                        {reg.country} - {reg.city}
                      </td>
                      <td className="py-3.5 px-4">
                        {reg.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            ⏳ قيد المراجعة
                          </span>
                        )}
                        {reg.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full" title={assignedGroup ? assignedGroup.name : ''}>
                            ✅ مقبول {assignedGroup ? `(${assignedGroup.name.slice(0, 15)}...)` : ''}
                          </span>
                        )}
                        {reg.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full" title={reg.rejection_reason}>
                            ❌ مرفوض
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-400">
                        {reg.created_at}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedReg(reg)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                            title="عرض تفاصيل الطلب"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {reg.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(reg)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                title="قبول وتعيين حلقة"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(reg)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="رفض الطلب مع سبب"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {selectedReg && !isApproving && !isRejecting && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#105C3B]" />
                <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
                  تفاصيل طلب التسجيل #{selectedReg.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">اسم الطالب الكامل</span>
                <span className="font-bold text-stone-800 text-sm">{selectedReg.student_name}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الهاتف وتيليجرام</span>
                <span className="font-bold text-stone-800" dir="ltr">{selectedReg.phone}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الدولة والمدينة</span>
                <span className="font-semibold text-stone-800">{selectedReg.country} - {selectedReg.city}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الفترة والجنس</span>
                <span className="font-semibold text-stone-800">
                  {selectedReg.shift === 'morning' ? 'صباحية' : 'مسائية'} ({selectedReg.gender === 'male' ? 'رجال' : 'نساء'})
                </span>
              </div>
              <div className="col-span-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">المستوى القرآني ومقدار الحفظ السابق</span>
                <span className="font-medium text-stone-800">{selectedReg.quran_level}</span>
              </div>
              <div className="col-span-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الرواية المطلوبة</span>
                <span className="font-medium text-stone-800">{selectedReg.riwayah}</span>
              </div>
              <div className="col-span-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الأوقات المناسبة أسبوعياً</span>
                <span className="font-medium text-stone-800">{selectedReg.suitable_times}</span>
              </div>
              {selectedReg.notes && (
                <div className="col-span-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <span className="text-stone-400 block mb-0.5">ملاحظات إضافية أو بيانات ولي الأمر</span>
                  <span className="font-medium text-stone-800">{selectedReg.notes}</span>
                </div>
              )}
            </div>

            {selectedReg.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => handleOpenApproveModal(selectedReg)}
                  className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  قبول وتعيين حلقة
                </button>
                <button
                  onClick={() => handleOpenRejectModal(selectedReg)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  رفض مع ذكر السبب
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve & Assign Group Modal */}
      {isApproving && selectedReg && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
              اعتماد قبول الطالب: {selectedReg.student_name}
            </h3>
            <p className="text-xs text-stone-500">
              يرجى اختيار الحلقة التعليمية المناسبة للطالب بناءً على البرنامج والفترة والجنس:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                الحلقة التعليمية (المجموعة):
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.current_members_count}/{g.max_members} طالب) - {g.shift === 'morning' ? 'صباحي' : 'مسائي'}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-200">
              💡 سيصل إشعار فوري للطالب على حسابه في تيليجرام يتضمن قرار القبول ورابط مجموعة التيليجرام الخاصة بحلقته.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsApproving(false)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmApproval}
                className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
              >
                تأكيد القبول والتعيين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject with mandatory reason Modal */}
      {isRejecting && selectedReg && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-rose-700 font-['Amiri',serif] text-lg">
              رفض طلب التسجيل #{selectedReg.id}
            </h3>
            <p className="text-xs text-stone-500">
              يجب إدخال سبب الرفض بوضوح ليتم توثيقه في السجل وإرساله في إشعار رسمي للطالب:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                سبب الرفض (إلزامي):
              </label>
              <textarea
                rows={3}
                placeholder="مثال: عدم اجتياز اختبار القبول للبرنامج المتقدم، أو عدم توفر مقاعد حالياً..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsRejecting(false)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
              >
                تأكيد الرفض مع السبب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
