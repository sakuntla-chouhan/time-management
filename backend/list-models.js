import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1beta' });

async function run() {
  try {
    const modelName = 'gemma-3-27b-it';
    console.log(`Testing ${modelName}...`);
    const result = await ai.models.generateContent({
      model: modelName,
      contents: "Respond with 'Connected'"
    });
    console.log(`Success:`, result.text);
  } catch (e) {
    console.log(`Error:`, e.message);
  }
}

run();
