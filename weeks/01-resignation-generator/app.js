"use strict";

/* ---------- i18n ---------- */

const I18N = {
  ko: {
    htmlLang: "ko",
    pageTitle: "오늘의 퇴사 사유 생성기",
    siteTitle: "오늘의 퇴사 사유 생성기",
    siteSub: "마음속에만 품어왔던 그 문서, 오늘 미리 써봅니다",
    modeSerious: "진지 모드",
    modeMad: "광기 모드",
    editHint: "✏️ 소속 · 직급 · 성명 칸은 눌러서 직접 채울 수 있어요",
    docTitle: "사  직  서",
    thDept: "소속", thRank: "직급", thName: "성명",
    phDept: "주식회사 버티기", phRank: "만년 사원", phName: "홍길동",
    reasonLabel: "사  유",
    closing1: "위와 같은 사유로 사직하고자 하오니",
    closing2: "재가하여 주시기 바랍니다.",
    signLabel: "신청인:",
    btnDraw: "다른 사유 뽑기", btnSave: "이미지 저장", btnShare: "공유하기",
    footer: "weekly-website · week 01 · 실제 제출 시 책임지지 않습니다",
    toastMaking: "이미지를 만드는 중...",
    toastSaved: "사직서가 저장되었습니다. 제출은 신중히!",
    toastCopied: "클립보드에 복사했어요. 어디든 붙여넣으세요!",
    toastNoShare: "공유를 지원하지 않는 브라우저예요.",
    toastFail: "이미지 생성에 실패했어요.",
    shareText: (reason, url) => `[오늘의 퇴사 사유]\n"${reason}"\n\n나만의 사직서 만들기 👉 ${url}`,
    fileName: (ymd) => `사직서_${ymd}.png`,
    date: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`,
    canvas: {
      title: "사  직  서", titleFont: '800 66px',
      labels: ["소  속", "직  급", "성  명"],
      reasonLabel: "사    유",
      signedPrefix: "신청인:  ",
    },
  },
  en: {
    htmlLang: "en",
    pageTitle: "Daily Resignation Reason Generator",
    siteTitle: "Daily Resignation Reason Generator",
    siteSub: "The letter you've been drafting in your head — write it today",
    modeSerious: "Serious Mode",
    modeMad: "Unhinged Mode",
    editHint: "✏️ Tap the Company · Title · Name fields to fill them in",
    docTitle: "LETTER OF RESIGNATION",
    thDept: "Company", thRank: "Title", thName: "Name",
    phDept: "Barely Holding On Inc.", phRank: "Perpetual Junior", phName: "John Doe",
    reasonLabel: "REASON",
    closing1: "I hereby respectfully submit my resignation",
    closing2: "for the reason stated above.",
    signLabel: "Signed:",
    btnDraw: "Draw Another Reason", btnSave: "Save as Image", btnShare: "Share",
    footer: "weekly-website · week 01 · not responsible for actual submissions",
    toastMaking: "Creating image...",
    toastSaved: "Saved. Submit responsibly!",
    toastCopied: "Copied to clipboard — paste it anywhere!",
    toastNoShare: "Sharing is not supported in this browser.",
    toastFail: "Failed to create the image.",
    shareText: (reason, url) => `[Today's resignation reason]\n"${reason}"\n\nWrite your own 👉 ${url}`,
    fileName: (ymd) => `resignation_${ymd}.png`,
    date: (d) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    canvas: {
      title: "LETTER OF RESIGNATION", titleFont: '800 46px',
      labels: ["Company", "Title", "Name"],
      reasonLabel: "REASON",
      signedPrefix: "Signed:  ",
    },
  },
};

/* ---------- 상태 & 요소 ---------- */

let lang = (() => {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl === "en" || fromUrl === "ko") return fromUrl;
  return localStorage.getItem("lang") || "ko";
})();
let mode = "serious";
let currentReason = "";
let shuffleTimer = null;

const $ = (id) => document.getElementById(id);
const reasonText = $("reasonText");
const fieldName = $("fieldName");
const toast = $("toast");

const T = () => I18N[lang];
const pools = () => (lang === "ko" ? window.REASONS_KO : window.REASONS_EN);

/* ---------- 유틸 ---------- */

