import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// ── ESM Helpers ────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'studycoach_super_secret_key_2024';

// ── Persistence Setup ──────────────────────────────────────────
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');

function loadData(file) {
  try {
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf8');
    return content ? JSON.parse(content) : [];
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
    return [];
  }
}

function saveData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${file}:`, err);
  }
}

let users = loadData(USERS_FILE);
let sessions = loadData(SESSIONS_FILE);

// ── Gemini Setup (New SDK) ────────────────────────────────────
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: 'v1beta'
});
const modelName = 'gemini-flash-latest'; // Robust model with available quota for JSON generation

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static frontend

// ── Robust JSON Parser ─────────────────────────────────────────
function robustJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("Standard JSON parse failed, attempting robust extraction...");
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON object found in response");
    let jsonStr = text.substring(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (e2) {
      console.log("Robust extraction failed, trying one more cleanup...");
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      return JSON.parse(jsonStr);
    }
  }
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Auth Routes ───────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'fields missing' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name, email, passwordHash, createdAt: new Date() };
  users.push(user);
  saveData(USERS_FILE, users);
  const token = jwt.sign({ id: user.id, name, email }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ success: true, token, user: { id: user.id, name, email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing fields' });
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid login' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid login' });
  const token = jwt.sign({ id: user.id, name: user.name, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, email } });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// ── AI Generation (Migrated to @google/genai) ───────────────────
app.post('/api/generate', async (req, res) => {
  const { topic, hours = 2, level = 'beginner' } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  let depthInstruction = "";
  if (level === "beginner") {
    depthInstruction = "The user is a COMPLETE BEGINNER. Keep explanations extremely simple, foundational, and beginner-friendly. Do not go too deep. Focus heavily on very basic understanding.";
  } else if (level === "basic") {
    depthInstruction = "The user KNOWS THE BASICS. Go a little deeper than basic level. Build upon foundational concepts, but do not make it overly advanced.";
  } else {
    depthInstruction = "The user is INTERMEDIATE. Go DEEP into the topic. Explain intricacies, core mechanics, different types, and advanced concepts thoroughly step-by-step.";
  }

  const prompt = `You are an intelligent Study Coach AI.
When a user provides a topic, analyze it and generate a deeply structured, comprehensive learning plan.

CRITICAL LEVEL INSTRUCTION: 
${depthInstruction}

REQUIREMENTS BY SECTION:
1. Prerequisites:
- "must": List ALL essential topics needed to understand this. Provide an explanation for each and describe exactly WHY it relates to the main topic. Keep descriptions rich.
- "helpful": List helpful but non-essential topics.

2. Timeplan:
Divide the topic into a time plan scaling to the user depth level instructed. Break it down so that the student learns step-by-step.

3. Concepts (Learn):
Teach the main concepts and core mechanics. Apply the strict depth instruction given above. Teach it effectively, smartly, and clearly.

4. Diagrams (Visualize):
Create a beautiful, large, ASCII art diagram. TRICK: Shape the ASCII diagram to resemble an animal (like a cat, dog, elephant, etc.) or a memorable object, so that the student easily remembers the concept.
CRITICAL JSON RULE for ASCII ART: You are FORBIDDEN from using backslashes (\\) anywhere in your drawing! Backslashes break the JSON parser. Use forward slashes (/), pipes (|), dashes (-), and parentheses to draw instead.

5. Q&A:
Generate EXACTLY 5 high-quality, tricky, and insightful multiple-choice questions.

6. Practice:
Generate EXACTLY 3 questions, with difficulties strictly as ["easy", "medium", "high"].

CRITICAL REQUIREMENT: YOU MUST PROVIDE REAL, SPECIFIC, AND ACTIONABLE EDUCATIONAL CONTENT SPECIFIC TO THE TOPIC. DO NOT use generic placeholders like "important terms", "understand basics", "practice daily", or "revise often". All arrays and objects must contain actual subject matter content, including specific formulas/code/concepts, actual pitfalls, and concrete time breakdown steps. 

Return ONLY RAW JSON (no markdown). Structure:
{
  "label": "string",
  "complexity": "string",
  "prereqs": {
    "must": [{"name": "topic name", "why": "deep explanation and why it is related"}],
    "optional": [{"name": "topic name", "why": "explanation"}]
  },
  "skipWarning": "string",
  "timeplan": [{"icon":"string","name":"string","pct":number,"desc": "specific deep actions"}],
  "concepts": [{"title":"string","simple":"string","deep":"string","analogy":"string","code":"string"}],
  "diagrams": [{"title":"string","type":"string","content":"massive animal shaped ascii art. DO NOT USE BACKSLASHES"}],
  "qa": [{"q":"string","options":["string"],"correct":number,"explain":"string"}],
  "practice": [{"diff":"easy|medium|high","q":"string","hint":"string","answer":"string"}],
  "cheatsheet": {
    "keyPoints": ["real facts"], 
    "formulas": [{"name": "formula/rule name", "f": "actual formula/rule text"}], 
    "mistakes": ["real pitfalls"]
  }
}

Topic: "${topic}", Hours: ${hours}, Level: ${level}`;

  try {
    console.log(`Generating with ${modelName}...`);
    const result = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const raw = result.text.trim();
    console.log("Parsing cleaned AI response...");
    const data = robustJSONParse(raw);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Gemini API/Parsing Error:', err);
    res.status(500).json({ error: 'AI generation failed. Please try again (Quota might be low or format was invalid).' });
  }
});

app.post('/api/save-session', authRequired, (req, res) => {
  const session = { id: Date.now(), userId: req.user.id, ...req.body, savedAt: new Date() };
  sessions.push(session);
  saveData(SESSIONS_FILE, sessions);
  res.status(201).json({ success: true, session });
});

app.get('/api/sessions', authRequired, (req, res) => {
  const filtered = sessions.filter(s => s.userId === req.user.id);
  res.json({ success: true, sessions: filtered.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)) });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', msg: 'StudyCoach API', gemini: !!process.env.GEMINI_API_KEY });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));