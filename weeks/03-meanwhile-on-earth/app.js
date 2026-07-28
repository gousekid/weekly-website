"use strict";

/* ---------- 도시 데이터 ---------- */

const CITIES = [
  { name: "레이캬비크", flag: "🇮🇸", sig: "오로라와 온천의 도시", tz: "Atlantic/Reykjavik", lat: 64.15, lon: -21.94 },
  { name: "런던", flag: "🇬🇧", sig: "빅벤이 시간을 알리는 곳", tz: "Europe/London", lat: 51.51, lon: -0.13 },
  { name: "파리", flag: "🇫🇷", sig: "에펠탑의 불빛 아래", tz: "Europe/Paris", lat: 48.86, lon: 2.35 },
  { name: "이스탄불", flag: "🇹🇷", sig: "두 대륙에 걸친 도시", tz: "Europe/Istanbul", lat: 41.01, lon: 28.98 },
  { name: "카이로", flag: "🇪🇬", sig: "피라미드의 그림자 곁", tz: "Africa/Cairo", lat: 30.04, lon: 31.24 },
  { name: "나이로비", flag: "🇰🇪", sig: "사바나의 바람이 부는 곳", tz: "Africa/Nairobi", lat: -1.29, lon: 36.82 },
  { name: "케이프타운", flag: "🇿🇦", sig: "두 바다가 만나는 끝", tz: "Africa/Johannesburg", lat: -33.92, lon: 18.42 },
  { name: "두바이", flag: "🇦🇪", sig: "사막 위의 신기루", tz: "Asia/Dubai", lat: 25.20, lon: 55.27 },
  { name: "뭄바이", flag: "🇮🇳", sig: "몬순의 항구 도시", tz: "Asia/Kolkata", lat: 19.08, lon: 72.88 },
  { name: "방콕", flag: "🇹🇭", sig: "강 위의 사원들", tz: "Asia/Bangkok", lat: 13.76, lon: 100.50 },
  { name: "싱가포르", flag: "🇸🇬", sig: "적도의 정원 도시", tz: "Asia/Singapore", lat: 1.35, lon: 103.82 },
  { name: "베이징", flag: "🇨🇳", sig: "자금성의 아침", tz: "Asia/Shanghai", lat: 39.90, lon: 116.41 },
  { name: "도쿄", flag: "🇯🇵", sig: "네온 사이의 골목", tz: "Asia/Tokyo", lat: 35.68, lon: 139.69 },
  { name: "시드니", flag: "🇦🇺", sig: "오페라하우스의 항구", tz: "Australia/Sydney", lat: -33.87, lon: 151.21 },
  { name: "오클랜드", flag: "🇳🇿", sig: "해가 가장 먼저 뜨는 곳 근처", tz: "Pacific/Auckland", lat: -36.85, lon: 174.76 },
  { name: "호놀룰루", flag: "🇺🇸", sig: "태평양 한가운데의 섬", tz: "Pacific/Honolulu", lat: 21.31, lon: -157.86 },
  { name: "로스앤젤레스", flag: "🇺🇸", sig: "해변과 야자수의 도시", tz: "America/Los_Angeles", lat: 34.05, lon: -118.24 },
  { name: "멕시코시티", flag: "🇲🇽", sig: "고원 위의 거대 도시", tz: "America/Mexico_City", lat: 19.43, lon: -99.13 },
  { name: "뉴욕", flag: "🇺🇸", sig: "잠들지 않는 도시", tz: "America/New_York", lat: 40.71, lon: -74.01 },
  { name: "상파울루", flag: "🇧🇷", sig: "남반구의 콘크리트 숲", tz: "America/Sao_Paulo", lat: -23.55, lon: -46.63 },
  { name: "부에노스아이레스", flag: "🇦🇷", sig: "탱고가 흐르는 밤", tz: "America/Argentina/Buenos_Aires", lat: -34.60, lon: -58.38 },
  { name: "몬테비데오", flag: "🇺🇾", sig: "라플라타 강가의 노을", tz: "America/Montevideo", lat: -34.90, lon: -56.19 },
];

// 시간대 → 대표 좌표 (대척점 계산용, 위치 권한 없이 추정)
const TZ_COORDS = {
  "Asia/Seoul": [37.57, 126.98], "Asia/Tokyo": [35.68, 139.69], "Asia/Shanghai": [31.23, 121.47],
  "Asia/Singapore": [1.35, 103.82], "Asia/Bangkok": [13.76, 100.50], "Asia/Kolkata": [19.08, 72.88],
  "Asia/Dubai": [25.20, 55.27], "Europe/Moscow": [55.76, 37.62], "Europe/Istanbul": [41.01, 28.98],
  "Europe/Paris": [48.86, 2.35], "Europe/Berlin": [52.52, 13.41], "Europe/London": [51.51, -0.13],
  "America/New_York": [40.71, -74.01], "America/Chicago": [41.88, -87.63], "America/Denver": [39.74, -104.99],
  "America/Los_Angeles": [34.05, -118.24], "America/Sao_Paulo": [-23.55, -46.63],
  "Australia/Sydney": [-33.87, 151.21], "Pacific/Auckland": [-36.85, 174.76],
};

