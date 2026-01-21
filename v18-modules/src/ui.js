/**
 * SamQuiz AI v18 - UI 이벤트 핸들러
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가
 */

import { TYPE_NAMES, LEVEL_NAMES, FORM_TYPES, LETTER_REORDER_CONFIG, CROSSWORD_CONFIG } from './config.js';
import {
  state,
  typeConfig,
  presetData,
  settings,
  quizSequence,
  addSequenceItem,
  removeSequenceItem,
  moveSequenceItem,
  getSequence,
  setSequence,
  updatePresetData,
  savePresetData,
  saveSettings,
  resetSettings,
  getCurrentConfig,
  applyConfig,
  saveLastUsedConfig,
  getApiKey,
  saveApiKey
} from './state.js';
import {
  getChatbotHTML,
  getLoadingHTML,
  MESSAGE_ICONS,
  getSequenceItemHTML,
  getLetterReorderInputHTML,
  getLetterReorderWelcomeHTML,
  getLetterReorderPreviewHTML,
  getCrosswordInputHTML,
  getCrosswordWelcomeHTML,
  getCrosswordPreviewHTML
} from './templates.js';
import { injectStyles } from './styles.js';
import { callGeminiAPI, callGeminiAPIForLetterReorder, callGeminiAPIForCrossword } from './api.js';
import { fileToBase64, getMimeType, arrayToText, textToArray, wait } from './utils.js';
import { formFillers, clickSaveButton, clickAddQuizButton, isCurrentFormEmpty, applyLetterReorderToForm, applyCrosswordToForm } from './form.js';

// === 드래그 변수 ===
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let windowExpandedHeight = '700px';

// === v13: 현재 미리보기 컨테이너 ID ===
let currentPreviewId = null;

// === v15: 현재 폼 타입 ===
let currentFormType = FORM_TYPES.standard;

// === v15: 글자순서바꾸기 데이터 ===
let letterReorderData = {
  words: [],
  wordCount: 5
};

// === v16: 가로세로퍼즐 데이터 ===
let crosswordData = {
  grid: [],
  hints: { horizontal: [], vertical: [] },
  placedWords: [],
  wordCount: 5
};

// === v15: 폼 타입 감지 ===
function detectFormType() {
  const activeTab = document.querySelector('.nav-link.active');
  if (!activeTab) return FORM_TYPES.standard;

  const tabText = activeTab.textContent.trim();
  if (tabText === '글자 순서 바꾸기') return FORM_TYPES.letterReorder;
  if (tabText === '가로세로퍼즐') return FORM_TYPES.crossword;
  return FORM_TYPES.standard;
}

// === 챗봇 UI 생성 ===
export function createChatbotUI() {
  injectStyles();

  // v15: 폼 타입 감지
  currentFormType = detectFormType();

  document.body.insertAdjacentHTML('beforeend', getChatbotHTML());

  // v15/v16: 폼 타입에 따라 UI 수정
  if (currentFormType === FORM_TYPES.letterReorder) {
    setupLetterReorderUI();
  } else if (currentFormType === FORM_TYPES.crossword) {
    setupCrosswordUI();
  }

  setupEventListeners();
  setupDragAndDrop();
}

// === v15: 글자순서바꾸기 UI 설정 ===
function setupLetterReorderUI() {
  // 환영 메시지 변경
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = getLetterReorderWelcomeHTML();
  }

  // 입력 영역 변경 (시퀀스 섹션과 콤보 섹션 숨기고 단어 개수 선택 추가)
  const inputArea = document.querySelector('.sqai-input-area');
  if (inputArea) {
    // 시퀀스 섹션 숨기기
    const sequenceSection = inputArea.querySelector('.sqai-sequence-section');
    if (sequenceSection) sequenceSection.style.display = 'none';

    // 콤보 섹션 숨기기
    const comboSection = inputArea.querySelector('#combo-section');
    if (comboSection) comboSection.style.display = 'none';

    // 단어 개수 선택 섹션 추가
    const topicSection = inputArea.querySelector('.sqai-topic-section');
    if (topicSection) {
      const wordCountHTML = `
        <div class="sqai-word-count-section">
          <label class="sqai-option-label">생성할 단어 개수</label>
          <div class="sqai-word-count-row">
            <button class="sqai-count-btn" data-count="2">2</button>
            <button class="sqai-count-btn" data-count="3">3</button>
            <button class="sqai-count-btn" data-count="4">4</button>
            <button class="sqai-count-btn active" data-count="5">5</button>
            <button class="sqai-count-btn" data-count="6">6</button>
            <button class="sqai-count-btn" data-count="7">7</button>
            <button class="sqai-count-btn" data-count="8">8</button>
            <button class="sqai-count-btn" data-count="10">10</button>
          </div>
        </div>
      `;
      topicSection.insertAdjacentHTML('afterend', wordCountHTML);
    }

    // 생성 버튼 텍스트 변경
    const generateBtn = document.getElementById('generate-button');
    if (generateBtn) {
      const btnText = generateBtn.querySelector('span');
      if (btnText) btnText.textContent = '단어 생성하기';
    }
  }

  // 이벤트 설정
  setupLetterReorderEvents();
}

// === v15: 글자순서바꾸기 이벤트 설정 ===
function setupLetterReorderEvents() {
  // 단어 개수 버튼
  document.querySelectorAll('.sqai-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sqai-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      letterReorderData.wordCount = parseInt(btn.dataset.count);
    });
  });
}

// === v16: 가로세로퍼즐 UI 설정 ===
function setupCrosswordUI() {
  // 환영 메시지 변경
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = getCrosswordWelcomeHTML();
  }

  // 입력 영역 변경 (시퀀스 섹션과 콤보 섹션 숨기고 단어 개수 선택 추가)
  const inputArea = document.querySelector('.sqai-input-area');
  if (inputArea) {
    // 시퀀스 섹션 숨기기
    const sequenceSection = inputArea.querySelector('.sqai-sequence-section');
    if (sequenceSection) sequenceSection.style.display = 'none';

    // 콤보 섹션 숨기기
    const comboSection = inputArea.querySelector('#combo-section');
    if (comboSection) comboSection.style.display = 'none';

    // 단어 개수 선택 섹션 추가
    const topicSection = inputArea.querySelector('.sqai-topic-section');
    if (topicSection) {
      const wordCountHTML = `
        <div class="sqai-word-count-section">
          <label class="sqai-option-label">생성할 단어 개수</label>
          <div class="sqai-word-count-row">
            <button class="sqai-count-btn" data-count="3">3</button>
            <button class="sqai-count-btn" data-count="4">4</button>
            <button class="sqai-count-btn active" data-count="5">5</button>
            <button class="sqai-count-btn" data-count="6">6</button>
            <button class="sqai-count-btn" data-count="7">7</button>
            <button class="sqai-count-btn" data-count="8">8</button>
            <button class="sqai-count-btn" data-count="10">10</button>
          </div>
        </div>
      `;
      topicSection.insertAdjacentHTML('afterend', wordCountHTML);
    }

    // 생성 버튼 텍스트 변경
    const generateBtn = document.getElementById('generate-button');
    if (generateBtn) {
      const btnText = generateBtn.querySelector('span');
      if (btnText) btnText.textContent = '퍼즐 생성하기';
    }
  }

  // 이벤트 설정
  setupCrosswordEvents();
}

// === v16: 가로세로퍼즐 이벤트 설정 ===
function setupCrosswordEvents() {
  // 단어 개수 버튼
  document.querySelectorAll('.sqai-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sqai-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      crosswordData.wordCount = parseInt(btn.dataset.count);
    });
  });
}

