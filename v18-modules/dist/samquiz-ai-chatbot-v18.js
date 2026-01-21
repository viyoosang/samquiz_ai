/**
 * SamQuiz AI 챗봇 v18
 *
 * v18 주요 변경사항:
 * - 사용자가 API 키를 직접 입력하는 기능 추가
 * - 설정 패널의 기본설정 탭에서 API 키 입력 가능
 * - API 키는 브라우저 localStorage에 저장됨
 * - 정식 개발 시에는 기본 API 키가 삽입될 예정
 *
 * v17 기능:
 * - 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 *
 * v16 기능:
 * - 가로세로퍼즐 퀴즈 폼 지원
 * - 10x10 그리드에 단어 자동 배치
 *
 * v15 기능:
 * - 글자순서바꾸기 퀴즈 폼 지원
 * - 폼 타입 자동 감지 (standard, letterReorder, crossword)
 *
 * 유지 기능:
 * - 단일 API 호출로 전체 문제 생성 (정답 중복 방지)
 * - 개별 문항 재생성/제외 기능
 * - 복수 유형 동시 생성 (시퀀스 기반)
 * - PDF/이미지 업로드 분석
 * - 학교급 수준 선택 (초등/중등)
 *
 * 사용법:
 * 1. https://samquiz.vivasam.com/makeQuiz 또는 글자순서바꾸기/가로세로퍼즐 페이지 열기
 * 2. F12 개발자 도구 > Console
 * 3. 이 파일 전체를 복사해서 붙여넣기
 * 4. 화면 우측 하단에 챗봇 아이콘 클릭
 * 5. 설정(톱니바퀴) 클릭 후 API 키 입력
 *
 * 빌드 정보: 2026-01-21T06:46:25.571Z
 */

(function() {
  'use strict';

// ========== src/config.js ==========
/**
 * SamQuiz AI v18 - 설정 및 상수
 *
 * API 키, 기본 설정값, 타입 정의 등
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자가 API 키를 직접 입력하는 기능 추가 (정식 개발 시 기본 삽입 예정)
 */

// === API 설정 ===
// v18: API 키를 사용자가 직접 입력 (정식 개발 시에는 기본값이 삽입될 예정)
const DEFAULT_GEMINI_API_KEY = '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// === v9: 문제 유형 라벨 ===
const TYPE_NAMES = {
  ox: 'OX형',
  choice: '선택형',
  short: '단답형',
  essay: '서술형',
  order: '순서완성형',
  initial: '초성퀴즈형'
};

// === 학교급 라벨 ===
const LEVEL_NAMES = {
  elementary: '초등',
  middle: '중고등'
};

// === 문제 유형 목록 (UI 버튼 순서) ===
const QUIZ_TYPES = ['ox', 'choice', 'short', 'essay', 'order', 'initial'];

// === v15: 폼 타입 (페이지별 구분) ===
const FORM_TYPES = {
  standard: 'standard',         // 기존 6개 유형 (OX, 선택, 단답, 서술, 순서, 초성)
  letterReorder: 'letterReorder', // 글자순서바꾸기
  crossword: 'crossword'        // 가로세로퍼즐 (v16 예정)
};

// === v15: 글자순서바꾸기 설정 ===
const LETTER_REORDER_CONFIG = {
  minWords: 2,
  maxWords: 10,
  defaultWords: 5,
  maxWordLength: 10,
  maxHintLength: 100
};

// === v16: 가로세로퍼즐 설정 ===
const CROSSWORD_CONFIG = {
  gridSize: 10,           // 10x10 고정 그리드
  minWords: 3,            // 최소 단어 수
  maxWords: 10,           // 최대 단어 수
  defaultWords: 5,        // 기본 단어 수
  maxWordLength: 10,      // 단어 최대 길이 (그리드 크기 제한)
  maxHintLength: 100      // 힌트 최대 길이
};

// === v13: 기본 시퀀스 (OX, 선택, 단답) ===
const DEFAULT_SEQUENCE = [
  { type: 'ox' },
  { type: 'choice' },
  { type: 'short' }
];

// === 프리셋 버전 (마이그레이션용) ===
const PRESET_VERSION = 2;

// === (하위 호환) 유형별 문제 수 기본값 ===
const DEFAULT_TYPE_CONFIG = {
  ox: 0,
  choice: 3,
  short: 0,
  essay: 0,
  order: 0,
  initial: 0
};

// === 프리셋(저장된 설정) 기본 데이터 ===
const DEFAULT_PRESET_DATA = {
  version: PRESET_VERSION,
  presets: [],
  lastUsedConfig: {
    sequence: [...DEFAULT_SEQUENCE],
    level: 'elementary'
  },
  rememberLastUsed: true
};

// === v9 설정 기본값 (프롬프트 규칙) ===
const DEFAULT_SETTINGS = {
  // === 1. 기본 설정 ===
  general: {
    role: '당신은 10년 경력의 교육 전문가입니다. 학생들의 학습 수준에 맞는 양질의 문제를 출제합니다. 핵심 개념 확인에 초점을 맞추고, 교과서 표준 용어를 사용합니다.',
    jsonInstruction: '반드시 유효한 JSON만 출력하세요. 문자열 내 큰따옴표는 \\"로 이스케이프하고, JSON 외 다른 텍스트 없이 출력하세요.'
  },

  // === 2. 학교급별 설정 ===
  schoolLevel: {
    elementary: {
      vocabulary: {
        description: '초등학생 수준의 쉬운 어휘 사용',
        guidelines: ['짧고 명확한 문장 구성', '기초 개념 중심', '어려운 한자어 지양']
      },
      questionStyle: {
        recommended: ['~은(는) 무엇일까요?', '~를 골라보세요', '~는 어떤 것일까요?', '~하면 어떻게 될까요?', '~를 찾아보세요'],
        prohibited: ['~을 고르시오', '~에 대해 서술하시오', '~을 쓰시오', '~을 구하시오']
      },
      explanationTone: {
        recommended: ['~이기 때문이에요', '~라고 해요', '~이랍니다'],
        prohibited: ['~이다', '~이므로']
      }
    },
    middle: {
      vocabulary: {
        description: '중학생 수준의 어휘 사용',
        guidelines: ['교과서 수준의 개념', '핵심 용어 정확히 사용', '표준 학술 용어 허용']
      },
      questionStyle: {
        recommended: ['~을(를) 고르시오', '~에 해당하는 것은?', '~을(를) 쓰시오'],
        prohibited: []
      },
      explanationTone: {
        recommended: ['~이다', '~이므로', '~하기 때문이다'],
        prohibited: []
      }
    }
  },

  // === 3. 글자수 제한 (시스템 최대치 적용) ===
  lengthLimits: {
    question: { value: 100, label: '문제 발문', min: 50, max: 100 },
    explanation: { value: 150, label: '해설', min: 50, max: 150 },
    option: { value: 50, label: '선택형 보기', min: 20, max: 50 },
    shortAnswer: { value: 20, label: '단답형 정답', min: 5, max: 20 },
    initialAnswer: { value: 15, label: '초성퀴즈 정답', min: 5, max: 15 },
    essayAnswer: { value: 100, label: '서술형 모범답안', min: 50, max: 100 }
  },

  // === 4. 문제 작성 원칙 ===
  questionPrinciples: {
    general: [
      '각 문제는 서로 다른 개념이나 관점을 다룹니다',
      '문제 간 중복되는 내용이 없어야 합니다',
      '교과서 표준 용어만 사용 (동의어 혼용 금지)'
    ],
    difficulty: {
      level: 'basic',
      description: '핵심 개념 확인 수준',
      rules: [
        '정의/용어 확인, 단순 사실 확인 위주',
        '복잡한 사고력을 요구하는 추론/해석 형태 퀴즈 출제 금지',
        '개념 확인용 퀴즈로 단순명료하게 출제'
      ]
    }
  },

  // === 5. 선택지 작성 원칙 ===
  choicePrinciples: {
    wrongAnswerPolicy: [
      '오답 선지는 "유사하지만 틀린" 개념적 오답으로 구성',
      '무의미한 문장이나 명백히 틀린 선지 금지'
    ],
    balancePolicy: [
      '선지 간 길이/형태 균형 유지',
      '정답만 유독 길거나 구체적이면 안 됨'
    ],
    prohibitedExpressions: [
      '"항상", "절대", "반드시" 등 극단 표현 남용',
      '부정문/이중부정 (필요 시 강조 표기)',
      '복수정답 가능성 있는 모호한 표현'
    ]
  },

  // === 6. 해설 작성 원칙 ===
  explanationPrinciples: {
    structure: [
      '해설은 "정답 근거"와 "오답 포인트"를 반드시 포함',
      '글자수 제한 내에서 충분히 설명 (내용이 잘리지 않도록)'
    ],
    purpose: '학생이 틀렸을 때 이해할 수 있도록 명확히 설명'
  },

  // === 7. 유사정답 규칙 ===
  similarAnswerRules: {
    unitVariation: {
      enabled: true,
      description: '단위 포함/미포함 버전 자동 생성',
      example: '정답 "10cm" → ["10", "10센티미터", "10 cm"]'
    },
    synonymVariation: {
      enabled: true,
      description: '동의어/표기 변형 (의미가 100% 동치할 때만)',
      example: '정답 "녹색" → ["초록색", "초록"]'
    }
  },

  // === 8. 콘텐츠 제한/금칙 ===
  restrictions: {
    copyright: [
      '첨부자료(교과서 등) 지문/문항 그대로 복제 금지',
      '표현 재구성, 출제 포인트만 활용'
    ],
    privacy: ['실명/연락처 등 개인정보 포함 금지'],
    sensitivity: ['정치/혐오/차별/폭력 등 민감 주제는 교과 맥락 벗어나면 금지'],
    commercialContent: ['특정 상표/브랜드 불필요 노출 금지']
  },

  // === 9. 공통 작성 규칙 ===
  commonRules: {
    answerFormat: '정답은 단일값 원칙 (객관식: 보기 번호, 단답형: 표준화된 문자열)',
    terminology: '교과서 표준 용어만 사용 (동의어 혼용 금지)',
    numberFormat: '숫자/단위 표기 통일 (예: 1 km, 3.5 m)',
    calculation: '불필요한 소수/복잡 계산 지양'
  }
};

// === localStorage 키 (v18) ===
const STORAGE_KEYS = {
  settings: 'samquiz-ai-settings-v18',
  presets: 'samquiz-ai-presets-v18',
  apiKey: 'samquiz-ai-apikey-v18'  // v18: 사용자 API 키 저장
};

// ========== src/utils.js ==========
/**
 * SamQuiz AI v10 - 유틸리티 함수
 *
 * v10: 파일 드래그앤드롭 지원
 */

// === 대기 함수 ===
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === Vue 이벤트 트리거 ===
function triggerVueEvent(element) {
  if (!element) return;
  ['input', 'change', 'blur', 'keyup'].forEach(type => {
    element.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
  });
  element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: element.value }));
}

