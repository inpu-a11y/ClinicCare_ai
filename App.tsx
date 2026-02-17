import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import PatientManager from './components/PatientManager';
import AIAssistant from './components/AIAssistant';
import AppointmentManager from './components/AppointmentManager';
import SettingsManager from './components/SettingsManager';
import OPDManager from './components/OPDManager';
import InventoryManager from './components/InventoryManager';
import CashierManager from './components/CashierManager';
import DoctorFeeManager from './components/DoctorFeeManager';
import ScreeningManager from './components/ScreeningManager';
import TelemedManager from './components/TelemedManager'; // Import Telemed
import Login from './components/Login';
import { ViewState, Patient, Staff, Medicine, MedicalRecord, Appointment, Transaction, ClinicService } from './types';

// Mock Data Patients
const MOCK_PATIENTS: Patient[] = [
  { 
    id: 'HN001', 
    idCardNumber: '1100400123456',
    name: 'สมชาย ใจดี', 
    dob: '1979-01-01',
    age: 45, 
    gender: 'Male', 
    bloodType: 'O',
    phone: '081-234-5678', 
    address: '123 ถ.สุขุมวิท เขตวัฒนา กทม.',
    lastVisit: '2023-10-15', 
    allergies: ['Penicillin'], 
    history: 'Hypertension' 
  },
  { 
    id: 'HN002', 
    idCardNumber: '1100400987654',
    name: 'วิภา รักสวย', 
    dob: '1992-05-12',
    age: 32, 
    gender: 'Female', 
    bloodType: 'A',
    phone: '089-987-6543', 
    address: '45/2 หมู่บ้านเสรี เขตบางนา กทม.',
    lastVisit: '2023-10-20', 
    allergies: [], 
    history: 'None' 
  },
  { 
    id: 'HN003', 
    idCardNumber: '3100500555666',
    name: 'อนันต์ คงกระพัน', 
    dob: '1964-11-30',
    age: 60, 
    gender: 'Male', 
    bloodType: 'B',
    phone: '086-555-4444', 
    address: '888 ถ.เพชรเกษม เขตภาษีเจริญ กทม.',
    lastVisit: '2023-10-22', 
    allergies: ['Aspirin', 'Sulfa'], 
    history: 'Diabetes Type 2' 
  },
  { 
    id: 'HN004', 
    idCardNumber: '1234567890123',
    name: 'มาลี มีสุข', 
    dob: '2016-02-14',
    age: 8, 
    gender: 'Female',
    bloodType: 'O',
    phone: '081-123-9999',
    address: '99/9 หมู่บ้านสุขสันต์',
    lastVisit: '2023-11-01',
    allergies: [],
    history: 'None' 
  }
];

// Mock Data Staff
const MOCK_STAFF: Staff[] = [
  { id: 'S001', name: 'นพ. สมเกียรติ รักษาดี', role: 'Doctor', email: 'doctor@clinic.com', phone: '081-111-1111', status: 'Active', licenseNumber: 'ว.12345' },
  { id: 'S002', name: 'พญ. ใจดี มีสุข', role: 'Doctor', email: 'doctor2@clinic.com', phone: '081-222-2222', status: 'Active', licenseNumber: 'ว.67890' },
  { id: 'S003', name: 'นางสาว สมศรี พยาบาล', role: 'Nurse', email: 'nurse@clinic.com', phone: '081-333-3333', status: 'Active' },
  { id: 'S004', name: 'นาย สมศักดิ์ แอดมิน', role: 'Admin', email: 'admin@clinic.com', phone: '081-444-4444', status: 'Active' },
  { id: 'S005', name: 'นางสาว แพรวา ต้อนรับ', role: 'Receptionist', email: 'reception@clinic.com', phone: '081-555-5555', status: 'Active' }
];

