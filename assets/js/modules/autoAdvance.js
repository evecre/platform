// Top の自動送り（展示モードのときだけ使う）
//   一定間隔で次の画面へ。最後まで行ったら最初へ
//   ユーザーが操作したら止め、操作が止まって一定時間たったら再開する
//   チャットボットを開いている間は止める（chatbot:open / chatbot:close を document で聞く）
// 操作に scroll を含めないのは、自動送り自身のスクロールで止まらないようにするため
import { AUTO_ADVANCE_MS, RESUME_AFTER_MS, kioskTime } from './kiosk.js';

const ACTIVITY_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/**
 * @param {{ next: () => void, goTo: (index: number, options?: { instant?: boolean }) => void, current: () => number, count: number }} stage
 */
export function startAutoAdvance(stage) {
  let advanceTimer = 0;
  let resumeTimer = 0;
  let chatbotOpen = false;

  // 最初へ戻るときは瞬時に（なめらかに戻すと、途中の画面が全部流れて見えるため）
  function advance() {
    if (stage.current() >= stage.count - 1) stage.goTo(0, { instant: true });
    else stage.next();
  }

  function play() {
    window.clearInterval(advanceTimer);
    advanceTimer = window.setInterval(advance, kioskTime(AUTO_ADVANCE_MS));
  }

  function stop() {
    window.clearInterval(advanceTimer);
    window.clearTimeout(resumeTimer);
  }

  // 操作が止まって RESUME_AFTER_MS たったら、すぐ1つ進めてから自動送りに戻る
  function pauseThenResume() {
    stop();
    if (chatbotOpen) return;
    resumeTimer = window.setTimeout(() => {
      advance();
      play();
    }, kioskTime(RESUME_AFTER_MS));
  }

  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, pauseThenResume, { passive: true, capture: true });
  }
  document.addEventListener('chatbot:open', () => {
    chatbotOpen = true;
    stop();
  });
  document.addEventListener('chatbot:close', () => {
    chatbotOpen = false;
    pauseThenResume();
  });

  play();
}
