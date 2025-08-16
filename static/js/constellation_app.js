// constellation_app.js - 별자리 그리기 시스템

import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { transitionToPhase } from './ui_manager.js';
import { combinationData, cardData } from './dilemma_data.js';

const DAMPING_FACTOR = 0.8;

let faceLandmarker;
let handLandmarker;
let runningMode = "VIDEO";
let webcamRunning = false;
let video;
let canvasElement;
let canvasCtx;
let drawingCanvasCtx;
let guideCanvasCtx;

let lastVideoTime = -1;
let smoothedLandmarks = null;
let lastDrawnPosition = null;

// 별자리 관련 변수
let currentConstellation = null;
let userChosenDilemmas = []; // 사용자가 선택한 딜레마들 (A, B, C)
let drawnStars = new Set(); // 그려진 별들의 인덱스
let drawnConnections = new Set(); // 그려진 연결선들의 인덱스
let constellationComplete = false;
let currentStarIndex = 0; // 현재 그려야 할 별의 인덱스
let isDrawingMode = 'stars'; // 'stars' 또는 'connections'

// DOM Elements
const videoContainer = document.querySelector('.mediapipe-container');
const startAnalysisBtn = document.getElementById('start-analysis-btn');
const analysisStatus = document.getElementById('analysis-status');
video = document.getElementById('webcam');
canvasElement = document.getElementById('mediapipe-canvas');
const drawingCanvas = document.getElementById('drawing-canvas');
const guideCanvas = document.getElementById('guide-canvas');

// MediaPipe 초기화 상태를 추적하는 Promise
let mediaPipePromise = null;

/**
 * MediaPipe FaceLandmarker를 초기화합니다.
 */
async function initializeMediaPipe() {
  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    
    // 1. 얼굴 랜드마커 생성
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode,
      numFaces: 1
    });

    // 2. 손 랜드마커 생성
    handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode,
      numHands: 1
    });
    
    analysisStatus.innerText = '별자리 시스템 로드 완료.';
    startAnalysisBtn.disabled = false;
    startAnalysisBtn.addEventListener("click", enableCam);
    console.log('[Constellation] 초기화 완료.');

  } catch (error) {
    console.error('[Constellation] 초기화 실패:', error);
    analysisStatus.innerText = '시스템 로딩 실패. 새로고침 해주세요.';
  }
}

/**
 * 사용자의 딜레마 선택 기록을 받아서 별자리를 결정합니다.
 */
export function setUserDilemmas(dilemmas) {
  userChosenDilemmas = dilemmas;
  console.log('[Constellation] setUserDilemmas 호출됨:', dilemmas);
  console.log('[Constellation] 딜레마 타입:', typeof dilemmas);
  console.log('[Constellation] 딜레마 길이:', dilemmas ? dilemmas.length : 'undefined');
  
  // 딜레마 배열이 비어있거나 유효하지 않으면 기본값 설정
  if (!dilemmas || dilemmas.length === 0) {
    console.log('[Constellation] 딜레마 데이터가 없어 기본 별자리(DDD) 설정');
    currentConstellation = combinationData['DDD'].constellation;
    return;
  }
  
  // 3가지 딜레마의 선택을 조합하여 별자리 결정
  if (dilemmas.length >= 3) {
    const combination = dilemmas.slice(0, 3).join('');
    console.log('[Constellation] 딜레마 조합:', combination);
    console.log('[Constellation] 사용 가능한 조합들:', Object.keys(combinationData));
    console.log('[Constellation] 조합 데이터 확인:', combinationData[combination]);
    
    if (combinationData[combination]) {
      currentConstellation = combinationData[combination].constellation;
      console.log('[Constellation] 선택된 별자리:', currentConstellation.name);
      console.log('[Constellation] 선택된 카드:', combinationData[combination].card.name);
      console.log('[Constellation] 별자리 데이터:', currentConstellation);
    } else {
      console.log('[Constellation] 조합을 찾을 수 없어 기본 별자리(DDD) 설정');
      console.log('[Constellation] 찾을 수 없는 조합:', combination);
      currentConstellation = combinationData['DDD'].constellation;
    }
  } else {
    console.log('[Constellation] 딜레마가 부족해 기본 별자리(DDD) 설정');
    console.log('[Constellation] 현재 딜레마:', dilemmas);
    currentConstellation = combinationData['DDD'].constellation;
  }
  
  console.log('[Constellation] 최종 설정된 별자리:', currentConstellation ? currentConstellation.name : 'undefined');
}

