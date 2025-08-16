// 전역 변수 선언
let scene, camera, renderer, eyeGroup, particles, pointLight, sunMesh;

// 마우스 및 레이캐스터
const mouse = new THREE.Vector2();

// 눈 깜빡임 관련
let blinkTimer = 0;
const blinkInterval = 4000; // 4초마다 깜빡임
const blinkDuration = 150; // 깜빡임 지속시간 단축
let isBlinking = false;
let blinkScale = 1.0; // 깜빡임시 크기 변화

// 워프 효과 관련
let isWarping = false;
let warpStartTime = 0;
let warpDuration = 0;
const initialCameraZ = 5;

/**
 * 3D 애셋 및 씬 초기화
 */
function init() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) {
    console.error("Three.js canvas not found!");
    return;
  }

  // 1. Scene, Camera, Renderer 설정
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // 렌더러 품질 향상
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // 2. 조명 설정
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.6);
  scene.add(hemisphereLight);
  
  // 메인 포인트 라이트
  pointLight = new THREE.PointLight(0x00ffff, 2.0, 100);
  pointLight.position.set(0, 0, 4);
  scene.add(pointLight);
  
  // 눈을 위한 특별한 조명
  const eyeSpotLight = new THREE.SpotLight(0xffffff, 1.0, 50, Math.PI / 6, 0.5);
  eyeSpotLight.position.set(0, 5, 2);
  eyeSpotLight.target.position.set(0, 1.5, 0);
  scene.add(eyeSpotLight);
  scene.add(eyeSpotLight.target);
  
  // 홍채를 위한 컬러풀한 조명
  const irisLight = new THREE.PointLight(0x1E3A8A, 0.8, 20);
  irisLight.position.set(0, 1.5, 1);
  scene.add(irisLight);

  // 3. 3D 객체 생성
  createEye();
  createSun();
  createParticles();

  // 4. 이벤트 리스너 설정
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onMouseMove, false);
}

/**
 * 중앙의 눈 오브젝트 생성 (3D 모델 사용)
 */
