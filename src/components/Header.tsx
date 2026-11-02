import React from 'react';
import { Shield, BookOpen, Phone, Mail, Globe, Bot } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenSimulator,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#105C3B] text-white shadow-md border-b border-[#0B3F28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner text-[#DDF2E3]">
              <BookOpen className="w-6 h-6 text-[#DDF2E3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-xl font-bold tracking-tight text-white font-['Amiri',serif]">
                  مقرأة الإمام الجزري
                </span>
                <span className="hidden sm:inline-block text-xs bg-[#18794E] text-[#DDF2E3] px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                  لوحة الإدارة الرسمية
                </span>
              </div>
              <p className="text-xs text-[#DDF2E3]/90 hidden md:block">
                للإقراء والإجازة بالسند المتصل إلى رسول الله ﷺ
              </p>
            </div>
          </div>

          {/* Quick Info & Action Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Official Contact Badges */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-[#DDF2E3] bg-[#0B3F28]/60 py-1.5 px-3 rounded-lg border border-white/10">
              <span className="flex items-center gap-1.5" title="الهاتف الرسمي">
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                <span dir="ltr">0990161372</span>
              </span>
              <span className="w-px h-3 bg-white/20"></span>
              <span className="flex items-center gap-1.5" title="البريد المعتمد">
                <Mail className="w-3.5 h-3.5 text-emerald-300" />
                <span dir="ltr">kalidahd7@gmil.com</span>
              </span>
            </div>

            {/* Live Bot Simulator Launcher */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-all duration-150 transform active:scale-95 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-stone-950" />
              <span>محاكي البوت الحي</span>
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center bg-[#18794E] rounded-lg p-1 border border-white/15">
              <Globe className="w-4 h-4 text-[#DDF2E3] ml-1 mr-1 hidden sm:inline" />
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

            {/* Super Admin Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-white/10 py-1 px-2.5 rounded-lg border border-white/10 text-xs">
              <Shield className="w-4 h-4 text-amber-300" />
              <div className="text-right">
                <span className="block font-semibold text-white">المدير العام</span>
                <span className="block text-[10px] text-emerald-200">khdahd241@gmail.com</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