function pickReason() {
  const pool = pools()[mode];
  let next;
  do {
    next = pool[Math.floor(Math.random() * pool.length)];
  } while (next === currentReason && pool.length > 1);
  return next;
}

function todayString() {
  return T().date(new Date());
}

let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2500);
}

/* ---------- 뽑기 (슬롯 셔플) ---------- */

function draw() {
  clearInterval(shuffleTimer);
  const finalReason = pickReason();
  const pool = pools()[mode];
  let ticks = 0;
  reasonText.classList.add("is-shuffling");

  shuffleTimer = setInterval(() => {
    ticks += 1;
    if (ticks < 9) {
      reasonText.textContent = pool[Math.floor(Math.random() * pool.length)];
    } else {
      clearInterval(shuffleTimer);
      currentReason = finalReason;
      reasonText.textContent = finalReason;
      reasonText.classList.remove("is-shuffling");
    }
  }, 65);
}

/* ---------- 모드/언어 전환 ---------- */

function setMode(next) {
  if (mode === next) return;
  mode = next;
  $("modeSerious").classList.toggle("is-active", next === "serious");
  $("modeMad").classList.toggle("is-active", next === "mad");
  $("modeSerious").setAttribute("aria-selected", String(next === "serious"));
  $("modeMad").setAttribute("aria-selected", String(next === "mad"));
  draw();
}

function applyLang() {
  const t = T();
  document.documentElement.lang = t.htmlLang;
  document.title = t.pageTitle;
  document.body.classList.toggle("lang-en", lang === "en");
  $("langKo").classList.toggle("is-active", lang === "ko");
  $("langEn").classList.toggle("is-active", lang === "en");

  $("siteTitle").textContent = t.siteTitle;
  $("siteSub").textContent = t.siteSub;
  $("modeSerious").textContent = t.modeSerious;
  $("modeMad").textContent = t.modeMad;
  $("editHint").textContent = t.editHint;
  $("docTitle").textContent = t.docTitle;
  $("thDept").textContent = t.thDept;
  $("thRank").textContent = t.thRank;
  $("thName").textContent = t.thName;
  $("fieldDept").placeholder = t.phDept;
  $("fieldRank").placeholder = t.phRank;
  $("fieldName").placeholder = t.phName;
  $("reasonLabel").textContent = t.reasonLabel;
  $("closing1").textContent = t.closing1;
  $("closing2").textContent = t.closing2;
  $("signLabel").textContent = t.signLabel;
  $("btnDraw").textContent = t.btnDraw;
  $("btnSave").textContent = t.btnSave;
  $("btnShare").textContent = t.btnShare;
  $("footerText").textContent = t.footer;
  $("docDate").textContent = todayString();
  syncName();
}

function setLang(next) {
  if (lang === next) return;
  lang = next;
  localStorage.setItem("lang", next);
  applyLang();
  // 언어가 바뀌면 사유도 해당 언어 풀에서 새로 뽑기
  currentReason = "";
  draw();
}

/* ---------- 서명/도장 동기화 ---------- */

function syncName() {
  const name = fieldName.value.trim() || T().phName;
  $("signName").textContent = name;
  $("stamp").textContent = name.charAt(0).toUpperCase();
}

/* ---------- 이미지 저장 (캔버스 직접 렌더) ---------- */

