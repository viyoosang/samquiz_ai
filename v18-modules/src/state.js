/**
 * SamQuiz AI v18 - 상태 관리
 *
 * v10: 파일 드래그앤드롭 지원
 * v18: 사용자 API 키 입력 기능 추가
 */

import {
  DEFAULT_TYPE_CONFIG,
  DEFAULT_PRESET_DATA,
  DEFAULT_SETTINGS,
  DEFAULT_SEQUENCE,
  DEFAULT_GEMINI_API_KEY,
  PRESET_VERSION,
  STORAGE_KEYS
} from './config.js';

// === 앱 상태 ===
export const state = {
  isOpen: false,
  isGenerating: false,
  isApplying: false,
  currentQuestions: null,
  conversation: [],
  uploadedFile: null,        // PDF/이미지용 (base64)
  uploadedFileName: null,
  showSettings: false,
  // v19: 취소 기능
  isCancelled: false,
  abortController: null
};

// === v19: 취소 관련 헬퍼 함수 ===
export function resetCancellation() {
  state.isCancelled = false;
  state.abortController = null;
}

export function requestCancellation() {
  state.isCancelled = true;
  if (state.abortController) {
    state.abortController.abort();
  }
}

export function shouldCancel() {
  return state.isCancelled;
}

export function createAbortController() {
  state.abortController = new AbortController();
  return state.abortController.signal;
}

// === (하위 호환) 유형별 문제 수 상태 ===
export let typeConfig = { ...DEFAULT_TYPE_CONFIG };

// === v9: 문제 시퀀스 상태 ===
export let quizSequence = DEFAULT_SEQUENCE.map((item, i) => ({
  ...item,
  id: `seq_init_${i}`
}));
let sequenceIdCounter = 0;

// === 프리셋 데이터 ===
export let presetData = JSON.parse(JSON.stringify(DEFAULT_PRESET_DATA));

// === 설정 데이터 ===
export let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

// === v18: API 키 상태 ===
export let geminiApiKey = DEFAULT_GEMINI_API_KEY;

// === 깊은 병합 함수 ===
export function deepMerge(target, source) {
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
export function addSequenceItem(type) {
  const id = `seq_${++sequenceIdCounter}_${Date.now()}`;
  quizSequence.push({ type, id });
  return id;
}

export function removeSequenceItem(id) {
  quizSequence = quizSequence.filter(item => item.id !== id);
}

export function moveSequenceItem(fromIndex, toIndex) {
  if (fromIndex < 0 || toIndex < 0 ||
      fromIndex >= quizSequence.length ||
      toIndex >= quizSequence.length) return;

  const [item] = quizSequence.splice(fromIndex, 1);
  quizSequence.splice(toIndex, 0, item);
}

export function setSequence(newSequence) {
  quizSequence = newSequence.map((item, i) => ({
    ...item,
    id: item.id || `seq_${++sequenceIdCounter}_${Date.now()}`
  }));
}

export function clearSequence() {
  quizSequence = [];
}

export function getSequence() {
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
export function loadPresetData() {
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
export function savePresetData() {
  try {
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(presetData));
  } catch (e) {
    console.error('저장된 설정 저장 실패:', e);
  }
}

// === 설정 로드 ===
export function loadSettings() {
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
export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch (e) {
    console.error('설정 저장 실패:', e);
  }
}

// === 설정 초기화 ===
export function resetSettings() {
  settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  saveSettings();
}

// === v18: API 키 로드 ===
export function loadApiKey() {
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
export function saveApiKey(key) {
  try {
    geminiApiKey = key;
    localStorage.setItem(STORAGE_KEYS.apiKey, key);
  } catch (e) {
    console.error('API 키 저장 실패:', e);
  }
}

// === v18: API 키 가져오기 ===
export function getApiKey() {
  return geminiApiKey;
}

// === 현재 설정 가져오기 ===
export function getCurrentConfig() {
  return {
    version: PRESET_VERSION,
    sequence: quizSequence.map(item => ({ type: item.type })),
    level: document.querySelector('#level-segment .sqai-seg-btn.active')?.dataset.value || 'middle'
  };
}

// === 설정 적용 ===
export function applyConfig(config) {
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
export function saveLastUsedConfig() {
  if (presetData.rememberLastUsed) {
    presetData.lastUsedConfig = getCurrentConfig();
    savePresetData();
  }
}

// === typeConfig 업데이트 ===
export function updateTypeConfig(type, value) {
  typeConfig[type] = value;
}

// === presetData 업데이트 ===
export function updatePresetData(updates) {
  presetData = { ...presetData, ...updates };
}

// === 초기화 ===
export function initState() {
  loadPresetData();
  loadSettings();
  loadApiKey();  // v18: API 키 로드
}