// === 파일을 base64로 변환 ===
function fileToBase64(file) {
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
function getMimeType(file) {
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
function arrayToText(arr, separator = ', ') {
  return arr.join(separator);
}

// === 텍스트를 배열로 변환 ===
function textToArray(text, separator = ',') {
  if (separator === '\n') {
    return text.split('\n').map(s => s.trim()).filter(s => s);
  }
  return text.split(separator).map(s => s.trim()).filter(s => s);
}

// ========== src/state.js ==========
/**
 * SamQuiz AI v18 - 상태 관리
 *
 * v10: 파일 드래그앤드롭 지원
 * v18: 사용자 API 키 입력 기능 추가
 */

// === 앱 상태 ===
const state = {
  isOpen: false,
  isGenerating: false,
  isApplying: false,
  currentQuestions: null,
  conversation: [],
  uploadedFile: null,        // PDF/이미지용 (base64)
  uploadedFileName: null,
  showSettings: false
};

// === (하위 호환) 유형별 문제 수 상태 ===
let typeConfig = { ...DEFAULT_TYPE_CONFIG };

// === v9: 문제 시퀀스 상태 ===
let quizSequence = DEFAULT_SEQUENCE.map((item, i) => ({
  ...item,
  id: `seq_init_${i}`
}));
let sequenceIdCounter = 0;

// === 프리셋 데이터 ===
let presetData = JSON.parse(JSON.stringify(DEFAULT_PRESET_DATA));

// === 설정 데이터 ===
let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

// === v18: API 키 상태 ===
let geminiApiKey = DEFAULT_GEMINI_API_KEY;

// === 깊은 병합 함수 ===
function deepMerge(target, source) {
  const result = JSON.parse(JSON.stringify(target));
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// === v9: 시퀀스 조작 함수들 ===
function addSequenceItem(type) {
  const id = `seq_${++sequenceIdCounter}_${Date.now()}`;
  quizSequence.push({ type, id });
  return id;
}

function removeSequenceItem(id) {
  quizSequence = quizSequence.filter(item => item.id !== id);
}

function moveSequenceItem(fromIndex, toIndex) {
  if (fromIndex < 0 || toIndex < 0 ||
      fromIndex >= quizSequence.length ||
      toIndex >= quizSequence.length) return;

  const [item] = quizSequence.splice(fromIndex, 1);
  quizSequence.splice(toIndex, 0, item);
}

function setSequence(newSequence) {
  quizSequence = newSequence.map((item, i) => ({
    ...item,
    id: item.id || `seq_${++sequenceIdCounter}_${Date.now()}`
  }));
}

function clearSequence() {
  quizSequence = [];
}

function getSequence() {
  return [...quizSequence];
}

// === v9: 프리셋 마이그레이션 (v1 types → v2 sequence) ===
function migratePreset(preset) {
  // 이미 v2면 그대로 반환
  if (preset.version >= PRESET_VERSION && preset.sequence) {
    return preset;
  }

  // v1 (types 객체) → v2 (sequence 배열)
  const sequence = [];
  if (preset.types) {
    Object.entries(preset.types).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        sequence.push({ type });
      }
    });
  }

  return {
    ...preset,
    version: PRESET_VERSION,
    sequence: sequence.length > 0 ? sequence : [...DEFAULT_SEQUENCE]
  };
}

// === 프리셋 로드 ===
function loadPresetData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.presets);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 전체 데이터 마이그레이션
      if (!parsed.version || parsed.version < PRESET_VERSION) {
        parsed.version = PRESET_VERSION;
        // 각 프리셋 마이그레이션
        if (parsed.presets) {
          parsed.presets = parsed.presets.map(migratePreset);
        }
        // lastUsedConfig 마이그레이션
        if (parsed.lastUsedConfig) {
          parsed.lastUsedConfig = migratePreset(parsed.lastUsedConfig);
        }
      }
      presetData = { ...DEFAULT_PRESET_DATA, ...parsed };
    }
  } catch (e) {
    console.log('저장된 설정 불러오기 실패, 기본값 사용');
  }

  // 마지막 사용 설정 복원
  if (presetData.rememberLastUsed && presetData.lastUsedConfig) {
    if (presetData.lastUsedConfig.sequence) {
      setSequence(presetData.lastUsedConfig.sequence);
    } else if (presetData.lastUsedConfig.types) {
      // 하위 호환: types에서 시퀀스 생성
      const migrated = migratePreset(presetData.lastUsedConfig);
      setSequence(migrated.sequence);
    }
  }
}

// === 프리셋 저장 ===
function savePresetData() {
  try {
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(presetData));
  } catch (e) {
    console.error('저장된 설정 저장 실패:', e);
  }
}

// === 설정 로드 ===
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    if (saved) {
      const parsed = JSON.parse(saved);
      settings = deepMerge(DEFAULT_SETTINGS, parsed);
    }
  } catch (e) {
    console.log('설정 불러오기 실패, 기본값 사용');
  }
}

// === 설정 저장 ===
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch (e) {
    console.error('설정 저장 실패:', e);
  }
}

// === 설정 초기화 ===
function resetSettings() {
  settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  saveSettings();
}

// === v18: API 키 로드 ===
function loadApiKey() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.apiKey);
    if (saved) {
      geminiApiKey = saved;
    }
  } catch (e) {
    console.log('API 키 불러오기 실패');
  }
}

// === v18: API 키 저장 ===
function saveApiKey(key) {
  try {
    geminiApiKey = key;
    localStorage.setItem(STORAGE_KEYS.apiKey, key);
  } catch (e) {
    console.error('API 키 저장 실패:', e);
  }
}

// === v18: API 키 가져오기 ===
function getApiKey() {
  return geminiApiKey;
}

// === 현재 설정 가져오기 ===
function getCurrentConfig() {
  return {
    version: PRESET_VERSION,
    sequence: quizSequence.map(item => ({ type: item.type })),
    level: document.querySelector('#level-segment .sqai-seg-btn.active')?.dataset.value || 'middle'
  };
}

// === 설정 적용 ===
function applyConfig(config) {
  // v9: 시퀀스 적용
  if (config.sequence) {
    setSequence(config.sequence);
  } else if (config.types) {
    // 하위 호환: types에서 시퀀스 생성
    const sequence = [];
    Object.entries(config.types).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        sequence.push({ type });
      }
    });
    setSequence(sequence);
  }

  // 학교급 적용
  document.querySelectorAll('#level-segment .sqai-seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === config.level);
  });
}

// === 마지막 사용 설정 저장 ===
function saveLastUsedConfig() {
  if (presetData.rememberLastUsed) {
    presetData.lastUsedConfig = getCurrentConfig();
    savePresetData();
  }
}

// === typeConfig 업데이트 ===
function updateTypeConfig(type, value) {
  typeConfig[type] = value;
}

// === presetData 업데이트 ===
function updatePresetData(updates) {
  presetData = { ...presetData, ...updates };
}

// === 초기화 ===
function initState() {
  loadPresetData();
  loadSettings();
  loadApiKey();  // v18: API 키 로드
}

// ========== src/styles.js ==========
/**
 * SamQuiz AI v18 - 스타일
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가
 */

const STYLES = `
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
  .sqai-btn-primary:focus { outline: 2px solid #5676ff; outline-offset: 2px; }
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
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    border-left: 4px solid #5676ff;
  }
  .sqai-preview-title { font-weight: 600; color: #5676ff; margin-bottom: 0.375rem; font-size: 0.875rem; }
  .sqai-preview-option {
    font-size: 0.8125rem;
    color: #64748b;
    margin-left: 0.5rem;
    display: flex;
    align-items: start;
    gap: 0.375rem;
    line-height: 1.5;
  }
  .sqai-preview-option.correct { color: #16a34a; font-weight: 500; }
  .sqai-preview-type {
    background: #e0e7ff;
    color: #5676ff;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 600;
    margin-right: 0.375rem;
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
    border-left-color: #94a3b8;
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
`;

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// ========== src/templates.js ==========
/**
 * SamQuiz AI v18 - HTML 템플릿
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가
 */

