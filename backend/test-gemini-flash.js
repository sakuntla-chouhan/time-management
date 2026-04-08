import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const modelName = 'gemini-1.5-flash-latest';
    console.log("Testing " + modelName + "...");
    const result = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: "Respond with 'Flash Ready'" }] }],
    });
    console.log("Success:", result.text);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
