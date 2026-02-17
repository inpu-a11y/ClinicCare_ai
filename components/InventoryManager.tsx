import React, { useState } from 'react';
import { 
  Package, Search, Plus, Edit2, Trash2, AlertTriangle, TrendingUp, 
  ArrowDownCircle, ArrowUpCircle, X, Save, Filter
} from 'lucide-react';
import { Medicine } from '../types';

interface InventoryManagerProps {
  medicines: Medicine[];
  onUpdateMedicines: (medicines: Medicine[]) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ medicines, onUpdateMedicines }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<{ id: string, amount: number, type: 'IN' | 'OUT' } | null>(null);

  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    unit: 'เม็ด',
    minStock: 10,
    category: 'ยาเม็ด'
  });

  // Calculate Stats
  const totalItems = medicines.length;
  const lowStockItems = medicines.filter(m => m.stock <= (m.minStock || 10)).length;
  const totalValue = medicines.reduce((acc, curr) => acc + (curr.stock * (curr.cost || 0)), 0);

  const categories = ['All', ...Array.from(new Set(medicines.map(m => m.category || 'General')))];

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenForm = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData(medicine);
    } else {
      setEditingMedicine(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        stock: 0,
        unit: 'เม็ด',
        minStock: 10,
        category: 'ยาเม็ด'
      });
    }
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการยานี้?')) {
      onUpdateMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMedicine) {
      // Update
      const updated = medicines.map(m => m.id === editingMedicine.id ? { ...m, ...formData } as Medicine : m);
      onUpdateMedicines(updated);
    } else {
      // Create
      const newMedicine: Medicine = {
        ...formData,
        id: `M${Date.now()}`,
      } as Medicine;
      onUpdateMedicines([...medicines, newMedicine]);
    }
    setIsFormOpen(false);
  };

  const handleOpenStockModal = (medicine: Medicine, type: 'IN' | 'OUT') => {
    setStockAdjustment({ id: medicine.id, amount: 1, type });
    setIsStockModalOpen(true);
  };

  const handleSaveStock = () => {
    if (!stockAdjustment) return;
    const target = medicines.find(m => m.id === stockAdjustment.id);
    if (!target) return;

    const newStock = stockAdjustment.type === 'IN' 
      ? target.stock + stockAdjustment.amount
      : Math.max(0, target.stock - stockAdjustment.amount);

    const updated = medicines.map(m => m.id === stockAdjustment.id ? { ...m, stock: newStock } : m);
    onUpdateMedicines(updated);
    setIsStockModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">คลังยาและเวชภัณฑ์</h2>
           <p className="text-slate-500 text-sm">จัดการทะเบียนยา สต็อกคงเหลือ และราคา</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายการใหม่</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500 mb-1">รายการยาทั้งหมด</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalItems}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Package className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500 mb-1">ต้องสั่งซื้อ (Low Stock)</p>
                <h3 className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockItems}</h3>
            </div>
            <div className={`p-3 rounded-lg ${lowStockItems > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500 mb-1">มูลค่าคลังยา (ทุน)</p>
                <h3 className="text-2xl font-bold text-slate-800">฿{totalValue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <TrendingUp className="w-6 h-6" />
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อยา, รหัสยา..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
        </div>
        <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white appearance-none"
            >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">ชื่อยา / รหัส</th>
                <th className="p-4 font-semibold">หมวดหมู่</th>
                <th className="p-4 font-semibold text-right">ราคาขาย</th>
                <th className="p-4 font-semibold text-center">คงเหลือ</th>
                <th className="p-4 font-semibold text-center">รับเข้า/จ่ายออก</th>
                <th className="p-4 font-semibold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((item) => {
                  const isLow = item.stock <= (item.minStock || 0);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4">
                        <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{item.id}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                            {item.category || 'General'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-teal-700">
                        ฿{item.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {item.stock} {item.unit}
                            {isLow && <AlertTriangle className="w-3 h-3 ml-1" />}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Min: {item.minStock || 0}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={() => handleOpenStockModal(item, 'IN')}
                               className="p-1 text-green-600 hover:bg-green-50 rounded" title="รับสินค้าเข้า"
                             >
                                 <ArrowUpCircle className="w-6 h-6" />
                             </button>
                             <button 
                               onClick={() => handleOpenStockModal(item, 'OUT')}
                               className="p-1 text-red-500 hover:bg-red-50 rounded" title="ตัดสต็อก/หมดอายุ"
                             >
                                 <ArrowDownCircle className="w-6 h-6" />
                             </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenForm(item)}
                            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-teal-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
              })}
              {filteredMedicines.length === 0 && (
                  <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">ไม่พบข้อมูล</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
               <h3 className="font-bold text-teal-800 flex items-center gap-2">
                 {editingMedicine ? 'แก้ไขข้อมูลยา' : 'เพิ่มยาใหม่'}
               </h3>
               <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500">
                  <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อยา <span className="text-red-500">*</span></label>
                   <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">สรรพคุณ / รายละเอียด</label>
                   <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                            <option value="ยาเม็ด">ยาเม็ด</option>
                            <option value="ยาน้ำ">ยาน้ำ</option>
                            <option value="ยาฉีด">ยาฉีด</option>
                            <option value="เวชภัณฑ์">เวชภัณฑ์</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หน่วยนับ</label>
                        <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ราคาขาย</label>
                        <input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: +e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ราคาทุน (Cost)</label>
                        <input type="number" min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: +e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">คงเหลือเริ่มต้น</label>
                        <input type="number" disabled={!!editingMedicine} min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: +e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">จุดสั่งซื้อ (Min Stock)</label>
                        <input type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: +e.target.value})} className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                    <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> บันทึก</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && stockAdjustment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className={`p-4 border-b flex justify-between items-center ${stockAdjustment.type === 'IN' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <h3 className="font-bold flex items-center gap-2">
                        {stockAdjustment.type === 'IN' ? <ArrowUpCircle className="w-5 h-5"/> : <ArrowDownCircle className="w-5 h-5"/>}
                        {stockAdjustment.type === 'IN' ? 'รับสินค้าเข้า' : 'ปรับลดสต็อก'}
                    </h3>
                    <button onClick={() => setIsStockModalOpen(false)}><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 mb-4 text-center">
                        กรุณาระบุจำนวนที่ต้องการ {stockAdjustment.type === 'IN' ? 'เพิ่ม' : 'ลด'}
                    </p>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <button onClick={() => setStockAdjustment({...stockAdjustment, amount: Math.max(1, stockAdjustment.amount - 1)})} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">-</button>
                        <input 
                          type="number" 
                          value={stockAdjustment.amount} 
                          onChange={(e) => setStockAdjustment({...stockAdjustment, amount: Math.max(1, +e.target.value)})}
                          className="w-24 text-center text-2xl font-bold border-b-2 border-slate-200 focus:border-teal-500 outline-none"
                        />
                        <button onClick={() => setStockAdjustment({...stockAdjustment, amount: stockAdjustment.amount + 1})} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">+</button>
                    </div>
                    <button 
                      onClick={handleSaveStock}
                      className={`w-full py-2 rounded-lg text-white font-medium ${stockAdjustment.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        ยืนยัน
                    </button>
                </div>
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

export default InventoryManager;