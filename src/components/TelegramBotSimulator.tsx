import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Phone,
  BookOpen,
  CreditCard,
  Clock,
  Users,
  Shield,
  MessageSquare,
  Globe,
  ChevronLeft,
} from 'lucide-react';
import { Language } from '../types';

interface MessageItem {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: { label: string; action: () => void }[];
  time: string;
}

export const TelegramBotSimulator: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLang, setCurrentLang] = useState<Language>('ar');
  const [userRole, setUserRole] = useState<'student' | 'admin'>('student');
  const [balance, setBalance] = useState<number>(240);
  const [hasGroup, setHasGroup] = useState<boolean>(true);
  const [regStep, setRegStep] = useState<number>(0);
  const [regData, setRegData] = useState<Record<string, string>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial /start sequence
    restartBot();
  }, [currentLang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTimeString = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const restartBot = () => {
    setRegStep(0);
    setRegData({});
    const welcomeText =
      currentLang === 'ar'
        ? `مرحباً بكم في مقرأة الإمام الجزري للإقراء والإجازة بالسند 🌿\n\nصرح قرآني مبارك يُعنى بتعليم كتاب الله تعالى، وضبط أحكام التلاوة والتجويد، ومنح الإجازات بالسند المتصل إلى رسول الله ﷺ بروايات وقراءات متواترة.\n\nيرجى اختيار لغة البوت المفضلة:`
        : currentLang === 'en'
        ? `Welcome to Imam Al-Jazari Quran Recitation & Ijazah Center 🌿\n\nA blessed Quranic institution dedicated to teaching the Holy Quran, perfecting recitation & Tajweed rules, and granting connected chains of transmission (Sanad).\n\nPlease choose your language:`
        : `ወደ ኢማም አል-ጀዘሪ የቁርአን ንባብ እና የኢጃዛ ማዕከል እንኳን በደህና መጡ 🌿\n\nእባክዎ ቋንቋ ይምረጡ:`;

    setMessages([
      {
        id: 'msg-start',
        sender: 'bot',
        text: welcomeText,
        buttons: [
          { label: '🇸🇦 العربية', action: () => handleSetLang('ar') },
          { label: '🇬🇧 English', action: () => handleSetLang('en') },
          { label: '🇪🇹 አማርኛ', action: () => handleSetLang('am') },
        ],
        time: getTimeString(),
      },
    ]);
  };

  const handleSetLang = (lang: Language) => {
    setCurrentLang(lang);
    const confirmText =
      lang === 'ar'
        ? 'تم ضبط اللغة بنجاح إلى: العربية 🇸🇦\n\nاختر من القائمة الرئيسية:'
        : lang === 'en'
        ? 'Language set successfully to: English 🇬🇧\n\nChoose an option from the main menu:'
        : 'ቋንቋው በተሳካ ሁኔታ ተመርጧል: አማርኛ 🇪🇹\n\nከዋናው ማውጫ ይምረጡ:';

    addBotMessage(confirmText, getMainButtons(lang));
  };

  const getMainButtons = (lang: Language = currentLang) => {
    if (lang === 'en') {
      return [
        { label: '📖 About Center', action: () => handleCommand('/about') },
        { label: '📚 Programs', action: () => handleCommand('/programs') },
        { label: '📝 Register', action: () => handleCommand('/register') },
        { label: '💳 Packages', action: () => handleCommand('/packages') },
        { label: '⏱ My Balance', action: () => handleCommand('/balance') },
        { label: '👥 My Group', action: () => handleCommand('/mygroup') },
        { label: '💬 Support', action: () => handleCommand('/support') },
        { label: '🛡 Admin Menu', action: () => handleCommand('/admin') },
      ];
    }
    if (lang === 'am') {
      return [
        { label: '📖 ስለ ማዕከሉ', action: () => handleCommand('/about') },
        { label: '📚 ፕሮግራሞች', action: () => handleCommand('/programs') },
        { label: '📝 መመዝገብ', action: () => handleCommand('/register') },
        { label: '💳 ፓኬጆች', action: () => handleCommand('/packages') },
        { label: '⏱ ሂሳቤ', action: () => handleCommand('/balance') },
        { label: '👥 ክፍሌ (ሀለቃ)', action: () => handleCommand('/mygroup') },
        { label: '💬 ድጋፍ', action: () => handleCommand('/support') },
        { label: '🛡 አስተዳዳሪ', action: () => handleCommand('/admin') },
      ];
    }
    return [
      { label: '📖 التعريف بالمقرأة', action: () => handleCommand('/about') },
      { label: '📚 البرامج التعليمية', action: () => handleCommand('/programs') },
      { label: '📝 التسجيل والالتحاق', action: () => handleCommand('/register') },
      { label: '💳 الباقات وشراء الدقائق', action: () => handleCommand('/packages') },
      { label: '⏱ رصيدي من الدقائق', action: () => handleCommand('/balance') },
      { label: '👥 مجموعتي التعليمية', action: () => handleCommand('/mygroup') },
      { label: '💬 التواصل والدعم', action: () => handleCommand('/support') },
      { label: '🛡 لوحة الإدارة', action: () => handleCommand('/admin') },
    ];
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        time: getTimeString(),
      },
    ]);
  };

  const addBotMessage = (
    text: string,
    buttons?: { label: string; action: () => void }[]
  ) => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text,
          buttons,
          time: getTimeString(),
        },
      ]);
    }, 350);
  };

  const handleCommand = (cmd: string) => {
    addUserMessage(cmd);

    if (cmd === '/start') {
      restartBot();
      return;
    }

    if (cmd === '/about') {
      addBotMessage(
        `🌿 *مقرأة الإمام الجزري للإقراء والإجازة بالسند*\n\nالمقرأة مؤسسة قرآنية رائدة تهدف إلى:\n• تعليم القرآن الكريم تلاوةً وحفظاً وتدبراً.\n• تصحيح الأداء ومخارج الحروف على أصول القراءات.\n• منح الإجازات بالسند المتصل لنخبة الطلاب المتقنين.\n\n📞 الهاتف المعتمد: 0990161372\n📧 البريد المعتمد: kalidahd7@gmil.com`,
        getMainButtons()
      );
      return;
    }

    if (cmd === '/programs') {
      addBotMessage(
        `📚 *البرامج التعليمية المتاحة في المقرأة:*\n\n1. التلقين وتصحيح الأداء (100 دقيقة)\n2. الحفظ المكثف (300 دقيقة)\n3. الإجازة برواية حفص عن عاصم (600 دقيقة)\n4. الإجازة بالقراءات السبع (1000 دقيقة)\n\nاختر برنامجاً لمعرفة شروطه أو اضغط للتسجيل:`,
        [
          { label: 'التلقين وتصحيح الأداء', action: () => handleProgramDetail('تلقين') },
          { label: 'الحفظ المكثف', action: () => handleProgramDetail('حفظ') },
          { label: 'الإجازة برواية حفص', action: () => handleProgramDetail('حفص') },
          { label: 'الإجازة بالقراءات السبع', action: () => handleProgramDetail('سبع') },
        ]
      );
      return;
    }

    if (cmd === '/packages') {
      addBotMessage(
        `💳 *باقات الدقائق والأسعار الرسمية المعتمدة:*\n\n• باقة 100 دقيقة: 500 ETB\n• باقة 200 دقيقة: 1000 ETB\n• باقة 300 دقيقة: 1470 ETB\n• باقة 400 دقيقة: 1920 ETB\n• باقة 500 دقيقة: 2350 ETB\n• باقة 600 دقيقة: 2760 ETB\n• باقة 1000 دقيقة: 4500 ETB\n\nاختر باقة للبدء بإجراءات الشراء الآمنة:`,
        [
          { label: 'باقة 100 دقيقة (500 ETB)', action: () => handleSelectPackage('pkg-100', 100, 500) },
          { label: 'باقة 300 دقيقة (1470 ETB)', action: () => handleSelectPackage('pkg-300', 300, 1470) },
          { label: 'باقة 600 دقيقة (2760 ETB)', action: () => handleSelectPackage('pkg-600', 600, 2760) },
          { label: 'باقة 1000 دقيقة (4500 ETB)', action: () => handleSelectPackage('pkg-1000', 1000, 4500) },
        ]
      );
      return;
    }

    if (cmd === '/balance') {
      addBotMessage(
        `⏱ *رصيدي من الدقائق*\n\n👤 الطالب: بلال حسين\n🟢 الرصيد الحالي المتاح: *${balance} دقيقة*\n\n📊 *الإحصائيات المالية:*\n• إجمالي المشتراة: 300 دقيقة\n• إجمالي المستهلكة: 60 دقيقة\n• رصيد المكافآت: 0 دقيقة\n\n📜 *آخر الحركات المسجلة:*\n• 2026-10-25 | -60 دقيقة | خصم حصة تسميع سورة البقرة\n• 2026-10-22 | +300 دقيقة | اعتماد شراء باقة عبر CBE`,
        getMainButtons()
      );
      return;
    }

    if (cmd === '/mygroup') {
      if (hasGroup) {
        addBotMessage(
          `👥 *حلقتك القرآنية*\n\n🌿 الحلقة: *حلقة الإمام الشاطبي (حفظ مكثف - رجال)*\n📚 البرنامج: الحفظ المكثف\n👨‍🏫 المعلم المشرف: الشيخ إسماعيل الأثيوبي\n🕒 الفترة: صباحية\n👥 المقاعد: 8 / 15 طالب\n\n🔗 رابط التيليجرام الرسمي للحلقة مفعل ومحمي لطلاب هذه الحلقة فقط:`,
          [
            { label: '🔗 دخول مجموعة تيليجرام الحلقة', action: () => addBotMessage('تم توجيهك لرابط مجموعة التيليجرام الرسمية.') },
            { label: '⬅️ القائمة الرئيسية', action: () => addBotMessage('الرئيسية:', getMainButtons()) },
          ]
        );
      } else {
        addBotMessage(
          `⏳ لم يتم تعيينك إلى حلقة بعد، أو أن طلب التحاقك قيد الفحص وتوزيع الحلقات.\nسيصلك إشعار فوري بمجرد تعيين مجموعتك.`,
          getMainButtons()
        );
      }
      return;
    }

    if (cmd === '/support') {
      addBotMessage(
        `💬 *الدعم الفني والتواصل مع إدارة المقرأة*\n\nنسعد باستقبال استفساراتكم:\n📞 هاتف الدعم: 0990161372\n📧 بريد الدعم: kalidahd7@gmil.com\n\nأو يمكنك فتح تذكرة دعم فني هنا مباشرة.`,
        [
          { label: '📩 فتح تذكرة دعم جديدة', action: () => handleStartTicket() },
          { label: '⬅️ القائمة الرئيسية', action: () => addBotMessage('الرئيسية:', getMainButtons()) },
        ]
      );
      return;
    }

    if (cmd === '/register') {
      setRegStep(1);
      addBotMessage(
        `📝 *بدء التسجيل والالتحاق بمقرأة الإمام الجزري*\n\n1️⃣ أدخل اسمك الكامل الثلاثي كما ترغب أن يظهر في سجلات الإجازة:`
      );
      return;
    }

    if (cmd === '/admin') {
      addBotMessage(
        `🛡 *لوحة الإدارة المركزية لمقرأة الإمام الجزري*\n\nمرحباً بك يا فضيلة الشيخ خالد أحمد (المدير العام).\nصلاحياتك: غير مقيدة (Super Admin).\n\nاختر القسم المطلوب:`,
        [
          { label: '📝 مراجعة التسجيلات (1)', action: () => addBotMessage('طلب معلق: أحمد صالح - إجازة حفص - السعودية.\nالإجراء: [قبول وتعيين] أو [رفض مع سبب]') },
          { label: '💳 مراجعة المدفوعات (1)', action: () => addBotMessage('طلب دفع معلق: زينب عبد الله (500 ETB / 100 دقيقة).\nالمرجع: TB-7766110022 عبر Telebirr.\nالإجراء: [اعتماد ذري] أو [رفض مع سبب]') },
          { label: '⏱ إضافة/خصم دقائق', action: () => addBotMessage('أدخل معرف الطالب وعدد الدقائق والسبب الإلزامي.') },
          { label: '⬅️ القائمة الرئيسية', action: () => addBotMessage('الرئيسية:', getMainButtons()) },
        ]
      );
      return;
    }

    // Default response
    addBotMessage(`لم أفهم الأمر المطلوب. يرجى الاختيار من القائمة:`, getMainButtons());
  };

  const handleProgramDetail = (type: string) => {
    addBotMessage(
      `📌 *برنامج ${type === 'حفص' ? 'الإجازة برواية حفص عن عاصم' : type === 'حفظ' ? 'الحفظ المكثف' : 'التلقين وتصحيح الأداء'}*\n\n📖 *الوصف:* ختمة كاملة بالإتقان للحصول على السند المتصل إلى رسول الله ﷺ.\n🎯 *الأهداف:* نيل السند وضبط التلاوة.\n📋 *المتطلبات:* حفظ القرآن كاملاً ودراسة الجزرية.`,
      [
        { label: '📝 التسجيل في هذا البرنامج', action: () => handleCommand('/register') },
        { label: '⬅️ عودة للبرامج', action: () => handleCommand('/programs') },
      ]
    );
  };

  const handleSelectPackage = (pkgId: string, mins: number, price: number) => {
    addBotMessage(
      `💳 *طلب شراء باقة ${mins} دقيقة*\n💰 المبلغ المطلوب: *${price} ETB*\n\nاختر طريقة الدفع المناسبة للتحويل:`,
      [
        { label: '🏦 CBE (البنك التجاري)', action: () => handlePaymentInstructions('CBE', price, mins) },
        { label: '🏦 بنك الحبشة (BOA)', action: () => handlePaymentInstructions('BOA', price, mins) },
        { label: '📱 Telebirr', action: () => handlePaymentInstructions('Telebirr', price, mins) },
        { label: '📱 M-Pesa Safaricom', action: () => handlePaymentInstructions('M-Pesa', price, mins) },
      ]
    );
  };

  const handlePaymentInstructions = (bank: string, price: number, mins: number) => {
    const accountMap: Record<string, string> = {
      CBE: '1000285374425',
      BOA: '226626646',
      Telebirr: '099161372',
      'M-Pesa': '0721009122',
    };
    const accNumber = accountMap[bank] || '1000285374425';
    addBotMessage(
      `🏦 *تعليمات السداد عبر ${bank}*\n💰 المبلغ: ${price} ETB (${mins} دقيقة)\n🏛 الجهة: ${bank}\n👤 المستفيد: Kalid Ahmed Mustefa\n🔢 رقم الحساب / الهاتف: \`${accNumber}\`\n\n📌 يرجى التحويل ثم الضغط على "لقد قمت بالتحويل" لإرسال رقم المرجع وصورة الإيصال. لن يضاف الرصيد إلا بعد اعتماد الإدارة.`,
      [
        {
          label: '📤 لقد قمت بالتحويل - إدخال البيانات',
          action: () => {
            addBotMessage(
              `✅ *تم استلام طلب السداد بنجاح!*\n🔢 المرجع: ${bank}-TX-998811\n⏱ الدقائق المطلوبة: ${mins} دقيقة\n\nطلبك الآن *قيد المراجعة* لدى الإدارة المالية وسيصلك إشعار فور الاعتماد.`
            );
          },
        },
        { label: '❌ إلغاء العملية', action: () => handleCommand('/start') },
      ]
    );
  };

  const handleStartTicket = () => {
    addBotMessage(
      `📩 تم فتح تذكرة دعم جديدة برقم *#TK-9021*.\nأدخل تفاصيل استفسارك وسيصل رد المشرف إليك هنا مباشرة.`
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    if (regStep === 1) {
      addUserMessage(text);
      setRegData((prev) => ({ ...prev, name: text }));
      setRegStep(2);
      addBotMessage(`2️⃣ أدخل عمرك أو سنة ميلادك:`);
      return;
    }
    if (regStep === 2) {
      addUserMessage(text);
      setRegData((prev) => ({ ...prev, age: text }));
      setRegStep(3);
      addBotMessage(`3️⃣ أدخل دولتك الحالية ومدينتك:`);
      return;
    }
    if (regStep === 3) {
      addUserMessage(text);
      setRegData((prev) => ({ ...prev, country: text }));
      setRegStep(4);
      addBotMessage(
        `🎉 *تم استلام طلب التسجيل بنجاح!*\nرقم الطلب: *#REG-8821*\n\nستقوم اللجنة الأكاديمية بمراجعة طلبك وإسنادك إلى الحلقة المناسبة وتزويدك برابط مجموعة تيليجرام.`,
        getMainButtons()
      );
      setRegStep(0);
      return;
    }

    if (text.startsWith('/')) {
      handleCommand(text);
    } else {
      addUserMessage(text);
      addBotMessage(`تم استلام رسالتك: "${text}". يرجى الاختيار من الأزرار التفاعلية أدناه:`, getMainButtons());
    }
  };

  return (
    <div className="space-y-4">
      {/* Simulation Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-stone-900">محاكي بوت تيليجرام الحي (Interactive aiogram 3.x Engine)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
            <span className="text-stone-500 pr-1">الدور:</span>
            <button
              onClick={() => setUserRole('student')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                userRole === 'student' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              طالب
            </button>
            <button
              onClick={() => setUserRole('admin')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                userRole === 'admin' ? 'bg-[#105C3B] font-bold text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              مدير عام
            </button>
          </div>

          <button
            onClick={restartBot}
            className="flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تشغيل (/start)</span>
          </button>
        </div>
      </div>

      {/* Smartphone Device Frame */}
      <div className="max-w-md mx-auto bg-stone-900 rounded-[38px] p-3 shadow-2xl border-4 border-stone-800">
        {/* Device Notch */}
        <div className="h-5 w-36 bg-stone-800 rounded-b-2xl mx-auto mb-2 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-stone-950 mr-2"></div>
          <div className="w-12 h-1 bg-stone-700 rounded-full"></div>
        </div>

        {/* Telegram App Interface */}
        <div className="bg-[#0e1621] rounded-[28px] overflow-hidden flex flex-col h-[600px] border border-stone-700">
          
          {/* Telegram Header */}
          <div className="bg-[#17212b] px-4 py-3 border-b border-stone-700/60 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <ChevronLeft className="w-5 h-5 text-sky-400 cursor-pointer" onClick={restartBot} />
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#105C3B] to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                ج
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <span>بوت مقرأة الجزري</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-[10px] text-stone-400">bot • @AlJazariQuranBot</div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              online
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0e1621] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[88%] ${
                  msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-xs text-right ${
                    msg.sender === 'user'
                      ? 'bg-[#2b5278] text-white rounded-tr-xs'
                      : 'bg-[#182533] text-stone-100 rounded-tl-xs border border-stone-700/40'
                  }`}
                >
                  {msg.text}

                  {/* Inline Buttons inside message */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-700/60 flex flex-wrap gap-1.5">
                      {msg.buttons.map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={btn.action}
                          className="bg-[#2b5278]/60 hover:bg-[#2b5278] text-sky-200 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-sky-500/20"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-stone-400 text-left mt-1 font-mono">
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="bg-[#17212b] p-2 border-t border-stone-700/60 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="اكتب رسالة أو أمراً (مثال: /programs, /balance)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#242f3d] text-white placeholder-stone-400 text-xs px-3 py-2.5 rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
