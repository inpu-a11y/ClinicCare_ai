import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Plus, X, Save, Edit2, Search, MapPin, Filter } from 'lucide-react';
import { Appointment, Patient, Staff } from '../types';

interface AppointmentManagerProps {
  patients: Patient[];
  staffList: Staff[];
}

// Helper to format date as YYYY-MM-DD
const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generate 30-minute time slots from 08:00 to 20:00
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 8; i < 20; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
        slots.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return slots;
};

// Exam Rooms
const EXAM_ROOMS = ['ห้องตรวจ 1 (OPD 1)', 'ห้องตรวจ 2 (OPD 2)', 'ห้องตรวจ 3 (ER)', 'ห้องทำหัตถการ'];

// Generate some mock data relative to today
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: '1', patientId: 'HN001', patientName: 'สมชาย ใจดี', date: formatDateKey(today), time: '09:00', reason: 'ตรวจเบาหวาน', status: 'Confirmed', doctorName: 'นพ. สมเกียรติ รักษาดี', roomId: 'ห้องตรวจ 1 (OPD 1)', doctorId: 'S001', type: 'Onsite' },
  { id: '2', patientId: 'HN002', patientName: 'วิภา รักสวย', date: formatDateKey(today), time: '10:30', reason: 'ทำแผล', status: 'Pending', doctorName: 'พญ. ใจดี มีสุข', roomId: 'ห้องทำหัตถการ', doctorId: 'S002', type: 'Onsite' },
  { id: '3', patientId: 'HN005', patientName: 'กานดา มานะ', date: formatDateKey(today), time: '11:00', reason: 'ฉีดวัคซีนไข้หวัดใหญ่', status: 'Confirmed', doctorName: 'นพ. สมเกียรติ รักษาดี', roomId: 'ห้องตรวจ 1 (OPD 1)', doctorId: 'S001', type: 'Onsite' },
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ patients, staffList }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Filter State
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  
  // Form & Search State
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  const [formData, setFormData] = useState({
    time: '09:00',
    reason: 'ตรวจทั่วไป',
    doctorId: '',
    roomId: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const timeSlots = generateTimeSlots();
  const doctors = staffList.filter(s => s.role === 'Doctor');

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Handle direct date selection via native picker
  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const newDate = new Date(e.target.value);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const selectedDateKey = formatDateKey(selectedDate);
  
  // Apply Filters
  const filteredAppointments = appointments.filter(app => {
    const matchDoctor = filterDoctor === 'all' || app.doctorId === filterDoctor;
    const matchRoom = filterRoom === 'all' || app.roomId === filterRoom;
    return matchDoctor && matchRoom;
  });

  const dailyAppointments = filteredAppointments.filter(app => app.date === selectedDateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Patient Search Logic
  const filteredPatients = patients.filter(p => {
      const term = patientSearchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) || 
             p.id.toLowerCase().includes(term) || 
             p.phone.includes(term);
  });

  const handleSelectPatient = (patient: Patient) => {
      setSelectedPatient(patient);
      setPatientSearchTerm(patient.name);
      setShowPatientResults(false);
  };

  const handleClearPatient = () => {
      setSelectedPatient(null);
      setPatientSearchTerm('');
  };

  const handleOpenNew = () => {
    setEditingAppointmentId(null);
    setSelectedPatient(null);
    setPatientSearchTerm('');
    setFormData({ time: '09:00', reason: 'ตรวจทั่วไป', doctorId: '', roomId: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (apt: Appointment) => {
    setEditingAppointmentId(apt.id);
    const patient = patients.find(p => p.id === apt.patientId) || null;
    setSelectedPatient(patient);
    setPatientSearchTerm(patient ? patient.name : apt.patientName);
    setFormData({
      time: apt.time,
      reason: apt.reason,
      doctorId: apt.doctorId || '',
      roomId: apt.roomId || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
        alert("กรุณาเลือกผู้ป่วย");
        return;
    }

    const selectedDoctor = staffList.find(s => s.id === formData.doctorId);

    if (editingAppointmentId) {
      // Update existing
      setAppointments(prev => prev.map(app => {
        if (app.id === editingAppointmentId) {
          return {
            ...app,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            doctorId: formData.doctorId,
            doctorName: selectedDoctor ? selectedDoctor.name : '',
            roomId: formData.roomId,
            time: formData.time,
            reason: formData.reason,
            date: selectedDateKey 
          };
        }
        return app;
      }));
    } else {
      // Create new
      const newAppointment: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        date: selectedDateKey,
        time: formData.time,
        reason: formData.reason,
        status: 'Pending',
        doctorId: formData.doctorId,
        doctorName: selectedDoctor ? selectedDoctor.name : '',
        roomId: formData.roomId,
        type: 'Onsite'
      };
      setAppointments([...appointments, newAppointment]);
    }

    setIsModalOpen(false);
  };

  // Calendar Grid Generation
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateKey = formatDateKey(dateObj);
    const isSelected = selectedDateKey === dateKey;
    const isToday = formatDateKey(new Date()) === dateKey;
    
    // Check filtered appointments for dots
    const hasAppointments = filteredAppointments.some(app => app.date === dateKey);

    calendarDays.push(
      <button
        key={d}
        onClick={() => setSelectedDate(dateObj)}
        className={`h-10 w-10 rounded-full flex items-center justify-center relative transition-all text-sm
          ${isSelected 
            ? 'bg-teal-600 text-white font-bold shadow-md' 
            : 'text-slate-700 hover:bg-teal-50'}
          ${isToday && !isSelected ? 'border border-teal-600 text-teal-600 font-bold' : ''}
        `}
      >
        {d}
        {hasAppointments && !isSelected && (
          <div className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full"></div>
        )}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] relative">
      {/* Calendar Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">ปฏิทินนัดหมาย</h2>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="relative group px-2 py-1 cursor-pointer">
                {/* Invisible date input covering the text for direct selection */}
                <input 
                    type="date" 
                    onChange={handleDateSelect}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    title="เลือกวันที่"
                />
                <div className="flex items-center gap-2 group-hover:text-teal-600 transition-colors">
                    <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />
                    <span className="font-semibold text-slate-700 text-sm min-w-[100px] text-center group-hover:text-teal-700 select-none">
                        {monthNames[month]} {year + 543}
                    </span>
                </div>
            </div>

            <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-2">
            <div className="relative">
                <select 
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 text-slate-700 appearance-none"
                >
                    <option value="all">แพทย์ทั้งหมด</option>
                    {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <User className="w-3 h-3" />
                </div>
            </div>
            <div className="relative">
                <select 
                    value={filterRoom}
                    onChange={(e) => setFilterRoom(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 text-slate-700 appearance-none"
                >
                    <option value="all">ห้องตรวจทั้งหมด</option>
                    {EXAM_ROOMS.map(room => (
                        <option key={room} value={room}>{room}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <MapPin className="w-3 h-3" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2 border-t border-slate-100 pt-4">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
            <div key={day} className="text-xs font-semibold text-slate-400 uppercase py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {calendarDays}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">สถานะ</h3>
          <div className="flex gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-600"></div>
              <span>เลือกอยู่</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span>มีนัดหมาย</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment List Section */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                รายการนัดหมาย 
                {(filterDoctor !== 'all' || filterRoom !== 'all') && (
                    <span className="text-xs font-normal bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Filter className="w-3 h-3" /> กรองแล้ว
                    </span>
                )}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
                {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear() + 543}
            </p>
          </div>
          <button 
            onClick={handleOpenNew}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>นัดหมายใหม่</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {dailyAppointments.length > 0 ? (
            dailyAppointments.map((apt) => (
              <div key={apt.id} className="group p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all bg-slate-50 hover:bg-white relative">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-lg border border-slate-100 text-center min-w-[80px] group-hover:border-teal-100 group-hover:bg-teal-50 transition-colors">
                            <span className="block text-lg font-bold text-teal-700">{apt.time}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-800 text-lg">{apt.patientName}</h3>
                                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{apt.patientId}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">{apt.reason}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-teal-600" />
                                    <span>{apt.doctorName || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-teal-600" />
                                    <span>{apt.roomId || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 min-w-[100px]">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            apt.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                            apt.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            apt.status === 'Completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {apt.status === 'Confirmed' ? 'ยืนยันแล้ว' :
                             apt.status === 'Pending' ? 'รอการยืนยัน' :
                             apt.status === 'Completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                        </span>
                        
                        <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(apt)}
                              className="text-slate-400 hover:text-teal-600 p-1 text-xs flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> แก้ไข
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[200px]">
                <CalendarIcon className="w-12 h-12 mb-3" />
                <p>
                    {filterDoctor !== 'all' || filterRoom !== 'all' 
                        ? 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก' 
                        : 'ไม่มีรายการนัดหมายในวันนี้'}
                </p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Modal (Create/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
              <h3 className="font-bold text-teal-800 flex items-center gap-2">
                {editingAppointmentId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingAppointmentId ? 'แก้ไขนัดหมาย' : 'สร้างนัดหมายใหม่'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Date Display */}
              <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">วันที่นัดหมาย:</span>
                <span className="font-bold text-teal-800">
                    {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear() + 543}
                </span>
              </div>

              {/* Search Patient with Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">ค้นหาผู้ป่วย <span className="text-red-500">*</span></label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text"
                        placeholder="ค้นหาด้วย HN, ชื่อ หรือ เบอร์โทรศัพท์"
                        value={patientSearchTerm}
                        onChange={(e) => {
                            setPatientSearchTerm(e.target.value);
                            setShowPatientResults(true);
                            if (!e.target.value) setSelectedPatient(null);
                        }}
                        onFocus={() => setShowPatientResults(true)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${selectedPatient ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'border-slate-200'}`}
                    />
                    {selectedPatient && (
                        <button type="button" onClick={handleClearPatient} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showPatientResults && patientSearchTerm && !selectedPatient && (
                    <div className="absolute z-10 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => handleSelectPatient(p)}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none"
                                >
                                    <div className="font-medium text-slate-800">{p.name}</div>
                                    <div className="text-xs text-slate-500 flex gap-2">
                                        <span className="bg-slate-100 px-1 rounded">{p.id}</span>
                                        <span>{p.phone}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-slate-400 text-center">ไม่พบข้อมูลผู้ป่วย</div>
                        )}
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">แพทย์ผู้รักษา</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select 
                            name="doctorId"
                            value={formData.doctorId}
                            onChange={handleInputChange}
                            className="w-full pl-9 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                            <option value="">-- ระบุแพทย์ --</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  {/* Room Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ห้องตรวจ</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select 
                            name="roomId"
                            value={formData.roomId}
                            onChange={handleInputChange}
                            className="w-full pl-9 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                            <option value="">-- ระบุห้อง --</option>
                            {EXAM_ROOMS.map(room => (
                                <option key={room} value={room}>{room}</option>
                            ))}
                        </select>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {/* Time Slot Selection (30 mins) */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">เวลา (Slot 30 นาที) <span className="text-red-500">*</span></label>
                      <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <select
                              name="time"
                              value={formData.time}
                              onChange={handleInputChange}
                              className="w-full pl-9 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono"
                          >
                              {timeSlots.map(time => (
                                  <option key={time} value={time}>{time} น.</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">สาเหตุการนัด <span className="text-red-500">*</span></label>
                    <select
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="ตรวจทั่วไป">ตรวจทั่วไป</option>
                      <option value="ติดตามอาการ">ติดตามอาการ</option>
                      <option value="ทำแผล">ทำแผล</option>
                      <option value="ฉีดวัคซีน">ฉีดวัคซีน</option>
                      <option value="ตรวจสุขภาพประจำปี">ตรวจสุขภาพประจำปี</option>
                      <option value="กายภาพบำบัด">กายภาพบำบัด</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex justify-center items-center gap-2 shadow-sm shadow-teal-200"
                >
                  <Save className="w-4 h-4" />
                  บันทึกนัดหมาย
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

export default AppointmentManager;