const enableCam = (event) => {
  if (!faceLandmarker || !handLandmarker) {
    console.log("Wait! MediaPipe 모델이 아직 로드되지 않았습니다.");
    analysisStatus.innerText = 'MediaPipe 모델 로딩 중... 잠시 후 다시 시도해주세요.';
    return;
  }
  
  // 웹캠 시작 시 가이드 단계 1 (웹캠 활성화)로 초기화
  updateGuideStep(1);

  if (webcamRunning === true) {
    webcamRunning = false;
    startAnalysisBtn.innerText = "별자리 그리기 시작";
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  } else {
    webcamRunning = true;
    startAnalysisBtn.innerText = "별자리 그리기 중지";
    analysisStatus.innerText = '손동작으로 당신만의 별자리를 그려보세요.';
    
    // 가이드 단계 2 (별 그리기)로 업데이트
    updateGuideStep(2);
    
    canvasCtx = canvasElement.getContext("2d");
    drawingCanvasCtx = drawingCanvas.getContext("2d");
    guideCanvasCtx = guideCanvas.getContext("2d");

    // 초기화
    initializeConstellation();

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    }).catch((err) => {
      console.error(err);
      analysisStatus.innerText = `웹캠 접근 오류: ${err.message}`;
    });
  }
};

/**
 * 별자리 그리기를 초기화합니다.
 */
function initializeConstellation() {
  // currentConstellation이 설정되지 않았으면 기본값 사용
  if (!currentConstellation) {
    // 기본값으로 DDD 타입 별자리 설정
    currentConstellation = combinationData['DDD'].constellation;
    console.log('[Constellation] 기본 별자리 설정:', currentConstellation.name);
  } else {
    console.log('[Constellation] 기존 별자리 유지:', currentConstellation.name);
  }

  // 상태 초기화
  drawnStars.clear();
  drawnConnections.clear();
  constellationComplete = false;
  currentStarIndex = 0;
  isDrawingMode = 'stars';
  
  // 초기 가이드 그리기
  drawConstellationGuide();
  
  console.log('[Constellation] 별자리 초기화 완료:', currentConstellation.name);
}

/**
 * 가이드 캔버스에 별자리 가이드를 그립니다.
 */
