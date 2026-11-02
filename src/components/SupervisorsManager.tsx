import React from 'react';
import { User } from '../types';
import { Shield, ShieldAlert, Check, X } from 'lucide-react';

interface SupervisorsManagerProps {
  users: User[];
}

export const SupervisorsManager: React.FC<SupervisorsManagerProps> = ({ users }) => {
  const staff = users.filter((u) => ['super_admin', 'admin', 'supervisor'].includes(u.role));

  const permissionsList = [
    { key: 'review_registrations', label: 'مراجعة وقبول طلبات التسجيل' },
    { key: 'review_payments', label: 'اعتماد طلبات الدفع والتحويلات' },
    { key: 'manage_balance', label: 'تعديل الأرصدة ومنح المكافآت' },
    { key: 'manage_groups', label: 'إدارة الحلقات والمجموعات' },
    { key: 'send_announcements', label: 'إرسال الرسائل والإعلانات الجماعية' },
    { key: 'manage_support', label: 'الرد على تذاكر الدعم الفني' },
    { key: 'view_audit_logs', label: 'الاطلاع على سجل التدقيق الأمني' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            المشرفون ومصفوفة الصلاحيات المركزية (RBAC)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            فصل الصلاحيات بدقة؛ لا يملك المشرف صلاحية المعاملات المالية إلا بتفويض صريح من المدير العام
          </p>
        </div>
      </div>

      {/* Staff Table with Permissions */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">المسؤول / المشرف</th>
                <th className="py-3 px-4">الدور</th>
                {permissionsList.map((p) => (
                  <th key={p.key} className="py-3 px-2 text-center whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-stone-900">
                    <div>{member.first_name} {member.last_name || ''}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{member.email || member.telegram_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    {member.role === 'super_admin' ? (
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        المدير العام
                      </span>
                    ) : (
                      <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                        مشرف تعليمي
                      </span>
                    )}
                  </td>

                  {permissionsList.map((p) => {
                    const isGranted =
                      member.role === 'super_admin' ||
                      (member.role === 'supervisor' &&
                        ['review_registrations', 'manage_groups', 'manage_support', 'send_announcements'].includes(
                          p.key
                        ));

                    return (
                      <td key={p.key} className="py-3 px-2 text-center">
                        {isGranted ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-[#105C3B]">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-stone-400">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
