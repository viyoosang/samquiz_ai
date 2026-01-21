/**
 * SamQuiz AI v18 - API 호출 및 프롬프트 생성
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 요청사항"으로 변경
 * v18: 사용자가 API 키를 직접 입력하는 기능 추가
 */

import { GEMINI_API_URL, LETTER_REORDER_CONFIG, CROSSWORD_CONFIG } from './config.js';
import { state, settings, getApiKey } from './state.js';

// === Gemini API 호출 ===
export async function callGeminiAPI(options) {
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

  // 응답 구조 안전 체크
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) {
    const errorMsg = data?.error?.message || '응답을 받지 못했습니다. 다시 시도해주세요.';
    throw new Error(errorMsg);
  }

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
export function generatePrompt(topic, count, quizType, level) {
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
export function generateMixedPrompt(topic, sequence, level) {
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
export function generateLetterReorderPrompt(topic, count, level) {
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
export async function callGeminiAPIForLetterReorder(options) {
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

  // 응답 구조 안전 체크
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) {
    const errorMsg = data?.error?.message || '응답을 받지 못했습니다. 다시 시도해주세요.';
    throw new Error(errorMsg);
  }

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
export function generateCrosswordPrompt(topic, count, level) {
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
export function placeCrosswordWords(words, targetCount = null) {
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
export async function callGeminiAPIForCrossword(options) {
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

  // 응답 구조 안전 체크
  const responseParts = data?.candidates?.[0]?.content?.parts;
  if (!responseParts || responseParts.length === 0) {
    const errorMsg = data?.error?.message || '응답을 받지 못했습니다. 다시 시도해주세요.';
    throw new Error(errorMsg);
  }

  // Gemini thinking mode: 여러 parts 중 text가 있는 것을 찾음
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
