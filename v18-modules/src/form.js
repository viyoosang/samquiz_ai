/**
 * SamQuiz AI v16 - 폼 입력 함수
 *
 * 샘퀴즈 어드민 페이지의 폼에 문제를 자동 입력하는 함수들
 * v15: 글자순서바꾸기 폼 입력 지원 추가
 * v16: 가로세로퍼즐 폼 입력 지원 추가
 */

import { wait, triggerVueEvent } from './utils.js';

// === 퀴즈 유형 탭 선택 ===
export async function selectQuizTypeTab(quizType) {
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
export async function fillQuestion(questionText) {
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
export async function fillExplanation(explanationText) {
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
export async function fillChoiceQuiz(questionData) {
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
export async function fillOXQuiz(questionData) {
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
export async function fillShortQuiz(questionData) {
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
export async function fillEssayQuiz(questionData) {
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
export async function fillOrderQuiz(questionData) {
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
export async function fillInitialQuiz(questionData) {
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
export async function clickSaveButton() {
  const saveButton = document.querySelector('.text-center button.btn-primary');
  if (saveButton && saveButton.textContent.includes('저장')) {
    saveButton.click();
    await wait(1000);
    return true;
  }
  return false;
}

// === 퀴즈 추가 버튼 클릭 ===
export async function clickAddQuizButton() {
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
export function isCurrentFormEmpty() {
  const questionInput = document.querySelector('textarea[placeholder*="질문 입력"]');
  if (!questionInput) return false;
  return questionInput.value.trim() === '';
}

// === v15: 글자순서바꾸기 폼에 단어 입력 ===
export async function applyLetterReorderToForm(words) {
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
export async function applyCrosswordToForm(crosswordData) {
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
export const formFillers = {
  ox: fillOXQuiz,
  choice: fillChoiceQuiz,
  short: fillShortQuiz,
  essay: fillEssayQuiz,
  order: fillOrderQuiz,
  initial: fillInitialQuiz
};
