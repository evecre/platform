// ヘルプの記事（pages/help/article/?id=…）の入口
import { initCommon } from '../modules/common.js';
import { loadHelp, renderArticleBody, buildArticleItem, categoryUrl, formatUpdated } from '../modules/help.js';

initCommon({ page: 'help' });

const messageEl = document.querySelector('[data-help-message]');
const contentEl = document.querySelector('[data-help-content]');
const itemTemplate = document.querySelector('[data-help-item-template]');
const field = (name) => document.querySelector(`[data-help="${name}"]`);

const id = new URLSearchParams(window.location.search).get('id');

function showNotFound() {
  document.title = '記事が見つかりません | イベクリ ヘルプ';
  messageEl.textContent = '記事が見つかりませんでした。ヘルプ トップから探してください。';
  field('crumbCategory').remove();
  field('crumbCurrent').remove();
}

try {
  const { categories, articles } = await loadHelp();
  const article = articles.find((a) => a.id === id);
  const category = article && categories.find((c) => c.id === article.category);
  if (!article || !category) {
    showNotFound();
  } else {
    const title = article.title || '（タイトル未設定）';
    document.title = `${title} | イベクリ ヘルプ`;

    field('crumbCategoryLink').href = categoryUrl(category.id);
    field('crumbCategoryLink').textContent = category.label;
    field('crumbCurrent').textContent = title;
    field('title').textContent = title;

    const updated = formatUpdated(article.updated);
    if (updated) {
      field('updated').textContent = updated;
      field('updated').dateTime = article.updated;
    } else {
      field('updatedRow').remove();
    }

    renderArticleBody(field('body'), article.body);

    const related = (Array.isArray(article.related) ? article.related : [])
      .map((rid) => articles.find((a) => a.id === rid))
      .filter(Boolean);
    if (related.length) field('related').replaceChildren(...related.map((a) => buildArticleItem(itemTemplate, a)));
    else field('relatedSection').remove();

    // 戻る先は、その記事のカテゴリ
    field('back').href = categoryUrl(category.id);
    field('back').textContent = `「${category.label}」の記事一覧へ戻る`;

    messageEl.classList.add('u-hidden');
    contentEl.classList.remove('u-hidden');
  }
} catch (err) {
  console.warn('[help] ヘルプを読み込めませんでした', err);
  messageEl.textContent = 'ヘルプを読み込めませんでした。時間をおいて開き直してください。';
}
