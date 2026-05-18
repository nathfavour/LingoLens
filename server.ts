import express from "express";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/api/live" });

const PORT = 3000;
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: "50mb" }));

// Existing Gemini Logic Proxies
app.post("/api/analyze-accent", async (req, res) => {
  const { audioBase64, mimeType } = req.body;
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
          parts: [{ text: prompt }, { inlineData: { data: audioBase64, mimeType } }]
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

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/training-feedback", async (req, res) => {
  const { audioBase64, mimeType, targetPhrase, targetAccent } = req.body;
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this audio recording of someone attempting to speak with a ${targetAccent} accent. 
  The speaker is trying to say: "${targetPhrase}".
  Return JSON with score (0-100), feedback, accuracyBreakdown (vowels, consonants, intonation), and tips.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [{ text: prompt }, { inlineData: { data: audioBase64, mimeType } }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            accuracyBreakdown: {
              type: Type.OBJECT,
              properties: {
                vowels: { type: Type.NUMBER },
                consonants: { type: Type.NUMBER },
                intonation: { type: Type.NUMBER }
              },
              required: ["vowels", "consonants", "intonation"]
            },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "feedback", "accuracyBreakdown", "tips"]
        }
      }
    });
    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-sentence", async (req, res) => {
  const { complexity } = req.body;
  const model = "gemini-3-flash-preview";
  const prompt = `Generate a single ${complexity} for accent training. 
  If word, pick a phonetically challenging word. 
  If sentence, make it 5-10 words. 
  If paragraph, make it 2-3 short sentences. 
  Return ONLY the text, no quotes or explanations.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }]
    });
    res.json({ sentence: response.text!.trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pronunciation-feedback", async (req, res) => {
  const { audioBase64, mimeType, targetText } = req.body;
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze the user's pronunciation of: "${targetText}"
  Compare against a standard General American accent.
  Provide word-level feedback in JSON format.
  Ensure ALL words from the target text are included in the 'words' array in correct order.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [{ text: prompt }, { inlineData: { data: audioBase64, mimeType } }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  tip: { type: Type.STRING }
                },
                required: ["word", "score"]
              }
            },
            generalAdvice: { type: Type.STRING }
          },
          required: ["overallScore", "words", "generalAdvice"]
        }
      }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error("Pronunciation Feedback Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Live API WebSocket Bridge
wss.on("connection", async (clientWs) => {
  let session: any = null;

  clientWs.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "setup") {
        const { persona, instruction } = msg;
        session = await ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              // Handle audio
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ type: "audio", data: audio }));
              }

              // Handle model turn completion for stats
              if (message.serverContent?.modelTurn) {
                 clientWs.send(JSON.stringify({ type: "turn_complete" }));
              }

              // Handle interruptions
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: "interrupted" }));
              }

              // Handle function calls (accent score reporting)
              const toolCalls = message.toolCall?.functionCalls;
              if (toolCalls) {
                for (const call of toolCalls) {
                  if (call.name === "report_accent_score") {
                    clientWs.send(JSON.stringify({ type: "score_update", ...call.args }));
                    session.sendToolResponse({
                      functionResponses: [{
                        name: "report_accent_score",
                        id: call.id,
                        response: { status: "received" }
                      }]
                    });
                  }
                }
              }

              // Handle transcription
              const transcription = message.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
              if (transcription) {
                 clientWs.send(JSON.stringify({ type: "text", data: transcription }));
              }
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: persona || "Zephyr" } },
            },
            systemInstruction: instruction,
            tools: [{
              functionDeclarations: [{
                name: "report_accent_score",
                description: "Updates the live accent score based on the user's recent speech.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER, description: "Accuracy score 0-100" },
                    notes: { type: Type.STRING, description: "Brief phonetic feedback" }
                  },
                  required: ["score"]
                }
              }]
            }]
          },
        });
        clientWs.send(JSON.stringify({ type: "ready" }));
      } else if (msg.type === "audio" && session) {
        session.sendRealtimeInput({
          audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
        });
      }
    } catch (err) {
      console.error("WS Error:", err);
    }
  });

  clientWs.on("close", () => {
    if (session) session.close();
  });
});

// Vite & Static
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
