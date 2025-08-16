import { AudioManager } from './audio_manager.js';
import { enableCam, startConstellationAnalysis, setUserDilemmas, setCurrentConstellation } from './constellation_app.js';
import { initCardSelection } from './card_manager.js';
import * as UIManager from './ui_manager.js';
import { cardData, dilemmaData, combinationData } from './dilemma_data.js';

export class JourneyManager {
  constructor() {
    this.currentPhase = 0;
    this.phases = ['intro', 'prologue', 'selection', 'dialogue', 'mediapipe'];
    this.phaseData = { 
      choices: [], 
      timings: [], 
      selectedCard: null,
      dilemmaAnswers: [],
    };
    this.currentDilemmaIndex = 0;
    this.dialogueTurnCount = 0;
    this.dilemmaOrder = ['D', 'F', 'H']; // 딜레마 키들
    this.audioManager = new AudioManager();
    // 배경음악은 사용자 상호작용 후에 재생됨
    this.initializePhases();
    this.startPerformanceMonitoring();
    this.setupGlobalListeners();
  }

  initializePhases() {
    UIManager.hideAllSections();
    const introSection = document.getElementById('intro-section');
    if (introSection) {
      introSection.classList.add('active');
    }
    UIManager.updatePhaseIndicator(this.phases, this.currentPhase);
    this.handlePhase('intro');
  }

  transitionToPhase(i){
    if (i < 0 || i >= this.phases.length) return;

    const fromPhaseName = this.phases[this.currentPhase];
    const toPhaseName = this.phases[i];
    
    UIManager.transitionToPhase(fromPhaseName, toPhaseName);
    
    this.currentPhase = i;
    this.handlePhase(toPhaseName);
    UIManager.updatePhaseIndicator(this.phases, this.currentPhase);
  }
  
  handlePhase(name) {
    switch (name) {
      case 'intro': 
        this.setupIntroPhase(); 
        break;
      case 'prologue': 
        this.showPrologue(); 
        break;
      case 'selection':
        initCardSelection((selectedCardId) => {
          this.phaseData.selectedCard = selectedCardId;
          this.transitionToPhase(3); // dialogue 단계로 이동
        }, this.audioManager);
        break;
      case 'dialogue':
        this.startDialogue();
        break;
      case 'mediapipe':
        UIManager.hideAllSections();
        const mediapipeSection = document.getElementById('mediapipe-section');
        if (mediapipeSection) {
            mediapipeSection.classList.add('active');
            mediapipeSection.focus();
            this.setupConstellationPhase();
            startConstellationAnalysis(); // 자동으로 별자리 분석 시작
        }
        break;
      default:
        console.warn(`[JourneyManager] 알 수 없는 단계: ${name}`);
    }
  }
  
  updatePhaseIndicator() {
    const indicator = document.getElementById('phase-indicator');
    if (!indicator) return;
    
    const currentPhaseIndex = this.currentPhase;
    const totalPhases = this.phases.length;
    
    indicator.innerHTML = '';
    
    // 3단계까지는 원으로 표시
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('phase-dot');
        if (i < currentPhaseIndex) {
            dot.classList.add('completed');
        } else if (i === currentPhaseIndex) {
            dot.classList.add('active');
        }
        indicator.appendChild(dot);
    }
    