// === 이벤트 리스너 설정 ===
function setupEventListeners() {
  // 기본 버튼들
  document.getElementById('chatbot-button').addEventListener('click', toggleChatbot);
  document.getElementById('close-chatbot').addEventListener('click', toggleChatbot);
  document.getElementById('minimize-chatbot').addEventListener('click', minimizeChatbot);
  document.getElementById('generate-button').addEventListener('click', handleGenerate);
  document.getElementById('topic-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !state.isGenerating) handleGenerate();
  });

  // 파일 업로드
  document.getElementById('sqai-file-upload-btn').addEventListener('click', () => {
    document.getElementById('sqai-file-input').click();
  });
  document.getElementById('sqai-file-input').addEventListener('change', handleFileUpload);
  document.getElementById('sqai-file-remove').addEventListener('click', removeFile);

  // v10: 파일 드래그앤드롭
  setupFileDragAndDrop();

  // 설정 패널
  document.getElementById('settings-chatbot').addEventListener('click', toggleSettings);
  document.getElementById('close-settings').addEventListener('click', toggleSettings);
  document.getElementById('save-settings').addEventListener('click', handleSaveSettings);
  document.getElementById('reset-settings').addEventListener('click', handleResetSettings);

  // v18: API 키 보기/숨기기 토글
  document.getElementById('toggle-api-key-visibility').addEventListener('click', () => {
    const apiKeyInput = document.getElementById('setting-api-key');
    const showIcon = document.getElementById('eye-icon-show');
    const hideIcon = document.getElementById('eye-icon-hide');

    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      showIcon.style.display = 'none';
      hideIcon.style.display = 'block';
    } else {
      apiKeyInput.type = 'password';
      showIcon.style.display = 'block';
      hideIcon.style.display = 'none';
    }
  });

  // 설정 패널 메인 탭
  document.querySelectorAll('.sqai-settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sqai-settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sqai-tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // 학교급 서브탭
  document.querySelectorAll('.sqai-school-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sqai-school-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sqai-school-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(`school-${tab.dataset.level}`);
      if (panel) panel.classList.add('active');
    });
  });

  // 세그먼트 버튼 (학교급)
  document.querySelectorAll('.sqai-segment').forEach(segment => {
    segment.querySelectorAll('.sqai-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        segment.querySelectorAll('.sqai-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  // v9: 시퀀스 이벤트 - 유형 추가 버튼
  document.querySelectorAll('.sqai-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (getSequence().length >= 20) {
        addMessage('최대 20개까지 추가할 수 있습니다.', false, false, 'warning');
        return;
      }
      addSequenceItem(type);
      renderSequenceList();
      markPresetAsModified();
    });
  });

  // 시퀀스 드래그 앤 드롭 설정
  setupSequenceDragAndDrop();

  // v11: 길이제한 입력값 검증
  setupLengthLimitValidation();

  // 프리셋(나의 조합) 이벤트
  document.getElementById('preset-select').addEventListener('change', handlePresetSelect);
  document.getElementById('preset-delete-btn').addEventListener('click', showDeleteConfirm);
  // 저장 모드
  document.getElementById('preset-save-confirm').addEventListener('click', handlePresetSaveConfirm);
  document.getElementById('preset-save-cancel').addEventListener('click', showComboDefault);
  document.getElementById('preset-name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePresetSaveConfirm();
  });
  // 삭제 확인 모드
  document.getElementById('preset-delete-confirm').addEventListener('click', handlePresetDeleteConfirm);
  document.getElementById('preset-delete-cancel').addEventListener('click', showComboDefault);

  // v12: 빠른 저장 버튼
  document.getElementById('quick-save-btn').addEventListener('click', showSaveMode);

  // v13: 결과 영역 버튼
  document.getElementById('regenerate-all-btn').addEventListener('click', handleRegenerateAll);
  document.getElementById('apply-btn').addEventListener('click', applyQuestionsToForm);

  // 초기화
  updatePresetDropdown();
  if (presetData.rememberLastUsed && presetData.lastUsedConfig) {
    applyConfig(presetData.lastUsedConfig);
  }
  // v9: 시퀀스 리스트 렌더링
  renderSequenceList();
}

// === v11: 길이제한 입력값 검증 (인라인 경고) ===
function setupLengthLimitValidation() {
  const lengthInputs = document.querySelectorAll('#tab-length input[type="number"]');
  lengthInputs.forEach(input => {
    input.addEventListener('input', handleLengthLimitChange);
    input.addEventListener('blur', handleLengthLimitBlur);
  });
}

function handleLengthLimitChange(e) {
  const input = e.target;
  const maxValue = parseInt(input.dataset.max);
  const minValue = parseInt(input.dataset.min);
  const currentValue = parseInt(input.value);
  const warningEl = document.querySelector(`.sqai-inline-warning[data-for="${input.id}"]`);

  if (!warningEl) return;

  if (currentValue > maxValue) {
    input.classList.add('over-limit');
    warningEl.textContent = `최대 ${maxValue}자 (자동 조정됨)`;
    warningEl.classList.add('visible');
  } else if (currentValue < minValue && input.value !== '') {
    input.classList.add('over-limit');
    warningEl.textContent = `최소 ${minValue}자 (자동 조정됨)`;
    warningEl.classList.add('visible');
  } else {
    input.classList.remove('over-limit');
    warningEl.classList.remove('visible');
  }
}

function handleLengthLimitBlur(e) {
  const input = e.target;
  const maxValue = parseInt(input.dataset.max);
  const minValue = parseInt(input.dataset.min);
  let currentValue = parseInt(input.value);
  const warningEl = document.querySelector(`.sqai-inline-warning[data-for="${input.id}"]`);

  // 최대치 초과 시 자동 조정
  if (currentValue > maxValue) {
    input.value = maxValue;
    input.classList.remove('over-limit');
    if (warningEl) {
      warningEl.textContent = `${maxValue}자로 조정됨`;
      setTimeout(() => warningEl.classList.remove('visible'), 1500);
    }
  }

  // 최소치 미만 시 자동 조정
  if (currentValue < minValue || isNaN(currentValue)) {
    input.value = minValue;
    input.classList.remove('over-limit');
    if (warningEl) {
      warningEl.textContent = `${minValue}자로 조정됨`;
      setTimeout(() => warningEl.classList.remove('visible'), 1500);
    }
  }
}

// === v12: 시퀀스 리스트 렌더링 (칩 스타일) ===
function renderSequenceList() {
  const container = document.getElementById('sequence-list');
  if (!container) return;

  const sequence = getSequence();

  if (sequence.length === 0) {
    container.innerHTML = `<div class="sqai-sequence-empty">아래에서 문제 유형을 선택하세요</div>`;
  } else {
    container.innerHTML = sequence.map((item, index) =>
      getSequenceItemHTML(item, index, sequence.length)
    ).join('');

    // 삭제 버튼 이벤트 바인딩 (v12: 칩 클래스)
    container.querySelectorAll('.sqai-chip-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        removeSequenceItem(id);
        renderSequenceList();
        markPresetAsModified();
      });
    });
  }

  updateTotalCount();
}

function updateTotalCount() {
  const total = getSequence().length;
  const totalEl = document.getElementById('total-count');
  if (totalEl) {
    totalEl.textContent = total;
  }
}

// === v12: 시퀀스 드래그 앤 드롭 (칩 스타일) ===
let draggedItem = null;
let draggedIndex = -1;

function setupSequenceDragAndDrop() {
  const container = document.getElementById('sequence-list');
  if (!container) return;

  // 이벤트 위임으로 처리
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragleave', handleDragLeave);

  // 터치 이벤트 (모바일)
  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd);
}

function handleDragStart(e) {
  const item = e.target.closest('.sqai-seq-chip');
  if (!item) return;

  draggedItem = item;
  draggedIndex = parseInt(item.dataset.index);
  item.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', item.dataset.id);
}

function handleDragEnd(e) {
  if (draggedItem) {
    draggedItem.classList.remove('dragging');
  }
  document.querySelectorAll('.sqai-seq-chip').forEach(item => {
    item.classList.remove('drag-over');
  });
  draggedItem = null;
  draggedIndex = -1;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const item = e.target.closest('.sqai-seq-chip');
  if (!item || item === draggedItem) return;

  // 드래그 오버 표시
  document.querySelectorAll('.sqai-seq-chip').forEach(i => {
    i.classList.remove('drag-over');
  });
  item.classList.add('drag-over');
}

