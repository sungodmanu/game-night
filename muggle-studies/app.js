const STORAGE_KEY = "muggle-studies-state-v1";
const SCHOOL_YEAR_START_MONTH = 7; // August (0-indexed)
const WRAP_UNLOCK_HOUR = 6;
const MOVEMENT_EVERY = 4;
const LEVELS = [
  { id: 1, name: "First year", blurb: "Warm-up charms" },
  { id: 2, name: "Third year", blurb: "Proper homework" },
  { id: 3, name: "O.W.L. prep", blurb: "Stretch your brain" }
];

// Single source of truth for who each profile is (ages/grades). Keep kids' names here only.
const PROFILE_DEFS = {
  alpha: { id: "alpha", name: "Alpha", startGrade: 4, emoji: "🪄", tagline: "Fourth year muggle scholar" },
  beta: { id: "beta", name: "Beta", startGrade: 0, emoji: "🌟", tagline: "First charms — keep it playful" }
};

const GRADE_LABELS = ["Kindergarten", "1st grade", "2nd grade", "3rd grade", "4th grade", "5th grade", "6th grade", "7th grade", "8th grade"];

const appEl = document.getElementById("app");
const statusEl = document.getElementById("status");

let state = loadState();
let screen = "landing";
let profileId = null;
let subjectId = null;
let level = 1;
let currentQuestion = null;
let questionStartedAt = 0;
let selectedChoice = null;
let revealed = false;
let sessionQuestions = 0;
let sessionMoves = 0;
let sessionStartedAt = null;
let pendingActivity = null;
let landingQuote = pickQuote();
let tickTimer = null;
let nudgeKind = null;
let returnTo = "home";
let recapKind = "timeup";
let recapThen = "timeout";

