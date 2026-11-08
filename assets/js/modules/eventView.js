// イベントの表示で、一覧と詳細が共通で使うもの
import { safeUrl } from './format.js';

export const NO_IMAGE_SRC = '/assets/img/event-log/no-image.svg';

export const STATUS_LABEL = {
  upcoming: '告知',
  archive: 'アーカイブ',
};

/** 画像を入れる。URL が無い・読めないときは代わりの画像 */
export function setImage(img, url) {
  img.addEventListener('error', () => {
    if (!img.src.endsWith(NO_IMAGE_SRC)) img.src = NO_IMAGE_SRC;
  });
  img.src = safeUrl(url) ?? NO_IMAGE_SRC;
}

/** 状態のラベル（告知 / アーカイブ）。見た目は --upcoming / --archive の modifier で変える */
export function setStatusLabel(el, blockClass, status) {
  const key = status === 'archive' ? 'archive' : 'upcoming';
  el.textContent = STATUS_LABEL[key];
  el.classList.add(`${blockClass}__label--${key}`);
}

/**
 * 振り返りの判定。success だけが「うまくいった」、struggle と null は「つまずいた」（本体と同じ分け方）
 * ★判定の分け方はここだけに書く（詳細の見出し・判定の表示・つまずいた記録の索引が、すべてここを使う）
 * @returns {'success' | 'struggle'}
 */
export function outcomeKey(item) {
  return item?.outcome === 'success' ? 'success' : 'struggle';
}