// === 메인 챗봇 HTML ===
function getChatbotHTML() {
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
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

function getSequenceItemHTML(item, index, total) {
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
      <strong>환영합니다! 샘퀴즈 AI v16</strong><br><br>
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
        <line x1="12" y1="17" x2="12.01" y2="17"/>
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
const MESSAGE_ICONS = {
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

// === 로딩 메시지 HTML ===
function getLoadingHTML(message = '문제 생성 중...') {
  return `
    <div class="sqai-loading">
      <div class="sqai-spinner"></div>
      <span class="sqai-loading-text">${message}</span>
    </div>
  `;
}

// === v15: 글자순서바꾸기 전용 입력 폼 ===
function getLetterReorderInputHTML() {
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
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
function getLetterReorderWelcomeHTML() {
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
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>AI 생성 내용은 반드시 검토 후 사용하세요</span>
    </div>
  `;
}

// === v15: 글자순서바꾸기 결과 미리보기 ===
function getLetterReorderPreviewHTML(words) {
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
function getCrosswordInputHTML() {
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
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
function getCrosswordWelcomeHTML() {
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
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>AI 생성 내용은 반드시 검토 후 사용하세요</span>
    </div>
  `;
}

// === v16: 가로세로퍼즐 결과 미리보기 ===
function getCrosswordPreviewHTML(crosswordData) {
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

// ========== src/api.js ==========
/**
 * SamQuiz AI v18 - API 호출 및 프롬프트 생성
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 요청사항"으로 변경
 * v18: 사용자가 API 키를 직접 입력하는 기능 추가
 */

// === Gemini API 호출 ===
async function callGeminiAPI(options) {
  const { topic, count, quizType, level, sequence } = options;

  // v18: API 키 확인
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
  }

  // v14: mixed 타입인 경우 generateMixedPrompt 사용
  const prompt = quizType === 'mixed'
    ? generateMixedPrompt(topic, sequence, level)
    : generatePrompt(topic, count, quizType, level);

  const parts = [{ text: prompt }];

  if (state.uploadedFile) {
    parts.unshift({
      inlineData: {
        mimeType: state.uploadedFile.mimeType,
        data: state.uploadedFile.data
      }
    });
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingLevel: "minimal" }
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || '';

    if (response.status === 400) {
      if (errorMessage.includes('token') || errorMessage.includes('size') || errorMessage.includes('limit')) {
        throw new Error('파일이 너무 크거나 복잡합니다. 더 작은 파일을 사용하거나 파일 없이 시도해주세요.');
      }
      throw new Error('요청 형식 오류가 발생했습니다. 다시 시도해주세요.');
    }
    if (response.status === 429) {
      throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }
    if (response.status === 403) {
      throw new Error('API 키 오류입니다. 설정을 확인해주세요.');
    }
    if (response.status === 500 || response.status === 503) {
      throw new Error('AI 서버에 일시적 문제가 있습니다. 잠시 후 다시 시도해주세요.');
    }
    throw new Error(`API 요청 실패 (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  const generatedText = data.candidates[0].content.parts[0].text;
  const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const questions = parsed.questions || [];

    // v14: mixed 타입인 경우 각 문항의 _type으로 검증
    if (quizType === 'mixed') {
      return questions.map(q => validateAndFixQuestion(q, q._type || 'choice'));
    }

    // 응답 검증 및 보정
    return questions.map(q => validateAndFixQuestion(q, quizType));
  }
  throw new Error('JSON 파싱 실패');
}

// === 응답 검증 및 보정 ===
function validateAndFixQuestion(question, quizType) {
  // order 유형 검증
  if (quizType === 'order') {
    if (!question.items || !Array.isArray(question.items) || question.items.length === 0) {
      console.warn('[API] order 유형인데 items가 없음. 응답:', question);
      // options가 있으면 items로 변환 시도
      if (question.options && Array.isArray(question.options)) {
        question.items = question.options;
        console.log('[API] options를 items로 변환함');
      } else {
        question.items = [];
      }
    }
    if (!question.correctOrder || !Array.isArray(question.correctOrder) || question.correctOrder.length === 0) {
      console.warn('[API] order 유형인데 correctOrder가 없음. 응답:', question);
      // items가 있으면 기본 순서(0,1,2,...)로 설정
      if (question.items && question.items.length > 0) {
        question.correctOrder = question.items.map((_, i) => i);
        console.log('[API] correctOrder를 기본 순서로 설정:', question.correctOrder);
      } else {
        question.correctOrder = [];
      }
    }
  }

  // choice 유형 검증
  if (quizType === 'choice') {
    if (!question.options || !Array.isArray(question.options)) {
      console.warn('[API] choice 유형인데 options가 없음');
      question.options = [];
    }
    if (question.answer === undefined || question.answer === null) {
      console.warn('[API] choice 유형인데 answer가 없음');
      question.answer = 0;
    }
  }

  return question;
}

// === 프롬프트 빌더 헬퍼 함수들 ===
function buildLengthRulesText() {
  const s = settings.lengthLimits;
  return `- 문장 길이 제한:
  * ${s.question.label}: 최대 ${s.question.value}자
  * ${s.explanation.label}: 최대 ${s.explanation.value}자
  * ${s.option.label}: 최대 ${s.option.value}자
  * ${s.shortAnswer.label}: 최대 ${s.shortAnswer.value}자
  * ${s.initialAnswer.label}: 최대 ${s.initialAnswer.value}자
  * ${s.essayAnswer.label}: ${s.essayAnswer.value}자 내외`;
}

function buildLevelGuidelinesText(level) {
  const lv = settings.schoolLevel[level];
  const levelName = level === 'elementary' ? '초등학교' : '중학교';

  let text = `[학교급 가이드라인 - ${levelName}]
어휘 수준: ${lv.vocabulary.description}
${lv.vocabulary.guidelines.map(g => `- ${g}`).join('\n')}

[발문 스타일]
권장 표현: ${lv.questionStyle.recommended.map(r => `"${r}"`).join(', ')}`;

  if (lv.questionStyle.prohibited.length > 0) {
    text += `\n금지 표현: ${lv.questionStyle.prohibited.map(p => `"${p}"`).join(', ')}`;
  }

  text += `\n\n[해설 어투]
권장: ${lv.explanationTone.recommended.map(r => `"${r}"`).join(', ')}`;

  if (lv.explanationTone.prohibited.length > 0) {
    text += `\n금지: ${lv.explanationTone.prohibited.map(p => `"${p}"`).join(', ')}`;
  }

  return text;
}

function buildRestrictionsText() {
  const r = settings.restrictions;
  return `[금칙/제한 사항]
${r.copyright.map(c => `- ${c}`).join('\n')}
${r.privacy.map(p => `- ${p}`).join('\n')}
${r.sensitivity.map(s => `- ${s}`).join('\n')}
${r.commercialContent.map(c => `- ${c}`).join('\n')}`;
}

function buildChoicePrinciplesText() {
  const c = settings.choicePrinciples;
  return `[선택지(보기) 정책]
${c.wrongAnswerPolicy.map(p => `- ${p}`).join('\n')}
${c.balancePolicy.map(p => `- ${p}`).join('\n')}
금지 사항:
${c.prohibitedExpressions.map(p => `- ${p}`).join('\n')}`;
}

function buildSimilarAnswerRulesText() {
  const r = settings.similarAnswerRules;
  let text = '[유사정답 생성 규칙]\n';
  if (r.unitVariation.enabled) {
    text += `- ${r.unitVariation.description}\n  예: ${r.unitVariation.example}\n`;
  }
  if (r.synonymVariation.enabled) {
    text += `- ${r.synonymVariation.description}\n  예: ${r.synonymVariation.example}\n`;
  }
  return text;
}

// === 메인 프롬프트 생성 함수 ===
function generatePrompt(topic, count, quizType, level) {
  const s = settings;
  const levelName = level === 'elementary' ? '초등학교' : '중학교';

  // 파일 컨텍스트 (PDF/이미지만)
  let fileContext = '';

  if (state.uploadedFile) {
    fileContext = `[첨부 파일 분석 지침]
위에 첨부된 파일의 내용을 분석하여 문제를 생성하세요.
- 파일에서 핵심 개념, 용어, 사실관계를 추출하여 문제화
- 파일 내용 중 교육적으로 중요한 부분을 우선 출제
- 문제나 해설에 페이지 번호, 출처, 파일명을 절대 인용하지 마세요
- 파일 내용이 부족하면 해당 주제의 일반 지식으로 보완

`;
  }

  // 공통 작성 규칙
  const commonRulesText = `[공통 작성 규칙]
- ${s.commonRules.answerFormat}
${buildLengthRulesText()}
- ${s.commonRules.terminology}
- ${s.commonRules.numberFormat}
- ${s.commonRules.calculation}
- 해설은 "정답 근거"와 "오답 포인트"를 글자수 제한 내에서 충분히 설명`;

  // 난이도 기준
  const difficultyText = `[난이도 기준]
${s.questionPrinciples.difficulty.description}:
${s.questionPrinciples.difficulty.rules.map(r => `- ${r}`).join('\n')}`;

  // 문제 작성 원칙
  const questionPrinciplesText = `[문제 작성 원칙]
${s.questionPrinciples.general.map(g => `- ${g}`).join('\n')}`;

  // 해설 작성 원칙
  const explanationPrinciplesText = `[해설 작성 원칙]
${s.explanationPrinciples.structure.map(st => `- ${st}`).join('\n')}
- ${s.explanationPrinciples.purpose}`;

  // v17: 파일 첨부 시 topic을 "추가 요청사항"으로 변경
  const topicLine = state.uploadedFile
    ? (topic && topic !== '첨부 파일 내용 기반' ? `\n추가 요청사항: ${topic}` : '')
    : `\n주제: ${topic}`;

  // 기본 프롬프트 조립
  const basePrompt = `[역할]
${s.general.role}

${fileContext}${levelName} 교사용 문제 ${count}개를 생성하세요.${topicLine}

${commonRulesText}

${difficultyText}

${buildLevelGuidelinesText(level)}

${questionPrinciplesText}

${explanationPrinciplesText}

${buildRestrictionsText()}

[출력 규칙]
${s.general.jsonInstruction}
`;

  // 선택지 정책 (선택형만)
  const choiceExtra = quizType === 'choice' ? `\n${buildChoicePrinciplesText()}\n` : '';

  // 유사정답 규칙 (단답형/초성)
  const similarAnswerExtra = (quizType === 'short' || quizType === 'initial')
    ? `\n${buildSimilarAnswerRulesText()}` : '';

  const prompts = {
    'ox': `${basePrompt}
JSON 형식:
\`\`\`json
{
  "questions": [
    {
      "question": "문제 내용 (최대 100자)",
      "answer": "O 또는 X",
      "explanation": "정답 근거 + 오답 포인트 (최대 ${s.lengthLimits.explanation.value}자)"
    }
  ]
}
\`\`\``,

    'choice': `${basePrompt}${choiceExtra}
JSON 형식:
\`\`\`json
{
  "questions": [
    {
      "question": "문제 내용 (최대 100자)",
      "options": ["선택지1 (최대 50자)", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "정답 근거 + 오답 포인트 (최대 ${s.lengthLimits.explanation.value}자)"
    }
  ]
}
\`\`\`
answer는 정답 인덱스 (0부터 시작)`,

    'short': `${basePrompt}${similarAnswerExtra}
중요 규칙:
1. answer는 반드시 짧은 단어로만 작성 (최대 20자, 1~3단어 이내)
2. 문장이나 구절이 아닌 핵심 용어, 인명, 지명, 개념어 등 단답만 사용
3. 누구라도 명확하게 맞출 수 있는 구체적인 단어
4. similarAnswers에 유사정답 배열 포함 (단위 변형, 동의어 등)
5. 예시: "세종대왕", "광합성", "프랑스", "1945년" (O)
6. 금지: "조선시대의 위대한 왕", "식물이 하는 작용" (X)

JSON 형식:
\`\`\`json
{
  "questions": [
    {
      "question": "문제 내용 (최대 100자)",
      "answer": "짧은단어 (최대 20자)",
      "similarAnswers": ["유사정답1", "유사정답2"],
      "explanation": "정답 근거 + 오답 포인트 (최대 ${s.lengthLimits.explanation.value}자)"
    }
  ]
}
\`\`\``,

    'essay': `${basePrompt}
중요 규칙:

[발문(question) 작성 - 매우 중요!]
1. 서술형 발문은 반드시 "설명", "서술", "비교", "분석"을 요구하는 형태로 작성
${level === 'elementary'
  ? `2. 권장 표현 (초등용): "~을(를) 설명해 보세요", "~의 과정을 써 보세요", "~을(를) 비교해 보세요", "~에 대해 이야기해 보세요"
3. 금지 표현: "~무엇일까요?", "~무엇인가요?" (단답을 유도하므로 금지!), "~하시오", "~서술하시오" (초등에 부적합)
4. 나쁜 예시(X): "이집트에서 왕의 무덤으로 지어진 건축물은 무엇일까요?" → 답이 "피라미드"로 단답이 됨
5. 좋은 예시(O): "피라미드가 왜 만들어졌는지, 어떤 모양인지 설명해 보세요." → 서술이 필요함`
  : `2. 권장 표현 (중고등용): "~을(를) 설명하시오", "~의 과정을 서술하시오", "~을(를) 비교하여 설명하시오", "~의 원리를 서술하시오"
3. 금지 표현: "~무엇일까요?", "~무엇인가요?", "~은(는) 무엇입니까?" (단답을 유도하므로 금지!)
4. 나쁜 예시(X): "옛날 이집트에서 왕의 무덤으로 지어진 건축물은 무엇일까요?" → 답이 "피라미드"로 단답이 됨
5. 좋은 예시(O): "고대 이집트에서 피라미드를 건설한 목적과 그 구조적 특징을 설명하시오." → 서술이 필요함`}
6. question은 순수하게 문제 내용만 포함 (최대 100자, 메타 정보 금지)

[모범답안(modelAnswer) 작성]
7. modelAnswer는 반드시 "완전한 문장 형태"의 서술형 답안을 작성 (50~100자)
   - 단답형처럼 단어나 짧은 구가 아닌, 주어+서술어가 포함된 완전한 문장으로 작성
   - 예시(X): "광합성" → 예시(O): "식물이 빛에너지를 이용하여 이산화탄소와 물로 포도당을 합성하는 과정을 광합성이라고 한다."
   - 개념의 정의, 원리, 과정 등을 문장으로 설명
8. explanation은 문제에 대한 해설을 작성 (최대 ${s.lengthLimits.explanation.value}자, 채점 기준이 아님)
9. gradingCriteria는 별도로 채점 기준을 상세히 작성

JSON 형식:
\`\`\`json
{
  "questions": [
    {
      "question": "순수한 문제 내용만 (최대 100자)",
      "modelAnswer": "완전한 문장으로 작성된 서술형 모범답안 (50~100자, 단답 금지)",
      "explanation": "문제의 배경, 핵심 개념, 관련 지식 등 해설 (최대 ${s.lengthLimits.explanation.value}자)",
      "gradingCriteria": "채점 시 평가할 요소와 배점 기준"
    }
  ]
}
\`\`\``,

    'order': `${basePrompt}
[중요] 이것은 "순서완성형" 문제입니다!
- 객관식(선택형)으로 변환하지 마세요
- options나 answer 필드가 아닌 items와 correctOrder 필드를 사용해야 합니다
- 반드시 아래 JSON 형식을 정확히 따르세요

필수 규칙:
1. items: 순서가 섞여있는 항목 배열 (3~5개, 각 항목 최대 50자) - 필수!
2. correctOrder: 올바른 순서를 나타내는 인덱스 배열 - 필수!
3. correctOrder는 [0,1,2,3]처럼 정렬된 순서가 아니라, 올바른 순서대로 나열된 인덱스 배열
4. 예시: items가 ["조선 건국", "고려 건국", "통일신라", "대한민국 수립"]이고
   올바른 시간순서가 "통일신라 → 고려 건국 → 조선 건국 → 대한민국 수립"이면
   correctOrder는 [2, 1, 0, 3] (통일신라=인덱스2, 고려 건국=인덱스1, 조선 건국=인덱스0, 대한민국 수립=인덱스3)

JSON 형식 (반드시 items와 correctOrder 포함):
\`\`\`json
{
  "questions": [
    {
      "question": "다음 역사적 사건을 시간순으로 배열하시오 (최대 100자)",
      "items": ["조선 건국", "고려 건국", "통일신라", "대한민국 수립"],
      "correctOrder": [2, 1, 0, 3],
      "explanation": "통일신라(676년) → 고려 건국(918년) → 조선 건국(1392년) → 대한민국 수립(1948년) 순서입니다. (최대 ${s.lengthLimits.explanation.value}자)"
    }
  ]
}
\`\`\`
주의: options, answer 필드를 사용하면 안 됩니다. 오직 items, correctOrder만 사용하세요.`,

    'initial': `${basePrompt}${similarAnswerExtra}
중요 규칙:
1. answer는 최대 15자 이내
2. similarAnswers에 동의어/표기 변형 유사정답 포함 (의미가 100% 동치할 경우만)

JSON 형식:
\`\`\`json
{
  "questions": [
    {
      "question": "힌트 설명 (최대 100자)",
      "initial": "ㅊㅅ",
      "answer": "초성 (최대 15자)",
      "similarAnswers": ["유사정답1", "유사정답2"],
      "explanation": "정답 근거 (최대 ${s.lengthLimits.explanation.value}자)"
    }
  ]
}
\`\`\``
  };

  return prompts[quizType] || prompts['choice'];
}

// === v14: 복합 프롬프트 생성 (여러 유형 동시 요청) ===
function generateMixedPrompt(topic, sequence, level) {
  const s = settings;
  const levelName = level === 'elementary' ? '초등학교' : '중학교';

  // 유형별 개수 집계
  const typeCounts = {};
  sequence.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });

  // 총 문제 수
  const totalCount = sequence.length;

  // 유형별 요청 문자열 생성
  const typeNames = {
    ox: 'OX형',
    choice: '선택형',
    short: '단답형',
    essay: '서술형',
    order: '순서완성형',
    initial: '초성퀴즈형'
  };

  const typeRequests = Object.entries(typeCounts)
    .map(([type, count]) => `${typeNames[type]} ${count}개`)
    .join(', ');

  // 파일 컨텍스트
  let fileContext = '';
  if (state.uploadedFile) {
    fileContext = `[첨부 파일 분석 지침]
위에 첨부된 파일의 내용을 분석하여 문제를 생성하세요.
- 파일에서 핵심 개념, 용어, 사실관계를 추출하여 문제화
- 파일 내용 중 교육적으로 중요한 부분을 우선 출제
- 문제나 해설에 페이지 번호, 출처, 파일명을 절대 인용하지 마세요
- 파일 내용이 부족하면 해당 주제의 일반 지식으로 보완

`;
  }

  // 공통 작성 규칙
  const commonRulesText = `[공통 작성 규칙]
- ${s.commonRules.answerFormat}
${buildLengthRulesText()}
- ${s.commonRules.terminology}
- ${s.commonRules.numberFormat}
- ${s.commonRules.calculation}
- 해설은 "정답 근거"와 "오답 포인트"를 글자수 제한 내에서 충분히 설명`;

  // 난이도 기준
  const difficultyText = `[난이도 기준]
${s.questionPrinciples.difficulty.description}:
${s.questionPrinciples.difficulty.rules.map(r => `- ${r}`).join('\n')}`;

  // 문제 작성 원칙
  const questionPrinciplesText = `[문제 작성 원칙]
${s.questionPrinciples.general.map(g => `- ${g}`).join('\n')}`;

  // 해설 작성 원칙
  const explanationPrinciplesText = `[해설 작성 원칙]
${s.explanationPrinciples.structure.map(st => `- ${st}`).join('\n')}
- ${s.explanationPrinciples.purpose}`;

  // v14: 정답 중복 방지 규칙
  const noDuplicateRule = `[정답 중복 방지 - 매우 중요!]
- 모든 문제의 정답이 서로 달라야 합니다
- 같은 단어/개념이 여러 문제의 정답으로 반복되면 안 됩니다
- 예시(X): 1번 정답 "태양계", 3번 정답 "태양계", 5번 정답 "태양계" → 중복 금지!
- 하나의 주제에서 다양한 관점과 개념을 다뤄서 정답이 자연스럽게 다양해지도록 출제하세요`;

  // 유형별 JSON 형식 설명 생성
  const typeFormats = [];

  if (typeCounts.ox) {
    typeFormats.push(`[OX형 형식]
{
  "_type": "ox",
  "question": "문제 내용 (최대 100자)",
  "answer": "O 또는 X",
  "explanation": "해설 (최대 ${s.lengthLimits.explanation.value}자)"
}`);
  }

  if (typeCounts.choice) {
    typeFormats.push(`[선택형 형식]
${buildChoicePrinciplesText()}
{
  "_type": "choice",
  "question": "문제 내용 (최대 100자)",
  "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
  "answer": 0,
  "explanation": "해설 (최대 ${s.lengthLimits.explanation.value}자)"
}
answer는 정답 인덱스 (0부터 시작)`);
  }

  if (typeCounts.short) {
    typeFormats.push(`[단답형 형식]
${buildSimilarAnswerRulesText()}
- answer는 반드시 짧은 단어만 (최대 20자, 1~3단어)
- 문장이 아닌 핵심 용어, 인명, 지명, 개념어 등 단답만
{
  "_type": "short",
  "question": "문제 내용 (최대 100자)",
  "answer": "짧은단어 (최대 20자)",
  "similarAnswers": ["유사정답1", "유사정답2"],
  "explanation": "해설 (최대 ${s.lengthLimits.explanation.value}자)"
}`);
  }

  if (typeCounts.essay) {
    const essayStyle = level === 'elementary'
      ? `- 권장 표현: "~을(를) 설명해 보세요", "~의 과정을 써 보세요"
- 금지 표현: "~무엇일까요?" (단답 유도), "~하시오" (초등에 부적합)`
      : `- 권장 표현: "~을(를) 설명하시오", "~을(를) 서술하시오"
- 금지 표현: "~무엇일까요?" (단답 유도)`;

    typeFormats.push(`[서술형 형식]
${essayStyle}
- modelAnswer는 완전한 문장 형태 (50~100자)
{
  "_type": "essay",
  "question": "순수한 문제 내용만 (최대 100자)",
  "modelAnswer": "완전한 문장으로 작성된 서술형 모범답안 (50~100자)",
  "explanation": "해설 (최대 ${s.lengthLimits.explanation.value}자)",
  "gradingCriteria": "채점 기준"
}`);
  }

  if (typeCounts.order) {
    typeFormats.push(`[순서완성형 형식]
- items: 순서가 섞인 항목 배열 (3~5개)
- correctOrder: 올바른 순서의 인덱스 배열
- 예: items가 ["조선", "고려", "통일신라"]이고 시간순이 통일신라→고려→조선이면 correctOrder는 [2, 1, 0]
{
  "_type": "order",
  "question": "다음을 순서대로 배열하시오 (최대 100자)",
  "items": ["항목1", "항목2", "항목3", "항목4"],
  "correctOrder": [2, 1, 0, 3],
  "explanation": "해설 (최대 ${s.lengthLimits.explanation.value}자)"
}`);
  }

  if (typeCounts.initial) {
    typeFormats.push(`[초성퀴즈형 형식]
${buildSimilarAnswerRulesText()}
{
  "_type": "initial",
  "question": "힌트 설명 (최대 100자)",
  "initial": "ㅊㅅ",
  "answer": "초성 정답 (최대 15자)",
  "similarAnswers": ["유사정답1", "유사정답2"],
  "explanation": "해설 (최대 ${s.lengthLimits.explanation.value}자)"
}`);
  }

  // 요청 순서대로 타입 목록 생성
  const orderedTypes = sequence.map((item, i) => `${i + 1}번: ${typeNames[item.type]}`).join('\n');

  // v17: 파일 첨부 시 topic을 "추가 요청사항"으로 변경
  const topicLine = state.uploadedFile
    ? (topic && topic !== '첨부 파일 내용 기반' ? `\n추가 요청사항: ${topic}` : '')
    : `\n주제: ${topic}`;

  return `[역할]
${s.general.role}

${fileContext}${levelName} 교사용 문제 총 ${totalCount}개를 생성하세요.
요청: ${typeRequests}${topicLine}

${noDuplicateRule}

${commonRulesText}

${difficultyText}

${buildLevelGuidelinesText(level)}

${questionPrinciplesText}

${explanationPrinciplesText}

${buildRestrictionsText()}

${typeFormats.join('\n\n')}

[출력 순서 - 반드시 이 순서대로!]
${orderedTypes}

[출력 규칙]
${s.general.jsonInstruction}
반드시 _type 필드를 각 문제에 포함하세요.

JSON 형식:
\`\`\`json
{
  "questions": [
    { "_type": "유형", ... },
    { "_type": "유형", ... }
  ]
}
\`\`\``;
}

// === v15: 글자순서바꾸기 전용 프롬프트 생성 ===
function generateLetterReorderPrompt(topic, count, level) {
  const s = settings;
  const levelName = level === 'elementary' ? '초등학생' : '중학생';

  // 파일 컨텍스트
  let fileContext = '';
  if (state.uploadedFile) {
    fileContext = `[첨부 파일 분석 지침]
위에 첨부된 파일의 내용을 분석하여 단어를 추출하세요.
- 파일에서 핵심 개념, 용어를 추출하여 단어로 활용
- 파일 내용 중 교육적으로 중요한 부분을 우선 활용

`;
  }

  // v17: 파일 첨부 시 topic을 "추가 요청사항"으로 변경
  const topicLine = state.uploadedFile
    ? (topic && topic !== '첨부 파일 내용 기반' ? `추가 요청사항: ${topic}\n` : '')
    : `주제: ${topic}\n`;

  return `[역할]
${s.general.role}

${fileContext}${topicLine}학교급: ${levelName}

"글자 순서 바꾸기" 퀴즈용 단어 ${count}개를 생성하세요.

[규칙]
- 각 단어는 2~${LETTER_REORDER_CONFIG.maxWordLength}글자의 한글 단어
- 힌트는 단어를 유추할 수 있는 설명 (${LETTER_REORDER_CONFIG.maxHintLength}자 이내)
- 단어 간 중복 금지
- ${level === 'elementary' ? '초등학생이 알 수 있는 쉬운 단어와 친근한 힌트 표현 사용' : '중학생 수준의 어휘와 정확한 개념 설명'}
- 힌트는 단어를 직접 언급하지 않고 특징이나 정의로 설명

[금칙]
- 힌트에 정답 단어를 그대로 포함하지 않기
- 너무 쉽거나 너무 어려운 단어 지양
- 특수문자, 영어, 숫자가 포함된 단어 금지

[출력 규칙]
${s.general.jsonInstruction}

JSON 형식:
\`\`\`json
{
  "words": [
    { "word": "단어1", "hint": "힌트1" },
    { "word": "단어2", "hint": "힌트2" }
  ]
}
\`\`\``;
}

// === v15: 글자순서바꾸기 전용 API 호출 ===
async function callGeminiAPIForLetterReorder(options) {
  const { topic, count, level } = options;

  // v18: API 키 확인
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
  }

  const prompt = generateLetterReorderPrompt(topic, count, level);
  const parts = [{ text: prompt }];

  if (state.uploadedFile) {
    parts.unshift({
      inlineData: {
        mimeType: state.uploadedFile.mimeType,
        data: state.uploadedFile.data
      }
    });
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: "minimal" }
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || '';

    if (response.status === 400) {
      throw new Error('요청 형식 오류가 발생했습니다. 다시 시도해주세요.');
    }
    if (response.status === 429) {
      throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }
    if (response.status === 403) {
      throw new Error('API 키 오류입니다. 설정을 확인해주세요.');
    }
    if (response.status === 500 || response.status === 503) {
      throw new Error('AI 서버에 일시적 문제가 있습니다. 잠시 후 다시 시도해주세요.');
    }
    throw new Error(`API 요청 실패 (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  const generatedText = data.candidates[0].content.parts[0].text;
  const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const words = parsed.words || [];

    // 검증: 단어 길이, 힌트 길이 체크
    return words.map(item => ({
      word: (item.word || '').slice(0, LETTER_REORDER_CONFIG.maxWordLength),
      hint: (item.hint || '').slice(0, LETTER_REORDER_CONFIG.maxHintLength)
    }));
  }
  throw new Error('JSON 파싱 실패');
}

// === v16: 가로세로퍼즐 전용 프롬프트 생성 ===
function generateCrosswordPrompt(topic, count, level) {
  const s = settings;
  const levelName = level === 'elementary' ? '초등학생' : '중학생';

  // 파일 컨텍스트
  let fileContext = '';
  if (state.uploadedFile) {
    fileContext = `[첨부 파일 분석 지침]
위에 첨부된 파일의 내용을 분석하여 단어를 추출하세요.
- 파일에서 핵심 개념, 용어를 추출하여 단어로 활용
- 파일 내용 중 교육적으로 중요한 부분을 우선 활용

`;
  }

  // 여유분 포함 (교차 실패 대비)
  const requestCount = Math.min(count + 3, 12);

  // v17: 파일 첨부 시 topic을 "추가 요청사항"으로 변경
  const topicLine = state.uploadedFile
    ? (topic && topic !== '첨부 파일 내용 기반' ? `추가 요청사항: ${topic}\n` : '')
    : `주제: ${topic}\n`;

  return `[역할]
${s.general.role}

${fileContext}${topicLine}학교급: ${levelName}

"가로세로퍼즐" 퀴즈용 단어 ${requestCount}개를 생성하세요.

[핵심 규칙 - 매우 중요!]
가로세로퍼즐은 단어들이 서로 교차해야 합니다.
반드시 단어들이 공통 글자(음절)를 공유하도록 생성하세요!

[공통 글자 예시]
주제가 "광합성"일 경우:
- "광합성" + "합격" → "합" 공유
- "광합성" + "성장" → "성" 공유
- "산소" + "소화" → "소" 공유
- "이산화탄소" + "산소" + "산책" → "산" 공유

[단어 생성 전략]
1. 첫 번째 단어(가로)를 정한 후, 그 단어의 글자를 포함하는 단어들을 세로로 배치
2. 세로 단어의 글자를 공유하는 가로 단어를 추가
3. 모든 단어가 최소 1개 이상의 다른 단어와 글자를 공유하도록 설계

[기본 규칙]
- 각 단어는 2~${CROSSWORD_CONFIG.maxWordLength}글자의 한글 단어
- 힌트는 단어를 유추할 수 있는 설명 (${CROSSWORD_CONFIG.maxHintLength}자 이내)
- ${level === 'elementary' ? '초등학생이 알 수 있는 쉬운 단어와 친근한 힌트 표현 사용' : '중학생 수준의 어휘와 정확한 개념 설명'}
- direction은 "horizontal"(가로) 또는 "vertical"(세로)
- 가로와 세로를 번갈아가며 배치 (가로 → 세로 → 가로 → 세로...)

[금칙]
- 힌트에 정답 단어를 포함하지 않기
- 특수문자, 영어, 숫자가 포함된 단어 금지
- 공통 글자가 없는 단어 금지 (다른 단어와 교차 불가)

[출력 규칙]
${s.general.jsonInstruction}

JSON 형식:
\`\`\`json
{
  "words": [
    { "word": "광합성", "hint": "식물이 빛으로 양분을 만드는 과정", "direction": "horizontal" },
    { "word": "합격", "hint": "시험에 통과하는 것", "direction": "vertical" },
    { "word": "성장", "hint": "자라서 커지는 것", "direction": "horizontal" },
    { "word": "장난감", "hint": "어린이가 가지고 노는 물건", "direction": "vertical" }
  ]
}
\`\`\``;
}

// === v16: 가로세로퍼즐 단어 배치 알고리즘 (개선됨) ===
function placeCrosswordWords(words, targetCount = null) {
  const gridSize = CROSSWORD_CONFIG.gridSize;
  // targetCount가 없으면 전체 단어 배치, 있으면 해당 개수까지만
  const maxPlacement = targetCount || words.length;
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
  const placedWords = [];

  // 단어를 길이 순으로 정렬 (긴 단어부터 배치)
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);

  // 교차점 찾기 함수
  function tryPlaceWithIntersection(word, direction, existingWords) {
    const isHorizontal = direction === 'horizontal';
    const candidates = []; // 배치 가능한 위치들 수집

    for (const placedWord of existingWords) {
      // 교차하려면 방향이 달라야 함
      if (placedWord.direction === direction) continue;

      for (let wi = 0; wi < word.length; wi++) {
        for (let pi = 0; pi < placedWord.word.length; pi++) {
          if (word[wi] === placedWord.word[pi]) {
            let newRow, newCol;

            if (placedWord.direction === 'horizontal') {
              // 기존이 가로, 새 단어는 세로
              newRow = placedWord.row - wi;
              newCol = placedWord.col + pi;
            } else {
              // 기존이 세로, 새 단어는 가로
              newRow = placedWord.row + pi;
              newCol = placedWord.col - wi;
            }

            if (canPlaceWord(grid, word, newRow, newCol, isHorizontal)) {
              // 교차점 개수 계산 (더 많이 교차하는 위치 우선)
              let intersections = 0;
              for (let i = 0; i < word.length; i++) {
                const r = isHorizontal ? newRow : newRow + i;
                const c = isHorizontal ? newCol + i : newCol;
                if (grid[r] && grid[r][c] === word[i]) intersections++;
              }
              candidates.push({ row: newRow, col: newCol, intersections });
            }
          }
        }
      }
    }

    // 교차점이 가장 많은 위치 선택
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.intersections - a.intersections);
      return candidates[0];
    }
    return null;
  }

  // 단독 배치 시도 함수 (교차점 없이 빈 공간에 배치)
  function tryPlaceAlone(word, preferHorizontal) {
    const candidates = [];

    // 원래 방향으로 먼저 시도
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (canPlaceWordAlone(grid, word, row, col, preferHorizontal)) {
          // 중앙에 가까울수록 높은 점수
          const centerDistance = Math.abs(row - gridSize / 2) + Math.abs(col - gridSize / 2);
          candidates.push({ row, col, score: -centerDistance, flipped: false });
        }
      }
    }

    // 반대 방향으로도 시도
    const flippedHorizontal = !preferHorizontal;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (canPlaceWordAlone(grid, word, row, col, flippedHorizontal)) {
          const centerDistance = Math.abs(row - gridSize / 2) + Math.abs(col - gridSize / 2);
          candidates.push({ row, col, score: -centerDistance, flipped: true });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0];
    }

    return null;
  }

  for (let i = 0; i < sortedWords.length; i++) {
    // 목표 개수에 도달하면 중단
    if (placedWords.length >= maxPlacement) {
      console.log(`[CROSSWORD] 목표 개수(${maxPlacement}) 도달, 배치 중단`);
      break;
    }

    const wordData = sortedWords[i];
    const word = wordData.word;
    let placed = false;

    // 첫 번째 단어는 중앙에 가로로 배치
    if (i === 0) {
      const isHorizontal = true; // 첫 단어는 항상 가로
      const startRow = Math.floor(gridSize / 2);
      const startCol = Math.floor((gridSize - word.length) / 2);

      if (canPlaceWord(grid, word, startRow, startCol, isHorizontal)) {
        placeWord(grid, word, startRow, startCol, isHorizontal);
        placedWords.push({
          ...wordData,
          direction: 'horizontal',
          row: startRow,
          col: startCol,
          number: placedWords.length + 1
        });
        placed = true;
      }
    }

    // 두 번째 단어부터는 교차점을 우선 찾고, 없으면 단독 배치
    if (!placed && placedWords.length > 0) {
      // 1차 시도: 원래 방향으로 교차점 찾기
      let position = tryPlaceWithIntersection(word, wordData.direction, placedWords);

      // 2차 시도: 방향을 바꿔서 교차점 찾기
      if (!position) {
        const flippedDirection = wordData.direction === 'horizontal' ? 'vertical' : 'horizontal';
        position = tryPlaceWithIntersection(word, flippedDirection, placedWords);

        if (position) {
          wordData.direction = flippedDirection; // 방향 전환
        }
      }

      // 3차 시도: 교차점 없이 단독 배치 (fallback)
      if (!position) {
        const preferHorizontal = wordData.direction === 'horizontal';
        const alonePosition = tryPlaceAlone(word, preferHorizontal);
        if (alonePosition) {
          if (alonePosition.flipped) {
            wordData.direction = preferHorizontal ? 'vertical' : 'horizontal';
          }
          position = alonePosition;
          console.log(`[CROSSWORD] 단독 배치: ${word} at (${position.row}, ${position.col})`);
        }
      }

      if (position) {
        const isHorizontal = wordData.direction === 'horizontal';
        placeWord(grid, word, position.row, position.col, isHorizontal);
        placedWords.push({
          ...wordData,
          row: position.row,
          col: position.col,
          number: placedWords.length + 1
        });
        placed = true;
      }
    }

    // 그래도 배치 못하면 스킵
    if (!placed) {
      console.warn(`[CROSSWORD] 배치 실패 (공간 부족): ${word}`);
    }
  }

  // 힌트를 가로/세로로 분류 (위치순 정렬)
  const hints = {
    horizontal: placedWords
      .filter(w => w.direction === 'horizontal')
      .sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row)
      .map(w => ({ number: w.number, row: w.row, col: w.col, hint: w.hint, word: w.word })),
    vertical: placedWords
      .filter(w => w.direction === 'vertical')
      .sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row)
      .map(w => ({ number: w.number, row: w.row, col: w.col, hint: w.hint, word: w.word }))
  };

  return { grid, hints, placedWords };
}

