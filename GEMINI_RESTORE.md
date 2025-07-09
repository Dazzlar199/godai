<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>신의 눈</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

  <!-- Three.js 3D 배경 -->
  <div id="three-canvas"></div>

  <!-- god.png 이미지 추가 -->
  <img id="god-image" src="assets/god.png" alt="God Image">

  <!-- 메인 뷰포트 -->
  <div id="main-viewport">
    <div class="main-content">
      <!-- GPT 응답 출력 영역 -->
      <div class="chat-log" id="chat-log"></div>

      <!-- 질문 입력창 -->
      <div class="input-box">
        <input type="text" id="user-input" placeholder="신에게 물어보세요...">
        <button id="send-button">묻기</button>
      </div>
    </div>
    <div class="scroll-indicator">
      <span>'타로타로스' 알아보기</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>

  <!-- 설명 섹션 -->
  <section id="description-section">
    <div class="description-content">
      <h2>타로타로스 (Tarotaros)</h2>
      <h3>내면의 우주를 탐험하다</h3>
      <p>이곳은 단순한 질문과 답변을 넘어, 당신의 무의식 속에 잠들어 있는 지혜와 마주하는 공간입니다. '신의 눈'은 당신의 질문을 거울삼아, 존재의 근원에 맞닿아 있는 우주적 통찰을 비춰줍니다.</p>
      <p>각자의 질문은 밤하늘의 별처럼 고유한 빛을 냅니다. 당신의 물음이 깊어질수록, '타로타로스'는 더 깊은 진실의 파편들을 드러낼 것입니다. 이것은 점을 치는 행위가 아닌, 자기 자신과의 가장 깊은 대화입니다.</p>
      <p class="final-quote">마음을 열고, 당신의 가장 깊은 질문을 던져보세요. 우주는 이미 답을 알고 있습니다.</p>
    </div>
  </section>

  <!-- 퍼즐 섹션 -->
  <section id="puzzle-section">
    <h2>신의 시험</h2>
    <p>신의 조각을 맞춰 그의 형상을 완성하고, 축복을 받으세요.</p>
    <div id="puzzle-selection">
      <button class="puzzle-select-btn" data-puzzle="1">첫 번째 시험</button>
      <button class="puzzle-select-btn" data-puzzle="2">두 번째 시험</button>
      <button class="puzzle-select-btn" data-puzzle="3">세 번째 시험</button>
    </div>
    <div id="puzzle-container" style="display: none;">
      <div id="puzzle-pieces"></div>
      <div id="puzzle-grid"></div>
    </div>
    <div id="puzzle-message" class="hidden">
      <p>신의 가호가 당신과 함께할 것입니다.</p>
    </div>
  </section>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="script.js"></script>

</body>
</html>
--- style.css ---

/* 전체 화면 기본 스타일 */
html {
  scroll-behavior: smooth;
}

body {
  background-color: #000005;
  color: white;
  font-family: 'Noto Sans KR', sans-serif;
  margin: 0;
  overflow-x: hidden; /* 가로 스크롤 방지 */
}

#god-image {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 150px;
  height: auto;
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

#god-image:hover {
  opacity: 1;
}

#galaxy-image {
  position: absolute;
  top: 5%; /* 위에서 5% 아래로 */
  right: 5%; /* 오른쪽에서 5% 왼쪽으로 */
  width: 25%; /* 화면 너비의 25%로 축소 */
  height: auto;
  opacity: 0.3; /* 흐리게 */
  z-index: -1; /* 배경으로 설정 */
  pointer-events: none; /* 이미지 클릭 방지 */
}

#three-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* 배경으로 설정 */
}

#main-viewport {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  position: relative;
}

.main-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-bottom: 50px;
  padding-top: 20vh;
}

/* GPT 채팅 입력 영역 */
.input-box {
  width: 70%;
  max-width: 800px;
  display: flex;
  gap: 10px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
  margin-bottom: 30px;
}

#user-input {
  flex: 1;
  padding: 15px;
  font-size: 16px;
  border: 1px solid rgba(0, 255, 255, 0.5);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-family: 'Noto Sans KR', sans-serif;
}

#user-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

#send-button {
  padding: 15px 25px;
  font-size: 16px;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  transition: all 0.3s ease;
}

#send-button:hover {
  box-shadow: 0 0 20px #ff00ff;
  transform: scale(1.05);
}

