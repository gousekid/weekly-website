"use strict";

/* ---------- 키보드 레이아웃 (60% ANSI) ---------- */

const LAYOUT = [
  [
    ["Backquote", "`"], ["Digit1", "1"], ["Digit2", "2"], ["Digit3", "3"], ["Digit4", "4"],
    ["Digit5", "5"], ["Digit6", "6"], ["Digit7", "7"], ["Digit8", "8"], ["Digit9", "9"],
    ["Digit0", "0"], ["Minus", "-"], ["Equal", "="], ["Backspace", "⌫", 2],
  ],
  [
    ["Tab", "Tab", 1.5], ["KeyQ", "Q"], ["KeyW", "W"], ["KeyE", "E"], ["KeyR", "R"],
    ["KeyT", "T"], ["KeyY", "Y"], ["KeyU", "U"], ["KeyI", "I"], ["KeyO", "O"],
    ["KeyP", "P"], ["BracketLeft", "["], ["BracketRight", "]"], ["Backslash", "\\", 1.5],
  ],
  [
    ["CapsLock", "Caps", 1.8], ["KeyA", "A"], ["KeyS", "S"], ["KeyD", "D"], ["KeyF", "F"],
    ["KeyG", "G"], ["KeyH", "H"], ["KeyJ", "J"], ["KeyK", "K"], ["KeyL", "L"],
    ["Semicolon", ";"], ["Quote", "'"], ["Enter", "Enter ↵", 2.2],
  ],
  [
    ["ShiftLeft", "Shift", 2.4], ["KeyZ", "Z"], ["KeyX", "X"], ["KeyC", "C"], ["KeyV", "V"],
    ["KeyB", "B"], ["KeyN", "N"], ["KeyM", "M"], ["Comma", ","], ["Period", "."],
    ["Slash", "/"], ["ShiftRight", "Shift", 2.6],
  ],
  [
    ["ControlLeft", "Ctrl", 1.4], ["MetaLeft", "Win", 1.2], ["AltLeft", "Alt", 1.2],
    ["Space", "", 6.5],
    ["AltRight", "한/영", 1.2], ["Fn", "Fn", 1.2], ["ControlRight", "Ctrl", 1.4],
  ],
];

const BIG_KEYS = new Set(["Space", "Enter", "Backspace", "ShiftLeft", "ShiftRight", "CapsLock", "Tab"]);

/* ---------- 스위치 프로파일 (전부 실시간 합성) ---------- */

const PROFILES = {
  blue:  { body: 1900, q: 1.1, decay: 0.070, gain: 0.85, click: 3600, clickGain: 0.55, sub: 0,   subGain: 0 },
  brown: { body: 1000, q: 0.9, decay: 0.055, gain: 0.80, click: 2200, clickGain: 0.18, sub: 0,   subGain: 0 },
  red:   { body: 620,  q: 0.8, decay: 0.048, gain: 0.70, click: 0,    clickGain: 0,    sub: 150, subGain: 0.10 },
  topre: { body: 340,  q: 0.7, decay: 0.095, gain: 1.00, click: 1400, clickGain: 0.08, sub: 120, subGain: 0.35 },
};

/* ---------- 상태 ---------- */

let profile = "blue";
let counts = {};
let total = 0;
let stamps = []; // KPM 계산용 타임스탬프
const downKeys = new Set();

const $ = (id) => document.getElementById(id);
const keyEls = {};

/* ---------- 오디오 엔진 ---------- */

let actx = null;
let master = null;
let noiseBuf = null;

function initAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain();
  master.gain.value = Number($("volume").value) / 100;
  master.connect(actx.destination);

  const len = Math.floor(actx.sampleRate * 0.2);
  noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
}