// 단어 배치 가능 여부 확인 (개선됨)
function canPlaceWord(grid, word, startRow, startCol, isHorizontal) {
  const gridSize = grid.length;

  // 범위 체크
  if (startRow < 0 || startCol < 0) return false;
  if (isHorizontal && startCol + word.length > gridSize) return false;
  if (!isHorizontal && startRow + word.length > gridSize) return false;

  let hasIntersection = false;

  // 각 글자 위치 확인
  for (let i = 0; i < word.length; i++) {
    const row = isHorizontal ? startRow : startRow + i;
    const col = isHorizontal ? startCol + i : startCol;

    const currentCell = grid[row][col];

    // 빈 칸이거나 같은 글자면 OK
    if (currentCell !== '' && currentCell !== word[i]) {
      return false;
    }

    // 교차점 확인
    if (currentCell === word[i] && currentCell !== '') {
      hasIntersection = true;
    }

    // 인접 칸 확인 (평행한 단어와 충돌 방지)
    // 새로 배치하는 칸(빈 칸)의 인접 셀에 다른 단어가 붙어있으면 안 됨
    if (currentCell === '') {
      if (isHorizontal) {
        // 가로 배치 시 위아래 확인
        if (row > 0 && grid[row - 1][col] !== '') {
          return false; // 위에 글자가 있으면 배치 불가
        }
        if (row < gridSize - 1 && grid[row + 1][col] !== '') {
          return false; // 아래에 글자가 있으면 배치 불가
        }
      } else {
        // 세로 배치 시 좌우 확인
        if (col > 0 && grid[row][col - 1] !== '') {
          return false; // 왼쪽에 글자가 있으면 배치 불가
        }
        if (col < gridSize - 1 && grid[row][col + 1] !== '') {
          return false; // 오른쪽에 글자가 있으면 배치 불가
        }
      }
    }
  }

  // 단어 앞뒤 여백 확인
  if (isHorizontal) {
    if (startCol > 0 && grid[startRow][startCol - 1] !== '') return false;
    if (startCol + word.length < gridSize && grid[startRow][startCol + word.length] !== '') return false;
  } else {
    if (startRow > 0 && grid[startRow - 1][startCol] !== '') return false;
    if (startRow + word.length < gridSize && grid[startRow + word.length][startCol] !== '') return false;
  }

  return true;
}

