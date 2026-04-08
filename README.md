# 📚 StudyCoach AI — Time Management Learning App

An AI-powered Learning & Time Management Coach for students.

---

## 📁 Project Structure

```
time-management/
├── frontend/          # Static Web App (HTML + CSS + JS)
│   ├── index.html     # Main UI
│   ├── style.css      # Premium dark-mode design system
│   ├── app.js         # Topic engine, rendering, interactivity
│   └── config.js      # API config (change URL here for prod)
│
└── backend/           # Node.js + Express REST API
    ├── server.js      # Main server with all API routes
    ├── .env           # Environment variables (PORT, FRONTEND_URL)
    ├── .gitignore
    └── package.json
```

---

## 🚀 How to Run

### 1. Start the Backend

```bash
cd backend
npm install       # first time only
npm start         # runs on http://localhost:5000
```

### 2. Open the Frontend

Open `frontend/index.html` directly in your browser  
**or** use Live Server (VS Code extension) at `http://127.0.0.1:5500`

---

## 🔌 Backend API Endpoints

| Method | Route              | Description                      |
|--------|--------------------|----------------------------------|
| GET    | `/api/health`      | Check if server is running       |
| GET    | `/api/topics`      | List all supported topics        |
| POST   | `/api/time-plan`   | Generate smart time schedule     |
| POST   | `/api/quiz-score`  | Calculate quiz score & grade     |
| POST   | `/api/save-session`| Save a completed study session   |
| GET    | `/api/sessions`    | Get all saved sessions           |

### Example — Get Time Plan
```bash
curl -X POST http://localhost:5000/api/time-plan \
  -H "Content-Type: application/json" \
  -d '{"hours": 2, "complexity": "medium"}'
```

---

## 🎓 Features

- **7-Step Learning Flow**: Prerequisites → Time Plan → Learning Path → Visualizations → Q&A → Practice → Cheat Sheet
- **6 Built-in Topics**: Recursion, Quadratic Equations, Photosynthesis, Binary Search, Newton's Laws, Linked Lists
- **Generic Fallback**: Works for any topic typed in
- **Live Session Timer** with start/pause/reset
- **Graded Practice Problems** with hints
- **Auto-generated Cheat Sheet** (copyable + printable)

---

## 🛠️ Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | HTML5, CSS3, Vanilla JS     |
| Backend  | Node.js, Express.js         |
| Styling  | Custom dark-mode design system |
| Fonts    | Inter + JetBrains Mono (Google Fonts) |
