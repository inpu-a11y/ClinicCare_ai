import React, { useState } from 'react';
import { 
  Building2, Users, Shield, Save, Plus, Edit2, Trash2, X, Search, 
  CheckCircle, AlertCircle, Mail, Phone, Stethoscope, Tag, Lock, Coins
} from 'lucide-react';
import { Staff, UserRole, ClinicService } from '../types';

interface SettingsManagerProps {
    staffList: Staff[];
    onUpdateStaff: (staff: Staff[]) => void;
    services: ClinicService[];
    onUpdateServices: (services: ClinicService[]) => void;
}

enum Tab {
  GENERAL = 'GENERAL',
  USERS = 'USERS',
  PERMISSIONS = 'PERMISSIONS',
  SERVICES = 'SERVICES'
}

interface PermissionConfig {
  id: string;
  name: string;
  roles: Record<UserRole, boolean>;
}

const INITIAL_PERMISSIONS: PermissionConfig[] = [
  { id: 'dashboard', name: 'เข้าถึง Dashboard', roles: { Admin: true, Doctor: true, Nurse: true, Receptionist: true } },
  { id: 'opd', name: 'ห้องตรวจแพทย์ (OPD)', roles: { Admin: true, Doctor: true, Nurse: true, Receptionist: false } },
  { id: 'records_read', name: 'ดูเวชระเบียน (Read)', roles: { Admin: true, Doctor: true, Nurse: true, Receptionist: true } },
  { id: 'records_write', name: 'แก้ไขเวชระเบียน (Write)', roles: { Admin: true, Doctor: true, Nurse: true, Receptionist: false } },
  { id: 'appointments', name: 'จัดการนัดหมาย', roles: { Admin: true, Doctor: true, Nurse: true, Receptionist: true } },
  { id: 'cashier', name: 'การเงิน (Cashier)', roles: { Admin: true, Doctor: false, Nurse: false, Receptionist: true } },
  { id: 'inventory', name: 'คลังยา (Inventory)', roles: { Admin: true, Doctor: true, Nurse: true, Receptionist: false } },
  { id: 'doctor_fees', name: 'จัดการค่าแพทย์ (DF)', roles: { Admin: true, Doctor: true, Nurse: false, Receptionist: false } },
  { id: 'ai', name: 'AI Assistant', roles: { Admin: true, Doctor: true, Nurse: false, Receptionist: false } },
  { id: 'settings', name: 'ตั้งค่าระบบ', roles: { Admin: true, Doctor: false, Nurse: false, Receptionist: false } },
];

