import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Apple, Chrome, ExternalLink, Check, Copy, X, QrCode, Sparkles } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'telegram'>('telegram');

  const appUrl = window.location.origin;
  const botTelegramUrl = 'https://t.me/ImamAljazariBot';

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('لتثبيت التطبيق: افتح قائمة المتصفح (⋮ أو ⎘) ثم اختر "إضافة إلى الشاشة الرئيسية"');
    }
  };

  const copyAppUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden text-right flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-[#105C3B] to-[#18794E] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner text-[#DDF2E3]">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Amiri',serif]">
                صندوق تحميل تطبيق الويب (PWA & TMA)
              </h3>
              <p className="text-xs text-emerald-100">
                تطبيق مقرأة الإمام الجزري يعمل كتطبيق هاتف وتطبيق تيليجرام مصغر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800 text-sm">
          
          {/* Quick Platform Switcher */}
          <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-xl">
            <button
              onClick={() => setActivePlatform('telegram')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePlatform === 'telegram'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-500" />
              <span>تطبيق تيليجرام (TMA)</span>
            </button>
            <button
              onClick={() => setActivePlatform('android')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePlatform === 'android'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Chrome className="w-4 h-4 text-emerald-600" />
              <span>أندرويد (Android)</span>
            </button>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePlatform === 'ios'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Apple className="w-4 h-4 text-stone-800" />
              <span>آيفون (iOS)</span>
            </button>
          </div>

          {/* Platform Specific Instruction */}
          {activePlatform === 'telegram' && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sky-900 font-bold">
                <Sparkles className="w-5 h-5 text-sky-600" />
                <span>التطبيق المصغر لتلغرام (Telegram Mini App)</span>
              </div>
              <p className="text-xs text-sky-800 leading-relaxed">
                يمكنك فتح واستخدام التطبيق مباشرة من داخل تيليجرام دون الحاجة لأي متصفح، مع إشعارات فورية وتكامل تام مع حسابك.
              </p>
              <a
                href={botTelegramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
              >
                <span>تشغيل التطبيق المصغر في تيليجرام</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {activePlatform === 'android' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Chrome className="w-4 h-4 text-emerald-600" />
                  <span>تثبيت PWA على نظام أندرويد</span>
                </span>
                {deferredPrompt && (
                  <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    جاهز للتثبيت
                  </span>
                )}
              </div>
              <ol className="text-xs text-emerald-900 space-y-2 list-decimal list-inside pr-1 leading-relaxed">
                <li>افتح الموقع عبر متصفح <b>Google Chrome</b> أو <b>Brave</b>.</li>
                <li>اضغط على زر <b>تثبيت التطبيق</b> أدناه أو اضغط على قائمة المتصفح (⋮).</li>
                <li>اختر <b>"إضافة إلى الشاشة الرئيسية"</b> أو <b>"تثبيت التطبيق"</b>.</li>
              </ol>
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 bg-[#105C3B] hover:bg-[#0B3F28] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalled ? 'التطبيق مثبت بالفعل ✅' : 'تثبيت التطبيق على الشاشة الرئيسية الآن'}</span>
              </button>
            </div>
          )}

          {activePlatform === 'ios' && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Apple className="w-4 h-4" />
                <span>تثبيت PWA على أجهزة Apple (iPhone / iPad)</span>
              </div>
              <ol className="text-xs text-stone-700 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                  <span>افتح الرابط في متصفح <b>Safari</b> على هاتفك.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                  <span>اضغط على زر المشاركة أسفل الشاشة <b>(أيقونة المربع ذو السهم ⎘)</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                  <span>مرر للأسفل واضغط على <b>"إضافة إلى الصفحة الرئيسية" ⊞ (Add to Home Screen)</b>.</span>
                </li>
              </ol>
            </div>
          )}

          {/* Quick Copy Link Box */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/80 flex items-center justify-between gap-2">
            <div className="truncate text-xs text-stone-600 font-mono" dir="ltr">
              {appUrl}
            </div>
            <button
              onClick={copyAppUrl}
              className="flex items-center gap-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>

          {/* Offline & PWA Benefits */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>يعمل بدون شريط عنوان المتصفح</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>دعم التخزين المؤقت دون اتصال</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>واجهة عربية كاملة RTL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>تحديثات تلقائية فورية</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
