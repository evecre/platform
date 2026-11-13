// ヘルプのカテゴリ（pages/help/category/?id=…）の入口。そのカテゴリの記事の一覧
import { initCommon } from '../modules/common.js';
import { loadHelp, buildArticleItem } from '../modules/help.js';

initCommon({ page: 'help' });

const messageEl = document.querySelector('[data-help-message]');
const contentEl = document.querySelector('[data-help-content]');
const itemTemplate = document.querySelector('[data-help-item-template]');
const field = (name) => document.querySelector(`[data-help="${name}"]`);

const id = new URLSearchParams(window.location.search).get('id');

try {
  const { categories, articles } = await loadHelp();
  const category = categories.find((c) => c.id === id);
  if (!category) {
    document.title = 'カテゴリが見つかりません | イベクリ ヘルプ';
    messageEl.textContent = 'カテゴリが見つかりませんでした。ヘルプ トップから探してください。';
    field('crumbCurrent').remove();
  } else {
    document.title = `${category.label} | イベクリ ヘルプ`;
    field('crumbCurrent').textContent = category.label;
    field('title').textContent = category.label;
    if (category.description) field('description').textContent = category.description;
    else field('description').remove();
    const list = articles.filter((article) => article.category === category.id);
    field('list').replaceChildren(...list.map((article) => buildArticleItem(itemTemplate, article)));
    messageEl.classList.add('u-hidden');
    contentEl.classList.remove('u-hidden');
  }
} catch (err) {
  console.warn('[help] ヘルプを読み込めませんでした', err);
  messageEl.textContent = 'ヘルプを読み込めませんでした。時間をおいて開き直してください。';
}