function drawConstellationGuide() {
  if (!guideCanvasCtx || !currentConstellation) return;

  guideCanvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
  
  const w = guideCanvas.width;
  const h = guideCanvas.height;

  // 별들 그리기 (가이드)
  currentConstellation.stars.forEach((star, index) => {
    const x = star.x * w;
    const y = star.y * h;
    const radius = 8 + star.brightness * 12; // 밝기에 따른 크기
    
    // 이미 그려진 별은 초록색으로 표시
    if (drawnStars.has(index)) {
      guideCanvasCtx.fillStyle = 'rgba(0, 255, 0, 0.8)'; // 초록색 (완성)
      guideCanvasCtx.shadowColor = 'rgba(0, 255, 0, 1)';
      guideCanvasCtx.shadowBlur = 15;
    }
    // 현재 그려야 할 별은 노란색으로 강조
    else if (isDrawingMode === 'stars' && index === currentStarIndex) {
      guideCanvasCtx.fillStyle = 'rgba(255, 255, 0, 0.9)'; // 노란색으로 강조
      guideCanvasCtx.shadowColor = 'rgba(255, 255, 0, 1)';
      guideCanvasCtx.shadowBlur = 25;
    }
    // 아직 그리지 않은 별은 흰색으로 표시
    else {
      guideCanvasCtx.fillStyle = `rgba(255, 255, 255, ${0.2 + star.brightness * 0.3})`;
      guideCanvasCtx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      guideCanvasCtx.shadowBlur = 5;
    }
    
    guideCanvasCtx.beginPath();
    guideCanvasCtx.arc(x, y, radius, 0, Math.PI * 2);
    guideCanvasCtx.fill();
    
    // 별 이름과 순서 표시
    guideCanvasCtx.shadowBlur = 0;
    if (isDrawingMode === 'stars' && index === currentStarIndex) {
      // 현재 그려야 할 별은 노란색으로 강조
      guideCanvasCtx.fillStyle = 'rgba(255, 255, 0, 1)';
      guideCanvasCtx.font = 'bold 14px Arial';
    } else if (drawnStars.has(index)) {
      // 완성된 별은 초록색
      guideCanvasCtx.fillStyle = 'rgba(0, 255, 0, 1)';
      guideCanvasCtx.font = 'bold 12px Arial';
    } else {
      // 대기 중인 별은 흰색
      guideCanvasCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      guideCanvasCtx.font = '12px Arial';
    }
    
    guideCanvasCtx.textAlign = 'center';
    guideCanvasCtx.fillText(`${index + 1}. ${star.name}`, x, y - radius - 8);
  });

  // 연결선 가이드 (점선으로)
  if (isDrawingMode === 'connections') {
    currentConstellation.connections.forEach(([startIdx, endIdx], connectionIndex) => {
      const start = currentConstellation.stars[startIdx];
      const end = currentConstellation.stars[endIdx];
      
      // 이미 그려진 연결선은 초록색으로 표시
      if (drawnConnections.has(connectionIndex)) {
        guideCanvasCtx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        guideCanvasCtx.lineWidth = 4;
        guideCanvasCtx.setLineDash([]);
      }
      // 현재 그려야 할 연결선은 노란색으로 강조
      else if (connectionIndex === currentStarIndex) {
        guideCanvasCtx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
        guideCanvasCtx.lineWidth = 5;
        guideCanvasCtx.setLineDash([8, 4]);
      }
      // 아직 그리지 않은 연결선은 흰색 점선
      else {
        guideCanvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        guideCanvasCtx.lineWidth = 2;
        guideCanvasCtx.setLineDash([5, 5]);
      }
      
      guideCanvasCtx.beginPath();
      guideCanvasCtx.moveTo(start.x * w, start.y * h);
      guideCanvasCtx.lineTo(end.x * w, end.y * h);
      guideCanvasCtx.stroke();
      
      // 연결선 순서 표시 (중간점에)
      if (connectionIndex === currentStarIndex) {
        const midX = (start.x + end.x) * w / 2;
        const midY = (start.y + end.y) * h / 2;
        
        guideCanvasCtx.fillStyle = 'rgba(255, 255, 0, 1)';
        guideCanvasCtx.font = 'bold 16px Arial';
        guideCanvasCtx.textAlign = 'center';
        guideCanvasCtx.fillText(`${connectionIndex + 1}`, midX, midY + 5);
      }
    });
    
    guideCanvasCtx.setLineDash([]); // 점선 해제
  }
  
  // 현재 모드와 진행 상황 표시
  guideCanvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  guideCanvasCtx.font = 'bold 18px Arial';
  guideCanvasCtx.textAlign = 'left';
  
  if (isDrawingMode === 'stars') {
    const progress = `${drawnStars.size + 1}/${currentConstellation.stars.length}`;
    guideCanvasCtx.fillText(`별 그리기: ${progress}`, 20, 30);
    guideCanvasCtx.fillText(`현재: ${currentStarIndex + 1}. ${currentConstellation.stars[currentStarIndex].name}`, 20, 55);
  } else if (isDrawingMode === 'connections') {
    const progress = `${drawnConnections.size + 1}/${currentConstellation.connections.length}`;
    guideCanvasCtx.fillText(`연결선 그리기: ${progress}`, 20, 30);
    guideCanvasCtx.fillText(`현재: ${currentStarIndex + 1}번 연결선`, 20, 55);
  }
}

