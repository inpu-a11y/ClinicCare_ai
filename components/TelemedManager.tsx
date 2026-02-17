import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Monitor, MessageSquare, 
  FileText, Pill, Clock, User, Signal, Wifi, Activity, Save, X, Sparkles, Search, CheckCircle
} from 'lucide-react';
import { Appointment, Patient, MedicalRecord, Medicine, PrescriptionItem, Staff, AIGeneratedSoap, VitalSigns } from '../types';
import { generateSoapNote } from '../services/geminiService';

interface TelemedManagerProps {
  appointments: Appointment[];
  patients: Patient[];
  medicines: Medicine[];
  staff: Staff;
  onSaveRecord: (record: MedicalRecord, appointmentId: string) => void;
}

const TelemedManager: React.FC<TelemedManagerProps> = ({
  appointments, patients, medicines, staff, onSaveRecord
}) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ENDED'>('IDLE');
  
  // Media State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Clinical Data State
  const [activeTab, setActiveTab] = useState<'SOAP' | 'PRESCRIPTION'>('SOAP');
  const [rawSoapInput, setRawSoapInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [soap, setSoap] = useState<AIGeneratedSoap>({ subjective: '', objective: '', assessment: '', plan: '' });
  const [diagnosis, setDiagnosis] = useState('');
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionItem[]>([]);
  const [medSearch, setMedSearch] = useState('');

  const selectedAppointment = appointments.find(app => app.id === selectedAppointmentId);
  const selectedPatient = selectedAppointment 
    ? patients.find(p => p.id === selectedAppointment.patientId) 
    : null;

  // Filter only Telemed Appointments
  const telemedQueue = appointments.filter(a => 
    a.type === 'Telemed' && 
    (a.status === 'Confirmed' || a.status === 'Waiting') &&
    new Date(a.date).toDateString() === new Date().toDateString()
  );

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
     if (selectedAppointmentId) {
         setSoap({ subjective: selectedAppointment?.reason || '', objective: '', assessment: '', plan: '' });
         setDiagnosis('');
         setCurrentPrescription([]);
         setRawSoapInput('');
         setCallStatus('IDLE');
     }
  }, [selectedAppointmentId]);

  const startCall = async () => {
    setCallStatus('CONNECTING');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setTimeout(() => setCallStatus('CONNECTED'), 1500); // Simulate connection delay
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("ไม่สามารถเข้าถึงกล้องหรือไมโครโฟนได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง");
      setCallStatus('IDLE');
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCallStatus('ENDED');
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddMedicine = (med: Medicine) => {
    const existing = currentPrescription.find(p => p.medicineId === med.id);
    if (existing) return;
    setCurrentPrescription([...currentPrescription, {
      medicineId: med.id, medicineName: med.name, amount: 1, unit: med.unit, dosage: '1 เม็ด หลังอาหาร เช้า-เย็น', price: med.price
    }]);
    setMedSearch('');
  };

  const handleSave = () => {
    if (!selectedAppointment || !selectedPatient) return;
    if (!diagnosis && !confirm('ยังไม่ได้ระบุนามวินิจฉัย (Diagnosis) ยืนยันที่จะบันทึก?')) return;

    const totalCost = currentPrescription.reduce((sum, item) => sum + (item.price * item.amount), 0);
    const newRecord: MedicalRecord = {
        id: `REC-TM-${Date.now()}`,
        patientId: selectedPatient.id,
        doctorId: staff.id,
        date: selectedAppointment.date,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        chiefComplaint: selectedAppointment.reason,
        vitalSigns: { systolic: 0, diastolic: 0, heartRate: 0, temperature: 0, weight: 0, height: 0, oxygenSat: 0 }, // Telemed usually no vitals unless self-reported
        soap,
        diagnosis,
        prescriptions: currentPrescription,
        totalCost: totalCost + 500 // Higher Doctor Fee for Telemed? Or Standard
    };

    onSaveRecord(newRecord, selectedAppointment.id);
    endCall();
    setSelectedAppointmentId(null);
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden animate-fade-in">
      {/* Left Panel: Queue */}
      <div className="w-1/4 min-w-[280px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 bg-indigo-900 text-white rounded-t-xl">
           <h2 className="text-lg font-bold flex items-center gap-2">
               <Video className="w-5 h-5" /> Telemedicine Queue
           </h2>
           <p className="text-indigo-200 text-xs mt-1">
               นัดหมายปรึกษาแพทย์ทางไกล
           </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
           {telemedQueue.length > 0 ? telemedQueue.map(app => (
               <div 
                  key={app.id} 
                  onClick={() => setSelectedAppointmentId(app.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAppointmentId === app.id ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
               >
                  <div className="flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> {app.time}
                              </span>
                              {app.status === 'Waiting' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                          </div>
                          <h3 className="font-bold text-slate-800">{app.patientName}</h3>
                          <p className="text-xs text-slate-500">{app.reason}</p>
                      </div>
                      <Video className={`w-5 h-5 ${selectedAppointmentId === app.id ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </div>
               </div>
           )) : (
             <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                 <Wifi className="w-8 h-8 mb-2 opacity-20" />
                 <p>ไม่มีคิว Telemedicine</p>
             </div>
           )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
          {selectedAppointment && selectedPatient ? (
              <>
                 {/* Video Area (Center) */}
                 <div className="flex-1 flex flex-col gap-4">
                     <div className="flex-1 bg-black rounded-xl relative overflow-hidden shadow-lg flex items-center justify-center group">
                         {callStatus === 'CONNECTED' ? (
                             <>
                                {/* Patient Video (Mock) */}
                                <div className="absolute inset-0 bg-slate-800">
                                   <img 
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPatient.name}`} 
                                      alt="Patient Avatar" 
                                      className="w-full h-full object-contain opacity-50 blur-sm scale-110" 
                                   />
                                   <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="text-center">
                                            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4 border-4 border-indigo-500 overflow-hidden relative">
                                                <img 
                                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPatient.name}`} 
                                                  alt="Patient" 
                                                  className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">{selectedPatient.name}</h2>
                                            <p className="text-indigo-300 flex items-center justify-center gap-2 mt-2">
                                                <Signal className="w-4 h-4" /> สัญญาณเสียงชัดเจน
                                            </p>
                                       </div>
                                   </div>
                                </div>

                                {/* Doctor Self View (Real) */}
                                <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-900 rounded-lg border-2 border-slate-700 overflow-hidden shadow-2xl">
                                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                                    {!isCamOn && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
                                            <VideoOff className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 transition-opacity opacity-0 group-hover:opacity-100">
                                    <button onClick={toggleMic} className={`p-4 rounded-full ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                                        {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                    </button>
                                    <button onClick={toggleCam} className={`p-4 rounded-full ${isCamOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                                        {isCamOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                                    </button>
                                    <button onClick={endCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white px-8">
                                        <PhoneOff className="w-6 h-6" />
                                    </button>
                                </div>
                             </>
                         ) : callStatus === 'CONNECTING' ? (
                             <div className="text-center text-white">
                                 <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                 <p className="text-lg">กำลังเชื่อมต่อกับ {selectedPatient.name}...</p>
                             </div>
                         ) : callStatus === 'ENDED' ? (
                             <div className="text-center text-white">
                                 <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                 <p className="text-lg font-bold">การสนทนาสิ้นสุดแล้ว</p>
                                 <button onClick={() => setCallStatus('IDLE')} className="mt-4 text-sm text-slate-400 hover:text-white underline">กลับสู่หน้าจอเตรียมพร้อม</button>
                             </div>
                         ) : (
                             // IDLE State
                             <div className="text-center">
                                 <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                     <User className="w-12 h-12 text-slate-400" />
                                 </div>
                                 <h2 className="text-2xl font-bold text-white mb-2">{selectedPatient.name}</h2>
                                 <p className="text-slate-400 mb-8">นัดหมายเวลา: {selectedAppointment.time} น. • {selectedAppointment.reason}</p>
                                 <button 
                                    onClick={startCall}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-lg shadow-green-900/50 flex items-center gap-2 mx-auto transition-transform active:scale-95"
                                 >
                                     <Video className="w-5 h-5" /> เริ่มการสนทนา (Start Call)
                                 </button>
                             </div>
                         )}
                     </div>

                     {/* Quick Notes (Bottom of Video) */}
                     <div className="bg-white p-4 rounded-xl border border-slate-200 h-1/3 flex flex-col">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> บันทึกย่อ (Quick Notes)
                             </h3>
                             <button 
                               onClick={handleAiGenerate}
                               className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-100"
                               disabled={isAiLoading}
                             >
                                <Sparkles className="w-3 h-3" /> {isAiLoading ? 'Analyzing...' : 'AI Organize'}
                             </button>
                         </div>
                         <textarea 
                            value={rawSoapInput}
                            onChange={(e) => setRawSoapInput(e.target.value)}
                            placeholder="พิมพ์บันทึกระหว่างสนทนาที่นี่..." 
                            className="flex-1 w-full p-3 rounded-lg border border-slate-200 resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                         />
                     </div>
                 </div>

                 {/* Medical Record Panel (Right) */}
                 <div className="w-[400px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
                     {/* Patient Info Header */}
                     <div className="p-4 border-b border-slate-100 bg-slate-50">
                         <h3 className="font-bold text-slate-800">{selectedPatient.name}</h3>
                         <div className="flex gap-2 text-xs text-slate-500 mt-1">
                             <span className="bg-white px-1 border rounded">HN: {selectedPatient.id}</span>
                             <span>อายุ: {selectedPatient.age}</span>
                             <span className="text-red-500 font-bold">แพ้: {selectedPatient.allergies.join(',') || '-'}</span>
                         </div>
                     </div>

                     {/* Tabs */}
                     <div className="flex border-b border-slate-100">
                         <button 
                            onClick={() => setActiveTab('SOAP')}
                            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'SOAP' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                         >
                            SOAP Note
                         </button>
                         <button 
                            onClick={() => setActiveTab('PRESCRIPTION')}
                            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'PRESCRIPTION' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                         >
                            สั่งยา (Rx)
                         </button>
                     </div>

                     {/* Tab Content */}
                     <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                         {activeTab === 'SOAP' && (
                             <div className="space-y-4">
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Subjective (S)</label>
                                     <textarea 
                                        value={soap.subjective}
                                        onChange={e => setSoap({...soap, subjective: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[80px]" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Objective (O)</label>
                                     <textarea 
                                        value={soap.objective}
                                        onChange={e => setSoap({...soap, objective: e.target.value})}
                                        placeholder="Note: Vitals are self-reported via Telemed"
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[60px]" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Assessment (A)</label>
                                     <textarea 
                                        value={soap.assessment}
                                        onChange={e => setSoap({...soap, assessment: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[60px]" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Plan (P)</label>
                                     <textarea 
                                        value={soap.plan}
                                        onChange={e => setSoap({...soap, plan: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[80px]" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Diagnosis</label>
                                     <input 
                                        type="text"
                                        value={diagnosis}
                                        onChange={e => setDiagnosis(e.target.value)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold text-indigo-900" 
                                        placeholder="ระบุชื่อโรค..."
                                     />
                                 </div>
                             </div>
                         )}

                         {activeTab === 'PRESCRIPTION' && (
                             <div className="space-y-4">
                                 <div className="relative">
                                     <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                     <input 
                                        type="text" 
                                        value={medSearch}
                                        onChange={e => setMedSearch(e.target.value)}
                                        placeholder="ค้นหายา..."
                                        className="w-full pl-8 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                     />
                                     {medSearch && (
                                         <div className="absolute z-10 w-full bg-white border border-slate-200 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                                             {medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).map(m => (
                                                 <div key={m.id} onClick={() => handleAddMedicine(m)} className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0">
                                                     <div className="font-bold">{m.name}</div>
                                                     <div className="text-xs text-slate-500">{m.stock} {m.unit} left</div>
                                                 </div>
                                             ))}
                                         </div>
                                     )}
                                 </div>

                                 <div className="space-y-2">
                                     {currentPrescription.map((item, idx) => (
                                         <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-sm relative group">
                                             <div className="font-bold pr-6">{item.medicineName}</div>
                                             <div className="grid grid-cols-2 gap-2 mt-1">
                                                 <input type="number" value={item.amount} onChange={(e) => {
                                                     const updated = [...currentPrescription];
                                                     updated[idx].amount = +e.target.value;
                                                     setCurrentPrescription(updated);
                                                 }} className="border rounded p-1 w-full text-center" />
                                                 <input type="text" value={item.dosage} onChange={(e) => {
                                                     const updated = [...currentPrescription];
                                                     updated[idx].dosage = e.target.value;
                                                     setCurrentPrescription(updated);
                                                 }} className="border rounded p-1 w-full" />
                                             </div>
                                             <button 
                                                onClick={() => setCurrentPrescription(currentPrescription.filter((_, i) => i !== idx))}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                                             >
                                                 <X className="w-4 h-4"/>
                                             </button>
                                         </div>
                                     ))}
                                     {currentPrescription.length === 0 && <p className="text-center text-slate-400 text-sm py-4">ยังไม่มีรายการยา</p>}
                                 </div>
                             </div>
                         )}
                     </div>

                     {/* Save Button */}
                     <div className="p-4 border-t border-slate-200 bg-white">
                         <button 
                            onClick={handleSave}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2"
                         >
                             <Save className="w-5 h-5" /> บันทึกและจบงาน
                         </button>
                     </div>
                 </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <Monitor className="w-24 h-24 mb-4 opacity-20" />
                  <h3 className="text-2xl font-bold text-slate-400">Ready for Telemedicine</h3>
                  <p className="text-sm">เลือกผู้ป่วยจากรายการเพื่อเริ่มให้บริการ</p>
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

export default TelemedManager;