import React, { useState } from 'react';
import {
  StudentBalance,
  MinutePackage,
  PaymentMethodConfig,
  QuranGroup,
  BalanceLedgerEntry,
  StudyShift
} from '../types';
import {
  Clock,
  Sparkles,
  CreditCard,
  Send,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Volume2,
  Mic,
  Copy,
  ChevronRight,
  Upload
} from 'lucide-react';

interface StudentPortalProps {
  studentName: string;
  studentCode: string;
  studentGender: 'male' | 'female';
  studentShift: StudyShift;
  currentBalance: number;
  assignedGroup?: QuranGroup;
  ledgerHistory: BalanceLedgerEntry[];
  packages: MinutePackage[];
  paymentMethods: PaymentMethodConfig[];
  onRequestEmergencyLoan: () => void;
  onSubmitPayment: (pkgId: string, amount: number, minutes: number, txRef: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  studentName,
  studentCode,
  studentGender,
  studentShift,
  currentBalance,
  assignedGroup,
  ledgerHistory,
  packages,
  paymentMethods,
  onRequestEmergencyLoan,
  onSubmitPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'packages' | 'ledger'>('chat');
  
  // Chat simulator state
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'sheikh' | 'student' | 'system'; text: string; time: string }>>([
    {
      id: 'm1',
      sender: 'sheikh',
      text: `السلام عليكم ورحمة الله وبركاته يا طالبنا المبارك (${studentName}) 🌿 مرحباً بك في مقرأة الإمام الجزري للإقراء والإجازة بالسند. هل أنت جاهز لجلسة التسميع القادمة؟`,
      time: '09:00 ص',
    },
    {
      id: 'm2',
      sender: 'system',
      text: `🔔 تنبيه آلي: رصيدك الحالي هو ${currentBalance} دقيقة إقراء. يمكنك طلب سلفة طارئة 15 دقيقة فوراً إذا شارف الرصيد على النفاد.`,
      time: '09:05 ص',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Payment form state
  const [selectedPackage, setSelectedPackage] = useState<MinutePackage | null>(packages[0] || null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig>(paymentMethods[0]);
  const [txRef, setTxRef] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const isLowBalance = currentBalance <= 15 && currentBalance > 0;
  const isZeroBalance = currentBalance <= 0;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: `std-${Date.now()}`,
      sender: 'student' as const,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Simulate teacher fast reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          sender: 'sheikh' as const,
          text: 'بارك الله فيك، تم استلام رسالتك وسأكون معك على البث الصوتي المباشر في مجموعة المقرأة بإذن الله.',
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }, 1200);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !txRef.trim()) return;

    onSubmitPayment(selectedPackage.id, selectedPackage.price_etb, selectedPackage.minutes, txRef.trim());
    setPaymentSuccess(true);
    setTxRef('');
    setTimeout(() => setPaymentSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200" dir="rtl">
      
      {/* 1. Student Identity & Balance Header Card (Chat / TMA style) */}
      <div className="bg-gradient-to-l from-[#105C3B] to-[#18794E] rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Islamic Ornament Background */}
        <div className="absolute left-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          
          {/* Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center font-bold text-lg text-emerald-100 shadow-inner">
              {studentCode.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-['Amiri',serif]">
                  {studentName}
                </h2>
                <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                  {studentCode}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 flex items-center gap-2 mt-1">
                <span>الفترة: <b>{studentShift === 'morning' ? 'صباحية (09:00 - 12:00)' : studentShift === 'night' ? 'ليلية (21:00 - 23:00)' : 'مسائية (14:00 - 15:30)'}</b></span>
                <span>•</span>
                <span>{assignedGroup?.name || 'حلقة التسميع العامة'}</span>
              </p>
            </div>
          </div>

          {/* Balance Widget */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-white/15 flex items-center justify-between sm:justify-start gap-4">
            <div>
              <span className="text-[11px] text-emerald-200 block">رصيد دقائق التسميع:</span>
              <span className={`text-2xl font-bold font-mono ${isZeroBalance ? 'text-rose-300' : isLowBalance ? 'text-amber-300' : 'text-emerald-200'}`}>
                {currentBalance} <span className="text-xs font-normal">دقيقة</span>
              </span>
            </div>

            {/* Quick Emergency Loan button */}
            <button
              onClick={onRequestEmergencyLoan}
              className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              title="سلفة طارئة 15 دقيقة لمواصلة التسميع"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>سلفة طارئة (15د)</span>
            </button>
          </div>

        </div>

        {/* Low balance alert banner */}
        {isZeroBalance ? (
          <div className="mt-4 bg-rose-950/70 border border-rose-400/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-rose-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>نفد رصيدك بالكامل! تم تعليق صلاحية الإرسال بالحلقتين. اطلب سلفة 15د أو اشحن باقة الآن.</span>
            </div>
            <button
              onClick={() => setActiveTab('packages')}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shrink-0"
            >
              شحن الآن
            </button>
          </div>
        ) : isLowBalance ? (
          <div className="mt-4 bg-amber-950/60 border border-amber-400/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>تنبيه: متبقي لديك {currentBalance} دقيقة فقط (أقل من 15 دقيقة). بادر بالشحن لتجنب الكتم.</span>
            </div>
            <button
              onClick={() => setActiveTab('packages')}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shrink-0"
            >
              شحن باقة
            </button>
          </div>
        ) : null}

        {/* Group Link */}
        {assignedGroup?.telegram_invite_link && (
          <div className="mt-3.5 flex items-center justify-between bg-white/10 hover:bg-white/15 rounded-xl px-4 py-2 text-xs transition-colors border border-white/10">
            <span className="text-emerald-100">مجموعتك الرسمية للبث الصوتي والتسميع:</span>
            <a
              href={assignedGroup.telegram_invite_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-bold text-white hover:text-emerald-200 font-mono"
            >
              <span>الانتقال للمجموعة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs (Chat Style) */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-[#105C3B] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>المحادثة المباشرة مع المقرئ</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'packages'
              ? 'bg-[#105C3B] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>شحن الدقائق والباقات</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-[#105C3B] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>كشف رصيدي والجلسات</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB A: Chat with Teacher / Sheikh (WhatsApp / Telegram Chat Experience) */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
          
          {/* Chat Header */}
          <div className="bg-stone-50 border-b border-stone-200 p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  شيخ
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-0 left-0 border-2 border-white"></span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">فضيلة الشيخ المقرئ (معلم الحلقة)</h4>
                <span className="text-[10px] text-emerald-600 font-medium">متصل الآن في حلقة التسميع</span>
              </div>
            </div>

            <div className="text-xs text-stone-400 font-mono">
              حلقة الإتقان
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8faf8]">
            {messages.map((msg) => {
              const isMe = msg.sender === 'student';
              const isSys = msg.sender === 'system';

              if (isSys) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="bg-stone-200/80 text-stone-700 text-[11px] px-3 py-1 rounded-full text-center max-w-sm">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-[#105C3B] text-white rounded-br-xs'
                        : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`block text-[10px] mt-1 text-left ${isMe ? 'text-emerald-200' : 'text-stone-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  setTimeout(() => {
                    setIsRecording(false);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `v-${Date.now()}`,
                        sender: 'student',
                        text: '🎤 تسجيل صوتي لتلاوة الآيات (01:15 دقيقة)',
                        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                      }
                    ]);
                  }, 2000);
                }
              }}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title="إرسال مقطع صوتي للتسميع"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب رسالتك أو استفسارك للمقرئ..."
              className="flex-1 py-2 px-3.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-900"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 bg-[#105C3B] hover:bg-[#0B3F28] disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* TAB B: Buy Packages & Recharge Minutes */}
      {activeTab === 'packages' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Amiri',serif]">
              باقات دقائق الإقراء وشحن الرصيد
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              اختر الباقة المناسبة وقم بالتحويل عبر الحسابات البنكية المعتمدة ثم أرسل رقم الحوالة للاعتماد التلقائي
            </p>
          </div>

          {/* Package Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#105C3B] bg-emerald-50/80 shadow-xs ring-1 ring-[#105C3B]'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-900 block">{pkg.name_ar}</span>
                  <div className="text-lg font-bold text-emerald-700 font-mono my-1">
                    {pkg.minutes} <span className="text-xs font-normal">دقيقة</span>
                  </div>
                  <span className="text-xs font-bold text-stone-600 block">
                    {pkg.price_etb} ETB
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bank Accounts Info */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <span className="text-xs font-bold text-stone-700 block">الحساب البنكي المعتمد للتحويل:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block">Commercial Bank of Ethiopia (CBE)</span>
                  <span className="font-mono font-bold text-stone-900">1000234567891</span>
                  <span className="text-[10px] text-stone-500 block">باسم: مقرأة الإمام الجزري</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText('1000234567891')}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 cursor-pointer"
                  title="نسخ رقم الحساب"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block">Telebirr المحفظة الإلكترونية</span>
                  <span className="font-mono font-bold text-stone-900">0990161372</span>
                  <span className="text-[10px] text-stone-500 block">باسم: المقرأة القرآنية</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText('0990161372')}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 cursor-pointer"
                  title="نسخ الرقم"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handlePaymentSubmit} className="space-y-3 bg-white border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950">
                الباقة المختارة: <b>{selectedPackage?.minutes} دقيقة ({selectedPackage?.price_etb} ETB)</b>
              </span>
              <span className="text-stone-400">تضاف لرصيدك فور مراجعة الإيصال</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                رقم الحوالة المرجعي (Transaction Reference ID):
              </label>
              <input
                type="text"
                required
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="مثال: FT2603348877 أو CBE-998822..."
                className="w-full text-xs font-mono py-2 px-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {paymentSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم إرسال طلب الشحن بنجاح! سيتم إشعارك في تيليجرام فور اعتماده من المشرف.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#105C3B] hover:bg-[#0B3F28] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>إرسال طلب اعتماد الشحن للمشرف</span>
            </button>
          </form>

        </div>
      )}

      {/* TAB C: Personal Ledger History */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Amiri',serif]">
              كشف حساب الدقائق والجلسات الخاص بي
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              سجل الحركات المالية الموثقة لدقائق التسميع والإقراء
            </p>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {ledgerHistory.length === 0 ? (
              <div className="py-8 text-center text-stone-400">
                لا توجد عمليات مسجلة حتى الآن.
              </div>
            ) : (
              ledgerHistory.map((entry) => {
                const isAdd = entry.minutes_change > 0;
                return (
                  <div key={entry.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block">{entry.reason}</span>
                      <span className="text-[11px] text-stone-400 font-mono">{entry.created_at}</span>
                    </div>

                    <div className="text-left font-mono">
                      <span className={`font-bold text-xs ${isAdd ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isAdd ? `+${entry.minutes_change}` : entry.minutes_change} د
                      </span>
                      <span className="text-[11px] text-stone-400 block">الرصيد بعد: {entry.balance_after}د</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
