(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const holder = $('stageHolder');

  // ---------- 시간 (?t=HH:MM 으로 QA용 시각 고정) ----------
  const tParam = new URLSearchParams(location.search).get('t');
  const tOverride = (() => {
    if (!tParam) return null;
    const m = tParam.match(/^(\d{1,2}):(\d{2})$/);
    return m ? { h: +m[1] % 24, m: +m[2] % 60 } : null;
  })();

  function nowParts() {
    const d = new Date();
    const h = tOverride ? tOverride.h : d.getHours();
    const m = tOverride ? tOverride.m : d.getMinutes();
    const s = d.getSeconds();
    return { h, m, s, t: h + m / 60 + s / 3600 };
  }

  // ---------- 하늘 색 키프레임: [시각, 윗색, 아랫색, 햇빛 0~1] ----------
  const SKY = [
    [0.0, '#060a1e', '#141d3a', 0],
    [5.0, '#060a1e', '#141d3a', 0],
    [6.0, '#2c2a55', '#7a4a63', 0.15],
    [7.0, '#5a7ec2', '#f2a984', 0.55],
    [8.5, '#79b7e6', '#c3e3f4', 0.95],
    [12.0, '#6fb4e8', '#cfeaf7', 1],
    [16.5, '#6aa9e0', '#c8e2ef', 0.95],
    [18.0, '#7a6fc0', '#f2a06b', 0.75],
    [19.3, '#43315f', '#d96a4f', 0.35],
    [20.3, '#10122e', '#2a2547', 0.06],
    [21.0, '#060a1e', '#141d3a', 0],
    [24.0, '#060a1e', '#141d3a', 0],
  ];

  const hex2rgb = (hx) => [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgbStr = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  function skyAt(t) {
    let i = 0;
    while (i < SKY.length - 2 && SKY[i + 1][0] <= t) i++;
    const [t0, top0, bot0, d0] = SKY[i];
    const [t1, top1, bot1, d1] = SKY[i + 1];
    const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    return {
      top: rgbStr(mix(hex2rgb(top0), hex2rgb(top1), k)),
      bottom: rgbStr(mix(hex2rgb(bot0), hex2rgb(bot1), k)),
      daylight: d0 + (d1 - d0) * k,
    };
  }

  // ---------- 상태 ----------
  const store = {
    get: (k) => { try { return localStorage.getItem('room4.' + k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem('room4.' + k, v); } catch { /* 무시 */ } },
  };
  const state = {
    lamp: store.get('lamp') === '1',
    monitor: store.get('monitor') === '1',
    radio: false,
    catAwake: false,
  };

  // ---------- 오디오 (전부 실시간 합성, 음원 파일 없음) ----------
  const AudioEngine = {
    ctx: null,
    master: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    env(gainNode, t0, peak, attack, dur) {
      const g = gainNode.gain;
      g.setValueAtTime(0.0001, t0);
      g.linearRampToValueAtTime(peak, t0 + attack);
      g.exponentialRampToValueAtTime(0.0001, t0 + dur);
    },
    click(freqFrom, freqTo) {
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freqFrom, t0);
      o.frequency.exponentialRampToValueAtTime(freqTo, t0 + 0.045);
      this.env(g, t0, 0.12, 0.004, 0.06);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.08);
    },
    pip(freq) {
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      this.env(g, t0, 0.1, 0.01, 0.12);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.14);
    },
    meow() {
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime;
      const k = 0.9 + Math.random() * 0.3;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(330 * k, t0);
      o.frequency.linearRampToValueAtTime(640 * k, t0 + 0.16);
      o.frequency.linearRampToValueAtTime(290 * k, t0 + 0.5);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 2.5;
      bp.frequency.setValueAtTime(850, t0);
      bp.frequency.linearRampToValueAtTime(1500, t0 + 0.16);
      bp.frequency.linearRampToValueAtTime(700, t0 + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 0.06);
      g.gain.setValueAtTime(0.18, t0 + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      o.connect(bp); bp.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.6);
    },
    rustle() {
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.3);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.8;
      const g = ctx.createGain();
      this.env(g, t0, 0.16, 0.02, 0.28);
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start(t0);
    },
  };

  // ---------- 라디오: 로파이 루프 합성 ----------
  const Radio = {
    bus: null, crackle: null, timer: null, idx: 0,
    CHORDS: [
      { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63] },  // Fmaj7
      { bass: 98.0, notes: [196.0, 246.94, 293.66, 349.23] },   // G7
      { bass: 82.41, notes: [164.81, 196.0, 246.94, 293.66] },  // Em7
      { bass: 110.0, notes: [220.0, 261.63, 329.63, 392.0] },   // Am7
    ],
    start() {
      const ctx = AudioEngine.ensure(); if (!ctx) return false;
      this.bus = ctx.createGain();
      this.bus.gain.value = 0.55;
      this.bus.connect(AudioEngine.master);
      // 빈티지 크래클
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.012;
        if (Math.random() < 0.0012) d[i] += (Math.random() * 2 - 1) * 0.5;
      }
      this.crackle = ctx.createBufferSource();
      this.crackle.buffer = buf;
      this.crackle.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 1500;
      const cg = ctx.createGain(); cg.gain.value = 0.5;
      this.crackle.connect(hp); hp.connect(cg); cg.connect(this.bus);
      this.crackle.start();
      this.idx = 0;
      this.playChord();
      this.timer = setInterval(() => this.playChord(), 4200);
      return true;
    },
    playChord() {
      const ctx = AudioEngine.ctx;
      const chord = this.CHORDS[this.idx % this.CHORDS.length];
      this.idx++;
      const t0 = ctx.currentTime + 0.05;
      const dur = 4.4;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 850;
      lp.connect(this.bus);
      // 패드
      const pad = ctx.createGain();
      pad.gain.setValueAtTime(0.0001, t0);
      pad.gain.linearRampToValueAtTime(0.15, t0 + 1.1);
      pad.gain.setValueAtTime(0.15, t0 + 3.1);
      pad.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      pad.connect(lp);
      chord.notes.forEach((f) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f;
        o.detune.value = Math.random() * 8 - 4;
        o.connect(pad);
        o.start(t0); o.stop(t0 + dur);
      });
      // 베이스
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t0);
      bg.gain.linearRampToValueAtTime(0.13, t0 + 0.5);
      bg.gain.linearRampToValueAtTime(0.0001, t0 + dur - 0.2);
      bg.connect(lp);
      const bo = ctx.createOscillator();
      bo.type = 'sine';
      bo.frequency.value = chord.bass;
      bo.connect(bg);
      bo.start(t0); bo.stop(t0 + dur);
      // 이따금 플럭 멜로디
      if (Math.random() < 0.7) {
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
          const ts = t0 + 0.6 + Math.random() * 2.6;
          const f = chord.notes[Math.floor(Math.random() * chord.notes.length)] * 2;
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.value = f;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, ts);
          g.gain.linearRampToValueAtTime(0.09, ts + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.5);
          o.connect(g); g.connect(this.bus);
          o.start(ts); o.stop(ts + 0.55);
        }
      }
    },
    stop() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this.bus) {
        const ctx = AudioEngine.ctx;
        const bus = this.bus;
        bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
        setTimeout(() => bus.disconnect(), 500);
        this.bus = null;
      }
      if (this.crackle) { try { this.crackle.stop(); } catch { /* 이미 정지 */ } this.crackle = null; }
    },
  };

  // ---------- 별 생성 ----------
  (() => {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('i');
      s.style.left = (5 + Math.random() * 90) + '%';
      s.style.top = (4 + Math.random() * 55) + '%';
      s.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
      if (Math.random() < 0.4) { s.style.width = '2px'; s.style.height = '2px'; }
      frag.appendChild(s);
    }
    $('stars').appendChild(frag);
  })();

  // ---------- 조명 렌더 ----------
  const SHADE_RGB = '9,11,30';
  function shadeBackground(dark, lampOn, monOn) {
    if (dark <= 0.01) return 'none';
    // 레이어 2장이 겹쳐 최종 어둠 dark가 되도록 장당 알파를 역산
    const L = 1 - Math.sqrt(1 - Math.min(dark, 0.92));
    const c = (a) => `rgba(${SHADE_RGB},${Math.max(0, a).toFixed(3)})`;
    const lampLayer = lampOn
      ? `radial-gradient(circle at 532px 226px, ${c(L * 0.05)} 0px, ${c(L * 0.45)} 250px, ${c(L)} 540px)`
      : `linear-gradient(${c(L)}, ${c(L)})`;
    const monLayer = monOn
      ? `radial-gradient(ellipse 280px 210px at 738px 262px, ${c(L * 0.15)} 0%, ${c(L * 0.6)} 55%, ${c(L)} 100%)`
      : `linear-gradient(${c(L)}, ${c(L)})`;
    return `${lampLayer}, ${monLayer}`;
  }

  function renderLight() {
    const { t } = nowParts();
    const sky = skyAt(t);
    const dark = (1 - sky.daylight) * 0.78;

    $('sky').style.background = `linear-gradient(${sky.top}, ${sky.bottom})`;
    $('stars').style.opacity = Math.max(0, (0.35 - sky.daylight) / 0.35).toFixed(2);
    $('windowCast').style.opacity = (sky.daylight * 0.35).toFixed(2);

    // 해와 달의 궤적
    const sun = $('sun'), moon = $('moon');
    if (t > 5.5 && t < 20.5) {
      const p = (t - 5.5) / 15;
      sun.style.opacity = 1;
      sun.style.left = (8 + 210 * p) + 'px';
      sun.style.top = (170 - 135 * Math.sin(Math.PI * p)) + 'px';
    } else {
      sun.style.opacity = 0;
    }
    const tm = t >= 19.5 ? t : t + 24; // 19.5~29.5 구간으로 정규화
    if (tm >= 19.5 && tm <= 29.5) {
      const p = (tm - 19.5) / 10;
      moon.style.opacity = 1;
      moon.style.left = (10 + 205 * p) + 'px';
      moon.style.top = (165 - 130 * Math.sin(Math.PI * p)) + 'px';
    } else {
      moon.style.opacity = 0;
    }

    $('shade').style.background = shadeBackground(dark, state.lamp, state.monitor);
    $('glowLamp').style.opacity = state.lamp ? (0.2 + 0.75 * dark).toFixed(2) : 0;
    const gm = $('glowMon');
    gm.style.opacity = state.monitor ? (0.1 + 0.7 * dark).toFixed(2) : 0;
    gm.classList.toggle('flicker', state.monitor && dark > 0.5);
    return { sky, dark };
  }

  // ---------- 상태 문구 ----------
  function phaseOf(t) {
    if (t < 5.3 || t >= 20.8) return 'night';
    if (t < 8) return 'dawn';
    if (t < 17) return 'day';
    return 'dusk';
  }
  const PHASE_LINE = {
    night: '창밖에 별이 떴어요.',
    dawn: '창밖이 밝아오고 있어요.',
    day: '볕이 좋은 시간이에요.',
    dusk: '창밖에 노을이 지고 있어요.',
  };
  function renderStatus() {
    const { h, m, t } = nowParts();
    const d = new Date();
    d.setHours(h, m);
    const timeStr = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(d);
    let line = `${timeStr} — ${PHASE_LINE[phaseOf(t)]}`;
    if (phaseOf(t) === 'night' && !state.lamp) line += ' 램프를 켜볼까요?';
    if (state.radio) line += ' 라디오에선 로파이가 흐릅니다.';
    if (state.catAwake) line += ' 고양이가 깼어요.';
    $('status').textContent = line;
  }

  // ---------- 벽시계 ----------
  function renderClock() {
    const { h, m, s } = nowParts();
    $('handH').style.transform = `rotate(${(h % 12 + m / 60) * 30}deg)`;
    $('handM').style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
    $('handS').style.transform = `rotate(${s * 6}deg)`;
  }

  // ---------- 인터랙션 ----------
  function pressable(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
    });
  }

  const lampEl = $('lamp'), monEl = $('monitor'), radioEl = $('radio');
  const catEl = $('cat'), plantEl = $('plant'), mugEl = $('mug');

  function syncToggles() {
    lampEl.classList.toggle('on', state.lamp);
    lampEl.setAttribute('aria-pressed', String(state.lamp));
    monEl.classList.toggle('on', state.monitor);
    monEl.setAttribute('aria-pressed', String(state.monitor));
    radioEl.classList.toggle('on', state.radio);
    radioEl.setAttribute('aria-pressed', String(state.radio));
  }

  pressable(lampEl, () => {
    state.lamp = !state.lamp;
    store.set('lamp', state.lamp ? '1' : '0');
    AudioEngine.click(state.lamp ? 700 : 500, state.lamp ? 1400 : 250);
    syncToggles(); renderLight(); renderStatus();
  });

  pressable(monEl, () => {
    state.monitor = !state.monitor;
    store.set('monitor', state.monitor ? '1' : '0');
    AudioEngine.pip(state.monitor ? 880 : 440);
    syncToggles(); renderLight(); renderStatus();
  });

  pressable(radioEl, () => {
    if (state.radio) {
      Radio.stop();
      state.radio = false;
      AudioEngine.click(500, 250);
    } else {
      state.radio = Radio.start();
    }
    syncToggles(); renderStatus();
  });

  let catTimer = null;
  pressable(catEl, () => {
    AudioEngine.meow();
    state.catAwake = true;
    catEl.classList.add('awake');
    if (catTimer) clearTimeout(catTimer);
    catTimer = setTimeout(() => {
      state.catAwake = false;
      catEl.classList.remove('awake');
      renderStatus();
    }, 6000);
    renderStatus();
  });

  pressable(plantEl, () => {
    AudioEngine.rustle();
    plantEl.classList.remove('wiggle');
    void plantEl.offsetWidth; // 애니메이션 재시작
    plantEl.classList.add('wiggle');
  });

  let mugTimer = null;
  pressable(mugEl, () => {
    AudioEngine.pip(520);
    mugEl.classList.add('hot');
    if (mugTimer) clearTimeout(mugTimer);
    mugTimer = setTimeout(() => mugEl.classList.remove('hot'), 20000);
  });

  // ---------- 패럴랙스 ----------
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      $('skyInner').style.transform = `translate(${(-px * 7).toFixed(1)}px, ${(-py * 4).toFixed(1)}px)`;
    });
    stage.addEventListener('mouseleave', () => {
      $('skyInner').style.transform = '';
    });
  }

  // ---------- 스케일 ----------
  function fit() {
    const w = holder.clientWidth;
    const scale = Math.min(1, w / 960);
    stage.style.transform = `scale(${scale})`;
    stage.style.left = Math.max(0, (w - 960 * scale) / 2) + 'px';
    holder.style.height = (600 * scale) + 'px';
  }
  window.addEventListener('resize', fit);

  // ---------- 시작 ----------
  syncToggles();
  fit();
  renderLight();
  renderClock();
  renderStatus();
  setInterval(() => { renderClock(); renderLight(); renderStatus(); }, 1000);
})();
