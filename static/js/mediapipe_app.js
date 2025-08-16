// mediapipe_app.js

import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { transitionToPhase } from './ui_manager.js';

const DAMPING_FACTOR = 0.8;

let faceLandmarker;
let handLandmarker;
let runningMode = "VIDEO";
let webcamRunning = false;
let video;
let canvasElement;
let canvasCtx;
let drawingCanvasCtx; // 드로잉 캔버스 컨텍스트
let guideCanvasCtx; // 가이드 캔버스 컨텍스트

let lastVideoTime = -1;
let smoothedLandmarks = null;
let blendshapes = [];
let lastDrawnPosition = null; // 마지막으로 그린 위치 저장

// 미션 관련 변수
const missionSequence = ['heart', 'star', 'eye'];
let currentMissionIndex = 0;
let missionComplete = false;
let lastCheckTime = 0; // 자동 판정 시간 간격 제어
let isMouseDrawing = false; // 마우스 드로잉 상태
let lastMousePosition = { x: 0, y: 0 }; // 마지막 마우스 위치

// DOM Elements
const videoContainer = document.querySelector('.mediapipe-container');
const startAnalysisBtn = document.getElementById('start-analysis-btn');
const analysisStatus = document.getElementById('analysis-status');
video = document.getElementById('webcam');
canvasElement = document.getElementById('mediapipe-canvas');
const drawingCanvas = document.getElementById('drawing-canvas');
const guideCanvas = document.getElementById('guide-canvas');
const missionProgress = document.getElementById('mission-progress');

// MediaPipe 초기화 상태를 추적하는 Promise
let mediaPipePromise = null;

/**
 * MediaPipe FaceLandmarker를 초기화합니다.
 * 이 함수는 한 번만 호출되어야 합니다.
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
    
    analysisStatus.innerText = '모든 모델 로드 완료.';
    startAnalysisBtn.disabled = false;
    startAnalysisBtn.addEventListener("click", enableCam);
    console.log('[MediaPipe] 초기화 완료.');

  } catch (error) {
    console.error('[MediaPipe] 초기화 실패:', error);
    analysisStatus.innerText = '모델 로딩 실패. 새로고침 해주세요.';
  }
}


const enableCam = (event) => {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    startAnalysisBtn.innerText = "분석 시작";
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  } else {
    webcamRunning = true;
    startAnalysisBtn.innerText = "분석 중지";
    analysisStatus.innerText = '웹캠을 활성화하고 얼굴과 손을 인식합니다.';
    
    canvasCtx = canvasElement.getContext("2d");
    
    // 두 드로잉 캔버스 컨텍스트 초기화
    drawingCanvasCtx = drawingCanvas.getContext("2d");
    guideCanvasCtx = guideCanvas.getContext("2d");

    // 드로잉 스타일 초기화
    drawingCanvasCtx.strokeStyle = "rgba(255, 105, 180, 0.9)";
    drawingCanvasCtx.lineWidth = 60; // 초대형 브러시로 쉽게 칠하도록 변경
    drawingCanvasCtx.lineCap = "round";
    drawingCanvasCtx.lineJoin = 'round';

    // --- 클리핑 마스크 설정으로 복원 ---
    drawGuideShape(missionSequence[currentMissionIndex]); 
    setDrawingClip(missionSequence[currentMissionIndex]);

    // 마우스 드로잉 이벤트 리스너 추가
    addMouseDrawingListeners();

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
 * 마우스 드로잉을 위한 이벤트 리스너를 설정합니다.
 */