function handleDragLeave(e) {
  const item = e.target.closest('.sqai-seq-chip');
  if (item) {
    item.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  const item = e.target.closest('.sqai-seq-chip');
  if (!item || item === draggedItem) return;

  const targetIndex = parseInt(item.dataset.index);
  if (draggedIndex !== -1 && targetIndex !== draggedIndex) {
    moveSequenceItem(draggedIndex, targetIndex);
    renderSequenceList();
    markPresetAsModified();
  }

  item.classList.remove('drag-over');
}

// === 터치 드래그 (모바일 - v12 칩 스타일) ===
let touchDraggedItem = null;
let touchStartY = 0;
let touchCurrentY = 0;
let touchClone = null;

function handleTouchStart(e) {
  // v12: 칩 전체가 터치 가능 (핸들 없음)
  const item = e.target.closest('.sqai-seq-chip');
  if (!item || e.target.closest('.sqai-chip-delete')) return;

  e.preventDefault();
  touchDraggedItem = item;
  draggedIndex = parseInt(item.dataset.index);
  touchStartY = e.touches[0].clientY;

  item.classList.add('dragging');

  // 복제본 생성 (드래그 시각화)
  touchClone = item.cloneNode(true);
  touchClone.style.position = 'fixed';
  touchClone.style.zIndex = '10000';
  touchClone.style.opacity = '0.8';
  touchClone.style.pointerEvents = 'none';
  touchClone.style.left = item.getBoundingClientRect().left + 'px';
  touchClone.style.top = item.getBoundingClientRect().top + 'px';
  document.body.appendChild(touchClone);
}

function handleTouchMove(e) {
  if (!touchDraggedItem) return;

  e.preventDefault();
  touchCurrentY = e.touches[0].clientY;
  const touchCurrentX = e.touches[0].clientX;

  // 복제본 위치 업데이트
  if (touchClone) {
    touchClone.style.top = (touchCurrentY - 10) + 'px';
    touchClone.style.left = (touchCurrentX - 30) + 'px';
  }

  // 드롭 타겟 찾기
  const elements = document.elementsFromPoint(touchCurrentX, touchCurrentY);
  const targetItem = elements.find(el => el.classList?.contains('sqai-seq-chip') && el !== touchDraggedItem);

  document.querySelectorAll('.sqai-seq-chip').forEach(item => {
    item.classList.remove('drag-over');
  });

  if (targetItem) {
    targetItem.classList.add('drag-over');
  }
}

function handleTouchEnd(e) {
  if (!touchDraggedItem) return;

  // 복제본 제거
  if (touchClone) {
    touchClone.remove();
    touchClone = null;
  }

  // 드롭 타겟 찾기
  const elements = document.elementsFromPoint(
    e.changedTouches[0].clientX,
    e.changedTouches[0].clientY
  );
  const targetItem = elements.find(el => el.classList?.contains('sqai-seq-chip') && el !== touchDraggedItem);

  if (targetItem) {
    const targetIndex = parseInt(targetItem.dataset.index);
    if (draggedIndex !== -1 && targetIndex !== draggedIndex) {
      moveSequenceItem(draggedIndex, targetIndex);
      renderSequenceList();
      markPresetAsModified();
    }
  }

  touchDraggedItem.classList.remove('dragging');
  document.querySelectorAll('.sqai-seq-chip').forEach(item => {
    item.classList.remove('drag-over');
  });

  touchDraggedItem = null;
  draggedIndex = -1;
}

// === 프리셋(나의 조합) 함수들 ===
let pendingDeleteId = null;
let currentPresetId = null;
let isPresetModified = false;

// 수정됨 표시 함수
function markPresetAsModified() {
  if (!currentPresetId || isPresetModified) return;
  isPresetModified = true;

  const select = document.getElementById('preset-select');
  const option = select.querySelector(`option[value="${currentPresetId}"]`);
  if (option && !option.textContent.endsWith(' *')) {
    option.textContent += ' *';
  }
}

// 수정됨 표시 초기화 (드롭다운 다시 그리기)
function clearPresetModified() {
  if (!isPresetModified) return;
  isPresetModified = false;
  currentPresetId = null;
  updatePresetDropdown();
}

// 모드 전환 함수들
function showComboDefault() {
  document.getElementById('combo-default').style.display = 'flex';
  document.getElementById('combo-save').style.display = 'none';
  document.getElementById('combo-delete').style.display = 'none';
  document.getElementById('preset-name-input').value = '';
  document.getElementById('preset-select').value = '';
  clearPresetModified();
  updateDeleteButtonState();
  pendingDeleteId = null;
}

function showSaveMode() {
  document.getElementById('combo-default').style.display = 'none';
  document.getElementById('combo-save').style.display = 'flex';
  document.getElementById('combo-delete').style.display = 'none';
  document.getElementById('preset-name-input').focus();
}

function showDeleteConfirm() {
  const select = document.getElementById('preset-select');
  const selectedId = select.value;
  if (!selectedId || selectedId === '__save__') return;

  const preset = presetData.presets.find(p => p.id === selectedId);
  if (!preset) return;

  pendingDeleteId = selectedId;
  document.getElementById('combo-delete-name').textContent = `"${preset.name}" 삭제?`;
  document.getElementById('combo-default').style.display = 'none';
  document.getElementById('combo-save').style.display = 'none';
  document.getElementById('combo-delete').style.display = 'flex';
}

function updateDeleteButtonState() {
  const select = document.getElementById('preset-select');
  const deleteBtn = document.getElementById('preset-delete-btn');
  const selectedId = select.value;
  const isValidPreset = selectedId && selectedId !== '__save__';
  deleteBtn.disabled = !isValidPreset;
}

// 저장 확인
function handlePresetSaveConfirm() {
  const nameInput = document.getElementById('preset-name-input');
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  const newPreset = {
    id: `preset_${Date.now()}`,
    name: name,
    config: getCurrentConfig()
  };

  presetData.presets.push(newPreset);
  savePresetData();

  // 상태 초기화 후 드롭다운 업데이트
  currentPresetId = newPreset.id;
  isPresetModified = false;
  updatePresetDropdown();
  document.getElementById('preset-select').value = newPreset.id;

  // 모드 전환 (showComboDefault 대신 직접 처리 - 상태 유지를 위해)
  document.getElementById('combo-default').style.display = 'flex';
  document.getElementById('combo-save').style.display = 'none';
  document.getElementById('combo-delete').style.display = 'none';
  document.getElementById('preset-name-input').value = '';
  updateDeleteButtonState();
  pendingDeleteId = null;

  addMessage(`"${name}" 조합이 저장되었습니다.`, false, false, 'success');
}

// 삭제 확인
function handlePresetDeleteConfirm() {
  if (!pendingDeleteId) return;

  const preset = presetData.presets.find(p => p.id === pendingDeleteId);
  if (!preset) return;

  const presetName = preset.name;
  updatePresetData({ presets: presetData.presets.filter(p => p.id !== pendingDeleteId) });
  savePresetData();
  updatePresetDropdown();
  showComboDefault();
  addMessage(`"${presetName}" 조합이 삭제되었습니다.`, false, false, 'info');
}

// 드롭다운 선택 처리
function handlePresetSelect(e) {
  const selectedId = e.target.value;

  // 저장 옵션 선택
  if (selectedId === '__save__') {
    showSaveMode();
    return;
  }

  // 삭제 버튼 상태 업데이트
  updateDeleteButtonState();

  // 선택 해제 시
  if (!selectedId) {
    currentPresetId = null;
    isPresetModified = false;
    return;
  }

  // 프리셋 적용
  const preset = presetData.presets.find(p => p.id === selectedId);
  if (preset) {
    // 이전 수정됨 표시 초기화 (드롭다운 다시 그리기)
    if (isPresetModified) {
      updatePresetDropdown();
    }
    currentPresetId = selectedId;
    isPresetModified = false;
    document.getElementById('preset-select').value = selectedId;
    applyConfig(preset.config);
    renderSequenceList();  // v9: 시퀀스 리스트 렌더링
    addMessage(`"${preset.name}" 조합이 적용되었습니다.`, false, false, 'success');
  }
}

// 드롭다운 업데이트
function updatePresetDropdown() {
  const select = document.getElementById('preset-select');
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">불러오기...</option>';

  presetData.presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    select.appendChild(option);
  });

  // 구분선 역할 (disabled option)
  if (presetData.presets.length > 0) {
    const divider = document.createElement('option');
    divider.disabled = true;
    divider.textContent = '──────────';
    select.appendChild(divider);
  }

  // 저장 옵션
  const saveOption = document.createElement('option');
  saveOption.value = '__save__';
  saveOption.textContent = '➕ 현재 설정 저장...';
  saveOption.className = 'sqai-combo-save-option';
  select.appendChild(saveOption);

  // 이전 선택값 복원 (유효한 경우)
  if (currentValue && currentValue !== '__save__' && presetData.presets.find(p => p.id === currentValue)) {
    select.value = currentValue;
  }

  updateDeleteButtonState();
}

// === v10: 파일 드래그앤드롭 설정 ===
function setupFileDragAndDrop() {
  const dropZone = document.getElementById('sqai-file-drop-zone');
  if (!dropZone) return;

  // 드래그 진입
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });

  // 드래그 오버
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });

  // 드래그 떠남
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 자식 요소로 이동할 때는 무시
    if (e.relatedTarget && dropZone.contains(e.relatedTarget)) return;
    dropZone.classList.remove('drag-over');
  });

  // 드롭
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processDroppedFile(files[0]);
    }
  });
}

