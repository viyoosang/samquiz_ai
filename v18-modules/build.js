/**
 * SamQuiz AI v18 - 빌드 스크립트
 *
 * v15: 글자순서바꾸기 퀴즈 폼 지원 추가
 * v16: 가로세로퍼즐 퀴즈 폼 지원 추가
 * v17: 파일 첨부 시 텍스트 입력 역할을 "추가 지시"로 변경
 * v18: 사용자 API 키 입력 기능 추가 (정식 개발 시 기본 삽입 예정)
 *
 * 사용법: node build.js
 */

const fs = require('fs');
const path = require('path');

// v12: 외부 라이브러리 없음
const libraryFiles = [];

// 소스 파일 순서 (의존성 순서대로)
const sourceFiles = [
  'src/config.js',
  'src/utils.js',
  'src/state.js',
  'src/styles.js',
  'src/templates.js',
  'src/api.js',
  'src/form.js',
  'src/ui.js'
];

// 헤더 주석
const header = `/**
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
 * 빌드 정보: ${new Date().toISOString()}
 */

`;

// 빌드 함수
function build() {
  console.log('SamQuiz AI v18 빌드 시작...\n');

  let combinedCode = '';

  // 외부 라이브러리 포함 (v11: 없음)
  libraryFiles.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ 라이브러리 없음: ${file}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    combinedCode += `\n// ========== ${file} ==========\n`;
    combinedCode += content;

    console.log(`📦 ${file} (라이브러리)`);
  });

  // 각 파일 읽기 및 처리
  sourceFiles.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ 파일 없음: ${file}`);
      process.exit(1);
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // import/export 문 제거 (IIFE 내부에서는 불필요)
    // 1. import 문 제거 (한 줄 또는 여러 줄)
    content = content
      // import { ... } from '...' 형태 (여러 줄 포함)
      .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]*['"];?\s*/g, '')
      // import ... from '...' 형태 (default import)
      .replace(/import\s+\w+\s+from\s*['"][^'"]*['"];?\s*/g, '')
      // import '...' 형태 (side-effect import)
      .replace(/import\s*['"][^'"]*['"];?\s*/g, '')
      // export { ... } 형태
      .replace(/export\s*\{[\s\S]*?\};?\s*/g, '')
      // export default 형태
      .replace(/export\s+default\s+/g, '')
      // export const/let/var/function/class/async 형태
      .replace(/export\s+(const|let|var|function|class|async)\s+/g, '$1 ');

    combinedCode += `\n// ========== ${file} ==========\n`;
    combinedCode += content;

    console.log(`✅ ${file}`);
  });

  // 초기화 코드 추가
  const initCode = `
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
`;

  // IIFE로 감싸기
  const finalCode = header + `(function() {
  'use strict';
${combinedCode}
${initCode}
})();
`;

  // dist 폴더 생성
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
  }

  // 파일 쓰기
  const outputPath = path.join(distPath, 'samquiz-ai-chatbot-v18.js');
  fs.writeFileSync(outputPath, finalCode, 'utf8');

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`\n✅ 빌드 완료!`);
  console.log(`📁 출력: dist/samquiz-ai-chatbot-v18.js (${sizeKB} KB)`);
  console.log(`\n이 파일을 F12 콘솔에 붙여넣어 테스트하세요.`);
}

// 실행
build();
