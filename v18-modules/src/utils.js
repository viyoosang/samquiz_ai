/**
 * SamQuiz AI v10 - 유틸리티 함수
 *
 * v10: 파일 드래그앤드롭 지원
 */

// === 대기 함수 ===
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === Vue 이벤트 트리거 ===
export function triggerVueEvent(element) {
  if (!element) return;
  ['input', 'change', 'blur', 'keyup'].forEach(type => {
    element.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
  });
  element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: element.value }));
}

// === 파일을 base64로 변환 ===
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// === MIME 타입 가져오기 ===
export function getMimeType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext] || file.type;
}

// === 배열을 텍스트로 변환 ===
export function arrayToText(arr, separator = ', ') {
  return arr.join(separator);
}

// === 텍스트를 배열로 변환 ===
export function textToArray(text, separator = ',') {
  if (separator === '\n') {
    return text.split('\n').map(s => s.trim()).filter(s => s);
  }
  return text.split(separator).map(s => s.trim()).filter(s => s);
}

// === HTML 이스케이프 (XSS 방지) ===
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === 허용된 파일 타입 검증 ===
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];

export function isAllowedFileType(file) {
  // MIME 타입 체크
  if (ALLOWED_FILE_TYPES.includes(file.type)) return true;

  // 확장자 체크 (MIME 타입이 없거나 잘못된 경우 대비)
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function getAllowedFileTypesMessage() {
  return 'PDF 또는 이미지(PNG, JPG, GIF, WebP)만 업로드 가능합니다.';
}
