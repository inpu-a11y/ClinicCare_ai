import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Monitor, MessageSquare, 
  FileText, Pill, Clock, User, Signal, Wifi, Activity, Save, X, Sparkles, Search, CheckCircle,
  Copy, Mail, Share2, Smartphone, MonitorUp, Send, Settings, Layout
} from 'lucide-react';
import { Appointment, Patient, MedicalRecord, Medicine, PrescriptionItem, Staff, AIGeneratedSoap } from '../types';
import { generateSoapNote } from '../services/geminiService';

interface TelemedManagerProps {
  appointments: Appointment[];
  patients: Patient[];
  medicines: Medicine[];
  staff: Staff;
  onSaveRecord: (record: MedicalRecord, appointmentId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'Doctor' | 'Patient' | 'System';
  text: string;
  time: string;
}

const TelemedManager: React.FC<TelemedManagerProps> = ({
  appointments, patients, medicines, staff, onSaveRecord
}) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ENDED'>('IDLE');
  
  // Media State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // UI State
  const [activeRightPanel, setActiveRightPanel] = useState<'SOAP' | 'PRESCRIPTION' | 'CHAT'>('SOAP');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Clinical Data State
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

  const telemedQueue = appointments.filter(a => 
    a.type === 'Telemed' && 
    (a.status === 'Confirmed' || a.status === 'Waiting') &&
    new Date(a.date).toDateString() === new Date().toDateString()
  );