// Mock Medicines
const MOCK_MEDICINES: Medicine[] = [
  { id: 'M001', name: 'Paracetamol 500mg', description: 'บรรเทาอาการปวด ลดไข้', price: 1.5, cost: 0.5, stock: 1000, minStock: 200, unit: 'เม็ด', category: 'ยาเม็ด' },
  { id: 'M002', name: 'Amoxicillin 500mg', description: 'ยาฆ่าเชื้อแบคทีเรีย', price: 3.0, cost: 1.2, stock: 500, minStock: 100, unit: 'เม็ด', category: 'ยาเม็ด' },
  { id: 'M003', name: 'Loratadine 10mg', description: 'ยาแก้แพ้ ลดน้ำมูก', price: 2.0, cost: 0.8, stock: 50, minStock: 100, unit: 'เม็ด', category: 'ยาเม็ด' },
  { id: 'M004', name: 'Omeprazole 20mg', description: 'ยาลดกรดในกระเพาะ', price: 5.0, cost: 2.5, stock: 200, minStock: 50, unit: 'แคปซูล', category: 'ยาเม็ด' },
  { id: 'M005', name: 'Vitamin C 1000mg', description: 'วิตามินซีเสริมภูมิคุ้มกัน', price: 4.0, cost: 2.0, stock: 400, minStock: 100, unit: 'เม็ด', category: 'ยาเม็ด' },
  { id: 'M006', name: 'Ibuprofen 400mg', description: 'ยาแก้ปวดอักเสบ', price: 2.5, cost: 1.0, stock: 300, minStock: 100, unit: 'เม็ด', category: 'ยาเม็ด' },
  { id: 'M007', name: 'Normal Saline 100ml', description: 'น้ำเกลือล้างแผล', price: 45.0, cost: 25.0, stock: 50, minStock: 20, unit: 'ขวด', category: 'เวชภัณฑ์' },
];