    // 현재 상태 텍스트 업데이트
    const statusText = document.getElementById('phase-status-text');
    if (statusText) {
        let text = '';
        switch (this.phases[currentPhaseIndex]) {
            case 'intro':
                text = 'Phase 0: Loading';
                break;
            case 'prologue':
                text = 'Phase 1: Prologue';
                break;
            case 'selection':
                text = 'Phase 2: Card Selection';
                break;
            case 'dialogue':
                text = 'Phase 3: Dialogue with God';
                break;
            case 'mediapipe':
                text = 'Phase 4: Mediapipe';
                break;
        }
        statusText.textContent = text;
    }
  }

  startPerformanceMonitoring() {
    // FPS 모니터링
    let frameCount = 0;
    let lastTime = performance.now();
    
    const checkPerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // FPS가 낮으면 성능 모드 활성화
        if (fps < 30 && !this.performanceMode) {
          this.activatePerformanceMode();
        } else if (fps > 50 && this.performanceMode) {
          this.deactivatePerformanceMode();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(checkPerformance);
    };
    
    requestAnimationFrame(checkPerformance);
  }

  activatePerformanceMode() {
    console.log('[Performance] 성능 모드 활성화');
    this.performanceMode = true;
    
    // Three.js 최적화
    if (window.minimizeThreeJS) {
      window.minimizeThreeJS();
    }
    
    // 애니메이션 최적화
    document.body.style.setProperty('--transition-fast', '0.1s');
    document.body.style.setProperty('--transition-normal', '0.2s');
    document.body.style.setProperty('--transition-slow', '0.3s');
  }

  deactivatePerformanceMode() {
    console.log('[Performance] 성능 모드 비활성화');
    this.performanceMode = false;
    
    // 애니메이션 복원
    document.body.style.setProperty('--transition-fast', '0.3s');
    document.body.style.setProperty('--transition-normal', '0.5s');
    document.body.style.setProperty('--transition-slow', '1s');
  }

  setupIntroPhase() {
    console.log('[Intro] 인트로 단계 상호작용 설정');
    
    const introSection = document.getElementById('intro-section');
    if (!introSection) {
      console.error('[Intro] intro-section을 찾을 수 없습니다.');
      return;
    }
    
    const finish = () => {
      // 중복 실행 방지
      if (this.currentPhase !== 0) return; 
      
      console.log('[Intro] 인트로 완료, 다음 단계로 이동');
      this.transitionToPhase(1);
    };
    
    introSection.addEventListener('click', finish, { once: true });
    
    // 6초 후 자동 진행
    setTimeout(finish, 6000);
    
    // 9초 후에도 인트로에 머물러 있으면 강제 전환 (워치독)
    setTimeout(() => {
      if (this.currentPhase === 0) {
        console.warn('[Intro] 워치독 작동 → Prologue로 강제 진행');
        finish();
      }
    }, 9000);
  }

  showPrologue() {
    console.log('[Prologue] 버튼 기반 프롤로그 시작');
    const continueBtn = document.getElementById('continue-btn');
    
    // 배경음악만 먼저 재생 (사용자 상호작용 후)
    this.audioManager.playSound('background');

    if (!continueBtn) {
      console.error('[Prologue] 계속하기 버튼을 찾을 수 없습니다.');
      // 만약을 대비해 5초 후 강제 전환
      setTimeout(() => this.transitionToPhase(2), 5000);
      return;
    }
    
    const onContinue = () => {
      this.audioManager.playSound('click');
      // 사용자가 클릭한 후에 음성 재생
      setTimeout(() => {
        this.audioManager.playSound('phase1_voice');
      }, 100);
      console.log('[Prologue] 계속하기 버튼 클릭됨. 2단계로 전환합니다.');
      this.transitionToPhase(2);
      continueBtn.removeEventListener('click', onContinue);
    };

    continueBtn.addEventListener('click', onContinue);
  }

  startDialogue() {
    this.presentDilemma();
    this.setupDialoguePhase();
  }

  presentDilemma() {
      console.log(`[Dilemma] presentDilemma 호출됨. currentDilemmaIndex: ${this.currentDilemmaIndex}, dilemmaOrder: ${this.dilemmaOrder}`);
      
      const dilemmaKey = this.dilemmaOrder[this.currentDilemmaIndex];
      const dilemma = dilemmaData[dilemmaKey];

      if (!dilemma) {
          console.log("모든 딜레마 완료. 다음 단계로 넘어갑니다.");
          this.triggerFinalTransition();
          return;
      }
      
      console.log(`[Dilemma] 현재 딜레마: ${dilemmaKey} (${this.currentDilemmaIndex + 1}/3)`);

      // UI 요소 가져오기
      const dilemmaContainer = document.getElementById('dilemma-container');
      const chatContainer = document.getElementById('chat-container');
      const titleEl = document.getElementById('dilemma-title');
      const linesEl = document.getElementById('mimir-lines');
      const guideEl = document.getElementById('dilemma-guide');
      const choicesEl = document.getElementById('dilemma-choices');
      const leftImageEl = document.getElementById('dilemma-left-image');
      const rightImageEl = document.getElementById('dilemma-right-image');
      
      // UI 초기화
      dilemmaContainer.style.display = 'flex';
      chatContainer.style.display = 'none';
      choicesEl.innerHTML = '';

      // 딜레마 내용 채우기
      titleEl.textContent = dilemma.title;
      linesEl.textContent = dilemma.mimir_lines.join('\n');
      guideEl.textContent = dilemma.guide;

      // 딜레마 이미지 표시
      if (dilemma.images) {
          leftImageEl.src = dilemma.images.left;
          rightImageEl.src = dilemma.images.right;
          leftImageEl.style.display = 'block';
          rightImageEl.style.display = 'block';
      } else {
          leftImageEl.style.display = 'none';
          rightImageEl.style.display = 'none';
      }

      // 선택지 버튼 생성
      Object.keys(dilemma.choices).forEach(choiceKey => {
          const choice = dilemma.choices[choiceKey];
          const button = document.createElement('button');
          button.classList.add('btn', 'choice-btn');
          button.textContent = choice.text;
          button.onclick = () => {
              this.audioManager.playSound('click');
              this.handleDilemmaChoice(dilemmaKey, choiceKey, choice);
          };
          choicesEl.appendChild(button);
      });
  }

  async handleDilemmaChoice(dilemmaKey, choiceKey, choice) {
      console.log(`Dilemma '${dilemmaKey}' | Choice '${choiceKey}': ${choice.text}`);
      
      // 선택 결과를 문자열로 저장 (D 또는 F)
      // option1은 'D' (첫 번째 선택), option2는 'F' (두 번째 선택)
      const choiceResult = choiceKey === 'option1' ? 'D' : 'F';
      this.phaseData.dilemmaAnswers.push(choiceResult);
      
      console.log(`[Dilemma] 선택 결과 추가: ${choiceResult}, 전체 답변:`, this.phaseData.dilemmaAnswers);
      
      this.dialogueTurnCount = 0; // 새 딜레마 시작 시 턴 카운트 초기화

      // 딜레마 UI 숨기고 채팅 UI 표시
      document.getElementById('dilemma-container').style.display = 'none';
      document.getElementById('chat-container').style.display = 'flex';
      
      const chatMessages = document.getElementById('chat-messages');
      chatMessages.innerHTML = ''; // 이전 대화 내용 삭제

      // LLM에 보낼 프롬프트 생성
      const prompt = `너는 '미미르'라는 이름을 가진, 지혜의 샘을 지키는 존재다. 인간의 선택을 지켜보고 그 의미를 묻는 역할을 한다. 방금 한 인간이 "${dilemmaData[dilemmaKey].title}" 상황에서 "${choice.text}" 라는 선택을 했다. 이 선택의 본질은 "${choice.outcome_summary}"이다. 이 요약 내용을 바탕으로, 사용자에게 "왜 그런 선택을 했는가?", "그 선택이 당신에게 어떤 의미인가?" 와 같이 그 선택의 동기와 결과를 깊이 파고드는, 짧지만 핵심적인 첫 질문을 던져라.`;
      
      this.addMessageToChat('user', `[나의 선택: ${choice.text}]`);

      try {
          const response = await this.getLLMResponse(prompt);
          this.addMessageToChat('assistant', response);
      } catch (error) {
          console.error("LLM 응답 생성 실패:", error);
          this.addMessageToChat('assistant', "너의 선택, 그 무게를 가늠하는 데 어려움이 있구나. 스스로에게 다시 물어보아라.");
      }
  }

  setupDialoguePhase() {
    // 채팅 폼 제출 이벤트
    const chatForm = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const submitBtn = chatForm.querySelector('button');

    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const userMessage = input.value.trim();
        if (!userMessage) return;

        this.addMessageToChat('user', userMessage);
        input.value = '';
        this.dialogueTurnCount++;

        // 응답 대기 중 폼 비활성화
        input.disabled = true;
        submitBtn.disabled = true;

        try {
            const response = await this.getLLMResponse(userMessage);
            this.addMessageToChat('assistant', response);
        } catch (error) {
            console.error("LLM 응답 생성 실패:", error);
            this.addMessageToChat('assistant', "...답변이 어렵구나. 다른 질문을 하지.");
        } finally {
            // 턴이 끝나지 않았으면 다시 폼 활성화
            if (this.dialogueTurnCount < 5) {
                input.disabled = false;
                submitBtn.disabled = false;
                input.focus();
            }
        }

        // 5턴이 되면 대화 종료 및 다음으로 이동
        if (this.dialogueTurnCount >= 5) {
            this.addMessageToChat('assistant', "시간이 되었다. 다음 질문으로 넘어가지.");
            
            // 마지막 딜레마인지 확인
            const isLastDilemma = this.currentDilemmaIndex >= this.dilemmaOrder.length - 1;
            document.getElementById('next-dilemma-btn').textContent = isLastDilemma ? "마지막 관문으로" : "다음 질문으로";

            // 다음으로 넘어가기 전 3초 대기
            setTimeout(() => {
                this.currentDilemmaIndex++;
                this.presentDilemma();
                 // 다음 딜레마를 위해 폼 다시 활성화
                input.disabled = false;
                submitBtn.disabled = false;
            }, 3000);
        }
    };

    // 다음 딜레마로 넘어가는 버튼
    document.getElementById('next-dilemma-btn').onclick = () => {
        this.audioManager.playSound('click');
        const isLastDilemma = this.currentDilemmaIndex >= this.dilemmaOrder.length - 1;
        if (isLastDilemma) {
            this.triggerFinalTransition();
        } else {
            this.currentDilemmaIndex++;
            this.presentDilemma();
        }
    };
  }

  triggerFinalTransition() {
    console.log('[FinalTransition] 딜레마 답변 상태:', this.phaseData.dilemmaAnswers);
    console.log('[FinalTransition] 딜레마 답변 개수:', this.phaseData.dilemmaAnswers.length);
    
    // 현재 대화창을 숨김
    document.getElementById('dialogue-section').classList.remove('active');

    const transitionText = "너의 선택을 존중한다. 이제 너의 생각을 표현하라!";
    const overlay = document.getElementById('transition-overlay');
    const textElement = document.getElementById('transition-text');

    // 텍스트 설정 및 오버레이 보이기
    textElement.textContent = transitionText;
    overlay.classList.add('visible');
    
    // Audio context 활성화 확인 및 미디어파이프 음성 재생 (1초 지연)
    this.audioManager.resumeAudioContext();
    setTimeout(() => {
        this.audioManager.playSound('mediapipe_voice');
    }, 1000);

    // TTS 재생 시간과 워프 효과 시작 타이밍 맞추기
    setTimeout(() => {
        if(window.startWarpEffect) {
            window.startWarpEffect(2500); // 2.5초간 워프
        }
    }, 500); // 0.5초 후 워프 시작

    // 워프 효과가 끝난 후 미디어파이프 섹션으로 전환
    setTimeout(() => {
        overlay.classList.remove('visible'); // 오버레이 숨기기
        // 오버레이가 사라지는 시간을 기다린 후 다음 단계로
        setTimeout(() => {
            this.transitionToPhase(4); // mediapipe 단계로 이동
        }, 500); // 0.5초 (CSS transition 시간)
    }, 3000); // 3초 후 (워프 효과 끝나는 시간)
  }

  addMessageToChat(sender, text) {
      const chatMessages = document.getElementById('chat-messages');
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', sender);
      messageElement.textContent = text;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight; // 자동 스크롤
      
      // 메시지가 추가될 때마다 메시지 소리 재생
      this.audioManager.playSound('message');
  }
  
  async getLLMResponse(prompt) {
      if (!window.OPENAI_API_KEY) {
          console.error("OpenAI API key not set.");
          // 실제 서비스에서는 사용자에게 더 친절한 메시지를 보여줘야 합니다.
          return "API 키가 설정되지 않아 응답할 수 없습니다."; 
      }
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${window.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
              model: "gpt-4-turbo",
              messages: [
                  { role: "system", content: "너는 지혜의 신 '미미르'다. 인간의 선택에 대해 깊이 있는 질문을 던지며, 짧고 성찰적인 답변을 유도한다. 항상 진지하고 신비로운 태도를 유지하며, 반드시 '반말'로 대답해야 한다." },
                  { role: "user", content: prompt }
              ],
              max_tokens: 150,
              temperature: 0.7
          })
      });
  
      if (!response.ok) {
          throw new Error(`OpenAI API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
  }

  async playTTS(text) {
    if (!window.ELEVENLABS_API_KEY || !window.ELEVENLABS_VOICE_ID) {
      console.error("ElevenLabs API key or Voice ID is not set.");
      return;
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${window.ELEVENLABS_VOICE_ID}/stream`;
    const headers = {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": window.ELEVENLABS_API_KEY,
    };
    const data = {
      "text": text,
      "model_id": "eleven_multilingual_v2",
      "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.3,
        "use_speaker_boost": true
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API request failed with status ${response.status}`);
      }
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      this.audioManager.playStream(audioUrl);

    } catch (error) {
      console.error("Error with ElevenLabs TTS:", error);
    }
  }

  setupConstellationPhase() {
    // 사용자의 딜레마 선택 결과를 분석해서 별자리 결정
    const userDilemmas = this.phaseData.dilemmaAnswers;
    console.log('[Constellation Setup] 사용자 딜레마 선택:', userDilemmas);
    console.log('[Constellation Setup] 딜레마 타입:', typeof userDilemmas);
    console.log('[Constellation Setup] 딜레마 길이:', userDilemmas ? userDilemmas.length : 'undefined');
    console.log('[Constellation Setup] phaseData 전체:', this.phaseData);
    
    setUserDilemmas(userDilemmas);
    
    // 3가지 딜레마의 선택을 조합하여 별자리 결정
    if (userDilemmas && userDilemmas.length >= 3) {
      const combination = userDilemmas.slice(0, 3).join('');
      console.log('[Constellation Setup] 딜레마 조합:', combination);
      console.log('[Constellation Setup] 사용 가능한 조합들:', Object.keys(combinationData));
      
      const combinationInfo = combinationData[combination];
      if (combinationInfo) {
        const constellation = combinationInfo.constellation;
        console.log('[Constellation Setup] 선택된 별자리:', constellation.name);
        console.log('[Constellation Setup] 선택된 카드:', combinationInfo.card.name);
        
        // UI에 별자리 정보 표시
        const nameElement = document.getElementById('constellation-name');
        const descElement = document.getElementById('constellation-description');
        
        if (nameElement) nameElement.textContent = constellation.name;
        if (descElement) descElement.textContent = constellation.description;
        
        // constellation_app.js의 currentConstellation 변수도 동기화
        setCurrentConstellation(constellation);
        
        console.log(`[Constellation Setup] UI 업데이트 완료: ${constellation.name}`);
      } else {
        console.error('[Constellation Setup] 조합을 찾을 수 없습니다:', combination);
        console.log('[Constellation Setup] 사용 가능한 조합들:', Object.keys(combinationData));
      }
    } else {
      console.log('[Constellation Setup] 딜레마가 부족합니다:', userDilemmas);
      console.log('[Constellation Setup] phaseData 전체:', this.phaseData);
    }
  }

  setupGlobalListeners() {
    // 키보드 이벤트 (디버깅용)
    window.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') {
        const phase = parseInt(e.key, 10);
        console.log(`[Debug] ${phase}번 단계로 강제 이동`);
        this.transitionToPhase(phase);
      }
    });
  }
  
  /**
   * 게임을 맨 처음으로 재시작합니다.
   */
  restartFromBeginning() {
    console.log('[JourneyManager] 게임 재시작 - 맨 처음으로 이동');
    
    // 모든 상태 초기화
    this.currentPhase = 0;
    this.currentDilemmaIndex = 0;
    this.dialogueTurnCount = 0;
    this.phaseData = { 
      choices: [], 
      timings: [], 
      selectedCard: null,
      dilemmaAnswers: [],
    };
    
    // 모든 섹션 숨기기
    UIManager.hideAllSections();
    
    // 최종 결과 화면도 명시적으로 숨기기
    const finalSection = document.getElementById('final-section');
    if (finalSection) {
      finalSection.classList.remove('active');
      console.log('[JourneyManager] 최종 결과 화면 숨김');
    }
    
    // 오디오 재시작
    this.audioManager.playSound('background');
    
    // 맨 처음 단계로 이동
    this.transitionToPhase(0);
    
    console.log('[JourneyManager] 게임 재시작 완료');
  }
}
