// 絞り込みのボタン（[data-filter="…"]）。押したボタンに is-active と aria-pressed="true" を付け、値を知らせる
// 一覧（event-log.js）と、つまずいたことの索引（event-struggles.js）が使う

/**
 * @param {HTMLElement[]} buttons  data-filter を持つボタン
 * @param {(value: string) => void} onChange  押されたボタンの data-filter の値
 */
export function setupFilterButtons(buttons, onChange) {
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const b of buttons) {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      }
      onChange(button.dataset.filter);
    });
  }
}
