// 質問が、どの FAQ にどれだけ近いかを点数にする（DOM に依存しない）
//   1件の点数 ＝ question と patterns の中で一番近いものの点数 ＋ keywords が質問に含まれるごとに加点
//   （質問が keyword そのものだけなら、近さは 1 とする）
// 近さの測り方（scorer）は差し替えられる。既定は「2文字ずつの重なり（Dice 係数）」。
// 将来、意味検索の scorer を作ったら combineScorers([...]) で混ぜられる。
import { bigrams } from './normalize.js';

export const KEYWORD_BONUS = 0.1; // keywords が1つ含まれるごとの加点
export const TOP_N = 3;

/**
 * scorer の形：
 *   prepare(raw, normalized) → 比べるための下ごしらえ（FAQ 側は読み込み時に1回だけ呼ぶ）
 *   similarity(queryPrepared, entryPrepared) → 0〜1
 */
export const bigramScorer = {
  prepare: (_raw, normalized) => bigrams(normalized),
  similarity(a, b) {
    if (!a.size || !b.size) return 0;
    let shared = 0;
    for (const gram of a) if (b.has(gram)) shared++;
    return (2 * shared) / (a.size + b.size);
  },
};

/**
 * いくつかの scorer を、重み付きの平均で1つにする
 * @param {{ scorer: object, weight: number }[]} parts
 */
export function combineScorers(parts) {
  const total = parts.reduce((sum, p) => sum + p.weight, 0) || 1;
  return {
    prepare: (raw, normalized) => parts.map((p) => p.scorer.prepare(raw, normalized)),
    similarity: (a, b) => parts.reduce((sum, p, i) => sum + p.weight * p.scorer.similarity(a[i], b[i]), 0) / total,
  };
}

/**
 * @param {{ items: object[] }} faq
 * @param {{ normalize: (text: string) => string, scorer?: object }} options
 */
export function createMatcher(faq, { normalize, scorer = bigramScorer }) {
  // 読み込み時に、全 FAQ の question と patterns を下ごしらえしておく
  const prepared = faq.items.map((item) => ({
    id: item.id,
    entries: [item.question, ...(item.patterns ?? [])]
      .filter((text) => typeof text === 'string' && text)
      .map((text) => scorer.prepare(text, normalize(text))),
    // 類義語で同じ語になったものは1つにまとめる（ナレッジ → 公開 などで二重に加点しない）
    keywords: [...new Set((item.keywords ?? []).map(normalize).filter(Boolean))],
  }));

  /**
   * @param {string} query
   * @returns {{ id: string, score: number }[]}  点数の高い順に TOP_N 件
   */
  function match(query) {
    const normalized = normalize(query);
    if (!normalized) return [];
    const q = scorer.prepare(query, normalized);
    return prepared
      .map((item) => {
        let best = 0;
        for (const entry of item.entries) best = Math.max(best, scorer.similarity(q, entry));
        // 質問が keyword そのもの（「山」「通知」など）なら、その項目にぴったり合っているとみなす
        // （1〜2文字の質問は2文字ずつの重なりでは点が出ないため。同じ keyword の項目が2つあれば、差が無いので suggest になる）
        if (item.keywords.includes(normalized)) best = 1;
        const bonus = item.keywords.filter((keyword) => normalized.includes(keyword)).length * KEYWORD_BONUS;
        return { id: item.id, score: best + bonus };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
  }

  return { match, normalize };
}
