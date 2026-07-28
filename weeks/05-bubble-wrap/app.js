'use strict';

/* =========================================================
   가상 해우소 — 뽁뽁이 · 접시 깨기 · 종이 던지기
   모든 소리는 Web Audio API 실시간 합성 (음원 파일 0개)
   ========================================================= */

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------------- Audio ---------------- */
const Sound = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let muted = localStorage.getItem('haewooso-muted') === '1';

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 20;
      comp.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(comp);
      comp.connect(ctx.destination);

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // pan 지원 없는 브라우저(구형 사파리)는 그냥 master로 직결
  function outNode(pan) {
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      p.connect(master);
      return p;
    }
    return master;
  }

  function noiseSrc() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.loopStart = Math.random() * 0.5;
    return src;
  }

  // 짧은 필터드 노이즈 버스트 (뽁, 바스락, 파열음의 재료)
  function burst({ at = 0, dur = 0.05, freq = 2000, q = 1, gain = 0.4, type = 'bandpass', pan = 0 }) {
    const t = ctx.currentTime + at;
    const src = noiseSrc();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(outNode(pan));
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // 감쇠하는 순음 (뽁의 몸통, 접시의 울림 재료)
  function tone({ at = 0, dur = 0.1, from = 400, to = null, gain = 0.3, type = 'sine', pan = 0 }) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(outNode(pan));
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  return {
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      localStorage.setItem('haewooso-muted', muted ? '1' : '0');
      if (ctx) master.gain.value = muted ? 0 : 0.9;
      return muted;
    },

    // 뽁: 노이즈 클릭 + 피치 떨어지는 짧은 몸통
    pop(pan = 0) {
      if (!ensure()) return;
      const p = rand(0.85, 1.18);
      burst({ dur: 0.035, freq: rand(1600, 3400), q: 1.4, gain: 0.5, pan });
      tone({ dur: 0.08, from: 380 * p, to: 130 * p, gain: 0.4, pan });
      tone({ dur: 0.05, from: 900 * p, to: 500 * p, gain: 0.12, type: 'triangle', pan });
    },

    // 쨍그랑: 타격 노이즈 + 비조화 도자기 배음 + 지연된 파편 소리
    crash(pan = 0) {
      if (!ensure()) return;
      burst({ dur: 0.12, freq: 1400, q: 0.6, gain: 0.65, type: 'highpass', pan });
      burst({ dur: 0.06, freq: rand(2500, 4500), q: 2, gain: 0.4, pan });
      const base = rand(750, 1350);
      const partials = [1, 1.83, 2.71, 3.92, 5.12, 6.37];
      partials.forEach((m) => {
        tone({
          at: rand(0, 0.015),
          dur: rand(0.35, 0.95),
          from: base * m * rand(0.98, 1.02),
          gain: 0.14 / Math.sqrt(m),
          type: m < 3 ? 'triangle' : 'sine',
          pan: pan + rand(-0.4, 0.4),
        });
      });
      const tinkles = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < tinkles; i++) {
        tone({
          at: rand(0.05, 0.45),
          dur: rand(0.08, 0.22),
          from: rand(2200, 6400),
          gain: rand(0.04, 0.1),
          pan: rand(-0.8, 0.8),
        });
      }
    },

    // 바스락: 짧은 크래클 연타
    crumple() {
      if (!ensure()) return;
      const n = 10 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        burst({
          at: (i / n) * 0.35 + rand(0, 0.03),
          dur: rand(0.015, 0.035),
          freq: rand(1800, 6000),
          q: rand(1, 3),
          gain: rand(0.1, 0.28),
          pan: rand(-0.3, 0.3),
        });
      }
    },

    // 휙: 노이즈 스윕
    whoosh() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const src = noiseSrc();
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(350, t);
      f.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      src.connect(f);
      f.connect(g);
      g.connect(outNode(0));
      src.start(t);
      src.stop(t + 0.5);
    },

    // 텅: 쓰레기통 착지
    thud() {
      if (!ensure()) return;
      burst({ dur: 0.09, freq: 350, q: 0.8, gain: 0.5, type: 'lowpass' });
      tone({ dur: 0.16, from: 130, to: 65, gain: 0.45 });
      tone({ dur: 0.12, from: rand(420, 520), gain: 0.1, type: 'triangle' });
    },

    // 완파 팡파레
    fanfare() {
      if (!ensure()) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ at: i * 0.09, dur: 0.35, from: f, gain: 0.18, type: 'triangle' });
      });
    },
  };
})();

