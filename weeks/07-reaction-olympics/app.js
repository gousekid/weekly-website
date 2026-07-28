'use strict';

/* ---------- 공통 ---------- */
const TOTAL_MS = 60000;
const STORE_KEY = 'reaction-olympics-rank-v1';
const NAME_KEY = 'reaction-olympics-name';
const SITE_URL = 'https://gousekid.github.io/weekly-website/weeks/07-reaction-olympics/';

const $ = sel => document.querySelector(sel);
const stage = $('#stage');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
const div = cls => { const d = document.createElement('div'); d.className = cls; return d; };

let runToken = 0;
const alive = run => run === runToken;

/* ---------- 사운드 (Web Audio 합성, 파일 0개) ---------- */
let actx = null;
function ensureAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* 무음 진행 */ }
  }
  if (actx && actx.state === 'suspended') actx.resume();
}
function beep(freq = 880, dur = 0.06, type = 'square', vol = 0.05) {
  if (!actx) return;
  const t = actx.currentTime;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(actx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
const buzz = () => beep(150, 0.13, 'sawtooth', 0.05);

/* ---------- 60초 시계 (인터스티셜 제외, 종목 플레이 중에만 소모) ---------- */
const clock = {
  banked: 0,
  eventStart: 0,
  running: false,
  raf: 0,
  reset() { this.banked = 0; this.running = false; cancelAnimationFrame(this.raf); this.render(); },
  startEvent() {
    this.eventStart = performance.now();
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  },
  endEvent() {
    this.banked += performance.now() - this.eventStart;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.render();
  },
  now() { return this.banked + (this.running ? performance.now() - this.eventStart : 0); },
  remaining() { return Math.max(0, TOTAL_MS - this.now()); },
  render() {
    const rem = this.remaining();
    $('#hud-sec').textContent = (rem / 1000).toFixed(1);
    $('#hud-bar-fill').style.transform = `scaleX(${rem / TOTAL_MS})`;
  },
};
const evElapsed = () => performance.now() - clock.eventStart;

/* ---------- 화면 전환 ---------- */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
}

/* ---------- 랭킹 (localStorage) ---------- */
function loadRank() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
}
function saveRank(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* 무시 */ }
}
let lastSavedT = 0;

function renderIntro() {
  const list = loadRank();
  const best = $('#intro-best');
  const rankSec = $('#intro-ranking');
  if (!list.length) { best.hidden = true; rankSec.hidden = true; return; }
  const top = list[0];
  best.hidden = false;
  best.innerHTML = `🏆 최고 기록 <b>${top.s}점</b> — ${tierOf(top.s).title}`;
  rankSec.hidden = false;
  const ol = $('#ranking-list');
  ol.innerHTML = '';
  list.forEach((e, i) => {
    const li = document.createElement('li');
    if (e.t === lastSavedT) li.classList.add('mine');
    li.innerHTML = `<span class="rank">${i + 1}</span><span class="name"></span><span class="pts">${e.s}점</span><span class="date">${e.d}</span>`;
    li.querySelector('.name').textContent = e.n;
    ol.appendChild(li);
  });
}

/* ---------- 등급 ---------- */
const TIERS = [
  { min: 440, medal: '🥇', title: '인간 번개' },
  { min: 380, medal: '🥇', title: '금메달리스트' },
  { min: 310, medal: '🥈', title: '은빛 반사신경' },
  { min: 230, medal: '🥉', title: '값진 동메달' },
  { min: 140, medal: '🏅', title: '국가대표 유망주' },
  { min: 0, medal: '🐢', title: '거북이 꿈나무' },
];
const tierOf = s => TIERS.find(t => s >= t.min);

/* ---------- 종목 정의 ---------- */
const EVENTS = [
  { key: 'sprint', no: 1, ico: '🏃', name: '스타트 반응', desc: '빨간불에서 대기, 초록불이 켜지는 순간 화면을 터치! 3회 평균으로 채점합니다.', cap: 10000, run: runSprint },
  { key: 'hunt', no: 2, ico: '🎯', name: '과녁 사냥', desc: '나타나는 과녁 8개를 최대한 빨리 터치해 격추하세요.', cap: 14000, run: runHunt },
  { key: 'stroop', no: 3, ico: '🎨', name: '색깔 심판', desc: '글자의 뜻과 글자의 색이 같으면 O, 다르면 X! 총 8문제.', cap: 14000, run: runStroop },
  { key: 'relay', no: 4, ico: '🔢', name: '숫자 계주', desc: '흩어진 숫자를 1부터 9까지 순서대로 터치하세요. 잘못 누르면 시간 페널티!', cap: 12000, run: runRelay },
  { key: 'archery', no: 5, ico: '🏹', name: '양궁 타이밍', desc: '조준선이 금색 정중앙을 지나는 순간 터치! 3발, 갈수록 빨라집니다.', cap: 10000, run: runArchery },
];

