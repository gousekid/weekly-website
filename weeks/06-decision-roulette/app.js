(() => {
  "use strict";

  const STORAGE_KEY = "wk06.choices";
  const MAX_CHOICES = 12;
  const POINTER_ANGLE = -Math.PI / 2; // 12시 방향

  const PALETTE = [
    "#c0504d", "#d9a441", "#4f9c7a", "#5273c4", "#8f56b8", "#c4568e",
    "#4fa8b8", "#8fae4a", "#c4784f", "#6a5fd6", "#3f8f68", "#a8a03f",
  ];

  const PRESETS = {
    lunch: ["김치찌개", "돈까스", "국밥", "파스타", "초밥", "마라탕", "샐러드", "라면"],
    yesno: ["한다", "안 한다"],
    tonight: ["운동", "넷플릭스", "산책", "낮잠", "게임", "청소나 하자"],
    coffee: ["아메리카노", "라떼", "디카페인", "오늘은 차"],
  };

  const COMMENTS = [
    "우주가 0.3초 고민하고 내린 답입니다. 이의는 블랙홀로 보내세요.",
    "당신은 이미 이쪽으로 마음이 기울어 있었잖아요. 룰렛은 핑계였습니다.",
    "마찰력과 각속도가 합의한 결과입니다. 물리 법칙을 상대로 소송은 어렵습니다.",
    "운명은 원래 이렇게 대충 정해지는 겁니다. 그래도 꽤 괜찮은 답이네요.",
    "고대 그리스에서는 이걸 신탁이라고 불렀습니다. 당신은 방금 신탁을 받았습니다.",
    "결정을 미루면서 쓴 시간보다 룰렛이 돈 시간이 짧다는 게 오늘의 교훈입니다.",
    "후회는 내일의 당신이 알아서 할 테니, 오늘의 당신은 이걸 하면 됩니다.",
    "별들의 배치, 지구의 자전, 그리고 당신의 클릭이 만들어 낸 단 하나의 답.",
    "통계적으로 아무거나 골라도 만족도는 비슷하다고 합니다. 그러니 이걸로 하세요.",
    "룰렛이 멈춘 자리가 곧 마음이 멈춘 자리입니다. 아마도요.",
    "지금 '오…'라고 했으면 운명이고, '음…'이라고 했으면 진심을 알게 된 겁니다. 둘 다 이득.",
    "이 결과가 마음에 들지 않는다면, 그것도 하나의 답입니다. 하지만 일단은 이겁니다.",
  ];

  const RESPIN_COMMENTS = {
    2: [
      "방금 결과가 마음에 안 들었군요. 괜찮습니다, 운명은 뒤끝이 깁니다.",
      "두 번째 상담입니다. 운명이 살짝 째려보고 있지만 한 번은 봐준답니다.",
    ],
    3: [
      "세 번째네요. 이쯤 되면 룰렛이 아니라 본인 마음의 소리를 듣는 중입니다.",
      "삼세판이라는 아름다운 전통에 따라 이번 결과가 진짜 최종입니다.",
    ],
    5: [
      "다섯 번째 상담. 답은 이미 정해져 있고 룰렛은 장식이라는 걸 우리 둘 다 알고 있습니다.",
      "룰렛도 지쳤습니다. 진짜 하고 싶은 걸 하세요. 그게 오늘의 운명입니다.",
    ],
  };

  // ---- state ----
  let choices = [];
  let angle = 0;
  let velocity = 0;
  let spinning = false;
  let respinCount = 0;
  let lastTick = -1;
  let pointerFlick = 0;
  let lastFrameAt = 0;
  let lastResult = null;

  // ---- dom ----
  const $ = (id) => document.getElementById(id);
  const wheelCanvas = $("wheel");
  const confettiCanvas = $("confetti");
  const wheelCtx = wheelCanvas.getContext("2d");
  const confettiCtx = confettiCanvas.getContext("2d");
  const hub = $("hub");
  const chipsEl = $("chips");
  const addForm = $("addForm");
  const addInput = $("addInput");
  const toastEl = $("toast");
  const overlay = $("resultOverlay");
  const resultEyebrow = $("resultEyebrow");
  const resultChoice = $("resultChoice");
  const resultComment = $("resultComment");

  // ---- storage ----
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(raw)) choices = raw.filter((s) => typeof s === "string" && s.trim()).slice(0, MAX_CHOICES);
    } catch (_) { /* 무시 */ }
    if (!choices.length) choices = [...PRESETS.lunch.slice(0, 6)];
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(choices)); } catch (_) { /* 무시 */ }
  }

  // ---- toast ----
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  // ---- choices ui ----
  function colorOf(i) { return PALETTE[i % PALETTE.length]; }

  function renderChips() {
    chipsEl.innerHTML = "";
    choices.forEach((label, i) => {
      const li = document.createElement("li");
      li.className = "chip";
      li.style.setProperty("--chip-color", colorOf(i));
      const span = document.createElement("span");
      span.textContent = label;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "✕";
      btn.setAttribute("aria-label", `${label} 삭제`);
      btn.addEventListener("click", () => {
        if (spinning) return;
        choices.splice(i, 1);
        save();
        renderChips();
        drawWheel();
      });
      li.append(span, btn);
      chipsEl.appendChild(li);
    });
  }

  function addChoice(label) {
    const text = label.trim().slice(0, 20);
    if (!text) return;
    if (choices.length >= MAX_CHOICES) {
      toast(`${MAX_CHOICES}개까지만요. 그 이상은 결정 장애가 아니라 인생 설계입니다.`);
      return;
    }
    choices.push(text);
    save();
    renderChips();
    drawWheel();
  }

  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (spinning) return;
    addChoice(addInput.value);
    addInput.value = "";
    addInput.focus();
  });

  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (spinning) return;
      choices = [...PRESETS[btn.dataset.preset]];
      respinCount = 0;
      save();
      renderChips();
      drawWheel();
      toast("선택지를 교체했습니다. 이제 돌리기만 하면 됩니다.");
    });
  });

  // ---- canvas sizing ----
  function resizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wheelCanvas.getBoundingClientRect();
    const size = Math.round(rect.width * dpr);
    for (const c of [wheelCanvas, confettiCanvas]) {
      if (c.width !== size) { c.width = size; c.height = size; }
    }
    drawWheel();
  }
  window.addEventListener("resize", resizeCanvases);

  // ---- wheel drawing ----
  function drawWheel() {
    const ctx = wheelCtx;
    const size = wheelCanvas.width;
    const cx = size / 2;
    const r = size / 2 - size * 0.03;
    ctx.clearRect(0, 0, size, size);

    if (choices.length === 0) {
      ctx.fillStyle = "#2a2450";
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9d94b8";
      ctx.font = `${size * 0.04}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("선택지를 추가해 주세요", cx, cx);
      return;
    }

    const n = choices.length;
    const seg = (Math.PI * 2) / n;

    if (n === 1) {
      ctx.fillStyle = colorOf(0);
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fdf8ee";
      ctx.font = `700 ${size * 0.05}px "Gowun Batang", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(choices[0], cx, cx - r * 0.5);
      drawRimAndPointer(ctx, cx, r, size);
      return;
    }

    ctx.save();
    ctx.translate(cx, cx);
    ctx.rotate(angle);

    for (let i = 0; i < n; i++) {
      const start = i * seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, start + seg);
      ctx.closePath();
      ctx.fillStyle = colorOf(i);
      ctx.fill();
      ctx.strokeStyle = "#100d1e";
      ctx.lineWidth = Math.max(2, size * 0.006);
      ctx.stroke();
    }

    // 라벨
    const fontPx = size * (n > 8 ? 0.035 : n > 5 ? 0.042 : 0.05);
    ctx.font = `700 ${fontPx}px "Gowun Batang", serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const mid = i * seg + seg / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.fillStyle = "#fdf8ee";
      ctx.shadowColor = "#00000088";
      ctx.shadowBlur = size * 0.008;
      let label = choices[i];
      const maxWidth = r * 0.62;
      while (label.length > 1 && ctx.measureText(label + "…").width > maxWidth) {
        label = label.slice(0, -1);
      }
      if (label !== choices[i]) label += "…";
      ctx.fillText(label, r * 0.92, 0);
      ctx.restore();
    }
    ctx.restore();

    drawRimAndPointer(ctx, cx, r, size);
  }

  function drawRimAndPointer(ctx, cx, r, size) {
    // 외곽 링
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#e0b45c";
    ctx.lineWidth = Math.max(3, size * 0.012);
    ctx.stroke();

    // 포인터 (12시)
    const flick = Math.sin(pointerFlick * Math.PI) * size * 0.012;
    const pw = size * 0.045;
    const ph = size * 0.075;
    ctx.save();
    ctx.translate(cx, cx - r);
    ctx.beginPath();
    ctx.moveTo(-pw, -ph * 0.55 - flick * 0.3);
    ctx.lineTo(pw, -ph * 0.55 - flick * 0.3);
    ctx.lineTo(0, ph * 0.75 + flick);
    ctx.closePath();
    ctx.fillStyle = "#e0b45c";
    ctx.shadowColor = "#e0b45c66";
    ctx.shadowBlur = size * 0.02;
    ctx.fill();
    ctx.restore();
  }

  // ---- audio ----
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function playTick() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1600 + Math.random() * 300, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  function playFanfare() {
    if (!audioCtx) return;
    const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + i * 0.09;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  // ---- physics ----
  function segmentAtPointer() {
    const n = choices.length;
    const seg = (Math.PI * 2) / n;
    let local = (POINTER_ANGLE - angle) % (Math.PI * 2);
    if (local < 0) local += Math.PI * 2;
    return Math.floor(local / seg) % n;
  }

  function spin() {
    if (spinning) return;
    if (choices.length < 2) {
      toast("선택지가 2개는 있어야 운명도 고민을 합니다.");
      return;
    }
    ensureAudio();
    spinning = true;
    hub.disabled = true;
    hub.textContent = "…";
    velocity = 16 + Math.random() * 12; // rad/s
    lastTick = segmentAtPointer();
    lastFrameAt = 0;
    requestAnimationFrame(frame);
  }

  function frame(ts) {
    if (!lastFrameAt) lastFrameAt = ts;
    const dt = Math.min((ts - lastFrameAt) / 1000, 0.05);
    lastFrameAt = ts;

    angle += velocity * dt;
    velocity *= Math.exp(-0.8 * dt);
    pointerFlick = Math.max(0, pointerFlick - dt * 6);

    const idx = segmentAtPointer();
    if (idx !== lastTick) {
      lastTick = idx;
      pointerFlick = 1;
      playTick();
    }

    drawWheel();

    if (velocity > 0.15) {
      requestAnimationFrame(frame);
    } else {
      velocity = 0;
      spinning = false;
      hub.disabled = false;
      hub.textContent = "돌려";
      finish(choices[segmentAtPointer()]);
    }
  }

  // ---- result ----
  function pickComment() {
    let pool = COMMENTS;
    if (respinCount >= 5) pool = RESPIN_COMMENTS[5];
    else if (respinCount >= 3) pool = RESPIN_COMMENTS[3];
    else if (respinCount === 2) pool = RESPIN_COMMENTS[2];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function finish(choice) {
    respinCount += 1;
    lastResult = { choice, comment: pickComment() };
    resultEyebrow.textContent = respinCount > 1 ? `운명의 선고 · ${respinCount}번째 상담` : "운명의 선고";
    resultChoice.textContent = choice;
    resultComment.textContent = lastResult.comment;
    overlay.hidden = false;
    playFanfare();
    burstConfetti();
  }

  $("acceptBtn").addEventListener("click", () => {
    overlay.hidden = true;
    respinCount = 0;
    toast("탁월한 승복입니다. 오늘 하루가 가벼워졌습니다.");
  });

  $("respinBtn").addEventListener("click", () => {
    overlay.hidden = true;
    spin();
  });

  $("shareBtn").addEventListener("click", async () => {
    if (!lastResult) return;
    const text = `🎡 운명의 룰렛이 정해줬다: "${lastResult.choice}"\n${lastResult.comment}\n${location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      throw new Error("no share");
    } catch (_) {
      try {
        await navigator.clipboard.writeText(text);
        toast("결과를 클립보드에 복사했습니다.");
      } catch (_) {
        toast("공유에 실패했습니다. 결과는 마음속에 간직해 주세요.");
      }
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) overlay.hidden = true;
  });

  // ---- confetti ----
  let confetti = [];
  let confettiRunning = false;

  function burstConfetti() {
    const size = confettiCanvas.width;
    const cx = size / 2;
    confetti = Array.from({ length: 90 }, () => {
      const a = Math.random() * Math.PI * 2;
      const speed = size * (0.15 + Math.random() * 0.5);
      return {
        x: cx, y: cx,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - size * 0.25,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 12,
        w: size * (0.008 + Math.random() * 0.012),
        h: size * (0.014 + Math.random() * 0.018),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        life: 1.2 + Math.random() * 0.6,
      };
    });
    if (!confettiRunning) {
      confettiRunning = true;
      let prev = 0;
      const step = (ts) => {
        if (!prev) prev = ts;
        const dt = Math.min((ts - prev) / 1000, 0.05);
        prev = ts;
        const s = confettiCanvas.width;
        confettiCtx.clearRect(0, 0, s, s);
        confetti = confetti.filter((p) => (p.life -= dt) > 0);
        for (const p of confetti) {
          p.vy += s * 1.1 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          confettiCtx.save();
          confettiCtx.translate(p.x, p.y);
          confettiCtx.rotate(p.rot);
          confettiCtx.globalAlpha = Math.min(1, p.life);
          confettiCtx.fillStyle = p.color;
          confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          confettiCtx.restore();
        }
        if (confetti.length) {
          requestAnimationFrame(step);
        } else {
          confettiCtx.clearRect(0, 0, s, s);
          confettiRunning = false;
        }
      };
      requestAnimationFrame(step);
    }
  }

  // ---- init ----
  hub.addEventListener("click", spin);
  load();
  renderChips();
  resizeCanvases();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawWheel);
  }
})();