function createEye() {
  eyeGroup = new THREE.Group();
  
  // GLTFLoader가 로드되었는지 확인
  if (typeof THREE.GLTFLoader === 'undefined') {
    console.warn('[ThreeApp] GLTFLoader not loaded, creating simple sphere eye');
    createSimpleEye();
    return;
  }
  
  // GLTFLoader를 사용해서 eye.glb 모델 로드
  const loader = new THREE.GLTFLoader();
  
  // 텍스처 로더 생성
  const textureLoader = new THREE.TextureLoader();
  
  // 텍스처 로딩 개선을 위한 설정
  loader.setPath('./static/assets/models/');
  
  loader.load('eye.glb', (gltf) => {
    const eyeModel = gltf.scene;
    
    // 모델 내의 모든 메시에 대해 재질 확인 및 수정
    let meshCount = 0;
    eyeModel.traverse((child) => {
      if (child.isMesh) {
        console.log('Found mesh:', child.name, 'Index:', meshCount);
        console.log('Material:', child.material);
        
        // 메시 인덱스에 따라 색상 결정
        if (meshCount === 0) {
          // 첫 번째 메시 (Sphere001) - 홍채/동공에 eyeball.png 텍스처 적용
          const eyeballTexture = textureLoader.load(
            './static/assets/eyeball.png',
            // 텍스처 로드 성공
            (texture) => {
              console.log('Eyeball texture loaded successfully!');
              
              // 텍스처 설정
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              
              // 텍스처 크기 조정 (이미지 자체를 축소)
              texture.repeat.set(0.3, 0.3); // 0.3x0.3로 설정 (이미지를 3배 이상 축소)
              
              // 텍스처 오프셋 조정 (텍스처 위치 이동)
              texture.offset.set(0.35, 0.35); // 중앙으로 이동
              
              // 텍스처 회전 (라디안 단위)
              texture.rotation = 0; // 0 = 회전 없음, Math.PI/2 = 90도 회전
              
              // 텍스처 필터링 설정
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              
              texture.encoding = THREE.sRGBEncoding;
              
              // 재질에 텍스처 적용
              child.material.map = texture;
              child.material.needsUpdate = true;
              
              // 텍스처가 제대로 적용되었는지 확인
              console.log('Texture applied to mesh:', child.name);
              console.log('Texture details:', texture);
              
              // 텍스처 조정을 위한 전역 변수에 저장
              window.eyeballTexture = texture;
              window.eyeballMesh = child;
              
              // 사용법 안내
              console.log('🎯 Eyeball texture adjustment functions available!');
              console.log('Use window.adjustEyeballTexture to adjust the texture:');
              console.log('- .setSize(x, y) - 텍스처 크기 조정 (0.1=10배축소, 0.5=2배축소, 1=원본)');
              console.log('- .setOffset(x, y) - 텍스처 위치 조정');
              console.log('- .setRotation(radians) - 텍스처 회전');
              console.log('- .presets.tiny() - 아주 작은 크기 (10배 축소)');
              console.log('- .presets.small() - 작은 크기 (3배 축소) - 기본값');
              console.log('- .presets.medium() - 중간 크기 (2배 축소)');
              console.log('- .presets.large() - 큰 크기 (1.25배 축소)');
              console.log('- .presets.centered() - 중앙 정렬 (3배 축소)');
              console.log('- .presets.noCrack() - 갈라진 부분 피함');
              console.log('- .presets.rotated() - 90도 회전');
              
              // 텍스처 조정 함수들을 전역으로 노출
              window.adjustEyeballTexture = {
                setSize: (x, y) => {
                  // x, y는 0~1 사이의 값으로, 텍스처 크기 결정
                  // 0.1 = 10배 축소, 0.5 = 2배 축소, 1 = 원본 크기
                  texture.repeat.set(x, y);
                  
                  // 중앙 정렬을 위한 오프셋 계산
                  const offsetX = (1 - x) / 2;
                  const offsetY = (1 - y) / 2;
                  texture.offset.set(offsetX, offsetY);
                  
                  child.material.needsUpdate = true;
                  console.log(`Texture size set to ${x}x${y} (${1/x}배 축소) with offset (${offsetX}, ${offsetY})`);
                },
                setOffset: (x, y) => {
                  texture.offset.set(x, y);
                  child.material.needsUpdate = true;
                  console.log(`Texture offset set to ${x}, ${y}`);
                },
                setRotation: (radians) => {
                  texture.rotation = radians;
                  child.material.needsUpdate = true;
                  console.log(`Texture rotation set to ${radians} radians`);
                },
                // 미리 설정된 프리셋들
                presets: {
                  tiny: () => {
                    // 텍스처를 아주 작게 만들기
                    texture.repeat.set(0.1, 0.1); // 10배 축소
                    texture.offset.set(0.45, 0.45); // 중앙으로 이동
                    texture.rotation = 0;
                    child.material.needsUpdate = true;
                    console.log('Applied tiny texture preset (10배 축소)');
                  },
                  small: () => {
                    // 텍스처를 작게 만들기
                    texture.repeat.set(0.3, 0.3); // 3배 축소
                    texture.offset.set(0.35, 0.35); // 중앙으로 이동
                    texture.rotation = 0;
                    child.material.needsUpdate = true;
                    console.log('Applied small texture preset (3배 축소)');
                  },
                  medium: () => {
                    // 텍스처를 중간 크기로
                    texture.repeat.set(0.5, 0.5); // 2배 축소
                    texture.offset.set(0.25, 0.25); // 중앙으로 이동
                    texture.rotation = 0;
                    child.material.needsUpdate = true;
                    console.log('Applied medium texture preset (2배 축소)');
                  },
                  large: () => {
                    // 텍스처를 크게
                    texture.repeat.set(0.8, 0.8); // 1.25배 축소
                    texture.offset.set(0.1, 0.1); // 중앙으로 이동
                    texture.rotation = 0;
                    child.material.needsUpdate = true;
                    console.log('Applied large texture preset (1.25배 축소)');
                  },
                  centered: () => {
                    // 중앙 정렬 (현재 기본값)
                    texture.repeat.set(0.3, 0.3);
                    texture.offset.set(0.35, 0.35);
                    texture.rotation = 0;
                    child.material.needsUpdate = true;
                    console.log('Applied centered texture preset (3배 축소, 중앙 정렬)');
                  },
                  noCrack: () => {
                    // 갈라진 부분을 피해서 왼쪽 부분만 보기
                    texture.repeat.set(0.3, 0.3);
                    texture.offset.set(0, 0.35);
                    texture.rotation = 0;
                    child.material.needsUpdate = true;
                    console.log('Applied noCrack preset (갈라진 부분 피함)');
                  },
                  rotated: () => {
                    // 90도 회전해서 갈라진 부분 피하기
                    texture.repeat.set(0.3, 0.3);
                    texture.offset.set(0.35, 0.35);
                    texture.rotation = Math.PI / 2;
                    child.material.needsUpdate = true;
                    console.log('Applied rotated preset (90도 회전)');
                  }
                }
              };
              
              console.log('🎯 Eyeball texture adjustment functions ready!');
              
            },
            // 텍스처 로드 진행
            (progress) => {
              console.log('Eyeball texture loading progress:', progress);
            },
            // 텍스처 로드 실패
            (error) => {
              console.error('Failed to load eyeball texture:', error);
              // 텍스처 로드 실패 시 기본 색상 사용
              child.material.color.setHex(0x1E3A8A);
              child.material.needsUpdate = true;
            }
          );
        } else if (meshCount === 1) {
          // 두 번째 메시 (Sphere002) - 흰색 눈동자
          child.material.color.setHex(0xFFFFFF);
          child.material.needsUpdate = true;
        } else if (meshCount === 2) {
          // 세 번째 메시 (Sphere003) - 검은색 동공
          child.material.color.setHex(0x000000);
          child.material.needsUpdate = true;
        }
        
        meshCount++;
      }
    });
    
    // 모델 크기 및 위치 조정
    eyeModel.scale.set(0.5, 0.5, 0.5);
    eyeModel.position.set(0, 1.5, 0);
    
    // 그룹에 추가
    eyeGroup.add(eyeModel);
    
    console.log('[ThreeApp] Eye model loaded successfully');
    
  }, 
  // 로딩 진행
  (progress) => {
    console.log('Eye model loading progress:', progress);
  },
  // 로딩 실패
  (error) => {
    console.error('[ThreeApp] Failed to load eye model:', error);
    // 모델 로드 실패 시 간단한 구체로 대체
    createSimpleEye();
  });
  
  scene.add(eyeGroup);
}