function defaultState() {
  const enrolledAt = "2026-09-01";
  const profiles = {};
  for (const id of Object.keys(PROFILE_DEFS)) {
    profiles[id] = { id, enrolledAt, lastWrapWeek: null, lastLevelBySubject: {} };
  }
  return {
    settings: { dailyLimitMinutes: 15, movementBreaks: false },
    profiles,
    usage: {},
    history: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    const profiles = {};
    for (const id of Object.keys(PROFILE_DEFS)) {
      profiles[id] = {
        ...base.profiles[id],
        ...((parsed.profiles && parsed.profiles[id]) || {})
      };
    }
    return {
      settings: { ...base.settings, ...(parsed.settings || {}) },
      profiles,
      usage: parsed.usage || {},
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function schoolYearOf(date) {
  const y = date.getFullYear();
  return date.getMonth() >= SCHOOL_YEAR_START_MONTH ? y : y - 1;
}

function currentGrade(id) {
  const p = state.profiles[id];
  const start = new Date(`${p.enrolledAt}T12:00:00`);
  const years = Math.max(0, schoolYearOf(new Date()) - schoolYearOf(start));
  return Math.min(12, PROFILE_DEFS[id].startGrade + years);
}

function gradeLabel(grade) {
  return GRADE_LABELS[grade] || `Grade ${grade}`;
}

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function usageFor(id) {
  const key = todayKey();
  const u = state.usage[id];
  if (!u || u.date !== key) {
    state.usage[id] = { date: key, usedMs: 0, bonusMinutes: 0, warnedFive: false, warnedOne: false };
  }
  return state.usage[id];
}

function limitMs(id) {
  const minutes = (state.settings.dailyLimitMinutes || 15) + (usageFor(id).bonusMinutes || 0);
  return minutes * 60 * 1000;
}

function remainingMs(id) {
  return Math.max(0, limitMs(id) - usageFor(id).usedMs);
}

function timeUp(id) {
  return remainingMs(id) <= 0;
}

function formatRemain(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function sessionRows() {
  if (!profileId || !sessionStartedAt) return [];
  const t = new Date(sessionStartedAt).getTime();
  return state.history.filter((h) => h.profileId === profileId && new Date(h.at).getTime() >= t);
}

function recapRows() {
  return recapKind === "done-today" ? todayRows(profileId) : sessionRows();
}

function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

function lastCompletedSaturday(now = new Date()) {
  const n = new Date(now);
  const lastSat = new Date(n);
  lastSat.setHours(0, 0, 0, 0);
  const daysSinceSat = (n.getDay() + 1) % 7;
  lastSat.setDate(lastSat.getDate() - daysSinceSat);
  const unlock = new Date(lastSat);
  unlock.setDate(unlock.getDate() + 1);
  unlock.setHours(WRAP_UNLOCK_HOUR, 0, 0, 0);
  if (n < unlock) lastSat.setDate(lastSat.getDate() - 7);
  return lastSat;
}

function weekKey(saturday) {
  return todayKey(saturday);
}

function weekRange(saturday) {
  const start = new Date(saturday);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date(saturday);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function wrapFor(id) {
  const sat = lastCompletedSaturday();
  const key = weekKey(sat);
  if (state.profiles[id].lastWrapWeek === key) return null;
  const { start, end } = weekRange(sat);
  const rows = state.history.filter((h) => {
    if (h.profileId !== id) return false;
    const t = new Date(h.at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
  if (!rows.length) return null;
  return { key, sat, start, end, rows };
}

function toughest(rows) {
  const wrong = rows.filter((r) => !r.correct);
  const pool = wrong.length ? wrong : rows;
  return pool.slice().sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return (b.ms || 0) - (a.ms || 0);
  })[0];
}

function todayRows(id) {
  const day = todayKey();
  return state.history.filter((h) => h.profileId === id && todayKey(new Date(h.at)) === day);
}

function wrapStats(rows) {
  const right = rows.filter((r) => r.correct).length;
  const bySubject = {};
  for (const r of rows) {
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
  }
  let topSubject = "math";
  let topCount = 0;
  for (const [k, v] of Object.entries(bySubject)) {
    if (v > topCount) {
      topSubject = k;
      topCount = v;
    }
  }
  return {
    total: rows.length,
    right,
    wrong: rows.length - right,
    accuracy: Math.round((right / rows.length) * 100),
    points: right * 10 + (rows.length - right) * 3,
    topSubject,
    toughest: toughest(rows)
  };
}

function questionsFor(grade, subject, lvl) {
  return QUESTIONS.filter(
    (q) => q.subject === subject && q.level === lvl && grade >= q.gradeMin && grade <= q.gradeMax
  );
}

function recentIds(id, subject, lvl, n = 12) {
  return state.history
    .filter((h) => h.profileId === id && h.subject === subject && h.level === lvl)
    .slice(-n)
    .map((h) => h.questionId);
}

function nextQuestion() {
  const grade = currentGrade(profileId);
  const pool = questionsFor(grade, subjectId, level);
  const recent = new Set(recentIds(profileId, subjectId, level));
  const fresh = pool.filter((q) => !recent.has(q.id));
  const use = (fresh.length ? fresh : pool).slice();
  if (currentQuestion) {
    const without = use.filter((q) => q.id !== currentQuestion.id);
    if (without.length) use.splice(0, use.length, ...without);
  }
  return use[Math.floor(Math.random() * use.length)];
}

function movementBreaksOn() {
  return !!state.settings.movementBreaks;
}

function quietScreens() {
  return ["wrap", "landing", "timeout", "nudge", "recap"].includes(screen);
}

function maybeTimeDialogue() {
  if (!profileId || quietScreens()) return false;
  const rem = remainingMs(profileId);
  const u = usageFor(profileId);
  if (rem <= 0) {
    recapKind = "timeup";
    recapThen = "timeout";
    screen = "recap";
    return true;
  }
  if (rem <= 60 * 1000 && !u.warnedOne) {
    u.warnedOne = true;
    u.warnedFive = true;
    saveState();
    nudgeKind = "one";
    returnTo = screen;
    screen = "nudge";
    return true;
  }
  if (rem <= 5 * 60 * 1000 && rem > 60 * 1000 && !u.warnedFive) {
    u.warnedFive = true;
    saveState();
    nudgeKind = "five";
    returnTo = screen;
    screen = "nudge";
    return true;
  }
  return false;
}

function startTick() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (!profileId || quietScreens()) return;
    if (timeUp(profileId)) {
      maybeTimeDialogue();
      render();
      return;
    }
    usageFor(profileId).usedMs += 1000;
    saveState();
    if (maybeTimeDialogue()) render();
  }, 1000);
}

function burst(x, y) {
  const colors = ["#ffdc46", "#ff7ab6", "#7ad7ff", "#b8ff7a", "#ffffff"];
  for (let i = 0; i < 14; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti";
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.background = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 14;
    const dist = 60 + Math.random() * 50;
    bit.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    bit.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    document.body.appendChild(bit);
    setTimeout(() => bit.remove(), 750);
  }
}

function shell(inner, extraClass = "") {
  const locked = extraClass.includes("no-top");
  const who = profileId ? PROFILE_DEFS[profileId].name : "";
  const grade = profileId ? gradeLabel(currentGrade(profileId)) : "";
  const showBar = profileId && !locked;
  return `
    <main class="app ${extraClass}">
      ${showBar ? `<div class="topbar">
        <button class="text-btn" data-act="home" type="button">← Home</button>
        <p class="who">${who} · ${grade}</p>
      </div>` : ""}
      <div class="stage">${inner}</div>
    </main>
  `;
}

function renderLanding() {
  const q = landingQuote;
  return shell(`
    <p class="eyebrow">Muggle Studies</p>
    <h1>Who's studying?</h1>
    <blockquote class="quote">
      <p>“${q.text}”</p>
      <footer>— ${q.by}</footer>
    </blockquote>
    <div class="profiles">
      ${Object.values(PROFILE_DEFS).map((p) => `
        <button class="profile-card" data-act="pick" data-id="${p.id}" type="button">
          <span class="p-emoji">${p.emoji}</span>
          <strong>${p.name}</strong>
          <span>${gradeLabel(currentGrade(p.id))}</span>
          ${timeUp(p.id) ? `<span class="remain-chip">Done for today</span>` : ""}
        </button>
      `).join("")}
    </div>
    <p class="hint">Fifteen minutes of magic, then off to play.</p>
  `, "landing");
}

function renderTimeout() {
  return shell(`
    <p class="eyebrow">See you tomorrow</p>
    <h1>Wands down</h1>
    <p class="sub">${PROFILE_DEFS[profileId].name}, you already had a great session. Go play, read, or move around.</p>
    <p class="big-emoji">🧹</p>
    <button class="primary" data-act="switch" type="button">Switch wizard</button>
  `, "no-top");
}

function renderNudge() {
  const five = nudgeKind === "five";
  return shell(`
    <p class="eyebrow">${five ? "Heads up" : "Last stretch"}</p>
    <h1>${five ? "Five minutes remaining" : "One minute remaining"}</h1>
    <p class="sub">${five
      ? "Plenty of time for a few more questions. Then we'll celebrate what you did."
      : "One last burst of brainpower. After this, we'll show you how the session went."}</p>
    <p class="big-emoji">${five ? "⏳" : "⚡"}</p>
    <button class="primary" data-act="nudge-ok" type="button">Keep going</button>
  `, "no-top");
}

function renderRecap() {
  const rows = recapRows();
  const right = rows.filter((r) => r.correct).length;
  const subjects = [...new Set(rows.map((r) => r.subject))];
  const names = subjects.map((id) => SUBJECTS[id].label).join(", ") || "a little exploring";
  const title = recapKind === "timeup"
    ? "What a session"
    : recapKind === "goodbye"
      ? "Nice work"
      : "You're done for today";
  const sub = recapKind === "timeup"
    ? "Time to hop off the screen. Look what you did."
    : recapKind === "goodbye"
      ? "Here's what you did this time."
      : "Come back tomorrow for more magic.";
  return shell(`
    <p class="eyebrow">${PROFILE_DEFS[profileId].name}'s recap</p>
    <h1>${title}</h1>
    <p class="sub">${sub}</p>
    <div class="stats">
      <div class="stat"><strong>${rows.length}</strong><span>questions</span></div>
      <div class="stat"><strong>${right}</strong><span>correct</span></div>
      <div class="stat"><strong>${rows.length - right}</strong><span>to try again</span></div>
      ${movementBreaksOn() ? `<div class="stat"><strong>${sessionMoves}</strong><span>stand-ups</span></div>` : ""}
    </div>
    <p class="card-note">You studied ${names}.</p>
    <button class="primary" data-act="recap-done" type="button">${recapKind === "goodbye" ? "All done" : "Switch wizard"}</button>
  `, "no-top");
}

function renderWrap(wrap) {
  const s = wrapStats(wrap.rows);
  const tough = s.toughest;
  const sub = SUBJECTS[s.topSubject];
  const satLabel = wrap.sat.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return shell(`
    <p class="eyebrow">Sunday wrap · week ending ${satLabel}</p>
    <h1>${PROFILE_DEFS[profileId].name}'s week</h1>
    <div class="stats">
      <div class="stat"><strong>${s.total}</strong><span>questions</span></div>
      <div class="stat"><strong>${s.right}</strong><span>correct</span></div>
      <div class="stat"><strong>${s.wrong}</strong><span>missed</span></div>
      <div class="stat"><strong>${s.accuracy}%</strong><span>accuracy</span></div>
    </div>
    <p class="card-note">House points this week: <strong>${s.points}</strong></p>
    <p class="card-note">Most studied: ${sub.emoji} ${sub.label}</p>
    ${tough ? `<div class="teach">
      <p class="label">Toughest moment</p>
      <p>${tough.prompt}</p>
      <p class="muted">Level ${tough.level} · ${tough.correct ? "got it" : "missed"} · ${SUBJECTS[tough.subject].label}</p>
    </div>` : ""}
    <button class="primary" data-act="dismiss-wrap" data-week="${wrap.key}" type="button">Onward</button>
  `, "no-top");
}

function renderHome() {
  const grade = currentGrade(profileId);
  const subs = subjectsForGrade(grade);
  const rows = todayRows(profileId);
  const right = rows.filter((r) => r.correct).length;
  const todayLine = rows.length
    ? `Today: ${rows.length} answered · ${right} correct`
    : "Today: no questions yet";
  return shell(`
    <p class="eyebrow">Pick a subject</p>
    <h1>Hello, ${PROFILE_DEFS[profileId].name}</h1>
    <p class="sub">${gradeLabel(grade)} · ${todayLine}</p>
    <div class="subjects">
      ${subs.map((id) => {
        const s = SUBJECTS[id];
        return `<button class="subject-card" data-act="subject" data-id="${id}" type="button">
          <span>${s.emoji}</span>
          <strong>${s.label}</strong>
        </button>`;
      }).join("")}
    </div>
    <button class="text-btn block" data-act="switch" type="button">Not ${PROFILE_DEFS[profileId].name}?</button>
  `);
}

function renderLevels() {
  const s = SUBJECTS[subjectId];
  const last = state.profiles[profileId].lastLevelBySubject[subjectId] || 1;
  return shell(`
    <p class="eyebrow">${s.emoji} ${s.label}</p>
    <h1>Choose a level</h1>
    <div class="levels">
      ${LEVELS.map((lv) => `
        <button class="level-card ${lv.id === last ? "suggested" : ""}" data-act="level" data-id="${lv.id}" type="button">
          <strong>${"★".repeat(lv.id)}${"☆".repeat(3 - lv.id)}</strong>
          <span>${lv.name}</span>
          <em>${lv.blurb}</em>
        </button>
      `).join("")}
    </div>
  `);
}

function renderQuestion() {
  const q = currentQuestion;
  const s = SUBJECTS[subjectId];
  const choices = q.choices.map((c, i) => {
    let cls = "choice";
    if (revealed) {
      if (i === q.answer) cls += " good";
      else if (i === selectedChoice) cls += " bad";
    }
    return `<button class="${cls}" data-act="choice" data-i="${i}" type="button" ${revealed ? "disabled" : ""}>${c}</button>`;
  }).join("");
  return shell(`
    <p class="eyebrow">${s.emoji} ${s.label} · Level ${level}</p>
    <h1 class="prompt">${q.prompt}</h1>
    <div class="choices">${choices}</div>
    ${revealed ? `<div class="teach">${q.teach ? `<p>${q.teach}</p>` : ""}
      <button class="primary" data-act="next" type="button">Next</button>
    </div>` : ""}
  `);
}

function renderActivity() {
  const a = pendingActivity;
  return shell(`
    <p class="eyebrow">Bonus quest</p>
    <h1>Out of the chair!</h1>
    <p class="activity">${a.prompt}</p>
    <p class="sub">${a.hint}</p>
    <button class="primary" data-act="did-it" type="button">I did it</button>
  `);
}

function render() {
  if (profileId && timeUp(profileId) && !["timeout", "landing", "wrap", "recap", "nudge"].includes(screen)) {
    recapKind = "timeup";
    recapThen = "timeout";
    screen = "recap";
  }
  let html = "";
  if (screen === "landing") html = renderLanding();
  else if (screen === "timeout") html = renderTimeout();
  else if (screen === "nudge") html = renderNudge();
  else if (screen === "recap") html = renderRecap();
  else if (screen === "wrap") {
    const wrap = wrapFor(profileId);
    html = wrap ? renderWrap(wrap) : renderHome();
  }
  else if (screen === "home") html = renderHome();
  else if (screen === "levels") html = renderLevels();
  else if (screen === "activity") html = renderActivity();
  else html = renderQuestion();
  appEl.innerHTML = html;
}

function enterProfile(id) {
  profileId = id;
  sessionStartedAt = new Date().toISOString();
  sessionQuestions = 0;
  sessionMoves = 0;
  const rem = remainingMs(id);
  const u = usageFor(id);
  if (rem <= 5 * 60 * 1000 && rem > 60 * 1000) u.warnedFive = true;
  startTick();
  if (wrapFor(id)) {
    screen = "wrap";
    render();
    return;
  }
  if (timeUp(id)) {
    recapKind = "done-today";
    recapThen = "timeout";
    screen = "recap";
    render();
    return;
  }
  if (rem > 0 && rem <= 60 * 1000 && !u.warnedOne) {
    u.warnedOne = true;
    saveState();
    nudgeKind = "one";
    returnTo = "home";
    screen = "nudge";
    render();
    return;
  }
  screen = "home";
  render();
}

function beginQuestion() {
  currentQuestion = nextQuestion();
  if (!currentQuestion) {
    screen = "home";
    render();
    return;
  }
  questionStartedAt = Date.now();
  selectedChoice = null;
  revealed = false;
  screen = "question";
  render();
}

appEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;

  if (act === "pick") {
    enterProfile(btn.dataset.id);
    return;
  }
  if (act === "switch") {
    if (profileId && sessionRows().length) {
      recapKind = "goodbye";
      recapThen = "landing";
      screen = "recap";
      render();
      return;
    }
    profileId = null;
    screen = "landing";
    landingQuote = pickQuote();
    render();
    return;
  }
  if (act === "home") {
    screen = "home";
    subjectId = null;
    render();
    return;
  }
  if (act === "dismiss-wrap") {
    state.profiles[profileId].lastWrapWeek = btn.dataset.week;
    saveState();
    screen = "home";
    render();
    return;
  }
  if (act === "subject") {
    subjectId = btn.dataset.id;
    screen = "levels";
    render();
    return;
  }
  if (act === "level") {
    level = Number(btn.dataset.id);
    state.profiles[profileId].lastLevelBySubject[subjectId] = level;
    saveState();
    sessionQuestions = 0;
    beginQuestion();
    return;
  }
  if (act === "choice" && !revealed) {
    selectedChoice = Number(btn.dataset.i);
    revealed = true;
    const q = currentQuestion;
    const correct = selectedChoice === q.answer;
    state.history.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      profileId,
      subject: subjectId,
      level,
      questionId: q.id,
      prompt: q.prompt,
      choice: q.choices[selectedChoice],
      correctAnswer: q.choices[q.answer],
      correct,
      ms: Date.now() - questionStartedAt,
      at: new Date().toISOString()
    });
    saveState();
    sessionQuestions += 1;
    render();
    if (correct) burst(e.clientX, e.clientY);
    return;
  }
  if (act === "next") {
    if (movementBreaksOn() && sessionQuestions > 0 && sessionQuestions % MOVEMENT_EVERY === 0) {
      pendingActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      screen = "activity";
      render();
      return;
    }
    beginQuestion();
    return;
  }
  if (act === "did-it") {
    pendingActivity = null;
    sessionMoves += 1;
    burst(e.clientX, e.clientY);
    beginQuestion();
    return;
  }
  if (act === "nudge-ok") {
    screen = returnTo || "home";
    render();
    return;
  }
  if (act === "recap-done") {
    if (recapThen === "landing") {
      profileId = null;
      screen = "landing";
      landingQuote = pickQuote();
    } else {
      screen = "timeout";
    }
    render();
  }
});

render();

window.muggleStudies = {
  addBonusMinutes(id, minutes) {
    if (!state.profiles[id]) return;
    usageFor(id).bonusMinutes += Number(minutes) || 0;
    saveState();
    render();
  },
  setRemainingMinutes(id, minutes) {
    if (!state.profiles[id]) return;
    const u = usageFor(id);
    const limit = (state.settings.dailyLimitMinutes || 15) + (u.bonusMinutes || 0);
    u.usedMs = Math.max(0, (limit - Number(minutes || 0)) * 60 * 1000);
    saveState();
    render();
  },
  resetDay(id) {
    if (!state.profiles[id]) return;
    state.usage[id] = { date: todayKey(), usedMs: 0, bonusMinutes: 0, warnedFive: false, warnedOne: false };
    saveState();
    render();
  },
  setMovementBreaks(on) {
    state.settings.movementBreaks = !!on;
    saveState();
  }
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .then(() => { if (statusEl) statusEl.textContent = "Ready offline after first load."; })
    .catch(() => { if (statusEl) statusEl.textContent = "Opened, but offline cache failed."; });
} else if (statusEl) {
  statusEl.textContent = "Ready (this browser has no service worker).";
}