/* ---------------- Stats ---------------- */
const Stats = (() => {
  const KEY = 'haewooso-stats-v1';
  const todayStr = new Date().toISOString().slice(0, 10);
  let data = { total: { pops: 0, plates: 0, papers: 0 }, today: { date: todayStr, pops: 0, plates: 0, papers: 0 } };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.total) {
      data.total = { pops: 0, plates: 0, papers: 0, ...saved.total };
      if (saved.today && saved.today.date === todayStr) data.today = saved.today;
    }
  } catch (e) { /* 손상된 저장값은 초기화 */ }

  const els = {
    pops: document.getElementById('statPops'),
    plates: document.getElementById('statPlates'),
    papers: document.getElementById('statPapers'),
    totalPops: document.getElementById('totalPops'),
    totalPlates: document.getElementById('totalPlates'),
    totalPapers: document.getElementById('totalPapers'),
  };

  function render() {
    els.pops.textContent = data.today.pops;
    els.plates.textContent = data.today.plates;
    els.papers.textContent = data.today.papers;
    els.totalPops.textContent = data.total.pops;
    els.totalPlates.textContent = data.total.plates;
    els.totalPapers.textContent = data.total.papers;
  }

  function bump(kind) {
    data.total[kind]++;
    data.today[kind]++;
    localStorage.setItem(KEY, JSON.stringify(data));
    render();
    return data.today[kind];
  }

  render();
  return { bump, today: () => data.today };
})();

/* ---------------- Mute ---------------- */
const muteBtn = document.getElementById('muteBtn');
function renderMute() {
  muteBtn.textContent = Sound.muted ? '🔇' : '🔊';
  muteBtn.classList.toggle('muted', Sound.muted);
}
muteBtn.addEventListener('click', () => { Sound.toggleMute(); renderMute(); });
renderMute();

/* ---------------- Tabs ---------------- */
const tabs = document.querySelectorAll('.tab');
function activate(mode) {
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === mode)));
  document.querySelectorAll('.mode').forEach((s) => { s.hidden = s.id !== 'mode-' + mode; });
  localStorage.setItem('haewooso-mode', mode);
  if (mode === 'bubble' && sheetDirty) buildSheet();
}
tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.mode)));

/* ---------------- 뽁뽁이 ---------------- */
const sheet = document.getElementById('sheet');
const doneBanner = document.getElementById('doneBanner');
const bubbleMsg = document.getElementById('bubbleMsg');
const SHEET_TARGET = 126;
let remaining = 0;
let sheetDirty = true;

const POP_LINES = [
  [500, '500뽁… 내일도 뽁뽁이는 여기 있어요.'],
  [300, '300뽁. 이 정도면 전문가입니다.'],
  [200, '200뽁. 여기가 당신의 안식처군요.'],
  [100, '100뽁 돌파. 오늘 좀 힘드셨구나.'],
  [50, '50뽁. 무슨 일 있으셨어요?'],
  [25, '25뽁. 손이 풀리기 시작했어요.'],
  [1, '첫 뽁. 시작이 좋아요.'],
];

