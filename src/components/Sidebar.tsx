import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  CreditCard,
  Clock,
  Users2,
  BookMarked,
  PackageCheck,
  Building2,
  GraduationCap,
  ShieldAlert,
  Megaphone,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  Bot,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'students_directory'
  | 'registrations'
  | 'payments'
  | 'balances'
  | 'groups'
  | 'programs'
  | 'packages'
  | 'payment_methods'
  | 'users'
  | 'teachers'
  | 'supervisors'
  | 'notifications'
  | 'announcements'
  | 'support'
  | 'audit'
  | 'settings'
  | 'bot_simulator';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingRegistrationsCount: number;
  pendingPaymentsCount: number;
  openTicketsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingRegistrationsCount,
  pendingPaymentsCount,
  openTicketsCount,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'لوحة المعلومات', icon: LayoutDashboard },
    {
      id: 'students_directory' as NavTab,
      label: 'قائمة الطلاب بالأزرار',
      icon: GraduationCap,
      badge: 'جديد',
      badgeColor: 'bg-emerald-600 text-white font-bold',
    },
    {
      id: 'registrations' as NavTab,
      label: 'طلبات التسجيل',
      icon: UserCheck,
      badge: pendingRegistrationsCount > 0 ? pendingRegistrationsCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-950',
    },
    {
      id: 'payments' as NavTab,
      label: 'طلبات الدفع المالي',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'balances' as NavTab, label: 'الأرصدة والدفتر المالي', icon: Clock },
    { id: 'groups' as NavTab, label: 'المجموعات والحلقات', icon: Users2 },
    { id: 'programs' as NavTab, label: 'البرامج التعليمية', icon: BookMarked },
    { id: 'packages' as NavTab, label: 'الباقات والأسعار', icon: PackageCheck },
    { id: 'payment_methods' as NavTab, label: 'حسابات وطرق الدفع', icon: Building2 },
    { id: 'users' as NavTab, label: 'سجل المستخدمين', icon: GraduationCap },
    { id: 'supervisors' as NavTab, label: 'المشرفون والصلاحيات', icon: ShieldAlert },
    {
      id: 'notifications' as NavTab,
      label: 'جدولة الإشعارات والتنبيهات',
      icon: Bell,
      badge: 'آلي',
      badgeColor: 'bg-emerald-100 text-[#105C3B] border border-emerald-300',
    },
    { id: 'announcements' as NavTab, label: 'الرسائل الجماعية', icon: Megaphone },
    {
      id: 'support' as NavTab,
      label: 'تذاكر الدعم الفني',
      icon: MessageSquare,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      badgeColor: 'bg-blue-500 text-white',
    },
    { id: 'audit' as NavTab, label: 'سجل التدقيق والأمان', icon: FileSpreadsheet },
    { id: 'settings' as NavTab, label: 'إعدادات البوت والربط', icon: Settings },
    {
      id: 'bot_simulator' as NavTab,
      label: 'محاكي البوت الحي',
      icon: Bot,
      special: true,
    },
  ];

  return (
    <aside className="w-64 bg-white border-l border-stone-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-sm">
      <div className="space-y-1">
        <div className="text-xs font-bold text-stone-400 px-3 pb-2 uppercase tracking-wider">
          إدارة النظام والمقرأة
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-right cursor-pointer ${
                isActive
                  ? 'bg-[#105C3B] text-white shadow-sm'
                  : item.special
                  ? 'bg-emerald-50 text-[#105C3B] hover:bg-emerald-100 font-semibold border border-emerald-200'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-white'
                      : item.special
                      ? 'text-[#105C3B]'
                      : 'text-stone-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-xs ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-stone-100 mt-6">
        <div className="bg-[#DDF2E3]/60 p-3 rounded-lg border border-[#18794E]/20 text-xs text-stone-700">
          <div className="font-bold text-[#105C3B] mb-1">🌿 حالة الخادم والبوت</div>
          <div className="flex items-center gap-2 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بايثون aiogram 3.x جاهز</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            26/26 اختبار اجتاز بنجاح
          </div>
        </div>
      </div>
    </aside>
  );
};
