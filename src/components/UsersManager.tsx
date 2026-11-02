import React, { useState } from 'react';
import { User } from '../types';
import { Users, Search, Shield, Snowflake, Sun, Eye, X } from 'lucide-react';

interface UsersManagerProps {
  users: User[];
  onToggleFreeze: (userId: string, reason?: string) => void;
}

export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  onToggleFreeze,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      u.telegram_id.toString().includes(searchTerm) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            سجل الطلاب والمستخدمين
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            البحث في قاعدة بيانات المشتركين وتجميد أو تنشيط الحسابات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو Telegram ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 w-60"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
          >
            <option value="all">جميع الأدوار</option>
            <option value="super_admin">المدير العام</option>
            <option value="teacher">المعلمون</option>
            <option value="supervisor">المشرفون</option>
            <option value="student">الطلاب</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-600 text-xs font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">الاسم</th>
                <th className="py-3.5 px-4">Telegram ID / المعرف</th>
                <th className="py-3.5 px-4">الهاتف</th>
                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                <th className="py-3.5 px-4">الدور</th>
                <th className="py-3.5 px-4">اللغة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-stone-900">
                    {u.first_name} {u.last_name || ''}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-stone-500">
                    <div>{u.telegram_id}</div>
                    {u.username && <div className="text-stone-400">@{u.username}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-stone-600" dir="ltr">
                    {u.phone || '---'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-stone-600">
                    {u.email || '---'}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.role === 'super_admin' && (
                      <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        👑 المدير العام
                      </span>
                    )}
                    {u.role === 'teacher' && (
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        👨‍🏫 معلم
                      </span>
                    )}
                    {u.role === 'supervisor' && (
                      <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                        🛡 مشرف
                      </span>
                    )}
                    {u.role === 'student' && (
                      <span className="text-xs bg-stone-100 text-stone-700 font-medium px-2 py-0.5 rounded-full">
                        طالب
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs uppercase font-bold text-stone-500">
                    {u.preferred_language}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_frozen ? (
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <Snowflake className="w-3 h-3" />
                        <span>مجمّد</span>
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <span>نشط</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {u.role !== 'super_admin' && (
                      <button
                        onClick={() => onToggleFreeze(u.id, u.is_frozen ? undefined : 'تجميد إداري مؤقت')}
                        className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          u.is_frozen
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        {u.is_frozen ? 'إلغاء التجميد' : 'تجميد'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
