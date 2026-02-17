import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, User, Activity, Thermometer, Heart, Weight, Save, ArrowRight 
} from 'lucide-react';
import { Appointment, Patient, MedicalRecord, VitalSigns, Staff } from '../types';

interface ScreeningManagerProps {
  appointments: Appointment[];
  patients: Patient[];
  onSaveScreening: (record: MedicalRecord, appointmentId: string) => void;
  staff: Staff;
}

const ScreeningManager: React.FC<ScreeningManagerProps> = ({ 
  appointments, patients, onSaveScreening, staff 
}) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  // Form State
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic: 120, diastolic: 80, heartRate: 72, temperature: 36.6, weight: 0, height: 0, oxygenSat: 98
  });
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Derived Data
  const queue = appointments.filter(a => a.status === 'Confirmed' && new Date(a.date).toDateString() === new Date().toDateString());
  
  const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId);
  const selectedPatient = selectedAppointment 
    ? patients.find(p => p.id === selectedAppointment.patientId) 
    : null;

  const bmi = (vitals.weight > 0 && vitals.height > 0) 
    ? (vitals.weight / ((vitals.height / 100) * (vitals.height / 100))).toFixed(1) 
    : '-';

  // Initialize form when appointment selected
  useEffect(() => {
    if (selectedAppointment) {
      setChiefComplaint(selectedAppointment.reason || '');
      // Reset vitals or load if previously saved (in a real app)
      setVitals({ systolic: 120, diastolic: 80, heartRate: 72, temperature: 36.6, weight: 0, height: 0, oxygenSat: 98 });
    }
  }, [selectedAppointmentId, selectedAppointment]);

  const handleSave = () => {
    if (!selectedAppointment || !selectedPatient) return;

    if (vitals.weight === 0 || vitals.height === 0) {
        if(!confirm('ยังไม่ได้ระบุน้ำหนักหรือส่วนสูง ต้องการบันทึกหรือไม่?')) return;
    }

    const newRecord: MedicalRecord = {
      id: `REC-${Date.now()}`,
      patientId: selectedPatient.id,
      doctorId: selectedAppointment.doctorId || '', // Assign to the doctor in appointment
      date: selectedAppointment.date,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      chiefComplaint: chiefComplaint,
      vitalSigns: vitals,
      soap: { subjective: `อาการเบื้องต้น: ${chiefComplaint}`, objective: '', assessment: '', plan: '' },
      diagnosis: '',
      prescriptions: [],
      totalCost: 0
    };

    onSaveScreening(newRecord, selectedAppointment.id);
    setSelectedAppointmentId(null);
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden animate-fade-in">
      {/* Left Panel: Queue */}
      <div className="w-1/3 min-w-[300px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 bg-teal-800 text-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> จุดคัดกรอง (Screening)
          </h2>
          <p className="text-teal-200 text-xs mt-1">
             ผู้ป่วยที่รอดำเนินการซักประวัติและวัดสัญญาณชีพ
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
          {queue.length > 0 ? queue.map(app => (
            <div 
              key={app.id}
              onClick={() => setSelectedAppointmentId(app.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedAppointmentId === app.id 
                ? 'border-teal-500 bg-white shadow-md ring-1 ring-teal-200' 
                : 'border-slate-200 bg-white hover:border-teal-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{app.time}</span>
                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">มาถึงแล้ว</span>
                   </div>
                   <h3 className="font-bold text-slate-800">{app.patientName}</h3>
                   <p className="text-xs text-slate-500 mt-1">แพทย์: {app.doctorName || '-'}</p>
                </div>
                <ArrowRight className={`w-5 h-5 ${selectedAppointmentId === app.id ? 'text-teal-500' : 'text-slate-300'}`} />
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-60 text-slate-400 text-sm">
                <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                <p>ไม่มีคิวรอคัดกรอง</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Vitals Form */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
        {selectedAppointment && selectedPatient ? (
           <div className="flex flex-col h-full">
               {/* Header */}
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                   <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm
                          ${selectedPatient.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {selectedPatient.gender === 'Male' ? 'ช' : 'ญ'}
                      </div>
                      <div className="flex-1">
                         <h2 className="text-2xl font-bold text-slate-800">{selectedPatient.name}</h2>
                         <div className="flex gap-4 text-sm text-slate-600 mt-1">
                            <span>HN: {selectedPatient.id}</span>
                            <span>อายุ: {selectedPatient.age} ปี</span>
                            <span className="text-red-600 font-bold bg-red-50 px-2 rounded-full">
                               แพ้ยา: {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.join(', ') : 'ไม่มี'}
                            </span>
                         </div>
                      </div>
                   </div>
               </div>

               {/* Form */}
               <div className="flex-1 overflow-y-auto p-8">
                   <div className="max-w-4xl mx-auto space-y-8">
                       
                       {/* Chief Complaint */}
                       <div className="space-y-2">
                           <label className="text-lg font-bold text-slate-700 flex items-center gap-2">
                               อาการเบื้องต้น (Chief Complaint)
                           </label>
                           <textarea 
                             value={chiefComplaint}
                             onChange={e => setChiefComplaint(e.target.value)}
                             className="w-full p-4 rounded-xl border border-slate-200 text-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 min-h-[100px]"
                             placeholder="ระบุอาการสำคัญที่มาโรงพยาบาล..."
                           />
                       </div>

                       {/* Vital Signs Grid */}
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                           <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                               <Activity className="w-5 h-5 text-teal-600" /> วัดสัญญาณชีพ (Vital Signs)
                           </h3>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {/* BP */}
                               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="text-sm font-bold text-slate-500 mb-2 block">ความดันโลหิต (BP)</label>
                                  <div className="flex items-center gap-2">
                                    <input type="number" value={vitals.systolic} onChange={e => setVitals({...vitals, systolic: +e.target.value})} className="w-full p-3 text-xl font-bold text-center rounded-lg border border-slate-200 focus:border-teal-500 outline-none" />
                                    <span className="text-slate-400 text-xl">/</span>
                                    <input type="number" value={vitals.diastolic} onChange={e => setVitals({...vitals, diastolic: +e.target.value})} className="w-full p-3 text-xl font-bold text-center rounded-lg border border-slate-200 focus:border-teal-500 outline-none" />
                                  </div>
                                  <div className="text-center text-xs text-slate-400 mt-1">mmHg</div>
                               </div>

                               {/* Pulse */}
                               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2"><Heart className="w-4 h-4 text-red-500"/> ชีพจร (Pulse)</label>
                                  <div className="relative">
                                     <input type="number" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: +e.target.value})} className="w-full p-3 text-xl font-bold text-center rounded-lg border border-slate-200 focus:border-teal-500 outline-none" />
                                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">bpm</span>
                                  </div>
                               </div>

                               {/* Temp */}
                               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2"><Thermometer className="w-4 h-4 text-orange-500"/> อุณหภูมิ (Temp)</label>
                                  <div className="relative">
                                     <input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: +e.target.value})} className="w-full p-3 text-xl font-bold text-center rounded-lg border border-slate-200 focus:border-teal-500 outline-none" />
                                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">°C</span>
                                  </div>
                               </div>

                               {/* Weight */}
                               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2"><Weight className="w-4 h-4 text-blue-500"/> น้ำหนัก (Weight)</label>
                                  <div className="relative">
                                     <input type="number" value={vitals.weight} onChange={e => setVitals({...vitals, weight: +e.target.value})} className="w-full p-3 text-xl font-bold text-center rounded-lg border border-slate-200 focus:border-teal-500 outline-none" />
                                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
                                  </div>
                               </div>

                               {/* Height */}
                               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <label className="text-sm font-bold text-slate-500 mb-2 block">ส่วนสูง (Height)</label>
                                  <div className="relative">
                                     <input type="number" value={vitals.height} onChange={e => setVitals({...vitals, height: +e.target.value})} className="w-full p-3 text-xl font-bold text-center rounded-lg border border-slate-200 focus:border-teal-500 outline-none" />
                                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                                  </div>
                               </div>

                               {/* BMI Display */}
                               <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex flex-col justify-center items-center">
                                  <span className="text-sm font-bold text-teal-700 mb-1">BMI</span>
                                  <div className="text-3xl font-bold text-teal-900">{bmi}</div>
                                  <span className="text-xs text-teal-600">kg/m²</span>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               {/* Footer Actions */}
               <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-4 shadow-lg z-10">
                   <button 
                     onClick={() => setSelectedAppointmentId(null)}
                     className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                   >
                     ยกเลิก
                   </button>
                   <button 
                     onClick={handleSave}
                     className="px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold shadow-lg shadow-teal-200 flex items-center gap-2 transform active:scale-95 transition-all"
                   >
                     <Save className="w-5 h-5" /> บันทึกและส่งเข้าห้องตรวจ
                   </button>
               </div>
           </div>
        ) : (
           <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <User className="w-20 h-20 mb-4 opacity-30" />
               <h3 className="text-xl font-bold text-slate-400">เลือกผู้ป่วยจากคิว</h3>
               <p className="text-sm">เพื่อทำการบันทึกประวัติและสัญญาณชีพ</p>
           </div>
        )}
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

export default ScreeningManager;