/**
 * GLTFLoader가 없을 때 사용할 간단한 눈 생성
 */
function createSimpleEye() {
  console.log('[ThreeApp] Creating simple sphere eye as fallback');
  
  // 홍채 (파란색 구체)
  const irisGeometry = new THREE.SphereGeometry(0.8, 32, 32);
  const irisMaterial = new THREE.MeshLambertMaterial({ color: 0x1E3A8A });
  const iris = new THREE.Mesh(irisGeometry, irisMaterial);
  iris.position.set(0, 1.5, 0);
  
  // 동공 (검은색 구체)
  const pupilGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const pupilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  pupil.position.set(0, 1.5, 0.5);
  
  // 흰자 (흰색 구체)
  const scleraGeometry = new THREE.SphereGeometry(1.0, 32, 32);
  const scleraMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  const sclera = new THREE.Mesh(scleraGeometry, scleraMaterial);
  sclera.position.set(0, 1.5, -0.2);
  
  eyeGroup.add(iris);
  eyeGroup.add(pupil);
  eyeGroup.add(sclera);
  
  scene.add(eyeGroup);
}

/**
 * 멀리서 빛나는 태양 오브젝트 생성
 */
function createSun() {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('./static/assets/sun.png', (texture) => {
      const geometry = new THREE.PlaneGeometry(20, 20);
      const material = new THREE.MeshPhongMaterial({
          map: texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          emissive: 0xFF8C00,
          emissiveIntensity: 1
      });
      sunMesh = new THREE.Mesh(geometry, material);
      sunMesh.position.set(-70, 10, -100);
      scene.add(sunMesh);
  });
}

/**
 * 우주 배경 파티클 생성
 */
function createParticles() {
  const particleCount = 5000;
  const positions = [];
  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    positions.push(x, y, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
  });
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

