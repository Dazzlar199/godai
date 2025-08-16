/**
 * @file ui_manager.js
 * 애플리케이션의 전체적인 UI 상태와 전환을 관리합니다.
 */

/**
 * 한 단계(phase)에서 다른 단계로 화면을 전환합니다.
 * @param {string} fromPhaseName - 숨겨질 현재 단계의 이름
 * @param {string} toPhaseName - 보여질 새로운 단계의 이름
 */
export function transitionToPhase(fromPhaseName, toPhaseName) {
  const fromEl = document.getElementById(`${fromPhaseName}-section`);
  const toEl = document.getElementById(`${toPhaseName}-section`);

  // 1. 이전 단계 정리
  if (fromEl) {
    fromEl.classList.remove('active');
  }
  
  // 2. 새 단계 활성화
  if (toEl) {
    toEl.classList.add('active');
    toEl.focus?.();
  }

  console.log(`[UIManager] Phase transitioned from ${fromPhaseName} to ${toPhaseName}`);
}

/**
 * 현재 진행 단계를 시각적으로 표시하는 인디케이터를 업데이트합니다.
 * @param {string[]} phases - 전체 단계의 이름 배열
 * @param {number} currentPhaseIndex - 현재 단계의 인덱스
 */
export function updatePhaseIndicator(phases, currentPhaseIndex) {
  const indicator = document.getElementById('phase-indicator');
  if (!indicator) return;
  
  indicator.innerHTML = '';
  
  // 예시: 3단계까지만 원으로 표시
  const displayCount = 3;
  for (let i = 0; i < displayCount; i++) {
      const dot = document.createElement('div');
      dot.classList.add('phase-dot');
      if (i < currentPhaseIndex) {
          dot.classList.add('completed');
      } else if (i === currentPhaseIndex) {
          dot.classList.add('active');
      }
      indicator.appendChild(dot);
  }
  
  const statusText = document.getElementById('phase-status-text');
  if (statusText) {
      let text = '';
      if (phases[currentPhaseIndex]) {
        const phaseName = phases[currentPhaseIndex];
        text = `Phase ${currentPhaseIndex}: ${phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}`;
      }
      statusText.textContent = text;
  }
}

/**
 * 모든 단계(phase) 섹션을 숨깁니다.
 */
export function hideAllSections() {
  document.querySelectorAll('.phase-section').forEach(section => {
    section.classList.remove('active');
  });
}