function buildSheet() {
  if (document.getElementById('mode-bubble').hidden) { sheetDirty = true; return; }
  sheetDirty = false;
  sheet.innerHTML = '';
  doneBanner.hidden = true;
  // 열 수를 실측해 마지막 줄까지 꽉 채운다
  const probe = document.createElement('button');
  probe.className = 'bubble';
  probe.setAttribute('aria-label', '뽁뽁이');
  sheet.appendChild(probe);
  let cols = getComputedStyle(sheet).gridTemplateColumns.split(' ').filter((s) => s.endsWith('px')).length;
  if (!cols || cols < 2) cols = 9;
  const count = cols * Math.max(1, Math.round(SHEET_TARGET / cols));
  remaining = count;
  for (let i = 1; i < count; i++) {
    const b = document.createElement('button');
    b.className = 'bubble';
    b.setAttribute('aria-label', '뽁뽁이');
    sheet.appendChild(b);
  }
}

function popBubble(el) {
  if (!el || !el.classList.contains('bubble') || el.classList.contains('popped')) return;
  el.classList.add('popped');
  remaining--;
  const rect = el.getBoundingClientRect();
  const pan = ((rect.left + rect.width / 2) / window.innerWidth - 0.5) * 1.6;
  Sound.pop(pan);
  const count = Stats.bump('pops');
  const line = POP_LINES.find(([n]) => count === n);
  if (line) bubbleMsg.textContent = line[1];
  if (remaining === 0) {
    doneBanner.hidden = false;
    Sound.fanfare();
    bubbleMsg.textContent = '한 판을 다 터뜨렸습니다. 대단한 집중력이에요.';
  }
}

let dragging = false;
sheet.addEventListener('pointerdown', (e) => {
  dragging = true;
  popBubble(document.elementFromPoint(e.clientX, e.clientY));
});
sheet.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  e.preventDefault();
  popBubble(document.elementFromPoint(e.clientX, e.clientY));
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointercancel', () => { dragging = false; });
// 키보드(Enter/Space) 접근
sheet.addEventListener('click', (e) => {
  if (e.detail === 0) popBubble(e.target);
});

document.getElementById('refillBtn').addEventListener('click', buildSheet);
document.getElementById('doneRefill').addEventListener('click', buildSheet);

/* ---------------- 접시 깨기 ---------------- */
const plate = document.getElementById('plate');
const plateStage = document.getElementById('plateStage');
const plateMsg = document.getElementById('plateMsg');
let smashing = false;

const PLATE_LINES = {
  1: '쨍그랑! 첫 접시가 깨졌습니다.',
  2: '괜찮아요, 가상 접시는 무한리필이니까.',
  3: '3장째. 점점 시원해지죠?',
  5: '5장. 그릇 가게 사장님도 응원합니다.',
  10: '10장 돌파. 오늘의 설거지는 없던 걸로.',
  20: '20장. 이 정도면 화목한 그릇 정리.',
  50: '50장. 접시계의 큰손이시군요.',
};
const PLATE_POOL = ['쨍그랑!', '와장창!', '시원-하다.', '산산조각.', '한 장 더요?', '속이 뻥 뚫리는 소리.'];

