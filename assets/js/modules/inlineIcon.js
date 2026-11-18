// 文の中のアイコン（ヘルプの記事・チャットボットの答え）
//   データの文に [icon:名前] と書くと、その場所に assets/img/icon/icon-名前.svg を出す（例：「[icon:home-plus]イベントを作成」）
//   文字は textContent で入れ、画像は img（alt は空。ボタン名は文に書く）。無い名前は check:help / check:faq が誤りにする
//   検索・判定では stripIconTokens() で印を外してから比べる

export const ICON_TOKEN_RE = /\[icon:([a-z0-9-]+)\]/g;
export const ICON_DIR = '/assets/img/icon';

export const iconSrc = (name) => `${ICON_DIR}/icon-${name}.svg`;

/** [icon:…] の印を外した文（検索・判定・title 属性など） */
export function stripIconTokens(text) {
  return String(text ?? '').replace(ICON_TOKEN_RE, '');
}

/** 文に出てくるアイコンの名前（検査用） */
export function iconNames(text) {
  return [...String(text ?? '').matchAll(ICON_TOKEN_RE)].map((m) => m[1]);
}

/**
 * parent の中身を、文とアイコンで置き換える
 * @param {Element} parent
 * @param {string} text
 */
export function setRichText(parent, text) {
  const nodes = [];
  let last = 0;
  const source = String(text ?? '');
  for (const m of source.matchAll(ICON_TOKEN_RE)) {
    if (m.index > last) nodes.push(document.createTextNode(source.slice(last, m.index)));
    const img = document.createElement('img');
    img.className = 'c-inline-icon';
    img.src = iconSrc(m[1]);
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove()); // 壊れた画像のマークを見せない
    nodes.push(img);
    last = m.index + m[0].length;
  }
  if (last < source.length) nodes.push(document.createTextNode(source.slice(last)));
  parent.replaceChildren(...nodes);
}
