import React, { useState, useEffect } from 'react';
import { 
  User, Clock, Activity, FileText, Pill, History, Save, Sparkles, 
  Search, Plus, X, Thermometer, Heart, Weight, Stethoscope,
  ChevronRight, Calendar, Printer, AlertCircle, Edit3, CheckCircle, ArrowLeft
} from 'lucide-react';
import { Appointment, Patient, MedicalRecord, Medicine, PrescriptionItem, Staff, AIGeneratedSoap, VitalSigns } from '../types';
import { generateSoapNote } from '../services/geminiService';

interface OPDManagerProps {
  appointments: Appointment[];
  patients: Patient[];
  medicines: Medicine[];
  staff: Staff; // Current doctor
  medicalRecords: MedicalRecord[];
  onSaveRecord: (record: MedicalRecord, appointmentId: string) => void;
}

const OPDManager: React.FC<OPDManagerProps> = ({ 
  appointments, patients, medicines, staff, medicalRecords, onSaveRecord 
}) => {
  // State for selecting patient from queue
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [queueTab, setQueueTab] = useState<'WAITING' | 'ALL'>('WAITING');
  
  // Active Record State
  const [activeTab, setActiveTab] = useState<'RECORD' | 'PRESCRIPTION' | 'HISTORY'>('RECORD');
  const [rawSoapInput, setRawSoapInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Form States
  const [recordId, setRecordId] = useState<string>(''); // For editing
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic: 120, diastolic: 80, heartRate: 72, temperature: 36.6, weight: 60, height: 170, oxygenSat: 98
  });
  
  const [soap, setSoap] = useState<AIGeneratedSoap>({
    subjective: '', objective: '', assessment: '', plan: ''
  });
  
  const [diagnosis, setDiagnosis] = useState('');
  
  // Prescription State
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionItem[]>([]);
  const [medSearch, setMedSearch] = useState('');

  // View History Detail State
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState<MedicalRecord | null>(null);

  // Derived Data
  const selectedAppointment = appointments.find(app => app.id === selectedAppointmentId);
  const selectedPatient = selectedAppointment 
    ? patients.find(p => p.id === selectedAppointment.patientId) 
    : null;

  const patientHistory = selectedPatient 
    ? medicalRecords.filter(r => r.patientId === selectedPatient.id && r.id !== recordId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const bmi = (vitals.weight > 0 && vitals.height > 0) 
  ? (vitals.weight / ((vitals.height / 100) * (vitals.height / 100))).toFixed(1) 
  : '-';

  // Reset or Load form when patient/appointment changes
  useEffect(() => {
    if (selectedAppointmentId && selectedAppointment) {
      // 1. Check if record already exists (Completed or Screening Draft)
      // We look for a record created today for this patient
      const existingRecord = medicalRecords.find(r => 
         r.patientId === selectedAppointment.patientId && 
         r.date === selectedAppointment.date
      );

      if (existingRecord) {
         // Load existing data (either from Screening or Editing a completed case)
         setRecordId(existingRecord.id);
         setVitals(existingRecord.vitalSigns);
         
         // If coming from Screening, the CC might be in subjective or just in chiefComplaint
         // We merge them for the doctor
         const loadedSoap = { ...existingRecord.soap };
         if (!loadedSoap.subjective && existingRecord.chiefComplaint) {
            loadedSoap.subjective = `อาการเบื้องต้น (จากจุดคัดกรอง): ${existingRecord.chiefComplaint}`;
         }
         
         setSoap(loadedSoap);
         setDiagnosis(existingRecord.diagnosis);
         setCurrentPrescription(existingRecord.prescriptions);

      } else {
         // New Record (Fallback if no screening done)
         setRecordId(`REC-${Date.now()}`);
         setRawSoapInput('');
         setSoap({ subjective: `อาการเบื้องต้น: ${selectedAppointment.reason}`, objective: '', assessment: '', plan: '' });
         setDiagnosis('');
         setCurrentPrescription([]);
         setVitals({ systolic: 120, diastolic: 80, heartRate: 72, temperature: 36.6, weight: 60, height: 170, oxygenSat: 98 });
      }
      
      setViewingHistoryRecord(null);
      setActiveTab('RECORD');
    }
  }, [selectedAppointmentId, medicalRecords]);

  const handleAiGenerate = async () => {
    if (!rawSoapInput) return;
    setIsAiLoading(true);
    try {
      const result = await generateSoapNote(rawSoapInput);
      if (result) {
        setSoap(prev => ({
            ...prev,
            subjective: prev.subjective ? `${prev.subjective}\n\n${result.subjective}` : result.subjective,
            objective: result.objective,
            assessment: result.assessment,
            plan: result.plan
        }));
        if (result.assessment) setDiagnosis(result.assessment);
      }
    } catch (e) {
      console.error(e);
      alert('AI Generation failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddMedicine = (med: Medicine) => {
    const existing = currentPrescription.find(p => p.medicineId === med.id);
    if (existing) return;

    setCurrentPrescription([...currentPrescription, {
      medicineId: med.id,
      medicineName: med.name,
      amount: 1,
      unit: med.unit,
      dosage: '1 เม็ด หลังอาหาร เช้า-เย็น',
      price: med.price
    }]);
    setMedSearch('');
  };

  const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = [...currentPrescription];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentPrescription(updated);
  };

  const removePrescriptionItem = (index: number) => {
    setCurrentPrescription(currentPrescription.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedAppointment || !selectedPatient) return;

    if (!diagnosis) {
      alert('กรุณาระบุการวินิจฉัย (Diagnosis)');
      return;
    }

    const totalCost = currentPrescription.reduce((sum, item) => sum + (item.price * item.amount), 0);

    const newRecord: MedicalRecord = {
      id: recordId,
      patientId: selectedPatient.id,
      doctorId: staff.id,
      date: selectedAppointment.date, // Use appointment date
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      chiefComplaint: selectedAppointment.reason, // Keep original reason
      vitalSigns: vitals,
      soap: soap,
      diagnosis: diagnosis,
      prescriptions: currentPrescription,
      totalCost: totalCost + 300 // + Doctor Fee
    };

    onSaveRecord(newRecord, selectedAppointment.id);
    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
  };

  // Filter medicines for search
  const filteredMedicines = medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()));

  // Queue Filtering & Sorting
  const displayedQueue = appointments.filter(a => {
      const isToday = new Date(a.date).toDateString() === new Date().toDateString();
      if (!isToday) return false;
      if (queueTab === 'WAITING') return ['Waiting', 'Confirmed', 'Pending'].includes(a.status);
      return true; // Show all for today
  }).sort((a, b) => {
      // Priority: Waiting (Screened) > Confirmed > Pending > Completed
      const getScore = (status: string) => {
          if (status === 'Waiting') return 4;
          if (status === 'Confirmed') return 3;
          if (status === 'Pending') return 2;
          return 1;
      };
      return getScore(b.status) - getScore(a.status) || a.time.localeCompare(b.time);
  });

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Left Panel: Queue */}
      <div className="w-1/4 min-w-[280px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 bg-teal-800 text-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5" /> คิวผู้ป่วย (Queue)
          </h2>
          <p className="text-teal-200 text-xs mt-1">
             {new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}
          </p>
        </div>
        
        {/* Queue Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setQueueTab('WAITING')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${queueTab === 'WAITING' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                รอตรวจ ({appointments.filter(a => (a.status === 'Waiting' || a.status === 'Confirmed') && new Date(a.date).toDateString() === new Date().toDateString()).length})
            </button>
            <button 
              onClick={() => setQueueTab('ALL')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${queueTab === 'ALL' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                ทั้งหมด
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
          {displayedQueue.length > 0 ? displayedQueue.map(app => (
            <div 
              key={app.id}
              onClick={() => setSelectedAppointmentId(app.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${
                selectedAppointmentId === app.id 
                ? 'border-teal-500 bg-white shadow-md ring-1 ring-teal-200' 
                : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm'
              }`}
            >
              <div className="absolute top-0 right-0">
                  {app.status === 'Waiting' && (
                      <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                          รอพบแพทย์ (คัดกรองแล้ว)
                      </div>
                  )}
                  {app.status === 'Confirmed' && (
                      <div className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                          รอคัดกรอง
                      </div>
                  )}
                  {app.status === 'Completed' && (
                      <div className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                          ตรวจแล้ว
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-start mt-2">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{app.time}</span>
                      <span className={`w-2 h-2 rounded-full ${
                          app.status === 'Confirmed' ? 'bg-amber-400' : 
                          app.status === 'Waiting' ? 'bg-blue-600' :
                          app.status === 'Pending' ? 'bg-slate-300' : 
                          app.status === 'Completed' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                   </div>
                   <h3 className="font-bold text-slate-800">{app.patientName}</h3>
                   <p className="text-xs text-slate-500 line-clamp-1">{app.reason}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                <User className="w-8 h-8 mb-2 opacity-20" />
                <p>ไม่มีคิวในช่วงนี้</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Workstation */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden relative">
        {selectedAppointment && selectedPatient ? (
          <>
            {/* Patient Header Banner */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
               <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm
                      ${selectedPatient.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                    {selectedPatient.gender === 'Male' ? 'ช' : 'ญ'}
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {selectedPatient.name}
                        <span className="text-sm font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">HN: {selectedPatient.id}</span>
                     </h2>
                     <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> อายุ: {selectedPatient.age} ปี</span>
                        <span className="flex items-center gap-1"><Weight className="w-3 h-3"/> BMI: {bmi}</span>
                        <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 rounded-full border border-red-100">
                             แพ้ยา: {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.join(', ') : 'ไม่มี'}
                        </span>
                     </div>
                  </div>
               </div>
               
               {/* Main Tabs */}
               <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <button 
                    onClick={() => setActiveTab('RECORD')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'RECORD' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <FileText className="w-4 h-4" /> บันทึกตรวจ
                  </button>
                  <button 
                    onClick={() => setActiveTab('PRESCRIPTION')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'PRESCRIPTION' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Pill className="w-4 h-4" /> สั่งยา/เวชภัณฑ์
                  </button>
                  <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <History className="w-4 h-4" /> ประวัติรักษา
                  </button>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              
              {/* === RECORD TAB === */}
              {activeTab === 'RECORD' && (
                <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
                  
                  {/* Vitals Section */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Activity className="w-4 h-4 text-teal-600" /> สัญญาณชีพ (Vital Signs)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                       <div className="col-span-1">
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">ความดัน (BP)</label>
                          <div className="flex items-center gap-1">
                            <input type="number" value={vitals.systolic} onChange={e => setVitals({...vitals, systolic: +e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono focus:border-teal-500 outline-none transition-colors" placeholder="120" />
                            <span className="text-slate-400">/</span>
                            <input type="number" value={vitals.diastolic} onChange={e => setVitals({...vitals, diastolic: +e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono focus:border-teal-500 outline-none transition-colors" placeholder="80" />
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> ชีพจร (PR)</label>
                          <div className="relative">
                             <input type="number" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: +e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono focus:border-teal-500 outline-none" />
                             <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">bpm</span>
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3" /> อุณหภูมิ (T)</label>
                          <div className="relative">
                            <input type="number" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: +e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono focus:border-teal-500 outline-none" step="0.1" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">°C</span>
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Weight className="w-3 h-3" /> น้ำหนัก (Wt)</label>
                          <div className="relative">
                            <input type="number" value={vitals.weight} onChange={e => setVitals({...vitals, weight: +e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono focus:border-teal-500 outline-none" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">ส่วนสูง (Ht)</label>
                          <div className="relative">
                            <input type="number" value={vitals.height} onChange={e => setVitals({...vitals, height: +e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono focus:border-teal-500 outline-none" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* AI Assistant for SOAP */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-20 h-20 text-indigo-500" />
                     </div>
                     <div className="flex justify-between items-center mb-3 relative z-10">
                        <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" /> AI Smart Assistant
                        </h3>
                        <button 
                          onClick={handleAiGenerate}
                          disabled={isAiLoading || !rawSoapInput}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-indigo-200 flex items-center gap-2"
                        >
                          {isAiLoading ? <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <Sparkles className="w-3 h-3" />}
                          {isAiLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์และสรุปผล'}
                        </button>
                     </div>
                     <textarea 
                       value={rawSoapInput}
                       onChange={e => setRawSoapInput(e.target.value)}
                       placeholder="พิมพ์บันทึกอาการสั้นๆ ที่นี่... เช่น 'คนไข้มีไข้สูง 39 องศา เจ็บคอมาก กลืนน้ำลายลำบาก ตรวจพบคอแดง ทอนซิลโต'"
                       className="w-full p-3 rounded-lg border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80 min-h-[80px] relative z-10"
                     />
                  </div>

                  {/* SOAP Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="bg-teal-100 text-teal-800 px-1.5 rounded text-xs">S</span> Subjective
                        </label>
                        <textarea 
                          value={soap.subjective} 
                          onChange={e => setSoap({...soap, subjective: e.target.value})}
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px] bg-white" 
                          placeholder="อาการสำคัญ (CC), ประวัติการเจ็บป่วย (PI)"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-1.5 rounded text-xs">O</span> Objective
                        </label>
                        <textarea 
                          value={soap.objective} 
                          onChange={e => setSoap({...soap, objective: e.target.value})}
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px] bg-white" 
                          placeholder="ผลตรวจร่างกาย (PE), ผลแล็บ (Labs)"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-800 px-1.5 rounded text-xs">A</span> Assessment
                        </label>
                        <textarea 
                          value={soap.assessment} 
                          onChange={e => setSoap({...soap, assessment: e.target.value})}
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px] bg-white" 
                          placeholder="การวินิจฉัยโรค (Diagnosis), ปัญหา (Problems)"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="bg-green-100 text-green-800 px-1.5 rounded text-xs">P</span> Plan
                        </label>
                        <textarea 
                          value={soap.plan} 
                          onChange={e => setSoap({...soap, plan: e.target.value})}
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px] bg-white" 
                          placeholder="แผนการรักษา (Tx), คำแนะนำ (Advice)"
                        />
                     </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                     <label className="block text-sm font-bold text-slate-700 mb-2">การวินิจฉัยโรค (Diagnosis) <span className="text-red-500">*</span></label>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            value={diagnosis}
                            onChange={e => setDiagnosis(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                            placeholder="ระบุชื่อโรค หรือ รหัส ICD-10 (เช่น Acute Pharyngitis)"
                        />
                     </div>
                  </div>
                </div>
              )}

              {/* ... (Existing PRESCRIPTION and HISTORY tabs remain unchanged) ... */}
              {activeTab === 'PRESCRIPTION' && (
                <div className="h-full flex flex-col gap-4 animate-fade-in max-w-5xl mx-auto">
                   <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input 
                            type="text" 
                            value={medSearch}
                            onChange={e => setMedSearch(e.target.value)}
                            placeholder="ค้นหายา / เวชภัณฑ์ (พิมพ์ชื่อยา)..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                            autoFocus
                          />
                          {medSearch && (
                            <div className="absolute z-20 w-full bg-white mt-1 rounded-lg shadow-xl border border-slate-200 max-h-80 overflow-y-auto">
                              {filteredMedicines.map(med => {
                                  const isLow = med.stock <= (med.minStock || 0);
                                  return (
                                  <div 
                                    key={med.id} 
                                    onClick={() => handleAddMedicine(med)}
                                    className="p-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 flex justify-between items-center group"
                                  >
                                    <div>
                                        <div className="font-bold text-slate-800 group-hover:text-teal-700">{med.name}</div>
                                        <div className="text-xs text-slate-500">{med.description}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-teal-600">฿{med.price}</div>
                                        <div className={`text-xs ${isLow ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                            คงเหลือ: {med.stock} {med.unit}
                                        </div>
                                    </div>
                                  </div>
                              )})}
                              {filteredMedicines.length === 0 && (
                                  <div className="p-4 text-center text-slate-400 text-sm">ไม่พบรายการยา</div>
                              )}
                            </div>
                          )}
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-0 shadow-sm flex flex-col">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2">
                             <Pill className="w-4 h-4" /> รายการสั่งจ่าย ({currentPrescription.length})
                          </h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {currentPrescription.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                           <Pill className="w-16 h-16 mb-4 stroke-1" />
                           <p>ยังไม่มีรายการยาในใบสั่ง</p>
                           <p className="text-xs">ค้นหาและเลือกยาจากด้านบน</p>
                        </div>
                      ) : (
                        currentPrescription.map((item, idx) => (
                             <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <h4 className="font-bold text-slate-800 text-lg">{item.medicineName}</h4>
                                      <span className="text-xs text-slate-400">ราคาต่อหน่วย: ฿{item.price}</span>
                                   </div>
                                   <button onClick={() => removePrescriptionItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                      <X className="w-5 h-5"/>
                                   </button>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                   <div className="w-full md:w-1/4">
                                      <label className="text-xs font-bold text-slate-500 mb-1 block">จำนวน ({item.unit})</label>
                                      <input 
                                        type="number" 
                                        min="1"
                                        value={item.amount}
                                        onChange={(e) => updatePrescriptionItem(idx, 'amount', +e.target.value)}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center font-bold focus:border-teal-500 outline-none"
                                      />
                                   </div>
                                   <div className="w-full md:w-3/4">
                                      <label className="text-xs font-bold text-slate-500 mb-1 block">วิธีการใช้ยา (Dosage)</label>
                                      <input 
                                        type="text" 
                                        value={item.dosage}
                                        onChange={(e) => updatePrescriptionItem(idx, 'dosage', e.target.value)}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 outline-none"
                                        placeholder="เช่น 1 เม็ด หลังอาหาร เช้า-เย็น"
                                      />
                                   </div>
                                </div>
                                <div className="mt-2 text-right text-sm font-bold text-teal-700 bg-teal-50 p-1 px-2 rounded inline-block float-right">
                                    รวม: ฿{(item.price * item.amount).toLocaleString()}
                                </div>
                             </div>
                           ))
                      )}
                      </div>
                      
                      <div className="bg-slate-800 text-white p-5 flex justify-between items-center rounded-b-xl">
                          <div>
                              <span className="text-slate-400 text-sm">ยอดรวมทั้งสิ้น (Total)</span>
                              <div className="text-2xl font-bold">
                                ฿{currentPrescription.reduce((sum, i) => sum + (i.price * i.amount), 0).toLocaleString()}
                              </div>
                          </div>
                          <div className="text-right text-xs text-slate-400">
                              + ค่าบริการทางการแพทย์ 300 บาท<br/>
                              (รวมในบิลสุดท้าย)
                          </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'HISTORY' && (
                <div className="h-full animate-fade-in max-w-5xl mx-auto flex flex-col">
                   {viewingHistoryRecord ? (
                       <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                               <button onClick={() => setViewingHistoryRecord(null)} className="flex items-center gap-2 text-slate-600 hover:text-teal-700 font-medium">
                                   <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการ
                               </button>
                               <div className="text-sm text-slate-500">
                                   รหัส: {viewingHistoryRecord.id}
                               </div>
                           </div>
                           <div className="flex-1 overflow-y-auto p-8">
                                <div className="text-center mb-8 pb-6 border-b border-slate-100">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">บันทึกการรักษา (Medical Record)</h2>
                                    <p className="text-slate-500">
                                        วันที่: {new Date(viewingHistoryRecord.date).toLocaleDateString('th-TH', {dateStyle: 'long'})} 
                                        {' '} เวลา: {viewingHistoryRecord.time}
                                    </p>
                                    <p className="text-slate-500 mt-1">แพทย์ผู้ตรวจ: {staff.name}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-slate-50 p-6 rounded-xl">
                                        <h3 className="font-bold text-teal-800 mb-4 flex items-center gap-2"><Activity className="w-4 h-4"/> สัญญาณชีพ</h3>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                            <div><span className="text-slate-500 block mb-1">ความดันโลหิต</span> <span className="font-mono font-bold text-lg">{viewingHistoryRecord.vitalSigns.systolic}/{viewingHistoryRecord.vitalSigns.diastolic}</span> mmHg</div>
                                            <div><span className="text-slate-500 block mb-1">ชีพจร</span> <span className="font-mono font-bold text-lg">{viewingHistoryRecord.vitalSigns.heartRate}</span> bpm</div>
                                            <div><span className="text-slate-500 block mb-1">อุณหภูมิ</span> <span className="font-mono font-bold text-lg">{viewingHistoryRecord.vitalSigns.temperature}</span> °C</div>
                                            <div><span className="text-slate-500 block mb-1">น้ำหนัก</span> <span className="font-mono font-bold text-lg">{viewingHistoryRecord.vitalSigns.weight}</span> kg</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-xl">
                                        <h3 className="font-bold text-teal-800 mb-4 flex items-center gap-2"><Stethoscope className="w-4 h-4"/> การวินิจฉัย</h3>
                                        <div className="text-lg font-medium text-slate-800 bg-white p-3 rounded border border-slate-200">
                                            {viewingHistoryRecord.diagnosis}
                                        </div>
                                        <div className="mt-4">
                                            <span className="text-slate-500 text-sm block mb-1">อาการสำคัญ (CC)</span>
                                            <p className="text-slate-700">{viewingHistoryRecord.chiefComplaint}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">บันทึก SOAP Note</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="bg-white p-4 border border-slate-100 rounded-lg">
                                             <span className="text-xs font-bold text-teal-600 block mb-1">SUBJECTIVE</span>
                                             <p className="text-sm text-slate-700">{viewingHistoryRecord.soap.subjective || '-'}</p>
                                         </div>
                                         <div className="bg-white p-4 border border-slate-100 rounded-lg">
                                             <span className="text-xs font-bold text-blue-600 block mb-1">OBJECTIVE</span>
                                             <p className="text-sm text-slate-700">{viewingHistoryRecord.soap.objective || '-'}</p>
                                         </div>
                                         <div className="bg-white p-4 border border-slate-100 rounded-lg">
                                             <span className="text-xs font-bold text-orange-600 block mb-1">ASSESSMENT</span>
                                             <p className="text-sm text-slate-700">{viewingHistoryRecord.soap.assessment || '-'}</p>
                                         </div>
                                         <div className="bg-white p-4 border border-slate-100 rounded-lg">
                                             <span className="text-xs font-bold text-green-600 block mb-1">PLAN</span>
                                             <p className="text-sm text-slate-700">{viewingHistoryRecord.soap.plan || '-'}</p>
                                         </div>
                                     </div>
                                </div>
                           </div>
                       </div>
                   ) : (
                       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                           <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                               <h3 className="font-bold text-slate-700">ประวัติการรักษาทั้งหมด ({patientHistory.length})</h3>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4 space-y-4">
                               {patientHistory.length === 0 ? (
                                  <div className="text-center text-slate-400 py-10">
                                      <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                      <p>ยังไม่มีประวัติการรักษา</p>
                                  </div>
                               ) : (
                                  patientHistory.map((record) => (
                                      <div 
                                        key={record.id} 
                                        onClick={() => setViewingHistoryRecord(record)}
                                        className="group border border-slate-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer bg-white"
                                      >
                                         <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-teal-50 text-teal-700 p-2.5 rounded-lg font-bold text-center min-w-[60px]">
                                                    <div className="text-xs">
                                                        {new Date(record.date).toLocaleDateString('th-TH', {month: 'short'})}
                                                    </div>
                                                    <div className="text-xl leading-none mt-1">
                                                        {new Date(record.date).getDate()}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        {new Date(record.date).getFullYear() + 543}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-800 group-hover:text-teal-700 transition-colors">
                                                        {record.diagnosis}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> {record.time} 
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span> 
                                                        <User className="w-3 h-3" /> {staff.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-teal-500" />
                                         </div>
                                         <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                             <div><span className="font-semibold text-slate-500">CC:</span> {record.chiefComplaint}</div>
                                             <div><span className="font-semibold text-slate-500">Meds:</span> {record.prescriptions.length} รายการ</div>
                                         </div>
                                      </div>
                                  ))
                               )}
                           </div>
                       </div>
                   )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shadow-lg z-10">
               <div className="text-xs text-slate-400">
                  Last Saved: {selectedAppointment.status === 'Completed' ? 'Already Saved' : 'Not saved yet'}
               </div>
               <div className="flex gap-3">
                  <button 
                    onClick={() => {
                        if(confirm('ต้องการปิดหน้าต่างนี้? ข้อมูลที่ยังไม่บันทึกอาจสูญหาย')) {
                            setSelectedAppointmentId(null);
                        }
                    }}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    ปิด / ยกเลิก
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-8 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold shadow-md shadow-teal-200 flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Save className="w-5 h-5" /> 
                    {selectedAppointment.status === 'Completed' ? 'อัปเดตข้อมูล' : 'บันทึกและเสร็จสิ้น'}
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
             <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                 <Stethoscope className="w-16 h-16 opacity-50 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-500 mb-2">พร้อมสำหรับการตรวจรักษา</h3>
             <p className="text-slate-400 text-sm">เลือกผู้ป่วยจากคิวทางด้านซ้ายเพื่อเริ่มการตรวจ</p>
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

export default OPDManager;