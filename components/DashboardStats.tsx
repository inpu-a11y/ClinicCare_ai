import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area 
} from 'recharts';
import { Users, CalendarCheck, Activity, DollarSign } from 'lucide-react';

const data = [
  { name: 'จ.', visits: 40 },
  { name: 'อ.', visits: 30 },
  { name: 'พ.', visits: 55 },
  { name: 'พฤ.', visits: 45 },
  { name: 'ศ.', visits: 70 },
  { name: 'ส.', visits: 85 },
  { name: 'อา.', visits: 60 },
];

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    trend: string; 
    trendUp?: boolean 
}> = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className={`mt-4 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
      {trend} <span className="text-slate-400 font-normal ml-1">จากสัปดาห์ที่แล้ว</span>
    </div>
  </div>
);

const DashboardStats: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">ภาพรวมคลินิก</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="ผู้ป่วยวันนี้" 
            value="24" 
            icon={Users} 
            trend="+12%" 
            trendUp={true} 
        />
        <StatCard 
            title="นัดหมายที่ยืนยัน" 
            value="18" 
            icon={CalendarCheck} 
            trend="+5%" 
            trendUp={true} 
        />
        <StatCard 
            title="รายได้วันนี้ (บาท)" 
            value="฿42,500" 
            icon={DollarSign} 
            trend="+8%" 
            trendUp={true} 
        />
        <StatCard 
            title="เคสฉุกเฉิน" 
            value="2" 
            icon={Activity} 
            trend="-1" 
            trendUp={false} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">สถิติผู้ป่วยรายวัน</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#0d9488" fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4">นัดหมายเร็วๆ นี้</h3>
            <div className="space-y-4">
                {[
                    { name: "คุณสมชาย ใจดี", time: "10:30", type: "ตรวจทั่วไป" },
                    { name: "คุณวิภา รักสวย", time: "11:00", type: "ติดตามอาการ" },
                    { name: "คุณอนันต์ คงกระพัน", time: "13:15", type: "กายภาพบำบัด" },
                    { name: "ด.ญ. มาลี มีสุข", time: "14:00", type: "ฉีดวัคซีน" },
                    { name: "คุณประเสริฐ เลิศล้ำ", time: "15:30", type: "ตรวจสุขภาพประจำปี" },
                ].map((apt, idx) => (
                    <div key={idx} className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                        <div className="bg-teal-100 text-teal-700 font-bold p-2 rounded text-xs w-14 text-center">
                            {apt.time}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-semibold text-slate-800">{apt.name}</p>
                            <p className="text-xs text-slate-500">{apt.type}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors">
                ดูทั้งหมด
            </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;