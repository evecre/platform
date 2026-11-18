// チャットボットの判定（DOM に依存しない）。質問を受けて「答える / もしかして / 答えない」を決める
//   1位の点数 ≥ THRESHOLD_ANSWER（かつ 2位との差 ≥ MIN_MARGIN） → answer
//   1位の点数 ≥ THRESHOLD_SUGGEST                                → suggest（もしかして。上位3件）
//   それ未満                                                     → fallback（カテゴリ選択に戻す）
// answer 以外のときは、ヘルプの記事（help.json）からも近いものを探して articles に入れる（FAQ に無い話題もヘルプへ案内する）
import { createNormalizer } from './normalize.js';
import { createMatcher } from './matcher.js';
import { bigrams } from './normalize.js';
import { stripIconTokens } from '../inlineIcon.js';

export const THRESHOLD_ANSWER = 0.55;
export const THRESHOLD_SUGGEST = 0.25;
export const MIN_MARGIN = 0.05; // 1位と2位の差がこれより小さいと、どちらか決めきれないので suggest にする
export const THRESHOLD_HELP = 0.5; // ヘルプの記事を案内する点数（質問の2文字のうち、記事に含まれる割合。珍しさの重み付き）
export const HELP_LIMIT = 2;

/**
 * @param {{
 *   faq: { categories: object[], items: object[] },
 *   synonyms?: object,
 *   help?: { articles: object[] },
 *   scorer?: object,
 *   thresholds?: { answer?: number, suggest?: number, margin?: number },
 *   onUnanswered?: (record: { query: string, type: string, top: object[] }) => void,
 * }} options
 */
export function createEngine({ faq, synonyms = {}, help, scorer, thresholds = {}, onUnanswered }) {
  const answerAt = thresholds.answer ?? THRESHOLD_ANSWER;
  const suggestAt = thresholds.suggest ?? THRESHOLD_SUGGEST;
  const margin = thresholds.margin ?? MIN_MARGIN;

  const normalize = createNormalizer(synonyms);
  const matcher = createMatcher(faq, { normalize, scorer });
  const byId = new Map(faq.items.map((item) => [item.id, item]));

  // ヘルプの記事は、本文まで含めて「質問の2文字がどれだけ記事に含まれているか」で探す（findHelpArticles）
  const articles = Array.isArray(help?.articles) ? help.articles : [];
  const articleById = new Map(articles.map((article) => [article.id, article]));
  const helpIndex = createHelpIndex(articles, normalize);
  const unanswered = []; // 答えられなかった質問（メモリ上だけ。外部には送らない）

  /**
   * @param {string} query
   * @returns {{ type: 'answer', item: object, top: object[] }
   *         | { type: 'suggest', items: object[], articles: object[], top: object[] }
   *         | { type: 'fallback', articles: object[], top: object[] }}
   */
  function ask(query) {
    const top = matcher.match(query);
    const [first, second] = top;
    let result;
    if (first && first.score >= answerAt && (!second || first.score - second.score >= margin)) {
      result = { type: 'answer', item: byId.get(first.id), top };
    } else if (first && first.score >= suggestAt) {
      const items = top.filter((t) => t.score > 0).map((t) => byId.get(t.id));
      result = { type: 'suggest', items, articles: helpIndex.find(query), top };
    } else {
      result = { type: 'fallback', articles: helpIndex.find(query), top };
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
    /** ヘルプの記事（faq の item.help から引く）。ヘルプが読めなかったときは null */
    getArticle: (id) => articleById.get(id) ?? null,
    categories: faq.categories,
    /** カテゴリを選んだときの候補（featured のもの） */
    featured: (categoryId) => faq.items.filter((item) => item.category === categoryId && item.featured),
    unanswered: () => [...unanswered],
    normalize,
  };
}

/** 記事の検索用の文字（title・summary・keywords・本文） */
function articleText(article) {
  const blocks = Array.isArray(article.body) ? article.body : [];
  return [
    article.title,
    article.summary,
    ...(Array.isArray(article.keywords) ? article.keywords : []),
    ...blocks.flatMap((b) => [b?.text, b?.label, ...(Array.isArray(b?.items) ? b.items : [])]),
  ]
    .filter((t) => typeof t === 'string')
    .map(stripIconTokens)
    .join(' ');
}

/**
 * ヘルプの記事を、質問の文から探す（DOM に依存しない）
 *   点数 ＝ 質問の2文字のうち記事に含まれるものの重みの合計 ÷ 質問の2文字の重みの合計（0〜1）
 *   重みは珍しさ（多くの記事に出る2文字は軽く、記事に1つも無い2文字は重い）。title に当たると +0.1
 *   ★文ごとに normalize すると文の終わりの言い回しの処理が働くので、記事は空白でつないで1回で normalize する
 */
function createHelpIndex(articles, normalize) {
  const docs = articles.map((article) => ({
    article,
    grams: bigrams(normalize(articleText(article))),
    title: bigrams(normalize(article.title ?? '')),
  }));
  const n = docs.length || 1;
  const df = new Map();
  for (const doc of docs) for (const gram of doc.grams) df.set(gram, (df.get(gram) ?? 0) + 1);
  const weight = (gram) => Math.log(1 + n / (df.get(gram) ?? 0.5));

  return {
    /** @returns {object[]} 近い順に HELP_LIMIT 件まで */
    find(query) {
      if (!docs.length) return [];
      const q = bigrams(normalize(query));
      const total = [...q].reduce((sum, gram) => sum + weight(gram), 0);
      if (!total) return [];
      return docs
        .map((doc) => {
          let hit = 0;
          for (const gram of q) if (doc.grams.has(gram)) hit += weight(gram);
          const titleHit = [...q].some((gram) => doc.title.has(gram)) ? 0.1 : 0;
          return { article: doc.article, score: hit / total + titleHit };
        })
        .filter((r) => r.score >= THRESHOLD_HELP)
        .sort((a, b) => b.score - a.score)
        .slice(0, HELP_LIMIT)
        .map((r) => r.article);
    },
  };
}