// === 드롭된 파일 처리 ===
async function processDroppedFile(file) {
  // 허용된 파일 형식 확인
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    addMessage('PDF 또는 이미지 파일만 업로드 가능합니다.', false, false, 'error');
    return;
  }

  // 파일 크기 확인
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    addMessage('파일 크기는 50MB 이하여야 합니다.', false, false, 'error');
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    state.uploadedFile = {
      data: base64,
      mimeType: getMimeType(file)
    };
    state.uploadedFileName = file.name;

    const fileInfoEl = document.getElementById('sqai-file-info');
    const fileNameEl = document.getElementById('sqai-file-name');

    fileInfoEl.style.display = 'flex';
    fileNameEl.textContent = file.name;

    document.getElementById('sqai-file-upload-btn').classList.add('has-file');
    document.getElementById('topic-input').placeholder = '추가 지시 (예: 쉬운 문제로)';

    addMessage(`"${file.name}" 파일이 업로드되었습니다.`, false, false, 'success');
  } catch (error) {
    addMessage(`파일 업로드 실패: ${error.message}`, false, false, 'error');
  }
}

// === 파일 업로드 (클릭) ===
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    addMessage('파일 크기는 50MB 이하여야 합니다.', false, false, 'error');
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    state.uploadedFile = {
      data: base64,
      mimeType: getMimeType(file)
    };
    state.uploadedFileName = file.name;

    const fileInfoEl = document.getElementById('sqai-file-info');
    const fileNameEl = document.getElementById('sqai-file-name');

    fileInfoEl.style.display = 'flex';
    fileNameEl.textContent = file.name;

    document.getElementById('sqai-file-upload-btn').classList.add('has-file');
    document.getElementById('topic-input').placeholder = '추가 지시 (예: 쉬운 문제로)';

    addMessage(`"${file.name}" 파일이 업로드되었습니다.`, false, false, 'success');
  } catch (error) {
    addMessage(`파일 업로드 실패: ${error.message}`, false, false, 'error');
  }
}

function removeFile() {
  state.uploadedFile = null;
  state.uploadedFileName = null;
  document.getElementById('sqai-file-input').value = '';
  document.getElementById('sqai-file-info').style.display = 'none';
  document.getElementById('sqai-file-upload-btn').classList.remove('has-file');
  document.getElementById('topic-input').placeholder = '주제 입력 (예: 광합성, 조선시대)';
  addMessage('파일이 제거되었습니다.', false, false, 'info');
}

// === 설정 관련 ===
function toggleSettings() {
  state.showSettings = !state.showSettings;
  const settingsPanel = document.getElementById('settings-panel');
  const chatBody = document.getElementById('chat-body');

  if (state.showSettings) {
    settingsPanel.style.display = 'flex';
    chatBody.style.display = 'none';
    updateSettingsUI();
  } else {
    settingsPanel.style.display = 'none';
    chatBody.style.display = 'flex';
  }
}

function updateSettingsUI() {
  const s = settings;

  // 탭 1: 기본설정
  // v18: API 키 로드
  document.getElementById('setting-api-key').value = getApiKey();
  document.getElementById('setting-role').value = s.general.role;

  // 탭 2: 학년별 - 초등
  const elem = s.schoolLevel.elementary;
  document.getElementById('setting-elem-vocab-desc').value = elem.vocabulary.description;
  document.getElementById('setting-elem-style-rec').value = arrayToText(elem.questionStyle.recommended);
  document.getElementById('setting-elem-style-proh').value = arrayToText(elem.questionStyle.prohibited);
  document.getElementById('setting-elem-tone-rec').value = arrayToText(elem.explanationTone.recommended);

  // 탭 2: 학년별 - 중등
  const mid = s.schoolLevel.middle;
  document.getElementById('setting-mid-vocab-desc').value = mid.vocabulary.description;
  document.getElementById('setting-mid-style-rec').value = arrayToText(mid.questionStyle.recommended);
  document.getElementById('setting-mid-tone-rec').value = arrayToText(mid.explanationTone.recommended);

  // 탭 3: 길이제한
  document.getElementById('setting-len-question').value = s.lengthLimits.question.value;
  document.getElementById('setting-len-explanation').value = s.lengthLimits.explanation.value;
  document.getElementById('setting-len-option').value = s.lengthLimits.option.value;
  document.getElementById('setting-len-short').value = s.lengthLimits.shortAnswer.value;
  document.getElementById('setting-len-initial').value = s.lengthLimits.initialAnswer.value;
  document.getElementById('setting-len-essay').value = s.lengthLimits.essayAnswer.value;

  // 탭 4: 출제규칙
  document.getElementById('setting-question-principles').value = arrayToText(s.questionPrinciples.general, '\n');
  document.getElementById('setting-difficulty-desc').value = s.questionPrinciples.difficulty.description;
  document.getElementById('setting-difficulty-rules').value = arrayToText(s.questionPrinciples.difficulty.rules, '\n');
  document.getElementById('setting-choice-wrong').value = arrayToText(s.choicePrinciples.wrongAnswerPolicy, '\n');
  document.getElementById('setting-explanation-principles').value = arrayToText(s.explanationPrinciples.structure, '\n');

  // 탭 5: 금지사항
  document.getElementById('setting-restrict-copyright').value = arrayToText(s.restrictions.copyright, '\n');
  document.getElementById('setting-restrict-privacy').value = arrayToText(s.restrictions.privacy, '\n');
  document.getElementById('setting-restrict-sensitivity').value = arrayToText(s.restrictions.sensitivity, '\n');
  document.getElementById('setting-similar-unit').checked = s.similarAnswerRules.unitVariation.enabled;
  document.getElementById('setting-similar-synonym').checked = s.similarAnswerRules.synonymVariation.enabled;

  // 기타 설정
  document.getElementById('setting-remember-last').checked = presetData.rememberLastUsed;
}

function handleSaveSettings() {
  const s = settings;

  // 탭 1: 기본설정
  // v18: API 키 저장
  const apiKeyInput = document.getElementById('setting-api-key').value.trim();
  saveApiKey(apiKeyInput);

  s.general.role = document.getElementById('setting-role').value;

  // 탭 2: 학년별 - 초등
  s.schoolLevel.elementary.vocabulary.description = document.getElementById('setting-elem-vocab-desc').value;
  s.schoolLevel.elementary.questionStyle.recommended = textToArray(document.getElementById('setting-elem-style-rec').value);
  s.schoolLevel.elementary.questionStyle.prohibited = textToArray(document.getElementById('setting-elem-style-proh').value);
  s.schoolLevel.elementary.explanationTone.recommended = textToArray(document.getElementById('setting-elem-tone-rec').value);

  // 탭 2: 학년별 - 중등
  s.schoolLevel.middle.vocabulary.description = document.getElementById('setting-mid-vocab-desc').value;
  s.schoolLevel.middle.questionStyle.recommended = textToArray(document.getElementById('setting-mid-style-rec').value);
  s.schoolLevel.middle.explanationTone.recommended = textToArray(document.getElementById('setting-mid-tone-rec').value);

  // 탭 3: 길이제한 (시스템 최소/최대치 적용)
  s.lengthLimits.question.value = Math.max(50, Math.min(parseInt(document.getElementById('setting-len-question').value) || 100, 100));
  s.lengthLimits.explanation.value = Math.max(50, Math.min(parseInt(document.getElementById('setting-len-explanation').value) || 150, 150));
  s.lengthLimits.option.value = Math.max(20, Math.min(parseInt(document.getElementById('setting-len-option').value) || 50, 50));
  s.lengthLimits.shortAnswer.value = Math.max(5, Math.min(parseInt(document.getElementById('setting-len-short').value) || 20, 20));
  s.lengthLimits.initialAnswer.value = Math.max(5, Math.min(parseInt(document.getElementById('setting-len-initial').value) || 15, 15));
  s.lengthLimits.essayAnswer.value = Math.max(50, Math.min(parseInt(document.getElementById('setting-len-essay').value) || 100, 100));

  // 탭 4: 출제규칙
  s.questionPrinciples.general = textToArray(document.getElementById('setting-question-principles').value, '\n');
  s.questionPrinciples.difficulty.description = document.getElementById('setting-difficulty-desc').value;
  s.questionPrinciples.difficulty.rules = textToArray(document.getElementById('setting-difficulty-rules').value, '\n');
  s.choicePrinciples.wrongAnswerPolicy = textToArray(document.getElementById('setting-choice-wrong').value, '\n');
  s.explanationPrinciples.structure = textToArray(document.getElementById('setting-explanation-principles').value, '\n');

  // 탭 5: 금지사항
  s.restrictions.copyright = textToArray(document.getElementById('setting-restrict-copyright').value, '\n');
  s.restrictions.privacy = textToArray(document.getElementById('setting-restrict-privacy').value, '\n');
  s.restrictions.sensitivity = textToArray(document.getElementById('setting-restrict-sensitivity').value, '\n');
  s.similarAnswerRules.unitVariation.enabled = document.getElementById('setting-similar-unit').checked;
  s.similarAnswerRules.synonymVariation.enabled = document.getElementById('setting-similar-synonym').checked;

  // 기타 설정
  updatePresetData({ rememberLastUsed: document.getElementById('setting-remember-last').checked });
  savePresetData();

  saveSettings();
  toggleSettings();
  addMessage('설정이 저장되었습니다.', false, false, 'success');
}

