import React, { useState } from 'react';
import { Settings, Shield, Phone, Mail, Database, Bot, Copy, Check } from 'lucide-react';

interface SettingsManagerProps {
  contactPhone: string;
  contactEmail: string;
  superAdminEmail: string;
  onUpdateContacts: (phone: string, email: string) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  contactPhone,
  contactEmail,
  superAdminEmail,
  onUpdateContacts,
}) => {
  const [phone, setPhone] = useState(contactPhone);
  const [email, setEmail] = useState(contactEmail);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'supabase' | 'bot'>('general');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateContacts(phone.trim(), email.trim());
  };

  const copySqlSnippet = () => {
    navigator.clipboard.writeText(`-- قم بتشغيل schema.sql في Supabase SQL Editor
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'ar'
);`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            إعدادات المقرأة والربط التقني
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            إدارة بيانات التواصل الرسمية، ربط قاعدة بيانات Supabase، وإعدادات Telegram Bot API
          </p>
        </div>

        <div className="flex items-center bg-stone-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-md cursor-pointer ${
              activeTab === 'general' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            البيانات الرسمية
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-1.5 rounded-md cursor-pointer ${
              activeTab === 'supabase' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            قاعدة البيانات و Supabase
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3 py-1.5 rounded-md cursor-pointer ${
              activeTab === 'bot' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            إعدادات البوت والـ Webhook
          </button>
        </div>
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4 max-w-xl">
          <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-200 text-xs">
            <strong>بيانات التواصل الرسمية للمقرأة:</strong> هذه البيانات تظهر تلقائياً للمستخدمين داخل البوت وفي قسم الدعم الفني.
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              رقم هاتف التواصل الرسمي:
            </label>
            <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg px-3 py-2">
              <Phone className="w-4 h-4 text-emerald-700 ml-2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              البريد الإلكتروني الرسمي للتواصل:
            </label>
            <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg px-3 py-2">
              <Mail className="w-4 h-4 text-emerald-700 ml-2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              البريد المعتمد للمدير العام (Super Admin):
            </label>
            <div className="flex items-center bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-stone-600">
              <Shield className="w-4 h-4 text-amber-500 ml-2" />
              <span className="text-xs font-mono font-bold" dir="ltr">{superAdminEmail}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer shadow-xs"
            >
              حفظ التغييرات
            </button>
          </div>
        </form>
      )}

      {activeTab === 'supabase' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
            <Database className="w-5 h-5 text-emerald-700" />
            <span>ربط وتفعيل قاعدة بيانات Supabase PostgreSQL</span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            المشروع مهيأ ومزود بملفات SQL متكاملة تشمل المخطط العلائقي الكامل (21 جدولاً)، والبيانات الأولية للباقات والبرامج، وسياسات الأمان على مستوى الصفوف (RLS).
          </p>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="font-bold text-stone-800">الملفات الجاهزة للتطبيق داخل Supabase:</div>
            <ul className="list-disc list-inside space-y-1 text-stone-600">
              <li><code className="bg-white px-1.5 py-0.5 rounded border border-stone-200">bot/database/schema.sql</code> - إنشاء الجداول والفهارس والعلاقات بأمان.</li>
              <li><code className="bg-white px-1.5 py-0.5 rounded border border-stone-200">bot/database/seed.sql</code> - إدراج البرامج الأربعة وباقات الدقائق وأدوار النظام.</li>
              <li><code className="bg-white px-1.5 py-0.5 rounded border border-stone-200">bot/database/rls_policies.sql</code> - تفعيل سياسات Row Level Security لحماية الخصوصية.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={copySqlSnippet}
              className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'تم نسخ المخطط!' : 'نسخ نموذج المخطط السريع'}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bot' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
            <Bot className="w-5 h-5 text-[#105C3B]" />
            <span>إعدادات تشغيل Telegram Bot API</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-900 mb-1">نمط Polling (المحلي والتطوير)</h4>
              <p className="text-stone-500 mb-3">
                يقوم البوت بالاتصال دورياً بخوادم تيليجرام لجلب التحديثات دون الحاجة إلى عنوان IP عام أو شهادة SSL.
              </p>
              <code className="block bg-stone-900 text-emerald-400 p-2 rounded text-[11px] font-mono" dir="ltr">
                BOT_MODE="polling"
              </code>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-900 mb-1">نمط Webhook (الإنتاج والسيرفر)</h4>
              <p className="text-stone-500 mb-3">
                ترسل خوادم تيليجرام التحديثات فورياً إلى الخادم عبر نقطة نهاية HTTPS محمية برمز سري.
              </p>
              <code className="block bg-stone-900 text-emerald-400 p-2 rounded text-[11px] font-mono" dir="ltr">
                BOT_MODE="webhook"
              </code>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