  // Cleanup streams
  useEffect(() => {
    return () => {
      stopLocalStream();
      stopScreenShare();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (callStatus === 'CONNECTED') {
      interval = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
     if (selectedAppointmentId) {
         setSoap({ subjective: selectedAppointment?.reason || '', objective: '', assessment: '', plan: '' });
         setDiagnosis('');
         setCurrentPrescription([]);
         setRawSoapInput('');
         setCallStatus('IDLE');
         setCallDuration(0);
         setChatMessages([
             { id: '1', sender: 'System', text: 'ห้องสนทนาพร้อมใช้งาน', time: new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
         ]);
     }
  }, [selectedAppointmentId]);

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setIsScreenSharing(false);
    }
  };

  const startCall = async () => {
    setCallStatus('CONNECTING');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setTimeout(() => {
          setCallStatus('CONNECTED');
          // Mock patient joining message
          setChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: 'System',
              text: `ผู้ป่วย ${selectedPatient?.name} เข้าร่วมห้องสนทนา`,
              time: new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})
          }]);
      }, 1500);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("ไม่สามารถเข้าถึงกล้องหรือไมโครโฟนได้");
      setCallStatus('IDLE');
    }
  };

  const endCall = () => {
    stopLocalStream();
    stopScreenShare();
    setCallStatus('ENDED');
  };

  const toggleScreenShare = async () => {
      if (isScreenSharing) {
          stopScreenShare();
      } else {
          try {
              const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
              setScreenStream(displayStream);
              setIsScreenSharing(true);
              
              // Handle stream end from browser UI
              displayStream.getVideoTracks()[0].onended = () => {
                  stopScreenShare();
              };
          } catch (err) {
              console.error("Error sharing screen:", err);
          }
      }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      
      const newMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'Doctor',
          text: chatInput,
          time: new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setChatInput('');

      // Mock Patient Reply
      setTimeout(() => {
           setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              sender: 'Patient',
              text: 'รับทราบครับคุณหมอ',
              time: new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})
           }]);
      }, 3000);
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
        vitalSigns: { systolic: 0, diastolic: 0, heartRate: 0, temperature: 0, weight: 0, height: 0, oxygenSat: 0 },
        soap,
        diagnosis,
        prescriptions: currentPrescription,
        totalCost: totalCost + 500
    };

    onSaveRecord(newRecord, selectedAppointment.id);
    endCall();
    setSelectedAppointmentId(null);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('คัดลอกลิงก์เรียบร้อยแล้ว');
  };

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden animate-fade-in bg-slate-50">
      {/* Left Panel: Queue */}
      <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-100 bg-indigo-900 text-white rounded-t-xl">
           <h2 className="text-sm font-bold flex items-center gap-2">
               <Video className="w-4 h-4" /> Telemedicine Queue
           </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
           {telemedQueue.length > 0 ? telemedQueue.map(app => (
               <div 
                  key={app.id} 
                  onClick={() => {
                      if (callStatus === 'CONNECTED') {
                          if (confirm('การสนทนาปัจจุบันจะถูกตัดการเชื่อมต่อ ยืนยันเปลี่ยนผู้ป่วย?')) {
                              endCall();
                              setSelectedAppointmentId(app.id);
                          }
                      } else {
                          setSelectedAppointmentId(app.id);
                      }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAppointmentId === app.id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
               >
                  <div className="flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> {app.time}
                              </span>
                              {app.status === 'Waiting' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm">{app.patientName}</h3>
                          <p className="text-xs text-slate-500 truncate w-32">{app.reason}</p>
                      </div>
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
                 {/* Video Conference Area (Center) */}
                 <div className="flex-1 flex flex-col gap-4">
                     {/* Video Stage */}
                     <div className="flex-1 bg-slate-900 rounded-xl relative overflow-hidden shadow-lg flex items-center justify-center group">
                         {callStatus === 'CONNECTED' ? (
                             <>
                                {/* Main View: Remote Patient (Mock) OR Screen Share */}
                                {isScreenSharing && screenStream ? (
                                    <video 
                                        ref={ref => { if (ref) ref.srcObject = screenStream; }} 
                                        autoPlay 
                                        muted 
                                        className="w-full h-full object-contain bg-black" 
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                       <div className="relative w-full h-full">
                                           {/* Mock Remote Video Stream */}
                                           <img 
                                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPatient.name}`} 
                                              alt="Patient Avatar" 
                                              className="w-full h-full object-contain opacity-80" 
                                           />
                                           {/* Audio Wave Animation Mock */}
                                           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 items-end h-8">
                                                <div className="w-1 bg-green-400 animate-[pulse_0.5s_ease-in-out_infinite] h-4"></div>
                                                <div className="w-1 bg-green-400 animate-[pulse_0.7s_ease-in-out_infinite] h-8"></div>
                                                <div className="w-1 bg-green-400 animate-[pulse_0.4s_ease-in-out_infinite] h-5"></div>
                                           </div>
                                       </div>
                                    </div>
                                )}

                                {/* Header Overlay */}
                                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-start text-white z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white/20">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg leading-tight">{selectedPatient.name}</h2>
                                            <div className="flex items-center gap-2 text-xs text-indigo-200">
                                                <span className="flex items-center gap-1"><Signal className="w-3 h-3 text-green-400"/> Excellent Connection</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDuration(callDuration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                         <span className="bg-red-500/80 text-white text-xs px-2 py-1 rounded animate-pulse">REC</span>
                                    </div>
                                </div>

                                {/* Local Doctor View (PIP) */}
                                <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg border border-slate-700 overflow-hidden shadow-2xl z-20 hover:scale-105 transition-transform cursor-move">
                                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                                    <div className="absolute bottom-1 right-2 text-[10px] text-white/70">You</div>
                                    {!isCamOn && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
                                            <VideoOff className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Control Bar */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 px-6 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 shadow-2xl z-30 transition-all hover:bg-slate-900">
                                    <button onClick={toggleMic} className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`} title={isMicOn ? 'Mute' : 'Unmute'}>
                                        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                    </button>
                                    <button onClick={toggleCam} className={`p-3 rounded-full transition-all ${isCamOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`} title={isCamOn ? 'Stop Video' : 'Start Video'}>
                                        {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                    </button>
                                    <button 
                                        onClick={toggleScreenShare} 
                                        className={`p-3 rounded-full transition-all ${isScreenSharing ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                        title="Share Screen"
                                    >
                                        <MonitorUp className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setActiveRightPanel('CHAT')}
                                        className={`p-3 rounded-full transition-all ${activeRightPanel === 'CHAT' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                        title="Chat"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        {/* Badge if unread could go here */}
                                    </button>
                                    <div className="w-px h-8 bg-slate-600 mx-1"></div>
                                    <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white px-6 flex items-center gap-2" title="End Call">
                                        <PhoneOff className="w-5 h-5" />
                                        <span className="text-sm font-bold">End</span>
                                    </button>
                                </div>
                             </>
                         ) : callStatus === 'CONNECTING' ? (
                             <div className="text-center text-white">
                                 <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                 <p className="text-xl font-bold mb-2">กำลังเชื่อมต่อกับ {selectedPatient.name}...</p>
                                 <p className="text-slate-400 text-sm">Secure E2E Encryption</p>
                             </div>
                         ) : callStatus === 'ENDED' ? (
                             <div className="text-center text-white">
                                 <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                                     <CheckCircle className="w-10 h-10" />
                                 </div>
                                 <p className="text-2xl font-bold mb-2">การสนทนาสิ้นสุดแล้ว</p>
                                 <p className="text-slate-400 mb-6">ระยะเวลาสนทนา: {formatDuration(callDuration)}</p>
                                 <button onClick={() => setCallStatus('IDLE')} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors">
                                     กลับสู่หน้าจอเตรียมพร้อม
                                 </button>
                             </div>
                         ) : (
                             // IDLE State with Link Management
                             <div className="flex flex-col items-center justify-center h-full w-full p-8">
                                 <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 max-w-lg w-full text-center">
                                     <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-900 shadow-xl">
                                         <User className="w-12 h-12 text-white" />
                                     </div>
                                     <h2 className="text-2xl font-bold text-white mb-2">{selectedPatient.name}</h2>
                                     <div className="flex items-center justify-center gap-3 text-slate-400 text-sm mb-8">
                                         <span className="bg-slate-700 px-2 py-1 rounded">HN: {selectedPatient.id}</span>
                                         <span>•</span>
                                         <span>{selectedAppointment.reason}</span>
                                     </div>

                                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6 text-left">
                                         <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Secure Room Link</label>
                                         <div className="flex gap-2">
                                             <input 
                                                readOnly 
                                                value={`https://clinic.care/room/${selectedAppointment.id}`} 
                                                className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 text-xs p-2 rounded outline-none font-mono"
                                             />
                                             <button onClick={() => copyToClipboard(`https://clinic.care/room/${selectedAppointment.id}`)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded">
                                                 <Copy className="w-4 h-4"/>
                                             </button>
                                         </div>
                                     </div>

                                     <button 
                                        onClick={startCall}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                                     >
                                         <Video className="w-5 h-5" /> เริ่มการสนทนา (Start Session)
                                     </button>
                                 </div>
                             </div>
                         )}
                     </div>

                     {/* Quick Notes (Only visible if connected) */}
                     {callStatus === 'CONNECTED' && (
                         <div className="bg-white p-3 rounded-xl border border-slate-200 h-32 flex flex-col shadow-sm">
                             <div className="flex justify-between items-center mb-2">
                                 <h3 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-indigo-600" /> Quick Memo (AI Ready)
                                 </h3>
                                 <button 
                                   onClick={handleAiGenerate}
                                   className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"
                                   disabled={isAiLoading || !rawSoapInput}
                                 >
                                    <Sparkles className="w-3 h-3" /> Process
                                 </button>
                             </div>
                             <textarea 
                                value={rawSoapInput}
                                onChange={(e) => setRawSoapInput(e.target.value)}
                                placeholder="จดบันทึกอาการเบื้องต้นที่นี่..." 
                                className="flex-1 w-full p-2 rounded border border-slate-200 resize-none focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                             />
                         </div>
                     )}
                 </div>

                 {/* Medical Record / Chat Panel (Right) */}
                 <div className="w-[380px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden shrink-0">
                     {/* Tabs */}
                     <div className="flex border-b border-slate-100 bg-slate-50">
                         <button 
                            onClick={() => setActiveRightPanel('SOAP')}
                            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeRightPanel === 'SOAP' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                         >
                            SOAP Note
                         </button>
                         <button 
                            onClick={() => setActiveRightPanel('PRESCRIPTION')}
                            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeRightPanel === 'PRESCRIPTION' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                         >
                            สั่งยา (Rx)
                         </button>
                         <button 
                            onClick={() => setActiveRightPanel('CHAT')}
                            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeRightPanel === 'CHAT' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                         >
                            Chat ({chatMessages.length})
                         </button>
                     </div>

                     {/* Content */}
                     <div className="flex-1 overflow-hidden relative">
                         {/* SOAP Panel */}
                         {activeRightPanel === 'SOAP' && (
                             <div className="h-full overflow-y-auto p-4 space-y-4">
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Subjective (S)</label>
                                     <textarea 
                                        value={soap.subjective}
                                        onChange={e => setSoap({...soap, subjective: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[80px] focus:border-indigo-500 outline-none" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Objective (O)</label>
                                     <textarea 
                                        value={soap.objective}
                                        onChange={e => setSoap({...soap, objective: e.target.value})}
                                        placeholder="Note: Vitals are self-reported via Telemed"
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[60px] focus:border-indigo-500 outline-none" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Assessment (A)</label>
                                     <textarea 
                                        value={soap.assessment}
                                        onChange={e => setSoap({...soap, assessment: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[60px] focus:border-indigo-500 outline-none" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 block mb-1">Plan (P)</label>
                                     <textarea 
                                        value={soap.plan}
                                        onChange={e => setSoap({...soap, plan: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded text-sm min-h-[80px] focus:border-indigo-500 outline-none" 
                                     />
                                 </div>
                                 <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                     <label className="text-xs font-bold text-indigo-700 block mb-1">Diagnosis</label>
                                     <input 
                                        type="text"
                                        value={diagnosis}
                                        onChange={e => setDiagnosis(e.target.value)}
                                        className="w-full p-2 border border-indigo-200 rounded text-sm font-bold text-indigo-900 focus:outline-none" 
                                        placeholder="ระบุชื่อโรค..."
                                     />
                                 </div>
                             </div>
                         )}

                         {/* Prescription Panel */}
                         {activeRightPanel === 'PRESCRIPTION' && (
                             <div className="h-full overflow-y-auto p-4 space-y-4">
                                 <div className="relative">
                                     <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                     <input 
                                        type="text" 
                                        value={medSearch}
                                        onChange={e => setMedSearch(e.target.value)}
                                        placeholder="ค้นหายา..."
                                        className="w-full pl-8 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
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
                                         <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-sm relative group hover:border-indigo-300">
                                             <div className="font-bold pr-6 text-slate-700">{item.medicineName}</div>
                                             <div className="grid grid-cols-3 gap-2 mt-2">
                                                 <div className="col-span-1">
                                                    <input type="number" value={item.amount} onChange={(e) => {
                                                        const updated = [...currentPrescription];
                                                        updated[idx].amount = +e.target.value;
                                                        setCurrentPrescription(updated);
                                                    }} className="border rounded p-1 w-full text-center text-xs" />
                                                 </div>
                                                 <div className="col-span-2">
                                                    <input type="text" value={item.dosage} onChange={(e) => {
                                                        const updated = [...currentPrescription];
                                                        updated[idx].dosage = e.target.value;
                                                        setCurrentPrescription(updated);
                                                    }} className="border rounded p-1 w-full text-xs" />
                                                 </div>
                                             </div>
                                             <button 
                                                onClick={() => setCurrentPrescription(currentPrescription.filter((_, i) => i !== idx))}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                                             >
                                                 <X className="w-4 h-4"/>
                                             </button>
                                         </div>
                                     ))}
                                     {currentPrescription.length === 0 && (
                                         <div className="text-center py-8 text-slate-400">
                                             <Pill className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                                             <p className="text-sm">ยังไม่มีรายการยา</p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}

                         {/* Chat Panel */}
                         {activeRightPanel === 'CHAT' && (
                             <div className="h-full flex flex-col bg-slate-50">
                                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                     {chatMessages.map((msg) => (
                                         <div key={msg.id} className={`flex flex-col ${msg.sender === 'Doctor' ? 'items-end' : msg.sender === 'System' ? 'items-center' : 'items-start'}`}>
                                             {msg.sender === 'System' ? (
                                                 <span className="text-[10px] text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{msg.text}</span>
                                             ) : (
                                                 <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                                                     msg.sender === 'Doctor' 
                                                     ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                     : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                                 }`}>
                                                     <p>{msg.text}</p>
                                                     <div className={`text-[10px] mt-1 text-right ${msg.sender === 'Doctor' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                         {msg.time}
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                                 <div className="p-3 bg-white border-t border-slate-200">
                                     <form onSubmit={handleSendMessage} className="flex gap-2">
                                         <input 
                                            type="text" 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="พิมพ์ข้อความ..." 
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                         />
                                         <button type="submit" disabled={!chatInput.trim()} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300">
                                             <Send className="w-4 h-4" />
                                         </button>
                                     </form>
                                 </div>
                             </div>
                         )}
                     </div>

                     {/* Save Button */}
                     <div className="p-4 border-t border-slate-200 bg-white z-10">
                         <button 
                            onClick={handleSave}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                         >
                             <Save className="w-5 h-5" /> บันทึกและจบงาน
                         </button>
                     </div>
                 </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-white m-4 rounded-xl border border-dashed border-slate-300">
                  <Monitor className="w-24 h-24 mb-4 opacity-20" />
                  <h3 className="text-2xl font-bold text-slate-400">Ready for Telemedicine</h3>
                  <p className="text-sm text-slate-400 mt-2">เลือกผู้ป่วยจากคิวทางด้านซ้ายเพื่อเข้าสู่ห้องตรวจออนไลน์</p>
                  <p className="text-xs text-slate-300 mt-1">System Version: In-house Video 1.0</p>
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