/**
 * 실제 별자리를 그리는 캔버스에 그려진 별과 연결선을 표시합니다.
 */
function drawUserConstellation() {
  if (!drawingCanvasCtx || !currentConstellation) return;

  const w = drawingCanvas.width;
  const h = drawingCanvas.height;

  // 그려진 별들 표시
  drawnStars.forEach(starIndex => {
    const star = currentConstellation.stars[starIndex];
    const x = star.x * w;
    const y = star.y * h;
    const radius = 8 + star.brightness * 12;
    
    // 별 효과
    drawingCanvasCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    drawingCanvasCtx.shadowColor = 'rgba(255, 255, 255, 1)';
    drawingCanvasCtx.shadowBlur = 15;
    
    drawingCanvasCtx.beginPath();
    drawingCanvasCtx.arc(x, y, radius, 0, Math.PI * 2);
    drawingCanvasCtx.fill();
    
    // 빛나는 효과 추가
    drawingCanvasCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawingCanvasCtx.shadowBlur = 25;
    drawingCanvasCtx.beginPath();
    drawingCanvasCtx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
    drawingCanvasCtx.fill();
  });

  // 그려진 연결선들 표시
  drawingCanvasCtx.shadowBlur = 0;
  drawingCanvasCtx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
  drawingCanvasCtx.lineWidth = 3;
  
  drawnConnections.forEach(connectionIndex => {
    const [startIdx, endIdx] = currentConstellation.connections[connectionIndex];
    const start = currentConstellation.stars[startIdx];
    const end = currentConstellation.stars[endIdx];
    
    drawingCanvasCtx.beginPath();
    drawingCanvasCtx.moveTo(start.x * w, start.y * h);
    drawingCanvasCtx.lineTo(end.x * w, end.y * h);
    drawingCanvasCtx.stroke();
  });
}

/**
 * 손 위치가 별 근처에 있는지 확인합니다.
 */
function checkStarProximity(handPosition) {
  if (!currentConstellation || isDrawingMode !== 'stars') return false;
  
  const star = currentConstellation.stars[currentStarIndex];
  const starX = star.x * drawingCanvas.width;
  const starY = star.y * drawingCanvas.height;
  
  const distance = Math.sqrt(
    Math.pow(handPosition.x - starX, 2) + 
    Math.pow(handPosition.y - starY, 2)
  );
  
  const threshold = 50; // 50px 이내에 있으면 별을 그린 것으로 인정
  
  if (distance < threshold) {
    console.log(`[Constellation] 별 "${star.name}" 완성!`);
    drawnStars.add(currentStarIndex);
    currentStarIndex++;
    
    // 모든 별을 그렸으면 연결선 모드로 전환
    if (currentStarIndex >= currentConstellation.stars.length) {
      isDrawingMode = 'connections';
      currentStarIndex = 0; // 연결선 인덱스로 재사용
      console.log('[Constellation] 모든 별 완성! 연결선 그리기 모드로 전환');
      
      // 가이드 단계 3 (별 연결하기)로 업데이트
      updateGuideStep(3);
    }
    
    drawConstellationGuide(); // 가이드 업데이트
    return true;
  }
  
  return false;
}

/**
 * 손 위치가 연결선 위에 있는지 확인합니다.
 */
