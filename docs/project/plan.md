# Plan

## 운영 전략
매주 사이클: 아이디어 확정 → `weeks/NN-slug/`에 구현 → 로컬 QA → 랜딩 페이지에 카드 추가 → 배포 → `docs/project/*` 갱신.

## 배포 전략
- 1주차에 정적 호스팅 플랫폼을 확정하고 파이프라인을 만든다(후보: GitHub Pages / Cloudflare Pages / Vercel).
- 이후 주차는 폴더 추가 + push만으로 배포되는 상태를 유지한다.

## Week 01 구현 계획
1. 정적 사이트 3파일 구성: `index.html`, `style.css`, `app.js` — 의존성 없음(폰트만 Google Fonts).
2. 사직서 UI: 종이 질감 카드, Nanum Myeongjo, 상단 세로 제목, 인적사항 표, 사유 영역, 날짜/서명/도장.
3. 사유 데이터: 모드별 24개 상수 배열(`app.js` 내장).
4. 이미지 저장: `<canvas>`에 문서를 직접 그려 PNG 다운로드(`document.fonts.ready` 대기 후 렌더).
5. 공유: `navigator.share` → 실패/미지원 시 `navigator.clipboard` 텍스트 복사.
6. 루트 랜딩 페이지: 주차 카드 목록, week 01 링크.
7. QA: 로컬 서버 띄워 브라우저 스킬로 스크린샷/동작 확인.
