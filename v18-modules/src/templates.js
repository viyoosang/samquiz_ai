/**
 * SamQuiz AI v18 - HTML 템플릿
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가
 */

// === 메인 챗봇 HTML ===
export function getChatbotHTML() {
  return `
    <div id="samquiz-ai-chatbot" class="sqai-container">
      <div id="chatbot-button" class="sqai-btn-float">
        <svg width="28" height="28" viewBox="0 0 471 471" fill="white">
          <path d="M235.5 471C235.5 438.423 229.22 407.807 216.66 379.155C204.492 350.503 187.811 325.579 166.616 304.384C145.421 283.189 120.498 266.508 91.845 254.34C63.1925 241.78 32.5775 235.5 0 235.5C32.5775 235.5 63.1925 229.416 91.845 217.249C120.498 204.689 145.421 187.811 166.616 166.616C187.811 145.421 204.492 120.497 216.66 91.845C229.22 63.1925 235.5 32.5775 235.5 0C235.5 32.5775 241.584 63.1925 253.751 91.845C266.311 120.497 283.189 145.421 304.384 166.616C325.579 187.811 350.503 204.689 379.155 217.249C407.807 229.416 438.423 235.5 471 235.5C438.423 235.5 407.807 241.78 379.155 254.34C350.503 266.508 325.579 283.189 304.384 304.384C283.189 325.579 266.311 350.503 253.751 379.155C241.584 407.807 235.5 438.423 235.5 471Z"/>
        </svg>
      </div>

      <div id="chatbot-window" class="sqai-window">
        <div id="chatbot-header" class="sqai-header">
          <div class="sqai-header-title">
            <div class="sqai-header-text">
              <h1>샘퀴즈 AI</h1>
            </div>
          </div>
          <div class="sqai-header-actions">
            <button id="settings-chatbot" class="sqai-header-btn" title="AI 출제 규칙 설정">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button id="minimize-chatbot" class="sqai-header-btn" title="최소화">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
            <button id="close-chatbot" class="sqai-header-btn" title="닫기">×</button>
          </div>
        </div>

        <div id="chat-body" class="sqai-body">
          <div id="chat-messages" class="sqai-messages">
            ${getWelcomeMessageHTML()}
          </div>

          <div class="sqai-input-area">
            <!-- 1. 주제 입력 + 파일 첨부 + 표현 수준 (v13: 한 줄로 통합) -->
            <div class="sqai-topic-section" id="sqai-file-drop-zone">
              <input type="file" id="sqai-file-input" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" style="display:none">
              <div class="sqai-topic-row">
                <input id="topic-input" type="text" placeholder="주제 입력 (예: 광합성)" class="sqai-topic-input">
                <button id="sqai-file-upload-btn" class="sqai-attach-btn" title="파일 첨부 (PDF/이미지)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <div class="sqai-segment sqai-level-segment" id="level-segment">
                  <button class="sqai-seg-btn active" data-value="elementary">초등</button>
                  <button class="sqai-seg-btn" data-value="middle">중고등</button>
                </div>
              </div>
              <div id="sqai-file-info" class="sqai-file-info" style="display:none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span id="sqai-file-name"></span>
                <button id="sqai-file-remove" class="sqai-file-remove" title="파일 제거">×</button>
              </div>
              <div id="sqai-file-drop-overlay" class="sqai-drop-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>파일을 여기에 놓으세요</span>
              </div>
            </div>

            <!-- 3. 문제 시퀀스 (v12: 칩 스타일 + 저장 버튼) -->
            <div class="sqai-sequence-section">
              <div class="sqai-sequence-header">
                <span class="sqai-option-label">문제 시퀀스</span>
                <div class="sqai-sequence-actions">
                  <span class="sqai-total-count">총 <span id="total-count">3</span>문제</span>
                  <button id="quick-save-btn" class="sqai-quick-save-btn" title="현재 조합 저장">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div id="sequence-list" class="sqai-sequence-list">
                <div class="sqai-sequence-empty">아래에서 문제 유형을 선택하세요</div>
              </div>
              <div class="sqai-type-buttons">
                <button class="sqai-type-btn" data-type="ox">+OX</button>
                <button class="sqai-type-btn" data-type="choice">+선택</button>
                <button class="sqai-type-btn" data-type="short">+단답</button>
                <button class="sqai-type-btn" data-type="essay">+서술</button>
                <button class="sqai-type-btn" data-type="order">+순서완성</button>
                <button class="sqai-type-btn" data-type="initial">+초성퀴즈</button>
              </div>
            </div>

            <!-- 4. 나의 문제 조합 -->
            <div class="sqai-combo-section" id="combo-section">
              <!-- 기본 상태 -->
              <div id="combo-default" class="sqai-combo-row">
                <span class="sqai-combo-label">나의 문제 조합</span>
                <select id="preset-select" class="sqai-combo-select">
                  <option value="">불러오기...</option>
                  <option value="__save__" class="sqai-combo-save-option">➕ 현재 설정 저장...</option>
                </select>
                <button id="preset-delete-btn" class="sqai-combo-icon-btn" title="선택한 조합 삭제" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
              <!-- 저장 모드 -->
              <div id="combo-save" class="sqai-combo-row" style="display:none">
                <input type="text" id="preset-name-input" class="sqai-combo-input" placeholder="조합 이름 입력..." maxlength="20">
                <button id="preset-save-confirm" class="sqai-combo-action-btn sqai-combo-action-save">저장</button>
                <button id="preset-save-cancel" class="sqai-combo-action-btn">취소</button>
              </div>
              <!-- 삭제 확인 모드 -->
              <div id="combo-delete" class="sqai-combo-row" style="display:none">
                <span id="combo-delete-name" class="sqai-combo-delete-text">"조합명" 삭제?</span>
                <button id="preset-delete-confirm" class="sqai-combo-action-btn sqai-combo-action-danger">삭제</button>
                <button id="preset-delete-cancel" class="sqai-combo-action-btn">취소</button>
              </div>
            </div>

            <!-- 6. 버튼 영역 (v13: 상태별 전환) -->
            <!-- 생성 전 상태 -->
            <div id="generate-area" class="sqai-btn-area">
              <button id="generate-button" class="sqai-btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <polygon points="6 4 20 12 6 20 6 4"/>
                </svg>
                <span>문제 생성하기</span>
              </button>
            </div>
            <!-- 생성 후 상태 -->
            <div id="result-area" class="sqai-btn-area sqai-result-area" style="display:none;">
              <button id="regenerate-all-btn" class="sqai-btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                <span>다시 생성</span>
              </button>
              <button id="apply-btn" class="sqai-btn-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>폼에 적용하기</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 설정 패널 -->
        ${getSettingsPanelHTML()}
      </div>
    </div>
  `;
}

