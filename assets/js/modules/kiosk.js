// 展示モード（?kiosk=1 のときだけ）。判定と、展示で使う時間の定数をここにまとめる。
//   ?kiosk=1 で開始、?kiosk=0 で解除。sessionStorage に残すので、ページを移っても続く
//   ?kiosk=1&fast=1 で時間を 10 分の 1 にする（確認用）

export const AUTO_ADVANCE_MS = 15000; // Top：次の画面へ自動で進む間隔（2026-11-14 に 30秒 → 15秒）
export const RESUME_AFTER_MS = 30000; // Top：操作が止まってから自動送りを再開するまで
export const IDLE_RETURN_MS = 180000; // Top 以外（ヘルプ）：操作が無ければ Top に戻るまで
export const CHATBOT_RESET_MS = 180000; // チャットボット：操作が無ければ閉じて最初の状態に戻すまで
const FAST_SCALE = 0.1;

const STORAGE_KEY = 'evecre:kiosk';
// 保存する値：'1'（展示モード）/ 'fast'（展示モード・時間 10 分の 1）
let mode = null;

function readMode() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('kiosk');
  if (param === '1') {
    const value = params.get('fast') === '1' ? 'fast' : '1';
    save(value);
    return value;
  }
  if (param === '0') {
    save(null);
    return null;
  }
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function save(value) {
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, value);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 保存できなくても、このページの中では URL の指定どおりに動く
  }
}

function currentMode() {
  if (mode === null) mode = readMode() ?? '';
  return mode;
}

export function isKiosk() {
  return currentMode() !== '';
}

function isFast() {
  return currentMode() === 'fast';
}

/** 展示の時間（fast のときは 10 分の 1） */
export function kioskTime(ms) {
  return isFast() ? ms * FAST_SCALE : ms;
}

/** 展示モードの Top の URL（fast も引き継ぐ） */
export function kioskTopUrl() {
  return isFast() ? '/?kiosk=1&fast=1' : '/?kiosk=1';
}
