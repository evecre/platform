// CSS の変数を JS から読む（動きの時間・数を JS に直書きしないため。値は foundation/_motion.css）
//   ★calc() を使う変数は、foundation/_motion.css の @property で型（<time> / <number>）を登録しておくこと（登録しないと計算前の文字のまま返る）

/** 時間の変数（"0.8s" / "800ms"）を ms で。無い・読めないときは fallback */
export function readCssTime(el, name, fallback = 0) {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return value.endsWith('ms') ? n : n * 1000;
}

/** 数の変数。無い・読めないときは fallback */
export function readCssNumber(el, name, fallback = 0) {
  const n = Number.parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}
