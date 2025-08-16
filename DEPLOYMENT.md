# 🚀 Vercel 배포 가이드

## 📋 사전 준비사항

1. **GitHub 계정**이 있어야 합니다
2. **Vercel 계정**이 있어야 합니다 (GitHub로 가입 가능)
3. **프로젝트 코드**가 GitHub에 업로드되어 있어야 합니다

## 🔄 1단계: GitHub에 코드 업로드

### 로컬에서 Git 초기화 (아직 안 했다면)
```bash
cd ai-god-website_vercel
git init
git add .
git commit -m "Initial commit: Vercel 배포 준비"
```

### GitHub 저장소 생성 및 연결
1. GitHub에서 새 저장소 생성
2. 로컬에서 원격 저장소 연결:
```bash
git remote add origin https://github.com/사용자명/저장소명.git
git branch -M main
git push -u origin main
```

## 🌐 2단계: Vercel에서 프로젝트 배포

### Vercel 로그인
1. [vercel.com](https://vercel.com) 방문
2. "Continue with GitHub" 클릭하여 GitHub 계정으로 로그인

### 새 프로젝트 생성
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 목록에서 방금 업로드한 프로젝트 선택
3. "Import" 클릭

### 프로젝트 설정
- **Project Name**: 원하는 프로젝트 이름 (예: `ai-god-website`)
- **Framework Preset**: `Other` 선택
- **Root Directory**: 비워두기 (기본값)
- **Build Command**: 비워두기
- **Output Directory**: 비워두기
- **Install Command**: 비워두기

### 환경변수 설정 (선택사항)
**Settings** → **Environment Variables**에서 다음 변수들을 추가할 수 있습니다:

```
ELEVENLABS_API_KEY=sk_fb064284348048217ecc4b707ecd6948716e180d90f7e86d
ELEVENLABS_VOICE_ID=uQzNCr78MFVKUWjFnItV
OPENAI_API_KEY=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
```

### 배포 실행
1. "Deploy" 버튼 클릭
2. 배포 진행 상황 모니터링
3. 배포 완료 후 제공되는 URL 확인

## 🔧 3단계: 배포 후 설정

### 커스텀 도메인 설정 (선택사항)
1. **Settings** → **Domains** 클릭
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정

### 자동 배포 설정
- GitHub에 코드를 푸시하면 자동으로 Vercel에 재배포됩니다
- **Settings** → **Git**에서 자동 배포 설정 확인

## 📱 4단계: 테스트 및 확인

### 배포된 사이트 테스트
1. 제공된 Vercel URL로 접속
2. 모든 기능이 정상 작동하는지 확인:
   - 3D 눈 애니메이션
   - 카드 선택
   - MediaPipe 기능
   - 오디오 재생

### 모바일 호환성 확인
- 다양한 디바이스에서 테스트
- 반응형 디자인 확인

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
- **원인**: 잘못된 프레임워크 설정
- **해결**: Framework Preset을 `Other`로 설정

#### 2. 404 에러
- **원인**: SPA 라우팅 문제
- **해결**: `vercel.json`의 routes 설정 확인

#### 3. 정적 파일 로드 실패
- **원인**: 파일 경로 문제
- **해결**: HTML에서 상대 경로(`./static/`) 사용 확인

#### 4. API 키 오류
- **원인**: 환경변수 미설정
- **해결**: Vercel에서 환경변수 설정

### 로그 확인
1. Vercel 대시보드에서 프로젝트 선택
2. **Functions** 탭에서 로그 확인
3. **Deployments**에서 배포 로그 확인

## 📈 성능 최적화

### 이미지 최적화
- WebP 형식 사용
- 적절한 이미지 크기 설정

### JavaScript 번들 최적화
- ES6 모듈 사용
- 불필요한 코드 제거

### 캐싱 설정
- `vercel.json`의 headers 설정으로 정적 파일 캐싱

## 🔄 업데이트 및 재배포

### 코드 변경 후 재배포
```bash
git add .
git commit -m "Update: 기능 개선"
git push origin main
```
- 자동으로 Vercel에 재배포됩니다

### 수동 재배포
1. Vercel 대시보드에서 "Redeploy" 클릭
2. 특정 커밋으로 롤백 가능

## 📞 지원 및 문의

문제가 발생하면:
1. Vercel 공식 문서 확인
2. GitHub Issues에 문제 보고
3. Vercel 커뮤니티 포럼 활용

---

**🎉 축하합니다! 이제 Vercel에 성공적으로 배포되었습니다!**
