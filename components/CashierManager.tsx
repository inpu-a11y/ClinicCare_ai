import React, { useState, useEffect } from 'react';
import { 
  Wallet, Search, CreditCard, Banknote, QrCode, Printer, CheckCircle, 
  Clock, FileText, ChevronRight, Calculator, X, History, Plus, Trash2, Edit3, Download
} from 'lucide-react';
import { Appointment, MedicalRecord, Transaction, Patient, ClinicService } from '../types';

interface CashierManagerProps {
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  patients: Patient[];
  transactions: Transaction[];
  onProcessPayment: (transaction: Transaction, appointmentId: string) => void;
  services: ClinicService[]; // Added services prop
}

interface BillItem {
  description: string;
  amount: number;
  price: number;
  doctorFee?: number; // Added DF field
  total: number;
}

const CashierManager: React.FC<CashierManagerProps> = ({ 
  appointments, medicalRecords, patients, transactions, onProcessPayment, services
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'CreditCard'>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [justCompletedTransaction, setJustCompletedTransaction] = useState<Transaction | null>(null);

  // Dynamic Bill State
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<BillItem>>({ description: '', amount: 1, price: 0, doctorFee: 0 });

  // Derived Data
  const pendingAppointments = appointments.filter(
    app => app.status === 'Completed' && app.paymentStatus !== 'Paid'
  );

  const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId);
  const selectedRecord = selectedAppointment 
    ? medicalRecords.find(r => r.patientId === selectedAppointment.patientId && r.date === selectedAppointment.date)
    : null;
  const selectedPatient = selectedAppointment
    ? patients.find(p => p.id === selectedAppointment.patientId)
    : null;

  // Initialize Bill Items when appointment is selected
  useEffect(() => {
    if (selectedAppointmentId && selectedRecord) {
       const initialItems: BillItem[] = [];
       
       // 1. Doctor Fee (Standard)
       const docFeeService = services.find(s => s.name.includes('Doctor Fee')) || { name: 'ค่าบริการทางการแพทย์ (Doctor Fee)', price: 300, doctorFee: 300 };
       initialItems.push({
         description: docFeeService.name,
         amount: 1,
         price: docFeeService.price,
         doctorFee: docFeeService.doctorFee || docFeeService.price, // Default assumption
         total: docFeeService.price
       });

       // 2. Medicines from Prescription
       selectedRecord.prescriptions.forEach(p => {
         initialItems.push({
           description: `${p.medicineName}`,
           amount: p.amount,
           price: p.price,
           doctorFee: 0, // Medicines usually have no doctor fee
           total: p.amount * p.price
         });
       });

       setBillItems(initialItems);
       setDiscount(0);
       setCashReceived('');
    } else {
       setBillItems([]);
    }
  }, [selectedAppointmentId, selectedRecord, services]);

  // Handle service selection from datalist
  const handleServiceSelect = (name: string) => {
      const selectedService = services.find(s => s.name === name);
      if (selectedService) {
          setNewItem({ 
              ...newItem, 
              description: selectedService.name, 
              price: selectedService.price,
              doctorFee: selectedService.doctorFee || 0 
          });
      } else {
          setNewItem({ ...newItem, description: name, doctorFee: 0 });
      }
  };

  // Bill Item Handlers
  const handleAddItem = () => {
    if (!newItem.description || (newItem.price || 0) < 0) return;
    const amount = newItem.amount || 1;
    const price = newItem.price || 0;
    
    setBillItems([...billItems, { 
        description: newItem.description!, 
        amount: amount, 
        price: price, 
        doctorFee: newItem.doctorFee || 0,
        total: amount * price 
    }]);
    
    // Reset form
    setNewItem({ description: '', amount: 1, price: 0, doctorFee: 0 });
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...billItems];
    updated.splice(index, 1);
    setBillItems(updated);
  };

  const handleUpdateItem = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...billItems];
    const item = { ...updated[index], [field]: value };
    item.total = item.amount * item.price; // Recalculate total
    updated[index] = item;
    setBillItems(updated);
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const change = paymentMethod === 'Cash' ? Math.max(0, Number(cashReceived) - grandTotal) : 0;

  const handleConfirmPayment = () => {
    if (!selectedAppointment || !selectedPatient) return;
    if (paymentMethod === 'Cash' && Number(cashReceived) < grandTotal) {
        alert('จำนวนเงินที่รับมาไม่เพียงพอ');
        return;
    }

    const transaction: Transaction = {
        id: `INV-${Date.now()}`,
        appointmentId: selectedAppointment.id,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        doctorId: selectedAppointment.doctorId, // Store Doctor ID
        doctorName: selectedAppointment.doctorName,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        items: billItems,
        subtotal,
        discount,
        grandTotal,
        paymentMethod,
        status: 'Paid'
    };

    onProcessPayment(transaction, selectedAppointment.id);
    setJustCompletedTransaction(transaction);
    setIsReceiptModalOpen(true);
    setSelectedAppointmentId(null);
    setCashReceived('');
    setDiscount(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Left Panel: Queue List */}
      <div className="w-1/3 min-w-[300px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
         <div className="p-4 border-b border-slate-100 bg-teal-800 text-white rounded-t-xl">
             <h2 className="text-lg font-bold flex items-center gap-2">
                 <Wallet className="w-5 h-5" /> การเงิน (Cashier)
             </h2>
         </div>
         
         {/* Tabs */}
         <div className="flex border-b border-slate-100">
             <button 
                onClick={() => setActiveTab('PENDING')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'PENDING' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                รอชำระ ({pendingAppointments.length})
             </button>
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                ประวัติ ({transactions.length})
             </button>
         </div>

         {/* List */}
         <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
             {activeTab === 'PENDING' ? (
                 pendingAppointments.length > 0 ? (
                     pendingAppointments.map(app => (
                         <div 
                            key={app.id}
                            onClick={() => {
                                setSelectedAppointmentId(app.id);
                                setSelectedTransaction(null);
                            }}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                selectedAppointmentId === app.id 
                                ? 'border-teal-500 bg-white shadow-md ring-1 ring-teal-200' 
                                : 'border-slate-200 bg-white hover:border-teal-300'
                            }`}
                         >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-800">{app.patientName}</h3>
                                    <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                        <span className="bg-slate-100 px-1 rounded">HN: {app.patientId}</span>
                                        <span>{app.time}</span>
                                    </div>
                                    <div className="text-xs text-teal-600 mt-1">{app.doctorName}</div>
                                </div>
                                <div className="text-right">
                                     <div className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">รอชำระ</div>
                                </div>
                            </div>
                         </div>
                     ))
                 ) : (
                     <div className="text-center text-slate-400 py-10">
                         <Clock className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                         ไม่มีรายการรอชำระ
                     </div>
                 )
             ) : (
                 transactions.map(tx => (
                     <div 
                        key={tx.id}
                        onClick={() => {
                            setSelectedTransaction(tx);
                            setSelectedAppointmentId(null);
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedTransaction?.id === tx.id 
                            ? 'border-teal-500 bg-white shadow-md ring-1 ring-teal-200' 
                            : 'border-slate-200 bg-white hover:border-teal-300'
                        }`}
                     >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800">{tx.patientName}</h3>
                                <div className="text-xs text-slate-500 mt-1">
                                    {tx.id} | {new Date(tx.date).toLocaleDateString('th-TH')}
                                </div>
                            </div>
                            <div className="text-right">
                                 <div className="font-bold text-teal-700">฿{tx.grandTotal.toLocaleString()}</div>
                                 <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
                            </div>
                        </div>
                     </div>
                 ))
             )}
         </div>
      </div>

      {/* Right Panel: Detail & Payment */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
         {selectedAppointment && selectedPatient ? (
             <div className="h-full flex flex-col">
                 <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                     <div>
                         <h2 className="text-xl font-bold text-slate-800">สรุปรายการค่ารักษา</h2>
                         <p className="text-slate-500 text-sm">ใบแจ้งหนี้ชั่วคราว (Proforma Invoice)</p>
                     </div>
                     <div className="text-right">
                         <div className="text-sm text-slate-500">HN: {selectedPatient.id}</div>
                         <div className="font-bold text-lg text-slate-800">{selectedPatient.name}</div>
                     </div>
                 </div>

                 {/* Bill Table & Editing */}
                 <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                     <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-500 uppercase tracking-wide border-b border-slate-200">
                                    <th className="p-3 w-[50%]">รายการ (Description)</th>
                                    <th className="p-3 text-center w-[15%]">จำนวน</th>
                                    <th className="p-3 text-right w-[15%]">ราคา/หน่วย</th>
                                    <th className="p-3 text-right w-[15%]">รวม</th>
                                    <th className="p-3 w-[5%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {billItems.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">ยังไม่มีรายการค่าใช้จ่าย</td></tr>
                                ) : (
                                    billItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 group">
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700 font-medium placeholder-slate-400"
                                                />
                                                {item.doctorFee ? (
                                                    <div className="text-[10px] text-blue-500">DF: {item.doctorFee}</div>
                                                ) : null}
                                            </td>
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="number" min="1"
                                                    value={item.amount}
                                                    onChange={(e) => handleUpdateItem(idx, 'amount', Number(e.target.value))}
                                                    className="w-16 text-center bg-slate-50 border border-slate-200 rounded p-1 text-slate-600 focus:outline-none focus:border-teal-500"
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                <input 
                                                    type="number" min="0"
                                                    value={item.price}
                                                    onChange={(e) => handleUpdateItem(idx, 'price', Number(e.target.value))}
                                                    className="w-20 text-right bg-slate-50 border border-slate-200 rounded p-1 text-slate-600 focus:outline-none focus:border-teal-500"
                                                />
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-800">
                                                {item.total.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                     </div>

                     {/* Add New Item Row */}
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed flex items-center gap-3">
                         <div className="flex-1 relative group">
                             <input 
                                list="clinic-services"
                                type="text" 
                                placeholder="เพิ่มรายการใหม่... (เลือกจากรายการ หรือพิมพ์ใหม่)"
                                value={newItem.description}
                                onChange={(e) => handleServiceSelect(e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                             />
                             <datalist id="clinic-services">
                                 {services.map(s => (
                                     <option key={s.id} value={s.name}>{s.name} - {s.price}฿ (DF: {s.doctorFee || 0})</option>
                                 ))}
                             </datalist>
                         </div>
                         <div className="w-20">
                             <input 
                                type="number" placeholder="จำนวน" min="1"
                                value={newItem.amount}
                                onChange={(e) => setNewItem({...newItem, amount: Number(e.target.value)})}
                                className="w-full p-2 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                             />
                         </div>
                         <div className="w-24">
                             <input 
                                type="number" placeholder="ราคา" min="0"
                                value={newItem.price}
                                onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                                className="w-full p-2 text-sm text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                             />
                         </div>
                         <button 
                            onClick={handleAddItem}
                            disabled={!newItem.description}
                            className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                         >
                             <Plus className="w-4 h-4" />
                         </button>
                     </div>
                 </div>

                 {/* Footer Payment Section */}
                 <div className="bg-white p-6 border-t border-slate-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-10">
                     <div className="flex flex-col md:flex-row gap-8">
                         {/* Payment Method */}
                         <div className="flex-1 space-y-4">
                             <h4 className="font-bold text-slate-700">วิธีการชำระเงิน</h4>
                             <div className="grid grid-cols-3 gap-3">
                                 <button 
                                    onClick={() => setPaymentMethod('Cash')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                 >
                                     <Banknote className="w-6 h-6"/>
                                     <span className="text-xs font-bold">เงินสด</span>
                                 </button>
                                 <button 
                                    onClick={() => setPaymentMethod('Transfer')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Transfer' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                 >
                                     <QrCode className="w-6 h-6"/>
                                     <span className="text-xs font-bold">โอน/QR</span>
                                 </button>
                                 <button 
                                    onClick={() => setPaymentMethod('CreditCard')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CreditCard' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                 >
                                     <CreditCard className="w-6 h-6"/>
                                     <span className="text-xs font-bold">บัตรเครดิต</span>
                                 </button>
                             </div>

                             {paymentMethod === 'Cash' && (
                                 <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                     <label className="text-xs text-slate-500 block mb-1">รับเงินมา (บาท)</label>
                                     <input 
                                        type="number" 
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        className="w-full text-right p-2 border-b-2 border-slate-200 focus:border-teal-500 outline-none text-xl font-bold font-mono bg-transparent"
                                        placeholder="0.00"
                                     />
                                     <div className="flex justify-between mt-2 text-sm">
                                         <span className="text-slate-500">เงินทอน:</span>
                                         <span className={`font-bold font-mono ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                             ฿{change.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                         </span>
                                     </div>
                                 </div>
                             )}
                         </div>

                         {/* Summary */}
                         <div className="w-full md:w-1/3 space-y-2">
                             <div className="flex justify-between text-slate-600">
                                 <span>รวมเป็นเงิน</span>
                                 <span>{subtotal.toLocaleString()} บาท</span>
                             </div>
                             <div className="flex justify-between items-center text-slate-600">
                                 <span>ส่วนลด</span>
                                 <div className="flex items-center gap-1">
                                     <input 
                                        type="number" 
                                        value={discount} 
                                        onChange={e => setDiscount(Number(e.target.value))}
                                        className="w-24 text-right p-1 border border-slate-300 rounded text-sm outline-none focus:border-teal-500"
                                     />
                                     <span>บาท</span>
                                 </div>
                             </div>
                             <div className="flex justify-between text-2xl font-bold text-teal-800 pt-4 border-t border-slate-200 mt-2">
                                 <span>ยอดสุทธิ</span>
                                 <span>฿{grandTotal.toLocaleString()}</span>
                             </div>

                             <button 
                                onClick={handleConfirmPayment}
                                className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                             >
                                 <CheckCircle className="w-5 h-5" /> ยืนยันการชำระเงิน
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
         ) : selectedTransaction ? (
             // Transaction History View
             <div className="h-full flex flex-col p-8 items-center justify-center bg-slate-50">
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-lg w-full">
                     <div className="text-center mb-6">
                         <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                             <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                         <h2 className="text-2xl font-bold text-slate-800">ชำระเงินเสร็จสิ้น</h2>
                         <p className="text-slate-500">INV: {selectedTransaction.id}</p>
                     </div>
                     <div className="space-y-4 border-t border-b border-slate-100 py-6 mb-6">
                         <div className="flex justify-between">
                             <span className="text-slate-500">วันที่ชำระ</span>
                             <span className="font-medium">{new Date(selectedTransaction.date).toLocaleDateString('th-TH')} {selectedTransaction.time}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-500">ผู้ป่วย</span>
                             <span className="font-medium">{selectedTransaction.patientName}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-500">วิธีการชำระ</span>
                             <span className="font-medium">{selectedTransaction.paymentMethod}</span>
                         </div>
                         <div className="flex justify-between text-lg font-bold text-teal-800 pt-2 border-t border-slate-100">
                             <span>ยอดสุทธิ</span>
                             <span>฿{selectedTransaction.grandTotal.toLocaleString()}</span>
                         </div>
                     </div>
                     <div className="flex gap-3">
                         <button 
                            onClick={() => {
                                setJustCompletedTransaction(selectedTransaction);
                                setIsReceiptModalOpen(true);
                            }}
                            className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex justify-center items-center gap-2"
                         >
                             <Printer className="w-4 h-4"/> พิมพ์ / PDF
                         </button>
                         <button 
                            onClick={() => setSelectedTransaction(null)}
                            className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                         >
                             กลับ
                         </button>
                     </div>
                 </div>
             </div>
         ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
                 <Calculator className="w-20 h-20 mb-4 opacity-50" />
                 <h3 className="text-xl font-bold text-slate-400">ระบบการเงิน</h3>
                 <p className="text-sm">เลือกรายการทางด้านซ้ายเพื่อดำเนินการ</p>
             </div>
         )}
      </div>

      {/* Receipt Modal (A4 Size) */}
      {(isReceiptModalOpen && justCompletedTransaction) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col h-[90vh]">
                  <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print">
                      <h3 className="font-bold flex items-center gap-2"><Printer className="w-5 h-5"/> ตัวอย่างใบเสร็จ (A4)</h3>
                      <button onClick={() => setIsReceiptModalOpen(false)}><X className="w-5 h-5"/></button>
                  </div>
                  
                  {/* Preview Container with Scroll */}
                  <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center relative">
                      {/* A4 Content Wrapper */}
                      <div id="receipt-content" className="bg-white shadow-lg text-black w-[210mm] min-h-[297mm] p-[20mm] relative box-border mx-auto">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-8">
                             <div>
                                 <h2 className="text-3xl font-bold text-teal-900">ClinicCare</h2>
                                 <p className="text-sm text-gray-500 mt-2">123 ถนนสุขุมวิท เขตคลองเตย<br/>กรุงเทพฯ 10110</p>
                                 <p className="text-sm text-gray-500">โทร: 02-123-4567</p>
                             </div>
                             <div className="text-right">
                                 <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-800 mb-2">ใบเสร็จรับเงิน</h1>
                                 <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-4">Receipt / Tax Invoice</h2>
                                 <div className="text-sm">
                                    <div className="flex justify-between gap-4 mb-1">
                                        <span className="font-bold text-gray-600">เลขที่:</span>
                                        <span>{justCompletedTransaction.id}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="font-bold text-gray-600">วันที่:</span>
                                        <span>{new Date(justCompletedTransaction.date).toLocaleDateString('th-TH')} {justCompletedTransaction.time}</span>
                                    </div>
                                 </div>
                             </div>
                          </div>
                          
                          {/* Customer Info */}
                          <div className="border-t-2 border-b-2 border-gray-100 py-4 mb-8">
                             <div className="grid grid-cols-2 gap-8">
                                 <div>
                                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">ผู้รับบริการ (Bill To)</span>
                                     <p className="font-bold text-lg">{justCompletedTransaction.patientName}</p>
                                     <p className="text-sm text-gray-500">HN: {justCompletedTransaction.patientId}</p>
                                 </div>
                                 <div className="text-right">
                                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">วิธีการชำระเงิน (Payment Method)</span>
                                     <p className="font-bold text-lg">{justCompletedTransaction.paymentMethod}</p>
                                 </div>
                             </div>
                          </div>

                          {/* Items Table */}
                          <table className="w-full mb-8">
                             <thead>
                                 <tr className="border-b-2 border-teal-600 text-teal-800">
                                     <th className="py-3 text-left w-1/2">รายการ (Description)</th>
                                     <th className="py-3 text-center">จำนวน</th>
                                     <th className="py-3 text-right">ราคาต่อหน่วย</th>
                                     <th className="py-3 text-right">จำนวนเงิน</th>
                                 </tr>
                             </thead>
                             <tbody className="text-sm text-gray-700">
                                  {justCompletedTransaction.items.map((item, i) => (
                                      <tr key={i} className="border-b border-gray-100">
                                          <td className="py-4">{item.description}</td>
                                          <td className="py-4 text-center">{item.amount}</td>
                                          <td className="py-4 text-right">{item.price.toLocaleString()}</td>
                                          <td className="py-4 text-right font-medium">{item.total.toLocaleString()}</td>
                                      </tr>
                                  ))}
                             </tbody>
                          </table>

                          {/* Summary */}
                          <div className="flex justify-end mb-12">
                              <div className="w-1/2">
                                  <div className="flex justify-between py-2 border-b border-gray-100">
                                      <span className="text-gray-600">รวมเป็นเงิน (Subtotal)</span>
                                      <span className="font-medium">{justCompletedTransaction.subtotal.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between py-2 border-b border-gray-100">
                                      <span className="text-gray-600">ส่วนลด (Discount)</span>
                                      <span className="text-red-500">- {justCompletedTransaction.discount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between py-4 text-xl font-bold text-teal-900">
                                      <span>ยอดสุทธิ (Grand Total)</span>
                                      <span>฿{justCompletedTransaction.grandTotal.toLocaleString()}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Footer / Signatures */}
                          <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] text-center">
                             <div className="flex justify-between items-end mb-8 px-12">
                                  <div className="text-center">
                                      <div className="w-40 border-b border-gray-300 mb-2"></div>
                                      <p className="text-xs text-gray-500">ผู้รับเงิน / Cashier</p>
                                  </div>
                                  <div className="text-center">
                                      <div className="w-40 border-b border-gray-300 mb-2"></div>
                                      <p className="text-xs text-gray-500">ผู้มีอำนาจลงนาม / Authorized Signature</p>
                                  </div>
                             </div>
                             <p className="text-xs text-gray-400">ขอบพระคุณที่ใช้บริการ / Thank you for your business</p>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 no-print">
                      <button onClick={handlePrint} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-black font-medium flex items-center gap-2">
                          <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
         @media print {
            @page {
                size: A4;
                margin: 0;
            }
            body {
                background: white;
            }
            body * {
                visibility: hidden;
            }
            .no-print {
                display: none !important;
            }
            /* Reset Modal Fixed Position for Print */
            .fixed {
                position: static !important;
                overflow: visible !important;
            }
            /* Show Receipt */
            #receipt-content {
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 20mm !important;
                box-shadow: none !important;
                overflow: visible !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            #receipt-content * {
                visibility: visible !important;
            }
            ::-webkit-scrollbar {
                display: none;
            }
         }
      `}</style>
    </div>
  );
};

export default CashierManager;