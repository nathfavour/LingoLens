import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AccentAnalysis {
  primaryAccent: string;
  detectedDialects: string[];
  confidence: number;
  characteristics: string[];
  linguisticMarkers: {
    phonology: string;
    prosody: string;
    syntax: string;
  };
  detailedExplanation: string;
}

export async function analyzeAccent(audioBase64: string, mimeType: string): Promise<AccentAnalysis> {
  const model = "gemini-3-flash-preview";

  const prompt = `Analyze the provided audio recording and identify the speaker's accent(s) or dialects. 
  Focus on high accuracy. Provide a detailed breakdown of:
  1. The primary accent detected.
  2. Any specific regional dialects or sub-dialects.
  3. A confidence score for your analysis.
  4. Specific linguistic markers (phonology, prosody, syntax cues).
  5. A detailed explanation of why you reached these conclusions.
  
  Return the result in JSON format adhering strictly to this schema:
  {
    "primaryAccent": string,
    "detectedDialects": string[],
    "confidence": number (0-1),
    "characteristics": string[],
    "linguisticMarkers": {
      "phonology": string,
      "prosody": string,
      "syntax": string
    },
    "detailedExplanation": string
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryAccent: { type: Type.STRING },
            detectedDialects: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
            characteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
            linguisticMarkers: {
              type: Type.OBJECT,
              properties: {
                phonology: { type: Type.STRING },
                prosody: { type: Type.STRING },
                syntax: { type: Type.STRING }
              },
              required: ["phonology", "prosody", "syntax"]
            },
            detailedExplanation: { type: Type.STRING }
          },
          required: ["primaryAccent", "detectedDialects", "confidence", "characteristics", "linguisticMarkers", "detailedExplanation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    return JSON.parse(resultText) as AccentAnalysis;
  } catch (error) {
    console.error("Accent Analysis Error:", error);
    throw error;
  }
}
