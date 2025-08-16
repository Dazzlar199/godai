// Logo5 3D Model Renderer
class Logo5Renderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.animationId = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Scene 생성
            this.scene = new THREE.Scene();
            this.scene.background = null; // 투명 배경

            // Camera 설정
            this.camera = new THREE.PerspectiveCamera(75, 300 / 225, 0.1, 1000);
            this.camera.position.set(0, 0, 5);

            // Renderer 설정
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: document.getElementById('logo5-canvas'),
                antialias: true,
                alpha: true 
            });
            this.renderer.setSize(300, 225);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // 조명 설정
            this.setupLights();

            // 모델 로드
            await this.loadModel();

            // 애니메이션 시작
            this.animate();

            // 마우스 인터랙션 설정
            this.setupMouseInteraction();

            this.isInitialized = true;
            console.log('[Logo5Renderer] 초기화 완료');

        } catch (error) {
            console.error('[Logo5Renderer] 초기화 실패:', error);
        }
    }

    setupLights() {
        // 주변광 (더 밝게)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // 방향성 조명 (더 강하게)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // 포인트 조명 (로고를 돋보이게)
        const pointLight = new THREE.PointLight(0x00ffff, 1.5, 100);
        pointLight.position.set(-3, 2, 3);
        this.scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xff00ff, 1.2, 100);
        pointLight2.position.set(3, -2, -3);
        this.scene.add(pointLight2);
        
        // 추가 조명 (모델 앞쪽)
        const frontLight = new THREE.PointLight(0xffffff, 1.0, 50);
        frontLight.position.set(0, 0, 5);
        this.scene.add(frontLight);
    }

    async loadModel() {
        try {
            const loader = new THREE.GLTFLoader();
            
            // logo5 모델 로드
            const gltf = await loader.loadAsync('/static/assets/models/logo5.glb');
            
            this.model = gltf.scene;
            
            // 모델 크기 및 위치 조정 (더 크게, 앞으로)
            this.model.scale.set(2, 2, 2);
            this.model.position.set(0, 0, 2);
            
            // 모델 회전 조정
            this.model.rotation.set(0, 0, 0);
            
            // 그림자 설정 및 핑크색 텍스처 적용
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // 핑크색 재질로 교체 (더 아름다운 효과)
                    const pinkMaterial = new THREE.MeshPhysicalMaterial({
                        color: 0xFF69B4, // 핫핑크
                        metalness: 0.4,
                        roughness: 0.2,
                        transparent: true,
                        opacity: 0.95,
                        emissive: 0xFF1493, // 딥핑크
                        emissiveIntensity: 0.15,
                        clearcoat: 1.0, // 광택 효과
                        clearcoatRoughness: 0.1,
                        ior: 1.5, // 굴절률
                        transmission: 0.1 // 약간의 투명도
                    });
                    
                    child.material = pinkMaterial;
                    
                    // 전역 변수에 저장해서 나중에 조정 가능하게
                    if (!window.logo5Materials) {
                        window.logo5Materials = [];
                    }
                    window.logo5Materials.push(pinkMaterial);
                    
                    console.log(`Applied enhanced pink material to mesh: ${child.name}`);
                }
            });

            this.scene.add(this.model);
            console.log('[Logo5Renderer] 모델 로드 완료');
            
            // 핑크색 재질 조정 함수들을 전역으로 노출
            window.adjustLogo5Pink = {
                setColor: (hexColor) => {
                    window.logo5Materials.forEach(material => {
                        material.color.setHex(hexColor);
                        material.needsUpdate = true;
                    });
                    console.log(`Logo5 color changed to: #${hexColor.toString(16)}`);
                },
                setMetalness: (value) => {
                    window.logo5Materials.forEach(material => {
                        material.metalness = value;
                        material.needsUpdate = true;
                    });
                    console.log(`Logo5 metalness set to: ${value}`);
                },
                setRoughness: (value) => {
                    window.logo5Materials.forEach(material => {
                        material.roughness = value;
                        material.needsUpdate = true;
                    });
                    console.log(`Logo5 roughness set to: ${value}`);
                },
                presets: {
                    hotPink: () => window.adjustLogo5Pink.setColor(0xFF69B4),
                    deepPink: () => window.adjustLogo5Pink.setColor(0xFF1493),
                    lightPink: () => window.adjustLogo5Pink.setColor(0xFFB6C1),
                    magenta: () => window.adjustLogo5Pink.setColor(0xFF00FF),
                    rose: () => window.adjustLogo5Pink.setColor(0xFF007F)
                }
            };
            
            console.log('🎀 Logo5 pink material adjustment functions available!');
            console.log('Use window.adjustLogo5Pink to adjust the pink material:');
            console.log('- .setColor(hexColor) - 색상 변경');
            console.log('- .setMetalness(value) - 금속성 조정');
            console.log('- .setRoughness(value) - 거칠기 조정');
            console.log('- .presets.hotPink() - 핫핑크');
            console.log('- .presets.deepPink() - 딥핑크');
            console.log('- .presets.lightPink() - 라이트핑크');
            console.log('- .presets.magenta() - 마젠타');
            console.log('- .presets.rose() - 로즈');
            
            // 모델이 로드된 후 카메라 위치 조정
            this.camera.position.set(0, 0, 8);
            this.camera.lookAt(0, 0, 0);

        } catch (error) {
            console.error('[Logo5Renderer] 모델 로드 실패:', error);
            
            // 에러 시 대체 큐브 표시
            this.createFallbackCube();
        }
    }

    createFallbackCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhysicalMaterial({ 
            color: 0xFF69B4, // 핫핑크
            metalness: 0.4,
            roughness: 0.2,
            transparent: true,
            opacity: 0.95,
            emissive: 0xFF1493, // 딥핑크
            emissiveIntensity: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
        console.log('[Logo5Renderer] 핑크색 대체 큐브 생성');
    }

    setupMouseInteraction() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;

        const canvas = document.getElementById('logo5-canvas');
        
        canvas.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        canvas.addEventListener('mousemove', (event) => {
            if (isMouseDown && this.model) {
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;
                
                this.model.rotation.y += deltaX * 0.01;
                this.model.rotation.x += deltaY * 0.01;
                
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        });

        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.model) {
            // 자동 회전 (마우스 인터랙션이 없을 때)
            if (!this.isMouseDown) {
                this.model.rotation.y += 0.005;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        this.isInitialized = false;
        console.log('[Logo5Renderer] 정리 완료');
    }
}

// 전역 변수로 렌더러 인스턴스 생성
let logo5Renderer = null;

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Logo5Renderer] DOM 로드됨, Three.js 확인 중...');
    
    // Three.js가 로드될 때까지 대기
    const waitForThreeJS = () => {
        if (typeof THREE !== 'undefined') {
            console.log('[Logo5Renderer] Three.js 확인됨, GLTFLoader 대기 중...');
            
            // GLTFLoader가 로드될 때까지 대기
            const waitForGLTFLoader = () => {
                if (typeof THREE.GLTFLoader !== 'undefined') {
                    console.log('[Logo5Renderer] GLTFLoader 확인됨, 렌더러 시작');
                    logo5Renderer = new Logo5Renderer();
                    logo5Renderer.init();
                } else {
                    console.log('[Logo5Renderer] GLTFLoader 대기 중...');
                    setTimeout(waitForGLTFLoader, 100);
                }
            };
            
            waitForGLTFLoader();
        } else {
            console.log('[Logo5Renderer] Three.js 대기 중...');
            setTimeout(waitForThreeJS, 100);
        }
    };
    
    waitForThreeJS();
});

// 페이지 전환 시 정리
window.addEventListener('beforeunload', () => {
    if (logo5Renderer) {
        logo5Renderer.destroy();
    }
});
