# `main.js` 기능 요약 및 프로젝트 구조

## 프로젝트 구조 (리팩토링 후)

- **`main.js`**: 전체 사용자 경험의 흐름(Phase)을 관리하는 **메인 컨트롤러** 역할에만 집중합니다. 이제 3D 렌더링이나 데이터 관리의 부담을 덜고, 순수하게 상태 전환과 각 단계의 초기화 로직만 담당합니다.
- **`three_app.js`**: Three.js를 이용한 3D 배경(우주, 눈동자, 파티클)의 모든 생성, 애니메이션, 상호작용 로직을 전담하는 모듈입니다.
- **`mediapipe_app.js`**: MediaPipe를 이용한 얼굴 인식 및 분석 관련 로직을 전담합니다.
- **`dilemma_data.js`**: 딜레마 단계에서 사용될 모든 시나리오 데이터를 분리하여 관리합니다.
- **`audio_manager.js`**: 배경음악과 효과음 재생을 담당합니다.

---

## `main.js` 파일 핵심 기능 요약

- **`JourneyManager` 클래스**:
  - `changePhase(phaseNumber)`: 단계(Phase) 전환 및 UI 업데이트
  - `initPhase[N]()`: 각 단계의 초기화 작업 수행 (카드 생성 등)
  - `handleCardClick()`: 카드 선택 로직 처리 및 다음 단계 전환

- **모듈 연동**:
  - `DOMContentLoaded` 시점에 `three_app.js`의 `initThreeApp()`을 호출하여 3D 배경을 활성화합니다.
  - 카드 선택이 완료되면 `mediapipe_app.js`의 `enableCam()`을 호출하여 얼굴 인식을 시작합니다.
  - 딜레마 단계에 필요한 데이터는 `dilemma_data.js`에서 가져와 사용합니다.

## `three_app.js` 파일 핵심 기능 요약

- `initThreeApp()`: 모듈의 진입점으로, 내부의 `init()`과 `animate()` 함수를 호출하여 3D 세계를 구성하고 애니메이션을 시작합니다.
- `init()`: Scene, Camera, Renderer, 조명, 3D 오브젝트(눈, 홍채, 파티클)를 생성하고 초기화합니다.
- `animate()`: `requestAnimationFrame`을 통해 지속적으로 씬을 렌더링하고, 마우스 움직임에 따른 눈동자 애니메이션, 파티클 효과 등을 구현합니다.
- `onWindowResize()`, `onMouseMove()`: 창 크기 조절 및 마우스 움직임에 대응하는 이벤트 리스너입니다.
