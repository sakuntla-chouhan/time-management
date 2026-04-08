import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const models = await ai.models.list();
    console.log(JSON.stringify(models, null, 2));
  } catch (e) {
    console.log('Error listing models:', e.message);
  }
}

run();
