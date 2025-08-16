import { JourneyManager } from './journey_manager.js';

let journeyManager;

/**
 * 앱을 초기화하고 전역 상태를 설정합니다.
 */
function initializeApp() {
    console.log('[Init] App initialization started.');

    // Three.js 앱 함수는 HTML에서 GLTFLoader 로드 후 전역으로 노출됨
    // window.initThreeApp = initThreeApp;
    // window.startWarpEffect = startWarpEffect;

    // 여정 관리자 시작
    journeyManager = new JourneyManager();

    // 다른 모듈에서 접근할 수 있도록 전역 스코프에 할당
    window.journeyManager = journeyManager;

    console.log('[Init] App initialized successfully.');
}

// Start the app
initializeApp();