// 단독 배치 가능 여부 확인 (교차 없이 빈 공간에 배치)
function canPlaceWordAlone(grid, word, startRow, startCol, isHorizontal) {
  const gridSize = grid.length;

  // 범위 체크
  if (startRow < 0 || startCol < 0) return false;
  if (isHorizontal && startCol + word.length > gridSize) return false;
  if (!isHorizontal && startRow + word.length > gridSize) return false;

  // 각 글자 위치 확인 - 모든 칸이 빈 칸이어야 함
  for (let i = 0; i < word.length; i++) {
    const row = isHorizontal ? startRow : startRow + i;
    const col = isHorizontal ? startCol + i : startCol;

    // 해당 칸이 비어있어야 함
    if (grid[row][col] !== '') {
      return false;
    }

    // 인접 칸 확인 (평행한 단어와 충돌 방지)
    if (isHorizontal) {
      // 가로 배치 시 위아래 확인
      if (row > 0 && grid[row - 1][col] !== '') return false;
      if (row < gridSize - 1 && grid[row + 1][col] !== '') return false;
    } else {
      // 세로 배치 시 좌우 확인
      if (col > 0 && grid[row][col - 1] !== '') return false;
      if (col < gridSize - 1 && grid[row][col + 1] !== '') return false;
    }
  }

  // 단어 앞뒤 여백 확인
  if (isHorizontal) {
    if (startCol > 0 && grid[startRow][startCol - 1] !== '') return false;
    if (startCol + word.length < gridSize && grid[startRow][startCol + word.length] !== '') return false;
  } else {
    if (startRow > 0 && grid[startRow - 1][startCol] !== '') return false;
    if (startRow + word.length < gridSize && grid[startRow + word.length][startCol] !== '') return false;
  }

  return true;
}

