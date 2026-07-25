"use strict";

/* ---------- 사유 데이터 ---------- */

const REASONS = {
  serious: [
    "새로운 도전을 향한 갈증이 더 이상 참을 수 없는 수준에 이르렀습니다.",
    "제 성장 곡선과 회사의 성장 곡선이 더 이상 같은 그래프 위에 있지 않다고 판단했습니다.",
    "출근길에 설렘보다 한숨이 앞서는 날이 많아져, 서로를 위해 놓아주려 합니다.",
    "업무보다 회의가, 회의보다 회의를 위한 회의가 많아지는 현실에 지쳤습니다.",
    "제가 꿈꾸던 삶과 현재의 삶 사이의 거리가 출퇴근 거리보다 멀다는 것을 깨달았습니다.",
    "건강검진 결과표가 사직서를 대신 써달라고 부탁했습니다.",
    "더 늦기 전에, '언젠가 해봐야지'의 '언젠가'를 오늘로 만들기로 했습니다.",
    "반복되는 일상 속에서 제 열정이 감가상각되고 있음을 느꼈습니다.",
    "회사의 비전과 저의 비전이 평행선임을 3년 만에 인정하게 되었습니다.",
    "일과 삶의 균형을 찾아 나섭니다. 지금까지는 일과 일의 균형이었습니다.",
    "제 자리의 의자보다 제 어깨가 먼저 내려앉을 것 같습니다.",
    "스스로에게 안식년을 선물하기로 했습니다. 저는 회사 없이도 잘 지낼 수 있음을 확인하고 싶습니다.",
    "커피로 버티는 하루가 아니라, 커피를 즐기는 하루를 살고 싶습니다.",
    "퇴근 후의 제가 진짜 저라는 사실을 더 이상 외면할 수 없습니다.",
    "가족과의 저녁 식사가 분기 실적보다 중요하다는 결론에 도달했습니다.",
    "제 젊음의 지분을 더 이상 야근에 투자하지 않기로 결정했습니다.",
    "통장 잔고와 함께 인내심도 바닥났습니다.",
    "이 회사에서 배울 수 있는 것은 다 배웠습니다. 특히 참을성을요.",
    "오래 고민했습니다. 고민한 시간만큼 확신이 되었습니다.",
    "몸은 사무실에 있는데 마음은 이미 퇴사한 지 6개월이 되어, 몸도 마음을 따라가려 합니다.",
    "제 인생의 주주총회에서 커리어 전환 안건이 만장일치로 가결되었습니다.",
    "성장이 멈춘 화분은 분갈이가 필요합니다. 제가 그 화분입니다.",
    "더 이상 월요일을 두려워하는 어른으로 살고 싶지 않습니다.",
    "지난 1년간 가장 크게 성장한 것이 업무 역량이 아니라 눈치라는 것을 깨달았습니다.",
  ],
  mad: [
    "전생에 고양이였던 기억이 되살아나 하루 16시간 수면이 필요해졌습니다.",
    "로또 당첨은 아직 안 됐지만, 미리 연습해 두려고 합니다.",
    "집 앞 편의점 야외 테이블 지분을 인수하여 경영에 전념하고자 합니다.",
    "어젯밤 꿈에서 조상님이 퇴사하라고 세 번 말씀하셨습니다. 조상님 말씀은 거역할 수 없습니다.",
    "제 MBTI가 어제부로 '퇴사형'으로 변경되었습니다.",
    "지구 자전 속도와 제 업무 속도의 싱크가 맞지 않아 시차 적응에 실패했습니다.",
    "사무실 공기와 저의 상극 궁합이 사주에 명시되어 있음을 뒤늦게 발견했습니다.",
    "반려 선인장이 분리불안 증세를 보이기 시작했습니다.",
    "우주의 기운이 저를 침대 쪽으로 강하게 끌어당기고 있습니다. 만유인력은 거스를 수 없습니다.",
    "회사 와이파이가 저를 3번 차단했습니다. 기계가 먼저 알아본 것입니다.",
    "무한한 성장 가능성을 확인하기 위해 일단 무한한 휴식부터 시작하려 합니다.",
    "점심 메뉴 고르는 결정력을 모두 소진하여 더 이상 업무 결정을 내릴 수 없습니다.",
    "엘리베이터 거울 속의 저와 눈이 마주쳤는데, 그가 고개를 저었습니다.",
    "제 기가 빨리는 속도가 5G보다 빠릅니다.",
    "동네 비둘기들과의 신뢰 관계 구축에 전념할 시기가 왔습니다.",
    "침대와 저는 더 이상 장거리 연애를 지속할 수 없습니다.",
    "곧 수확철이라 할머니의 밭이 저를 부릅니다. 저는 3대 독자 일꾼입니다.",
    "달의 위상 변화가 제 출근 의지에 치명적인 영향을 주고 있습니다.",
    "키보드의 G와 H 사이에서 우주의 진리를 발견하여 연구에 몰두하고자 합니다.",
    "사원증 사진 속의 제가 더 이상 저를 닮지 않았습니다. 본인 확인이 불가능한 상태입니다.",
    "매주 월요일 몸에 알레르기 반응이 일어나는 원인을 규명하기 위해 대조군 실험(출근 안 함)이 필요합니다.",
    "회사 근처 카페 사장님이 저를 '사장님보다 자주 오는 분'으로 임명하셨습니다. 중책을 맡게 되어 떠납니다.",
    "옷장 속 잠옷들의 노동조합이 착용 시간 보장을 요구하며 총파업을 예고했습니다.",
    "어항 속 금붕어가 저를 보며 '너도 나와 같은 처지구나'라고 말하는 것 같습니다. 환청이 아니길 바랍니다.",
  ],
};

