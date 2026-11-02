import React from 'react';
import { Shield, BookOpen, Phone, Mail, Globe, Bot, Download, Smartphone, ArrowLeftRight, User } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSimulator: () => void;
  onOpenPwaModal: () => void;
  onOpenSupervisorAuth: () => void;
  currentViewMode: 'supervisor' | 'student';
  onToggleViewMode: () => void;
  supervisorEmail: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenSimulator,
  onOpenPwaModal,
  onOpenSupervisorAuth,
  currentViewMode,
  onToggleViewMode,
  supervisorEmail,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#105C3B] text-white shadow-md border-b border-[#0B3F28]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner text-[#DDF2E3] shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#DDF2E3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-xl font-bold tracking-tight text-white font-['Amiri',serif]">
                  مقرأة الإمام الجزري
                </span>
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-bold ${
                  currentViewMode === 'supervisor'
                    ? 'bg-[#18794E] text-[#DDF2E3] border-emerald-400/30'
                    : 'bg-amber-400/90 text-stone-900 border-amber-300'
                }`}>
                  {currentViewMode === 'supervisor' ? 'لوحة المشرف العام' : 'واجهة الطالب (TMA)'}
                </span>
              </div>
              <p className="text-[11px] text-[#DDF2E3]/90 hidden md:block">
                للإقراء والإجازة بالسند المتصل إلى رسول الله ﷺ
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* PWA / TMA Download Box Button */}
            <button
              onClick={onOpenPwaModal}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs py-2 px-2.5 sm:px-3.5 rounded-xl border border-white/20 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="صندوق تحميل التطبيق ويباب يدعم عربي"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span className="hidden xs:inline">تحميل التطبيق</span>
              <span className="text-[10px] bg-emerald-500 text-stone-950 px-1.5 py-0.2 rounded font-black">PWA</span>
            </button>

            {/* Toggle between Supervisor & Student View */}
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 text-xs font-bold py-2 px-2.5 sm:px-3.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer border ${
                currentViewMode === 'supervisor'
                  ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 border-emerald-400'
              }`}
              title="التبديل بين ما يظهر للطالب وما يظهر للمشرف"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {currentViewMode === 'supervisor' ? 'عرض واجهة الطالب' : 'عرض لوحة المشرف'}
              </span>
              <span className="sm:hidden">
                {currentViewMode === 'supervisor' ? 'طالب' : 'مشرف'}
              </span>
            </button>

            {/* Live Bot Simulator Launcher */}
            <button
              onClick={onOpenSimulator}
              className="hidden lg:flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-2 rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>محاكي البوت</span>
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center bg-[#18794E] rounded-xl p-1 border border-white/15">
              <Globe className="w-3.5 h-3.5 text-[#DDF2E3] ml-1 mr-1 hidden sm:inline" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                aria-label="اختر لغة الواجهة"
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1 pl-1"
              >
                <option value="ar" className="text-stone-900">العربية 🇸🇦</option>
                <option value="en" className="text-stone-900">English 🇬🇧</option>
                <option value="am" className="text-stone-900">አማርኛ 🇪🇹</option>
              </select>
            </div>

            {/* Supervisor Account Badge / Auth Button */}
            <button
              onClick={onOpenSupervisorAuth}
              className="flex items-center gap-2 bg-black/20 hover:bg-black/30 py-1.5 px-2.5 rounded-xl border border-white/15 text-xs text-right cursor-pointer transition-colors"
              title="إدارة حساب المشرف وتغيير كلمة المرور"
            >
              <Shield className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="hidden sm:block">
                <span className="block font-bold text-white text-[11px] leading-tight">المشرف العام</span>
                <span className="block text-[10px] text-emerald-200 font-mono leading-tight">{supervisorEmail}</span>
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
