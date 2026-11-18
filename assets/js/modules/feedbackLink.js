// フィードバック・お問い合わせ（config.js の FEEDBACK_URL）へのリンク
//   HTML の [data-feedback-link] の href を FEEDBACK_URL にする
//   展示モードでは [data-feedback] の囲みごと隠す（Google フォームに移ると、無操作で Top に戻る仕組みが働かないため）
import { FEEDBACK_URL } from './config.js';

/** @param {{ kiosk: boolean, root?: ParentNode }} options */
export function setupFeedbackLinks({ kiosk, root = document }) {
  for (const link of root.querySelectorAll('[data-feedback-link]')) link.href = FEEDBACK_URL;
  if (kiosk) for (const box of root.querySelectorAll('[data-feedback]')) box.classList.add('u-hidden');
}
