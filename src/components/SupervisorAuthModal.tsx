import React, { useState } from 'react';
import { Shield, KeyRound, UserCog, Check, X, AlertCircle, Lock, UserCheck, ShieldAlert } from 'lucide-react';
import { User, UserRole } from '../types';

interface SupervisorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  supervisorEmail: string;
  supervisorPassword: string;
  users: User[];
  onLogin: (email: string, pass: string) => boolean;
  onLogout: () => void;
  onChangePassword: (newPass: string) => void;
  onAssignRole: (userId: string, newRole: UserRole) => void;
}

export const SupervisorAuthModal: React.FC<SupervisorAuthModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  supervisorEmail,
  supervisorPassword,
  users,
  onLogin,
  onLogout,
  onChangePassword,
  onAssignRole,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'change_password' | 'assign_roles'>(
    isLoggedIn ? 'change_password' : 'login'
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState(supervisorEmail);
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Change password form state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Role assign state
  const [selectedUserForRole, setSelectedUserForRole] = useState<string>(users[0]?.id || '');
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('supervisor');
  const [roleMessage, setRoleMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLogin(loginEmail.trim(), loginPass.trim());
    if (success) {
      setActiveTab('change_password');
      setLoginPass('');
    } else {
      setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (currentPass !== supervisorPassword) {
      setPassMessage({ text: 'كلمة المرور الحالية غير صحيحة.', isError: true });
      return;
    }

    if (newPass.length < 6) {
      setPassMessage({ text: 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات.', isError: true });
      return;
    }

    if (newPass !== confirmPass) {
      setPassMessage({ text: 'كلمة المرور وتأكيدها غير متطابقين.', isError: true });
      return;
    }

    onChangePassword(newPass);
    setPassMessage({ text: '✅ تم تغيير كلمة المرور للمشرف بنجاح وتحديثها!', isError: false });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleAssignRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole) return;

    onAssignRole(selectedUserForRole, selectedNewRole);
    const targetUser = users.find((u) => u.id === selectedUserForRole);
    setRoleMessage(`✅ تم تعيين المستخدم (${targetUser?.first_name}) برتبة (${selectedNewRole}) بنجاح.`);
    setTimeout(() => setRoleMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden text-right flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-900 to-[#105C3B] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Amiri',serif]">
                بوابة المشرف العام وإدارة الصلاحيات
              </h3>
              <p className="text-xs text-emerald-200 font-mono">
                {supervisorEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-bold">
          {!isLoggedIn ? (
            <button
              onClick={() => setActiveTab('login')}
              className="flex-1 py-3 px-4 border-b-2 border-emerald-700 text-emerald-900 bg-white"
            >
              تسجيل الدخول كمشرف
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('change_password')}
                className={`flex-1 py-3 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'change_password'
                    ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>تغيير كلمة المرور</span>
              </button>

              <button
                onClick={() => setActiveTab('assign_roles')}
                className={`flex-1 py-3 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'assign_roles'
                    ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span>تعيين الأدوار والصلاحيات</span>
              </button>
            </>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-800">
          
          {/* TAB 1: Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                <span className="font-bold block mb-1">بيانات الدخول المعتمدة للمشرف العام:</span>
                <div className="font-mono text-[11px] space-y-0.5" dir="ltr">
                  <div>Email: <b>khdahd241@gmail.com</b></div>
                  <div>Password: <b>{supervisorPassword}</b></div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">كلمة المرور:</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              {loginError && (
                <div className="bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-200 flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#105C3B] hover:bg-[#0B3F28] text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                دخول إلى لوحة المشرف
              </button>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'change_password' && isLoggedIn && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
                <span className="font-bold block mb-1">حساب المشرف النشط:</span>
                <span className="font-mono text-xs block">{supervisorEmail}</span>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  يمكنك تحديث كلمة المرور الخاصة بك في أي وقت وتصبح سارية فوراً.
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">كلمة المرور الحالية:</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="أدخل 52504545 أو كلمتك السابقة"
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة (6 خانات على الأقل)"
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">تأكيد كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              {passMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    passMessage.isError
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {passMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{passMessage.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#105C3B] hover:bg-[#0B3F28] text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  حفظ كلمة المرور الجديدة
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 rounded-xl cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Assign Roles to Anyone */}
          {activeTab === 'assign_roles' && isLoggedIn && (
            <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-purple-900">
                <span className="font-bold block mb-1">صلاحية تعيين الأدوار الإدارية:</span>
                <span className="text-[11px] text-purple-800 block">
                  بصفتك المشرف العام، يحق لك ترقية أو تغيير دور أي مستخدم فوراً إلى (مدير عام، مشرف، معلم، طالب).
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">اختر المستخدم المراد تعيين دوره:</label>
                <select
                  value={selectedUserForRole}
                  onChange={(e) => setSelectedUserForRole(e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none text-xs bg-white cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name || ''} ({u.student_code || u.telegram_id}) - دوره الحالي: {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">الدور والرتبة الجديدة:</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                  className="w-full py-2 px-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none text-xs bg-white cursor-pointer font-bold"
                >
                  <option value="super_admin">👑 مدير عام (Super Admin) - كامل الصلاحيات</option>
                  <option value="supervisor">🛡 مشرف (Supervisor) - مراجعة الطلاب والحلقات</option>
                  <option value="teacher">👨‍🏫 معلم ومقرئ (Teacher) - تسميع الحلقات والإعلانات</option>
                  <option value="student">👨‍🎓 طالب (Student) - واجهة الطالب الشخصية والتسميع</option>
                </select>
              </div>

              {roleMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 font-bold">
                  {roleMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                تأكيد تعيين الدور الجديد
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