function handleResetSettings() {
  if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
    resetSettings();
    updateSettingsUI();
    addMessage('설정이 초기화되었습니다.', false, false, 'info');
  }
}

// === 드래그 앤 드롭 ===
function setupDragAndDrop() {
  const header = document.getElementById('chatbot-header');
  const chatbot = document.getElementById('samquiz-ai-chatbot');

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.sqai-header-btn')) return;
    isDragging = true;
    const rect = chatbot.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    header.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const chatWindow = document.getElementById('chatbot-window');
    const windowRect = chatWindow.getBoundingClientRect();
    const containerRect = chatbot.getBoundingClientRect();
    const headerHeight = 44;

    const offsetY = windowRect.top - containerRect.top;
    const offsetX = windowRect.left - containerRect.left;

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    const newWindowTop = newY + offsetY;
    const newWindowLeft = newX + offsetX;

    if (newWindowTop < 0) newY = -offsetY;
    if (newWindowTop > window.innerHeight - headerHeight) newY = window.innerHeight - headerHeight - offsetY;
    if (newWindowLeft < 0) newX = -offsetX;
    if (newWindowLeft > window.innerWidth - windowRect.width) newX = window.innerWidth - windowRect.width - offsetX;

    chatbot.style.left = newX + 'px';
    chatbot.style.top = newY + 'px';
    chatbot.style.right = 'auto';
    chatbot.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.getElementById('chatbot-header').style.cursor = 'move';
    }
  });
}

function ensureWindowInView() {
  const chatbot = document.getElementById('samquiz-ai-chatbot');
  const chatWindow = document.getElementById('chatbot-window');
  const containerRect = chatbot.getBoundingClientRect();
  const windowRect = chatWindow.getBoundingClientRect();
  const headerHeight = 44;

  const offsetY = windowRect.top - containerRect.top;
  const offsetX = windowRect.left - containerRect.left;

  let needsUpdate = false;
  let newX = containerRect.left;
  let newY = containerRect.top;

  if (windowRect.left < 0) { newX = -offsetX; needsUpdate = true; }
  if (windowRect.left > window.innerWidth - windowRect.width) { newX = window.innerWidth - windowRect.width - offsetX; needsUpdate = true; }
  if (windowRect.top < 0) { newY = -offsetY; needsUpdate = true; }
  if (windowRect.top > window.innerHeight - headerHeight) { newY = window.innerHeight - headerHeight - offsetY; needsUpdate = true; }

  if (needsUpdate) {
    chatbot.style.left = newX + 'px';
    chatbot.style.top = newY + 'px';
    chatbot.style.right = 'auto';
    chatbot.style.bottom = 'auto';
  }
}

// === 챗봇 토글 ===
function toggleChatbot() {
  state.isOpen = !state.isOpen;
  const chatWindow = document.getElementById('chatbot-window');
  const chatBody = document.getElementById('chat-body');

  chatWindow.style.display = state.isOpen ? 'flex' : 'none';
  document.getElementById('chatbot-button').style.display = state.isOpen ? 'none' : 'flex';

  if (state.isOpen) {
    chatBody.style.display = 'flex';
    updateMinimizeIcon(false);
    ensureWindowInView();
  }
}

function minimizeChatbot() {
  const chatbot = document.getElementById('samquiz-ai-chatbot');
  const chatWindow = document.getElementById('chatbot-window');
  const chatBody = document.getElementById('chat-body');
  const isMinimized = chatBody.style.display === 'none';

  const windowRect = chatWindow.getBoundingClientRect();
  const currentWindowTop = windowRect.top;

  if (isMinimized) {
    chatBody.style.display = 'flex';
    chatWindow.style.height = windowExpandedHeight;
  } else {
    chatBody.style.display = 'none';
    chatWindow.style.height = 'auto';
  }

  const newWindowRect = chatWindow.getBoundingClientRect();
  const newContainerRect = chatbot.getBoundingClientRect();
  const newOffsetY = newWindowRect.top - newContainerRect.top;
  const newContainerTop = currentWindowTop - newOffsetY;

  chatbot.style.top = newContainerTop + 'px';
  chatbot.style.bottom = 'auto';

  ensureWindowInView();
  updateMinimizeIcon(isMinimized);
}

function updateMinimizeIcon(isMinimized) {
  const btn = document.getElementById('minimize-chatbot');
  btn.querySelector('svg').style.transform = isMinimized ? 'rotate(180deg)' : 'rotate(0deg)';
  btn.querySelector('svg').style.transition = 'transform 0.2s';
}

