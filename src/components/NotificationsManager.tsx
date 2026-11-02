import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Send,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  CheckCircle2,
  Users,
  CreditCard,
  BookOpen,
  Sparkles,
  Smartphone,
  Download,
  Filter,
  Check,
  Eye,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  ScheduledNotification,
  NotificationDispatchLog,
  NotificationCategory,
  NotificationTargetType,
  NotificationScheduleType,
  QuranGroup,
  EducationalProgram,
  StudentBalance,
  User,
} from '../types';

interface NotificationsManagerProps {
  notifications: ScheduledNotification[];
  onAddNotification: (notification: ScheduledNotification) => void;
  onUpdateNotification: (notification: ScheduledNotification) => void;
  onDeleteNotification: (id: string) => void;
  onTriggerNotification: (id: string) => void;
  onToggleStatus: (id: string) => void;
  dispatchLogs: NotificationDispatchLog[];
  groups: QuranGroup[];
  programs: EducationalProgram[];
  balances: StudentBalance[];
  users: User[];
  contactPhone: string;
}

export const NotificationsManager: React.FC<NotificationsManagerProps> = ({
  notifications,
  onAddNotification,
  onUpdateNotification,
  onDeleteNotification,
  onTriggerNotification,
  onToggleStatus,
  dispatchLogs,
  groups,
  programs,
  balances,
  users,
  contactPhone,
}) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs'>('schedules');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [previewNotification, setPreviewNotification] = useState<ScheduledNotification | null>(null);
  const [testSendSuccess, setTestSendSuccess] = useState<string | null>(null);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('lesson_reminder');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [targetType, setTargetType] = useState<NotificationTargetType>('specific_group');
  const [targetGroupId, setTargetGroupId] = useState<string>(groups[0]?.id || '');
  const [targetProgramId, setTargetProgramId] = useState<string>(programs[0]?.id || '');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<number>(30);
  const [scheduleType, setScheduleType] = useState<NotificationScheduleType>('before_lesson');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(30);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]); // Sun to Thu
  const [actionButtonText, setActionButtonText] = useState('الدخول للحلقة الآن 📲');
  const [actionButtonUrl, setActionButtonUrl] = useState('');

  // Quick Preset Templates
  const handleApplyPreset = (presetKey: 'lesson' | 'low_balance' | 'renewal' | 'exam') => {
    if (presetKey === 'lesson') {
      setTitle('تنبيه: اقتراب موعد حلقة التسميع والقرآن');
      setCategory('lesson_reminder');
      setTargetType('specific_group');
      setScheduleType('before_lesson');
      setLeadTimeMinutes(30);
      setActionButtonText('الدخول للحلقة الآن 📲');
      setActionButtonUrl('https://t.me/+jazari_channel_link');
      setMessageTemplate(
        '🌿 السلام عليكم ورحمة الله وبركاته يا {اسم_الطالب} 📖\n\n' +
        'نذكرك بأن حلقتك القرآنية في ({اسم_الحلقة}) ستبدأ بعد 30 دقيقة بإذن الله.\n\n' +
        '🎙️ مع فضيلة الشيخ المشرف.\n' +
        '⏳ جهّز مراجعتك وافتح المصحف لحضور الجلسة دون تأخير.\n\n' +
        'وفقكم الله لحفظ كتابه الكريم.'
      );
    } else if (presetKey === 'low_balance') {
      setTitle('تنبيه رصيد الحصص وتذكير بشحن الباقة');
      setCategory('payment_reminder');
      setTargetType('low_balance_students');
      setLowBalanceThreshold(30);
      setScheduleType('low_balance_auto');
      setScheduledTime('11:00');
      setActionButtonText('شحن الرصيد الآن 💳');
      setActionButtonUrl('');
      setMessageTemplate(
        '💳 تنبيه الرصيد المتبقي بمقرأة الإمام الجزري:\n\n' +
        'أخي الطالب {اسم_الطالب}، تبقى في رصيدك التعليمي {الرصيد_المتبقي} دقيقة فقط.\n\n' +
        'لتجنب انقطاع جلسات التسميع والإقراء، يرجى شحن وتجديد رصيدك عبر حسابات المقرأة الرسمية في إثيوبيا:\n' +
        '🏦 البنك التجاري CBE: 1000285374425\n' +
        '🏦 بنك الحبشة BOA: 226626646\n' +
        '📱 تليبير Telebirr: 0990161372\n' +
        '📱 إم بيسا M-Pesa: 0721009122\n' +
        '👤 باسم المستفيد: Kalid Ahmed Mustefa\n\n' +
        'بعد التحويل، يرجى إرسال الإشعار من قائمة البوت الرئيسية.'
      );
    } else if (presetKey === 'renewal') {
      setTitle('تذكير تجديد الاشتراك الشهري للباقات');
      setCategory('payment_reminder');
      setTargetType('all_students');
      setScheduleType('recurring_weekly');
      setSelectedDays([5]); // Friday
      setScheduledTime('10:00');
      setActionButtonText('عرض باقات الدقائق 📦');
      setActionButtonUrl('');
      setMessageTemplate(
        'السلام عليكم ورحمة الله وبركاته، نحث طلابنا الكرام في مقرأة الإمام الجزري على مراجعة أرصدتهم وتجديد باقات الدقائق قبل بداية الأسبوع لضمان حجز المواعيد مع المشايخ المقرئين.\n\nتقبل الله طاعتكم وجعلكم من أهل القرآن.'
      );
    } else if (presetKey === 'exam') {
      setTitle('موعد الاختبار التقييمي لنيل الإجازة بالسند');
      setCategory('exam_alert');
      setTargetType('specific_program');
      setTargetProgramId(programs[2]?.id || programs[0]?.id || '');
      setScheduleType('one_time');
      setScheduledTime('09:00');
      setActionButtonText('تفاصيل الاختبار وقاعة الإقراء 🎙️');
      setActionButtonUrl('https://t.me/+jazari_sanad_eve_secret');
      setMessageTemplate(
        '🎓 إعلان موعد الاختبار التقييمي:\n\nطالبنا الكريم {اسم_الطالب}، تم تحديد موعد اختبارك في برنامج ({اسم_البرنامج}) يوم السبت القادم الساعة 09:00 صباحاً عبر التيليجرام.\n\nيرجى ضبط منظومة الجزرية ومخارج الحروف مع المشرف المجاز.'
      );
    }
  };

  const handleOpenCreateModal = () => {
    setEditingNotification(null);
    setTitle('');
    setCategory('lesson_reminder');
    setMessageTemplate('');
    setTargetType('specific_group');
    setTargetGroupId(groups[0]?.id || '');
    setTargetProgramId(programs[0]?.id || '');
    setLowBalanceThreshold(30);
    setScheduleType('before_lesson');
    setScheduledTime('18:00');
    setLeadTimeMinutes(30);
    setSelectedDays([0, 1, 2, 3, 4]);
    setActionButtonText('الدخول للحلقة الآن 📲');
    setActionButtonUrl('');
    handleApplyPreset('lesson');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (notif: ScheduledNotification) => {
    setEditingNotification(notif);
    setTitle(notif.title);
    setCategory(notif.category);
    setMessageTemplate(notif.message_template);
    setTargetType(notif.target_type);
    setTargetGroupId(notif.target_group_id || groups[0]?.id || '');
    setTargetProgramId(notif.target_program_id || programs[0]?.id || '');
    setLowBalanceThreshold(notif.low_balance_threshold || 30);
    setScheduleType(notif.schedule_type);
    setScheduledTime(notif.scheduled_time || '18:00');
    setLeadTimeMinutes(notif.lead_time_minutes || 30);
    setSelectedDays(notif.days_of_week || [0, 1, 2, 3, 4]);
    setActionButtonText(notif.action_button_text || '');
    setActionButtonUrl(notif.action_button_url || '');
    setIsModalOpen(true);
  };

  const handleSaveNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !messageTemplate.trim()) return;

    if (editingNotification) {
      const updated: ScheduledNotification = {
        ...editingNotification,
        title: title.trim(),
        category,
        message_template: messageTemplate,
        target_type: targetType,
        target_group_id: targetType === 'specific_group' ? targetGroupId : undefined,
        target_program_id: targetType === 'specific_program' ? targetProgramId : undefined,
        low_balance_threshold: targetType === 'low_balance_students' ? Number(lowBalanceThreshold) : undefined,
        schedule_type: scheduleType,
        scheduled_time: scheduledTime,
        lead_time_minutes: scheduleType === 'before_lesson' ? Number(leadTimeMinutes) : undefined,
        days_of_week: scheduleType === 'recurring_weekly' ? selectedDays : undefined,
        action_button_text: actionButtonText.trim() || undefined,
        action_button_url: actionButtonUrl.trim() || undefined,
      };
      onUpdateNotification(updated);
    } else {
      const newNotif: ScheduledNotification = {
        id: `notif-${Date.now()}`,
        title: title.trim(),
        category,
        message_template: messageTemplate,
        target_type: targetType,
        target_group_id: targetType === 'specific_group' ? targetGroupId : undefined,
        target_program_id: targetType === 'specific_program' ? targetProgramId : undefined,
        low_balance_threshold: targetType === 'low_balance_students' ? Number(lowBalanceThreshold) : undefined,
        schedule_type: scheduleType,
        scheduled_time: scheduledTime,
        lead_time_minutes: scheduleType === 'before_lesson' ? Number(leadTimeMinutes) : undefined,
        days_of_week: scheduleType === 'recurring_weekly' ? selectedDays : undefined,
        action_button_text: actionButtonText.trim() || undefined,
        action_button_url: actionButtonUrl.trim() || undefined,
        status: 'active',
        total_dispatched_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        created_by: 'المدير العام (khdahd241@gmail.com)',
        next_run_at: scheduleType === 'before_lesson' ? 'قبل موعد الحلقة القادمة' : `اليوم في ${scheduledTime}`,
      };
      onAddNotification(newNotif);
    }

    setIsModalOpen(false);
  };

  const handleTestSend = (notif: ScheduledNotification) => {
    setTestSendSuccess(notif.id);
    setTimeout(() => {
      setTestSendSuccess(null);
    }, 4000);
  };

  const handleTriggerNow = (notif: ScheduledNotification) => {
    onTriggerNotification(notif.id);
    setDispatchFeedback(`تم بنجاح إرسال التنبيه "${notif.title}" إلى كافة الطلاب المستهدفين عبر البوت!`);
    setTimeout(() => {
      setDispatchFeedback(null);
    }, 4500);
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    setMessageTemplate((prev) => prev + placeholder);
  };

  // Target label helper
  const getTargetLabel = (notif: ScheduledNotification) => {
    if (notif.target_type === 'specific_group') {
      const g = groups.find((grp) => grp.id === notif.target_group_id);
      return g ? `حلقة: ${g.name} (${g.current_members_count} طالب)` : 'حلقة محددة';
    }
    if (notif.target_type === 'low_balance_students') {
      const threshold = notif.low_balance_threshold || 30;
      const count = balances.filter((b) => b.current_minutes <= threshold).length;
      return `الطلاب برصيد أقل من ${threshold} دقيقة (${count} طالب حالياً)`;
    }
    if (notif.target_type === 'specific_program') {
      const p = programs.find((prg) => prg.id === notif.target_program_id);
      return p ? `برنامج: ${p.name_ar}` : 'برنامج تعليمي محدد';
    }
    return `جميع طلاب ومشتركي المقرأة (${balances.length || users.length} طالب)`;
  };

  // Schedule label helper
  const getScheduleLabel = (notif: ScheduledNotification) => {
    if (notif.schedule_type === 'before_lesson') {
      return `تلقائي: قبل موعد الحلقة بـ ${notif.lead_time_minutes || 30} دقيقة`;
    }
    if (notif.schedule_type === 'low_balance_auto') {
      return `تلقائي فور انخفاض رصيد الطالب إلى أقل من ${notif.low_balance_threshold || 30} دقيقة`;
    }
    if (notif.schedule_type === 'recurring_daily') {
      return `يومياً عند الساعة ${notif.scheduled_time || '18:00'}`;
    }
    if (notif.schedule_type === 'recurring_weekly') {
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const days = (notif.days_of_week || []).map((d) => dayNames[d]).join('، ');
      return `أسبوعياً (${days || 'أيام محددة'}) الساعة ${notif.scheduled_time || '18:00'}`;
    }
    return `مرة واحدة بتاريخ محدد (${notif.scheduled_time || 'فوراً'})`;
  };

  // Export Dispatch Logs to CSV (UTF-8 BOM support)
  const handleExportLogsCSV = () => {
    const headers = [
      'ID',
      'عنوان الإشعار',
      'التصنيف',
      'تاريخ ووقت الإرسال',
      'عدد المستلمين',
      'عدد الناجحين',
      'عدد المتعثرين',
      'قناة البث',
      'مقتطف الرسالة',
    ];

    const rows = dispatchLogs.map((log) => [
      `"${log.id}"`,
      `"${log.notification_title.replace(/"/g, '""')}"`,
      `"${log.category === 'lesson_reminder' ? 'تذكير حلقة' : log.category === 'payment_reminder' ? 'تذكير دفع ورصيد' : 'إشعار'}"`,
      `"${log.sent_at}"`,
      log.recipients_count,
      log.success_count,
      log.failed_count,
      `"${log.channel}"`,
      `"${log.message_snippet.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telegram_notifications_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filterCategory !== 'all' && notif.category !== filterCategory) return false;
    if (filterStatus !== 'all' && notif.status !== filterStatus) return false;
    return true;
  });

  // Sample student for preview
  const sampleStudentName = 'بلال حسين الأثيوبي';
  const sampleGroupName = groups[0]?.name || 'حلقة الإمام الشاطبي للحفظ';
  const sampleRemainingMinutes = '25';
  const sampleProgramName = programs[0]?.name_ar || 'الحفظ المكثف';

  const renderSimulatedMessage = (templateText: string) => {
    return templateText
      .replace(/{اسم_الطالب}/g, sampleStudentName)
      .replace(/{اسم_الحلقة}/g, sampleGroupName)
      .replace(/{الرصيد_المتبقي}/g, sampleRemainingMinutes)
      .replace(/{اسم_البرنامج}/g, sampleProgramName)
      .replace(/{رابط_الحلقة}/g, 'https://t.me/+jazari_live_secret')
      .replace(/{رقم_المشرف}/g, contactPhone);
  };

  const activeRulesCount = notifications.filter((n) => n.status === 'active').length;
  const lessonRemindersCount = notifications.filter((n) => n.category === 'lesson_reminder').length;
  const paymentRemindersCount = notifications.filter((n) => n.category === 'payment_reminder').length;
  const totalDispatchedCount = notifications.reduce((acc, curr) => acc + curr.total_dispatched_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
              جدولة الإشعارات والتنبيهات التلقائية (Push Notifications)
            </h2>
            <span className="bg-[#DDF2E3] text-[#105C3B] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#18794E]/20">
              Telegram Bot Scheduler
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            جدولة وإرسال تذكيرات آلية ذكية للطلاب قبل مواعيد الحلقات القرآنية، وتنبيهات شحن وتجديد الرصيد المنخفض
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportLogsCSV}
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border border-stone-300 shadow-xs cursor-pointer"
            title="تصدير سجل عمليات الإرسال والإحصائيات"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>تصدير السجل CSV</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#105C3B] hover:bg-[#18794E] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>جدولة إشعار جديد</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {dispatchFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{dispatchFeedback}</span>
          </div>
          <button
            onClick={() => setDispatchFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#105C3B] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 font-['Amiri',serif]">{activeRulesCount}</div>
            <div className="text-[11px] text-stone-500 font-medium">قواعد مجدولة نشطة</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 font-['Amiri',serif]">{lessonRemindersCount}</div>
            <div className="text-[11px] text-stone-500 font-medium">تذكيرات مواعيد الحلقات</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 font-['Amiri',serif]">{paymentRemindersCount}</div>
            <div className="text-[11px] text-stone-500 font-medium">تنبيهات شحن وتجديد الرصيد</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 font-['Amiri',serif]">{totalDispatchedCount}</div>
            <div className="text-[11px] text-stone-500 font-medium">إجمالي التنبيهات المسلّمة</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'schedules'
                  ? 'text-[#105C3B] border-b-2 border-[#105C3B]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>قواعد الجدولة والتنبيه ({filteredNotifications.length})</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'logs'
                  ? 'text-[#105C3B] border-b-2 border-[#105C3B]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                <span>سجل البث والإرسال ({dispatchLogs.length})</span>
              </div>
            </button>
          </div>

          {activeTab === 'schedules' && (
            <div className="flex items-center gap-2 pb-2">
              <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200 text-xs">
                <Filter className="w-3.5 h-3.5 text-stone-400 mr-1" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-xs text-stone-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">جميع التصنيفات</option>
                  <option value="lesson_reminder">تذكير مواعيد الحلقات</option>
                  <option value="payment_reminder">تذكير شحن الرصيد</option>
                  <option value="exam_alert">تنبيهات الاختبارات</option>
                  <option value="general">إشعارات عامة</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200 text-xs">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-xs text-stone-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط فقط</option>
                  <option value="paused">متوقف فقط</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Scheduled Rules List */}
        {activeTab === 'schedules' && (
          <div className="p-4 space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                لا توجد قواعد إشعارات تطابق التصفية الحالية. يمكنك إضافة جدولة جديدة أعلاه.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredNotifications.map((notif) => {
                  const isLesson = notif.category === 'lesson_reminder';
                  const isPayment = notif.category === 'payment_reminder';
                  const isExam = notif.category === 'exam_alert';

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all duration-150 ${
                        notif.status === 'active'
                          ? 'bg-white border-stone-200 hover:border-[#105C3B]/40 hover:shadow-sm'
                          : 'bg-stone-50/80 border-stone-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Right: Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isLesson
                                  ? 'bg-emerald-100 text-[#105C3B] border border-emerald-300'
                                  : isPayment
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isExam
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-stone-100 text-stone-800 border border-stone-300'
                              }`}
                            >
                              {isLesson && <BookOpen className="w-3 h-3" />}
                              {isPayment && <CreditCard className="w-3 h-3" />}
                              {isExam && <ShieldCheck className="w-3 h-3" />}
                              <span>
                                {isLesson
                                  ? 'تذكير موعد حلقة'
                                  : isPayment
                                  ? 'تذكير شحن ودفع'
                                  : isExam
                                  ? 'تنبيه اختبار وسند'
                                  : 'إشعار عام'}
                              </span>
                            </span>

                            <h3 className="text-sm font-bold text-stone-900 font-['Amiri',serif]">
                              {notif.title}
                            </h3>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                notif.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {notif.status === 'active' ? 'نشط ومفعّل' : 'متوقف مؤقتاً'}
                            </span>
                          </div>

                          <div className="text-xs text-stone-600 line-clamp-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-mono text-[11px]">
                            {notif.message_template}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-stone-500 pt-1">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="font-semibold text-stone-700">المستهدف:</span>
                              <span className="truncate">{getTargetLabel(notif)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="font-semibold text-stone-700">القاعدة:</span>
                              <span className="truncate">{getScheduleLabel(notif)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Send className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="font-semibold text-stone-700">المسلّم:</span>
                              <span>{notif.total_dispatched_count} رسالة عبر التيليجرام</span>
                            </div>
                          </div>
                        </div>

                        {/* Left: Actions */}
                        <div className="flex flex-wrap lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                          <div className="flex items-center gap-2 w-full justify-end">
                            {/* Live Trigger Now */}
                            <button
                              onClick={() => handleTriggerNow(notif)}
                              className="flex items-center gap-1 bg-[#105C3B] hover:bg-[#18794E] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title="إرسال فوري الآن لجميع المستهدفين"
                            >
                              <Send className="w-3 h-3" />
                              <span>إرسال فوري</span>
                            </button>

                            {/* Test Send to Admin */}
                            <button
                              onClick={() => handleTestSend(notif)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                                testSendSuccess === notif.id
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                              }`}
                              title="إرسال تجريبي إلى حساب المشرف للتحقق من المظهر"
                            >
                              {testSendSuccess === notif.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>وصلك بالتيليجرام!</span>
                                </>
                              ) : (
                                <>
                                  <Smartphone className="w-3 h-3 text-stone-500" />
                                  <span>تجربة بالبوت</span>
                                </>
                              )}
                            </button>

                            {/* Preview Mockup */}
                            <button
                              onClick={() => setPreviewNotification(notif)}
                              className="p-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg border border-stone-200 transition-all cursor-pointer"
                              title="معاينة شكل الرسالة في تطبيق تيليجرام"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Pause / Resume */}
                            <button
                              onClick={() => onToggleStatus(notif.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                notif.status === 'active'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={notif.status === 'active' ? 'إيقاف مؤقت' : 'استئناف وتفعيل'}
                            >
                              {notif.status === 'active' ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(notif)}
                              className="p-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg border border-stone-200 transition-all cursor-pointer"
                              title="تعديل الإشعار والقاعدة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDeleteNotification(notif.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all cursor-pointer"
                              title="حذف الجدولة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-[10px] text-stone-400 text-left w-full">
                            التشغيل القادم: {notif.next_run_at || 'حسب شروط القاعدة'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dispatch Logs Table */}
        {activeTab === 'logs' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-2">
              <span>سجل تاريخي يوثق جميع عمليات البث الآلي والتذكيرات المرسلة عبر التيليجرام</span>
              <button
                onClick={handleExportLogsCSV}
                className="text-[#105C3B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل السجل بالكامل CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">وقت الإرسال</th>
                    <th className="p-3">عنوان التنبيه</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">المستلمون</th>
                    <th className="p-3">الناجح / المتعثر</th>
                    <th className="p-3">قناة البث</th>
                    <th className="p-3">مقتطف النص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dispatchLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {log.sent_at}
                      </td>
                      <td className="p-3 font-semibold text-stone-900">{log.notification_title}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.category === 'lesson_reminder'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.category === 'payment_reminder'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {log.category === 'lesson_reminder'
                            ? 'تذكير حلقة'
                            : log.category === 'payment_reminder'
                            ? 'تذكير رصيد'
                            : 'تنبيه'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-stone-800">{log.recipients_count} طالب</td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-bold">{log.success_count} نجح</span>
                        {log.failed_count > 0 && (
                          <span className="text-rose-600 font-bold mr-1.5">
                            ({log.failed_count} فشل)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-stone-500 font-mono">{log.channel}</td>
                      <td className="p-3 text-stone-600 max-w-xs truncate text-[11px]">
                        {log.message_snippet}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Notification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
            <div className="bg-[#105C3B] text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-bold text-base font-['Amiri',serif]">
                  {editingNotification ? 'تعديل قاعدة الإشعار الآلي' : 'جدولة تنبيه آلي جديد للتيليجرام'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="bg-emerald-50/60 p-3 px-6 border-b border-emerald-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#105C3B] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                نماذج جاهزة سريعة:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('lesson')}
                className="text-xs bg-white hover:bg-emerald-100 text-stone-700 px-2.5 py-1 rounded-md border border-emerald-200 font-medium transition-all cursor-pointer"
              >
                📖 تذكير موعد حلقة (30 دقيقة قبل البدء)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('low_balance')}
                className="text-xs bg-white hover:bg-amber-100 text-stone-700 px-2.5 py-1 rounded-md border border-amber-200 font-medium transition-all cursor-pointer"
              >
                💳 تذكير رصيد منخفض (&lt; 30 دقيقة)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('renewal')}
                className="text-xs bg-white hover:bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-300 font-medium transition-all cursor-pointer"
              >
                ⏳ تجديد اشتراك شهري
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('exam')}
                className="text-xs bg-white hover:bg-purple-100 text-stone-700 px-2.5 py-1 rounded-md border border-purple-200 font-medium transition-all cursor-pointer"
              >
                🎓 تنبيه اختبار إجازة وسند
              </button>
            </div>

            <form onSubmit={handleSaveNotification} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls (8 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    عنوان الإشعار (للإدارة والسجل):
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تذكير حلقة الإمام الشاطبي للحفظ المكثف"
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-[#105C3B] focus:outline-none"
                  />
                </div>

                {/* Category & Target */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">نوع التنبيه:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                    >
                      <option value="lesson_reminder">📖 تذكير موعد حلقة قرآنية</option>
                      <option value="payment_reminder">💳 تذكير دفع وتجديد رصيد</option>
                      <option value="exam_alert">🎓 تنبيه موعد اختبار وسند</option>
                      <option value="general">📢 إشعار عام للمقرأة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">الجمهور المستهدف:</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as NotificationTargetType)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                    >
                      <option value="specific_group">حلقة معينة فقط</option>
                      <option value="low_balance_students">الطلاب ذوو الرصيد المنخفض</option>
                      <option value="specific_program">طلاب برنامج تعليمي معين</option>
                      <option value="all_students">كافة طلاب المقرأة المشتركين</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Target Selectors */}
                {targetType === 'specific_group' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">اختر الحلقة المستهدفة:</label>
                    <select
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-semibold text-stone-800"
                    >
                      {groups.map((grp) => (
                        <option key={grp.id} value={grp.id}>
                          {grp.name} ({grp.current_members_count} طالب) - {grp.shift === 'morning' ? 'صباحي' : 'مسائي'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'low_balance_students' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      الحد الأدنى للرصيد المستهدف (دقائق):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={lowBalanceThreshold}
                        onChange={(e) => setLowBalanceThreshold(Number(e.target.value))}
                        className="w-32 text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-bold"
                      />
                      <span className="text-xs text-stone-500">
                        سيتم إرسال التنبيه فور انخفاض رصيد الطالب إلى أقل من هذا الحد تلقائياً
                      </span>
                    </div>
                  </div>
                )}

                {targetType === 'specific_program' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">اختر البرنامج التعليمي:</label>
                    <select
                      value={targetProgramId}
                      onChange={(e) => setTargetProgramId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-semibold"
                    >
                      {programs.map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {prog.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Scheduling Logic */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#105C3B]" />
                    <span>قاعدة توقيت الإرسال:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value as NotificationScheduleType)}
                        className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
                      >
                        <option value="before_lesson">قبل موعد الحلقة بوقت محدد</option>
                        <option value="low_balance_auto">تلقائي عند نقص الرصيد</option>
                        <option value="recurring_weekly">تكرار أسبوعي في أيام محددة</option>
                        <option value="recurring_daily">تكرار يومي في ساعة محددة</option>
                        <option value="one_time">مرة واحدة في تاريخ/وقت محدد</option>
                      </select>
                    </div>

                    {scheduleType === 'before_lesson' && (
                      <div>
                        <select
                          value={leadTimeMinutes}
                          onChange={(e) => setLeadTimeMinutes(Number(e.target.value))}
                          className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg focus:outline-none"
                        >
                          <option value={15}>قبل 15 دقيقة من الحلقة</option>
                          <option value={30}>قبل 30 دقيقة من الحلقة</option>
                          <option value={45}>قبل 45 دقيقة من الحلقة</option>
                          <option value={60}>قبل ساعة واحدة من الحلقة</option>
                        </select>
                      </div>
                    )}

                    {(scheduleType === 'recurring_daily' || scheduleType === 'recurring_weekly' || scheduleType === 'one_time') && (
                      <div>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg focus:outline-none font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Template Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      نص الرسالة التي ستصل عبر التيليجرام:
                    </label>
                    <span className="text-[11px] text-stone-400">يدعم تنسيقات Markdown وتعبئة المتغيرات</span>
                  </div>

                  {/* Variables pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{اسم_الطالب}')}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                    >
                      + {`{اسم_الطالب}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{اسم_الحلقة}')}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                    >
                      + {`{اسم_الحلقة}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{الرصيد_المتبقي}')}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                    >
                      + {`{الرصيد_المتبقي}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{اسم_البرنامج}')}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                    >
                      + {`{اسم_البرنامج}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{رابط_الحلقة}')}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded border border-stone-200 cursor-pointer"
                    >
                      + {`{رابط_الحلقة}`}
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    required
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="اكتب نص الرسالة هنا..."
                    className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-[#105C3B] focus:outline-none font-mono text-[11px]"
                  />
                </div>

                {/* Inline Action Button in Telegram */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      نص الزر التفاعلي (Inline Button):
                    </label>
                    <input
                      type="text"
                      value={actionButtonText}
                      onChange={(e) => setActionButtonText(e.target.value)}
                      placeholder="مثال: الدخول للحلقة الآن 📲"
                      className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      الرابط أو الأمر للزر (اختياري):
                    </label>
                    <input
                      type="text"
                      value={actionButtonUrl}
                      onChange={(e) => setActionButtonUrl(e.target.value)}
                      placeholder="مثال: https://t.me/+jazari_link"
                      className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Telegram Preview Side (5 Cols) */}
              <div className="lg:col-span-5 bg-stone-100 p-4 rounded-xl border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#105C3B]" />
                      معاينة حية في التيليجرام
                    </span>
                    <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-mono">
                      Telegram iOS / Android
                    </span>
                  </div>

                  {/* Telegram Message Bubble */}
                  <div className="bg-[#5682a3]/10 p-3 rounded-xl border border-[#5682a3]/20 space-y-2">
                    {/* Bot header info */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#105C3B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        ج
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-[#105C3B] flex items-center gap-1">
                          مقرأة الإمام الجزري
                          <CheckCircle2 className="w-3 h-3 text-sky-500 inline" />
                        </div>
                        <div className="text-[9px] text-stone-400">@Jazari_Quran_Bot</div>
                      </div>
                    </div>

                    {/* Chat Bubble */}
                    <div className="bg-white rounded-lg p-3 shadow-2xs text-xs text-stone-800 whitespace-pre-line border border-stone-200/60 leading-relaxed font-sans">
                      {messageTemplate ? renderSimulatedMessage(messageTemplate) : 'أدخل نص الرسالة للمعاينة...'}

                      <div className="text-[9px] text-stone-400 text-left mt-2 flex items-center justify-end gap-1 font-mono">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <Check className="w-3 h-3 text-sky-500" />
                      </div>
                    </div>

                    {/* Inline Keyboard Button */}
                    {actionButtonText && (
                      <div className="pt-1">
                        <button
                          type="button"
                          className="w-full bg-[#105C3B] text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-default"
                        >
                          <span>{actionButtonText}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 text-[10px] text-stone-500 bg-white/70 p-2.5 rounded-lg border border-stone-200 mt-4">
                  💡 يتم استبدال المتغيرات تلقائياً ببيانات الطالب الفعلية ورصيده الحقيقي وحلقته المعتمدة عند انطلاق البث.
                </div>
              </div>

              {/* Footer Actions */}
              <div className="col-span-12 flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg text-xs font-bold bg-[#105C3B] hover:bg-[#18794E] text-white shadow-xs transition-all cursor-pointer"
                >
                  {editingNotification ? 'حفظ التعديلات' : 'تفعيل وجدولة الإشعار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Preview Modal */}
      {previewNotification && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="font-bold text-sm text-stone-900 font-['Amiri',serif]">
                معاينة إشعار: {previewNotification.title}
              </h3>
              <button
                onClick={() => setPreviewNotification(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#5682a3]/10 p-3 rounded-xl border border-[#5682a3]/20 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#105C3B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ج
                </div>
                <div>
                  <div className="text-xs font-bold text-[#105C3B] flex items-center gap-1">
                    مقرأة الإمام الجزري
                    <CheckCircle2 className="w-3 h-3 text-sky-500 inline" />
                  </div>
                  <div className="text-[9px] text-stone-400">@Jazari_Quran_Bot</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-2xs text-xs text-stone-800 whitespace-pre-line border border-stone-200/60 leading-relaxed font-sans">
                {renderSimulatedMessage(previewNotification.message_template)}
                <div className="text-[9px] text-stone-400 text-left mt-2 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <Check className="w-3 h-3 text-sky-500" />
                </div>
              </div>

              {previewNotification.action_button_text && (
                <div className="pt-1">
                  <div className="w-full bg-[#105C3B] text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>{previewNotification.action_button_text}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-stone-500 space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <div>🎯 <strong>الجمهور:</strong> {getTargetLabel(previewNotification)}</div>
              <div>⏰ <strong>التوقيت:</strong> {getScheduleLabel(previewNotification)}</div>
              <div>📊 <strong>إجمالي الإرسال:</strong> {previewNotification.total_dispatched_count} رسالة</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleTriggerNow(previewNotification);
                  setPreviewNotification(null);
                }}
                className="bg-[#105C3B] hover:bg-[#18794E] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                إرسال الآن للجميع
              </button>
              <button
                onClick={() => setPreviewNotification(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