function checkConnectionProximity(handPosition) {
  if (!currentConstellation || isDrawingMode !== 'connections') return false;
  
  const connection = currentConstellation.connections[currentStarIndex];
  if (!connection) return false;
  
  const [startIdx, endIdx] = connection;
  const start = currentConstellation.stars[startIdx];
  const end = currentConstellation.stars[endIdx];
  
  const startX = start.x * drawingCanvas.width;
  const startY = start.y * drawingCanvas.height;
  const endX = end.x * drawingCanvas.width;
  const endY = end.y * drawingCanvas.height;
  
  // 선분과 점 사이의 거리 계산
  const A = handPosition.x - startX;
  const B = handPosition.y - startY;
  const C = endX - startX;
  const D = endY - startY;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;
  
  let xx, yy;
  if (param < 0) {
    xx = startX;
    yy = startY;
  } else if (param > 1) {
    xx = endX;
    yy = endY;
  } else {
    xx = startX + param * C;
    yy = startY + param * D;
  }
  
  const dx = handPosition.x - xx;
  const dy = handPosition.y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const threshold = 30;
  
  if (distance < threshold) {
    console.log(`[Constellation] 연결선 ${currentStarIndex + 1} 완성!`);
    drawnConnections.add(currentStarIndex);
    currentStarIndex++;
    
    // 모든 연결선을 그렸으면 완성
    if (currentStarIndex >= currentConstellation.connections.length) {
      constellationComplete = true;
      console.log('[Constellation] 별자리 완성!');
      completeConstellation();
    }
    
    drawConstellationGuide(); // 가이드 업데이트
    return true;
  }
  
  return false;
}

/**
 * 가이드 단계를 업데이트하는 함수
 */