// === v9: 메시지 추가 (타입 지원) ===
export function addMessage(content, isUser = false, isHtml = false, type = null) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');

  // 클래스 설정
  let className = 'sqai-msg';
  if (isUser) {
    className += ' sqai-msg-user';
  } else if (type) {
    className += ` sqai-msg-${type}`;
  } else {
    className += ' sqai-msg-ai';
  }
  div.className = className;

  // 아이콘 추가 (타입이 있는 경우)
  if (type && MESSAGE_ICONS[type] && !isHtml) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'sqai-msg-icon';
    iconSpan.innerHTML = MESSAGE_ICONS[type];
    div.appendChild(iconSpan);
    const textSpan = document.createElement('span');
    textSpan.textContent = content;
    div.appendChild(textSpan);
  } else if (isHtml) {
    div.innerHTML = content;
  } else {
    div.textContent = content;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function showLoading(message = '문제 생성 중...') {
  return addMessage(getLoadingHTML(message), false, true);
}

function updateLoadingMessage(loadingEl, message) {
  if (loadingEl) {
    const textEl = loadingEl.querySelector('.sqai-loading-text');
    if (textEl) textEl.textContent = message;
  }
}

// === v13: 버튼 영역 상태 전환 ===
function showGenerateArea() {
  document.getElementById('generate-area').style.display = 'block';
  document.getElementById('result-area').style.display = 'none';
}

function showResultArea() {
  document.getElementById('generate-area').style.display = 'none';
  document.getElementById('result-area').style.display = 'flex';
}

// === v13: 적용 버튼 상태 업데이트 ===
function updateApplyButtonState() {
  const applyBtn = document.getElementById('apply-btn');
  if (!applyBtn || !state.currentQuestions) return;

  const { questions } = state.currentQuestions;
  const activeCount = questions.filter(q => !q._excluded).length;

  if (activeCount === 0) {
    applyBtn.disabled = true;
    applyBtn.style.opacity = '0.5';
  } else {
    applyBtn.disabled = false;
    applyBtn.style.opacity = '1';
  }
}

// === v13: 전체 다시 생성 ===
async function handleRegenerateAll() {
  if (state.isGenerating || !state.currentTopic) return;

  // v17: 현재 입력값이 있으면 그대로 사용, 없으면 파일 미첨부시에만 이전 topic 복원
  const currentInput = document.getElementById('topic-input').value.trim();
  if (!currentInput && !state.uploadedFile) {
    document.getElementById('topic-input').value = state.currentTopic;
  }

  // v13: 미리보기 ID 초기화 (새 미리보기가 생성됨)
  currentPreviewId = null;
  showGenerateArea();
  handleGenerate();
}

// === v13: 개별 문항 재생성 ===
async function handleRegenerate(index) {
  if (state.isRegenerating || !state.currentQuestions || !currentPreviewId) return;

  const { questions } = state.currentQuestions;
  const question = questions[index];
  if (!question) return;

  const type = question._type;
  const topic = state.currentTopic || '이전 주제';
  const level = document.querySelector('#level-segment .sqai-seg-btn.active').dataset.value;

  // 버튼 로딩 상태 - v13: 현재 미리보기 컨테이너 내에서만 찾기
  const previewItem = document.querySelector(`#${currentPreviewId} .sqai-preview-item[data-index="${index}"]`);
  const regenBtn = previewItem?.querySelector('.sqai-preview-action-btn.regen');
  if (regenBtn) {
    regenBtn.classList.add('loading');
  }

  state.isRegenerating = true;

  try {
    const newQuestions = await callGeminiAPI({
      topic,
      count: 1,
      quizType: type,
      level
    });

    if (newQuestions && newQuestions[0]) {
      newQuestions[0]._type = type;
      questions[index] = newQuestions[0];
      updateQuestionPreviewItem(index);
      addMessage(`${index + 1}번 문제가 재생성되었습니다.`, false, false, 'success');
    }
  } catch (error) {
    addMessage(`재생성 오류: ${error.message}`, false, false, 'error');
  } finally {
    state.isRegenerating = false;
    if (regenBtn) {
      regenBtn.classList.remove('loading');
    }
  }
}

// === v13: 문항 제외 토글 ===
function handleExclude(index) {
  if (!state.currentQuestions || !currentPreviewId) return;

  const { questions } = state.currentQuestions;
  const question = questions[index];
  if (!question) return;

  question._excluded = !question._excluded;

  // v13: 현재 미리보기 컨테이너 내에서만 찾기
  const previewItem = document.querySelector(`#${currentPreviewId} .sqai-preview-item[data-index="${index}"]`);
  if (previewItem) {
    if (question._excluded) {
      previewItem.classList.add('excluded');
    } else {
      previewItem.classList.remove('excluded');
    }
  }

  updateApplyButtonState();
}

// === v13: 개별 미리보기 아이템 업데이트 ===
function updateQuestionPreviewItem(index) {
  if (!state.currentQuestions || !currentPreviewId) return;

  const { questions, type } = state.currentQuestions;
  const q = questions[index];
  if (!q) return;

  // v13: 현재 미리보기 컨테이너 내에서만 찾기
  const previewItem = document.querySelector(`#${currentPreviewId} .sqai-preview-item[data-index="${index}"]`);
  if (!previewItem) return;

  const qType = q._type || type;
  const typeLabel = type === 'mixed' ? `<span class="sqai-preview-type">[${TYPE_NAMES[qType]}]</span> ` : '';

  let contentHTML = `
    <div class="sqai-preview-item-header">
      <div class="sqai-preview-title">${index + 1}. ${typeLabel}${q.question.substring(0, 55)}${q.question.length > 55 ? '...' : ''}</div>
      <div class="sqai-preview-actions">
        <button class="sqai-preview-action-btn regen" data-index="${index}" title="이 문항 재생성">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button class="sqai-preview-action-btn exclude" data-index="${index}" title="이 문항 제외">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>`;

  if (qType === 'choice' && q.options) {
    q.options.forEach((opt, idx) => {
      const isCorrect = idx === q.answer;
      contentHTML += `<div class="sqai-preview-option ${isCorrect ? 'correct' : ''}">
        ${isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        <span>${idx + 1}) ${opt}</span>
      </div>`;
    });
  } else if (qType === 'ox' || qType === 'short' || qType === 'initial') {
    contentHTML += `<div class="sqai-preview-option correct">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      <span>정답: ${q.answer}</span>
    </div>`;
    if (q.similarAnswers && q.similarAnswers.length > 0) {
      contentHTML += `<div class="sqai-preview-option">
        <span>유사정답: ${q.similarAnswers.join(', ')}</span>
      </div>`;
    }
  } else if (qType === 'order' && q.items) {
    contentHTML += `<div class="sqai-preview-option correct">
      <span>순서: ${q.correctOrder.map(idx => q.items[idx]).join(' → ')}</span>
    </div>`;
  } else if (qType === 'essay') {
    contentHTML += `<div class="sqai-preview-option">
      <span>모범답안: ${(q.modelAnswer || '').substring(0, 50)}${(q.modelAnswer || '').length > 50 ? '...' : ''}</span>
    </div>`;
  }

  previewItem.innerHTML = contentHTML;

  // 이벤트 리스너 다시 연결
  const regenBtn = previewItem.querySelector('.sqai-preview-action-btn.regen');
  const excludeBtn = previewItem.querySelector('.sqai-preview-action-btn.exclude');

  if (regenBtn) {
    regenBtn.addEventListener('click', () => handleRegenerate(index));
  }
  if (excludeBtn) {
    excludeBtn.addEventListener('click', () => handleExclude(index));
  }
}

// === v15/v16: 문제 생성 (폼 타입에 따라 분기) ===
async function handleGenerate() {
  if (state.isGenerating) return;

  // v15: 폼 타입에 따라 분기
  if (currentFormType === FORM_TYPES.letterReorder) {
    await handleLetterReorderGenerate();
    return;
  }

  // v16: 가로세로퍼즐
  if (currentFormType === FORM_TYPES.crossword) {
    await handleCrosswordGenerate();
    return;
  }

  // 기존 standard 모드 로직
  const topic = document.getElementById('topic-input').value.trim();
  const level = document.querySelector('#level-segment .sqai-seg-btn.active').dataset.value;

  // 시퀀스 가져오기
  const sequence = getSequence();

  if (sequence.length === 0) {
    addMessage('최소 1개 이상의 문제를 추가해주세요.', false, false, 'warning');
    return;
  }

  if (!topic && !state.uploadedFile) {
    addMessage('주제를 입력하거나 파일을 업로드해주세요.', false, false, 'warning');
    return;
  }

  state.isGenerating = true;
  const button = document.getElementById('generate-button');
  const buttonSpan = button.querySelector('span');
  button.disabled = true;
  button.style.opacity = '0.6';
  if (buttonSpan) buttonSpan.textContent = '생성 중...';

  // 생성 요청 메시지 (유형별 개수 표시)
  const totalCount = sequence.length;
  const typeCounts = {};
  sequence.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });
  const typeSummary = Object.entries(typeCounts)
    .map(([type, count]) => `${TYPE_NAMES[type]} ${count}개`)
    .join(' + ');
  const fileInfo = state.uploadedFile ? ` (${state.uploadedFileName} 분석)` : '';
  addMessage(`${LEVEL_NAMES[level]} ${typeSummary} = 총 ${totalCount}개 생성${fileInfo}`, true);

  const loadingMsg = showLoading('전체 문제 생성 중...');

  // 마지막 사용 설정 저장
  saveLastUsedConfig();

  try {
    // v14: 단일 API 호출로 모든 문제 생성 (정답 중복 방지)
    const questions = await callGeminiAPI({
      topic: topic || '첨부 파일 내용 기반',
      quizType: 'mixed',
      sequence: sequence,
      level
    });

    loadingMsg.remove();

    if (questions && questions.length > 0) {
      // v14: 주제 저장 (재생성용)
      state.currentTopic = topic || '첨부 파일 내용 기반';
      state.currentQuestions = {
        questions: questions,
        type: 'mixed',
        byType: Object.keys(typeCounts).reduce((acc, type) => {
          acc[type] = questions.filter(q => q._type === type);
          return acc;
        }, {})
      };

      addMessage(`${questions.length}개의 문제가 생성되었습니다!`, false, false, 'success');
      showQuestionsPreview(questions, 'mixed');
      document.getElementById('topic-input').value = '';
      // 하단 버튼 영역 전환
      showResultArea();
    } else {
      addMessage('문제 생성에 실패했습니다.', false, false, 'error');
    }

  } catch (error) {
    loadingMsg.remove();
    addMessage(`오류: ${error.message}`, false, false, 'error');
    console.error('Generation error:', error);
  } finally {
    state.isGenerating = false;
    button.disabled = false;
    button.style.opacity = '1';
    if (buttonSpan) buttonSpan.textContent = '문제 생성하기';
  }
}

// === v15: 글자순서바꾸기 생성 ===
async function handleLetterReorderGenerate() {
  const topic = document.getElementById('topic-input').value.trim();
  const level = document.querySelector('#level-segment .sqai-seg-btn.active').dataset.value;
  const countBtn = document.querySelector('.sqai-count-btn.active');
  const wordCount = countBtn ? parseInt(countBtn.dataset.count) : LETTER_REORDER_CONFIG.defaultWords;

  if (!topic && !state.uploadedFile) {
    addMessage('주제를 입력하거나 파일을 업로드해주세요.', false, false, 'warning');
    return;
  }

  state.isGenerating = true;
  const button = document.getElementById('generate-button');
  const buttonSpan = button.querySelector('span');
  button.disabled = true;
  button.style.opacity = '0.6';
  if (buttonSpan) buttonSpan.textContent = '생성 중...';

  const fileInfo = state.uploadedFile ? ` (${state.uploadedFileName} 분석)` : '';
  addMessage(`${LEVEL_NAMES[level]} 단어 ${wordCount}개 생성${fileInfo}`, true);

  const loadingMsg = showLoading('단어 생성 중...');

  try {
    const words = await callGeminiAPIForLetterReorder({
      topic: topic || '첨부 파일 내용 기반',
      count: wordCount,
      level
    });

    loadingMsg.remove();

    if (words && words.length > 0) {
      letterReorderData.words = words;
      state.currentTopic = topic || '첨부 파일 내용 기반';

      addMessage(`${words.length}개의 단어가 생성되었습니다!`, false, false, 'success');
      showLetterReorderPreview(words);
      document.getElementById('topic-input').value = '';
      showResultArea();
    } else {
      addMessage('단어 생성에 실패했습니다.', false, false, 'error');
    }

  } catch (error) {
    loadingMsg.remove();
    addMessage(`오류: ${error.message}`, false, false, 'error');
    console.error('Letter reorder generation error:', error);
  } finally {
    state.isGenerating = false;
    button.disabled = false;
    button.style.opacity = '1';
    if (buttonSpan) buttonSpan.textContent = '단어 생성하기';
  }
}

