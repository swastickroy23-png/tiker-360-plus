import { GoogleGenAI } from "@google/genai";
import { SWING_ARM_SYSTEM_PROMPT } from "./prompt";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeSymbol(symbol: string, context: string = ""): Promise<string> {
  try {
    const prompt = `Analyze the following symbol/asset: ${symbol}\n\nAdditional Context/Data:\n${context}\n\nPlease provide the analysis following the TIKER 360 PLUS format.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SWING_ARM_SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for more analytical/rule-based output
      },
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    throw new Error("Failed to generate analysis. Please try again.");
  }
}