const SettingsManager: React.FC<SettingsManagerProps> = ({ 
    staffList, onUpdateStaff, services, onUpdateServices 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Staff Modal State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    role: 'Doctor',
    email: '',
    phone: '',
    status: 'Active',
    licenseNumber: ''
  });

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Partial<ClinicService>>({
      name: '',
      price: 0,
      doctorFee: 0
  });

  // Permissions State
  const [permissions, setPermissions] = useState<PermissionConfig[]>(INITIAL_PERMISSIONS);
  const [hasUnsavedPermissions, setHasUnsavedPermissions] = useState(false);

  // Filter Staff
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Staff Handlers ---
  const handleOpenModal = (staff?: Staff) => {
    if (staff) {
      setEditingId(staff.id);
      setFormData(staff);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        role: 'Doctor',
        email: '',
        phone: '',
        status: 'Active',
        licenseNumber: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      onUpdateStaff(staffList.filter(s => s.id !== id));
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateStaff(staffList.map(s => s.id === editingId ? { ...s, ...formData } as Staff : s));
    } else {
      const newStaff: Staff = {
        ...formData,
        id: `S${Math.floor(Math.random() * 10000)}`,
      } as Staff;
      onUpdateStaff([...staffList, newStaff]);
    }
    setIsModalOpen(false);
  };

  // --- Service Handlers ---
  const handleOpenServiceModal = (service?: ClinicService) => {
      if (service) {
          setEditingServiceId(service.id);
          setServiceFormData(service);
      } else {
          setEditingServiceId(null);
          setServiceFormData({ name: '', price: 0, doctorFee: 0 });
      }
      setIsServiceModalOpen(true);
  };

  const handleDeleteService = (id: string) => {
      if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการบริการนี้?')) {
          onUpdateServices(services.filter(s => s.id !== id));
      }
  };

  const handleSaveService = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingServiceId) {
          onUpdateServices(services.map(s => s.id === editingServiceId ? { ...s, ...serviceFormData } as ClinicService : s));
      } else {
          const newService: ClinicService = {
              id: `SV${Date.now()}`,
              name: serviceFormData.name || 'New Service',
              price: serviceFormData.price || 0,
              doctorFee: serviceFormData.doctorFee || 0
          };
          onUpdateServices([...services, newService]);
      }
      setIsServiceModalOpen(false);
  };

  // --- Permission Handlers ---
  const handleTogglePermission = (permId: string, role: UserRole) => {
      setPermissions(prev => prev.map(p => {
          if (p.id === permId) {
              return { ...p, roles: { ...p.roles, [role]: !p.roles[role] } };
          }
          return p;
      }));
      setHasUnsavedPermissions(true);
  };

  const handleSavePermissions = () => {
      setTimeout(() => {
          setHasUnsavedPermissions(false);
          alert('บันทึกสิทธิ์การเข้าถึงเรียบร้อยแล้ว');
      }, 500);
  };

  // --- Renders ---
  const renderGeneralSettings = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-teal-600" />
        ข้อมูลคลินิก
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อคลินิก</label>
             <input type="text" defaultValue="ClinicCare Medical Center" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">สาขา</label>
             <input type="text" defaultValue="สำนักงานใหญ่" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
           </div>
        </div>
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่</label>
           <textarea rows={3} defaultValue="123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
             <input type="text" defaultValue="02-123-4567" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">อีเมลติดต่อ</label>
             <input type="email" defaultValue="contact@cliniccare.com" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
           </div>
        </div>
        <div className="pt-4">
            <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                บันทึกการเปลี่ยนแปลง
            </button>
        </div>
      </div>
    </div>
  );

  const renderPermissions = () => {
    const roles: UserRole[] = ['Admin', 'Doctor', 'Nurse', 'Receptionist'];

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-600" />
                      จัดการสิทธิ์การเข้าถึง (Permissions)
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">กำหนดสิทธิ์การเข้าถึงฟีเจอร์ต่างๆ ตามตำแหน่งงาน</p>
              </div>
              <button 
                  onClick={handleSavePermissions}
                  disabled={!hasUnsavedPermissions}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                      ${hasUnsavedPermissions 
                          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                  <Save className="w-4 h-4" />
                  บันทึกสิทธิ์
              </button>
          </div>
          
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-4 font-bold bg-slate-50 sticky left-0 z-10">ฟีเจอร์ / ระบบ</th>
                          {roles.map(role => (
                              <th key={role} className="px-6 py-4 text-center min-w-[100px]">
                                  <span className={`px-2 py-1 rounded-full text-[10px] border
                                      ${role === 'Doctor' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                                        role === 'Nurse' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        role === 'Admin' ? 'bg-slate-100 text-slate-700 border-slate-200' : 
                                        'bg-orange-50 text-orange-700 border-orange-200'
                                      }`}>
                                      {role}
                                  </span>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {permissions.map((perm) => (
                          <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800 bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                                  {perm.name}
                              </td>
                              {roles.map((role) => (
                                  <td key={role} className="px-6 py-4 text-center">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                          <input 
                                              type="checkbox" 
                                              checked={perm.roles[role]} 
                                              onChange={() => handleTogglePermission(perm.id, role)}
                                              className="sr-only peer"
                                              disabled={role === 'Admin' && perm.id === 'settings'} 
                                          />
                                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                      </label>
                                  </td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
  };

  const renderServices = () => (
      <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-teal-600" />
                  รายการค่าบริการ (Service Fees)
              </h3>
              <button 
                  onClick={() => handleOpenServiceModal()}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                  <Plus className="w-4 h-4" /> เพิ่มบริการใหม่
              </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                      <tr>
                          <th className="p-4 font-semibold">ชื่อรายการบริการ</th>
                          <th className="p-4 font-semibold text-right">ราคามาตรฐาน</th>
                          <th className="p-4 font-semibold text-right">ส่วนแบ่งแพทย์ (DF)</th>
                          <th className="p-4 font-semibold text-right">จัดการ</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {services.map(service => (
                          <tr key={service.id} className="hover:bg-slate-50">
                              <td className="p-4 font-medium text-slate-800">{service.name}</td>
                              <td className="p-4 text-right font-mono text-teal-700">฿{service.price.toLocaleString()}</td>
                              <td className="p-4 text-right font-mono text-blue-600">
                                {service.doctorFee ? `฿${service.doctorFee.toLocaleString()}` : '-'}
                              </td>
                              <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <button onClick={() => handleOpenServiceModal(service)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                                          <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteService(service.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {services.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีรายการค่าบริการ</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-4 animate-fade-in">
       {/* Actions Bar */}
       <div className="flex flex-col sm:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="ค้นหาหมอ พนักงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
           </div>
           <button 
             onClick={() => handleOpenModal()}
             className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
           >
             <Plus className="w-4 h-4" />
             เพิ่มผู้ใช้งานใหม่
           </button>
       </div>

       {/* Users Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">ชื่อ-นามสกุล</th>
                        <th className="p-4 font-semibold">ตำแหน่ง</th>
                        <th className="p-4 font-semibold">ติดต่อ</th>
                        <th className="p-4 font-semibold">สถานะ</th>
                        <th className="p-4 font-semibold text-right">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold
                                        ${staff.role === 'Doctor' ? 'bg-teal-600' : 
                                          staff.role === 'Nurse' ? 'bg-blue-500' :
                                          staff.role === 'Admin' ? 'bg-slate-700' : 'bg-orange-500'
                                        }`}>
                                        {staff.role.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">{staff.name}</p>
                                        {staff.licenseNumber && <p className="text-xs text-slate-500">เลข ว.: {staff.licenseNumber}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border
                                    ${staff.role === 'Doctor' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                                      staff.role === 'Nurse' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      staff.role === 'Admin' ? 'bg-slate-100 text-slate-700 border-slate-200' : 
                                      'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}>
                                    {staff.role}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600 space-y-1">
                                <div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {staff.email}</div>
                                <div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {staff.phone}</div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    {staff.status === 'Active' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className={`text-sm ${staff.status === 'Active' ? 'text-green-700' : 'text-slate-500'}`}>
                                        {staff.status === 'Active' ? 'ใช้งานปกติ' : 'ปิดใช้งาน'}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => handleOpenModal(staff)}
                                      className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-teal-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(staff.id)}
                                      className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ (Settings)</h2>
            <p className="text-slate-500 text-sm">จัดการข้อมูลคลินิก ผู้ใช้งาน และสิทธิ์การเข้าถึง</p>
         </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
         {[
             { id: Tab.GENERAL, label: 'ข้อมูลทั่วไป', icon: Building2 },
             { id: Tab.USERS, label: 'จัดการผู้ใช้งาน', icon: Users },
             { id: Tab.PERMISSIONS, label: 'สิทธิ์การเข้าถึง', icon: Shield },
             { id: Tab.SERVICES, label: 'จัดการค่าบริการ', icon: Tag },
         ].map((tab) => {
             const Icon = tab.icon;
             return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap
                        ${activeTab === tab.id 
                            ? 'border-teal-600 text-teal-700 bg-teal-50/50' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                 >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                 </button>
             );
         })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
          {activeTab === Tab.GENERAL && renderGeneralSettings()}
          {activeTab === Tab.USERS && renderUserManagement()}
          {activeTab === Tab.PERMISSIONS && renderPermissions()}
          {activeTab === Tab.SERVICES && renderServices()}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
                  <h3 className="font-bold text-teal-800 flex items-center gap-2">
                    {editingId ? <Edit2 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                    {editingId ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">
                     <X className="w-5 h-5" />
                  </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                  {/* ... (Existing User Form Inputs) ... */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                      <input 
                        type="text" required 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง <span className="text-red-500">*</span></label>
                          <select 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                          >
                              <option value="Doctor">Doctor (หมอ)</option>
                              <option value="Nurse">Nurse (พยาบาล)</option>
                              <option value="Receptionist">Receptionist (ต้อนรับ)</option>
                              <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
                          <select 
                             value={formData.status}
                             onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                             className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                          >
                              <option value="Active">ใช้งานปกติ</option>
                              <option value="Inactive">ปิดการใช้งาน</option>
                          </select>
                      </div>
                  </div>

                  {formData.role === 'Doctor' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เลขที่ใบอนุญาต (ว.)</label>
                        <input 
                            type="text" 
                            value={formData.licenseNumber || ''}
                            onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                            placeholder="เช่น ว.12345"
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                        <input 
                            type="tel" 
                            value={formData.phone || ''}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
                        <input 
                            type="email" 
                            value={formData.email || ''}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                      </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                      <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">บันทึก</button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
                    <h3 className="font-bold text-teal-800 flex items-center gap-2">
                      <Tag className="w-4 h-4"/>
                      {editingServiceId ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}
                    </h3>
                    <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-red-500">
                       <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSaveService} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรายการบริการ <span className="text-red-500">*</span></label>
                        <input 
                           type="text" required 
                           value={serviceFormData.name}
                           onChange={e => setServiceFormData({...serviceFormData, name: e.target.value})}
                           placeholder="เช่น ค่าใบรับรองแพทย์, ล้างแผล"
                           className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ราคามาตรฐาน (บาท) <span className="text-red-500">*</span></label>
                        <input 
                           type="number" required min="0"
                           value={serviceFormData.price}
                           onChange={e => setServiceFormData({...serviceFormData, price: Number(e.target.value)})}
                           className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ส่วนแบ่งแพทย์ (DF) (บาท)</label>
                        <div className="relative">
                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                               type="number" min="0"
                               value={serviceFormData.doctorFee}
                               onChange={e => setServiceFormData({...serviceFormData, doctorFee: Number(e.target.value)})}
                               className="w-full pl-10 pr-2 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                               placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">จำนวนเงินที่แพทย์จะได้รับจากค่าบริการนี้</p>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                        <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">บันทึก</button>
                    </div>
                </form>
             </div>
          </div>
      )}

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

export default SettingsManager;