function addMouseDrawingListeners() {
    if (!drawingCanvas) return;

    const getMousePos = (e) => {
        const rect = drawingCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    drawingCanvas.addEventListener('mousedown', (e) => {
        isMouseDrawing = true;
        lastMousePosition = getMousePos(e);
    });

    drawingCanvas.addEventListener('mousemove', (e) => {
        if (!isMouseDrawing) return;
        const currentPos = getMousePos(e);
        
        drawingCanvasCtx.beginPath();
        drawingCanvasCtx.moveTo(lastMousePosition.x, lastMousePosition.y);
        drawingCanvasCtx.lineTo(currentPos.x, currentPos.y);
        drawingCanvasCtx.stroke();

        lastMousePosition = currentPos;
    });

    const stopDrawing = () => { isMouseDrawing = false; };
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseleave', stopDrawing);
}


const clearDrawingCanvas = () => {
    if (drawingCanvasCtx) {
        // 클리핑을 잠시 해제하고 캔버스 전체를 지웁니다.
        drawingCanvasCtx.save();
        drawingCanvasCtx.reset(); // 모든 변환, 클리핑 포함 리셋
        drawingCanvasCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCanvasCtx.restore();

        // 스타일과 클리핑을 다시 적용합니다.
        drawingCanvasCtx.strokeStyle = "rgba(255, 105, 180, 0.9)";
        drawingCanvasCtx.lineWidth = 60;
        drawingCanvasCtx.lineCap = "round";
        drawingCanvasCtx.lineJoin = 'round';
        setDrawingClip(missionSequence[currentMissionIndex]);
        console.log('[Drawing] 사용자 캔버스 초기화 및 클리핑 재설정.');
    }
};

// 드로잉 컨트롤 이벤트 리스너
const colorPalette = document.getElementById('color-palette');
const brushSizeSlider = document.getElementById('brush-size');

if (colorPalette) {
    colorPalette.addEventListener('click', (event) => {
        if (event.target.classList.contains('color-box')) {
            const color = event.target.dataset.color;
            if (drawingCanvasCtx) {
                drawingCanvasCtx.strokeStyle = color;
                console.log(`[Drawing] 브러시 색상 변경: ${color}`);
            }
        }
    });
}

if (brushSizeSlider) {
    brushSizeSlider.addEventListener('input', (event) => {
        const size = event.target.value;
        if (drawingCanvasCtx) {
            drawingCanvasCtx.lineWidth = size;
            console.log(`[Drawing] 브러시 굵기 변경: ${size}`);
        }
    });
}

// '다시 그리기' 버튼 이벤트 리스너
const clearDrawingBtn = document.getElementById('clear-drawing-btn');
if (clearDrawingBtn) {
    clearDrawingBtn.addEventListener('click', clearDrawingCanvas);
}

// '다음 미션' (건너뛰기) 버튼 이벤트 리스너
const nextMissionBtn = document.getElementById('next-mission-btn');
if (nextMissionBtn) {
    nextMissionBtn.addEventListener('click', () => {
        console.log('[Mission] 수동으로 다음 미션으로 넘어갑니다.');
        currentMissionIndex++;
        if (currentMissionIndex < missionSequence.length) {
            startNextMission();
        } else {
            missionComplete = true;
            alert('모든 미션을 완료했습니다! (건너뛰기)');
            transitionToPhase('mediapipe', 'final');
        }
    });
}


/* // 버튼을 사용한 판정은 더 이상 사용하지 않음
const checkDrawingBtn = document.getElementById('check-drawing-btn');
if (checkDrawingBtn) {
    checkDrawingBtn.addEventListener('click', () => {
        if (!missionComplete) {
            checkDrawing();
        }
    });
}
*/

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
  // 배경을 검은색으로 채우고, 웹캠 영상은 그리지 않습니다.
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  // canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

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

    // 추가적인 그리기 로직 (눈, 코, 입 등)
  }

  // 손 랜드마크도 왼쪽 캔버스에 시각화 (좌우 반전 적용)
  if (handResults.landmarks && handResults.landmarks.length > 0) {
    for (const landmarks of handResults.landmarks) {
      const flippedHandLandmarks = landmarks.map(landmark => ({...landmark, x: 1 - landmark.x}));
      drawConnectors(canvasCtx, flippedHandLandmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#00FF00", // 손은 녹색으로 표시
        lineWidth: 2,
      });
    }
  }

  // 오른쪽 (드로잉) 캔버스 그리기 (좌우 반전 적용)
  if (handResults.landmarks && handResults.landmarks.length > 0) {
    const landmarks = handResults.landmarks[0];
    const indexFingerTip = landmarks[8]; // 검지 손가락 끝
    
    const currentPosition = {
      x: (1 - indexFingerTip.x) * drawingCanvas.width,
      y: indexFingerTip.y * drawingCanvas.height
    };

    // 단순 그리기 로직으로 복원
    if (lastDrawnPosition) {
        drawingCanvasCtx.beginPath();
        drawingCanvasCtx.moveTo(lastDrawnPosition.x, lastDrawnPosition.y);
        drawingCanvasCtx.lineTo(currentPosition.x, currentPosition.y);
        drawingCanvasCtx.stroke();
    }
    
    lastDrawnPosition = currentPosition;

    // 자동 판정 실행 (0.5초마다)
    const now = Date.now();
    if (now - lastCheckTime > 500) {
        checkDrawing();
        lastCheckTime = now;
    }

  } else {
    lastDrawnPosition = null; // 손이 안보이면 선 끊기
  }

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
};