function smashPlate() {
  if (smashing) return;
  smashing = true;

  const stageRect = plateStage.getBoundingClientRect();
  const plateRect = plate.getBoundingClientRect();
  const cx = plateRect.left - stageRect.left + plateRect.width / 2;
  const cy = plateRect.top - stageRect.top + plateRect.height / 2;

  plate.classList.add('hidden');
  plate.classList.remove('respawn');
  Sound.crash(0);

  const shardCount = 14 + Math.floor(Math.random() * 5);
  for (let i = 0; i < shardCount; i++) {
    const s = document.createElement('div');
    s.className = 'shard';
    const size = rand(9, 26);
    s.style.width = size + 'px';
    s.style.height = size * rand(0.6, 1) + 'px';
    s.style.left = cx - size / 2 + 'px';
    s.style.top = cy - size / 2 + 'px';
    const p1 = `${rand(0, 40)}% 0%`;
    const p2 = `100% ${rand(0, 50)}%`;
    const p3 = `${rand(30, 100)}% 100%`;
    const p4 = `0% ${rand(50, 100)}%`;
    s.style.clipPath = Math.random() < 0.5
      ? `polygon(${p1}, ${p2}, ${p3})`
      : `polygon(${p1}, ${p2}, ${p3}, ${p4})`;
    plateStage.appendChild(s);

    const angle = rand(0, Math.PI * 2);
    const dist = rand(60, stageRect.width / 2 - 10);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.6 + rand(40, 110); // 중력 느낌으로 아래쪽 가중
    const anim = s.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.7}px, ${dy * 0.5 - 30}px) rotate(${rand(-360, 360)}deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rand(-720, 720)}deg)`, opacity: 0 },
      ],
      { duration: rand(550, 900), easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }
    );
    anim.onfinish = () => s.remove();
  }

  const count = Stats.bump('plates');
  plateMsg.textContent = PLATE_LINES[count] || pick(PLATE_POOL);

  setTimeout(() => {
    plate.classList.remove('hidden');
    plate.classList.add('respawn');
    smashing = false;
  }, 700);
}

plate.addEventListener('pointerdown', smashPlate);
plate.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); smashPlate(); }
});

/* ---------------- 종이 던지기 ---------------- */
const paperText = document.getElementById('paperText');
const throwBtn = document.getElementById('throwBtn');
const bin = document.getElementById('bin');
const paperMsg = document.getElementById('paperMsg');
let throwing = false;

const PLACEHOLDERS = [
  '오늘 나를 힘들게 한 것',
  '말 못 한 한 마디',
  '보내지 못한 메시지',
  '지우고 싶은 오늘의 순간',
  '아무거나. 어차피 버릴 거니까',
];
paperText.placeholder = pick(PLACEHOLDERS);

const PAPER_POOL = [
  '슛— 골인.',
  '오늘의 걱정, 반납 완료.',
  '깔끔하게 들어갔습니다.',
  '빈 종이도 훌륭한 근심입니다.',
  '휴지통은 아무에게도 말하지 않습니다.',
];

function throwPaper() {
  if (throwing) return;
  throwing = true;

  const text = paperText.value.trim();
  const startRect = paperText.getBoundingClientRect();
  const ball = document.createElement('div');
  ball.className = 'paper-ball';
  const startX = startRect.left + startRect.width / 2 - 26;
  const startY = startRect.top + startRect.height / 2 - 26;
  ball.style.left = startX + 'px';
  ball.style.top = startY + 'px';
  document.body.appendChild(ball);

  Sound.crumple();
  paperText.value = '';
  paperText.placeholder = pick(PLACEHOLDERS);

  const crumple = ball.animate(
    [
      { transform: 'scale(1.6) rotate(0deg)', opacity: 0.9 },
      { transform: 'scale(0.9) rotate(-14deg)' },
      { transform: 'scale(1.1) rotate(10deg)' },
      { transform: 'scale(1) rotate(0deg)', opacity: 1 },
    ],
    { duration: 380, easing: 'ease-out' }
  );

  crumple.onfinish = () => {
    const binRect = bin.getBoundingClientRect();
    const dx = binRect.left + binRect.width / 2 - 26 - startX;
    const dy = binRect.top + binRect.height * 0.25 - 26 - startY;
    Sound.whoosh();
    const fly = ball.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 130}px) scale(0.85) rotate(200deg)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.5) rotate(380deg)`, opacity: 0.9 },
      ],
      { duration: 650, easing: 'cubic-bezier(.45,.05,.6,1)' }
    );
    fly.onfinish = () => {
      ball.remove();
      bin.classList.add('bump');
      setTimeout(() => bin.classList.remove('bump'), 400);
      Sound.thud();
      Stats.bump('papers');
      paperMsg.textContent = text
        ? `"${text.length > 14 ? text.slice(0, 14) + '…' : text}" — 잘 버렸습니다.`
        : pick(PAPER_POOL);
      throwing = false;
    };
  };
}

throwBtn.addEventListener('click', throwPaper);
paperText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) throwPaper();
});

/* ---------------- 시작 ---------------- */
// 모든 상태 선언 이후에 호출 (bubble 모드면 여기서 첫 시트를 깐다)
activate(localStorage.getItem('haewooso-mode') || 'bubble');