function updateGuideStep(stepNumber) {
    // 모든 단계에서 active 클래스 제거
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) {
            step.classList.remove('active');
            if (i < stepNumber) {
                step.classList.add('completed');
            }
        }
    }
    
    // 현재 단계를 active로 설정
    const currentStep = document.getElementById(`step-${stepNumber}`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

/**
 * 별자리 완성 시 호출되는 함수
 */
function completeConstellation() {
  analysisStatus.innerText = `축하합니다! "${currentConstellation.name}" 완성!`;
  
  // 가이드 단계 4 (완성)로 업데이트
  updateGuideStep(4);
  
  // 우주공간 빨려들어가는 효과 시작
  startWarpEffect();
}

/**
 * 우주공간 빨려들어가는 효과
 */
function startWarpEffect() {
  console.log('[Constellation] 우주공간 빨려들어가는 효과 시작');
  
  // star_finish 효과음 재생
  if (window.journeyManager && window.journeyManager.audioManager) {
    window.journeyManager.audioManager.playSound('star_finish');
  }
  
  // 1초 후 우주공간 빨려들어가는 효과 시작
  setTimeout(() => {
    showWarpEffect();
  }, 1000);
  
  // 3초 후 최종 단계로 전환
  setTimeout(() => {
    completeWarpEffect();
  }, 4000);
}

/**
 * 우주공간 빨려들어가는 효과를 표시
 */
function showWarpEffect() {
  console.log('[Constellation] 우주공간 빨려들어가는 효과 표시');
  
  // MediaPipe 섹션에 워프 효과 적용
  const mediapipeSection = document.getElementById('mediapipe-section');
  if (mediapipeSection) {
    mediapipeSection.classList.add('warp-effect');
  }
  
  // 별자리 완성 메시지 표시
  const birthOverlay = document.getElementById('birth-overlay');
  if (birthOverlay) {
    birthOverlay.style.display = 'flex';
    const messageEl = document.getElementById('birth-message');
    if (messageEl) {
      messageEl.textContent = `🎉 "${currentConstellation.name}" 완성!`;
      messageEl.classList.add('warp-message');
    }
  }
}

/**
 * 탄생 애니메이션 오버레이를 숨깁니다
 */
function hideBirthOverlay() {
  const birthOverlay = document.getElementById('birth-overlay');
  if (birthOverlay) {
    birthOverlay.style.display = 'none';
    console.log('[Constellation] 탄생 애니메이션 오버레이 숨김');
  }
}

/**
 * 최종 단계를 표시합니다
 */
function showFinalPhase() {
  console.log('[Constellation] 최종 단계 표시 시작');
  
  // 최종 단계 섹션 표시
  const finalSection = document.getElementById('final-section');
  if (finalSection) {
    finalSection.classList.add('active');
    finalSection.style.display = 'block';
    console.log('[Constellation] 최종 단계 섹션 표시됨');
  }
  
  // MediaPipe 섹션 숨기기
  const mediapipeSection = document.getElementById('mediapipe-section');
  if (mediapipeSection) {
    mediapipeSection.classList.remove('active');
    mediapipeSection.style.display = 'none';
    console.log('[Constellation] MediaPipe 섹션 숨김');
  }
  
  console.log('[Constellation] 최종 단계 표시 완료');
}

/**
 * 워프 효과 완료 후 최종 단계로 전환
 */
function completeWarpEffect() {
  console.log('[Constellation] 워프 효과 완료, 최종 단계로 전환');
  
  // 워프 효과 제거
  const mediapipeSection = document.getElementById('mediapipe-section');
  if (mediapipeSection) {
    mediapipeSection.classList.remove('warp-effect');
  }
  
  // 오버레이 숨기기
  hideBirthOverlay();
  
  // 최종 단계 UI 설정 및 표시
  setupFinalPhase();
}

/**
 * 최종 단계 UI 설정 및 표시
 */
function setupFinalPhase() {
  console.log('[Constellation] 최종 단계 UI 설정 시작');
  
  // 최종 단계 UI에 별자리 정보 설정
  const finalNameElement = document.getElementById('final-constellation-name');
  const finalMeaningElement = document.getElementById('final-constellation-meaning');
  
  if (finalNameElement) {
    finalNameElement.textContent = currentConstellation.name;
    console.log('[Constellation] 별자리 이름 설정 완료:', currentConstellation.name);
  }
  if (finalMeaningElement) {
    finalMeaningElement.textContent = currentConstellation.meaning;
    console.log('[Constellation] 별자리 의미 설정 완료:', currentConstellation.meaning);
  }
  
  // 카드 이미지 설정
  const userDilemmas = userChosenDilemmas;
  if (userDilemmas && userDilemmas.length >= 3) {
    const combination = userDilemmas.slice(0, 3).join('');
    const combinationInfo = combinationData[combination];
    
    if (combinationInfo && combinationInfo.card) {
      const finalCardImage = document.getElementById('final-card-image');
      if (finalCardImage) {
        const cardNumber = Object.keys(cardData).find(key => 
          cardData[key].name === combinationInfo.card.name
        );
        if (cardNumber) {
          finalCardImage.src = `./static/assets/card/${cardNumber}.png`;
          console.log('[Constellation] 카드 이미지 설정 완료:', combinationInfo.card.name);
        }
      }
    }
  }
  
  // "다시 시작하기" 버튼 표시
  showRestartButton();
  
  // 완성 사운드 재생
  if (window.journeyManager && window.journeyManager.audioManager) {
    window.journeyManager.audioManager.playSound('finish');
  }
  
  // 최종 단계 표시
  showFinalPhase();
  
  console.log('[Constellation] 최종 단계 UI 설정 완료');
}

const predictWebcam = async () => {
  if (video.currentTime === lastVideoTime) {
    if (webcamRunning) {
      window.requestAnimationFrame(predictWebcam);
    }
    return;
  }
  lastVideoTime = video.currentTime;

  // 두 랜드마커를 동시에 실행
  const faceResults = await faceLandmarker.detectForVideo(video, Date.now());
  const handResults = await handLandmarker.detectForVideo(video, Date.now());

  // 왼쪽 (아트) 캔버스 그리기
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  
  // 가이드 캔버스 지속적 업데이트
  drawConstellationGuide();

  if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
    const landmarks = faceResults.faceLandmarks[0];
    
    // 스무딩 적용
    if (!smoothedLandmarks) {
      smoothedLandmarks = landmarks;
    } else {
      for (let i = 0; i < landmarks.length; i++) {
        smoothedLandmarks[i].x = DAMPING_FACTOR * smoothedLandmarks[i].x + (1 - DAMPING_FACTOR) * landmarks[i].x;
        smoothedLandmarks[i].y = DAMPING_FACTOR * smoothedLandmarks[i].y + (1 - DAMPING_FACTOR) * landmarks[i].y;
        smoothedLandmarks[i].z = DAMPING_FACTOR * smoothedLandmarks[i].z + (1 - DAMPING_FACTOR) * landmarks[i].z;
      }
    }

    // 좌우 반전을 적용하여 거울 모드처럼 보이게 합니다.
    const flippedLandmarks = smoothedLandmarks.map(landmark => ({...landmark, x: 1 - landmark.x}));
    drawSparkles(canvasCtx, flippedLandmarks);
  }

  // 손 랜드마크도 왼쪽 캔버스에 시각화 (좌우 반전 적용)
  if (handResults.landmarks && handResults.landmarks.length > 0) {
    for (const landmarks of handResults.landmarks) {
      const flippedHandLandmarks = landmarks.map(landmark => ({...landmark, x: 1 - landmark.x}));
      drawConnectors(canvasCtx, flippedHandLandmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 2,
      });
    }
  }

  // 오른쪽 (별자리) 캔버스 처리
  drawingCanvasCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  drawUserConstellation();

  if (handResults.landmarks && handResults.landmarks.length > 0 && !constellationComplete) {
    const landmarks = handResults.landmarks[0];
    const indexFingerTip = landmarks[8]; // 검지 손가락 끝
    
    const handPosition = {
      x: (1 - indexFingerTip.x) * drawingCanvas.width,
      y: indexFingerTip.y * drawingCanvas.height
    };

    // 별 또는 연결선 근접성 확인
    if (isDrawingMode === 'stars') {
      checkStarProximity(handPosition);
    } else if (isDrawingMode === 'connections') {
      checkConnectionProximity(handPosition);
    }

    // 손가락 위치 표시 (작은 원)
    drawingCanvasCtx.fillStyle = 'rgba(255, 255, 0, 0.7)';
    drawingCanvasCtx.shadowColor = 'rgba(255, 255, 0, 1)';
    drawingCanvasCtx.shadowBlur = 10;
    drawingCanvasCtx.beginPath();
    drawingCanvasCtx.arc(handPosition.x, handPosition.y, 8, 0, Math.PI * 2);
    drawingCanvasCtx.fill();
  }

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
};

