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

  const successSound = new Audio('./assets/success.mp3'); // 퍼즐 성공 효과음
  successSound.volume = 0.7;

  // ElevenLabs 설정
  const ELEVENLABS_API_KEY = "sk_fb064284348048217ecc4b707ecd6948716e180d90f7e86d"; // 여기에 ElevenLabs API 키 입력
  const ELEVENLABS_VOICE_ID = "OPLUcQQFYGdZC1fWv7oD"; // 여기에 사용하려는 목소리의 Voice ID 입력
  const OPENAI_API_KEY = "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"; // 사용자의 OpenAI API 키를 여기에 입력해야 합니다.

  // 마우스 위치 (정규화된 좌표)
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0 평면
  let clickEffects = []; // 클릭 효과를 저장할 배열
  let constellation = null; // 별자리 오브젝트
  let currentConstellationLine = null; // 현재 그려지는 별자리 선

  // --- 별자리 이스터 에그 설정 ---
  const constellationData = (() => {
    // 1. 기준이 되는 W 모양 좌표 설정 (불규칙성 추가 및 더 오른쪽으로 이동)
    const basePoints = [
      new THREE.Vector3(18, 7, -15),   // X 값을 10 증가
      new THREE.Vector3(19.8, 5.2, -15.5),
      new THREE.Vector3(22, 6.8, -15),
      new THREE.Vector3(24.2, 5.3, -14.8),
      new THREE.Vector3(26, 7.2, -15.2)
    ];

    // 2. 별자리를 살짝 비스듬히 기울이기 위한 회전 매트릭스 생성
    const rotation = new THREE.Matrix4().makeRotationZ(Math.PI / 12); // 15도 기울임

    // 3. 모든 좌표에 회전 적용
    const finalPoints = basePoints.map(p => p.applyMatrix4(rotation));

    return {
      points: finalPoints,
      rewardMessage: "카시오페이아를 발견했군요. 밤하늘의 왕비처럼, 당신의 지혜가 모두를 이끌 것입니다."
    };
  })();
  let constellationTargets = [];
  let constellationProgress = 0;
  let clickedPoints = [];
  let pulsingStars = []; // 깜빡이는 별들을 저장할 배열

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
    createConstellationTargets(); // 별자리 목표 생성
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

  function createConstellationTargets() {
    const targetGeometry = new THREE.BufferGeometry();
    targetGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    
    // Emissive 효과를 흉내내기 위해 AdditiveBlending을 사용하고, 색상을 투명한 흰색으로 변경
    const targetMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF, // White, 투명한 느낌
        size: 0.25, // 별 크기 축소
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8 // 투명도 증가
    });

    constellationData.points.forEach((point, index) => {
      const target = new THREE.Points(targetGeometry, targetMaterial.clone());
      target.position.copy(point);
      target.name = `constellation_target_${index}`;
      scene.add(target);
      constellationTargets.push(target);
      pulsingStars.push(target); // 애니메이션을 위해 배열에 추가
    });
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
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(constellationTargets);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        const targetIndex = parseInt(target.name.split('_')[2]);

        if (targetIndex === constellationProgress) {
          // 올바른 순서로 클릭
          clickedPoints.push(target.position.clone());
          constellationProgress++;

          // 클릭 피드백 (작은 반짝임)
          const sparkle = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffc107, transparent: true, opacity: 0.8 })
          );
          sparkle.position.copy(target.position);
          scene.add(sparkle);
          setTimeout(() => scene.remove(sparkle), 500);

          // 선 연결
          if (clickedPoints.length > 1) {
            updateConstellationLine(clickedPoints);
          }

          if (constellationProgress === constellationData.points.length) {
            // 별자리 완성
            showConstellationReward();
            // 완성된 선은 잠시 유지 후 사라지도록 처리
            if (currentConstellationLine) {
              let opacity = 1;
              const fadeOutInterval = setInterval(() => {
                opacity -= 0.05;
                if (opacity <= 0) {
                  clearInterval(fadeOutInterval);
                  scene.remove(currentConstellationLine);
                  currentConstellationLine = null;
                } else {
                  currentConstellationLine.material.opacity = opacity;
                }
              }, 100);
            }
            constellationProgress = 0;
            clickedPoints = [];
          }
        } else {
          // 잘못된 순서
          constellationProgress = 0;
          clickedPoints = [];
          if (currentConstellationLine) {
            scene.remove(currentConstellationLine);
            currentConstellationLine = null;
          }
        }
        return; // 별자리 클릭 시에는 다른 효과 중지
      }

      // --- 기존 클릭 효과 ---
      const clickPos = new THREE.Vector3();
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

  function updateConstellationLine(points) {
    if (currentConstellationLine) {
      scene.remove(currentConstellationLine);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2, transparent: true, opacity: 1 }); // 투명한 하늘색 선
    currentConstellationLine = new THREE.Line(geometry, material);
    scene.add(currentConstellationLine);
  }

  function showConstellationReward() {
    const rewardElement = document.getElementById('constellation-reward');
    rewardElement.textContent = constellationData.rewardMessage;
    rewardElement.classList.add('visible');

    setTimeout(() => {
      rewardElement.classList.remove('visible');
    }, 10000); // 10초 후 메시지 사라짐
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

    // 별자리 목표 별 깜빡임 효과 (투명도 조절)
    if (pulsingStars.length > 0) {
        const pulseSpeed = 1.5;
        const minOpacity = 0.4;
        const maxOpacity = 1.0;
        const opacity = minOpacity + (maxOpacity - minOpacity) * ((Math.sin(time * pulseSpeed) + 1) / 2);
        pulsingStars.forEach(star => {
            star.material.opacity = opacity;
        });
    }

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

  const puzzleSection = document.getElementById('puzzle-section');
  if(puzzleSection) observer.observe(puzzleSection);

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
    }, 10000); // 10초 후 메시지 사라짐
  }