// === v15: 글자순서바꾸기 미리보기 ===
function showLetterReorderPreview(words) {
  const timestamp = Date.now();
  currentPreviewId = `sqai-letter-preview-${timestamp}`;

  const previewHTML = getLetterReorderPreviewHTML(words);
  const container = document.getElementById('chat-messages');
  container.insertAdjacentHTML('beforeend', previewHTML);

  // 미리보기 액션 버튼 이벤트
  const previewContainer = container.lastElementChild;

  previewContainer.querySelectorAll('.sqai-regen-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.index);
      await handleLetterReorderRegenerate(idx);
    });
  });

  previewContainer.querySelectorAll('.sqai-exclude-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      handleLetterReorderExclude(idx, previewContainer);
    });
  });

  container.scrollTop = container.scrollHeight;
}

// === v15: 개별 단어 재생성 ===
async function handleLetterReorderRegenerate(index) {
  const level = document.querySelector('#level-segment .sqai-seg-btn.active').dataset.value;

  const loadingMsg = showLoading('단어 재생성 중...');

  try {
    const words = await callGeminiAPIForLetterReorder({
      topic: state.currentTopic,
      count: 1,
      level
    });

    loadingMsg.remove();

    if (words && words.length > 0) {
      letterReorderData.words[index] = words[0];
      updateLetterReorderPreviewItem(index);
      addMessage('단어가 재생성되었습니다.', false, false, 'success');
    }
  } catch (error) {
    loadingMsg.remove();
    addMessage(`재생성 오류: ${error.message}`, false, false, 'error');
  }
}

// === v15: 단어 제외 토글 ===
function handleLetterReorderExclude(index, previewContainer) {
  const item = letterReorderData.words[index];
  item._excluded = !item._excluded;

  const previewItem = previewContainer.querySelector(`[data-index="${index}"]`);
  if (previewItem) {
    previewItem.classList.toggle('excluded', item._excluded);
  }

  // 적용 버튼 상태 업데이트
  const activeCount = letterReorderData.words.filter(w => !w._excluded).length;
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    applyBtn.disabled = activeCount === 0;
    applyBtn.style.opacity = activeCount === 0 ? '0.5' : '1';
  }
}

// === v15: 미리보기 아이템 업데이트 ===
function updateLetterReorderPreviewItem(index) {
  const item = letterReorderData.words[index];
  const previewItem = document.querySelector(`.sqai-word-preview-item[data-index="${index}"]`);
  if (previewItem) {
    const wordEl = previewItem.querySelector('.sqai-word-preview-word');
    const hintEl = previewItem.querySelector('.sqai-word-preview-hint');
    if (wordEl) wordEl.textContent = item.word;
    if (hintEl) hintEl.textContent = item.hint;
  }
}

// === v15: 글자순서바꾸기 폼에 적용 ===
async function applyLetterReorderWords() {
  // 제외되지 않은 단어만 필터링
  const activeWords = letterReorderData.words.filter(w => !w._excluded);

  if (activeWords.length === 0) {
    addMessage('적용할 단어가 없습니다. (모두 제외됨)', false, false, 'warning');
    return;
  }

  // 적용 버튼 비활성화
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    applyBtn.disabled = true;
    const applySpan = applyBtn.querySelector('span');
    if (applySpan) applySpan.textContent = '적용 중...';
    applyBtn.style.opacity = '0.6';
  }

  state.isApplying = true;
  addMessage(`${activeWords.length}개의 단어를 폼에 입력합니다...`, false, false, 'info');
  const loadingMsg = showLoading('폼에 입력 중...');

  try {
    await applyLetterReorderToForm(activeWords);
    loadingMsg.remove();
    addMessage('모든 단어가 폼에 적용되었습니다!', false, false, 'success');

    // 초기 상태로 복귀
    letterReorderData.words = [];
    showGenerateArea();

  } catch (error) {
    loadingMsg.remove();
    addMessage(`폼 적용 중 오류: ${error.message}`, false, false, 'error');
    console.error('Apply letterReorder error:', error);
  } finally {
    state.isApplying = false;
    if (applyBtn) {
      applyBtn.disabled = false;
      const applySpan = applyBtn.querySelector('span');
      if (applySpan) applySpan.textContent = '폼에 적용하기';
      applyBtn.style.opacity = '1';
    }
  }
}

// === v16: 가로세로퍼즐 생성 ===
async function handleCrosswordGenerate() {
  const topic = document.getElementById('topic-input').value.trim();
  const level = document.querySelector('#level-segment .sqai-seg-btn.active').dataset.value;
  const countBtn = document.querySelector('.sqai-count-btn.active');
  const wordCount = countBtn ? parseInt(countBtn.dataset.count) : CROSSWORD_CONFIG.defaultWords;

  if (!topic && !state.uploadedFile) {
    addMessage('주제를 입력하거나 파일을 업로드해주세요.', false, false, 'warning');
    return;
  }

  state.isGenerating = true;
  const button = document.getElementById('generate-button');
  const buttonSpan = button.querySelector('span');
  button.disabled = true;
  button.style.opacity = '0.6';
  if (buttonSpan) buttonSpan.textContent = '생성 중...';

  const fileInfo = state.uploadedFile ? ` (${state.uploadedFileName} 분석)` : '';
  addMessage(`${LEVEL_NAMES[level]} 단어 ${wordCount}개로 퍼즐 생성${fileInfo}`, true);

  const loadingMsg = showLoading('퍼즐 생성 중...');

  try {
    const result = await callGeminiAPIForCrossword({
      topic: topic || '첨부 파일 내용 기반',
      count: wordCount,
      level
    });

    loadingMsg.remove();

    if (result && result.placedWords && result.placedWords.length > 0) {
      crosswordData = result;
      crosswordData.wordCount = wordCount;
      state.currentTopic = topic || '첨부 파일 내용 기반';

      addMessage(`${result.placedWords.length}개의 단어로 퍼즐이 생성되었습니다!`, false, false, 'success');
      showCrosswordPreview(result);
      document.getElementById('topic-input').value = '';
      showResultArea();
    } else {
      addMessage('퍼즐 생성에 실패했습니다.', false, false, 'error');
    }

  } catch (error) {
    loadingMsg.remove();
    addMessage(`오류: ${error.message}`, false, false, 'error');
    console.error('Crossword generation error:', error);
  } finally {
    state.isGenerating = false;
    button.disabled = false;
    button.style.opacity = '1';
    if (buttonSpan) buttonSpan.textContent = '퍼즐 생성하기';
  }
}

// === v16: 가로세로퍼즐 미리보기 ===
function showCrosswordPreview(data) {
  const timestamp = Date.now();
  currentPreviewId = `sqai-crossword-preview-${timestamp}`;

  const previewHTML = getCrosswordPreviewHTML(data);
  const container = document.getElementById('chat-messages');
  container.insertAdjacentHTML('beforeend', previewHTML);

  container.scrollTop = container.scrollHeight;
}

// === v16: 가로세로퍼즐 폼에 적용 ===
async function applyCrosswordWords() {
  if (crosswordData.placedWords.length === 0) {
    addMessage('적용할 퍼즐이 없습니다.', false, false, 'warning');
    return;
  }

  // 적용 버튼 비활성화
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    applyBtn.disabled = true;
    const applySpan = applyBtn.querySelector('span');
    if (applySpan) applySpan.textContent = '적용 중...';
    applyBtn.style.opacity = '0.6';
  }

  state.isApplying = true;
  addMessage('퍼즐을 폼에 입력합니다...', false, false, 'info');
  const loadingMsg = showLoading('폼에 입력 중...');

  try {
    await applyCrosswordToForm(crosswordData);
    loadingMsg.remove();
    addMessage('퍼즐이 폼에 적용되었습니다!', false, false, 'success');

    // 초기 상태로 복귀
    crosswordData = { grid: [], hints: { horizontal: [], vertical: [] }, placedWords: [], wordCount: 5 };
    showGenerateArea();

  } catch (error) {
    loadingMsg.remove();
    addMessage(`폼 적용 중 오류: ${error.message}`, false, false, 'error');
    console.error('Apply crossword error:', error);
  } finally {
    state.isApplying = false;
    if (applyBtn) {
      applyBtn.disabled = false;
      const applySpan = applyBtn.querySelector('span');
      if (applySpan) applySpan.textContent = '폼에 적용하기';
      applyBtn.style.opacity = '1';
    }
  }
}

