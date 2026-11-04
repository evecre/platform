// イベクリのキャラクター（mizu / mori / iwa）。体の上に白目と虹彩を重ね、CSS で瞬き・目線を動かす
//   見た目と目の位置は object/component/_character.css。ここは要素を組み立てるだけ
//   pickCharacter() はページを読み込むたびに1体を選ぶ（同じページの中では同じ1体を返す）

const IMG_BASE = '/assets/img/character';

export const CHARACTERS = [
  { id: 'mizu', body: 'character-mizu-body.svg', iris: 'character-mizu-iris.svg' },
  { id: 'mori', body: 'character-mori-body.svg', iris: 'character-mori-iris.svg' },
  { id: 'iwa', body: 'character-iwa-body.svg', iris: 'character-iwa-iris.svg' },
];

let picked = null;

export function pickCharacter() {
  if (!picked) picked = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  return picked;
}

/**
 * @param {{ id: string, body: string, iris: string }} ch
 * @param {{ className?: string }} [options]  外側に足すクラス（置き場所を決める親の __要素名など）
 * @returns {HTMLElement}
 */
export function createCharacter(ch, { className = '' } = {}) {
  const root = document.createElement('span');
  root.className = `c-character c-character--${ch.id}${className ? ` ${className}` : ''}`;
  root.setAttribute('aria-hidden', 'true');

  const face = document.createElement('span');
  face.className = 'c-character__face';
  face.append(
    image('c-character__eye', 'character-eye.svg'),
    image('c-character__iris', ch.iris),
  );
  root.append(image('c-character__body', ch.body), face);
  return root;
}

function image(className, file) {
  const img = document.createElement('img');
  img.className = className;
  img.src = `${IMG_BASE}/${file}`;
  img.alt = '';
  img.decoding = 'async';
  return img;
}