/* ---------- 게임 진행 ---------- */
let totalScore = 0;
let results = [];

async function startGame() {
  const run = ++runToken;
  totalScore = 0;
  results = [];
  clock.reset();
  updateHudScore();
  showScreen('game');

  for (const ev of EVENTS) {
    $('#hud-event-no').textContent = `${ev.no}/5`;
    $('#hud-event-name').textContent = ev.name;
    await showInterstitial(ev, run);
    if (!alive(run)) return;

    clock.startEvent();
    const res = await ev.run(run, ev.cap);
    if (!alive(run)) return;
    clock.endEvent();

    results.push({ ev, score: res.score, detail: res.detail });
    totalScore += res.score;
    updateHudScore();
    await showEventScore(ev, res, run);
    if (!alive(run)) return;
  }
  showResult();
}

function updateHudScore() {
  $('#hud-score').textContent = `${totalScore}점`;
}

async function showInterstitial(ev, run) {
  stage.innerHTML = '';
  const el = div('interstitial');
  el.innerHTML = `<span class="ico">${ev.ico}</span><h3>종목 ${ev.no} · ${ev.name}</h3><p>${ev.desc}</p><div class="count" id="int-count">3</div>`;
  stage.appendChild(el);
  for (const n of [3, 2, 1]) {
    if (!alive(run)) return;
    $('#int-count').textContent = n;
    beep(n === 1 ? 880 : 660, 0.07, 'sine', 0.05);
    await sleep(650);
  }
}

async function showEventScore(ev, res, run) {
  stage.innerHTML = '';
  const el = div('interstitial');
  el.innerHTML = `<span class="ico">${ev.ico}</span><h3>+${res.score}점</h3><p>${res.detail}</p>`;
  stage.appendChild(el);
  beep(980, 0.12, 'triangle', 0.06);
  if (alive(run)) await sleep(950);
}

/* ---------- 종목 1: 스타트 반응 ---------- */
function sprintRound(el, waitMs) {
  return new Promise(resolve => {
    let phase = 'wait';
    let t0 = 0;
    let goTimer = 0, missTimer = 0;
    const finish = v => {
      el.removeEventListener('pointerdown', onTap);
      window.removeEventListener('keydown', onKey);
      clearTimeout(goTimer);
      clearTimeout(missTimer);
      resolve(v);
    };
    const onTap = () => {
      if (phase === 'wait') finish({ type: 'false' });
      else finish({ type: 'hit', rt: performance.now() - t0 });
    };
    const onKey = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); onTap(); } };
    el.addEventListener('pointerdown', onTap);
    window.addEventListener('keydown', onKey);
    goTimer = setTimeout(() => {
      phase = 'go';
      el.className = 'sprint go';
      $('#sp-msg').textContent = '지금!!';
      beep(1150, 0.09, 'square', 0.07);
      t0 = performance.now();
      missTimer = setTimeout(() => finish({ type: 'miss' }), 1200);
    }, waitMs);
  });
}