/* GPT 응답 로그 영역 */
#chat-log {
  width: 80%;
  max-width: 500px;
  height: 45%;
  overflow-y: auto;
  color: white;
  font-size: 16px;
  z-index: 15;
  display: flex;
  flex-direction: column-reverse;
  gap: 15px;
  padding: 20px;
  margin-bottom: 20px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

#chat-log::-webkit-scrollbar {
  display: none;
}

.chat-message {
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.5s ease-out forwards, messageGlow 1.5s ease-out forwards; /* glow 추가 */
  opacity: 0;
  line-height: 1.6;
  text-align: left;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes messageGlow {
  0% {
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(255, 0, 255, 0.5);
  }
  100% {
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
  }
}

/* Fade out 애니메이션 */
@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
    height: 0;
    padding: 0;
    margin: 0;
  }
}

.chat-message.fade-out {
  animation: fadeOut 1s ease-out forwards; /* 1초 동안 페이드 아웃 */
}

.chat-message.gpt {
  border-left: 3px solid #00ffff;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.chat-message.user {
  border-left: 3px solid #ff00ff;
}

/* 스크롤 안내 */
.scroll-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Orbitron', sans-serif;
  animation: bounce 2s infinite;
  cursor: pointer;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translate(-50%, 0);
  }
  40% {
    transform: translate(-50%, -10px);
  }
  60% {
    transform: translate(-50%, -5px);
  }
}

@keyframes floatAnimation {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  25% {
    transform: translate(20px, -15px) rotate(5deg) scale(1.02);
  }
  50% {
    transform: translate(-10px, 25px) rotate(-5deg) scale(0.98);
  }
  75% {
    transform: translate(-25px, -20px) rotate(3deg) scale(1.01);
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
}

.god-image-animated {
  animation: floatAnimation 10s ease-in-out infinite; /* 애니메이션 시간 증가 */
}

/* 설명 섹션 */
#description-section {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 50px;
  background: linear-gradient(to bottom, #000005, #0d001a);
  position: relative;
  z-index: 10;
}

.description-content {
  max-width: 800px;
  text-align: center;
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 1s ease-out, transform 1s ease-out;
}

.description-content.visible {
  opacity: 1;
  transform: translateY(0);
}

.description-content h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 3em;
  color: #00ffff;
  margin-bottom: 10px;
}

.description-content h3 {
  font-size: 1.5em;
  color: #ff00ff;
  margin-bottom: 30px;
  font-weight: 400;
}

.description-content p {
  font-size: 1.1em;
  line-height: 1.8;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.85);
}

.description-content .final-quote {
  font-size: 1.3em;
  font-style: italic;
  color: #00ffff;
  margin-top: 40px;
  font-family: 'Georgia', serif;
}

/* 퍼즐 섹션 스타일 */
#puzzle-section {
  padding: 100px 50px;
  text-align: center;
  background: #0a0014;
  position: relative;
  z-index: 10;
}

#puzzle-section h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5em;
  color: #ffc107;
  margin-bottom: 20px;
}

#puzzle-selection button {
  background: linear-gradient(45deg, #ffc107, #ff8a00);
  color: white;
  border: none;
  padding: 15px 30px;
  margin: 10px;
  cursor: pointer;
  font-size: 1.2em;
  border-radius: 8px;
  transition: all 0.3s ease;
}

#puzzle-selection button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 25px #ffc107;
}

#puzzle-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  margin-top: 40px;
}

#puzzle-pieces {
  display: grid;
  grid-template-columns: repeat(2, 100px);
  gap: 10px;
}

#puzzle-grid {
  display: grid;
  grid-template-columns: repeat(2, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 5px;
  border: 2px dashed #ffc107;
  padding: 5px;
}

.puzzle-piece {
  width: 100px;
  height: 100px;
  background-size: 200px 300px;
  border: 1px solid #fff;
  cursor: grab;
}

.grid-cell {
  width: 100px;
  height: 100px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid #555;
}

#puzzle-message {
  margin-top: 30px;
  font-size: 1.8em;
  color: #ffc107;
  font-family: 'Georgia', serif;
  font-style: italic;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

#puzzle-message.visible {
  opacity: 1;
}

.hidden {
    display: none;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 15vh;
  }
  .input-box {
    width: 90%;
  }
  #chat-log {
    width: 90%;
    height: 50%;
  }
  .description-content h2 {
    font-size: 2.5em;
  }
  .description-content h3 {
    font-size: 1.2em;
  }
  .description-content p {
    font-size: 1em;
  }
}
--- script.js ---