// === v12: 시퀀스 아이템 HTML (칩 스타일) ===
const TYPE_SHORT_NAMES = {
  ox: 'OX',
  choice: '선택',
  short: '단답',
  essay: '서술',
  order: '순서',
  initial: '초성'
};

export function getSequenceItemHTML(item, index, total) {
  const typeName = TYPE_SHORT_NAMES[item.type] || item.type;

  return `
    <div class="sqai-seq-chip" draggable="true" data-id="${item.id}" data-index="${index}">
      <span class="sqai-chip-num">${index + 1}</span>
      <span class="sqai-chip-type">${typeName}</span>
      <button class="sqai-chip-delete" data-id="${item.id}" title="삭제">×</button>
    </div>
  `;
}

// === v9: 환영 메시지 + 사용 가이드 ===
function getWelcomeMessageHTML() {
  return `
    <div class="sqai-msg sqai-msg-ai">
      <strong>환영합니다! 샘퀴즈 AI</strong><br><br>
      <strong>사용 방법:</strong><br>
      1. 주제 입력 또는 📎 파일 첨부<br>
      2. 표현 수준 선택<br>
      3. 문제 유형과 개수 선택<br>
      4. [문제 생성하기] 클릭
    </div>
    <div class="sqai-warning">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <circle cx="12" cy="17" r="1"/>
      </svg>
      <span>AI 생성 내용은 반드시 검토 후 사용하세요</span>
    </div>
  `;
}