/* ---------- 상태 & 요소 ---------- */

let mode = "serious";
let currentReason = "";
let shuffleTimer = null;

const $ = (id) => document.getElementById(id);
const reasonText = $("reasonText");
const docDate = $("docDate");
const signName = $("signName");
const stamp = $("stamp");
const fieldName = $("fieldName");
const toast = $("toast");

/* ---------- 유틸 ---------- */

function pickReason() {
  const pool = REASONS[mode];
  let next;
  do {
    next = pool[Math.floor(Math.random() * pool.length)];
  } while (next === currentReason && pool.length > 1);
  return next;
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
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
  const pool = REASONS[mode];
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

/* ---------- 모드 전환 ---------- */

function setMode(next) {
  if (mode === next) return;
  mode = next;
  $("modeSerious").classList.toggle("is-active", next === "serious");
  $("modeMad").classList.toggle("is-active", next === "mad");
  $("modeSerious").setAttribute("aria-selected", String(next === "serious"));
  $("modeMad").setAttribute("aria-selected", String(next === "mad"));
  draw();
}

/* ---------- 서명/도장 동기화 ---------- */

function syncName() {
  const name = fieldName.value.trim() || "홍길동";
  signName.textContent = name;
  stamp.textContent = name.charAt(0);
}

/* ---------- 이미지 저장 (캔버스 직접 렌더) ---------- */

async function saveImage() {
  showToast("이미지를 만드는 중...");
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

  const serif = '"Nanum Myeongjo", "Noto Serif KR", serif';
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
  ctx.font = `800 66px ${serif}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("사  직  서", W / 2, 160);

  // 인적사항 표
  const dept = $("fieldDept").value.trim() || "-";
  const rank = $("fieldRank").value.trim() || "-";
  const name = fieldName.value.trim() || "홍길동";
  const tableX = 100, tableY = 240, tableW = W - 200, rowH = 62, labelW = 130;
  const rows = [["소  속", dept], ["직  급", rank], ["성  명", name]];

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
  ctx.fillText("사    유", tableX, reasonY);

  ctx.font = `400 30px ${serif}`;
  const lines = wrapText(ctx, currentReason, tableW);
  lines.forEach((ln, i) => {
    ctx.fillText(ln, tableX, reasonY + 58 + i * 52);
  });

  // 맺음말 / 날짜
  const closingY = Math.max(reasonY + 58 + lines.length * 52 + 90, 840);
  ctx.textAlign = "center";
  ctx.font = `400 28px ${serif}`;
  ctx.fillText("위와 같은 사유로 사직하고자 하오니", W / 2, closingY);
  ctx.fillText("재가하여 주시기 바랍니다.", W / 2, closingY + 46);
  ctx.fillText(todayString(), W / 2, closingY + 130);

  // 서명 + 도장
  const signY = closingY + 220;
  ctx.textAlign = "right";
  ctx.font = `400 28px ${serif}`;
  ctx.fillText(`신청인:  ${name}`, W - 210, signY);

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
  ctx.fillText(name.charAt(0), 0, 2);
  ctx.restore();

  canvas.toBlob((blob) => {
    if (!blob) { showToast("이미지 생성에 실패했어요."); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `사직서_${ymd}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("사직서가 저장되었습니다. 제출은 신중히!");
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
  const text = `[오늘의 퇴사 사유]\n"${currentReason}"\n\n나만의 사직서 만들기 👉 ${location.href}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "오늘의 퇴사 사유 생성기", text });
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // 사용자가 취소
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("클립보드에 복사했어요. 어디든 붙여넣으세요!");
  } catch (_) {
    showToast("공유를 지원하지 않는 브라우저예요.");
  }
}

/* ---------- 초기화 ---------- */

$("btnDraw").addEventListener("click", draw);
$("btnSave").addEventListener("click", saveImage);
$("btnShare").addEventListener("click", share);
$("modeSerious").addEventListener("click", () => setMode("serious"));
$("modeMad").addEventListener("click", () => setMode("mad"));
fieldName.addEventListener("input", syncName);

docDate.textContent = todayString();
syncName();
currentReason = pickReason();
reasonText.textContent = currentReason;
