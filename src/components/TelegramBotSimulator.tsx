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
  VolumeX,
  Volume2,
  Zap,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { Language, StudyShift } from '../types';

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
  const [studentCode, setStudentCode] = useState<string>('IM-1001');
  const [studentGender, setStudentGender] = useState<'male' | 'female'>('male');
  const [hasGroup, setHasGroup] = useState<boolean>(true);
  const [isRestricted, setIsRestricted] = useState<boolean>(false);
  const [borrowedMinutes, setBorrowedMinutes] = useState<number>(0);

  // Group Details
  const [groupInfo, setGroupInfo] = useState({
    code: 'IM_MORNING',
    name: 'حلقة الذكور - الفترة الصباحية (IM Morning)',
    chatId: '-1003701915037',
    link: 'https://t.me/IM_MORNING_2',
    shift: 'morning',
    shiftTime: '09:00 ص - 12:00 م',
    teacher: 'الشيخ إسماعيل الأثيوبي',
  });

  // Interactive Registration FSM state
  const [regStep, setRegStep] = useState<number>(0);
  const [regData, setRegData] = useState<{
    name?: string;
    gender?: 'male' | 'female';
    shift?: StudyShift;
    program?: string;
    country?: string;
    phone?: string;
  }>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    }, 280);
  };

  // Quick Action Triggers
  const simulateMorningLessonReminder = () => {
    addBotMessage(
      `🔔 *إشعار موعد الفترة الصباحية (09:00 ص - 12:00 م)*\n\n🌿 أقبلوا إلى مائدة القرآن ونور الفرقان... يا أهل القرآن وخاصته 📖✨\n\nنذكركم بأن موعد حلقتكم الصباحية المباركة قد اقترب.\nأخلصوا النوايا، وتطيبوا بذكر الله، وافتحوا قلوبكم ومصاحفكم لكلام رب العالمين.\n\n🎙️ مع مشايخ ومقرئي مقرأة الإمام الجزري الفضلاء.\nوفقكم الله للعلم والعمل والارتقاء.`,
      [
        { label: '🔗 الانضمام للحلقة الصباحية', action: () => addBotMessage(`تم توجيهك إلى: ${groupInfo.link}`) },
      ]
    );
  };

  const simulateAfternoonLessonReminder = () => {
    addBotMessage(
      `🔔 *إشعار موعد الفترة المسائية (02:00 م - 03:30 م)*\n\n✨ طوبى لمن جعل القرآن ربيعه وأنيسه... تذكرة موعد حلقتكم المسائية المباركة 🌺\n\nنحيطكم علماً بأن موعد انعقاد حلقة التلاوة والتسميع سيبدأ بعد قليل.\nجددوا العهد مع كتاب الله، وأقبلوا إلى مجالس الذكر والسكينة، وتهيأوا لمراجعة محفوظكم بكل سكينة وإتقان.\n\n📖 قال رسول الله ﷺ: «خيركم من تعلم القرآن وعلمه».`,
      [
        { label: '🎙️ دخول القاعة المسائية', action: () => addBotMessage(`تم توجيهك إلى: ${groupInfo.link}`) },
      ]
    );
  };

  const simulateNightLessonReminder = () => {
    addBotMessage(
      `🔔 *إشعار موعد الفترة الليلية (09:00 م - 11:00 م)*\n\n🌙 ليل القانتين وراحة الذاكرين... نداء الهدى والبركة 🌟\n\nأحبابنا طلاب وطالبات مقرأة الإمام الجزري، نذكركم بانعقاد حلقتكم الليلية المباركة.\nاختموا يومكم بآيات بينات تتلى، وتطمئن بها القلوب، وتتنزل بها الملائكة والسكينة والرحمة.\n\n🎙️ أعدوا مصاحفكم وجهزوا تلاوتكم، وجعلكم الله من أهل القرآن الذين هم أهل الله وخاصته.`,
      [
        { label: '🌙 الانضمام للمجلس الليلي', action: () => addBotMessage(`تم توجيهك إلى: ${groupInfo.link}`) },
      ]
    );
  };

  const simulateZeroBalanceMute = () => {
    setBalance(0);
    setIsRestricted(true);
    addBotMessage(
      `⚠️ *تنبيه خاص بالرصيد والتقييد بمقرأة الإمام الجزري*\n\nأخي الطالب بلال حسين (كود: \`${studentCode}\`)،\n\nلقد نفد رصيدك التعليمي المتاح (*0 دقيقة*).\n\n🔇 *الإجراء الإشرافي المتخذ:* قام بوت المقرأة بتقييدك في مجموعة التيليجرام (${groupInfo.name})، ومنع إرسال الرسائل والمشاركة الصوتية لحين تجديد الباقة.\n\n💡 *خياراتك الآن:*\n1. شحن باقة دقائق جديدة عبر الحسابات الرسمية.\n2. طلب استلاف رصيد طوارئ (+30 دقيقة) لرفع الحظر فوراً والاستمرار في الحضور.`,
      [
        { label: '⚡ طلب استلاف طوارئ (+30 دقيقة)', action: () => handleEmergencyBorrow() },
        { label: '💳 شحن باقة دقائق الآن', action: () => handleCommand('/packages') },
        { label: '👥 فحص حالة مجموعتي', action: () => handleCommand('/mygroup') },
      ]
    );
  };

  const handleEmergencyBorrow = () => {
    setBalance((prev) => prev + 30);
    setBorrowedMinutes((prev) => prev + 30);
    setIsRestricted(false);
    addBotMessage(
      `✅ *تم اعتماد طلب استلاف رصيد الطوارئ بنجاح!*\n\n⏱ أضيفت لك: *30 دقيقة* تعليمية صالحة لحضور الحصص القادمة.\n🟢 رصيدك الحالي: *${balance + 30} دقيقة*\n\n🔓 *رفع التقييد:* قام البوت تلقائياً برفع الحظر في مجموعة التيليجرام (${groupInfo.name})، واستعدت كامل صلاحيات الكتابة والمشاركة في البث الصوتي.\n\nيرجى تسوية الرصيد عند أول شحن لباقة جديدة.`,
      getMainButtons()
    );
  };

  const handleTopUpSuccess = () => {
    setBalance((prev) => prev + 300);
    setIsRestricted(false);
    addBotMessage(
      `🎉 *تم اعتماد شحن باقة 300 دقيقة بنجاح!*\n\n💰 المبلغ: 1470 ETB عبر CBE\n🟢 رصيدك الجديد: *${balance + 300} دقيقة*\n\n🔓 تم تفعيل وتأكيد كامل صلاحياتك في المجموعة والحلقات الصوتية. نسأل الله لك التوفيق والبركة.`,
      getMainButtons()
    );
  };

  const handleCommand = (cmd: string) => {
    addUserMessage(cmd);

    if (cmd === '/start') {
      restartBot();
      return;
    }

    if (cmd === '/about') {
      addBotMessage(
        `🌿 *مقرأة الإمام الجزري للإقراء والإجازة بالسند*\n\nالمقرأة مؤسسة قرآنية رائدة تهدف إلى:\n• تعليم القرآن الكريم تلاوةً وحفظاً وتدبراً.\n• تصحيح الأداء ومخارج الحروف على أصول القراءات.\n• منح الإجازات بالسند المتصل لنخبة الطلاب المتقنين.\n\n🛡️ *إشراف المجموعات الست:* البوت مشرف معتمد في المجموعات الست لجدولة التذكيرات ومتابعة الرصيد التعليمي.\n\n📞 الهاتف المعتمد: 0990161372\n📧 البريد المعتمد: kalidahd7@gmil.com`,
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
        `⏱ *رصيدي من الدقائق*\n\n👤 الطالب: بلال حسين\n🏷️ كود الطالب: \`${studentCode}\`\n🟢 الرصيد الحالي المتاح: *${balance} دقيقة*${
          isRestricted ? '\n⚠️ *حالة المجموعة: مقيد لنفاد الرصيد (0 دقيقة)*' : '\n✅ *حالة المجموعة: نشط ومصرح بالمشاركة*'
        }\n\n📊 *الإحصائيات المالية:*\n• إجمالي المشتراة: 300 دقيقة\n• إجمالي المستهلكة: ${300 - balance} دقيقة\n• رصيد مستلف: ${borrowedMinutes} دقيقة\n\n📜 *آخر الحركات المسجلة:*\n• 2026-11-01 | فحص حالة الرصيد الآلي\n• 2026-10-25 | -60 دقيقة | خصم حصة تسميع سورة البقرة\n• 2026-10-22 | +300 دقيقة | اعتماد باقة عبر CBE`,
        [
          ...(isRestricted
            ? [{ label: '⚡ استلاف طوارئ 30 دقيقة', action: () => handleEmergencyBorrow() }]
            : []),
          { label: '💳 شحن باقة دقائق', action: () => handleCommand('/packages') },
          { label: '⬅️ القائمة الرئيسية', action: () => addBotMessage('الرئيسية:', getMainButtons()) },
        ]
      );
      return;
    }

    if (cmd === '/mygroup') {
      if (hasGroup) {
        addBotMessage(
          `👥 *حلقتك ومجموعتك الرسمية في تيليجرام*\n\n🌿 الحلقة: *${groupInfo.name}*\n🏷️ كود المجموعة: \`${groupInfo.code}\`\n🔢 معرف التيليجرام: \`${groupInfo.chatId}\`\n🕒 الفترة: *${groupInfo.shiftTime}*\n👨‍🏫 المقرئ المشرف: *${groupInfo.teacher}*\n\n🛡️ *إشراف البوت:* نشط مع كامل الصلاحيات.\n${
            isRestricted
              ? '❌ *حالتك في المجموعة: مقيد وممنوع من الكتابة والبث الصوتي (نفد رصيدك).* يرجى الشحن أو الاستلاف فوراً.'
              : '✅ *حالتك في المجموعة: عضو مصرح له بالمشاركة والتسميع الصوتي.*'
          }\n\n🔗 الرابط الرسمي المخصص لحلقتك:`,
          [
            { label: '🔗 دخول مجموعة تيليجرام الحلقة', action: () => addBotMessage(`رابط مجموعتك هو: ${groupInfo.link}`) },
            ...(isRestricted
              ? [{ label: '⚡ استلاف طوارئ (+30 دقيقة)', action: () => handleEmergencyBorrow() }]
              : []),
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
        `📝 *بدء التسجيل والالتحاق بمقرأة الإمام الجزري*\n\n1️⃣ أدخل اسمك الكامل الثلاثي كما ترغب أن يظهر في سجلات الإجازة والسند:`
      );
      return;
    }

    if (cmd === '/admin') {
      addBotMessage(
        `🛡 *لوحة الإدارة المركزية لمقرأة الإمام الجزري*\n\nمرحباً بك يا فضيلة الشيخ خالد أحمد (المدير العام).\nالمعرف: \`7334314796\`\nصلاحياتك: غير مقيدة (Super Admin).\n\nالمجموعات الخاضعة للإشراف: 6 مجموعات دراسية + 3 ملتقيات عامة.\nاختر الإجراء المطلوب:`,
        [
          { label: '👥 المجموعات والتقييد الآلي', action: () => addBotMessage('المجموعات الست نشطة. الطلاب ذوو رصيد 0 دقيقة يتم تقييدهم آلياً مع خيار فك التقييد أو الاستلاف.') },
          { label: '🔔 بث تذكير الصباح (09:00)', action: () => simulateMorningLessonReminder() },
          { label: '🔔 بث تذكير المساء (14:00)', action: () => simulateAfternoonLessonReminder() },
          { label: '🔔 بث تذكير الليل (21:00)', action: () => simulateNightLessonReminder() },
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

  // Multi-step registration flow with Gender (IM/IF), 3 Shifts, and Group routing
  const handleGenderSelection = (gender: 'male' | 'female') => {
    addUserMessage(gender === 'male' ? '👨 ذكر (IM)' : '👩 أنثى (IF)');
    setRegData((prev) => ({ ...prev, gender }));
    setStudentGender(gender);
    setRegStep(3);

    addBotMessage(
      `3️⃣ اختر الفترة الدراسية المناسبة لك (تتوفر 3 فترات يومياً):`,
      [
        { label: '🌅 صباحية (09:00 - 12:00)', action: () => handleShiftSelection('morning') },
        { label: '☀️ مسائية (02:00 - 03:30)', action: () => handleShiftSelection('afternoon') },
        { label: '🌙 ليلية (09:00 - 11:00)', action: () => handleShiftSelection('night') },
      ]
    );
  };

  const handleShiftSelection = (shift: StudyShift) => {
    const shiftLabel =
      shift === 'morning'
        ? '🌅 صباحية (09:00 - 12:00)'
        : shift === 'afternoon'
        ? '☀️ مسائية (02:00 - 03:30)'
        : '🌙 ليلية (09:00 - 11:00)';

    addUserMessage(shiftLabel);
    setRegData((prev) => ({ ...prev, shift }));
    setRegStep(4);

    addBotMessage(
      `4️⃣ اختر البرنامج التعليمي المطلوب:`,
      [
        { label: 'الحفظ المكثف', action: () => handleProgramSelection('الحفظ المكثف') },
        { label: 'التلقين وتصحيح الأداء', action: () => handleProgramSelection('التلقين وتصحيح الأداء') },
        { label: 'الإجازة برواية حفص', action: () => handleProgramSelection('الإجازة برواية حفص') },
      ]
    );
  };

  const handleProgramSelection = (program: string) => {
    addUserMessage(program);
    setRegData((prev) => ({ ...prev, program }));
    setRegStep(5);
    addBotMessage(`5️⃣ أدخل دولتك ومدينتك ورقم هاتفك للتواصل:`);
  };

  const handleCompleteRegistration = (contactInfo: string) => {
    addUserMessage(contactInfo);
    
    // Generate deterministic code and assign group
    const gender = regData.gender || 'male';
    const shift = regData.shift || 'morning';
    const prefix = gender === 'male' ? 'IM' : 'IF';
    const newCode = `${prefix}-1005`;

    const groupRoutingMap = {
      'male-morning': {
        code: 'IM_MORNING',
        name: 'حلقة الذكور - الفترة الصباحية (IM Morning)',
        chatId: '-1003701915037',
        link: 'https://t.me/IM_MORNING_2',
        shift: 'morning',
        shiftTime: '09:00 ص - 12:00 م',
        teacher: 'الشيخ إسماعيل الأثيوبي',
      },
      'male-afternoon': {
        code: 'IM_AFTERNOON',
        name: 'حلقة الذكور - الفترة المسائية (IM Afternoon)',
        chatId: '-1003954336712',
        link: 'https://t.me/IM_AFTERNOON_3',
        shift: 'afternoon',
        shiftTime: '02:00 م - 03:30 م',
        teacher: 'فضيلة الشيخ خالد أحمد',
      },
      'male-night': {
        code: 'IM_NIGHT',
        name: 'حلقة الذكور - الفترة الليلية (IM Night)',
        chatId: '-1003771613278',
        link: 'https://t.me/IM_NIGHT_1',
        shift: 'night',
        shiftTime: '09:00 م - 11:00 م',
        teacher: 'فضيلة الشيخ خالد أحمد',
      },
      'female-morning': {
        code: 'IF_MORNING',
        name: 'حلقة الإناث - الفترة الصباحية (IF Morning)',
        chatId: '-1004464170793',
        link: 'https://t.me/IF_MORNING',
        shift: 'morning',
        shiftTime: '09:00 ص - 12:00 م',
        teacher: 'المشرفة التعليمية المعتمدة',
      },
      'female-afternoon': {
        code: 'IF_AFTERNOON',
        name: 'حلقة الإناث - الفترة المسائية (IF Afternoon)',
        chatId: '-1004388200431',
        link: 'https://t.me/IF_AFTERNOON',
        shift: 'afternoon',
        shiftTime: '02:00 م - 03:30 م',
        teacher: 'المشرفة التعليمية المعتمدة',
      },
      'female-night': {
        code: 'IF_NIGHT',
        name: 'حلقة الإناث - الفترة الليلية (IF Night)',
        chatId: '-1004297425702',
        link: 'https://t.me/IF_NIGHT',
        shift: 'night',
        shiftTime: '09:00 م - 11:00 م',
        teacher: 'المشرفة التعليمية المعتمدة',
      },
    };

    const key = `${gender}-${shift}` as keyof typeof groupRoutingMap;
    const assigned = groupRoutingMap[key] || groupRoutingMap['male-morning'];

    setStudentCode(newCode);
    setGroupInfo(assigned);
    setHasGroup(true);
    setIsRestricted(false);
    setRegStep(0);

    addBotMessage(
      `🎉 *تم اعتماد تسجيلك بنجاح بمقرأة الإمام الجزري* 🌿\n\n` +
      `🏷️ *كود الطالب الخاص بك:* \`${newCode}\`\n` +
      `👥 *المجموعة المخصصة:* ${assigned.name}\n` +
      `🔢 *معرف المجموعة:* \`${assigned.chatId}\`\n` +
      `🕒 *الفترة الدراسية:* ${assigned.shiftTime}\n` +
      `🔗 *رابط مجموعتك في تيليجرام:* ${assigned.link}\n\n` +
      `🛡️ *ملاحظة:* البوت مشرف على هذه المجموعة، يرسل تنبيهات الدروس قبل بدئها بكلمات طيبة، ويتابع رصيد الدقائق. حافظ على رصيدك للاستمرار في المشاركة الصوتية.`,
      [
        { label: '🔗 انضمام إلى مجموعة التيليجرام', action: () => addBotMessage(`تم توجيهك إلى: ${assigned.link}`) },
        { label: '💳 شحن رصيد الحصص', action: () => handleCommand('/packages') },
        { label: '⬅️ القائمة الرئيسية', action: () => addBotMessage('الرئيسية:', getMainButtons()) },
      ]
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
      addBotMessage(
        `2️⃣ حدد الجنس (يتم إنشاء كود IM للذكور و IF للإناث):`,
        [
          { label: '👨 ذكر (IM)', action: () => handleGenderSelection('male') },
          { label: '👩 أنثى (IF)', action: () => handleGenderSelection('female') },
        ]
      );
      return;
    }

    if (regStep === 5) {
      handleCompleteRegistration(text);
      return;
    }

    if (text.startsWith('/')) {
      handleCommand(text);
    } else {
      addUserMessage(text);
      addBotMessage(`تم استلام رسالتك: "${text}". يرجى الاختيار من القائمة:`, getMainButtons());
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Simulation Controls & Quick Test Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-stone-900">
              محاكي بوت تيليجرام النشط (المجموعات الست، التنبيهات الإيمانية، والتقييد الآلي)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
              <span className="text-stone-500 pr-1 text-[11px]">كود الطالب:</span>
              <span className="font-mono font-bold text-[#105C3B] bg-white px-2 py-0.5 rounded shadow-2xs">
                {studentCode}
              </span>
            </div>

            <button
              onClick={restartBot}
              className="flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة البدء (/start)</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Triggers */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 font-semibold text-[11px]">محاكاة سريعة لأوامر البوت:</span>
          
          <button
            onClick={simulateMorningLessonReminder}
            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-amber-200 text-[11px] font-bold"
            title="إرسال تذكير الفترة الصباحية (09:00 - 12:00) بكلمات جميلة"
          >
            <Bell className="w-3 h-3 text-amber-600" />
            <span>تذكير الصباح (09:00)</span>
          </button>

          <button
            onClick={simulateAfternoonLessonReminder}
            className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-900 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-sky-200 text-[11px] font-bold"
            title="إرسال تذكير الفترة المسائية (02:00 - 03:30)"
          >
            <Bell className="w-3 h-3 text-sky-600" />
            <span>تذكير المساء (14:00)</span>
          </button>

          <button
            onClick={simulateNightLessonReminder}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-indigo-200 text-[11px] font-bold"
            title="إرسال تذكير الفترة الليلية (09:00 - 11:00)"
          >
            <Bell className="w-3 h-3 text-indigo-600" />
            <span>تذكير الليل (21:00)</span>
          </button>

          <button
            onClick={simulateZeroBalanceMute}
            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-800 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-rose-200 text-[11px] font-bold"
            title="محاكاة وصول الرصيد إلى 0 وتقييد الطالب في المجموعة"
          >
            <VolumeX className="w-3 h-3 text-rose-600" />
            <span>نفاد الرصيد وتقييد المجموعة</span>
          </button>

          <button
            onClick={handleEmergencyBorrow}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-[#105C3B] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-emerald-200 text-[11px] font-bold"
            title="استلاف رصيد طوارئ وفك الحظر تلقائياً"
          >
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>استلاف طوارئ (+30) وفك الحظر</span>
          </button>

          <button
            onClick={handleTopUpSuccess}
            className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-900 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-purple-200 text-[11px] font-bold"
            title="شحن باقة 300 دقيقة"
          >
            <CreditCard className="w-3 h-3 text-purple-600" />
            <span>شحن باقة 300 دقيقة</span>
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
                <div className="text-[10px] text-stone-400">
                  @AlJazariQuranBot • مشرف المجموعات الست
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {isRestricted ? (
                <div className="text-[9px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-700 flex items-center gap-0.5">
                  <VolumeX className="w-2.5 h-2.5" />
                  <span>مقيد</span>
                </div>
              ) : (
                <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  {balance} دقيقة
                </div>
              )}
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
              placeholder="اكتب رسالة أو أمراً (مثال: /mygroup, /balance, /register)..."
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