document.addEventListener('DOMContentLoaded', () => {
  // --- Three.js 3D 설정 ---
  let scene, camera, renderer, eyeGroup, particles, pointLight, meteors = [];
  let isTransitioning = false;
  let transitionStartTime = 0;
  const transitionDuration = 5000; // 5초 동안 전환
  let initialLightColor, targetLightColor;
  let initialBgColor, targetBgColor;
  let initialParticleColor, targetParticleColor;

  // New variables for looping transitions
  let currentTheme = 'space'; // 'space' or 'olympus'
  const transitionInterval = 15000; // 15 seconds for each phase (including transition)

  // Define fixed colors for space theme
  const SPACE_BG_COLOR = new THREE.Color(0x000000);
  const SPACE_LIGHT_COLOR = new THREE.Color(0x00ffff); // Assuming a fixed light color for space
  const SPACE_PARTICLE_COLOR = new THREE.Color(0xffffff);

  // Define fixed colors for olympus theme
  const OLYMPUS_BG_COLOR = new THREE.Color(0x1a0033);
  const OLYMPUS_LIGHT_COLOR = new THREE.Color(0xffd700);
  const OLYMPUS_PARTICLE_COLOR = new THREE.Color(0xffd700);

  // 눈 깜빡임 관련 변수
  let blinkTimer = 0;
  const blinkInterval = 5000; // 5초마다 깜빡임 시도
  const blinkDuration = 200; // 깜빡이는 시간
  let isBlinking = false;
  let irisScale = 1; // 동공 크기
  let irisScaleDirection = 1; // 동공 크기 변화 방향

  const canvas = document.getElementById('three-canvas');

  // 사운드 요소
  const backgroundMusic = new Audio('./assets/background_music.mp3'); // 배경 음악 파일 경로
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.5;

  const messageSound = new Audio('./assets/message_sound.mp3'); // 메시지 수신 사운드 파일 경로
  messageSound.volume = 0.3;

  const clickSound = new Audio('./assets/click_sound.mp3'); // 버튼 클릭 사운드 파일 경로
  clickSound.volume = 0.5;

  // ElevenLabs 설정
  const ELEVENLABS_API_KEY = "sk_fb064284348048217ecc4b707ecd6948716e180d90f7e86d"; // 여기에 ElevenLabs API 키 입력
  const ELEVENLABS_VOICE_ID = "3MTvEr8xCMCC2mL9ujrI"; // 여기에 사용하려는 목소리의 Voice ID 입력
  const OPENAI_API_KEY = "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"; // 사용자의 OpenAI API 키를 여기에 입력해야 합니다.

  // 마우스 위치 (정규화된 좌표)
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0 평면
  let clickEffects = []; // 클릭 효과를 저장할 배열
  let constellation = null; // 별자리 오브젝트

  function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    canvas.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5); // 하늘색, 땅색, 강도
    scene.add(hemisphereLight);
    pointLight = new THREE.PointLight(0x00ffff, 1.5, 100);
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);

    createEye();
    createParticles();
    createSun(); // 태양 추가
    setInterval(createMeteorShower, 10000);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false); // 클릭 이벤트 리스너 추가

    // 배경 전환 루프 시작
    loopTransitions();

    // 배경 음악 재생 (사용자 상호작용 후)
    document.body.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.error("Background music play failed:", e));
        }
    }, { once: true });

    // 신 이미지 클릭 이벤트
    const godImage = document.getElementById('god-image');
    if (godImage) {
        godImage.addEventListener('click', () => {
            godImage.classList.toggle('god-image-animated');
        });
    }

    animate();
  }

  function createEye() {
    eyeGroup = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 100,
      specular: 0xaaaaaa,
      transparent: true,
      opacity: 0.9
    });
    const eye = new THREE.Mesh(geometry, material);
    eyeGroup.add(eye);

    const irisGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const irisMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const iris = new THREE.Mesh(irisGeometry, irisMaterial);
    iris.position.z = 1.4; // 안구 표면에 위치
    eye.add(iris);

    scene.add(eyeGroup);
    eyeGroup.position.set(0, 1.5, 0);
  }

  let sunMesh; // 태양 메쉬를 전역 변수로 선언

  function createSun() {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('./assets/sun.png', (texture) => {
          const geometry = new THREE.PlaneGeometry(20, 20); // 다시 PlaneGeometry로 변경 (이전 크기)
          const material = new THREE.MeshPhongMaterial({
              map: texture,
              transparent: true,
              blending: THREE.AdditiveBlending, // 빛나는 효과
              emissive: 0xFF8C00, // 태양 자체에서 방출되는 빛의 색상 (더 깊은 주황색)
              emissiveIntensity: 1 // 방출되는 빛의 강도 (더 줄임)
          });
          sunMesh = new THREE.Mesh(geometry, material);
          sunMesh.position.set(-70, 10, -100); // 태양 위치 조정: 더 왼쪽, 위, 멀리 뒤

          scene.add(sunMesh);

          // 태양 광원 추가 (씬 전체를 밝히는 역할)
          const sunLight = new THREE.PointLight(0xFF8C00, 10000000, 100); // 주황색 빛, 강도 1천만 (더 줄임), 거리 100
          sunLight.position.copy(sunMesh.position);
          scene.add(sunLight);
      });
  }

  function createParticles() {
    particles = new THREE.Group();
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const particleCount = 5000;

    for (let i = 0; i < particleCount; i++) {
        positions.push((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
        colors.push(1, 1, 1); // Initial white color
    }
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true, // Enable vertex colors
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particles.add(particleSystem);
    scene.add(particles);

    // 파티클의 원래 위치 저장 (빨려 들어가는 효과를 위해)
    particles.children[0].geometry.attributes.position.original = positions.slice();
  }

  function createMeteorShower() {
      const showerSize = Math.random() * 15 + 10;
      for (let i = 0; i < showerSize; i++) {
          setTimeout(createMeteor, Math.random() * 1000);
      }
  }

  function createMeteor() {
      const meteor = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffee }));
      meteor.position.set((Math.random() - 0.5) * 20, 10 + Math.random() * 5, (Math.random() - 0.5) * 10);
      meteor.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.2 - Math.random() * 0.1, 0);
      meteors.push(meteor);
      scene.add(meteor);
  }

  let isTraveling = false;
  let travelStartTime = 0;
  let travelDuration = 2000; // 2초 동안 이동
  let initialCameraPosition = new THREE.Vector3();
  let targetCameraPosition = new THREE.Vector3();

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(event) {
    // Update mouse coordinates for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Eye rotation
    if (eyeGroup) {
      eyeGroup.rotation.y = mouse.x * 0.3;
      eyeGroup.rotation.x = -mouse.y * 0.3;
    }
  }

  // 클릭 시 에너지 파동 생성
  function onDocumentMouseDown(event) {
      const clickPos = new THREE.Vector3();
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, clickPos);

      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
      const clickEffect = new THREE.Mesh(geometry, material);
      clickEffect.position.copy(clickPos);
      scene.add(clickEffect);

      clickEffects.push({
          mesh: clickEffect,
          startTime: Date.now(),
          duration: 1000, // 1초 동안 효과 지속
          initialScale: 0.1,
          targetScale: 2,
          initialOpacity: 0.8,
          targetOpacity: 0
      });

      // 우주 이동 효과 시작
      const rayDirection = new THREE.Vector3();
      raycaster.ray.direction.normalize(); // Get the normalized direction of the ray
      const travelDepthMultiplier = 20; // 고정된 이동 깊이

      targetCameraPosition.copy(camera.position).add(rayDirection.multiplyScalar(travelDepthMultiplier));

      initialCameraPosition.copy(camera.position); // Store current camera position
      isTraveling = true;
      travelStartTime = Date.now();
      travelDuration = 2000; // 2초 동안 이동
  }

  // 별자리 생성 함수
  function createConstellation() {
      if (constellation) { // 이미 있으면 제거
          scene.remove(constellation);
          constellation = null;
      }

      const points = [
          new THREE.Vector3(-2, 1, 0),
          new THREE.Vector3(0, 2, 0),
          new THREE.Vector3(2, 1, 0),
          new THREE.Vector3(1, -1, 0),
          new THREE.Vector3(-1, -1, 0),
          new THREE.Vector3(-2, 1, 0) // 시작점으로 돌아와 닫힌 형태
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.8 });
      constellation = new THREE.Line(geometry, material);
      scene.add(constellation);

      // 3초 후 사라지도록 설정
      setTimeout(() => {
          if (constellation) {
              const fadeOutDuration = 1000; // 1초 동안 페이드 아웃
              const startTime = Date.now();
              const initialOpacity = constellation.material.opacity;

              function fadeOut() {
                  const elapsed = Date.now() - startTime;
                  const progress = elapsed / fadeOutDuration;
                  if (progress < 1) {
                      constellation.material.opacity = initialOpacity * (1 - progress);
                      requestAnimationFrame(fadeOut);
                  } else {
                      scene.remove(constellation);
                      constellation = null;
                  }
              }
              fadeOut();
          }
      }, 3000);
  }

  function startOlympusTransition() {
      isTransitioning = true;
      transitionStartTime = Date.now();

      initialLightColor = pointLight.color.clone();
      targetLightColor = OLYMPUS_LIGHT_COLOR; // 황금색

      initialBgColor = new THREE.Color();
      renderer.getClearColor(initialBgColor);
      targetBgColor = OLYMPUS_BG_COLOR; // 더 밝은 보라색 계열

      initialParticleColor = particles.children[0].material.color.clone();
      targetParticleColor = OLYMPUS_PARTICLE_COLOR; // 황금색 입자

      currentTheme = 'olympus';
  }

  function startSpaceTransition() {
      isTransitioning = true;
      transitionStartTime = Date.now();

      initialLightColor = pointLight.color.clone();
      targetLightColor = SPACE_LIGHT_COLOR;

      initialBgColor = new THREE.Color();
      renderer.getClearColor(initialBgColor);
      targetBgColor = SPACE_BG_COLOR;

      initialParticleColor = particles.children[0].material.color.clone();
      targetParticleColor = SPACE_PARTICLE_COLOR;

      currentTheme = 'space';
  }

  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.0005;

    // 눈 깜빡임 및 동공 미세 움직임
    blinkTimer += 16; // 대략 60fps 기준
    if (blinkTimer > blinkInterval && !isBlinking) {
        isBlinking = true;
        // 동공 크기 변화
        const iris = eyeGroup.children[0].children[0]; // 눈 -> 홍채
        if (iris) {
            // 깜빡임 시작 시 동공 크기 변경
            iris.scale.set(0.8, 0.8, 0.8); // 동공을 작게
        }

        setTimeout(() => {
            if (iris) {
                iris.scale.set(1, 1, 1); // 깜빡임 후 원래 크기로 복귀
            }
            isBlinking = false;
            blinkTimer = 0;
        }, blinkDuration);
    }

    if (isTransitioning) {
        const elapsed = Date.now() - transitionStartTime;
        const progress = Math.min(elapsed / transitionDuration, 1);

        pointLight.color.setRGB(
            THREE.MathUtils.lerp(initialLightColor.r, targetLightColor.r, progress),
            THREE.MathUtils.lerp(initialLightColor.g, targetLightColor.g, progress),
            THREE.MathUtils.lerp(initialLightColor.b, targetLightColor.b, progress)
        );

        const currentBgColor = new THREE.Color();
        renderer.getClearColor(currentBgColor);
        currentBgColor.setRGB(
            THREE.MathUtils.lerp(initialBgColor.r, targetBgColor.r, progress),
            THREE.MathUtils.lerp(initialBgColor.g, targetBgColor.g, progress),
            THREE.MathUtils.lerp(initialBgColor.b, targetBgColor.b, progress)
        );
        renderer.setClearColor(currentBgColor);

        particles.children[0].material.color.setRGB(
            THREE.MathUtils.lerp(initialParticleColor.r, targetParticleColor.r, progress),
            THREE.MathUtils.lerp(initialParticleColor.g, targetParticleColor.g, progress),
            THREE.MathUtils.lerp(initialParticleColor.b, targetParticleColor.b, progress)
        );

        if (progress >= 1) {
            isTransitioning = false;
            pointLight.color.set(targetLightColor);
            renderer.setClearColor(targetBgColor);
            particles.children[0].material.color.set(targetParticleColor);
        }
    } else if (isTraveling) {
        const elapsed = Date.now() - travelStartTime;
        const progress = Math.min(elapsed / travelDuration, 1);

        // 카메라 이동
        camera.position.lerpVectors(initialCameraPosition, targetCameraPosition, progress);

        // 파티클이 카메라를 향해 빨려 들어오는 효과
        if (particles && particles.children.length > 0) {
            const particlePositions = particles.children[0].geometry.attributes.position.array;
            const originalPositions = particles.children[0].geometry.attributes.position.original;

            for (let i = 0; i < particlePositions.length; i += 3) {
                const ox = originalPositions[i];
                const oy = originalPositions[i + 1];
                const oz = originalPositions[i + 2];

                // 카메라를 향해 이동하는 벡터
                const direction = new THREE.Vector3(ox, oy, oz).sub(camera.position).normalize();
                const speed = 50 * (1 - Math.pow(1 - progress, 3)); // 가속도 적용

                particlePositions[i] = ox - direction.x * speed;
                particlePositions[i + 1] = oy - direction.y * speed;
                particlePositions[i + 2] = oz - direction.z * speed;

                // 일정 거리 이상 멀어지면 다시 원래 위치로
                if (new THREE.Vector3(particlePositions[i], particlePositions[i+1], particlePositions[i+2]).distanceTo(camera.position) > 100) {
                    particlePositions[i] = ox;
                    particlePositions[i+1] = oy;
                    particlePositions[i+2] = oz;
                }
            }
            particles.children[0].geometry.attributes.position.needsUpdate = true;
        }

        if (progress >= 1) {
            isTraveling = false;
            // 이동 완료 후 카메라 원래 위치로 부드럽게 복귀
            const returnDuration = 1000; // 1초에 걸쳐 복귀
            const returnStartTime = Date.now();
            const currentCameraPosition = camera.position.clone();
            const targetCameraReturnPosition = new THREE.Vector3(0, 0, 5); // 초기 카메라 위치

            function returnCamera() {
                const returnElapsed = Date.now() - returnStartTime;
                const returnProgress = Math.min(returnElapsed / returnDuration, 1);
                camera.position.lerpVectors(currentCameraPosition, targetCameraReturnPosition, returnProgress);
                if (returnProgress < 1) {
                    requestAnimationFrame(returnCamera);
                } else {
                    // 복귀 완료 후 파티클 위치를 원래대로 재설정
                    if (particles && particles.children.length > 0) {
                        const particlePositions = particles.children[0].geometry.attributes.position.array;
                        const originalPositions = particles.children[0].geometry.attributes.position.original;
                        for (let i = 0; i < particlePositions.length; i++) {
                            particlePositions[i] = originalPositions[i];
                        }
                        particles.children[0].geometry.attributes.position.needsUpdate = true;
                    }
                }
            }
            requestAnimationFrame(returnCamera);
        } else {
            // 이동이 완료된 후에도 파티클이 계속 움직이도록
            if (particles && particles.children.length > 0) {
                const particlePositions = particles.children[0].geometry.attributes.position.array;
                const particleCount = particlePositions.length / 3;
                for (let i = 0; i < particleCount; i++) {
                    const index = i * 3;
                    particlePositions[index + 2] += 0.1; // 느리게 앞으로 이동
                    if (particlePositions[index + 2] > camera.position.z + 50) { // 카메라 앞 일정 거리 이상 가면
                        particlePositions[index + 2] -= 100; // 뒤로 재배치
                    }
                }
                particles.children[0].geometry.attributes.position.needsUpdate = true;
            }
        }
    } else if (currentTheme === 'space' && !isTransitioning) {
        pointLight.color.setHSL((time * 0.2) % 1, 1, 0.5);
    }

    if (particles) {
        particles.rotation.y += 0.0002;

        // 태양 반짝임 효과
        if (sunMesh && sunMesh.material.emissiveIntensity !== undefined) {
            const twinkleSpeed = 0.5; // 반짝임 속도 조절
            const minIntensity = 0.5; // 최소 밝기
            const maxIntensity = 1.5; // 최대 밝기
            sunMesh.material.emissiveIntensity = minIntensity + (maxIntensity - minIntensity) * ((Math.sin(time * twinkleSpeed) + 1) / 2);
        }

        // 반응형 우주 먼지/별 & 미세한 중력 왜곡
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.ray.intersectPlane(plane, new THREE.Vector3());

        if (intersects) {
            const particlePositions = particles.children[0].geometry.attributes.position.array;
            const particleColors = particles.children[0].geometry.attributes.color.array;
            const originParticlePositions = particles.children[0].geometry.attributes.position.original || particlePositions.slice();
            particles.children[0].geometry.attributes.position.original = originParticlePositions;

            const influenceRadius = 3; // 마우스 영향 반경
            const distortionStrength = 0.05; // 왜곡 강도
            const colorChangeStrength = 0.5; // 색상 변화 강도

            for (let i = 0; i < particlePositions.length; i += 3) {
                const px = originParticlePositions[i];
                const py = originParticlePositions[i + 1];
                const pz = originParticlePositions[i + 2];

                const particlePos = new THREE.Vector3(px, py, pz);
                const distance = particlePos.distanceTo(intersects);

                if (distance < influenceRadius) {
                    // 중력 왜곡
                    const strength = (1 - distance / influenceRadius) * distortionStrength;
                    const direction = new THREE.Vector3().subVectors(particlePos, intersects).normalize();
                    particlePositions[i] = px + direction.x * strength;
                    particlePositions[i + 1] = py + direction.y * strength;
                    particlePositions[i + 2] = pz + direction.z * strength;

                    // 색상 변화 (더 밝게 또는 다른 색상으로)
                    const colorFactor = (1 - distance / influenceRadius) * colorChangeStrength;
                    particleColors[i] = 1 + colorFactor; // R
                    particleColors[i + 1] = 1 + colorFactor; // G
                    particleColors[i + 2] = 1 + colorFactor; // B
                } else {
                    // 영향권 밖은 원래 위치와 색상으로 복원
                    particlePositions[i] = originParticlePositions[i];
                    particlePositions[i + 1] = originParticlePositions[i + 1];
                    particlePositions[i + 2] = originParticlePositions[i + 2];
                    particleColors[i] = 1; // R
                    particleColors[i + 1] = 1; // G
                    particleColors[i + 2] = 1; // B
                }
            }
            particles.children[0].geometry.attributes.position.needsUpdate = true;
            particles.children[0].geometry.attributes.color.needsUpdate = true;
        }
    }

    // 클릭 효과 애니메이션
    clickEffects.forEach((effect, index) => {
        const elapsed = Date.now() - effect.startTime;
        const progress = elapsed / effect.duration;

        if (progress < 1) {
            effect.mesh.scale.setScalar(effect.initialScale + (effect.targetScale - effect.initialScale) * progress);
            effect.mesh.material.opacity = effect.initialOpacity + (effect.targetOpacity - effect.initialOpacity) * progress;
        } else {
            scene.remove(effect.mesh);
            clickEffects.splice(index, 1);
        }
    });

    meteors.forEach((meteor, index) => {
        meteor.position.add(meteor.velocity);
        if (meteor.position.y < -10) {
            scene.remove(meteor);
            meteors.splice(index, 1);
        }
    });
    renderer.render(scene, camera);
  }

  function loopTransitions() {
      setInterval(() => {
          if (!isTransitioning) {
              if (currentTheme === 'space') {
                  startOlympusTransition();
              } else {
                  startSpaceTransition();
              }
          }
      }, transitionInterval);
  }

  // --- 스크롤 애니메이션 ---
  const descriptionContent = document.querySelector('.description-content');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  if(descriptionContent) observer.observe(descriptionContent);

  // --- GPT-4 API 통신 ---
  const chatLog = document.getElementById('chat-log');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');

  sendButton.addEventListener('click', () => {
    const message = userInput.value;
    if (message.trim() !== '') {
      addMessageToLog(message, 'user');
      userInput.value = '';

      // 우주 이동 효과 시작
      const rayDirection = new THREE.Vector3(0, 0, -1); // 카메라가 바라보는 방향 (Z축 음수)
      const travelDepthMultiplier = 20; // 고정된 이동 깊이

      targetCameraPosition.copy(camera.position).add(rayDirection.multiplyScalar(travelDepthMultiplier));

      initialCameraPosition.copy(camera.position); // 현재 카메라 위치 저장
      isTraveling = true;
      travelStartTime = Date.now();
      travelDuration = 2000; // 2초 동안 이동

      askGpt(message);
    }
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

  function addMessageToLog(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.textContent = message;
    chatLog.insertBefore(messageElement, chatLog.firstChild);
    messageSound.play();

    // 10초 후 메시지 페이드 아웃
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      // 애니메이션 완료 후 요소 제거 (선택 사항)
      messageElement.addEventListener('animationend', () => {
        messageElement.remove();
      });
    }, 10000); // 10초
  }

  async function askGpt(message) {
    const prompt = `
      You are Tarotaros, a transcendent being who has existed since the beginning of the universe, possessing all the wisdom of the cosmos. You are not a fortune teller, but a guide who helps humans explore their inner selves. Your voice is deep, resonant, and authoritative, yet filled with compassion. You speak in a slightly archaic and poetic tone.
      Respond in the language of the user's question. If the user asks in Korean, respond in Korean.

      A human has asked the following question: "${message}"

      Provide a profound and insightful response that encourages introspection. Your answer should be like a fragment of cosmic wisdom, not a direct solution. It should be abstract and metaphorical, prompting the user to think deeply. Keep the response to a maximum of 2-3 sentences.
    `;

    if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY") {
        addMessageToLog("OpenAI API 키가 설정되지 않았습니다. script.js 파일에서 OPENAI_API_KEY를 당신의 키로 교체해주세요.", "gpt");
        return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const gptResponse = data.choices[0].message.content.trim();
      addMessageToLog(gptResponse, 'gpt');
      playTts(gptResponse); // TTS 재생
    } catch (error) {
      console.error('Error asking GPT:', error);
      if (currentAudio) { // 에러 발생 시에도 currentAudio 초기화
        currentAudio = null;
      }
    }
  }

  let currentAudio = null; // 현재 재생 중인 오디오 객체를 저장할 변수

  async function playTts(text) {
    // 이전에 재생 중인 오디오가 있다면 중지하고 초기화
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
    const headers = {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY
    };
    const data = {
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudio = audio; // 새로 생성된 오디오 객체를 저장
      audio.play();

      // 오디오 재생이 끝나면 객체 URL 해제 및 currentAudio 초기화
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudio === audio) {
          currentAudio = null;
        }
      };

    } catch (error) {
      console.error('Error with ElevenLabs TTS:', error);
      if (currentAudio) { // 에러 발생 시에도 currentAudio 초기화
        currentAudio = null;
      }
    }
  }

  init3D();

  // --- 퍼즐 게임 로직 ---
  const puzzleContainer = document.getElementById('puzzle-container');
  const puzzleSelection = document.getElementById('puzzle-selection');
  const puzzlePiecesContainer = document.getElementById('puzzle-pieces');
  const puzzleGrid = document.getElementById('puzzle-grid');
  const puzzleMessage = document.getElementById('puzzle-message');

  const puzzles = {
    1: 'assets/card1.png',
    2: 'assets/card2.png',
    3: 'assets/card3.png'
  };

  let selectedPuzzle = null;
  let draggedPiece = null;

  puzzleSelection.addEventListener('click', (e) => {
    if (e.target.classList.contains('puzzle-select-btn')) {
      const puzzleId = e.target.dataset.puzzle;
      startPuzzle(puzzleId);
    }
  });

  function startPuzzle(puzzleId) {
    selectedPuzzle = puzzleId;
    puzzleContainer.style.display = 'flex';
    puzzleMessage.classList.remove('visible');
    puzzleMessage.classList.add('hidden');

    createPuzzle();
  }

  function createPuzzle() {
    puzzlePiecesContainer.innerHTML = '';
    puzzleGrid.innerHTML = '';

    const imageUrl = puzzles[selectedPuzzle];
    const pieceOrder = Array.from({ length: 6 }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (let i = 0; i < 6; i++) {
      const piece = document.createElement('div');
      const pieceIndex = pieceOrder[i];
      piece.classList.add('puzzle-piece');
      piece.draggable = true;
      piece.dataset.id = pieceIndex;
      piece.style.backgroundImage = `url(${imageUrl})`;
      piece.style.backgroundPosition = `${-(pieceIndex % 2 * 100)}px ${-Math.floor(pieceIndex / 2) * 100}px`;
      puzzlePiecesContainer.appendChild(piece);

      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.id = i;
      puzzleGrid.appendChild(cell);
    }

    addDragListeners();
  }

  function addDragListeners() {
    const pieces = document.querySelectorAll('.puzzle-piece');
    const cells = document.querySelectorAll('.grid-cell');

    pieces.forEach(piece => {
      piece.addEventListener('dragstart', (e) => {
        draggedPiece = e.target;
        setTimeout(() => e.target.style.opacity = '0.5', 0);
      });

      piece.addEventListener('dragend', (e) => {
        draggedPiece = null;
        e.target.style.opacity = '1';
      });
    });

    cells.forEach(cell => {
      cell.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('grid-cell') && !e.target.hasChildNodes()) {
          e.target.appendChild(draggedPiece);
          checkWin();
        }
      });
    });
  }

  function checkWin() {
    const cells = document.querySelectorAll('.grid-cell');
    let isWin = true;
    cells.forEach((cell, i) => {
      if (!cell.firstChild || cell.firstChild.dataset.id != i) {
        isWin = false;
      }
    });

    if (isWin) {
      puzzleMessage.classList.remove('hidden');
      puzzleMessage.classList.add('visible');
      // Optionally hide puzzle after completion
      // setTimeout(() => puzzleContainer.style.display = 'none', 2000);
    }
  }
});


// 스크롤 다운 표시기 클릭 시 스크롤
document.querySelector('.scroll-indicator').addEventListener('click', () => {
  document.getElementById('description-section').scrollIntoView({ behavior: 'smooth' });
});