// === v9: 설정 패널 ===
function getSettingsPanelHTML() {
  return `
    <div id="settings-panel" class="sqai-settings-panel" style="display:none;">
      <div class="sqai-settings-header">
        <h2>AI 출제 규칙</h2>
        <button id="close-settings" class="sqai-header-btn" title="닫기">×</button>
      </div>

      <!-- 탭 네비게이션 -->
      <div class="sqai-settings-tabs-nav">
        <button class="sqai-settings-tab active" data-tab="basic">기본설정</button>
        <button class="sqai-settings-tab" data-tab="school">학년별</button>
        <button class="sqai-settings-tab" data-tab="length">길이제한</button>
        <button class="sqai-settings-tab" data-tab="principles">출제규칙</button>
        <button class="sqai-settings-tab" data-tab="restrictions">금지사항</button>
      </div>

      <div class="sqai-settings-body">
        <!-- 탭 1: 기본설정 -->
        <div id="tab-basic" class="sqai-tab-panel active">
          <!-- v18: API 키 입력 섹션 -->
          <div class="sqai-settings-section sqai-api-key-section">
            <label>Gemini API 키</label>
            <div class="sqai-api-key-row">
              <input type="password" id="setting-api-key" class="sqai-input-full" placeholder="API 키를 입력하세요">
              <button type="button" id="toggle-api-key-visibility" class="sqai-toggle-visibility-btn" title="보기/숨기기">
                <svg id="eye-icon-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg id="eye-icon-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <p class="sqai-hint-text">* Google AI Studio에서 발급받은 키를 입력하세요 (정식 개발 시 기본 제공 예정)</p>
          </div>
          <div class="sqai-settings-section">
            <label>AI 역할 설정</label>
            <textarea id="setting-role" rows="4"></textarea>
          </div>
        </div>

        <!-- 탭 2: 학년별 설정 -->
        <div id="tab-school" class="sqai-tab-panel">
          <div class="sqai-school-tabs">
            <button class="sqai-school-tab active" data-level="elementary">초등</button>
            <button class="sqai-school-tab" data-level="middle">중고등</button>
          </div>

          <div id="school-elementary" class="sqai-school-panel active">
            <div class="sqai-settings-section">
              <label>어휘 수준 설명</label>
              <input type="text" id="setting-elem-vocab-desc" class="sqai-input-full">
            </div>
            <div class="sqai-settings-section">
              <label>발문 스타일 - 권장 표현 (쉼표로 구분)</label>
              <textarea id="setting-elem-style-rec" rows="2"></textarea>
            </div>
            <div class="sqai-settings-section">
              <label>발문 스타일 - 금지 표현 (쉼표로 구분)</label>
              <textarea id="setting-elem-style-proh" rows="2"></textarea>
            </div>
            <div class="sqai-settings-section">
              <label>해설 어투 - 권장 (쉼표로 구분)</label>
              <input type="text" id="setting-elem-tone-rec" class="sqai-input-full">
            </div>
          </div>

          <div id="school-middle" class="sqai-school-panel">
            <div class="sqai-settings-section">
              <label>어휘 수준 설명</label>
              <input type="text" id="setting-mid-vocab-desc" class="sqai-input-full">
            </div>
            <div class="sqai-settings-section">
              <label>발문 스타일 - 권장 표현 (쉼표로 구분)</label>
              <textarea id="setting-mid-style-rec" rows="2"></textarea>
            </div>
            <div class="sqai-settings-section">
              <label>해설 어투 - 권장 (쉼표로 구분)</label>
              <input type="text" id="setting-mid-tone-rec" class="sqai-input-full">
            </div>
          </div>
        </div>

        <!-- 탭 3: 길이제한 -->
        <div id="tab-length" class="sqai-tab-panel">
          <div class="sqai-length-grid">
            <div class="sqai-length-item">
              <label>문제 발문 <span class="sqai-max-hint">(50~100자)</span></label>
              <div class="sqai-length-input-row">
                <input type="number" id="setting-len-question" min="50" max="100" data-min="50" data-max="100">
                <span class="sqai-length-unit">자</span>
              </div>
              <span class="sqai-inline-warning" data-for="setting-len-question"></span>
            </div>
            <div class="sqai-length-item">
              <label>해설 <span class="sqai-max-hint">(50~150자)</span></label>
              <div class="sqai-length-input-row">
                <input type="number" id="setting-len-explanation" min="50" max="150" data-min="50" data-max="150">
                <span class="sqai-length-unit">자</span>
              </div>
              <span class="sqai-inline-warning" data-for="setting-len-explanation"></span>
            </div>
            <div class="sqai-length-item">
              <label>객관식 보기 <span class="sqai-max-hint">(20~50자)</span></label>
              <div class="sqai-length-input-row">
                <input type="number" id="setting-len-option" min="20" max="50" data-min="20" data-max="50">
                <span class="sqai-length-unit">자</span>
              </div>
              <span class="sqai-inline-warning" data-for="setting-len-option"></span>
            </div>
            <div class="sqai-length-item">
              <label>단답형 정답 <span class="sqai-max-hint">(5~20자)</span></label>
              <div class="sqai-length-input-row">
                <input type="number" id="setting-len-short" min="5" max="20" data-min="5" data-max="20">
                <span class="sqai-length-unit">자</span>
              </div>
              <span class="sqai-inline-warning" data-for="setting-len-short"></span>
            </div>
            <div class="sqai-length-item">
              <label>초성퀴즈 정답 <span class="sqai-max-hint">(5~15자)</span></label>
              <div class="sqai-length-input-row">
                <input type="number" id="setting-len-initial" min="5" max="15" data-min="5" data-max="15">
                <span class="sqai-length-unit">자</span>
              </div>
              <span class="sqai-inline-warning" data-for="setting-len-initial"></span>
            </div>
            <div class="sqai-length-item">
              <label>서술형 모범답안 <span class="sqai-max-hint">(50~100자)</span></label>
              <div class="sqai-length-input-row">
                <input type="number" id="setting-len-essay" min="50" max="100" data-min="50" data-max="100">
                <span class="sqai-length-unit">자</span>
              </div>
              <span class="sqai-inline-warning" data-for="setting-len-essay"></span>
            </div>
          </div>
        </div>

        <!-- 탭 4: 출제규칙 -->
        <div id="tab-principles" class="sqai-tab-panel">
          <div class="sqai-settings-section">
            <label>문제 작성 원칙 (줄바꿈으로 구분)</label>
            <textarea id="setting-question-principles" rows="3"></textarea>
          </div>
          <div class="sqai-settings-section">
            <label>난이도 설명</label>
            <input type="text" id="setting-difficulty-desc" class="sqai-input-full">
          </div>
          <div class="sqai-settings-section">
            <label>난이도 규칙 (줄바꿈으로 구분)</label>
            <textarea id="setting-difficulty-rules" rows="3"></textarea>
          </div>
          <div class="sqai-settings-section">
            <label>선택지 정책 - 오답 구성 (줄바꿈으로 구분)</label>
            <textarea id="setting-choice-wrong" rows="2"></textarea>
          </div>
          <div class="sqai-settings-section">
            <label>해설 작성 원칙 (줄바꿈으로 구분)</label>
            <textarea id="setting-explanation-principles" rows="2"></textarea>
          </div>
        </div>

        <!-- 탭 5: 금지사항 -->
        <div id="tab-restrictions" class="sqai-tab-panel">
          <div class="sqai-settings-section">
            <label>저작권 관련 (줄바꿈으로 구분)</label>
            <textarea id="setting-restrict-copyright" rows="2"></textarea>
          </div>
          <div class="sqai-settings-section">
            <label>개인정보 관련</label>
            <textarea id="setting-restrict-privacy" rows="1"></textarea>
          </div>
          <div class="sqai-settings-section">
            <label>민감 주제 관련</label>
            <textarea id="setting-restrict-sensitivity" rows="1"></textarea>
          </div>
          <div class="sqai-settings-section">
            <label>유사정답 - 단위 변형</label>
            <label class="sqai-checkbox">
              <input type="checkbox" id="setting-similar-unit">
              <span>자동 생성 활성화</span>
            </label>
          </div>
          <div class="sqai-settings-section">
            <label>유사정답 - 동의어 변형</label>
            <label class="sqai-checkbox">
              <input type="checkbox" id="setting-similar-synonym">
              <span>자동 생성 활성화</span>
            </label>
          </div>
          <div class="sqai-settings-section sqai-settings-divider">
            <label>기타 설정</label>
            <label class="sqai-checkbox">
              <input type="checkbox" id="setting-remember-last" checked>
              <span>마지막 사용 설정 기억</span>
            </label>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="sqai-settings-actions">
          <button id="reset-settings" class="sqai-btn-secondary">기본값으로 초기화</button>
          <button id="save-settings" class="sqai-btn-primary">저장</button>
        </div>
      </div>
    </div>
  `;
}

