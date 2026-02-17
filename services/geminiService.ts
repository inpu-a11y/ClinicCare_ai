import { GoogleGenAI, Type } from "@google/genai";
import { AIGeneratedSoap } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to structure medical notes into SOAP format
export const generateSoapNote = async (rawNotes: string): Promise<AIGeneratedSoap | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert medical assistant. Convert the following unstructured doctor's notes into a structured SOAP (Subjective, Objective, Assessment, Plan) format. 
      
      Raw Notes: "${rawNotes}"
      
      Ensure the response is in Thai language where appropriate for the medical context in Thailand.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjective: { type: Type.STRING, description: "Patient's subjective complaints" },
            objective: { type: Type.STRING, description: "Objective findings, vitals, exam results" },
            assessment: { type: Type.STRING, description: "Diagnosis or potential conditions" },
            plan: { type: Type.STRING, description: "Treatment plan, prescriptions, follow-up" },
          },
          required: ["subjective", "objective", "assessment", "plan"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AIGeneratedSoap;
    }
    return null;
  } catch (error) {
    console.error("Error generating SOAP note:", error);
    throw error;
  }
};

// Helper to provide general medical information or terminology explanation
export const askMedicalAssistant = async (query: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful clinic assistant bot. Answer the following question for a doctor or nurse in Thai. Keep it professional, concise, and helpful. Question: "${query}"`,
    });
    return response.text || "ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
  }
};