// 그리드에 단어 배치
function placeWord(grid, word, startRow, startCol, isHorizontal) {
  for (let i = 0; i < word.length; i++) {
    const row = isHorizontal ? startRow : startRow + i;
    const col = isHorizontal ? startCol + i : startCol;
    grid[row][col] = word[i];
  }
}

// === v16: 가로세로퍼즐 전용 API 호출 ===
async function callGeminiAPIForCrossword(options) {
  const { topic, count, level } = options;

  // v18: API 키 확인
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
  }

  const prompt = generateCrosswordPrompt(topic, count, level);
  const parts = [{ text: prompt }];

  if (state.uploadedFile) {
    parts.unshift({
      inlineData: {
        mimeType: state.uploadedFile.mimeType,
        data: state.uploadedFile.data
      }
    });
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: "minimal" }
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || '';

    if (response.status === 400) {
      throw new Error('요청 형식 오류가 발생했습니다. 다시 시도해주세요.');
    }
    if (response.status === 429) {
      throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }
    if (response.status === 403) {
      throw new Error('API 키 오류입니다. 설정을 확인해주세요.');
    }
    if (response.status === 500 || response.status === 503) {
      throw new Error('AI 서버에 일시적 문제가 있습니다. 잠시 후 다시 시도해주세요.');
    }
    throw new Error(`API 요청 실패 (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();

  // Gemini thinking mode: 여러 parts 중 text가 있는 것을 찾음
  const responseParts = data.candidates[0].content.parts || [];
  let generatedText = '';

  for (const part of responseParts) {
    if (part.text) {
      generatedText = part.text;
      // JSON이 포함된 텍스트 찾기
      if (part.text.includes('{') && part.text.includes('words')) {
        break;
      }
    }
  }

  console.log('[CROSSWORD API] 응답 텍스트 길이:', generatedText.length);
  console.log('[CROSSWORD API] 응답 미리보기:', generatedText.substring(0, 500));

  const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const words = parsed.words || [];

      console.log('[CROSSWORD API] 파싱된 단어 개수:', words.length);

      // 검증: 단어 길이, 힌트 길이, direction 체크
      const validatedWords = words.map(item => ({
        word: (item.word || '').slice(0, CROSSWORD_CONFIG.maxWordLength),
        hint: (item.hint || '').slice(0, CROSSWORD_CONFIG.maxHintLength),
        direction: item.direction === 'vertical' ? 'vertical' : 'horizontal'
      }));

      // 그리드에 배치 (원래 요청한 개수만큼만)
      const result = placeCrosswordWords(validatedWords, count);

      return result;
    } catch (parseError) {
      console.error('[CROSSWORD API] JSON 파싱 에러:', parseError);
      console.error('[CROSSWORD API] 파싱 시도한 텍스트:', jsonMatch[1] || jsonMatch[0]);
      throw new Error('JSON 파싱 실패: ' + parseError.message);
    }
  }

  console.error('[CROSSWORD API] JSON을 찾지 못함. 전체 응답:', generatedText);
  throw new Error('JSON 파싱 실패: 응답에서 JSON을 찾을 수 없음');
}

// ========== src/form.js ==========
/**
 * SamQuiz AI v16 - 폼 입력 함수
 *
 * 샘퀴즈 어드민 페이지의 폼에 문제를 자동 입력하는 함수들
 * v15: 글자순서바꾸기 폼 입력 지원 추가
 * v16: 가로세로퍼즐 폼 입력 지원 추가
 */

// === 퀴즈 유형 탭 선택 ===
async function selectQuizTypeTab(quizType) {
  const tabMap = {
    'ox': '#pills-type01-tab',
    'choice': '#pills-type02-tab',
    'short': '#pills-type03-tab',
    'essay': '#pills-type04-tab',
    'order': '#pills-type05-tab',
    'initial': '#pills-type06-tab'
  };
  const tab = document.querySelector(tabMap[quizType]);
  if (tab && !tab.classList.contains('active')) {
    tab.click();
    await wait(500);
  }
}

// === 질문 입력 ===
async function fillQuestion(questionText) {
  const questionInput = document.querySelector('textarea[placeholder*="질문 입력"]');
  if (questionInput) {
    questionInput.value = questionText;
    triggerVueEvent(questionInput);
    await wait(100);
    return true;
  }
  return false;
}

// === 해설 입력 ===
async function fillExplanation(explanationText) {
  const explanationInput = document.querySelector('textarea[placeholder*="해설 입력"]');
  if (explanationInput) {
    explanationInput.value = explanationText || '';
    triggerVueEvent(explanationInput);
    await wait(100);
    return true;
  }
  return false;
}

// === 객관식 문제 입력 ===
async function fillChoiceQuiz(questionData) {
  try {
    await selectQuizTypeTab('choice');
    await fillQuestion(questionData.question);

    const options = questionData.options || [];

    for (let i = 2; i < options.length; i++) {
      const addButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('보기 추가'));
      if (addButton) {
        addButton.click();
        await wait(300);
      }
    }

    await wait(300);
    const optionInputs = document.querySelectorAll('input[placeholder*="보기 입력"]');
    for (let i = 0; i < Math.min(options.length, optionInputs.length); i++) {
      optionInputs[i].value = options[i];
      triggerVueEvent(optionInputs[i]);
      await wait(100);
    }

    await wait(300);
    const answerLabels = document.querySelectorAll('label.ox');
    if (answerLabels[questionData.answer]) {
      answerLabels[questionData.answer].click();
      await wait(100);
    }

    await fillExplanation(questionData.explanation);
    return true;
  } catch (error) {
    console.error('fillChoiceQuiz error:', error);
    throw error;
  }
}

// === 참/거짓(OX) 문제 입력 ===
async function fillOXQuiz(questionData) {
  try {
    await selectQuizTypeTab('ox');
    await fillQuestion(questionData.question);

    await wait(300);

    const radioButtons = document.querySelectorAll('label.ox input[type="radio"][name="check"]');
    if (radioButtons.length >= 2) {
      const answerIndex = questionData.answer === 'O' ? 0 : 1;
      radioButtons[answerIndex].checked = true;
      radioButtons[answerIndex].click();
      await wait(100);
    }

    await fillExplanation(questionData.explanation);
    return true;
  } catch (error) {
    console.error('fillOXQuiz error:', error);
    throw error;
  }
}

// === 단답형 문제 입력 ===
async function fillShortQuiz(questionData) {
  try {
    await selectQuizTypeTab('short');
    await fillQuestion(questionData.question);

    // 정답 입력
    const answerInput = document.querySelector('.vue-input-tag-wrapper input.new-tag');
    if (answerInput) {
      answerInput.value = questionData.answer;
      triggerVueEvent(answerInput);
      answerInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
      }));
      await wait(300);
    }

    // 유사정답 입력
    if (questionData.similarAnswers && questionData.similarAnswers.length > 0) {
      for (const similarAnswer of questionData.similarAnswers) {
        const tagInput = document.querySelector('.vue-input-tag-wrapper input.new-tag');
        if (tagInput) {
          tagInput.value = similarAnswer;
          triggerVueEvent(tagInput);
          tagInput.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
          }));
          await wait(200);
        }
      }
    }

    await fillExplanation(questionData.explanation);
    return true;
  } catch (error) {
    console.error('fillShortQuiz error:', error);
    throw error;
  }
}

// === 서술형 문제 입력 ===
async function fillEssayQuiz(questionData) {
  try {
    await selectQuizTypeTab('essay');
    await fillQuestion(questionData.question);

    // 모범답안 입력
    const modelAnswerInput = document.querySelector('textarea[placeholder*="모범"], textarea[placeholder*="답안"]');
    if (modelAnswerInput) {
      modelAnswerInput.value = questionData.modelAnswer || '';
      triggerVueEvent(modelAnswerInput);
      await wait(100);
    }

    // 해설란에 해설 입력
    await fillExplanation(questionData.explanation || questionData.gradingCriteria || '');
    return true;
  } catch (error) {
    console.error('fillEssayQuiz error:', error);
    throw error;
  }
}

// === 순서맞추기 문제 입력 ===
async function fillOrderQuiz(questionData) {
  try {
    console.log('[ORDER DEBUG] 시작 - questionData:', questionData);

    await selectQuizTypeTab('order');
    await fillQuestion(questionData.question);

    const items = questionData.items || [];
    const correctOrder = questionData.correctOrder || [];

    console.log('[ORDER DEBUG] items:', items, 'correctOrder:', correctOrder);

    await wait(300);

    // 필요한 만큼 보기 추가 (매번 버튼을 다시 찾아야 Vue 리렌더링 후에도 동작)
    console.log('[ORDER DEBUG] 보기 추가 시작 - 필요 개수:', items.length - 2);
    for (let i = 2; i < items.length; i++) {
      const addButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('보기 추가'));
      console.log(`[ORDER DEBUG] 보기 추가 버튼 (${i-1}번째):`, addButton ? '발견' : '없음');
      if (addButton) {
        addButton.click();
        await wait(400);
      } else {
        console.warn(`[ORDER DEBUG] 보기 추가 버튼을 찾지 못함 (${i-1}번째)`);
      }
    }

    await wait(300);

    // 보기 입력
    const itemInputs = document.querySelectorAll('input[placeholder*="보기 입력"]');
    console.log('[ORDER DEBUG] 보기 입력 필드 개수:', itemInputs.length, '/ 필요:', items.length);

    for (let i = 0; i < Math.min(items.length, itemInputs.length); i++) {
      itemInputs[i].value = items[i];
      triggerVueEvent(itemInputs[i]);
      console.log(`[ORDER DEBUG] 보기 ${i+1} 입력:`, items[i]);
      await wait(100);
    }

    if (itemInputs.length < items.length) {
      console.error(`[ORDER DEBUG] 보기 입력 필드 부족! 있음: ${itemInputs.length}, 필요: ${items.length}`);
    }

    await wait(500);

    // 정답 순서대로 체크박스 클릭 (여러 셀렉터 시도)
    console.log('[ORDER DEBUG] 체크박스 탐색 시작...');

    let orderCheckboxes = document.querySelectorAll('label.order input[type="checkbox"]');
    console.log('[ORDER DEBUG] 셀렉터1 (label.order input[checkbox]):', orderCheckboxes.length);

    if (orderCheckboxes.length === 0) {
      orderCheckboxes = document.querySelectorAll('.order input[type="checkbox"]');
      console.log('[ORDER DEBUG] 셀렉터2 (.order input[checkbox]):', orderCheckboxes.length);
    }
    if (orderCheckboxes.length === 0) {
      orderCheckboxes = document.querySelectorAll('input[type="checkbox"][name*="order"], input[type="checkbox"][id*="order"]');
      console.log('[ORDER DEBUG] 셀렉터3 (name/id*=order):', orderCheckboxes.length);
    }
    if (orderCheckboxes.length === 0) {
      // 추가 셀렉터: 모든 체크박스 찾아보기
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      console.log('[ORDER DEBUG] 페이지 전체 체크박스:', allCheckboxes.length);
      allCheckboxes.forEach((cb, idx) => {
        console.log(`[ORDER DEBUG] 체크박스 ${idx}:`, cb.outerHTML.substring(0, 100));
      });
    }

    console.log('[ORDER DEBUG] 최종 체크박스 개수:', orderCheckboxes.length, '/ 필요:', items.length);

    if (correctOrder.length > 0 && orderCheckboxes.length >= items.length) {
      console.log('[ORDER DEBUG] 체크박스 클릭 시작...');
      for (let clickOrder = 0; clickOrder < correctOrder.length; clickOrder++) {
        const itemIndex = correctOrder[clickOrder];
        console.log(`[ORDER DEBUG] 클릭 순서 ${clickOrder+1}: 인덱스 ${itemIndex}`);
        if (orderCheckboxes[itemIndex]) {
          orderCheckboxes[itemIndex].click();
          await wait(300);
        } else {
          console.error(`[ORDER DEBUG] 체크박스[${itemIndex}] 없음!`);
        }
      }
    } else {
      console.error('[ORDER DEBUG] 체크박스 클릭 스킵 - correctOrder:', correctOrder.length, 'checkboxes:', orderCheckboxes.length);
    }

    await fillExplanation(questionData.explanation);
    console.log('[ORDER DEBUG] 완료');
    return true;
  } catch (error) {
    console.error('[ORDER DEBUG] 에러:', error);
    throw error;
  }
}

// === 초성퀴즈 문제 입력 ===
async function fillInitialQuiz(questionData) {
  try {
    await selectQuizTypeTab('initial');
    await fillQuestion(questionData.question);

    const initialInput = document.querySelector('input[placeholder*="초성"]');
    if (initialInput) {
      initialInput.value = questionData.initial;
      triggerVueEvent(initialInput);
      await wait(100);
    }

    const answerInput = document.querySelector('input[placeholder*="정답"]');
    if (answerInput) {
      answerInput.value = questionData.answer;
      triggerVueEvent(answerInput);
      await wait(100);
    }

    await fillExplanation(questionData.explanation);
    return true;
  } catch (error) {
    console.error('fillInitialQuiz error:', error);
    throw error;
  }
}

// === 저장 버튼 클릭 ===
async function clickSaveButton() {
  const saveButton = document.querySelector('.text-center button.btn-primary');
  if (saveButton && saveButton.textContent.includes('저장')) {
    saveButton.click();
    await wait(1000);
    return true;
  }
  return false;
}

// === 퀴즈 추가 버튼 클릭 ===
async function clickAddQuizButton() {
  const addButton = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.includes('퀴즈 추가'));
  if (addButton) {
    addButton.click();
    await wait(1200);
    return true;
  }
  return false;
}

// === 현재 폼이 비어있는지 확인 ===
function isCurrentFormEmpty() {
  const questionInput = document.querySelector('textarea[placeholder*="질문 입력"]');
  if (!questionInput) return false;
  return questionInput.value.trim() === '';
}

// === v15: 글자순서바꾸기 폼에 단어 입력 ===
async function applyLetterReorderToForm(words) {
  console.log('[LETTER_REORDER DEBUG] 시작 - words:', words);

  // 퀴즈 리스트 찾기
  const quizList = document.querySelector('ol.quiz > li');
  if (!quizList) {
    throw new Error('퀴즈 폼을 찾을 수 없습니다 (ol.quiz > li)');
  }

  for (let i = 0; i < words.length; i++) {
    const { word, hint } = words[i];
    console.log(`[LETTER_REORDER DEBUG] ${i + 1}/${words.length} - 단어: ${word}, 힌트: ${hint}`);

    // 첫 번째 이후는 "단어 추가" 버튼 클릭
    if (i > 0) {
      const addBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('단어 추가'));
      if (addBtn) {
        console.log('[LETTER_REORDER DEBUG] 단어 추가 버튼 클릭');
        addBtn.click();
        await wait(400);
      } else {
        console.warn('[LETTER_REORDER DEBUG] 단어 추가 버튼을 찾지 못함');
      }
    }

    // 현재 DOM에서 입력 필드 찾기
    const allInputs = quizList.querySelectorAll('input.form-control');
    const wordInputs = [...allInputs].filter(el => el.placeholder && el.placeholder.includes('단어'));
    const hintInputs = [...allInputs].filter(el => el.placeholder && el.placeholder.includes('힌트'));

    console.log(`[LETTER_REORDER DEBUG] 단어 입력 필드: ${wordInputs.length}, 힌트 입력 필드: ${hintInputs.length}`);

    // 마지막 (새로 추가된) 입력 필드에 값 입력
    const wordInput = wordInputs[wordInputs.length - 1];
    const hintInput = hintInputs[hintInputs.length - 1];

    if (wordInput) {
      wordInput.value = word;
      triggerVueEvent(wordInput);
      console.log(`[LETTER_REORDER DEBUG] 단어 입력 완료: ${word}`);
      await wait(100);
    } else {
      console.error(`[LETTER_REORDER DEBUG] 단어 입력 필드를 찾지 못함 (인덱스: ${i})`);
    }

    if (hintInput) {
      hintInput.value = hint;
      triggerVueEvent(hintInput);
      console.log(`[LETTER_REORDER DEBUG] 힌트 입력 완료: ${hint}`);
      await wait(100);
    } else {
      console.error(`[LETTER_REORDER DEBUG] 힌트 입력 필드를 찾지 못함 (인덱스: ${i})`);
    }

    await wait(200);
  }

  console.log('[LETTER_REORDER DEBUG] 완료');
  return true;
}

// === v16: 가로세로퍼즐 폼에 입력 (멀티스텝 지원) ===
async function applyCrosswordToForm(crosswordData) {
  console.log('[CROSSWORD DEBUG] 시작 - crosswordData:', crosswordData);

  const { grid, hints, placedWords } = crosswordData;

  // 그리드 찾기
  const gridWrap = document.querySelector('.vertical_quiz_wrap');
  if (!gridWrap) {
    throw new Error('가로세로퍼즐 그리드를 찾을 수 없습니다 (.vertical_quiz_wrap)');
  }

  // 현재 단계 확인 (hold 클래스가 있으면 이미 2단계 이후)
  const isHoldMode = gridWrap.classList.contains('hold');
  console.log('[CROSSWORD DEBUG] 현재 모드:', isHoldMode ? '2/3단계 (hold)' : '1단계 (입력)');

  // === 1단계: 그리드에 글자 입력 ===
  if (!isHoldMode) {
    console.log('[CROSSWORD DEBUG] 1단계 - 그리드에 글자 입력 시작...');
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const letter = grid[row][col];
        if (letter && letter.trim() !== '') {
          // 셀 찾기 (data-row/data-col은 1-based)
          const cell = gridWrap.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`);

          if (cell) {
            const input = cell.querySelector('input');
            if (input && !input.readOnly) {
              input.value = letter;
              triggerVueEvent(input);
              console.log(`[CROSSWORD DEBUG] 셀(${row + 1},${col + 1})에 "${letter}" 입력`);
            }
          }
        }
      }
    }

    await wait(500);

    // === 2단계로 전환: "힌트 입력하기" 버튼 클릭 ===
    console.log('[CROSSWORD DEBUG] "힌트 입력하기" 버튼 찾는 중...');
    const hintButton = document.querySelector('button.input_hint_go:not(.d-none)');
    if (hintButton) {
      console.log('[CROSSWORD DEBUG] "힌트 입력하기" 버튼 클릭');
      hintButton.click();
      await wait(800); // Vue 렌더링 대기
    } else {
      console.warn('[CROSSWORD DEBUG] "힌트 입력하기" 버튼을 찾지 못함 - 이미 2단계일 수 있음');
    }
  }

  // === 3단계: 힌트 입력 ===
  console.log('[CROSSWORD DEBUG] 3단계 - 힌트 입력 시작...');

  // 힌트 영역이 표시될 때까지 대기
  await wait(500);

  // DOM에서 힌트 목록 가져오기 (숫자 순으로 정렬)
  const horizontalHintRows = [...document.querySelectorAll('.horizontal-hint-list')];
  const verticalHintRows = [...document.querySelectorAll('.vertical-hint-list')];

  console.log(`[CROSSWORD DEBUG] DOM 가로 힌트 영역: ${horizontalHintRows.length}개`);
  console.log(`[CROSSWORD DEBUG] DOM 세로 힌트 영역: ${verticalHintRows.length}개`);
  console.log(`[CROSSWORD DEBUG] 입력할 가로 힌트: ${hints.horizontal.length}개`);
  console.log(`[CROSSWORD DEBUG] 입력할 세로 힌트: ${hints.vertical.length}개`);

  // 우리 힌트를 위치 순으로 정렬 (그리드 스캔 순서: 위→아래, 왼쪽→오른쪽)
  const sortedHorizontal = [...hints.horizontal].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  const sortedVertical = [...hints.vertical].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  // 가로 힌트 입력 (위치 순서대로)
  console.log('[CROSSWORD DEBUG] 가로 힌트 입력...');
  for (let i = 0; i < Math.min(horizontalHintRows.length, sortedHorizontal.length); i++) {
    const hintRow = horizontalHintRows[i];
    const hintData = sortedHorizontal[i];
    const hintInput = hintRow.querySelector('input.hints');

    if (hintInput) {
      hintInput.value = hintData.hint;
      triggerVueEvent(hintInput);
      console.log(`[CROSSWORD DEBUG] 가로 힌트 ${i + 1} (${hintData.word}): "${hintData.hint}"`);
      await wait(100);
    } else {
      console.warn(`[CROSSWORD DEBUG] 가로 힌트 ${i + 1} 입력 필드를 찾지 못함`);
    }
  }

  await wait(200);

  // 세로 힌트 입력 (위치 순서대로)
  console.log('[CROSSWORD DEBUG] 세로 힌트 입력...');
  for (let i = 0; i < Math.min(verticalHintRows.length, sortedVertical.length); i++) {
    const hintRow = verticalHintRows[i];
    const hintData = sortedVertical[i];
    const hintInput = hintRow.querySelector('input.hints');

    if (hintInput) {
      hintInput.value = hintData.hint;
      triggerVueEvent(hintInput);
      console.log(`[CROSSWORD DEBUG] 세로 힌트 ${i + 1} (${hintData.word}): "${hintData.hint}"`);
      await wait(100);
    } else {
      console.warn(`[CROSSWORD DEBUG] 세로 힌트 ${i + 1} 입력 필드를 찾지 못함`);
    }
  }

  await wait(300);

  // === "확인" 버튼 클릭 ===
  console.log('[CROSSWORD DEBUG] "확인" 버튼 찾는 중...');
  const confirmButton = document.querySelector('button.confirmQuiz');
  if (confirmButton) {
    console.log('[CROSSWORD DEBUG] "확인" 버튼 클릭');
    confirmButton.click();
    await wait(500);
  } else {
    console.warn('[CROSSWORD DEBUG] "확인" 버튼을 찾지 못함');
  }

  console.log('[CROSSWORD DEBUG] 완료 - 배치된 단어:', placedWords ? placedWords.length : '알 수 없음');
  return true;
}

