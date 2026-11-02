import React from 'react';
import { AuditLog } from '../types';
import { Download, ShieldCheck } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const exportLogsToCSV = () => {
    const headers = ['المعرف (ID),المسؤول (Actor),الإجراء (Action),الكيان (Entity),التفاصيل (Details),التاريخ والوقت (Timestamp)'];
    const rows = logs.map((log) =>
      `"${log.id}","${log.actor.replace(/"/g, '""')}","${log.action.replace(/"/g, '""')}","${log.entity}","${log.details.replace(/"/g, '""')}","${log.timestamp}"`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
              سجل التدقيق والرقابة الأمنية
            </h2>
            <span className="text-xs bg-emerald-100 text-[#105C3B] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Audit Logs</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            توثيق كامل لكافة الإجراءات الإدارية والعمليات المالية مع تفاصيل الفاعل والتوقيت
          </p>
        </div>
        <button
          onClick={exportLogsToCSV}
          className="flex items-center justify-center gap-2 bg-[#105C3B] hover:bg-[#18794E] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تصدير السجل إلى ملف (CSV)</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">رقم السجل</th>
                <th className="py-3 px-4">المسؤول (Actor)</th>
                <th className="py-3 px-4">الإجراء</th>
                <th className="py-3 px-4">الكيان المتأثر</th>
                <th className="py-3 px-4">التفاصيل</th>
                <th className="py-3 px-4">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-stone-600">{log.id}</td>
                  <td className="py-3 px-4 font-semibold text-stone-900">{log.actor}</td>
                  <td className="py-3 px-4">
                    <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded-full">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-600">{log.entity}</td>
                  <td className="py-3 px-4 text-stone-600">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-stone-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