const TZ_CITY_KO = {
  Seoul: "서울", Tokyo: "도쿄", Shanghai: "상하이", Singapore: "싱가포르", Bangkok: "방콕",
  Kolkata: "뭄바이", Dubai: "두바이", Moscow: "모스크바", Istanbul: "이스탄불", Paris: "파리",
  Berlin: "베를린", London: "런던", New_York: "뉴욕", Chicago: "시카고", Denver: "덴버",
  Los_Angeles: "로스앤젤레스", Sao_Paulo: "상파울루", Sydney: "시드니", Auckland: "오클랜드",
};

/* ---------- 상태별 문구/하늘 ---------- */

const STATES = {
  dawn:      { emoji: "🌌", label: "새벽",  lines: ["밤의 끝자락, 새벽이 스며들고 있어요", "가장 어두운 시간이 지나가는 중이에요", "첫 새들이 깨어나는 시간이에요"] },
  sunrise:   { emoji: "🌅", label: "일출",  lines: ["지금 막 해가 떠오르고 있어요", "하늘이 금빛으로 물드는 중이에요", "새로운 하루가 시작되고 있어요"] },
  morning:   { emoji: "🌤️", label: "아침",  lines: ["상쾌한 아침 공기가 흐르고 있어요", "출근길 발걸음이 이어지는 시간이에요", "커피 향이 퍼지는 아침이에요"] },
  midday:    { emoji: "☀️", label: "한낮",  lines: ["해가 가장 높이 떠 있어요", "그림자가 가장 짧아지는 시간이에요", "한낮의 햇살이 쏟아지고 있어요"] },
  afternoon: { emoji: "🌞", label: "오후",  lines: ["나른한 오후를 지나고 있어요", "오후의 빛이 길게 기울고 있어요", "하루의 반환점을 돌았어요"] },
  sunset:    { emoji: "🌇", label: "일몰",  lines: ["하늘이 붉게 물들고 있어요", "해가 지평선으로 내려가는 중이에요", "노을이 도시를 감싸고 있어요"] },
  dusk:      { emoji: "🌆", label: "어스름", lines: ["어스름이 내려앉고 있어요", "하나둘 불빛이 켜지는 시간이에요", "낮과 밤이 교대하는 중이에요"] },
  night:     { emoji: "🌙", label: "밤",    lines: ["하루를 마무리하는 밤이에요", "저녁 식탁에 온기가 도는 시간이에요", "달이 하늘에 걸려 있어요"] },
  deepnight: { emoji: "🌃", label: "깊은 밤", lines: ["깊은 밤의 한가운데에 있어요", "가로등만 깨어 있는 시간이에요", "도시가 가장 조용한 순간이에요"] },
};

const ACTIVITIES = [
  [0, 4, "깊이 잠들어 있을"], [5, 6, "새벽잠에 뒤척일"], [7, 8, "하루를 시작할"],
  [9, 11, "오전에 몰두할"], [12, 13, "점심 메뉴를 고민할"], [14, 16, "오후 커피가 필요할"],
  [17, 18, "퇴근길에 오를"], [19, 20, "저녁을 먹을"], [21, 22, "하루를 정리할"], [23, 23, "잠자리에 들"],
];

const GROUPS = [
  { key: "wake",  title: "🌅 해가 떠오르는 곳", states: ["dawn", "sunrise"] },
  { key: "day",   title: "☀️ 한낮을 보내는 곳", states: ["morning", "midday", "afternoon"] },
  { key: "dusk",  title: "🌇 해가 지는 곳", states: ["sunset", "dusk"] },
  { key: "night", title: "🌙 밤이 깊은 곳", states: ["night", "deepnight"] },
];

/* ---------- 계산 ---------- */

function solarElevation(lat, lon, date) {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86400000);
  const decl = -23.44 * rad * Math.cos((2 * Math.PI / 365) * (day + 10));
  const timeUTC = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTime = timeUTC + lon / 15;
  const hourAngle = (((solarTime + 24) % 24) - 12) * 15 * rad;
  const latR = lat * rad;
  const sinElev = Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle);
  return { elev: Math.asin(sinElev) / rad, morning: hourAngle < 0 };
}

function classify(lat, lon, tz, date) {
  const { elev, morning } = solarElevation(lat, lon, date);
  const hour = localHour(tz, date);
  // '한낮'은 해가 높다고 다가 아니라 시계도 낮이어야 함 (여름 오전 9시의 고도 함정 방지)
  if (elev > 30 && hour >= 11 && hour < 15) return "midday";
  if (elev > 10) return morning ? "morning" : "afternoon";
  if (elev > 0) return morning ? "sunrise" : "sunset";
  if (elev > -8) return morning ? "dawn" : "dusk";
  if (hour >= 22 || hour < 4) return "deepnight";
  return morning ? "dawn" : "night";
}

