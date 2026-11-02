import React, { useState } from 'react';
import { PaymentRequest } from '../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Calendar,
  Phone,
  Image as ImageIcon,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface PaymentsManagerProps {
  payments: PaymentRequest[];
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string, reason: string) => void;
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({
  payments,
  onApprovePayment,
  onRejectPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sender_phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenReject = (pay: PaymentRequest) => {
    setSelectedPayment(pay);
    setRejectionReason('');
    setIsRejecting(true);
  };

  const confirmRejection = () => {
    if (selectedPayment && rejectionReason.trim()) {
      onRejectPayment(selectedPayment.id, rejectionReason.trim());
      setIsRejecting(false);
      setSelectedPayment(null);
    }
  };

  const exportPaymentsToCSV = () => {
    const headers = ['المعرف (ID),رقم المرجع (Ref),اسم الطالب (Student),طريقة الدفع (Method),المبلغ بالبر (Amount ETB),الدقائق الممنوحة (Minutes),اسم المحوّل (Sender),رقم المحوّل (Phone),الحالة (Status),التاريخ (Date)'];
    const rows = filteredPayments.map((p) =>
      `"${p.id}","${p.transaction_ref}","${p.student_name.replace(/"/g, '""')}","${p.method_id.toUpperCase()}","${p.amount_etb}","${p.minutes}","${p.sender_name.replace(/"/g, '""')}","${p.sender_phone}","${p.status}","${p.created_at}"`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Safeguard Alert */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
              طلبات الدفع والتحقق المالي
            </h2>
            <span className="text-xs bg-emerald-100 text-[#105C3B] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>معاملات ذرية مشفرة</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            مراجعة إيصالات التحويل البنكي (CBE, BOA, Telebirr, M-Pesa) مع اعتماد إضافة الدقائق آلياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالمرجع أو الاسم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 w-56"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-rose-500 text-white font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              معتمد
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'rejected' ? 'bg-stone-700 text-white font-bold shadow-xs' : 'text-stone-600'
              }`}
            >
              مرفوض
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportPaymentsToCSV}
            className="flex items-center gap-1.5 bg-[#105C3B] hover:bg-[#18794E] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Protection Notice */}
      <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">قواعد الحماية المالية الصارمة مفعلة:</span>
          <span className="mr-1">
            لا تضاف الدقائق إلى رصيد الطالب بمجرد إرسال الطلب. اعتماد المعاملة يتم داخل عملية خادم ذرية واحدة مع التحقق من المعرف الفريد لمنع اعتماد نفس الإيصال مرتين.
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-600 text-xs font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">الطالب</th>
                <th className="py-3.5 px-4">الباقة والدقائق</th>
                <th className="py-3.5 px-4">المبلغ والطريقة</th>
                <th className="py-3.5 px-4">بيانات المحول</th>
                <th className="py-3.5 px-4">رقم المرجع (Tx Ref)</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    لا توجد طلبات دفع مطابقة.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-stone-700">
                      {pay.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{pay.student_name}</div>
                      <div className="text-[11px] text-stone-400 font-mono">TG: {pay.telegram_id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-800 text-xs">{pay.package_name}</div>
                      <div className="text-xs text-stone-500 font-semibold">{pay.minutes} دقيقة</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{pay.amount_etb} ETB</div>
                      <div className="text-[11px] font-semibold text-stone-500 uppercase">{pay.method_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600">
                      <div>{pay.sender_name}</div>
                      <div className="font-mono text-stone-400" dir="ltr">{pay.sender_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-stone-700">
                      {pay.transaction_ref}
                    </td>
                    <td className="py-3.5 px-4">
                      {pay.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                          ⏳ قيد المراجعة
                        </span>
                      )}
                      {pay.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full" title={`اعتمد بواسطة: ${pay.reviewed_by}`}>
                          ✅ معتمد
                        </span>
                      )}
                      {pay.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full" title={pay.rejection_reason}>
                          ❌ مرفوض
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedPayment(pay)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          title="عرض الإيصال والتفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {pay.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onApprovePayment(pay.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              title="اعتماد وإضافة الرصيد ذرياً"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenReject(pay)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="رفض الطلب مع إبداء السبب"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details & Receipt Lightbox Modal */}
      {selectedPayment && !isRejecting && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#105C3B]" />
                <h3 className="font-bold text-stone-900 font-['Amiri',serif] text-lg">
                  تفاصيل المعاملة المالية #{selectedPayment.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الطالب</span>
                <span className="font-bold text-stone-800 text-sm">{selectedPayment.student_name}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الباقة والدقائق</span>
                <span className="font-bold text-emerald-700">{selectedPayment.minutes} دقيقة ({selectedPayment.amount_etb} ETB)</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">اسم صاحب التحويل</span>
                <span className="font-semibold text-stone-800">{selectedPayment.sender_name}</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">هاتف المرسل</span>
                <span className="font-mono font-semibold text-stone-800" dir="ltr">{selectedPayment.sender_phone}</span>
              </div>
              <div className="col-span-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-400 block mb-0.5">الرقم المرجعي (Transaction Reference)</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{selectedPayment.transaction_ref}</span>
              </div>
            </div>

            {/* Receipt Preview */}
            <div>
              <span className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>إشعار / صورة إيصال التحويل:</span>
              </span>
              {selectedPayment.receipt_image_url ? (
                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 flex items-center justify-center bg-stone-50">
                  <img
                    src={selectedPayment.receipt_image_url}
                    alt="Receipt"
                    className="max-h-48 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 bg-stone-100 rounded-xl text-center text-xs text-stone-400">
                  لم يتم إرفاق صورة إيصال مع هذا الطلب.
                </div>
              )}
            </div>

            {selectedPayment.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    onApprovePayment(selectedPayment.id);
                    setSelectedPayment(null);
                  }}
                  className="bg-[#105C3B] hover:bg-[#18794E] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  اعتماد الدفع وإضافة {selectedPayment.minutes} دقيقة
                </button>
                <button
                  onClick={() => handleOpenReject(selectedPayment)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  رفض مع السبب
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejecting && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-rose-700 font-['Amiri',serif] text-lg">
              رفض طلب الدفع #{selectedPayment.id}
            </h3>
            <p className="text-xs text-stone-500">
              يجب إدخال سبب الرفض لتوثيقه في السجل المالي وإرساله للمستخدم:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                سبب الرفض (إلزامي):
              </label>
              <textarea
                rows={3}
                placeholder="مثال: الإشعار غير مقروء، أو المبلغ المحول لا يطابق سعر الباقة، أو الرقم المرجعي غير مسجل في البنك..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsRejecting(false)}
                className="text-stone-500 hover:bg-stone-100 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
              >
                تأكيد الرفض مع السبب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