// ========================================
// 미션 관련 함수들
// ========================================

/**
 * 가이드 캔버스에 미션 모양을 그립니다.
 * @param {string} shape - 그릴 모양 ('heart', 'star', 'eye')
 */
function drawGuideShape(shape) {
    if (!guideCanvasCtx) return;

    guideCanvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    
    // 기본 스타일
    guideCanvasCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    guideCanvasCtx.lineWidth = 15;
    guideCanvasCtx.lineJoin = 'round';
    guideCanvasCtx.lineCap = 'round';
    guideCanvasCtx.shadowBlur = 0; // 그림자 초기화

    // '눈' 모양일 때 특별 스타일 적용
    if (shape === 'eye') {
        guideCanvasCtx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        guideCanvasCtx.shadowColor = 'rgba(0, 255, 255, 1)';
        guideCanvasCtx.shadowBlur = 20;
    }

    const w = guideCanvas.width;
    const h = guideCanvas.height;
    
    // 가이드 경로 그리기
    defineShapePath(guideCanvasCtx, shape, w, h);
    guideCanvasCtx.stroke();
    
    console.log(`[Mission] 가이드 모양 그리기 완료: ${shape}`);
}

/**
 * 사용자 드로잉 캔버스에 클리핑 영역을 설정합니다.
 * @param {string} shape - 클리핑할 모양
 */
function setDrawingClip(shape) {
    if (!drawingCanvasCtx) return;
    
    const w = drawingCanvas.width;
    const h = drawingCanvas.height;

    drawingCanvasCtx.save();
    drawingCanvasCtx.beginPath();
    defineShapePath(drawingCanvasCtx, shape, w, h);
    drawingCanvasCtx.clip();
    console.log(`[Mission] 드로잉 캔버스에 클리핑 영역 설정: ${shape}`);
}


/**
 * 모양의 경로를 정의하는 공통 함수. (그리지는 않음)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} shape 
 * @param {number} w 
 * @param {number} h 
 */
function defineShapePath(ctx, shape, w, h) {
    ctx.beginPath();
    switch (shape) {
        case 'heart':
            // 하트 경로 (비율 수정)
            ctx.moveTo(w * 0.5, h * 0.35);
            ctx.bezierCurveTo(w * 0.3, h * 0.1, w * 0.1, h * 0.5, w * 0.5, h * 0.85);
            ctx.bezierCurveTo(w * 0.9, h * 0.5, w * 0.7, h * 0.1, w * 0.5, h * 0.35);
            break;
        case 'star':
            // 별 경로
            ctx.moveTo(w * 0.5, h * 0.15);
            ctx.lineTo(w * 0.61, h * 0.4);
            ctx.lineTo(w * 0.88, h * 0.45);
            ctx.lineTo(w * 0.68, h * 0.65);
            ctx.lineTo(w * 0.75, h * 0.9);
            ctx.lineTo(w * 0.5, h * 0.75);
            ctx.lineTo(w * 0.25, h * 0.9);
            ctx.lineTo(w * 0.32, h * 0.65);
            ctx.lineTo(w * 0.12, h * 0.45);
            ctx.lineTo(w * 0.39, h * 0.4);
            break;
        case 'eye':
            // 눈 경로
            ctx.moveTo(w * 0.2, h * 0.5);
            ctx.bezierCurveTo(w * 0.35, h * 0.2, w * 0.65, h * 0.2, w * 0.8, h * 0.5);
            ctx.bezierCurveTo(w * 0.65, h * 0.8, w * 0.35, h * 0.8, w * 0.2, h * 0.5);
            break;
    }
    ctx.closePath();
}


