import React, { useState } from 'react';
import { PaymentMethodConfig } from '../types';
import { Building2, Save, Power, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PaymentMethodsManagerProps {
  methods: PaymentMethodConfig[];
  onUpdateMethod: (updated: PaymentMethodConfig) => void;
}

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({
  methods,
  onUpdateMethod,
}) => {
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const startEdit = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setBeneficiaryName(method.beneficiary_name);
    setAccountNumber(method.account_number);
    setInstructions(method.instructions_ar);
    setIsActive(method.is_active);
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    onUpdateMethod({
      ...editingMethod,
      beneficiary_name: beneficiaryName.trim(),
      account_number: accountNumber.trim(),
      instructions_ar: instructions.trim(),
      is_active: isActive,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setEditingMethod(null);
      setSavedSuccess(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            حسابات وطرق الدفع والتحويل البنكي
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تهيئة بيانات المستفيدين وأرقام الحسابات وتفعيل الوسائل المعتمدة (CBE, BOA, Telebirr, M-Pesa)
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <strong>ضمان دقة البيانات المالية:</strong> لا يتم اختلاق أو توليد أرقام حسابات وهمية تلقائياً. تظل الوسائل غير مهيأة حتى يقوم المدير العام بإدخال الحسابات البنكية المعتمدة وتفعيلها.
        </div>
      </div>

      {/* Methods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => {
          const isConfigured = Boolean(method.account_number && method.beneficiary_name);

          return (
            <div
              key={method.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                method.is_active ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-bold uppercase font-mono text-xs">
                    {method.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">{method.title_ar}</h3>
                    <span className="text-xs text-stone-400 block">{method.title_en}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    method.is_active
                      ? 'bg-emerald-100 text-[#105C3B]'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{method.is_active ? 'مفعّلة' : 'متوقفة'}</span>
                </span>
              </div>

              <div className="space-y-2 text-xs py-2 border-y border-stone-100 my-3">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">اسم المستفيد:</span>
                  <span className="font-semibold text-stone-800">
                    {method.beneficiary_name || <em className="text-stone-400">غير مهيأ</em>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">رقم الحساب / الهاتف:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm" dir="ltr">
                    {method.account_number || <em className="text-stone-400 text-xs font-sans">غير محدد</em>}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-1">التعليمات:</span>
                  <p className="text-stone-600 line-clamp-2">{method.instructions_ar}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  {isConfigured ? '🟢 جاهز للاستخدام' : '⚪️ بانتظار الإعداد'}
                </span>
                <button
                  onClick={() => startEdit(method)}
                  className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  تهيئة وتعديل
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
                تهيئة طريقة الدفع: {editingMethod.title_ar}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {savedSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم حفظ وتحديث بيانات وسيلة الدفع بنجاح!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                اسم المستفيد المعتمد:
              </label>
              <input
                type="text"
                required
                placeholder="مثال: مقرأة الإمام الجزري / الشيخ خالد أحمد"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                رقم الحساب البنكي أو رقم هاتف التحويل:
              </label>
              <input
                type="text"
                required
                placeholder="أدخل رقم الحساب أو الهاتف الحقيقي بدقة"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono font-bold"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                تعليمات التحويل للطلاب:
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#105C3B] rounded-sm focus:ring-emerald-600"
              />
              <label htmlFor="is_active_toggle" className="text-xs font-bold text-stone-800 cursor-pointer">
                تفعيل وسيلة الدفع وإظهارها للطلاب في البوت
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ البيانات</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
