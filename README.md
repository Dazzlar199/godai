# 신의 눈 - GOD DOES NOT BLINK

인터랙티브 웹 경험을 통해 사용자의 내면을 탐구하는 프로젝트입니다.

## 🚀 Vercel 배포 방법

### 1. GitHub에 코드 업로드
```bash
git add .
git commit -m "Vercel 배포 준비 완료"
git push origin main
```

### 2. Vercel에서 프로젝트 연결
1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정에서:
   - Framework Preset: `Other`
   - Build Command: 비워두기
   - Output Directory: 비워두기
5. "Deploy" 클릭

### 3. 환경변수 설정 (선택사항)
Vercel 대시보드에서 다음 환경변수를 설정할 수 있습니다:
- `ELEVENLABS_API_KEY`: ElevenLabs API 키
- `ELEVENLABS_VOICE_ID`: ElevenLabs 음성 ID
- `OPENAI_API_KEY`: OpenAI API 키

## 🛠️ 로컬 개발

### 요구사항
- Python 3.7+
- Flask

### 설치 및 실행
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# Flask 서버 실행
python app.py
```

## 📁 프로젝트 구조

```
ai-god-website_vercel/
├── index.html              # 메인 HTML (Vercel 배포용)
├── vercel.json            # Vercel 설정
├── static/                # 정적 파일들
│   ├── css/              # 스타일시트
│   ├── js/               # JavaScript 모듈들
│   └── assets/           # 이미지, 오디오 등
├── templates/             # Flask 템플릿 (로컬 개발용)
├── app.py                # Flask 서버 (로컬 개발용)
└── requirements.txt       # Python 의존성
```

## 🔧 주요 기능

- **3D 눈 애니메이션**: Three.js 기반 인터랙티브 3D 요소
- **운명 카드 선택**: 8개의 운명 카드 중 선택
- **AI 기반 분석**: MediaPipe를 통한 얼굴/손 인식
- **별자리 그리기**: 사용자의 움직임을 통한 창작 활동
- **오디오 시스템**: 배경음악과 효과음

## 🌐 배포 URL

Vercel 배포 후 제공되는 URL로 접근 가능합니다.

## 📝 라이선스

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.
