// Vercel 배포용 API 키 관리
// 환경변수에서 API 키를 가져오거나, 없으면 기본값 사용

// API 키 설정 (환경변수에서 가져오기)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_fb064284348048217ecc4b707ecd6948716e180d90f7e86d";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "uQzNCr78MFVKUWjFnItV";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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";

// 전역 변수로 설정 (브라우저 호환성)
window.ELEVENLABS_API_KEY = ELEVENLABS_API_KEY;
window.ELEVENLABS_VOICE_ID = ELEVENLABS_VOICE_ID;
window.OPENAI_API_KEY = OPENAI_API_KEY;

// 로딩 확인
console.log('[API Keys Vercel] 로딩 완료:', {
  elevenlabs: !!window.ELEVENLABS_API_KEY,
  openai: !!window.OPENAI_API_KEY
});

// API 키가 환경변수에서 로드되었는지 확인
if (process.env.ELEVENLABS_API_KEY) {
  console.log('[API Keys Vercel] 환경변수에서 API 키 로드됨');
} else {
  console.warn('[API Keys Vercel] 환경변수에서 API 키를 찾을 수 없어 기본값 사용');
}
