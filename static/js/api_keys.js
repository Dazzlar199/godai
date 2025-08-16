
// API 키 (보안상 환경변수나 서버에서 관리하는 것을 권장)
const ELEVENLABS_API_KEY = "sk_fb064284348048217ecc4b707ecd6948716e180d90f7e86d";
const ELEVENLABS_VOICE_ID = "uQzNCr78MFVKUWjFnItV";
const OPENAI_API_KEY = "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";

// 전역 변수로 설정 (브라우저 호환성)
window.ELEVENLABS_API_KEY = ELEVENLABS_API_KEY;
window.ELEVENLABS_VOICE_ID = ELEVENLABS_VOICE_ID;
window.OPENAI_API_KEY = OPENAI_API_KEY;

// 로딩 확인
console.log('[API Keys] 로딩 완료:', {
  elevenlabs: !!window.ELEVENLABS_API_KEY,
  openai: !!window.OPENAI_API_KEY
});
