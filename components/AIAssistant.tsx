import React, { useState } from 'react';
import { Sparkles, ArrowRight, FileText, Activity, Copy, Check } from 'lucide-react';
import { generateSoapNote, askMedicalAssistant } from '../services/geminiService';
import { AIGeneratedSoap } from '../types';

enum AIMode {
  SOAP_NOTE = 'SOAP_NOTE',
  Q_AND_A = 'Q_AND_A'
}

const AIAssistant: React.FC = () => {
  const [mode, setMode] = useState<AIMode>(AIMode.SOAP_NOTE);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soapResult, setSoapResult] = useState<AIGeneratedSoap | null>(null);
  const [qaResult, setQaResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setSoapResult(null);
    setQaResult('');

    try {
      if (mode === AIMode.SOAP_NOTE) {
        const result = await generateSoapNote(inputText);
        setSoapResult(result);
      } else {
        const result = await askMedicalAssistant(inputText);
        setQaResult(result);
      }
    } catch (error) {
      console.error(error);
      setQaResult("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Sparkles className="text-teal-500" />
          ผู้ช่วยอัจฉริยะ (AI Assistant)
        </h2>
        <p className="text-slate-500 mt-2">
          ใช้ AI ช่วยสรุปบันทึกทางการแพทย์ หรือค้นหาข้อมูลยาและอาการ
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
          <button
            onClick={() => setMode(AIMode.SOAP_NOTE)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === AIMode.SOAP_NOTE
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              สรุป SOAP Note
            </div>
          </button>
          <button
            onClick={() => setMode(AIMode.Q_AND_A)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === AIMode.Q_AND_A
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              ถาม-ตอบ ทางการแพทย์
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {mode === AIMode.SOAP_NOTE 
              ? 'บันทึกอาการเบื้องต้น (Raw Notes)' 
              : 'คำถาม หรือ อาการที่ต้องการตรวจสอบ'}
          </label>
          <textarea
            className="flex-1 w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none bg-slate-50 text-slate-800"
            placeholder={
              mode === AIMode.SOAP_NOTE 
                ? "ตัวอย่าง: ผู้ป่วยชาย 45 ปี มีไข้สูง 38.5 องศา มา 2 วัน เจ็บคอ กลืนน้ำลายลำบาก ตรวจร่างกายพบคอแดง ต่อมทอนซิลโต..."
                : "ตัวอย่าง: ยา Amoxicillin มีข้อควรระวังอะไรบ้างในผู้ป่วยโรคไต?"
            }
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText}
            className="mt-4 w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                กำลังประมวลผล...
              </>
            ) : (
              <>
                เริ่มวิเคราะห์ <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">ผลลัพธ์จาก AI</h3>
            {(soapResult || qaResult) && (
              <button 
                onClick={() => handleCopy(mode === AIMode.SOAP_NOTE ? JSON.stringify(soapResult, null, 2) : qaResult)}
                className="text-slate-400 hover:text-teal-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
          </div>

          {!soapResult && !qaResult && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <Sparkles className="w-12 h-12 mb-3" />
              <p>ผลลัพธ์จะแสดงที่นี่</p>
            </div>
          )}
          
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
               <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 animate-[loading_1s_ease-in-out_infinite]" style={{width: '30%'}}></div>
               </div>
               <p className="text-sm text-slate-500">AI กำลังวิเคราะห์ข้อมูล...</p>
            </div>
          )}

          {mode === AIMode.SOAP_NOTE && soapResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Subjective (S)</span>
                <p className="text-slate-700 mt-1 text-sm">{soapResult.subjective}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Objective (O)</span>
                <p className="text-slate-700 mt-1 text-sm">{soapResult.objective}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Assessment (A)</span>
                <p className="text-slate-700 mt-1 text-sm">{soapResult.assessment}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Plan (P)</span>
                <p className="text-slate-700 mt-1 text-sm">{soapResult.plan}</p>
              </div>
            </div>
          )}

          {mode === AIMode.Q_AND_A && qaResult && (
            <div className="prose prose-slate prose-sm max-w-none animate-fade-in bg-slate-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{qaResult}</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;