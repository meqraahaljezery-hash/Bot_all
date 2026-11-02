import React, { useState } from 'react';
import { Megaphone, Send, CheckCircle2, Users, BookOpen } from 'lucide-react';
import { EducationalProgram } from '../types';

interface AnnouncementsManagerProps {
  programs: EducationalProgram[];
  totalStudentsCount: number;
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  programs,
  totalStudentsCount,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'program'>('all');
  const [selectedProgramId, setSelectedProgramId] = useState(programs[0]?.id || '');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setTitle('');
      setContent('');
      setTimeout(() => setSentSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            الإعلانات والرسائل الجماعية
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            بث رسائل وتنبيهات مباشرة لجميع مشتركي البوت أو لطلاب برنامج محدد مع احترام قيود التيليجرام
          </p>
        </div>
      </div>

      {sentSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <strong>تم إرسال الإعلان بنجاح!</strong> تم تسليم الرسالة إلى كافة المستهدفين عبر بوت التيليجرام.
          </div>
        </div>
      )}

      {/* Broadcast Form */}
      <form onSubmit={handleBroadcast} className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            عنوان الإعلان:
          </label>
          <input
            type="text"
            required
            placeholder="مثال: موعد انطلاق الدورة الصيفية المكثفة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              الفئة المستهدفة:
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as 'all' | 'program')}
              className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
            >
              <option value="all">جميع المشتركين ({totalStudentsCount} مستخدم)</option>
              <option value="program">طلاب برنامج محدد فقط</option>
            </select>
          </div>

          {targetAudience === 'program' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                اختر البرنامج:
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_ar}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            نص الإعلان (يدعم التنسيق والرموز):
          </label>
          <textarea
            rows={5}
            required
            placeholder="اكتب نص الرسالة التي ستصل للطلاب في تيليجرام..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none leading-relaxed"
          ></textarea>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSending || !title.trim() || !content.trim()}
            className="bg-[#105C3B] hover:bg-[#18794E] disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'جاري الإرسال التدريجي...' : 'معاينة وإرسال الإعلان الآن'}</span>
          </button>
        </div>
      </form>

    </div>
  );
};
