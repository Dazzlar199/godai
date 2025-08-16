/**
 * @file card_manager.js
 * 카드 선택 UI와 상호작용을 관리합니다.
 */

import { cardData } from './dilemma_data.js';

/**
 * 카드 선택 로직을 초기화하고 이벤트를 설정합니다.
 * @param {function} onCardSelected - 카드가 선택되었을 때 호출될 콜백 함수. 선택된 카드의 ID를 인자로 받습니다.
 * @param {object} audioManager - 오디오 재생을 위한 AudioManager 인스턴스.
 */
export function initCardSelection(onCardSelected, audioManager) {
  const cardGrid = document.getElementById('card-grid');
  if (!cardGrid) {
    console.error('[CardManager] 카드 그리드를 찾을 수 없습니다.');
    return;
  }

  // 기존 카드 비우기
  cardGrid.innerHTML = '';
  let cardSelected = false; // 중복 선택 방지를 위한 플래그

  // 전역 콜백 함수 저장 (모달에서 사용하기 위해)
  window.cardSelectionCallback = onCardSelected;

  // 카드 생성
  const cardCount = 8;
  for (let i = 1; i <= cardCount; i++) {
    const cardItem = document.createElement('div');
    cardItem.className = 'card-item';
    cardItem.dataset.cardId = i;

    const cardImage = document.createElement('img');
    cardImage.src = `/static/assets/card/${i}.png`;
    cardImage.alt = `카드 ${i}`;
    cardImage.onerror = () => {
      cardImage.src = '/static/assets/card/back.png'; // 대체 이미지
    };
    
    cardItem.appendChild(cardImage);
    cardGrid.appendChild(cardItem);
  }

  // 이벤트 핸들러
  const handleCardClick = (event) => {
    const cardItem = event.target.closest('.card-item');
    if (!cardItem || cardSelected) return;

    const selectedCardId = cardItem.dataset.cardId;
    audioManager.playSound('click');

    // 카드 상세 정보 모달 표시
    showCardDetailModal(selectedCardId);
  };

  cardGrid.addEventListener('click', handleCardClick);
}

// 카드 상세 정보 모달 관련 함수들
function showCardDetailModal(cardId) {
    const card = cardData[cardId];
    if (!card || !card.detailedInfo) return;

    // 모달 내용 설정
    document.getElementById('modal-card-name').textContent = card.name;
    document.getElementById('modal-card-keyword').textContent = card.keyword;
    document.getElementById('modal-card-personality').textContent = card.detailedInfo.personality;
    document.getElementById('modal-card-strengths').textContent = card.detailedInfo.strengths;
    document.getElementById('modal-card-weaknesses').textContent = card.detailedInfo.weaknesses;

    // 선택 버튼에 카드 ID 설정
    const selectBtn = document.getElementById('modal-select-card');
    selectBtn.onclick = () => selectCardFromModal(cardId);

    // 모달 표시
    document.getElementById('card-detail-modal').style.display = 'block';
}

function closeCardDetailModal() {
    document.getElementById('card-detail-modal').style.display = 'none';
}

function selectCardFromModal(cardId) {
    closeCardDetailModal();
    // 카드 선택 로직 실행
    if (window.cardSelectionCallback) {
        window.cardSelectionCallback(cardId);
    }
}

// 전역 함수로 노출
window.showCardDetailModal = showCardDetailModal;
window.closeCardDetailModal = closeCardDetailModal;
