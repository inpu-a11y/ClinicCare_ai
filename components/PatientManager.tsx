import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, User, X, Save, CreditCard, MapPin, Calendar, FileText } from 'lucide-react';
import { Patient } from '../types';

interface PatientManagerProps {
  patients: Patient[];
  onAddPatient?: (patient: Patient) => void;
}

const PatientManager: React.FC<PatientManagerProps> = ({ patients, onAddPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const initialFormState: Partial<Patient> = {
    id: '', // Will be generated or manually input
    idCardNumber: '',
    name: '',
    dob: '',
    age: 0,
    gender: 'Male',
    bloodType: 'O',
    phone: '',
    address: '',
    allergies: [],
    history: '',
    lastVisit: new Date().toISOString().split('T')[0] // Default to today
  };

  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);
  const [allergyInput, setAllergyInput] = useState('');

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: Math.max(0, age) }));
    }
  }, [formData.dob]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), allergyInput.trim()]
      }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddPatient) {
        // Generate HN if empty
        const finalData = {
            ...formData,
            id: formData.id || `HN${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            lastVisit: formData.lastVisit || new Date().toISOString().split('T')[0],
            allergies: formData.allergies || []
        } as Patient;

        onAddPatient(finalData);
        setIsModalOpen(false);
        setFormData(initialFormState);
    }
  };

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">ทะเบียนผู้ป่วย</h2>
        <button 
          onClick={() => {
            setFormData(initialFormState);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>ลงทะเบียนผู้ป่วยใหม่</span>
        </button>
      </div>

      {/* Search Bar & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือ เลข HN..." 
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">HN</th>
                <th className="p-4 font-semibold">ชื่อ-นามสกุล</th>
                <th className="p-4 font-semibold">เลขบัตร ปชช.</th>
                <th className="p-4 font-semibold">อายุ/เพศ</th>
                <th className="p-4 font-semibold">แพ้ยา</th>
                <th className="p-4 font-semibold">นัดล่าสุด</th>
                <th className="p-4 font-semibold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600 font-mono text-sm">{patient.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                          <span className="font-medium text-slate-800 block">{patient.name}</span>
                          <span className="text-xs text-slate-400">{patient.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-sm">{patient.idCardNumber || '-'}</td>
                  <td className="p-4 text-slate-600 text-sm">
                    {patient.age} ปี / {patient.gender === 'Male' ? 'ชาย' : patient.gender === 'Female' ? 'หญิง' : 'อื่นๆ'}
                  </td>
                  <td className="p-4">
                    {patient.allergies.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {patient.allergies.map(alg => (
                            <span key={alg} className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                {alg}
                            </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 text-sm">{patient.lastVisit}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                        {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบข้อมูลผู้ป่วย'}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in my-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50 sticky top-0 z-10">
              <h3 className="font-bold text-teal-800 flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                ลงทะเบียนผู้ป่วยใหม่
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section 1: ID & Personal */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 border-b pb-1">
                    <CreditCard className="w-4 h-4" /> ข้อมูลบัตรประชาชน
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">เลขประจำตัวประชาชน (13 หลัก)</label>
                        <input 
                            type="text" 
                            name="idCardNumber"
                            value={formData.idCardNumber}
                            onChange={handleInputChange}
                            placeholder="x-xxxx-xxxxx-xx-x"
                            maxLength={13}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none font-mono" 
                        />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="ระบุคำนำหน้า และชื่อ-สกุล"
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">วันเกิด <span className="text-red-500">*</span></label>
                        <input 
                            type="date" 
                            name="dob"
                            required
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">อายุ (ปี)</label>
                        <input 
                            type="number" 
                            name="age"
                            readOnly
                            value={formData.age}
                            className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-slate-600 focus:outline-none cursor-not-allowed" 
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เพศ</label>
                        <select 
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                        >
                            <option value="Male">ชาย</option>
                            <option value="Female">หญิง</option>
                            <option value="Other">อื่นๆ</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หมู่เลือด</label>
                        <select 
                            name="bloodType"
                            value={formData.bloodType}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                        >
                            <option value="O">O</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="-">ไม่ทราบ</option>
                        </select>
                     </div>
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 border-b pb-1">
                    <MapPin className="w-4 h-4" /> ที่อยู่และการติดต่อ
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่ตามบัตรประชาชน</label>
                        <textarea 
                            name="address"
                            rows={2}
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="บ้านเลขที่, หมู่, ซอย, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด"
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                        <input 
                            type="tel" 
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                        />
                    </div>
                </div>
              </div>

              {/* Section 3: Medical Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 border-b pb-1">
                    <FileText className="w-4 h-4" /> ข้อมูลทางการแพทย์
                </h4>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">โรคประจำตัว / ประวัติการเจ็บป่วย</label>
                     <textarea 
                        name="history"
                        rows={2}
                        value={formData.history}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none" 
                     />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ประวัติการแพ้ยา</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                           type="text" 
                           value={allergyInput}
                           onChange={(e) => setAllergyInput(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                           placeholder="พิมพ์ชื่อยา แล้วกด Enter"
                           className="flex-1 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                        />
                        <button 
                            type="button" 
                            onClick={handleAddAllergy}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded text-sm font-medium"
                        >
                            เพิ่ม
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.allergies?.map((alg, index) => (
                            <span key={index} className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                {alg}
                                <button type="button" onClick={() => removeAllergy(index)} className="hover:text-red-800">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex justify-center items-center gap-2 shadow-sm shadow-teal-200"
                >
                  <Save className="w-5 h-5" />
                  บันทึกข้อมูลผู้ป่วย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PatientManager;