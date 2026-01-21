/**
 * SamQuiz AI v18 - 스타일
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가
 */

export const STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  #chat-messages::-webkit-scrollbar { width: 6px; }
  #chat-messages::-webkit-scrollbar-track { background: #f1f1f1; }
  #chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  #chat-messages::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  .sqai-container {
    position: fixed;
    bottom: 1.25rem;
    right: 1.25rem;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }

  .sqai-btn-float {
    width: 60px;
    height: 60px;
    border-radius: 9999px;
    background: linear-gradient(135deg, #5676ff 0%, #7c3aed 100%);
    box-shadow: 0 10px 20px -5px rgba(86, 118, 255, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    user-select: none;
  }
  .sqai-btn-float:hover { transform: scale(1.05); }
  .sqai-btn-float:active { transform: scale(0.95); }

  .sqai-window {
    position: absolute;
    top: 0;
    right: 0;
    width: 420px;
    height: 700px;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    display: none;
    flex-direction: column;
    overflow: hidden;
    animation: fadeIn 0.2s ease-out;
    transform: translateY(calc(-100% - 5rem));
  }

  .sqai-header {
    background: linear-gradient(135deg, #5676ff 0%, #7c3aed 100%);
    color: white;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
  }
  .sqai-header-text h1 { font-size: 0.9375rem; font-weight: 600; margin: 0; }
  .sqai-header-actions { display: flex; gap: 0.5rem; }

  .sqai-header-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 0.375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .sqai-header-btn:hover { background: rgba(255,255,255,0.3); }
  .sqai-header-btn:focus { outline: 2px solid white; outline-offset: 2px; }

  .sqai-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .sqai-messages { flex: 1; overflow-y: auto; padding: 1rem; background: #f8fafc; }

  .sqai-msg {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    animation: slideIn 0.2s ease-out;
  }
  .sqai-msg-user { background: #5676ff; color: white; margin-left: 2rem; }
  .sqai-msg-ai { background: #e0e7ff; color: #475569; margin-right: 2rem; }

  .sqai-msg-success,
  .sqai-msg-error,
  .sqai-msg-warning,
  .sqai-msg-info {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-right: 2rem;
  }
  .sqai-msg-success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }
  .sqai-msg-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  .sqai-msg-warning {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    font-size: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.5rem;
  }
  .sqai-msg-info {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
  }

  .sqai-msg-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
  }

  .sqai-warning {
    color: #92400e;
    font-size: 0.75rem;
    padding: 0.625rem 0.75rem;
    background: #fef3c7;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #fcd34d;
    margin-bottom: 0.5rem;
    margin-right: 2rem;
  }

  .sqai-input-area {
    padding: 0.75rem;
    background: white;
    border-top: 1px solid #e2e8f0;
  }

  .sqai-option-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #334155;
    min-width: 55px;
  }

  .sqai-option-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.625rem;
  }

  .sqai-segment {
    display: flex;
    background: #f1f5f9;
    border-radius: 0.375rem;
    padding: 2px;
  }
  .sqai-seg-btn {
    padding: 0.25rem 0.625rem;
    border: none;
    background: transparent;
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.15s;
  }
  .sqai-seg-btn:hover { color: #374151; }
  .sqai-seg-btn:focus { outline: 2px solid #5676ff; outline-offset: -2px; }
  .sqai-seg-btn.active {
    background: white;
    color: #5676ff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  }

  .sqai-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    margin-bottom: 0.625rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .sqai-input:focus { outline: none; border-color: #5676ff; }
  .sqai-input::placeholder { color: #94a3b8; }

  /* v12: 시퀀스 섹션 (칩 스타일) */
  .sqai-sequence-section {
    margin-bottom: 0.5rem;
  }
  .sqai-sequence-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.375rem;
  }
  .sqai-sequence-section .sqai-option-label {
    display: inline;
    margin-bottom: 0;
  }
  .sqai-total-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: #5676ff;
  }

  /* v12: 시퀀스 헤더 액션 영역 */
  .sqai-sequence-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sqai-quick-save-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    padding: 0;
  }
  .sqai-quick-save-btn:hover {
    border-color: #5676ff;
    color: #5676ff;
    background: #eff6ff;
  }
  .sqai-quick-save-btn:focus {
    outline: 2px solid #5676ff;
    outline-offset: 1px;
  }

  /* v12: 시퀀스 리스트 (flex-wrap) */
  .sqai-sequence-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    min-height: 2rem;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: #f8fafc;
    margin-bottom: 0.5rem;
  }

  .sqai-sequence-empty {
    width: 100%;
    padding: 0.5rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.75rem;
  }

  /* v12: 칩 스타일 아이템 */
  .sqai-seq-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.375rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 1rem;
    font-size: 0.75rem;
    cursor: grab;
    transition: all 0.15s;
    user-select: none;
  }
  .sqai-seq-chip:hover {
    border-color: #5676ff;
    background: #eff6ff;
  }
  .sqai-seq-chip.dragging {
    opacity: 0.5;
    background: #e0e7ff;
    transform: scale(0.95);
  }
  .sqai-seq-chip.drag-over {
    border-color: #5676ff;
    box-shadow: -2px 0 0 0 #5676ff;
  }

  .sqai-chip-num {
    width: 16px;
    height: 16px;
    background: #5676ff;
    color: white;
    border-radius: 50%;
    font-size: 0.625rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sqai-chip-type {
    font-weight: 500;
    color: #334155;
  }

  .sqai-chip-delete {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
    line-height: 1;
    padding: 0;
  }
  .sqai-chip-delete:hover {
    color: #ef4444;
    background: #fee2e2;
  }

  /* 유형 추가 버튼들 */
  .sqai-type-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .sqai-type-btn {
    padding: 0.375rem 0.625rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    font-size: 0.75rem;
    font-weight: 500;
    color: #5676ff;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sqai-type-btn:hover {
    background: #eff6ff;
    border-color: #5676ff;
  }
  .sqai-type-btn:focus {
    outline: 2px solid #5676ff;
    outline-offset: 1px;
  }

  .sqai-switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
  }
  .sqai-switch-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #334155;
  }
  .sqai-switch {
    position: relative;
    width: 48px;
    height: 26px;
  }
  .sqai-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .sqai-switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.3s;
    border-radius: 26px;
  }
  .sqai-switch-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .sqai-switch input:checked + .sqai-switch-slider {
    background-color: #5676ff;
  }
  .sqai-switch input:checked + .sqai-switch-slider:before {
    transform: translateX(22px);
  }
  .sqai-switch input:focus + .sqai-switch-slider {
    box-shadow: 0 0 0 3px rgba(86, 118, 255, 0.3);
  }

  .sqai-topic-section {
    margin-bottom: 0.5rem;
  }
  .sqai-topic-row {
    display: flex;
    gap: 0.375rem;
    align-items: center;
  }
  .sqai-topic-input {
    flex: 1;
    padding: 0.5rem 0.625rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
    min-width: 0;
  }
  .sqai-topic-input:focus {
    outline: none;
    border-color: #5676ff;
  }
  .sqai-topic-input::placeholder {
    color: #94a3b8;
  }
  .sqai-attach-btn {
    width: 34px;
    height: 34px;
    border: 2px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .sqai-attach-btn:hover {
    border-color: #5676ff;
    color: #5676ff;
  }
  .sqai-attach-btn:focus {
    outline: 2px solid #5676ff;
    outline-offset: 2px;
  }
  .sqai-attach-btn.has-file {
    border-color: #5676ff;
    background: #eff6ff;
    color: #5676ff;
  }
  /* v13: 표현 수준 세그먼트 (주제 행 내 배치) */
  .sqai-level-segment {
    flex-shrink: 0;
    height: 34px;
  }
  .sqai-level-segment .sqai-seg-btn {
    height: 30px;
    line-height: 1;
  }
  .sqai-file-info {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    background: #eff6ff;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    color: #3b82f6;
  }
  .sqai-file-info svg {
    flex-shrink: 0;
    color: #3b82f6;
  }
  .sqai-file-info span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1e40af;
    font-weight: 500;
  }
  .sqai-file-remove {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1.125rem;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    flex-shrink: 0;
  }
  .sqai-file-remove:hover {
    color: #dc2626;
    background: rgba(220,38,38,0.1);
  }

  /* v10: 파일 드래그앤드롭 */
  .sqai-topic-section {
    position: relative;
  }
  .sqai-topic-section.drag-over {
    border-color: #5676ff;
    background: rgba(86, 118, 255, 0.05);
  }
  .sqai-drop-overlay {
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(86, 118, 255, 0.95);
    border-radius: 0.5rem;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 10;
    pointer-events: none;
  }
  .sqai-topic-section.drag-over .sqai-drop-overlay {
    display: flex;
  }

  .sqai-combo-section {
    margin-bottom: 0.625rem;
    padding: 0.375rem 0;
  }
  .sqai-combo-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sqai-combo-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #334155;
    white-space: nowrap;
  }
  .sqai-combo-select {
    flex: 1;
    padding: 0.5rem 0.625rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    background: white;
    cursor: pointer;
  }
  .sqai-combo-select:focus {
    outline: none;
    border-color: #5676ff;
  }
  .sqai-combo-save-option {
    color: #5676ff;
    font-weight: 500;
  }
  .sqai-combo-icon-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .sqai-combo-icon-btn:hover:not(:disabled) {
    border-color: #ef4444;
    color: #ef4444;
    background: #fef2f2;
  }
  .sqai-combo-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .sqai-combo-input {
    flex: 1;
    padding: 0.5rem 0.625rem;
    border: 2px solid #5676ff;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    background: white;
  }
  .sqai-combo-input:focus {
    outline: none;
  }
  .sqai-combo-input::placeholder {
    color: #94a3b8;
  }
  .sqai-combo-action-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .sqai-combo-action-btn:hover {
    background: #f8fafc;
  }
  .sqai-combo-action-save {
    background: #5676ff;
    border-color: #5676ff;
    color: white;
  }
  .sqai-combo-action-save:hover {
    background: #4361ee;
  }
  .sqai-combo-action-danger {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
  }
  .sqai-combo-action-danger:hover {
    background: #dc2626;
  }
  .sqai-combo-delete-text {
    flex: 1;
    font-size: 0.8125rem;
    color: #ef4444;
    font-weight: 500;
  }

  .sqai-btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #5676ff 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .sqai-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .sqai-btn-primary:focus-visible { outline: 2px solid #5676ff; outline-offset: 2px; }
  .sqai-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  /* v13: 버튼 영역 (상태별 전환) */
  .sqai-btn-area {
    margin-top: 0.25rem;
  }
  .sqai-result-area {
    display: flex;
    gap: 0.5rem;
  }
  .sqai-result-area .sqai-btn-secondary {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.75rem;
    font-weight: 600;
  }
  .sqai-result-area .sqai-btn-success {
    flex: 1.5;
    margin-top: 0;
  }

  .sqai-preview {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
  }
  .sqai-preview-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.625rem;
  }
  .sqai-preview-header h3 { font-weight: 600; color: #334155; font-size: 0.875rem; margin: 0; flex: 1; }
  .sqai-copy-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.375rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }
  .sqai-copy-btn:hover { color: #5676ff; background: #eff6ff; }

  .sqai-preview-item {
    background: white;
    padding: 0.5rem 0.625rem;
    border-radius: 0.375rem;
    margin-bottom: 0.375rem;
    border: 1px solid #e5e7eb;
  }
  .sqai-preview-title { font-weight: 500; color: #334155; margin-bottom: 0.25rem; font-size: 0.75rem; line-height: 1.4; }
  .sqai-preview-option {
    font-size: 0.6875rem;
    color: #64748b;
    margin-left: 0.375rem;
    display: flex;
    align-items: start;
    gap: 0.25rem;
    line-height: 1.4;
  }
  .sqai-preview-option.correct { color: #16a34a; font-weight: 500; }
  .sqai-preview-type {
    background: #f1f5f9;
    color: #64748b;
    padding: 0.0625rem 0.375rem;
    border-radius: 0.1875rem;
    font-size: 0.625rem;
    font-weight: 500;
    margin-right: 0.25rem;
  }

  /* v13: 문항별 액션 버튼 */
  .sqai-preview-item-header {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }
  .sqai-preview-title {
    flex: 1;
  }
  .sqai-preview-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }
  .sqai-preview-action-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    padding: 0;
  }
  .sqai-preview-action-btn:hover {
    border-color: #5676ff;
    color: #5676ff;
    background: #eff6ff;
  }
  .sqai-preview-action-btn.regen:hover {
    border-color: #5676ff;
    color: #5676ff;
  }
  .sqai-preview-action-btn.exclude:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: #fef2f2;
  }
  .sqai-preview-action-btn.loading {
    pointer-events: none;
    opacity: 0.6;
  }
  .sqai-preview-action-btn.loading svg {
    animation: spin 1s linear infinite;
  }

  /* v13: 제외된 문항 스타일 */
  .sqai-preview-item.excluded {
    opacity: 0.5;
    border-color: #d1d5db;
    background: #f9fafb;
  }
  .sqai-preview-item.excluded .sqai-preview-title {
    text-decoration: line-through;
    color: #94a3b8;
  }
  .sqai-preview-item.excluded .sqai-preview-action-btn.exclude {
    border-color: #16a34a;
    color: #16a34a;
    background: #dcfce7;
  }

  .sqai-btn-success {
    width: 100%;
    padding: 0.75rem;
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }
  .sqai-btn-success:hover:not(:disabled) { background: #15803d; }
  .sqai-btn-success:focus { outline: 2px solid #16a34a; outline-offset: 2px; }
  .sqai-btn-success:disabled { opacity: 0.6; cursor: not-allowed; }

  .sqai-loading { display: flex; align-items: center; gap: 0.5rem; color: #5676ff; }
  .sqai-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #e2e8f0;
    border-top-color: #5676ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .sqai-loading-text { font-weight: 500; }

  .sqai-settings-panel {
    display: none;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }
  .sqai-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #5676ff 0%, #7c3aed 100%);
    color: white;
  }
  .sqai-settings-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  .sqai-settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .sqai-settings-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .sqai-settings-section.sqai-settings-divider {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }
  .sqai-settings-section > label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #334155;
  }
  .sqai-settings-section textarea {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-family: inherit;
    resize: vertical;
    line-height: 1.5;
    box-sizing: border-box;
  }
  .sqai-settings-section textarea:focus {
    outline: none;
    border-color: #5676ff;
    box-shadow: 0 0 0 3px rgba(86, 118, 255, 0.2);
  }

  .sqai-settings-tabs-nav {
    display: flex;
    gap: 0;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 0.5rem;
  }
  .sqai-settings-tab {
    padding: 0.625rem 0.75rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sqai-settings-tab:hover {
    color: #374151;
    background: #e5e7eb;
  }
  .sqai-settings-tab:focus {
    outline: 2px solid #5676ff;
    outline-offset: -2px;
  }
  .sqai-settings-tab.active {
    color: #5676ff;
    border-bottom-color: #5676ff;
    background: transparent;
  }

  .sqai-tab-panel {
    display: none;
  }
  .sqai-tab-panel.active {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sqai-school-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .sqai-school-tab {
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    border: 2px solid #d1d5db;
    border-radius: 1rem;
    font-size: 0.8125rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sqai-school-tab:hover {
    background: #e5e7eb;
  }
  .sqai-school-tab:focus {
    outline: 2px solid #5676ff;
    outline-offset: 2px;
  }
  .sqai-school-tab.active {
    background: #5676ff;
    color: white;
    border-color: #5676ff;
  }
  .sqai-school-panel {
    display: none;
  }
  .sqai-school-panel.active {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sqai-length-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .sqai-length-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .sqai-length-item label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #334155;
  }
  .sqai-length-input-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .sqai-length-item input[type="number"] {
    flex: 1;
    padding: 0.5rem 0.625rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    box-sizing: border-box;
  }
  .sqai-length-item input[type="number"]:focus {
    outline: none;
    border-color: #5676ff;
    box-shadow: 0 0 0 3px rgba(86, 118, 255, 0.2);
  }
  .sqai-length-unit {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #64748b;
    flex-shrink: 0;
  }

  /* 길이제한 힌트 및 인라인 경고 */
  .sqai-max-hint {
    font-size: 0.6875rem;
    font-weight: 400;
    color: #94a3b8;
  }
  .sqai-inline-warning {
    display: none;
    font-size: 0.6875rem;
    color: #dc2626;
    margin-top: 0.25rem;
  }
  .sqai-inline-warning.visible {
    display: block;
  }
  .sqai-length-item input[type="number"].over-limit {
    border-color: #dc2626;
    background: #fef2f2;
  }
  .sqai-length-item input[type="number"].over-limit:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
  }

  .sqai-input-full {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    box-sizing: border-box;
  }
  .sqai-input-full:focus {
    outline: none;
    border-color: #5676ff;
    box-shadow: 0 0 0 3px rgba(86, 118, 255, 0.2);
  }

  /* v18: API 키 입력 섹션 */
  .sqai-api-key-section {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
    border: 1px solid #e2e8f0;
  }
  .sqai-api-key-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .sqai-api-key-row .sqai-input-full {
    flex: 1;
  }
  .sqai-toggle-visibility-btn {
    width: 36px;
    height: 36px;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .sqai-toggle-visibility-btn:hover {
    border-color: #5676ff;
    color: #5676ff;
  }
  .sqai-hint-text {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.5rem;
    line-height: 1.4;
  }

  .sqai-input-number {
    width: 80px;
    padding: 0.5rem 0.625rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }
  .sqai-input-number:focus {
    outline: none;
    border-color: #5676ff;
    box-shadow: 0 0 0 3px rgba(86, 118, 255, 0.2);
  }

  .sqai-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #334155;
  }
  .sqai-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #5676ff;
    cursor: pointer;
  }

  .sqai-settings-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }
  .sqai-btn-secondary {
    flex: 1;
    padding: 0.625rem;
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sqai-btn-secondary:hover {
    background: #e5e7eb;
  }
  .sqai-btn-secondary:focus {
    outline: 2px solid #5676ff;
    outline-offset: 2px;
  }
  .sqai-settings-actions .sqai-btn-primary {
    flex: 1;
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  /* v15: 글자순서바꾸기 전용 스타일 */
  .sqai-letter-reorder-form {
    padding: 0;
  }
  .sqai-word-count-section {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
  .sqai-word-count-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }
  .sqai-count-btn {
    min-width: 36px;
    height: 32px;
    padding: 0 0.5rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sqai-count-btn:hover {
    border-color: #5676ff;
    color: #5676ff;
    background: #f0f4ff;
  }
  .sqai-count-btn.active {
    background: #5676ff;
    border-color: #5676ff;
    color: white;
  }

  /* 단어 미리보기 리스트 */
  .sqai-word-preview-list {
    margin-top: 0.75rem;
  }
  .sqai-word-preview-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.625rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    transition: all 0.15s;
  }
  .sqai-word-preview-item:hover {
    border-color: #5676ff;
    box-shadow: 0 2px 4px rgba(86, 118, 255, 0.1);
  }
  .sqai-word-preview-item.excluded {
    opacity: 0.5;
    text-decoration: line-through;
    background: #f8fafc;
  }
  .sqai-word-preview-num {
    width: 24px;
    height: 24px;
    background: #5676ff;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .sqai-word-preview-content {
    flex: 1;
    min-width: 0;
  }
  .sqai-word-preview-word {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }
  .sqai-word-preview-hint {
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.4;
    word-break: break-word;
  }

  /* v16: 가로세로퍼즐 전용 스타일 */
  .sqai-crossword-form {
    padding: 0;
  }

  .sqai-crossword-preview {
    padding: 0.75rem;
  }

  .sqai-crossword-grid {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: #d1d5db;
    border: 2px solid #334155;
    border-radius: 0.375rem;
    overflow: hidden;
    margin: 0.75rem 0;
  }

  .sqai-crossword-row {
    display: flex;
    gap: 1px;
  }

  .sqai-crossword-cell {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .sqai-cell-filled {
    background: white;
    color: #1e293b;
  }

  .sqai-cell-empty {
    background: #1e293b;
  }

  .sqai-cell-number {
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: 0.5rem;
    font-weight: 700;
    color: #5676ff;
    line-height: 1;
  }

  .sqai-cell-letter {
    font-size: 0.6875rem;
  }

  .sqai-crossword-hints {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .sqai-hints-section {
    flex: 1;
    min-width: 0;
  }

  .sqai-hints-section strong {
    display: block;
    font-size: 0.8125rem;
    color: #5676ff;
    margin-bottom: 0.375rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .sqai-hint-item {
    font-size: 0.75rem;
    color: #334155;
    line-height: 1.5;
    margin-bottom: 0.25rem;
    padding-left: 0.25rem;
  }

  .sqai-hint-item strong {
    color: #5676ff;
    display: inline;
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .sqai-hint-empty {
    font-size: 0.75rem;
    color: #94a3b8;
    font-style: italic;
  }

  /* 생성 중 딤 오버레이 (챗봇 아래, 어드민 폼 위) */
  .sqai-generating-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99999;
    display: none;
    align-items: center;
    justify-content: center;
  }
  .sqai-generating-overlay.active { display: flex; }
  .sqai-generating-box {
    background: white;
    padding: 1.5rem 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1rem;
    color: #334155;
  }
  .sqai-generating-box .sqai-spinner {
    width: 24px;
    height: 24px;
  }

  /* v19: 중단 버튼 스타일 (생성/적용 버튼이 중단 버튼으로 변할 때 사용) */
  .sqai-stop-btn {
    background: #64748b !important;
    opacity: 1 !important;
  }
  .sqai-stop-btn:hover {
    background: #475569 !important;
  }
`;

export function injectStyles() {
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);
}
