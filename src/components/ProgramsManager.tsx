import React, { useState } from 'react';
import { EducationalProgram } from '../types';
import { BookMarked, Plus, Edit3, Power, CheckCircle2 } from 'lucide-react';

interface ProgramsManagerProps {
  programs: EducationalProgram[];
  onToggleProgramStatus: (programId: string) => void;
  onUpdateProgram: (updated: EducationalProgram) => void;
  onCreateProgram: (program: EducationalProgram) => void;
}

export const ProgramsManager: React.FC<ProgramsManagerProps> = ({
  programs,
  onToggleProgramStatus,
  onUpdateProgram,
  onCreateProgram,
}) => {
  const [editingProgram, setEditingProgram] = useState<EducationalProgram | null>(null);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            البرامج التعليمية القرآنية
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            نظام ديناميكي لإدارة البرامج وأهدافها ومتطلباتها وحالات تفعيلها دون تعديل كود البوت
          </p>
        </div>
      </div>

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((prog) => (
          <div
            key={prog.id}
            className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
              prog.is_active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[11px] font-mono text-stone-400 block mb-0.5">{prog.id}</span>
                <h3 className="font-bold text-stone-900 text-lg font-['Amiri',serif]">{prog.name_ar}</h3>
                <span className="text-xs text-stone-400 block">{prog.name_en}</span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  prog.is_active ? 'bg-emerald-100 text-[#105C3B]' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {prog.is_active ? 'مفعّل' : 'متوقف'}
              </span>
            </div>

            <p className="text-xs text-stone-600 mb-3 leading-relaxed">{prog.description_ar}</p>

            <div className="space-y-1.5 text-xs bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4">
              <div><strong className="text-stone-700">الأهداف:</strong> <span className="text-stone-600">{prog.objectives_ar}</span></div>
              <div><strong className="text-stone-700">المتطلبات:</strong> <span className="text-stone-600">{prog.requirements_ar}</span></div>
              <div><strong className="text-stone-700">الفئة المستهدفة:</strong> <span className="text-stone-600">{prog.target_audience_ar}</span></div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-xs font-bold text-emerald-800">
                الحد الأدنى: {prog.minutes} دقيقة
              </span>
              <button
                onClick={() => onToggleProgramStatus(prog.id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 font-medium text-stone-700 cursor-pointer"
              >
                {prog.is_active ? 'تعطيل البرنامج' : 'إعادة التفعيل'}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
