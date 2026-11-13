// ヘルプのトップ（pages/help/）の入口。カテゴリの一覧と、?q= の検索結果
import { initCommon } from '../modules/common.js';
import { loadHelp, searchArticles, categoryUrl, buildArticleItem } from '../modules/help.js';

initCommon({ page: 'help' });

const messageEl = document.querySelector('[data-help-message]');
const resultsEl = document.querySelector('[data-help-results]');
const resultsTitleEl = document.querySelector('[data-help-results-title]');
const resultsListEl = document.querySelector('[data-help-results-list]');
const resultsEmptyEl = document.querySelector('[data-help-results-empty]');
const categoriesEl = document.querySelector('[data-help-categories]');
const categoryListEl = document.querySelector('[data-help-category-list]');
const categoryTemplate = document.querySelector('[data-help-category-template]');
const itemTemplate = document.querySelector('[data-help-item-template]');

const query = (new URLSearchParams(window.location.search).get('q') || '').trim();
const input = document.querySelector('[data-help-search-input]');
if (input) input.value = query;

function buildCategory(category) {
  const fragment = categoryTemplate.content.cloneNode(true);
  const q = (name) => fragment.querySelector(`[data-help-category="${name}"]`);
  q('link').href = categoryUrl(category.id);
  q('label').textContent = category.label;
  if (category.description) q('description').textContent = category.description;
  else q('description').remove();
  return fragment;
}

function showResults(articles, normalize) {
  const found = searchArticles(articles, query, normalize);
  document.title = `「${query}」の検索結果 | イベクリ ヘルプ`;
  resultsTitleEl.textContent = `「${query}」の検索結果（${found.length}件）`;
  resultsListEl.replaceChildren(...found.map((article) => buildArticleItem(itemTemplate, article)));
  resultsListEl.classList.toggle('u-hidden', !found.length);
  resultsEmptyEl.classList.toggle('u-hidden', found.length > 0);
  resultsEl.classList.remove('u-hidden');
}

try {
  const { categories, articles, normalize } = await loadHelp();
  categoryListEl.replaceChildren(...categories.map(buildCategory));
  categoriesEl.classList.remove('u-hidden');
  if (query) showResults(articles, normalize);
  messageEl.classList.add('u-hidden');
} catch (err) {
  console.warn('[help] ヘルプを読み込めませんでした', err);
  messageEl.textContent = 'ヘルプを読み込めませんでした。時間をおいて開き直してください。';
}
