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
