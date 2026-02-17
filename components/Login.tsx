import React, { useState } from 'react';
import { Stethoscope, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Staff } from '../types';

interface LoginProps {
  staffList: Staff[];
  onLogin: (user: Staff) => void;
}

const Login: React.FC<LoginProps> = ({ staffList, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Simple authentication logic for demo
      // In a real app, this would verify password hash with backend
      const user = staffList.find(s => s.email === email && s.status === 'Active');

      if (user) {
        if (password === '1234') { // Default password for demo
            onLogin(user);
        } else {
            setError('รหัสผ่านไม่ถูกต้อง (Demo: ใช้ 1234)');
            setIsLoading(false);
        }
      } else {
        setError('ไม่พบผู้ใช้งาน หรือบัญชีถูกระงับ');
        setIsLoading(false);
      }
    }, 800);
  };

  // Pre-fill helper for demo purposes
  const fillDemoUser = (role: string) => {
    const demoUser = staffList.find(s => s.role === role);
    if (demoUser) {
        setEmail(demoUser.email);
        setPassword('1234');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[600px] animate-fade-in">
        
        {/* Left Side - Brand & Info */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-teal-800 text-white p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-wide">ClinicCare AI</h1>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              ระบบบริหารจัดการ<br/>คลินิกยุคใหม่
            </h2>
            <p className="text-teal-100 text-lg font-light">
              เชื่อมต่อการรักษา ดูแลผู้ป่วยอย่างมีประสิทธิภาพ ด้วยเทคโนโลยี AI อัจฉริยะ
            </p>
          </div>
          
          <div className="relative z-10 text-sm text-teal-300">
            © 2024 ClinicCare Systems. All rights reserved.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">ยินดีต้อนรับกลับมา</h2>
            <p className="text-slate-500">กรุณาเข้าสู่ระบบเพื่อเริ่มการทำงาน</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">อีเมล / ชื่อผู้ใช้งาน</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                  placeholder="name@clinic.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-shake">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-all shadow-md shadow-teal-200 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login for Demo */}
          <div className="mt-8 pt-6 border-t border-slate-100">
             <p className="text-xs text-center text-slate-400 mb-3">Quick Login (Demo Mode)</p>
             <div className="flex justify-center gap-2">
                <button onClick={() => fillDemoUser('Doctor')} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">หมอ</button>
                <button onClick={() => fillDemoUser('Nurse')} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">พยาบาล</button>
                <button onClick={() => fillDemoUser('Admin')} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">Admin</button>
             </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
            animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default Login;