// Mock Services
const MOCK_SERVICES: ClinicService[] = [
  { id: 'S001', name: 'ค่าบริการทางการแพทย์ (Doctor Fee)', price: 300, doctorFee: 300 },
  { id: 'S002', name: 'ใบรับรองแพทย์ (Medical Certificate)', price: 200, doctorFee: 100 },
  { id: 'S003', name: 'ล้างแผล (Wound Dressing)', price: 150, doctorFee: 50 },
  { id: 'S004', name: 'ฉีดยา (Injection)', price: 100, doctorFee: 50 },
  { id: 'S005', name: 'ตรวจคลื่นหัวใจ (EKG)', price: 500, doctorFee: 200 },
  { id: 'S006', name: 'พ่นยา (Nebulizer)', price: 300, doctorFee: 100 },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Data States
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
  const [medicines, setMedicines] = useState<Medicine[]>(MOCK_MEDICINES);
  const [clinicServices, setClinicServices] = useState<ClinicService[]>(MOCK_SERVICES);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Appointment State
  const [appointments, setAppointments] = useState<Appointment[]>([
      { id: '1', patientId: 'HN001', patientName: 'สมชาย ใจดี', date: new Date().toISOString().split('T')[0], time: '09:00', reason: 'ตรวจเบาหวาน', status: 'Confirmed', paymentStatus: 'Pending', doctorName: 'นพ. สมเกียรติ รักษาดี', roomId: 'ห้องตรวจ 1 (OPD 1)', doctorId: 'S001', type: 'Onsite' },
      { id: '2', patientId: 'HN002', patientName: 'วิภา รักสวย', date: new Date().toISOString().split('T')[0], time: '10:30', reason: 'ทำแผล', status: 'Pending', paymentStatus: 'Pending', doctorName: 'พญ. ใจดี มีสุข', roomId: 'ห้องทำหัตถการ', doctorId: 'S002', type: 'Onsite' },
      { id: '3', patientId: 'HN005', patientName: 'กานดา มานะ', date: new Date().toISOString().split('T')[0], time: '11:00', reason: 'ฉีดวัคซีนไข้หวัดใหญ่', status: 'Confirmed', paymentStatus: 'Pending', doctorName: 'นพ. สมเกียรติ รักษาดี', roomId: 'ห้องตรวจ 1 (OPD 1)', doctorId: 'S001', type: 'Onsite' },
      // Telemedicine Mock
      { id: '4', patientId: 'HN003', patientName: 'อนันต์ คงกระพัน', date: new Date().toISOString().split('T')[0], time: '13:00', reason: 'ติดตามอาการความดัน', status: 'Confirmed', paymentStatus: 'Pending', doctorName: 'นพ. สมเกียรติ รักษาดี', roomId: 'Virtual Room', doctorId: 'S001', type: 'Telemed', telemedLink: 'https://meet.google.com' },
  ]);

  const handleLogin = (user: Staff) => {
    setCurrentUser(user);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleAddPatient = (patient: Patient) => {
    setPatients([...patients, patient]);
    setCurrentView(ViewState.PATIENTS);
  };

  const handleUpdateStaff = (newStaffList: Staff[]) => {
    setStaffList(newStaffList);
  };

  const handleUpdateServices = (updatedList: ClinicService[]) => {
      setClinicServices(updatedList);
  };

  // Called when Nurse saves screening data
  const handleSaveScreening = (record: MedicalRecord, appointmentId: string) => {
      setMedicalRecords([record, ...medicalRecords]);
      // Update appointment status to 'Waiting' (Waiting for doctor)
      setAppointments(prev => prev.map(app => 
        app.id === appointmentId ? { ...app, status: 'Waiting' } : app
      ));
      alert('บันทึกการคัดกรองเรียบร้อย ส่งเข้าห้องตรวจแล้ว');
  };

  const handleSaveMedicalRecord = (record: MedicalRecord, appointmentId: string) => {
    const existingIndex = medicalRecords.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
        // Update existing record
        const updatedRecords = [...medicalRecords];
        updatedRecords[existingIndex] = record;
        setMedicalRecords(updatedRecords);
    } else {
        // New Record (Fallback if not created via screening)
        setMedicalRecords([record, ...medicalRecords]);
    }

    // Deduct stock
    const updatedMedicines = [...medicines];
    record.prescriptions.forEach(p => {
        const medIndex = updatedMedicines.findIndex(m => m.id === p.medicineId);
        if (medIndex !== -1) {
            updatedMedicines[medIndex] = {
                ...updatedMedicines[medIndex],
                stock: Math.max(0, updatedMedicines[medIndex].stock - p.amount)
            };
        }
    });
    setMedicines(updatedMedicines);
    
    // Update appointment status to Completed
    setAppointments(prev => prev.map(app => 
      app.id === appointmentId ? { ...app, status: 'Completed' } : app
    ));
    
    // Update patient last visit
    setPatients(prev => prev.map(p => 
      p.id === record.patientId ? { ...p, lastVisit: record.date } : p
    ));
  };

  const handleUpdateMedicines = (updatedList: Medicine[]) => {
    setMedicines(updatedList);
  };

  const handleProcessPayment = (transaction: Transaction, appointmentId: string) => {
    setTransactions([transaction, ...transactions]);
    setAppointments(prev => prev.map(app => 
      app.id === appointmentId ? { ...app, paymentStatus: 'Paid' } : app
    ));
  };

  if (!currentUser) {
    return <Login staffList={staffList} onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="ml-64 flex-1 p-8 h-screen overflow-y-auto">
        {currentView === ViewState.DASHBOARD && <DashboardStats />}
        
        {currentView === ViewState.PATIENTS && (
          <PatientManager 
            patients={patients} 
            onAddPatient={handleAddPatient} 
          />
        )}
        
        {currentView === ViewState.APPOINTMENTS && (
          <AppointmentManager 
            patients={patients} 
            staffList={staffList}
          />
        )}

        {currentView === ViewState.SCREENING && (
          <ScreeningManager 
            appointments={appointments}
            patients={patients}
            onSaveScreening={handleSaveScreening}
            staff={currentUser}
          />
        )}

        {currentView === ViewState.OPD && (
          <OPDManager 
            appointments={appointments}
            patients={patients}
            medicines={medicines}
            staff={currentUser}
            medicalRecords={medicalRecords}
            onSaveRecord={handleSaveMedicalRecord}
          />
        )}
        
        {currentView === ViewState.TELEMEDICINE && (
          <TelemedManager
            appointments={appointments}
            patients={patients}
            medicines={medicines}
            staff={currentUser}
            onSaveRecord={handleSaveMedicalRecord}
          />
        )}

        {currentView === ViewState.CASHIER && (
          <CashierManager
            appointments={appointments}
            medicalRecords={medicalRecords}
            patients={patients}
            transactions={transactions}
            onProcessPayment={handleProcessPayment}
            services={clinicServices}
          />
        )}

        {currentView === ViewState.INVENTORY && (
           <InventoryManager 
             medicines={medicines}
             onUpdateMedicines={handleUpdateMedicines}
           />
        )}

        {currentView === ViewState.DOCTOR_FEES && (
           <DoctorFeeManager
             transactions={transactions}
             staffList={staffList}
           />
        )}
        
        {currentView === ViewState.AI_CONSULT && <AIAssistant />}
        
        {currentView === ViewState.SETTINGS && (
           <SettingsManager 
             staffList={staffList}
             onUpdateStaff={handleUpdateStaff}
             services={clinicServices}
             onUpdateServices={handleUpdateServices}
           />
        )}
      </main>
    </div>
  );
};

export default App;