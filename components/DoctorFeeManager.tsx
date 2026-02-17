import React, { useState, useMemo } from 'react';
import { 
  Coins, User, Calendar, DollarSign, Filter, ChevronDown, Activity
} from 'lucide-react';
import { Transaction, Staff } from '../types';

interface DoctorFeeManagerProps {
  transactions: Transaction[];
  staffList: Staff[];
}

const DoctorFeeManager: React.FC<DoctorFeeManagerProps> = ({ transactions, staffList }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const doctors = staffList.filter(s => s.role === 'Doctor');

  // Filter Transactions
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      // 1. Date Range
      const tDate = t.date;
      if (tDate < startDate || tDate > endDate) return false;

      // 2. Doctor Filter
      // Only include transactions that have a doctorId
      if (!t.doctorId) return false;
      if (selectedDoctorId !== 'all' && t.doctorId !== selectedDoctorId) return false;

      return true;
    }).map(t => {
      // Calculate DF for this transaction
      const totalDf = t.items.reduce((sum, item) => sum + ((item.doctorFee || 0) * item.amount), 0);
      return { ...t, totalDf };
    }).filter(t => t.totalDf > 0); // Only show transactions with DF
  }, [transactions, selectedDoctorId, startDate, endDate]);

  const totalRevenue = filteredData.reduce((sum, t) => sum + t.grandTotal, 0);
  const totalDoctorFees = filteredData.reduce((sum, t) => sum + t.totalDf, 0);
  const totalCases = filteredData.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-6 h-6 text-teal-600" />
                จัดการค่ามือแพทย์ (Doctor Fees)
            </h2>
            <p className="text-slate-500 text-sm">สรุปรายได้และค่าตอบแทนแพทย์</p>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
         <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">เลือกแพทย์</label>
             <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <select 
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-w-[200px]"
                 >
                     <option value="all">แพทย์ทั้งหมด</option>
                     {doctors.map(d => (
                         <option key={d.id} value={d.id}>{d.name}</option>
                     ))}
                 </select>
             </div>
         </div>
         <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">ตั้งแต่วันที่</label>
             <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
             />
         </div>
         <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">ถึงวันที่</label>
             <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
             />
         </div>
         <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium flex items-center gap-2">
             <Filter className="w-4 h-4" /> กรองข้อมูล
         </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-slate-500 mb-1">ยอดรวมค่ามือแพทย์ (Total DF)</p>
                      <h3 className="text-2xl font-bold text-blue-600">฿{totalDoctorFees.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <Coins className="w-6 h-6" />
                  </div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-slate-500 mb-1">จำนวนเคส (Total Cases)</p>
                      <h3 className="text-2xl font-bold text-slate-800">{totalCases}</h3>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                      <Activity className="w-6 h-6" />
                  </div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-slate-500 mb-1">รายได้คลินิกจากเคสเหล่านี้</p>
                      <h3 className="text-2xl font-bold text-green-600">฿{totalRevenue.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                      <DollarSign className="w-6 h-6" />
                  </div>
              </div>
          </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">รายการรายละเอียด (Transactions)</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                          <th className="p-4 font-semibold">วันที่ / เวลา</th>
                          <th className="p-4 font-semibold">แพทย์</th>
                          <th className="p-4 font-semibold">ผู้ป่วย</th>
                          <th className="p-4 font-semibold">รายการบริการที่มี DF</th>
                          <th className="p-4 font-semibold text-right">ยอดรวมบิล</th>
                          <th className="p-4 font-semibold text-right">ค่ามือแพทย์ (DF)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredData.length > 0 ? (
                          filteredData.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                  <td className="p-4">
                                      <div className="font-medium text-slate-700">{new Date(t.date).toLocaleDateString('th-TH')}</div>
                                      <div className="text-xs text-slate-400">{t.time}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="font-medium text-slate-700">{t.doctorName}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="text-slate-700">{t.patientName}</div>
                                      <div className="text-xs text-slate-400">HN: {t.patientId}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex flex-col gap-1">
                                          {t.items.filter(i => (i.doctorFee || 0) > 0).map((item, idx) => (
                                              <div key={idx} className="flex justify-between text-xs bg-slate-100 p-1 rounded">
                                                  <span>{item.description}</span>
                                                  <span className="font-mono text-blue-600">DF: {item.doctorFee}</span>
                                              </div>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="p-4 text-right font-mono">
                                      ฿{t.grandTotal.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-right font-mono font-bold text-blue-600">
                                      ฿{t.totalDf.toLocaleString()}
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                  ไม่พบรายการในช่วงเวลาที่เลือก
                              </td>
                          </tr>
                      )}
                  </tbody>
                  {filteredData.length > 0 && (
                      <tfoot className="bg-slate-50 font-bold text-slate-700">
                          <tr>
                              <td colSpan={4} className="p-4 text-right">รวมทั้งหมด</td>
                              <td className="p-4 text-right">฿{totalRevenue.toLocaleString()}</td>
                              <td className="p-4 text-right text-blue-600">฿{totalDoctorFees.toLocaleString()}</td>
                          </tr>
                      </tfoot>
                  )}
              </table>
          </div>
      </div>
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DoctorFeeManager;