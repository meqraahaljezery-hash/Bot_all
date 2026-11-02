import React, { useState } from 'react';
import { StudentBalance, BalanceLedgerEntry } from '../types';
import {
  Clock,
  PlusCircle,
  MinusCircle,
  Gift,
  Search,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

interface BalancesLedgerProps {
  balances: StudentBalance[];
  ledger: BalanceLedgerEntry[];
  onAdjustBalance: (
    userId: string,
    minutesChange: number,
    reason: string,
    isBonus?: boolean
  ) => void;
}

export const BalancesLedger: React.FC<BalancesLedgerProps> = ({
  balances,
  ledger,
  onAdjustBalance,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'balances' | 'ledger'>('balances');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<StudentBalance | null>(null);
  const [adjustmentMinutes, setAdjustmentMinutes] = useState<number>(60);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct' | 'bonus'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const filteredBalances = balances.filter(
    (b) =>
      b.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.telegram_id.toString().includes(searchTerm)
  );

  const filteredLedger = ledger.filter(
    (l) =>
      l.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdjustModal = (b: StudentBalance, type: 'add' | 'deduct' | 'bonus') => {
    setSelectedBalance(b);
    setAdjustmentType(type);
    setAdjustmentMinutes(type === 'deduct' ? 30 : 60);
    setAdjustmentReason('');
  };

  const confirmAdjustment = () => {
    if (selectedBalance && adjustmentMinutes > 0 && adjustmentReason.trim()) {
      const change = adjustmentType === 'deduct' ? -adjustmentMinutes : adjustmentMinutes;
      onAdjustBalance(
        selectedBalance.user_id,
        change,
        adjustmentReason.trim(),
        adjustmentType === 'bonus'
      );
      setSelectedBalance(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Sub-Tab switcher */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
              أرصدة الطلاب والدفتر المالي الذري
            </h2>
            <span className="text-xs bg-emerald-100 text-[#105C3B] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>تدقيق غير قابل للتعديل</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            سجل دقيق للدقائق المشتراة والمستهلكة، مع إضافة وتعديل الدقائق للمسؤولين المعتمدين فقط
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-Tab Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('balances')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'balances' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>أرصدة الطلاب ({balances.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ledger')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'ledger' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>سجل الحركات المالية ({ledger.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو السبب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 w-48"
            />
          </div>
        </div>
      </div>

      {activeSubTab === 'balances' ? (
        /* Balances Table */
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-stone-50 text-stone-600 text-xs font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">الطالب</th>
                  <th className="py-3.5 px-4">Telegram ID</th>
                  <th className="py-3.5 px-4">الرصيد المتاح حالياً</th>
                  <th className="py-3.5 px-4">إجمالي المشترى</th>
                  <th className="py-3.5 px-4">إجمالي المستهلك</th>
                  <th className="py-3.5 px-4">رصيد المكافآت</th>
                  <th className="py-3.5 px-4 text-center">إجراءات المدير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      لا يوجد طلاب مطابقين للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((b) => (
                    <tr key={b.user_id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {b.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-400">
                        {b.telegram_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-800 text-base">
                          {b.current_minutes}
                        </span>
                        <span className="text-xs text-stone-500 mr-1">دقيقة</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-stone-700">
                        {b.total_purchased} دقيقة
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-stone-500">
                        {b.total_consumed} دقيقة
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-amber-700">
                        {b.total_bonus} دقيقة
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(b, 'add')}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="إضافة دقائق مدفوعة"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjustModal(b, 'deduct')}
                            disabled={b.current_minutes === 0}
                            className="p-1.5 text-stone-600 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
                            title="خصم دقائق حضور جلسة"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjustModal(b, 'bonus')}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="منح دقائق مكافأة وتشجيع"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Immutable Transaction Ledger Table */
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-stone-50 text-stone-600 text-xs font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">رقم الحركة</th>
                  <th className="py-3.5 px-4">الطالب</th>
                  <th className="py-3.5 px-4">نوع الحركة</th>
                  <th className="py-3.5 px-4">مقدار التغيير</th>
                  <th className="py-3.5 px-4">الرصيد السابق ⬅️ اللاحق</th>
                  <th className="py-3.5 px-4">سبب وتفاصيل العملية</th>
                  <th className="py-3.5 px-4">المنفذ</th>
                  <th className="py-3.5 px-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      لا توجد حركات مسجلة في الدفتر المالي.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-stone-700">
                        {tx.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {tx.student_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.type === 'purchase' && (
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            💳 شراء باقة
                          </span>
                        )}
                        {tx.type === 'session_deduction' && (
                          <span className="text-xs bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                            ⏱ استهلاك تسميع
                          </span>
                        )}
                        {tx.type === 'bonus' && (
                          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            🎁 مكافأة تميز
                          </span>
                        )}
                        {tx.type === 'admin_addition' && (
                          <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                            ➕ إضافة إدارية
                          </span>
                        )}
                        {tx.type === 'admin_deduction' && (
                          <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                            ➖ خصم إداري
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-xs">
                        <span
                          className={tx.minutes_change > 0 ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          {tx.minutes_change > 0 ? `+${tx.minutes_change}` : tx.minutes_change} دقيقة
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                        <span>{tx.balance_before}</span>
                        <span className="mx-1.5 text-stone-400">⬅️</span>
                        <span className="font-bold text-stone-900">{tx.balance_after}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-600 max-w-xs truncate" title={tx.reason}>
                        {tx.reason}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-500 font-medium">
                        {tx.performed_by}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-stone-400">
                        {tx.created_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {selectedBalance && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
                {adjustmentType === 'add' && '➕ إضافة دقائق مدفوعة'}
                {adjustmentType === 'deduct' && '➖ خصم دقائق تسميع'}
                {adjustmentType === 'bonus' && '🎁 منح دقائق مكافأة وتشجيع'}
              </h3>
              <button
                onClick={() => setSelectedBalance(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-xs">
              <div>الطالب: <span className="font-bold text-stone-900">{selectedBalance.student_name}</span></div>
              <div className="mt-1">الرصيد الحالي المتاح: <span className="font-bold text-emerald-700">{selectedBalance.current_minutes} دقيقة</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                عدد الدقائق المراد {adjustmentType === 'deduct' ? 'خصمها' : 'إضافتها'}:
              </label>
              <input
                type="number"
                min="1"
                max={adjustmentType === 'deduct' ? selectedBalance.current_minutes : 2000}
                value={adjustmentMinutes}
                onChange={(e) => setAdjustmentMinutes(parseInt(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                سبب العملية (إلزامي للتوثيق والتدقيق):
              </label>
              <textarea
                rows={3}
                placeholder="مثال: خصم حصة تسميع سورة الإسراء مع المعلم، أو مكافأة إتمام حفظ جزء..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setSelectedBalance(null)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmAdjustment}
                disabled={!adjustmentReason.trim() || adjustmentMinutes <= 0}
                className="bg-[#105C3B] hover:bg-[#18794E] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
              >
                تنفيذ وتوثيق في الدفتر المالي
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