/**
 * 사용자의 그림을 판정합니다. (색칠하기 방식)
 */
function checkDrawing() {
    if (!drawingCanvasCtx || !guideCanvasCtx || missionComplete) {
        return;
    }
    // console.log('[Mission] 자동 판정 실행...'); // 너무 자주 호출되므로 주석 처리

    const guideData = guideCanvasCtx.getImageData(0, 0, guideCanvas.width, guideCanvas.height).data;
    const drawingData = drawingCanvasCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height).data;

    let guidePixelCount = 0;
    let correctlyDrawnPixels = 0;

    for (let i = 0; i < guideData.length; i += 4) {
        // isPointInStroke는 선의 중심을 기준으로 판정하므로, 실제 그려진 픽셀을 직접 비교
        const isGuidePixel = guideData[i + 3] > 0;
        const isDrawingPixel = drawingData[i + 3] > 0;

        if (isGuidePixel) {
            guidePixelCount++;
            if (isDrawingPixel) {
                correctlyDrawnPixels++;
            }
        }
    }

    const accuracy = guidePixelCount > 0 ? (correctlyDrawnPixels / guidePixelCount) : 0;
    
    // 진행률 UI 업데이트
    if (missionProgress) {
        missionProgress.textContent = `채우기: ${Math.round(accuracy * 100)}%`;
    }

    const successThreshold = 0.5; // 50% 이상 채우면 성공

    if (accuracy >= successThreshold) {
        console.log(`[Mission] 성공! ${Math.round(accuracy * 100)}% 완성!`);
        currentMissionIndex++;
        if (currentMissionIndex < missionSequence.length) {
            startNextMission();
        } else {
            console.log('모든 미션을 완료했습니다! 축하합니다!');
            missionComplete = true;
            // 최종 단계로 전환
            transitionToPhase('mediapipe', 'final');
        }
    }
}

/**
 * 다음 미션을 시작합니다.
 */
function startNextMission() {
    console.log(`[Mission] 다음 미션 시작: ${missionSequence[currentMissionIndex]}`);
    
    // 캔버스 초기화
    drawingCanvasCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    guideCanvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    
    // 다음 가이드 그리기 및 클리핑 설정
    drawGuideShape(missionSequence[currentMissionIndex]);
    setDrawingClip(missionSequence[currentMissionIndex]);
}


startAnalysisBtn.addEventListener("click", enableCam);

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
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {Array} landmarks - 랜드마크 배열
 */
function drawSparkles(ctx, landmarks) {
    const sparkleColors = ["#FFFFFF", "#F0E68C", "#ADD8E6", "#FFB6C1"];
    
    for (const landmark of landmarks) {
        const x = landmark.x * canvasElement.width;
        const y = landmark.y * canvasElement.height;
        const size = Math.random() * 2 + 1; // 1-3px 크기
        const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}


/**
 * mediapipe 단계에 진입했을 때, 자동으로 분석을 시작하는 함수
 */
export async function startMediaPipeAnalysis() {
  // 초기화가 시작되지 않았다면, 시작하고 Promise를 저장합니다.
  if (!mediaPipePromise) {
    mediaPipePromise = initializeMediaPipe();
  }
  
  // 초기화가 완료될 때까지 기다립니다.
  await mediaPipePromise;

  if (!webcamRunning) {
    enableCam();
  }
}

export { enableCam };
