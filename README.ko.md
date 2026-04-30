🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 **한국어** • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  탭을 쉬게 하고 메모리를 확보하세요 - 비활성 탭을 자동으로 언로드하는 Chrome 확장 프로그램입니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
</p>

## 기능

- **비활성 탭 자동 언로드** - 설정 가능한 타이머 (5분 ~ 4시간)
- **메모리 임계값** - RAM 사용량이 60~95%를 초과하면 언로드
- **탭별 메모리 제한** - JS heap 사용량이 100MB~1GB를 초과하는 탭 언로드
- **시작 시 언로드** - 브라우저 실행 시 메모리 확보
- **수동 제어** - 현재/왼쪽/오른쪽/다른 탭 언로드
- **중복 탭 닫기** - 현재 창에서 원클릭으로 중복 탭 제거
- **탭 검색** - 제목 또는 URL로 탭 목록을 실시간 필터링
- **탭 그룹** - 탭 그룹 전체 언로드
- **측면 패널 모드** - Chrome 측면 패널에서 TabRest 열기 (선택 사항)
- **탭/사이트 스누즈** - 탭 또는 도메인을 일시적으로 보호 (30분 ~ 2시간)
- **언로드 전 경고 토스트** - 자동 삭제 전 페이지에 3초 경고 표시
- **시각적 표시** - 언로드된 탭 제목에 사용자 지정 접두사 (💤) 표시
- **허용 목록** - 자동 언로드에서 사이트 보호 (localhost 및 IP 지원)
- **가져오기/내보내기** - 허용 목록, 차단 목록, 세션을 JSON으로 백업
- **세션** - 탭 세트 저장 및 복원
- **스크롤 위치 복원** - 탭 새로고침 시 스크롤 위치 복원
- **YouTube 타임스탬프** - 새로고침 후 마지막 재생 위치에서 동영상 재개
- **오프라인 시 건너뛰기** - 네트워크 연결이 없을 때 탭 삭제 안 함
- **유휴 상태 전용 모드** - 컴퓨터가 유휴 상태일 때만 자동 언로드
- **전원 모드** - 절전, 보통, 성능 프로필 선택
- **자동 언로드 알림** - 탭이 언로드될 때 알림 수신
- **메모리 툴팁** - 통계 위에 커서를 올려 탭별 절약 RAM 추정치 확인
- **온보딩 마법사** - 첫 실행 시 단계별 대화형 설정
- **선택적 오류 보고** - Sentry를 통한 익명 충돌 보고 (기본값: 꺼짐) 및 수동 버그 제출
- **자동 변경 로그 열기** - 마이너/메이저 업데이트 시 릴리스 노트 자동 열기
- **선택적 호스트 권한** - 양식 보호는 활성화할 때만 액세스 권한 요청
- **RAM 사용량 표시** - 팝업 헤더에 실시간 RAM 비율 표시
- **통계** - 언로드된 탭 수 및 절약된 메모리 추적
- **다국어 지원** - 11개 언어 지원

## 키보드 단축키

| 단축키        | 동작             |
| ------------- | ---------------- |
| `Alt+Shift+D` | 현재 탭 언로드   |
| `Alt+Shift+O` | 다른 탭 언로드   |
| `Alt+Shift+→` | 오른쪽 탭 언로드 |
| `Alt+Shift+←` | 왼쪽 탭 언로드   |

## 설치

### 소스에서 설치

1. 이 저장소를 클론합니다
2. Chrome에서 `chrome://extensions`를 엽니다
3. "개발자 모드"를 활성화합니다 (오른쪽 상단)
4. "압축 해제된 확장 프로그램 로드"를 클릭합니다
5. 프로젝트 폴더를 선택합니다

### Chrome Web Store에서 설치

출시 예정입니다.

## 작동 방식

TabRest는 Chrome의 네이티브 `chrome.tabs.discard()` API를 사용하여 탭을 언로드합니다. 삭제된 탭은:

- 탭 표시줄에 계속 표시됩니다
- 스크롤 위치와 양식 데이터를 보존합니다
- 클릭하면 즉시 새로고침됩니다
- 비활성 상태에서 메모리를 확보합니다

## 프로젝트 구조

```text
tabrest/
├── manifest.json           # 확장 프로그램 설정 (MV3)
├── _locales/               # i18n 번역 (en, vi)
├── src/
│   ├── background/         # Service worker 모듈
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # 팝업 / 측면 패널 UI
│   ├── options/            # 설정 페이지
│   ├── pages/              # 온보딩, 변경 로그
│   └── shared/             # 공유 유틸리티
├── icons/                  # 확장 프로그램 아이콘
├── website/                # Astro 문서 사이트 (tabrest.ohnice.app)
└── docs/                   # 프로젝트 문서
```

## 개발

```bash
pnpm install          # 의존성 설치
pnpm run lint         # Biome으로 코드 검사
pnpm run lint:fix     # 린트 오류 자동 수정
pnpm run format       # 코드 포맷
pnpm run ci           # 전체 CI 실행 (validate + lint)
```

## 홍보 에셋

Chrome Web Store 홍보 이미지는 `assets/` 디렉터리에 SVG 소스로 저장되어 있습니다.

```bash
./scripts/generate-promo-images.sh   # PNG 파일 생성
```

## 개인 정보 보호

- 데이터 수집 없음
- 외부 서버 없음
- 모든 설정은 로컬에 저장
- [개인정보 처리방침](docs/privacy-policy.md) 참조

## 후원

이 확장 프로그램이 유용하다면 개발을 지원해 주세요:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## 다른 프로젝트

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - 생산성 기능으로 GitHub 인터페이스를 향상시키는 크로스 브라우저 확장 프로그램
- [Termote](https://github.com/lamngockhuong/termote) - 모바일/데스크톱에서 PWA를 통해 CLI 도구 (Claude Code, GitHub Copilot, 모든 터미널)를 원격 제어

## 라이선스

MIT