const fmtCache = {};
function fmt(tz, opts, date) {
  const key = tz + JSON.stringify(opts);
  if (!fmtCache[key]) fmtCache[key] = new Intl.DateTimeFormat("ko-KR", { timeZone: tz, ...opts });
  return fmtCache[key].format(date);
}
const hourCache = {};
function localHour(tz, date) {
  // ko-KR은 "9시"처럼 접미사가 붙어 Number() 파싱이 깨지므로 en-US 고정
  if (!hourCache[tz]) {
    hourCache[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false });
  }
  return Number(hourCache[tz].format(date).replace(/\D/g, "")) % 24;
}
function clockText(tz, date) {
  return fmt(tz, { hour: "2-digit", minute: "2-digit", hour12: false }, date);
}

function tzOffsetMin(tz, date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

function haversine(a, b, c, d) {
  const rad = Math.PI / 180;
  const x = Math.sin(((c - a) * rad) / 2) ** 2 +
    Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(x));
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

/* ---------- 렌더 ---------- */

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
const userCoords = TZ_COORDS[userTz] || TZ_COORDS["Asia/Seoul"];
const userCityRaw = userTz.split("/").pop();
const userCity = TZ_CITY_KO[userCityRaw] || userCityRaw.replace(/_/g, " ");

// 대척점에서 가장 가까운 도시
const antiLat = -userCoords[0];
const antiLon = userCoords[1] > 0 ? userCoords[1] - 180 : userCoords[1] + 180;
const antipode = CITIES.reduce((best, c) => {
  const d = haversine(antiLat, antiLon, c.lat, c.lon);
  return !best || d < best.d ? { c, d } : best;
}, null);

function activityOf(hour) {
  for (const [a, b, text] of ACTIVITIES) if (hour >= a && hour <= b) return text;
  return "살아가고 있을";
}

function cardHTML(city, date, minuteSeed) {
  const state = classify(city.lat, city.lon, city.tz, date);
  const s = STATES[state];
  const diff = Math.round((tzOffsetMin(city.tz, date) - tzOffsetMin(userTz, date)) / 60);
  const diffText = diff === 0 ? "같은 시간" : diff > 0 ? `+${diff}시간` : `${diff}시간`;
  const line = pick(s.lines, minuteSeed + city.name.length);
  return `
    <div class="card sky-${state}">
      <div class="card-top">
        <span class="card-city">${city.flag} ${city.name}</span>
        <span class="card-state">${s.emoji} ${s.label}</span>
      </div>
      <div class="card-clock" data-tz="${city.tz}">${clockText(city.tz, date)}</div>
      <div class="card-diff">${diffText}</div>
      <p class="card-line">${line}</p>
      <p class="card-sig">${city.sig}</p>
    </div>`;
}

function renderAll() {
  const now = new Date();
  const minuteSeed = Math.floor(now.getTime() / 60000);
  const hour = localHour(userTz, now);

  // 히어로
  document.getElementById("heroHere").textContent = `당신의 지금 · ${userCity}`;
  document.getElementById("heroDate").textContent =
    fmt(userTz, { month: "long", day: "numeric", weekday: "long" }, now);
  document.getElementById("heroLine").textContent =
    `당신이 ${activityOf(hour)} 시간, 지구 위에서는 이런 일들이 일어나고 있어요.`;

  // 대척점 카드
  const anti = antipode.c;
  const antiState = STATES[classify(anti.lat, anti.lon, anti.tz, now)];
  document.getElementById("antipodeCard").innerHTML = `
    <div class="anti-badge">진짜 지구 반대편 🌏</div>
    <p class="anti-line">
      ${userCity}의 대척점에서 가장 가까운 도시, <strong>${anti.flag} ${anti.name}</strong>는
      지금 <strong>${antiState.emoji} ${antiState.label}</strong>이에요.
      땅을 파고 ${Math.round(12742 - antipode.d / 2)}km쯤 내려가면 만날 수 있어요. 아마도요.
    </p>`;

  // 그룹
  const byState = {};
  for (const city of CITIES) {
    const st = classify(city.lat, city.lon, city.tz, now);
    (byState[st] ||= []).push(city);
  }
  document.getElementById("groups").innerHTML = GROUPS.map((g) => {
    const cities = g.states.flatMap((st) => byState[st] || []);
    if (!cities.length) return "";
    return `
      <section class="group">
        <h2 class="group-title">${g.title}</h2>
        <div class="cards">${cities.map((c) => cardHTML(c, now, minuteSeed)).join("")}</div>
      </section>`;
  }).join("");
}

// 매초: 시계만 갱신 / 매분: 전체 재렌더
function tickClocks() {
  const now = new Date();
  document.getElementById("heroClock").textContent =
    fmt(userTz, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }, now);
  document.querySelectorAll(".card-clock").forEach((el) => {
    el.textContent = clockText(el.dataset.tz, now);
  });
}

renderAll();
tickClocks();
setInterval(tickClocks, 1000);
setInterval(renderAll, 60000);