/**
 * 창 크기 변경 핸들러
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 마우스 이동 핸들러
 */
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * 애니메이션 루프
 */
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = Date.now();

  // 눈 움직임
  if (eyeGroup) {
    const targetX = mouse.x * 0.5; // 움직임 범위를 줄여 더 자연스럽게
    const targetY = mouse.y * 0.5;
    
    // 부드러운 움직임을 위한 보간 (방향 수정)
    eyeGroup.rotation.y += (targetX - eyeGroup.rotation.y) * 0.05;
    eyeGroup.rotation.x += (-targetY - eyeGroup.rotation.x) * 0.05;
  }

  // 조명 색상 변경
  if (pointLight) {
    const time = elapsedTime * 0.0005;
    pointLight.color.setHSL((time % 1), 1, 0.5);
  }
  
  // 홍채 색상 변화 효과 (첫 번째 메시에 적용)
  if (eyeGroup) {
    let meshIndex = 0;
    eyeGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        if (meshIndex === 0) { // 첫 번째 메시 (홍채/동공)
          const time = elapsedTime * 0.001;
          const hue = (time * 0.1) % 1; // 천천히 색상 변화
          const saturation = 0.8 + Math.sin(time * 0.5) * 0.2; // 채도 변화
          const lightness = 0.4 + Math.sin(time * 0.3) * 0.1; // 명도 변화
          
          child.material.color.setHSL(hue, saturation, lightness);
          
          // 홍채 주변 빛나는 효과 강화
          if (child.children.length > 0) {
            child.children.forEach(glowChild => {
              if (glowChild.material) {
                glowChild.material.color.setHSL(hue, 0.6, 0.6);
                glowChild.material.opacity = 0.3 + Math.sin(time * 0.8) * 0.1;
              }
            });
          }
        }
        meshIndex++;
      }
    });
  }

  // 눈 깜빡임
  blinkTimer += 16; // 대략 60fps 기준
  if (blinkTimer > blinkInterval) {
    isBlinking = true;
    setTimeout(() => { isBlinking = false; }, blinkDuration);
    blinkTimer = 0;
  }
  
  if (isBlinking) {
    // 깜빡임시 Y축으로 압축 (더 자연스러운 깜빡임)
    const targetScaleY = 0.05;
    eyeGroup.scale.y += (targetScaleY - eyeGroup.scale.y) * 0.4;
    
    // 깜빡임시 약간의 회전 효과
    eyeGroup.rotation.z += (0.1 - eyeGroup.rotation.z) * 0.1;
  } else {
    // 정상 상태로 복원
    eyeGroup.scale.y += (1 - eyeGroup.scale.y) * 0.15;
    eyeGroup.rotation.z += (0 - eyeGroup.rotation.z) * 0.1;
  }

  // 워프 효과 처리
  if (isWarping) {
    const warpProgress = (Date.now() - warpStartTime) / warpDuration;
    if (warpProgress < 1) {
      const easeProgress = 1 - Math.pow(1 - warpProgress, 3); // EaseOutCubic
      camera.position.z = initialCameraZ - (easeProgress * 200);
      camera.fov = 75 + (easeProgress * 50);
      camera.updateProjectionMatrix();

      if (particles) {
        particles.material.color.setHSL(easeProgress, 1, 0.7);
        particles.position.z += easeProgress * 5;
      }
    } else {
      isWarping = false;
      camera.position.z = initialCameraZ;
      camera.fov = 75;
      camera.updateProjectionMatrix();
      if (particles) {
          particles.position.z = 0;
          particles.material.color.setHSL(0, 1, 0.5);
      }
    }
  }


  // 파티클 회전
  if (particles) {
    particles.rotation.y += 0.0001;
  }
  
  renderer.render(scene, camera);
}


/**
 * 앱 초기화 진입점
 */
export function initThreeApp() {
  try {
    init();
    animate();
    console.log('[ThreeApp] Original 3D scene restored.');
  } catch (e) {
    console.error('[ThreeApp] Failed to restore 3D scene.', e);
  }
}

/**
 * 우주 공간으로 워프하는 효과 시작
 * @param {number} duration - 효과 지속 시간 (ms)
 */
export function startWarpEffect(duration) {
    if (isWarping) return;
    console.log(`[ThreeApp] Warp effect started for ${duration}ms`);
    isWarping = true;
    warpStartTime = Date.now();
    warpDuration = duration;
}
