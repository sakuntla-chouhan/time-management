/* ==============================================================
   StudyCoach AI — app.js (FIXED + STABLE VERSION)
   ============================================================== */

// ── App State ─────────────────────────────────────────────────
const state = {
  topic: '',
  hours: 2,
  level: 'beginner',
  topicData: null,
  currentStep: 0,
  totalSteps: 7,
  qaAnswered: 0,
  practiceChecked: 0,
  timerInterval: null,
  timerSeconds: 0,
  timerRunning: false,
};

// ── Generic Topic ─────────────────────────────────────────────
function buildGenericTopic(label) {
  return {
    label,
    complexity: 'medium',
    prereqs: {
      must: [
        { name: 'Basic Terminology', why: `Understand key terms of ${label}` },
        { name: 'Core Fundamentals', why: 'Strong basics are required' }
      ],
      optional: [
        { name: 'Concept Background', why: 'Helps deeper understanding' }
      ]
    },
    skipWarning: 'Skipping basics will make advanced concepts harder.',
    timeplan: [
      { icon: '🔍', name: 'Basics', pct: 0.25, desc: 'Foundation' },
      { icon: '📖', name: 'Core', pct: 0.5, desc: 'Main learning' },
      { icon: '📝', name: 'Practice', pct: 0.25, desc: 'Revision' }
    ],
    concepts: [
      {
        title: `What is ${label}?`,
        simple: `${label} is a core concept in this subject.`,
        deep: 'It requires structured understanding and practice.',
        analogy: 'Think of it like building blocks.',
        code: ''
      }
    ],
    diagrams: [
      { title: 'Concept Map', type: 'diagram', content: 'CORE → UNDERSTANDING → APPLICATION' }
    ],
    qa: [
      {
        q: `What is most important before learning ${label}?`,
        options: ['Skip basics', 'Memorize only', 'Master fundamentals', 'Random practice'],
        correct: 2,
        explain: 'Basics are essential first.'
      }
    ],
    practice: [
      {
        diff: 'easy',
        q: `Explain ${label} in simple words.`,
        hint: 'Think basic definition',
        answer: `${label} is a fundamental concept.`
      }
    ],
    cheatsheet: {
      keyPoints: ['Understand basics', 'Practice daily', 'Revise often'],
      formulas: [{ name: 'Learning Flow', f: 'Learn → Practice → Revise' }],
      mistakes: ['Memorizing without understanding']
    }
  };
}

// ── Helpers ───────────────────────────────────────────────────
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str = '') {
  return String(str).replace(/'/g, "&#39;");
}

// ── Step 1 ────────────────────────────────────────────────────
function renderPrerequisites(data) {
  const html = `
    <div class="coach-msg">
      <div class="coach-avatar">🎓</div>
      <div>Before starting <b>${data.label}</b>, prepare basics first.</div>
    </div>
    <div class="prereq-grid">
      ${(data.prereqs.must || []).map(p => `
        <div class="prereq-item">
          <div><b>Must:</b> ${escapeHtml(p.name)}</div>
          <div>${escapeHtml(p.why)}</div>
        </div>`).join('')}
    </div>
  `;
  document.getElementById('prereqContent').innerHTML = html;
}

// ── Step 2 Timer ──────────────────────────────────────────────
function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    // Success "Ding" (C5 -> C6)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.warn("Audio error", e);
  }
}

