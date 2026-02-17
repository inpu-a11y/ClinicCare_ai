
export interface Patient {
  id: string; // HN
  idCardNumber?: string; // 13-digit ID
  name: string;
  dob?: string; // Date of Birth YYYY-MM-DD
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType?: 'A' | 'B' | 'AB' | 'O' | '-';
  phone: string;
  address?: string;
  lastVisit: string;
  allergies: string[];
  history: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string; // Selected Doctor ID
  doctorName?: string;
  roomId?: string; // Exam Room
  date: string;
  time: string;
  reason: string;
  status: 'Pending' | 'Confirmed' | 'Waiting' | 'Completed' | 'Cancelled'; // Added 'Waiting' (Screened, waiting for doctor)
  paymentStatus?: 'Pending' | 'Paid';
  type: 'Onsite' | 'Telemed'; // New: Distinguish appointment type
  telemedLink?: string; // New: Link for video call
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  APPOINTMENTS = 'APPOINTMENTS',
  SCREENING = 'SCREENING', // New View
  OPD = 'OPD',
  TELEMEDICINE = 'TELEMEDICINE', // New View
  CASHIER = 'CASHIER',
  INVENTORY = 'INVENTORY',
  AI_CONSULT = 'AI_CONSULT',
  SETTINGS = 'SETTINGS',
  DOCTOR_FEES = 'DOCTOR_FEES'
}

export interface AIGeneratedSoap {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export type UserRole = 'Doctor' | 'Nurse' | 'Admin' | 'Receptionist';

export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  licenseNumber?: string; // For doctors
}

export interface ClinicService {
  id: string;
  name: string;
  price: number;
  doctorFee?: number;
}

export interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number; // Selling Price
  cost?: number; // Cost Price
  stock: number;
  unit: string;
  minStock?: number; // Reorder point
  category?: string; // Pill, Injection, Supply, etc.
  expiryDate?: string;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  amount: number;
  unit: string;
  dosage: string; // e.g., "1 tablet after meal"
  price: number;
}

export interface VitalSigns {
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  oxygenSat?: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO Date
  time: string;
  chiefComplaint: string; // CC
  vitalSigns: VitalSigns;
  soap: AIGeneratedSoap;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  totalCost: number;
}

export interface Transaction {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  date: string;
  time: string;
  items: {
    description: string;
    amount: number;
    price: number;
    doctorFee?: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Transfer' | 'CreditCard';
  status: 'Paid' | 'Void';
}