async function runSprint(run, cap) {
  stage.innerHTML = '';
  const el = div('sprint wait');
  el.innerHTML = `<div class="light"></div><h3 id="sp-msg"></h3><p>초록불이 켜지면 즉시 터치! (스페이스바 가능)</p><div class="round-log" id="sp-log"></div>`;
  stage.appendChild(el);
  const log = $('#sp-log');
  const addLog = (text, bad) => {
    const s = document.createElement('span');
    s.textContent = text;
    if (bad) s.classList.add('bad');
    log.appendChild(s);
  };
  const times = [];

  for (let r = 0; r < 3; r++) {
    if (!alive(run)) return { score: 0, detail: '' };
    if (evElapsed() > cap - 1600) { times.push(1000); addLog('시간부족', true); continue; }
    el.className = 'sprint wait';
    $('#sp-msg').textContent = `${r + 1}번째 출발 대기…`;
    const out = await sprintRound(el, 800 + Math.random() * 1000);
    if (!alive(run)) return { score: 0, detail: '' };
    if (out.type === 'false') { times.push(800); addLog('부정출발!', true); buzz(); }
    else if (out.type === 'miss') { times.push(1000); addLog('늦음', true); buzz(); }
    else {
      const rt = Math.round(out.rt);
      times.push(rt);
      addLog(`${rt}ms`, false);
      beep(1400, 0.06, 'triangle', 0.06);
    }
    await sleep(380);
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const score = clamp(Math.round((450 - avg) / 3), 0, 100);
  return { score, detail: `평균 반응속도 ${avg}ms` };
}

/* ---------- 종목 2: 과녁 사냥 ---------- */
async function runHunt(run, cap) {
  stage.innerHTML = '';
  const el = div('hunt');
  el.innerHTML = `<p class="hint" id="hunt-hint">0 / 8 격추</p>`;
  stage.appendChild(el);
  const times = [];
  let hits = 0;

  for (let i = 0; i < 8; i++) {
    if (!alive(run)) return { score: 0, detail: '' };
    if (cap - evElapsed() < 500) break;
    const t = div('target');
    t.style.left = `${12 + Math.random() * 76}%`;
    t.style.top = `${10 + Math.random() * 68}%`;
    el.appendChild(t);
    const t0 = performance.now();
    const hit = await new Promise(res => {
      const to = setTimeout(() => done(false), Math.min(2500, Math.max(300, cap - evElapsed())));
      const done = ok => { clearTimeout(to); t.removeEventListener('pointerdown', h); res(ok); };
      const h = e => { e.stopPropagation(); done(true); };
      t.addEventListener('pointerdown', h);
    });
    t.remove();
    if (!alive(run)) return { score: 0, detail: '' };
    if (hit) {
      hits++;
      times.push(performance.now() - t0);
      beep(860 + hits * 45, 0.05, 'square', 0.06);
    } else {
      times.push(1500);
    }
    $('#hunt-hint').textContent = `${hits} / 8 격추`;
    await sleep(110);
  }
  while (times.length < 8) times.push(1500);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / 8);
  const score = clamp(Math.round((1150 - avg) / 8), 0, 100);
  return { score, detail: `${hits}/8 격추 · 평균 ${avg}ms` };
}

/* ---------- 종목 3: 색깔 심판 ---------- */
const SCOLORS = [
  { name: '빨강', hex: '#ff5a5a' },
  { name: '파랑', hex: '#4c8dff' },
  { name: '초록', hex: '#3ddc84' },
  { name: '노랑', hex: '#ffd23f' },
];

async function runStroop(run, cap) {
  stage.innerHTML = '';
  const el = div('stroop');
  el.innerHTML = `
    <p class="prompt">글자의 <b>뜻</b>과 글자의 <b>색</b>이 같으면 O!</p>
    <div class="word-box"><span class="word" id="st-word"></span></div>
    <p class="progress" id="st-prog"></p>
    <div class="answers">
      <button type="button" class="yes" id="st-yes">O<small>일치</small></button>
      <button type="button" class="no" id="st-no">X<small>불일치</small></button>
    </div>`;
  stage.appendChild(el);
  const yes = $('#st-yes');
  const no = $('#st-no');
  let pts = 0, correct = 0, asked = 0;

  for (let i = 0; i < 8; i++) {
    if (!alive(run)) return { score: 0, detail: '' };
    if (evElapsed() > cap - 900) break;
    asked++;
    const word = pick(SCOLORS);
    const match = Math.random() < 0.5;
    const ink = match ? word : pick(SCOLORS.filter(c => c !== word));
    const w = $('#st-word');
    w.textContent = word.name;
    w.style.color = ink.hex;
    $('#st-prog').textContent = `${i + 1} / 8`;
    const t0 = performance.now();
    const ans = await new Promise(res => {
      const to = setTimeout(() => fin(null), Math.min(2600, Math.max(300, cap - evElapsed())));
      const fin = v => {
        clearTimeout(to);
        yes.removeEventListener('pointerdown', hy);
        no.removeEventListener('pointerdown', hn);
        res(v);
      };
      const hy = () => fin(true);
      const hn = () => fin(false);
      yes.addEventListener('pointerdown', hy);
      no.addEventListener('pointerdown', hn);
    });
    if (!alive(run)) return { score: 0, detail: '' };
    const rt = performance.now() - t0;
    const right = ans !== null && ans === match;
    if (right) {
      correct++;
      pts += 12.5 * clamp((1600 - rt) / 1200, 0.25, 1);
      el.classList.add('flash-good');
      beep(1000, 0.05, 'triangle', 0.06);
    } else {
      el.classList.add('flash-bad');
      buzz();
    }
    setTimeout(() => el.classList.remove('flash-good', 'flash-bad'), 230);
    await sleep(160);
  }
  return { score: clamp(Math.round(pts), 0, 100), detail: `${correct}/${asked || 8} 정답` };
}