function setupTimer() {
  const display = document.getElementById('timerDisplay');
  // targetSeconds calculation based on hours planned
  const targetSeconds = Math.round(state.hours * 3600);

  document.getElementById('btnTimerStart').onclick = () => {
    if (state.timerRunning) return;
    state.timerRunning = true;

    // Ask for browser notification permission early
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    state.timerInterval = setInterval(() => {
      state.timerSeconds++;
      
      const h = String(Math.floor(state.timerSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((state.timerSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(state.timerSeconds % 60).padStart(2, '0');
      display.textContent = `${h}:${m}:${s}`;
      
      // Target hit!
      if (state.timerSeconds >= targetSeconds) {
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        
        playCompletionSound();
        display.style.color = 'var(--success)';
        display.innerHTML = `🎉 Time's Up!`;
        
        // Throw a notification
        if ("Notification" in window && Notification.permission === "granted") {
           new Notification("StudyCoach AI", { body: "Your study time is exactly completed! Awesome focus!" });
        } else {
           alert("🎉 Time's Up! Your study session is completed!");
        }
      }
    }, 1000);
  };

  document.getElementById('btnTimerPause').onclick = () => {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
  };

  document.getElementById('btnTimerReset').onclick = () => {
    clearInterval(state.timerInterval);
    state.timerSeconds = 0;
    state.timerRunning = false;
    display.textContent = '00:00:00';
    display.style.color = ''; // Reset success color if it was hit
  };
}

function renderTimePlan(hours, data) {
  const mins = Math.round(hours * 60);

  const blocks = (data.timeplan || []).map(b => ({
    ...b,
    minutes: Math.max(5, Math.round(mins * b.pct))
  }));

  let html = `
    <div class="coach-msg">
      <div class="coach-avatar">⏱️</div>
      <div>Here is your smart study plan!</div>
    </div>

    <div class="timeline">
      ${blocks.map(b => `
        <div class="timeline-item">
          <div>${b.icon}</div>
          <div>
            <b>${escapeHtml(b.name)}</b> - ${b.minutes} min
            <div>${escapeHtml(b.desc)}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="timer-widget">
      <div id="timerDisplay">00:00:00</div>
      <button id="btnTimerStart">Start</button>
      <button id="btnTimerPause">Pause</button>
      <button id="btnTimerReset">Reset</button>
    </div>
  `;

  document.getElementById('timePlanContent').innerHTML = html;
  setupTimer();
}

// ── Step Navigation FIX ───────────────────────────────────────
function goToStep(step) {
  state.currentStep = step;

  document.querySelectorAll('.step-section').forEach((s, i) => {
    s.classList.toggle('active', i === step);
  });

  document.querySelectorAll('.step-pill').forEach((p, i) => {
    p.classList.toggle('active', i === step);
    p.classList.toggle('done', i < step);
  });

  const fill = (step / (state.totalSteps - 1)) * 100;
  document.getElementById('progressBarFill').style.width = fill + '%';
}

// ── Learning ──────────────────────────────────────────────────
function renderLearning(data) {
  const html = (data.concepts || []).map((c, i) => `
    <div class="concept-block">
      <div onclick="toggleConcept(${i})">
        ${escapeHtml(c.title)}
      </div>
      <div class="concept-body">
        ${escapeHtml(c.simple)}
      </div>
    </div>
  `).join('');

  document.getElementById('learningContent').innerHTML = html;
}

window.toggleConcept = (i) => {
  const el = document.querySelectorAll('.concept-block')[i];
  if (el) el.classList.toggle('open');
};

// ── Visualization ─────────────────────────────────────────────
function renderVisualization(data) {
  const html = (data.diagrams || []).map(d => `
    <div class="viz-block card">
      <div class="viz-title">${escapeHtml(d.title)}</div>
      ${d.type === 'diagram' || d.type === 'table'
        ? `<pre class="diagram">${escapeHtml(d.content)}</pre>` 
        : `<div class="viz-content">${escapeHtml(d.content)}</div>`}
    </div>
  `).join('');
  document.getElementById('vizContent').innerHTML = html || '<p>No visualizations available.</p>';
}

// ── QA ────────────────────────────────────────────────────────
function renderQA(data) {
  state.qaAnswered = 0;
  const qaArr = data.qa || [];
  const html = qaArr.map((q, i) => `
    <div class="qa-question">
      <div class="qa-q-label">Question ${i + 1}</div>
      <div class="qa-q-text">${escapeHtml(q.q)}</div>
      <div class="qa-options" id="qa-opts-${i}">
        ${(q.options || []).map((opt, oIdx) => `
          <button class="qa-option" onclick="answerQA(${i}, ${oIdx}, ${q.correct}, '${escAttr(q.explain)}')">
            ${escapeHtml(opt)}
          </button>
        `).join('')}
      </div>
      <div class="qa-feedback" id="qa-fb-${i}"></div>
    </div>
  `).join('');
  document.getElementById('qaContent').innerHTML = html || '<p>No questions available.</p>';
  document.getElementById('btn-next-4').style.display = 'inline-block';
}

window.answerQA = (i, chosen, correct, explain) => {
  const opts = document.getElementById(`qa-opts-${i}`).querySelectorAll('.qa-option');
  opts.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correct) btn.classList.add('correct');
    else if (idx === chosen) btn.classList.add('wrong');
  });
  
  const fb = document.getElementById(`qa-fb-${i}`);
  fb.style.display = 'block';
  if (chosen === correct) {
    fb.innerHTML = '✅ <b>Correct!</b> ' + escapeHtml(explain);
    fb.style.background = 'rgba(34,211,161,0.1)';
    fb.style.color = 'var(--success)';
  } else {
    fb.innerHTML = '❌ <b>Incorrect.</b> ' + escapeHtml(explain);
    fb.style.background = 'rgba(248,113,113,0.1)';
    fb.style.color = 'var(--danger)';
  }
};

// ── Practice ──────────────────────────────────────────────────
function renderPractice(data) {
  const html = (data.practice || []).map((p, i) => `
    <div class="card">
      <div class="card-title">Practice (${escapeHtml(p.diff)})</div>
      <div style="margin-bottom: 12px">${escapeHtml(p.q)}</div>
      
      <!-- Interactive Answer Box -->
      <textarea id="user-ans-${i}" style="width:100%; min-height:80px; margin-bottom: 12px; background:var(--bg-layer); color:var(--text); border:1px solid var(--border); border-radius:8px; padding:12px; font-family:inherit; resize:vertical;" placeholder="Write your answer here before checking..."></textarea>
      
      <div style="display:flex; gap:8px; margin-bottom: 12px">
        <button class="btn-nav-outline nav-back" onclick="showHint(${i})">Need a hint?</button>
        <button class="btn-nav" onclick="checkPractice(${i})">Verify Answer</button>
      </div>
      <div id="hint-${i}" class="hidden" style="margin-bottom:12px; padding:12px; background:rgba(251,191,36,0.1); border-left:4px solid var(--warning); border-radius:4px; color:var(--text)">💡 <b>Hint:</b> ${escapeHtml(p.hint)}</div>
      <div id="answer-${i}" class="hidden" style="padding:12px; background:rgba(34,211,161,0.1); border-left:4px solid var(--success); border-radius:4px; color:var(--text)">
         ✅ <b>Correct Answer:</b><br><br>${escapeHtml(p.answer)} <br><br>
         <small style="opacity:0.8"><i>Compare this with your written answer above to self-evaluate.</i></small>
      </div>
    </div>
  `).join('');
  document.getElementById('practiceContent').innerHTML = html || '<p>No practice questions.</p>';
  document.getElementById('btn-next-5').style.display = 'inline-block';
}

window.showHint = (i) => {
  const el = document.getElementById(`hint-${i}`);
  if(el) el.classList.toggle('hidden');
};

window.checkPractice = (i) => {
  const el = document.getElementById(`answer-${i}`);
  if(el) el.classList.toggle('hidden');
};

// ── Cheat Sheet ───────────────────────────────────────────────
function renderCheatSheet(data) {
  const points = (data.cheatsheet?.keyPoints || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
  const formulas = (data.cheatsheet?.formulas || []).map(f => `
    <div class="formula-item">
      <b>${escapeHtml(f.name)}:</b> <code>${escapeHtml(f.f)}</code>
    </div>`).join('');
  const mistakes = (data.cheatsheet?.mistakes || []).map(m => `<li>${escapeHtml(m)}</li>`).join('');

  document.getElementById('cheatContent').innerHTML = `
    <div class="card info">
      <div class="card-title">💡 Key Takeaways</div>
      <ul class="cheat-list">${points}</ul>
    </div>
    <div class="card accent">
      <div class="card-title">🧪 Essential Formulas</div>
      <div class="formula-list">${formulas}</div>
    </div>
    <div class="card success">
      <div class="card-title">⚠️ Common Pitfalls</div>
      <ul class="cheat-list">${mistakes}</ul>
    </div>
  `;

  // Explicit Copy logic
  document.getElementById('btnCopy').onclick = () => {
    const text = `STUDYCOACH AI — ${data.label.toUpperCase()} CHEAT SHEET\n\n` +
      `KEY POINTS:\n- ${data.cheatsheet.keyPoints.join('\n- ')}\n\n` +
      `FORMULAS:\n${data.cheatsheet.formulas.map(f => `${f.name}: ${f.f}`).join('\n')}`;
    
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btnCopy');
      const old = btn.innerHTML;
      btn.innerHTML = '✅ Copied!';
      setTimeout(() => btn.innerHTML = old, 2000);
    });
  };

  // Trigger Save Session logic if logged in
  if (window.StudyCoachAPI && window.StudyCoachAPI.isLoggedIn()) {
    window.StudyCoachAPI.saveSession(state.topic, state.hours, 100, state.level)
      .then(() => console.log("Session saved!"))
      .catch(err => console.warn("Session save failed", err));
  }
}

// ── History Logic ──────────────────────────────────────────────
async function loadHistory() {
  const listEl = document.getElementById('historyList');
  const modal = document.getElementById('historyModal');
  
  modal.classList.remove('hidden');
  listEl.innerHTML = '<div class="loading-spinner">⌛ Loading sessions...</div>';

  if (!window.StudyCoachAPI || !window.StudyCoachAPI.isLoggedIn()) {
    listEl.innerHTML = '<div class="empty-state">Please sign in to see your history.</div>';
    return;
  }

  try {
    const res = await window.StudyCoachAPI.getSessions();
    const sessions = res.sessions || [];
    
    if (sessions.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No sessions found. Start learning to see them here!</div>';
      return;
    }

    listEl.innerHTML = sessions.map(s => `
      <div class="history-item">
        <div class="hist-info">
          <div class="hist-topic">${escapeHtml(s.topic)}</div>
          <div class="hist-meta">${new Date(s.savedAt).toLocaleDateString()} • ${s.level}</div>
        </div>
        <div class="hist-stat">${s.hours}h</div>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state" style="color:var(--danger)">Failed to load history: ${escapeHtml(err.message)}</div>`;
  }
}

// ── Start Session FIX ─────────────────────────────────────────
function startSession(topic, hours, level) {
  document.getElementById('hero').classList.add('hidden');

  const startBtnText = document.getElementById('startBtnText');
  if (startBtnText) startBtnText.innerText = 'Generating Plan...';

  // Use globally available StudyCoachAPI if loaded, fallback to fetch locally for demo
  const generateCall = window.StudyCoachAPI 
    ? window.StudyCoachAPI.generate(topic, hours, level)
    : fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, hours, level })
      }).then(r => r.json());

  generateCall
    .then(res => {
      state.topicData = res?.data || buildGenericTopic(topic);
    })
    .catch((err) => {
      console.error('API Error:', err);
      state.topicData = buildGenericTopic(topic);
    })
    .finally(() => {
      const data = state.topicData;

      renderPrerequisites(data);
      renderTimePlan(hours, data);
      renderLearning(data);
      renderVisualization(data);
      renderQA(data);
      renderPractice(data);
      renderCheatSheet(data);

      document.getElementById('session').classList.remove('hidden');
      goToStep(0);
      if (startBtnText) startBtnText.innerText = 'Generate My Learning Plan';
    });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const themeToggle = document.getElementById('btnThemeToggle');
  if (themeToggle) {
    // Load preference
    if (localStorage.getItem('theme') === 'night') {
      document.body.classList.add('night-mode');
      themeToggle.innerText = '🌸';
    }
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('night-mode');
      if (document.body.classList.contains('night-mode')) {
        localStorage.setItem('theme', 'night');
        themeToggle.innerText = '🌸'; // icon to go back to pink
      } else {
        localStorage.setItem('theme', 'pink');
        themeToggle.innerText = '🌙'; // icon to go to night mode
      }
    });
  }

  // Navigation User Info
  const user = window.StudyCoachAPI?.getUser();
  if (user && document.getElementById('navUserInfo')) {
    document.getElementById('navUserInfo').innerHTML = `<span>👤 ${escapeHtml(user.name)}</span>`;
  }
  
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    if (window.StudyCoachAPI) window.StudyCoachAPI.logout();
  });
  document.getElementById('topicForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const topic = document.getElementById('topicInput').value;
    const hours = parseFloat(document.getElementById('timeInput')?.value || 2);
    const level = document.getElementById('levelInput')?.value || 'beginner';
    startSession(topic, hours, level);
  });

  document.querySelectorAll('.step-pill').forEach((p, i) => {
    p.addEventListener('click', () => goToStep(i));
  });

  document.querySelectorAll('.btn-next').forEach((btn, i) => {
    btn.addEventListener('click', () => goToStep(i + 1));
  });

  document.getElementById('navBack')?.addEventListener('click', () => location.reload());
  document.getElementById('btnNew')?.addEventListener('click', () => location.reload());
  
  // Session Navigation
  document.getElementById('btnHistory')?.addEventListener('click', loadHistory);
  document.getElementById('btnCloseHistory')?.addEventListener('click', () => {
    document.getElementById('historyModal').classList.add('hidden');
  });

  // Chip clicks
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('topicInput').value = chip.dataset.topic;
      const hours = parseFloat(document.getElementById('timeInput')?.value || 2);
      const level = document.getElementById('levelInput')?.value || 'beginner';
      startSession(chip.dataset.topic, hours, level);
    });
  });

  // Verification on load
  console.log("StudyCoach AI: Initializing...");
  if (window.StudyCoachAPI && window.StudyCoachAPI.isLoggedIn()) {
    console.log("StudyCoach AI: Checking session...");
    window.StudyCoachAPI.me().then(() => {
      console.log("StudyCoach AI: Session valid.");
    }).catch(err => {
      console.warn("StudyCoach AI: Session invalid or user deleted.", err);
      // Only logout if it's not already login.html to avoid loops
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
        window.StudyCoachAPI.logout();
      }
    });
  } else {
    console.log("StudyCoach AI: No session found (Guest mode).");
  }
});