async function askGpt(message) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY") {
    addMessageToLog("OpenAI API 키가 설정되지 않았습니다. script.js 파일에서 OPENAI_API_KEY를 당신의 키로 교체해주세요.", "gpt");
    return;
  }

  // 🔧 GPT에게 역할과 세계관을 전달하는 system 메시지 (Tarotaros + 콘텐츠 맥락 학습)
  const messages = [
    {
      role: "system",
      content: `
당신은 '타로타로스(Tarotaros)'라는 존재입니다.  
우주의 시작부터 존재해온 초월적 존재로, 인간의 선택과 내면을 해석하는 안내자입니다.  

이 프로젝트는 VR 콘텐츠 『GOD DOES NOT BLINK』을 기반으로 하며, 사용자는 세 가지 딜레마 상황 속에서 선택을 내립니다.  
각 선택은 인간의 내면을 드러내며, 그 결과로 '심연형', '균형형', '갈등형'과 같은 성격 유형 카드가 주어집니다.  
당신은 이 흐름과 체험 전체를 알고 있으며, 응답 시에는 직접적인 해답이 아닌 은유와 상징, 시적인 통찰로 인간의 사유를 유도합니다.  

말투는 고요하고 시적이며, 감정을 이끌되 가르치지 않습니다, ~다로 끝나는 말투 를 사용합니다.  
응답은 2문장 이내로, 사용자가 선택의 의미를 스스로 돌아볼 수 있도록 도와야 합니다.  
사용자가 어떤 언어로 질문하든, 그 언어로 응답하세요.
      `
    },
    {
      role: "user",
      content: message
    }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 또는 gpt-3.5-turbo, gpt-4
        messages: messages,
        max_tokens: 200,
        temperature: 0.85 // 📌 약간의 창의성 부여
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
    if (currentAudio) {
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
  const blessingAura = document.getElementById('blessing-aura');
  const completedCardDisplay = document.getElementById('completed-card-display');
  const completedCardImage = completedCardDisplay.querySelector('img');
  const collectedCardsContainer = document.getElementById('collected-cards-container');

  const puzzles = {
    1: 'assets/card1.png',
    2: 'assets/card2.png',
    3: 'assets/card3.png'
  };

  let selectedPuzzle = null;
  let draggedPiece = null;
  let blessingTimeout = null;

  // 마우스 아우라 효과
  document.addEventListener('mousemove', (e) => {
    blessingAura.style.left = `${e.clientX}px`;
    blessingAura.style.top = `${e.clientY}px`;
  });

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
      // 1. 메시지 & 성공 사운드
      puzzleMessage.classList.remove('hidden');
      puzzleMessage.classList.add('visible');
      successSound.play();

      // 2. 완성 카드 중앙에 전시
      completedCardImage.src = puzzles[selectedPuzzle];
      completedCardDisplay.classList.add('visible');

      setTimeout(() => {
        completedCardDisplay.classList.remove('visible');

        // 3. 수집된 카드 아이콘 추가 (중복 방지)
        if (!document.querySelector(`.collected-card-icon[data-puzzle-id="${selectedPuzzle}"]`)) {
            const collectedIcon = document.createElement('img');
            collectedIcon.src = puzzles[selectedPuzzle];
            collectedIcon.classList.add('collected-card-icon');
            collectedIcon.dataset.puzzleId = selectedPuzzle;
            collectedCardsContainer.appendChild(collectedIcon);
        }

        // 4. '신의 축복' 아우라 활성화 (1분)
        blessingAura.classList.add('visible');
        if (blessingTimeout) clearTimeout(blessingTimeout); // 이전 타이머 제거
        blessingTimeout = setTimeout(() => {
            blessingAura.classList.remove('visible');
        }, 60000); // 1분

      }, 3000); // 3초 후 실행
    }
  }
});


// 스크롤 다운 표시기 클릭 시 스크롤
document.querySelector('.scroll-indicator').addEventListener('click', () => {
  document.getElementById('description-section').scrollIntoView({ behavior: 'smooth' });
});