/* ---------- 종목 4: 숫자 계주 ---------- */
async function runRelay(run, cap) {
  stage.innerHTML = '';
  const el = div('relay');
  el.innerHTML = `<p class="hint" id="relay-hint">다음: 1</p>`;
  stage.appendChild(el);

  const cells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  for (let n = 1; n <= 9; n++) {
    const cell = cells[n - 1];
    const cx = (cell % 3) * 31 + 19.5 + (Math.random() * 10 - 5);
    const cy = Math.floor(cell / 3) * 27 + 15 + (Math.random() * 8 - 4);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'num';
    b.textContent = n;
    b.style.left = `${cx}%`;
    b.style.top = `${cy}%`;
    el.appendChild(b);
  }

  let next = 1, wrongs = 0;
  const t0 = performance.now();
  const finished = await new Promise(res => {
    const to = setTimeout(() => fin(false), Math.max(500, cap - evElapsed()));
    const fin = ok => { clearTimeout(to); el.removeEventListener('pointerdown', h); res(ok); };
    const h = e => {
      const b = e.target.closest('.num');
      if (!b || b.classList.contains('done')) return;
      if (+b.textContent === next) {
        b.classList.add('done');
        beep(560 + next * 65, 0.05, 'square', 0.06);
        next++;
        $('#relay-hint').textContent = next <= 9 ? `다음: ${next}` : '완주! 🎉';
        if (next > 9) fin(true);
      } else {
        wrongs++;
        b.classList.add('shake');
        setTimeout(() => b.classList.remove('shake'), 220);
        buzz();
      }
    };
    el.addEventListener('pointerdown', h);
  });
  if (!alive(run)) return { score: 0, detail: '' };

  if (!finished) {
    const done = next - 1;
    return { score: Math.round((done / 9) * 40), detail: `${done}/9까지 도달` };
  }
  const t = performance.now() - t0 + wrongs * 250;
  const score = clamp(Math.round((12500 - t) / 85), 0, 100);
  const wrongNote = wrongs ? ` · 실수 ${wrongs}회` : '';
  return { score, detail: `${(t / 1000).toFixed(1)}초 완주${wrongNote}` };
}

/* ---------- 종목 5: 양궁 타이밍 ---------- */
async function runArchery(run, cap) {
  stage.innerHTML = '';
  const el = div('archery');
  el.innerHTML = `
    <h3>🏹 정중앙을 노려라</h3>
    <div class="shots" id="ar-shots"><span>1발 —</span><span>2발 —</span><span>3발 —</span></div>
    <div class="lane"><div class="needle" id="ar-needle"></div></div>
    <div class="shot-result" id="ar-res"></div>
    <p class="desc">조준선이 금색 정중앙을 지날 때 터치! (스페이스바 가능)</p>`;
  stage.appendChild(el);
  const needle = $('#ar-needle');
  const shotEls = $('#ar-shots').children;
  const freqs = [0.55, 0.78, 1.05];
  const scores = [];

  for (let s = 0; s < 3; s++) {
    if (!alive(run)) return { score: 0, detail: '' };
    if (evElapsed() > cap - 1200) { scores.push(0); shotEls[s].textContent = `${s + 1}발 0점`; continue; }
    const pts = await new Promise(res => {
      const t0 = performance.now();
      let raf = 0, pos = 0;
      const to = setTimeout(() => fin(null), Math.min(3200, Math.max(500, cap - evElapsed())));
      const step = () => {
        const t = (performance.now() - t0) / 1000;
        pos = (Math.sin(2 * Math.PI * freqs[s] * t - Math.PI / 2) + 1) / 2;
        needle.style.left = `${pos * 100}%`;
        raf = requestAnimationFrame(step);
      };
      const fin = v => {
        clearTimeout(to);
        cancelAnimationFrame(raf);
        el.removeEventListener('pointerdown', h);
        window.removeEventListener('keydown', k);
        res(v);
      };
      const h = () => fin(Math.max(0, Math.round(100 - Math.abs(pos - 0.5) * 250)));
      const k = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); h(); } };
      el.addEventListener('pointerdown', h);
      window.addEventListener('keydown', k);
      step();
    });
    if (!alive(run)) return { score: 0, detail: '' };
    const p = pts ?? 0;
    scores.push(p);
    shotEls[s].textContent = `${s + 1}발 ${p}점`;
    $('#ar-res').textContent =
      pts === null ? '시간 초과…' :
      p >= 93 ? '🎯 정중앙!' :
      p >= 75 ? '명중!' :
      p >= 45 ? '아깝다!' : '빗나감…';
    if (p >= 75) beep(1250, 0.1, 'triangle', 0.07); else buzz();
    await sleep(480);
  }
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / 3);
  return { score, detail: `최고 ${Math.max(...scores)}점 명중` };
}

