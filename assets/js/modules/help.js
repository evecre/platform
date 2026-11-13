// ヘルプ（pages/help/）の共通の部品：データの読み込み・検索・記事の本文の描画・URL
//   データは assets/data/help.json（カテゴリと記事）。形は CLAUDE.md §14、確かめるのは npm run check:help
//   文字はすべて textContent、リンクと画像は safeUrl() を通す
import { safeUrl } from './format.js';
import { createNormalizer } from './chatbot/normalize.js';

const DATA_URL = '/assets/data/help.json';
const SYNONYMS_URL = '/assets/data/synonyms.json'; // チャットボットと同じ類義語（検索で、言い換え・読みがなをそろえる）
export const HELP_TOP_URL = '/pages/help/';

export const categoryUrl = (id) => `/pages/help/category/?id=${encodeURIComponent(id)}`;
export const articleUrl = (id) => `/pages/help/article/?id=${encodeURIComponent(id)}`;

let loading = null;

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

/**
 * ヘルプのデータ。カテゴリに無い記事は外す。normalize は検索で使う（類義語が読めなくても、文字の形だけはそろえる）
 * @returns {Promise<{ categories: object[], articles: object[], normalize: (text: string) => string }>}
 * @throws ヘルプのデータが読めない・形が違うとき
 */
export function loadHelp() {
  loading ??= Promise.all([fetchJson(DATA_URL), fetchJson(SYNONYMS_URL).catch(() => ({}))]).then(([data, synonyms]) => {
    if (!Array.isArray(data?.categories) || !Array.isArray(data?.articles)) throw new Error('ヘルプのデータの形が違います');
    const ids = new Set(data.categories.map((category) => category.id));
    return {
      categories: data.categories,
      articles: data.articles.filter((article) => ids.has(article.category)),
      normalize: createNormalizer(synonyms),
    };
  });
  loading.catch(() => {
    loading = null; // 失敗したら次に呼んだとき取り直す
  });
  return loading;
}

/** 本文の文字（検索用） */
function bodyText(article) {
  return (Array.isArray(article.body) ? article.body : [])
    .flatMap((block) => [block.text, block.label, ...(Array.isArray(block.items) ? block.items : [])])
    .filter((text) => typeof text === 'string')
    .join(' ');
}

/**
 * キーワードで記事を探す。空白で区切った語が「すべて」含まれる記事を、当たった場所の重みの順に返す
 * 比べるときは、チャットボットと同じ normalize でそろえる（ひらがな・カタカナ・全角半角・大文字小文字・類義語・語尾）
 * 重み：タイトル 3・キーワード 2・概要と本文 1（語ごとに、いちばん重い場所だけ数える）
 * @returns {object[]}
 */
export function searchArticles(articles, query, normalize) {
  const terms = String(query ?? '')
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  if (!terms.length) return [];

  const scored = [];
  for (const article of articles) {
    const fields = [
      [normalize(article.title), 3],
      [normalize((article.keywords || []).join(' ')), 2],
      [normalize(`${article.summary || ''} ${bodyText(article)}`), 1],
    ];
    let score = 0;
    const allHit = terms.every((term) => {
      const weight = Math.max(0, ...fields.filter(([text]) => text.includes(term)).map(([, w]) => w));
      score += weight;
      return weight > 0;
    });
    if (allHit) scored.push({ article, score });
  }
  return scored.sort((a, b) => b.score - a.score).map(({ article }) => article);
}

/** 'YYYY-MM-DD' → '2026/11/13'（new Date は使わない。日本時間でずれるため） */
export function formatUpdated(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof dateStr === 'string' ? dateStr : '');
  return m ? `${m[1]}/${Number(m[2])}/${Number(m[3])}` : '';
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function listOf(tag, className, items) {
  const list = el(tag, className);
  for (const item of items) if (typeof item === 'string' && item) list.append(el('li', `${className.split(' ')[0]}-item`, item));
  return list;
}

/**
 * 記事の本文を描く。★記事の本文を描くのはここだけ
 * ブロック：heading（見出し）・text（段落）・steps（番号つきの手順）・list（箇条書き）・note（補足）・image（src・alt）・link（label・href）
 * 知らない type・中身の無いブロックは出さない
 */
export function renderArticleBody(container, blocks) {
  const nodes = [];
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (!block || typeof block !== 'object') continue;
    const items = Array.isArray(block.items) ? block.items : [];
    const text = typeof block.text === 'string' ? block.text : '';
    switch (block.type) {
      case 'heading':
        if (text) nodes.push(el('h2', 'p-help-article__heading', text));
        break;
      case 'text':
        if (text) nodes.push(el('p', 'p-help-article__text', text));
        break;
      case 'note':
        if (text) nodes.push(el('p', 'p-help-article__note', text));
        break;
      case 'steps':
        if (items.length) nodes.push(listOf('ol', 'p-help-article__steps', items));
        break;
      case 'list':
        if (items.length) nodes.push(listOf('ul', 'p-help-article__list', items));
        break;
      case 'image': {
        const src = safeUrl(block.src);
        if (!src) break;
        const figure = el('figure', 'p-help-article__figure');
        const img = el('img', 'p-help-article__image');
        img.src = src;
        img.alt = typeof block.alt === 'string' ? block.alt : '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => figure.remove()); // 壊れた画像のマークを見せない
        figure.append(img);
        nodes.push(figure);
        break;
      }
      case 'link': {
        const href = safeUrl(block.href);
        if (!href || !block.label) break;
        const p = el('p', 'p-help-article__link-row');
        const a = el('a', 'p-help-article__link', block.label);
        a.href = href;
        p.append(a);
        nodes.push(p);
        break;
      }
      default:
        break;
    }
  }
  container.replaceChildren(...nodes);
}

/** 記事の一覧（検索結果・カテゴリ）の1件を、<template> から作る。JS が探すのは data-help-item="…" だけ */
export function buildArticleItem(template, article) {
  const fragment = template.content.cloneNode(true);
  const q = (name) => fragment.querySelector(`[data-help-item="${name}"]`);
  q('link').href = articleUrl(article.id);
  q('title').textContent = article.title || '（タイトル未設定）';
  if (article.summary) q('summary').textContent = article.summary;
  else q('summary').remove();
  return fragment;
}