async function saveImage() {
  const t = T();
  showToast(t.toastMaking);
  try {
    await document.fonts.load('800 66px "Nanum Myeongjo"');
    await document.fonts.load('700 30px "Nanum Myeongjo"');
    await document.fonts.load('400 30px "Nanum Myeongjo"');
    await document.fonts.ready;
  } catch (_) { /* 폰트 실패 시 시스템 serif로 진행 */ }

  const W = 900, H = 1272;
  const canvas = document.createElement("canvas");
  const scale = 2; // 레티나 대응
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const serif = '"Nanum Myeongjo", "Noto Serif KR", Georgia, serif';
  const ink = "#1f1a14";
  const line = "#4a4038";

  // 종이 배경
  ctx.fillStyle = "#fdfbf4";
  ctx.fillRect(0, 0, W, H);

  // 이중 테두리
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, W - 100, H - 100);

  // 제목
  ctx.fillStyle = ink;
  ctx.font = `${t.canvas.titleFont} ${serif}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t.canvas.title, W / 2, 160);

  // 비워두면 placeholder의 재미 기본값으로 채움
  const dept = $("fieldDept").value.trim() || t.phDept;
  const rank = $("fieldRank").value.trim() || t.phRank;
  const name = fieldName.value.trim() || t.phName;
  const tableX = 100, tableY = 240, tableW = W - 200, rowH = 62;
  const labelW = lang === "ko" ? 130 : 160;
  const rows = [[t.canvas.labels[0], dept], [t.canvas.labels[1], rank], [t.canvas.labels[2], name]];

  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  rows.forEach((row, i) => {
    const y = tableY + i * rowH;
    ctx.strokeRect(tableX, y, tableW, rowH);
    ctx.strokeRect(tableX, y, labelW, rowH);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fillRect(tableX + 1, y + 1, labelW - 2, rowH - 2);
    ctx.fillStyle = ink;
    ctx.font = `700 26px ${serif}`;
    ctx.textAlign = "center";
    ctx.fillText(row[0], tableX + labelW / 2, y + rowH / 2 + 1);
    ctx.font = `400 26px ${serif}`;
    ctx.textAlign = "left";
    ctx.fillText(row[1], tableX + labelW + 24, y + rowH / 2 + 1);
  });

  // 사유
  const reasonY = tableY + rowH * 3 + 70;
  ctx.font = `700 30px ${serif}`;
  ctx.textAlign = "left";
  ctx.fillText(t.canvas.reasonLabel, tableX, reasonY);

  ctx.font = `400 30px ${serif}`;
  const lines = wrapText(ctx, currentReason, tableW);
  lines.forEach((ln, i) => {
    ctx.fillText(ln, tableX, reasonY + 58 + i * 52);
  });

  // 맺음말 / 날짜
  const closingY = Math.max(reasonY + 58 + lines.length * 52 + 90, 840);
  ctx.textAlign = "center";
  ctx.font = `400 28px ${serif}`;
  ctx.fillText(t.closing1, W / 2, closingY);
  ctx.fillText(t.closing2, W / 2, closingY + 46);
  ctx.fillText(todayString(), W / 2, closingY + 130);

  // 서명 + 도장
  const signY = closingY + 220;
  ctx.textAlign = "right";
  ctx.font = `400 28px ${serif}`;
  ctx.fillText(`${t.canvas.signedPrefix}${name}`, W - 210, signY);

  const stampX = W - 150, stampY = signY - 6, stampR = 34;
  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.14);
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, stampR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#c0392b";
  ctx.font = `800 34px ${serif}`;
  ctx.textAlign = "center";
  ctx.fillText(name.charAt(0).toUpperCase(), 0, 2);
  ctx.restore();

  canvas.toBlob((blob) => {
    if (!blob) { showToast(t.toastFail); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = t.fileName(ymd);
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastSaved);
  }, "image/png");
}

// 한국어 word-break: keep-all 방식 줄바꿈 (공백 단위, 넘치면 글자 단위)
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else if (current) {
      lines.push(current);
      current = word;
    } else {
      // 한 단어가 한 줄보다 긴 경우 글자 단위로 자름
      let chunk = "";
      for (const ch of word) {
        if (ctx.measureText(chunk + ch).width > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      current = chunk;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ---------- 공유 ---------- */

async function share() {
  const t = T();
  const text = t.shareText(currentReason, location.origin + location.pathname + (lang === "en" ? "?lang=en" : ""));
  if (navigator.share) {
    try {
      await navigator.share({ title: t.pageTitle, text });
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // 사용자가 취소
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(t.toastCopied);
  } catch (_) {
    showToast(t.toastNoShare);
  }
}

/* ---------- 초기화 ---------- */

$("btnDraw").addEventListener("click", draw);
$("btnSave").addEventListener("click", saveImage);
$("btnShare").addEventListener("click", share);
$("modeSerious").addEventListener("click", () => setMode("serious"));
$("modeMad").addEventListener("click", () => setMode("mad"));
$("langKo").addEventListener("click", () => setLang("ko"));
$("langEn").addEventListener("click", () => setLang("en"));
fieldName.addEventListener("input", syncName);

applyLang();
currentReason = pickReason();
reasonText.textContent = currentReason;
