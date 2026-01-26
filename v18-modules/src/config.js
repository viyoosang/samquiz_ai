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
export const DEFAULT_GEMINI_API_KEY = '';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// === v9: 문제 유형 라벨 ===
export const TYPE_NAMES = {
  ox: 'OX형',
  choice: '선택형',
  short: '단답형',
  essay: '서술형',
  order: '순서완성형',
  initial: '초성퀴즈형'
};

// === 학교급 라벨 ===
export const LEVEL_NAMES = {
  elementary: '초등',
  middle: '중고등'
};

// === 문제 유형 목록 (UI 버튼 순서) ===
export const QUIZ_TYPES = ['ox', 'choice', 'short', 'essay', 'order', 'initial'];

// === v15: 폼 타입 (페이지별 구분) ===
export const FORM_TYPES = {
  standard: 'standard',         // 기존 6개 유형 (OX, 선택, 단답, 서술, 순서, 초성)
  letterReorder: 'letterReorder', // 글자순서바꾸기
  crossword: 'crossword'        // 가로세로퍼즐 (v16 예정)
};

// === v15: 글자순서바꾸기 설정 ===
export const LETTER_REORDER_CONFIG = {
  minWords: 2,
  maxWords: 10,
  defaultWords: 5,
  maxWordLength: 10,
  maxHintLength: 100
};

// === v16: 가로세로퍼즐 설정 ===
export const CROSSWORD_CONFIG = {
  gridSize: 10,           // 10x10 고정 그리드
  minWords: 3,            // 최소 단어 수
  maxWords: 10,           // 최대 단어 수
  defaultWords: 5,        // 기본 단어 수
  maxWordLength: 10,      // 단어 최대 길이 (그리드 크기 제한)
  maxHintLength: 100      // 힌트 최대 길이
};

// === v13: 기본 시퀀스 (OX, 선택, 단답) ===
export const DEFAULT_SEQUENCE = [
  { type: 'ox' },
  { type: 'choice' },
  { type: 'short' }
];

// === 프리셋 버전 (마이그레이션용) ===
export const PRESET_VERSION = 2;

// === (하위 호환) 유형별 문제 수 기본값 ===
export const DEFAULT_TYPE_CONFIG = {
  ox: 0,
  choice: 3,
  short: 0,
  essay: 0,
  order: 0,
  initial: 0
};

// === 프리셋(저장된 설정) 기본 데이터 ===
export const DEFAULT_PRESET_DATA = {
  version: PRESET_VERSION,
  presets: [],
  lastUsedConfig: {
    sequence: [...DEFAULT_SEQUENCE],
    level: 'elementary'
  },
  rememberLastUsed: true
};

// === v9 설정 기본값 (프롬프트 규칙) ===
export const DEFAULT_SETTINGS = {
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
      '교과서 표준 용어만 사용 (동의어 혼용 금지)',
      '지도서 전용 용어 사용 금지 - 교사용 지도팁, 수업 재구성팁, 지도계획, 단원차시계획의 용어는 출제에 사용하지 않음',
      '학생이 교과서 본문에서 직접 볼 수 있는 표현만 발문/보기/정답에 활용'
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
export const STORAGE_KEYS = {
  settings: 'samquiz-ai-settings-v18',
  presets: 'samquiz-ai-presets-v18',
  apiKey: 'samquiz-ai-apikey-v18'  // v18: 사용자 API 키 저장
};