/* ---------- 결과 ---------- */
function showResult() {
  const tier = tierOf(totalScore);
  $('#result-medal').textContent = tier.medal;
  $('#result-title').textContent = tier.title;
  $('#result-total').innerHTML = `${totalScore}<small> / 500</small>`;
  $('#result-time').textContent = `총 경기 시간 ${(clock.banked / 1000).toFixed(1)}초`;

  const ul = $('#result-breakdown');
  ul.innerHTML = '';
  results.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${r.ev.ico}</span><span>${r.ev.name}</span><span class="bar"><i style="width:0%"></i></span><span class="pts">${r.score}</span>`;
    li.title = r.detail;
    ul.appendChild(li);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      li.querySelector('.bar i').style.width = `${r.score}%`;
    }));
  });

  const list = loadRank();
  const qualifies = list.length < 10 || totalScore > list[list.length - 1].s;
  const entry = $('#result-name-entry');
  entry.hidden = !qualifies;
  if (qualifies) {
    const input = $('#name-input');
    input.value = localStorage.getItem(NAME_KEY) || '';
    $('#btn-save-record').disabled = false;
    $('#btn-save-record').textContent = '등재';
  }
  showScreen('result');
  if (totalScore >= 310) {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'triangle', 0.06), i * 130));
  }
}

function saveRecord() {
  const name = ($('#name-input').value.trim() || '이름없는 선수').slice(0, 10);
  try { localStorage.setItem(NAME_KEY, name); } catch { /* 무시 */ }
  const d = new Date();
  const ds = `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  lastSavedT = Date.now();
  const list = loadRank();
  list.push({ n: name, s: totalScore, d: ds, t: lastSavedT });
  list.sort((a, b) => b.s - a.s);
  saveRank(list.slice(0, 10));
  const btn = $('#btn-save-record');
  btn.disabled = true;
  btn.textContent = '등재 완료!';
  beep(1047, 0.15, 'triangle', 0.06);
}

async function shareResult() {
  const tier = tierOf(totalScore);
  const line = results.map(r => `${r.ev.ico}${r.score}`).join(' ');
  const text = `🏟️ 1분 반응속도 올림픽 — ${totalScore}/500 (${tier.title})\n${line}\n${SITE_URL}`;
  const btn = $('#btn-share');
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = '복사 완료!';
  } catch {
    btn.textContent = '복사 실패 😢';
  }
  setTimeout(() => { btn.textContent = '결과 복사'; }, 1500);
}

/* ---------- 바인딩 ---------- */
$('#btn-start').addEventListener('click', () => { ensureAudio(); startGame(); });
$('#btn-retry').addEventListener('click', () => { ensureAudio(); startGame(); });
$('#btn-home').addEventListener('click', () => { runToken++; renderIntro(); showScreen('intro'); });
$('#btn-share').addEventListener('click', shareResult);
$('#btn-save-record').addEventListener('click', saveRecord);
$('#name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !$('#btn-save-record').disabled) saveRecord();
});

renderIntro();
