import React from 'react';
import { LayoutDashboard, Users, Calendar, Stethoscope, Settings, LogOut, Activity, Package, Wallet, Coins, ClipboardList, Video } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: ViewState.SCREENING, label: 'จุดคัดกรอง (Screening)', icon: ClipboardList }, 
    { id: ViewState.OPD, label: 'ห้องตรวจแพทย์ (OPD)', icon: Activity },
    { id: ViewState.TELEMEDICINE, label: 'Telemedicine', icon: Video }, // New Item
    { id: ViewState.CASHIER, label: 'การเงินและชำระเงิน', icon: Wallet },
    { id: ViewState.DOCTOR_FEES, label: 'จัดการค่าแพทย์ (DF)', icon: Coins },
    { id: ViewState.PATIENTS, label: 'เวชระเบียนผู้ป่วย', icon: Users },
    { id: ViewState.APPOINTMENTS, label: 'นัดหมาย', icon: Calendar },
    { id: ViewState.INVENTORY, label: 'คลังยาและเวชภัณฑ์', icon: Package },
    { id: ViewState.AI_CONSULT, label: 'ผู้ช่วยอัจฉริยะ (AI)', icon: Stethoscope },
  ];

  return (
    <aside className="w-64 bg-teal-800 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-teal-700 flex items-center gap-3">
        <div className="bg-white p-2 rounded-lg">
           <Stethoscope className="text-teal-700 w-6 h-6" />
        </div>
        <div>
            <h1 className="text-xl font-bold">ClinicCare</h1>
            <p className="text-teal-300 text-xs">ระบบจัดการคลินิก</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-teal-100 hover:bg-teal-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-teal-700">
        <button 
          onClick={() => onChangeView(ViewState.SETTINGS)}
          className={`flex-1 flex items-center gap-3 px-4 py-2 w-full transition-colors rounded-lg mb-1 ${
            currentView === ViewState.SETTINGS 
              ? 'bg-teal-700 text-white' 
              : 'text-teal-200 hover:text-white hover:bg-teal-700/50'
          }`}
        >
            <Settings className="w-5 h-5" />
            <span>ตั้งค่า</span>
        </button>
        <button className="flex items-center gap-3 text-red-300 hover:text-red-100 hover:bg-red-900/20 px-4 py-2 w-full rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;