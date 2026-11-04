// チャットボットの判定（DOM に依存しない）。質問を受けて「答える / もしかして / 答えない」を決める
//   1位の点数 ≥ THRESHOLD_ANSWER（かつ 2位との差 ≥ MIN_MARGIN） → answer
//   1位の点数 ≥ THRESHOLD_SUGGEST                                → suggest（もしかして。上位3件）
//   それ未満                                                     → fallback（カテゴリ選択に戻す）
import { createNormalizer } from './normalize.js';
import { createMatcher } from './matcher.js';

export const THRESHOLD_ANSWER = 0.55;
export const THRESHOLD_SUGGEST = 0.3;
export const MIN_MARGIN = 0.05; // 1位と2位の差がこれより小さいと、どちらか決めきれないので suggest にする

/**
 * @param {{
 *   faq: { categories: object[], items: object[] },
 *   synonyms?: object,
 *   scorer?: object,
 *   thresholds?: { answer?: number, suggest?: number, margin?: number },
 *   onUnanswered?: (record: { query: string, type: string, top: object[] }) => void,
 * }} options
 */
export function createEngine({ faq, synonyms = {}, scorer, thresholds = {}, onUnanswered }) {
  const answerAt = thresholds.answer ?? THRESHOLD_ANSWER;
  const suggestAt = thresholds.suggest ?? THRESHOLD_SUGGEST;
  const margin = thresholds.margin ?? MIN_MARGIN;

  const normalize = createNormalizer(synonyms);
  const matcher = createMatcher(faq, { normalize, scorer });
  const byId = new Map(faq.items.map((item) => [item.id, item]));
  const unanswered = []; // 答えられなかった質問（メモリ上だけ。外部には送らない）

  /**
   * @param {string} query
   * @returns {{ type: 'answer', item: object, top: object[] }
   *         | { type: 'suggest', items: object[], top: object[] }
   *         | { type: 'fallback', top: object[] }}
   */
  function ask(query) {
    const top = matcher.match(query);
    const [first, second] = top;
    let result;
    if (first && first.score >= answerAt && (!second || first.score - second.score >= margin)) {
      result = { type: 'answer', item: byId.get(first.id), top };
    } else if (first && first.score >= suggestAt) {
      const items = top.filter((t) => t.score > 0).map((t) => byId.get(t.id));
      result = { type: 'suggest', items, top };
    } else {
      result = { type: 'fallback', top };
    }
    if (result.type !== 'answer') {
      const record = { query, type: result.type, top };
      unanswered.push(record);
      onUnanswered?.(record);
    }
    return result;
  }

  return {
    ask,
    getItem: (id) => byId.get(id) ?? null,
    categories: faq.categories,
    /** カテゴリを選んだときの候補（featured のもの） */
    featured: (categoryId) => faq.items.filter((item) => item.category === categoryId && item.featured),
    unanswered: () => [...unanswered],
    normalize,
  };
}
