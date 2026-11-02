import React, { useState } from 'react';
import { MinutePackage } from '../types';
import { PackageCheck, Edit3, Save, Power, CheckCircle2 } from 'lucide-react';

interface PackagesManagerProps {
  packages: MinutePackage[];
  onUpdatePackagePrice: (packageId: string, newPrice: number) => void;
  onTogglePackageStatus: (packageId: string) => void;
}

export const PackagesManager: React.FC<PackagesManagerProps> = ({
  packages,
  onUpdatePackagePrice,
  onTogglePackageStatus,
}) => {
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  const startEdit = (pkg: MinutePackage) => {
    setEditingPkgId(pkg.id);
    setTempPrice(pkg.price_etb);
  };

  const savePrice = (pkgId: string) => {
    if (tempPrice > 0) {
      onUpdatePackagePrice(pkgId, tempPrice);
      setEditingPkgId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            باقات الدقائق والأسعار الرسمية
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تعديل أسعار الباقات بالـ ETB، إدارة إتاحة الباقات للمستخدمين في البوت
          </p>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-600 text-xs font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">الباقة</th>
                <th className="py-3.5 px-4">رصيد الدقائق</th>
                <th className="py-3.5 px-4">السعر الرسمي (ETB)</th>
                <th className="py-3.5 px-4">سعر الدقيقة الواحدة</th>
                <th className="py-3.5 px-4">الوصف</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {packages.map((pkg) => {
                const isEditing = editingPkgId === pkg.id;
                const costPerMinute = (pkg.price_etb / pkg.minutes).toFixed(2);

                return (
                  <tr key={pkg.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{pkg.name_ar}</div>
                      <div className="text-xs text-stone-400">{pkg.name_en}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-800 text-sm">
                      {pkg.minutes} دقيقة
                    </td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 text-xs p-1.5 bg-stone-50 border border-emerald-500 rounded-md font-bold text-stone-900"
                          />
                          <button
                            onClick={() => savePrice(pkg.id)}
                            className="bg-emerald-600 text-white p-1.5 rounded-md hover:bg-emerald-700 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="font-extrabold text-stone-900 text-base">
                          {pkg.price_etb} ETB
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-stone-500">
                      {costPerMinute} ETB/دقيقة
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate">
                      {pkg.desc_ar}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          pkg.is_active
                            ? 'bg-emerald-100 text-[#105C3B]'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {pkg.is_active ? 'نشطة' : 'متوقفة'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => (isEditing ? setEditingPkgId(null) : startEdit(pkg))}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md cursor-pointer"
                          title="تعديل السعر"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onTogglePackageStatus(pkg.id)}
                          className="text-xs px-2.5 py-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-md cursor-pointer"
                        >
                          {pkg.is_active ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