// === 메시지 아이콘 ===
export const MESSAGE_ICONS = {
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="1"/></svg>`
};

// === 로딩 메시지 HTML ===
export function getLoadingHTML(message = '문제 생성 중...') {
  return `
    <div class="sqai-loading">
      <div class="sqai-spinner"></div>
      <span class="sqai-loading-text">${message}</span>
    </div>
  `;
}

// === v15: 글자순서바꾸기 전용 입력 폼 ===
export function getLetterReorderInputHTML() {
  return `
    <div class="sqai-letter-reorder-form">
      <!-- 주제 입력 + 파일 첨부 -->
      <div class="sqai-topic-section" id="sqai-file-drop-zone">
        <input type="file" id="sqai-file-input" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" style="display:none">
        <div class="sqai-topic-row">
          <input id="topic-input" type="text" placeholder="주제 입력 (예: 태양계)" class="sqai-topic-input">
          <button id="sqai-file-upload-btn" class="sqai-attach-btn" title="파일 첨부 (PDF/이미지)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <div class="sqai-segment sqai-level-segment" id="level-segment">
            <button class="sqai-seg-btn active" data-value="elementary">초등</button>
            <button class="sqai-seg-btn" data-value="middle">중고등</button>
          </div>
        </div>
        <div id="sqai-file-info" class="sqai-file-info" style="display:none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span id="sqai-file-name"></span>
          <button id="sqai-file-remove" class="sqai-file-remove" title="파일 제거">×</button>
        </div>
        <div id="sqai-file-drop-overlay" class="sqai-drop-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>파일을 여기에 놓으세요</span>
        </div>
      </div>

      <!-- 단어 개수 선택 -->
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

      <!-- 버튼 영역 -->
      <div id="generate-area" class="sqai-btn-area">
        <button id="generate-button" class="sqai-btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <polygon points="6 4 20 12 6 20 6 4"/>
          </svg>
          <span>단어 생성하기</span>
        </button>
      </div>
      <div id="result-area" class="sqai-btn-area sqai-result-area" style="display:none;">
        <button id="regenerate-all-btn" class="sqai-btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <span>다시 생성</span>
        </button>
        <button id="apply-btn" class="sqai-btn-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>폼에 적용하기</span>
        </button>
      </div>
    </div>
  `;
}

// === v15: 글자순서바꾸기 환영 메시지 ===
export function getLetterReorderWelcomeHTML() {
  return `
    <div class="sqai-msg sqai-msg-ai">
      <strong>글자순서바꾸기 모드</strong><br><br>
      <strong>사용 방법:</strong><br>
      1. 주제 입력 또는 📎 파일 첨부<br>
      2. 표현 수준 선택 (초등/중고등)<br>
      3. 생성할 단어 개수 선택<br>
      4. [단어 생성하기] 클릭
    </div>
    <div class="sqai-warning">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <circle cx="12" cy="17" r="1"/>
      </svg>
      <span>AI 생성 내용은 반드시 검토 후 사용하세요</span>
    </div>
  `;
}

// === v15: 글자순서바꾸기 결과 미리보기 ===
export function getLetterReorderPreviewHTML(words) {
  const wordsHTML = words.map((item, idx) => `
    <div class="sqai-word-preview-item" data-index="${idx}">
      <div class="sqai-word-preview-num">${idx + 1}</div>
      <div class="sqai-word-preview-content">
        <div class="sqai-word-preview-word">${item.word}</div>
        <div class="sqai-word-preview-hint">${item.hint}</div>
      </div>
      <div class="sqai-preview-actions">
        <button class="sqai-preview-action-btn sqai-regen-btn" data-index="${idx}" title="재생성">🔄</button>
        <button class="sqai-preview-action-btn sqai-exclude-btn" data-index="${idx}" title="제외">🗑️</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="sqai-msg sqai-msg-ai">
      <strong>생성된 단어 (${words.length}개)</strong>
      <div class="sqai-word-preview-list">
        ${wordsHTML}
      </div>
    </div>
  `;
}

// === v16: 가로세로퍼즐 전용 입력 폼 ===
export function getCrosswordInputHTML() {
  return `
    <div class="sqai-crossword-form">
      <!-- 주제 입력 + 파일 첨부 -->
      <div class="sqai-topic-section" id="sqai-file-drop-zone">
        <input type="file" id="sqai-file-input" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" style="display:none">
        <div class="sqai-topic-row">
          <input id="topic-input" type="text" placeholder="주제 입력 (예: 태양계)" class="sqai-topic-input">
          <button id="sqai-file-upload-btn" class="sqai-attach-btn" title="파일 첨부 (PDF/이미지)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <div class="sqai-segment sqai-level-segment" id="level-segment">
            <button class="sqai-seg-btn active" data-value="elementary">초등</button>
            <button class="sqai-seg-btn" data-value="middle">중고등</button>
          </div>
        </div>
        <div id="sqai-file-info" class="sqai-file-info" style="display:none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span id="sqai-file-name"></span>
          <button id="sqai-file-remove" class="sqai-file-remove" title="파일 제거">×</button>
        </div>
        <div id="sqai-file-drop-overlay" class="sqai-drop-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>파일을 여기에 놓으세요</span>
        </div>
      </div>

      <!-- 단어 개수 선택 -->
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

      <!-- 버튼 영역 -->
      <div id="generate-area" class="sqai-btn-area">
        <button id="generate-button" class="sqai-btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <polygon points="6 4 20 12 6 20 6 4"/>
          </svg>
          <span>퍼즐 생성하기</span>
        </button>
      </div>
      <div id="result-area" class="sqai-btn-area sqai-result-area" style="display:none;">
        <button id="regenerate-all-btn" class="sqai-btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <span>다시 생성</span>
        </button>
        <button id="apply-btn" class="sqai-btn-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>폼에 적용하기</span>
        </button>
      </div>
    </div>
  `;
}

// === v16: 가로세로퍼즐 환영 메시지 ===
export function getCrosswordWelcomeHTML() {
  return `
    <div class="sqai-msg sqai-msg-ai">
      <strong>가로세로퍼즐 모드</strong><br><br>
      <strong>사용 방법:</strong><br>
      1. 주제 입력 또는 📎 파일 첨부<br>
      2. 표현 수준 선택 (초등/중고등)<br>
      3. 생성할 단어 개수 선택 (3~10개)<br>
      4. [퍼즐 생성하기] 클릭<br><br>
      <em>* 단어들이 10x10 그리드에 자동 배치됩니다</em>
    </div>
    <div class="sqai-warning">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <circle cx="12" cy="17" r="1"/>
      </svg>
      <span>AI 생성 내용은 반드시 검토 후 사용하세요</span>
    </div>
  `;
}

// === v16: 가로세로퍼즐 결과 미리보기 ===
export function getCrosswordPreviewHTML(crosswordData) {
  const { grid, hints, placedWords } = crosswordData;

  // 그리드 HTML 생성
  let gridHTML = '<div class="sqai-crossword-grid">';
  for (let row = 0; row < grid.length; row++) {
    gridHTML += '<div class="sqai-crossword-row">';
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      const hasContent = cell !== '';

      // 이 셀에서 시작하는 단어 번호 찾기
      const startingWord = placedWords.find(w => w.row === row && w.col === col);
      const wordNumber = startingWord ? startingWord.number : '';

      gridHTML += `
        <div class="sqai-crossword-cell ${hasContent ? 'sqai-cell-filled' : 'sqai-cell-empty'}">
          ${wordNumber ? `<span class="sqai-cell-number">${wordNumber}</span>` : ''}
          <span class="sqai-cell-letter">${cell}</span>
        </div>
      `;
    }
    gridHTML += '</div>';
  }
  gridHTML += '</div>';

  // 힌트 HTML 생성
  const horizontalHintsHTML = hints.horizontal.map(h =>
    `<div class="sqai-hint-item"><strong>${h.number}.</strong> ${h.hint}</div>`
  ).join('');

  const verticalHintsHTML = hints.vertical.map(h =>
    `<div class="sqai-hint-item"><strong>${h.number}.</strong> ${h.hint}</div>`
  ).join('');

  return `
    <div class="sqai-msg sqai-msg-ai sqai-crossword-preview">
      <strong>생성된 퍼즐 (${placedWords.length}개 단어)</strong>

      ${gridHTML}

      <div class="sqai-crossword-hints">
        <div class="sqai-hints-section">
          <strong>가로</strong>
          ${horizontalHintsHTML || '<div class="sqai-hint-empty">없음</div>'}
        </div>
        <div class="sqai-hints-section">
          <strong>세로</strong>
          ${verticalHintsHTML || '<div class="sqai-hint-empty">없음</div>'}
        </div>
      </div>
    </div>
  `;
}