// === 문제 미리보기 (v13: 액션 버튼 추가) ===
function showQuestionsPreview(questions, type) {
  const timestamp = Date.now();
  // v13: 현재 미리보기 ID 저장 (업데이트용)
  currentPreviewId = `sqai-preview-${timestamp}`;

  let previewHTML = `<div class="sqai-preview" id="${currentPreviewId}">
    <div class="sqai-preview-header">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5676ff" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <h3>생성된 문제</h3>
      <button id="copy-questions-${timestamp}" class="sqai-copy-btn" title="문제 복사">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>`;

  questions.forEach((q, i) => {
    const qType = q._type || type;
    const typeLabel = type === 'mixed' ? `<span class="sqai-preview-type">[${TYPE_NAMES[qType]}]</span> ` : '';

    // v13: 액션 버튼이 있는 헤더 구조
    previewHTML += `<div class="sqai-preview-item" data-index="${i}">
      <div class="sqai-preview-item-header">
        <div class="sqai-preview-title">${i + 1}. ${typeLabel}${q.question.substring(0, 55)}${q.question.length > 55 ? '...' : ''}</div>
        <div class="sqai-preview-actions">
          <button class="sqai-preview-action-btn regen" data-index="${i}" title="이 문항 재생성">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button class="sqai-preview-action-btn exclude" data-index="${i}" title="이 문항 제외">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>`;

    if (qType === 'choice' && q.options) {
      q.options.forEach((opt, idx) => {
        const isCorrect = idx === q.answer;
        previewHTML += `<div class="sqai-preview-option ${isCorrect ? 'correct' : ''}">
          ${isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          <span>${idx + 1}) ${opt}</span>
        </div>`;
      });
    } else if (qType === 'ox' || qType === 'short' || qType === 'initial') {
      previewHTML += `<div class="sqai-preview-option correct">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>정답: ${q.answer}</span>
      </div>`;
      if (q.similarAnswers && q.similarAnswers.length > 0) {
        previewHTML += `<div class="sqai-preview-option">
          <span>유사정답: ${q.similarAnswers.join(', ')}</span>
        </div>`;
      }
    } else if (qType === 'order' && q.items) {
      previewHTML += `<div class="sqai-preview-option correct">
        <span>순서: ${q.correctOrder.map(idx => q.items[idx]).join(' → ')}</span>
      </div>`;
    } else if (qType === 'essay') {
      previewHTML += `<div class="sqai-preview-option">
        <span>모범답안: ${(q.modelAnswer || '').substring(0, 50)}${(q.modelAnswer || '').length > 50 ? '...' : ''}</span>
      </div>`;
    }

    previewHTML += `</div>`;
  });

  // v13: 폼 적용 버튼 제거 (하단 버튼 영역으로 이동)
  previewHTML += `</div>`;

  addMessage(previewHTML, false, true);

  // v13: 이벤트 리스너 연결
  setTimeout(() => {
    const copyBtn = document.getElementById(`copy-questions-${timestamp}`);
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyQuestionsToClipboard(questions, type);
      });
    }

    // 재생성 버튼 이벤트
    const regenBtns = document.querySelectorAll(`#sqai-preview-${timestamp} .sqai-preview-action-btn.regen`);
    regenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        handleRegenerate(index);
      });
    });

    // 제외 버튼 이벤트
    const excludeBtns = document.querySelectorAll(`#sqai-preview-${timestamp} .sqai-preview-action-btn.exclude`);
    excludeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        handleExclude(index);
      });
    });
  }, 100);
}

function copyQuestionsToClipboard(questions, type) {
  let text = '';

  questions.forEach((q, i) => {
    const qType = q._type || type;
    const typeLabel = type === 'mixed' ? `[${TYPE_NAMES[qType]}] ` : '';
    text += `${i + 1}. ${typeLabel}${q.question}\n`;

    if (qType === 'choice' && q.options) {
      q.options.forEach((opt, idx) => {
        const mark = idx === q.answer ? '(정답)' : '';
        text += `   ${idx + 1}) ${opt} ${mark}\n`;
      });
    } else if (qType === 'order' && q.items) {
      text += `   보기: ${q.items.join(', ')}\n`;
      text += `   정답 순서: ${q.correctOrder.map(idx => q.items[idx]).join(' → ')}\n`;
    } else if (qType === 'essay') {
      text += `   모범답안: ${q.modelAnswer}\n`;
      if (q.gradingCriteria) text += `   채점기준: ${q.gradingCriteria}\n`;
    } else {
      text += `   정답: ${q.answer}\n`;
      if (q.similarAnswers && q.similarAnswers.length > 0) {
        text += `   유사정답: ${q.similarAnswers.join(', ')}\n`;
      }
    }

    if (q.explanation) text += `   해설: ${q.explanation}\n`;
    text += '\n';
  });

  navigator.clipboard.writeText(text).then(() => {
    addMessage('문제가 클립보드에 복사되었습니다!', false, false, 'success');
  }).catch(() => {
    addMessage('복사 실패. 수동으로 복사해주세요.', false, false, 'error');
  });
}

// === 폼에 문제 적용 (v13: 제외 문항 필터링, v15: letterReorder 지원, v16: crossword 지원) ===
async function applyQuestionsToForm() {
  // v15: letterReorder 모드 처리
  if (currentFormType === FORM_TYPES.letterReorder) {
    await applyLetterReorderWords();
    return;
  }

  // v16: crossword 모드 처리
  if (currentFormType === FORM_TYPES.crossword) {
    await applyCrosswordWords();
    return;
  }

  if (state.isApplying || !state.currentQuestions) return;

  const { questions, type } = state.currentQuestions;

  // v13: 제외된 문항 필터링
  const activeQuestions = questions.filter(q => !q._excluded);

  if (activeQuestions.length === 0) {
    addMessage('적용할 문제가 없습니다. (모두 제외됨)', false, false, 'warning');
    return;
  }

  // v13: 하단 적용 버튼 비활성화
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    applyBtn.disabled = true;
    const applySpan = applyBtn.querySelector('span');
    if (applySpan) applySpan.textContent = '적용 중...';
    applyBtn.style.opacity = '0.6';
  }

  state.isApplying = true;
  addMessage(`${activeQuestions.length}개의 문제를 폼에 입력합니다...`, false, false, 'info');
  const loadingMsg = showLoading('폼에 입력 중...');

  try {
    for (let i = 0; i < activeQuestions.length; i++) {
      const q = activeQuestions[i];
      addMessage(`${i + 1}/${activeQuestions.length} 문제 입력 중...`, false, false);

      if (i === 0 && !isCurrentFormEmpty()) {
        addMessage('현재 폼에 내용이 있어 새 문제를 추가합니다', false, false, 'info');
        await clickAddQuizButton();
      } else if (i > 0) {
        await clickAddQuizButton();
      }

      let success = false;
      try {
        const qType = q._type || type;
        const filler = formFillers[qType];
        if (filler) {
          success = await filler(q);
        }

        if (success) {
          await clickSaveButton();
          addMessage(`${i + 1}/${activeQuestions.length} 완료`, false, false, 'success');
        } else {
          addMessage(`${i + 1}번 문제 입력 실패`, false, false, 'error');
        }
      } catch (err) {
        console.error(`Error on question ${i + 1}:`, err);
        addMessage(`${i + 1}번 문제 오류: ${err.message}`, false, false, 'error');
      }

      await wait(500);
    }

    loadingMsg.remove();
    addMessage('모든 문제가 폼에 적용되었습니다!', false, false, 'success');

    // v13: 적용 완료 후 초기 상태로 복귀
    state.currentQuestions = null;
    state.currentTopic = null;
    currentPreviewId = null;
    showGenerateArea();

  } catch (error) {
    loadingMsg.remove();
    addMessage(`폼 적용 중 오류: ${error.message}`, false, false, 'error');
    console.error('Apply error:', error);
  } finally {
    state.isApplying = false;
    // v13: 버튼 복원
    if (applyBtn) {
      applyBtn.disabled = false;
      const applySpan = applyBtn.querySelector('span');
      if (applySpan) applySpan.textContent = '폼에 적용하기';
      applyBtn.style.opacity = '1';
    }
  }
}
