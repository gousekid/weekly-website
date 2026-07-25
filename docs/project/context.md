# Context

## 프로젝트 정체
- "weekly-website": 매주 1개씩 재미있는 웹사이트를 만들어 배포하는 개인 프로젝트.
- 시작일: 2026-07-25.
- 레포 구조: 루트 랜딩 페이지(`index.html`)가 주차별 사이트 목록을 보여주고, 각 주차 사이트는 `weeks/NN-slug/` 폴더에 독립 정적 사이트로 존재.

## 기술 결정
- 각 주차 사이트는 기본적으로 빌드 도구 없는 순수 정적 HTML/CSS/JS. 필요해지는 주차에만 도구 도입.
- 이 머신에 Bun은 미설치 상태(2026-07-25 기준). 정적 사이트라 현재는 불필요. 도구가 필요해지면 Bun 우선 사용(전역 CLAUDE.md 정책).
- 배포: GitHub Pages 확정 (2026-07-25). 공개 레포 `gousekid/weekly-website`, main 브랜치 루트에서 legacy build. push만 하면 자동 재배포.
- 라이브 URL: https://gousekid.github.io/weekly-website/
- 커밋 규칙: 커밋에 Claude 서명(Co-Authored-By 등) 넣지 않음. 저자는 gousekid만 (사용자 지시, 2026-07-25).

## 주차별 기록
- Week 01 (2026-07-25): 오늘의 퇴사 사유 생성기 — `weeks/01-resignation-generator/`. 사직서 문서 UI, 진지/광기 모드, 캔버스 기반 이미지 저장, Web Share API 공유. KO/EN 이중 언어(토글, localStorage, ?lang=en). 사유 풀: KO 1104/1104, EN 1080/1080 — 병렬 에이전트 16개(언어×모드×4테마)로 생성 후 정규화 중복 제거.

## 제약/리스크
- 외부 의존성 최소화(각 사이트는 폰트 CDN 정도만 허용). 오프라인에서도 동작하도록 폰트 실패 시 시스템 serif 폴백.
- 이미지 저장은 html2canvas 같은 라이브러리 대신 직접 캔버스에 그리는 방식 채택(의존성 0 유지).