// Helper function to draw connectors
function drawConnectors(ctx, landmarks, connections, options) {
    ctx.beginPath();
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.lineWidth;
    for (const connection of connections) {
        const start = landmarks[connection.start];
        const end = landmarks[connection.end];
        ctx.moveTo(start.x * canvasElement.width, start.y * canvasElement.height);
        ctx.lineTo(end.x * canvasElement.width, end.y * canvasElement.height);
    }
    ctx.stroke();
}

/**
 * 랜드마크 위치에 반짝이는 파티클 효과를 그립니다.
 */
function drawSparkles(ctx, landmarks) {
    const sparkleColors = ["#FFFFFF", "#F0E68C", "#ADD8E6", "#FFB6C1"];
    
    for (const landmark of landmarks) {
        const x = landmark.x * canvasElement.width;
        const y = landmark.y * canvasElement.height;
        const size = Math.random() * 2 + 1;
        const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 별자리 단계에 진입했을 때 자동으로 분석을 시작하는 함수
 */
export async function startConstellationAnalysis() {
  try {
    if (!mediaPipePromise) {
      console.log('[Constellation] MediaPipe 초기화 시작...');
      mediaPipePromise = initializeMediaPipe();
    }
    
    await mediaPipePromise;
    console.log('[Constellation] MediaPipe 초기화 완료, 카메라 시작...');

    // 초기화가 완료된 후에만 카메라 시작
    if (!webcamRunning && faceLandmarker && handLandmarker) {
      enableCam();
    } else if (!faceLandmarker || !handLandmarker) {
      console.error('[Constellation] MediaPipe 초기화가 완료되지 않았습니다.');
      analysisStatus.innerText = 'MediaPipe 초기화 실패. 새로고침 해주세요.';
    }
  } catch (error) {
    console.error('[Constellation] 분석 시작 실패:', error);
    analysisStatus.innerText = '시스템 시작 실패. 새로고침 해주세요.';
  }
}

// 초기화 이벤트 리스너
startAnalysisBtn.addEventListener("click", enableCam);

// 다시 그리기 버튼
const clearDrawingBtn = document.getElementById('clear-drawing-btn');
if (clearDrawingBtn) {
    clearDrawingBtn.addEventListener("click", () => {
        initializeConstellation();
        console.log('[Constellation] 별자리 다시 그리기');
    });
}

// "다시 시작하기" 버튼 초기 상태 설정 (처음에는 숨김)
const restartBtn = document.getElementById('restart-btn');
if (restartBtn) {
    restartBtn.style.display = 'none';
    console.log('[Constellation] 다시 시작하기 버튼 초기 상태: 숨김');
}

/**
 * 외부에서 별자리를 직접 설정할 수 있는 함수
 */
function setCurrentConstellation(constellation) {
  currentConstellation = constellation;
  console.log('[Constellation] 외부에서 별자리 설정됨:', constellation.name);
}

/**
 * "다시 시작하기" 버튼을 표시합니다.
 */
function showRestartButton() {
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.style.display = 'block';
    restartBtn.addEventListener('click', restartGame);
    console.log('[Constellation] 다시 시작하기 버튼 표시됨');
  }
}

/**
 * 게임을 맨 처음으로 재시작합니다.
 */
function restartGame() {
  console.log('[Constellation] 게임 재시작 요청됨');
  
  // 별자리 상태 초기화
  currentConstellation = null;
  userChosenDilemmas = [];
  drawnStars.clear();
  drawnConnections.clear();
  constellationComplete = false;
  currentStarIndex = 0;
  isDrawingMode = 'stars';
  
  // 웹캠 중지
  if (webcamRunning) {
    enableCam();
  }
  
  // 캔버스 초기화
  if (drawingCanvasCtx) {
    drawingCanvasCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  }
  if (guideCanvasCtx) {
    guideCanvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
  }
  
  // MediaPipe 캔버스도 초기화
  if (canvasCtx) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
  
  // UI 상태 초기화
  if (startAnalysisBtn) {
    startAnalysisBtn.innerText = "별자리 그리기 시작";
    startAnalysisBtn.disabled = false;
  }
  
  if (analysisStatus) {
    analysisStatus.innerText = '별자리 시스템 로드 완료.';
  }
  
  // "다시 시작하기" 버튼 숨기기
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.style.display = 'none';
  }
  
  // 최종 결과 화면 숨기기
  const finalSection = document.getElementById('final-section');
  if (finalSection) {
    finalSection.classList.remove('active');
    console.log('[Constellation] 최종 결과 화면 숨김');
  }
  
  // JourneyManager를 통해 맨 처음으로 이동
  if (window.journeyManager) {
    window.journeyManager.restartFromBeginning();
  } else {
    console.error('[Constellation] JourneyManager를 찾을 수 없습니다.');
    // 폴백: 페이지 새로고침
    window.location.reload();
  }
}

export { enableCam, setCurrentConstellation };