// === 유형별 폼 입력 함수 맵 ===
const formFillers = {
  ox: fillOXQuiz,
  choice: fillChoiceQuiz,
  short: fillShortQuiz,
  essay: fillEssayQuiz,
  order: fillOrderQuiz,
  initial: fillInitialQuiz
};

// ========== src/ui.js ==========
/**
 * SamQuiz AI v18 - UI 이벤트 핸들러
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가
 */

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
function createChatbotUI() {
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
function addMessage(content, isUser = false, isHtml = false, type = null) {
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


// ========== 초기화 ==========
(function initSamQuizAI() {
  // 상태 초기화 (localStorage에서 설정 로드)
  initState();

  // UI 생성
  createChatbotUI();

  // 콘솔 로그
  console.log('%cSamQuiz AI v18 로드 완료!', 'color: #5676ff; font-size: 16px; font-weight: bold;');
  console.log('%c우측 하단 버튼을 클릭하세요!', 'color: #666; font-size: 14px;');

  // v18: API 키 미설정 시 안내
  if (!getApiKey()) {
    console.log('%c⚠️ API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.', 'color: #f59e0b; font-size: 12px;');
  }

  // 전역 객체 노출 (디버깅용)
  window.SamQuizAI = {
    state,
    addMessage,
    toggleChatbot: () => document.getElementById('chatbot-button').click()
  };
})();

})();