function playKey(isBig, isRelease) {
  if (!actx) return;
  if (actx.state === "suspended") actx.resume();
  const p = PROFILES[profile];
  const t = actx.currentTime;
  const vary = (amt) => 1 + (Math.random() * 2 - 1) * amt;

  // 릴리즈(키 뗄 때)는 훨씬 작고 높은 틱
  const freqScale = (isBig ? 0.72 : 1) * (isRelease ? 1.6 : 1) * vary(0.07);
  const gainScale = (isBig ? 1.2 : 1) * (isRelease ? 0.18 : 1) * vary(0.22);
  const decay = p.decay * (isBig ? 1.25 : 1) * (isRelease ? 0.5 : 1);

  // 1) 타건 몸통: 노이즈 → 밴드패스 → 급감쇠 엔벨로프
  const src = actx.createBufferSource();
  src.buffer = noiseBuf;
  const bp = actx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = p.body * freqScale;
  bp.Q.value = p.q;
  const lp = actx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(p.body * 6, 9000);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(p.gain * gainScale, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.002 + decay);
  src.connect(bp).connect(lp).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.002 + decay + 0.02);

  // 2) 클릭 트랜지언트 (청축의 '찰칵')
  if (p.click && !isRelease) {
    const osc = actx.createOscillator();
    osc.type = "square";
    osc.frequency.value = p.click * vary(0.05);
    const cg = actx.createGain();
    cg.gain.setValueAtTime(0.0001, t);
    cg.gain.exponentialRampToValueAtTime(p.clickGain * gainScale * 0.3, t + 0.001);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);
    const hp = actx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    osc.connect(hp).connect(cg).connect(master);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  // 3) 저역 '통울림' (무접점 도각, 스페이스 텅 소리)
  if ((p.sub || isBig) && !isRelease) {
    const osc = actx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime((p.sub || 170) * vary(0.06), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max((p.sub || 170) * 0.6, 40), t + 0.06);
    const sg = actx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime((p.subGain || 0.12) * gainScale * 0.6, t + 0.004);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(sg).connect(master);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

/* ---------- 키보드 렌더 ---------- */

function renderKeyboard() {
  const kb = $("keyboard");
  for (const row of LAYOUT) {
    const rowEl = document.createElement("div");
    rowEl.className = "krow";
    for (const [code, label, w] of row) {
      const el = document.createElement("div");
      el.className = "key";
      if (code === "Enter" || code === "Space") el.classList.add("accent");
      el.style.setProperty("--w", w || 1);
      el.textContent = label;
      el.dataset.code = code;
      rowEl.appendChild(el);
      keyEls[code] = el;
    }
    kb.appendChild(rowEl);
  }
}

/* ---------- 입력 처리 ---------- */

function pressVisual(code, down) {
  const el = keyEls[code];
  if (el) el.classList.toggle("is-down", down);
}

function record(code) {
  total += 1;
  counts[code] = (counts[code] || 0) + 1;
  stamps.push(Date.now());
  if (stamps.length > 600) stamps = stamps.slice(-400);
  updateHeat(code);
  updateStats();
}

function keyDown(code) {
  if (downKeys.has(code)) return; // OS 오토리핏 방지
  downKeys.add(code);
  initAudio();
  pressVisual(code, true);
  playKey(BIG_KEYS.has(code), false);
  record(code);
}

function keyUp(code) {
  if (!downKeys.has(code)) return;
  downKeys.delete(code);
  pressVisual(code, false);
  playKey(BIG_KEYS.has(code), true);
}

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const code = keyEls[e.code] ? e.code : null;
  if (!code) return;
  if (e.code === "Tab") e.preventDefault(); // 포커스 이탈 방지
  keyDown(code);
});
document.addEventListener("keyup", (e) => {
  if (keyEls[e.code]) keyUp(e.code);
});
window.addEventListener("blur", () => {
  for (const code of [...downKeys]) keyUp(code);
});

// 마우스/터치 타건
document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest(".key");
  if (!el) return;
  e.preventDefault();
  keyDown(el.dataset.code);
});
document.addEventListener("pointerup", () => {
  for (const code of [...downKeys]) keyUp(code);
});

/* ---------- 히트맵 & 통계 ---------- */

function heatRatio(code, max) {
  return counts[code] ? Math.pow(counts[code] / max, 0.6) : 0;
}

function updateHeat(changedCode) {
  const max = Math.max(1, ...Object.values(counts));
  if (changedCode) {
    // 최댓값이 바뀌면 전체 재계산, 아니면 해당 키만
    if (counts[changedCode] === max) {
      for (const code in counts) {
        keyEls[code]?.style.setProperty("--heat", (heatRatio(code, max) * 0.75).toFixed(3));
      }
    } else {
      keyEls[changedCode]?.style.setProperty("--heat", (heatRatio(changedCode, max) * 0.75).toFixed(3));
    }
  } else {
    for (const code in keyEls) {
      keyEls[code].style.setProperty("--heat", (heatRatio(code, max) * 0.75).toFixed(3));
    }
  }
}

function favoriteKey() {
  let best = null, bestN = 0;
  for (const [code, n] of Object.entries(counts)) {
    if (n > bestN) { best = code; bestN = n; }
  }
  if (!best) return "-";
  const label = keyEls[best]?.textContent || best;
  return label === "" ? "Space" : label;
}

function updateStats() {
  $("statTotal").textContent = total.toLocaleString();
  $("statFav").textContent = favoriteKey();
}

setInterval(() => {
  const cutoff = Date.now() - 60000;
  stamps = stamps.filter((s) => s > cutoff);
  $("statKpm").textContent = stamps.length;
}, 1000);

/* ---------- 컨트롤 ---------- */

document.querySelectorAll(".sw-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    profile = btn.dataset.profile;
    document.querySelectorAll(".sw-btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", String(b === btn));
    });
    initAudio();
    playKey(false, false); // 시타
  });
});

$("volume").addEventListener("input", () => {
  if (master) master.gain.value = Number($("volume").value) / 100;
});

$("heatToggle").addEventListener("click", () => {
  const on = document.body.classList.toggle("heat-on");
  $("heatToggle").setAttribute("aria-pressed", String(on));
});

$("heatReset").addEventListener("click", () => {
  counts = {};
  total = 0;
  stamps = [];
  for (const code in keyEls) keyEls[code].style.setProperty("--heat", "0");
  updateStats();
  saveState();
});

/* ---------- 저장/복원 ---------- */

function saveState() {
  try {
    localStorage.setItem("kbsim", JSON.stringify({ counts, total, profile }));
  } catch (_) {}
}
setInterval(saveState, 3000);
window.addEventListener("beforeunload", saveState);

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem("kbsim"));
    if (!s) return;
    counts = s.counts || {};
    total = s.total || 0;
    if (PROFILES[s.profile]) {
      profile = s.profile;
      document.querySelectorAll(".sw-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.profile === profile);
        b.setAttribute("aria-selected", String(b.dataset.profile === profile));
      });
    }
  } catch (_) {}
}

/* ---------- 초기화 ---------- */

renderKeyboard();
loadState();
updateHeat();
updateStats();
