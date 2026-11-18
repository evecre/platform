// ヘルプのデータ（assets/data/help.json）を確かめる
//   node scripts/check-help.mjs   （npm run check:help）
//   チャットボット（faq.json の help）から指している記事が無いときも、check:faq が誤りにする
// 誤りがあれば終了コード 1。確認がまだの記事（checked: false）と todo は、お知らせとして出すだけ（1 にしない）

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'assets/data/help.json');
const ICON_DIR = path.join(ROOT, 'assets/img/icon');
const ICON_TOKEN_RE = /\[icon:([^\]]*)\]/g; // 文の中のアイコン（inlineIcon.js と同じ印。名前の形もここで確かめる）

const ID_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TEXT_TYPES = new Set(['heading', 'text', 'note']);
const LIST_TYPES = new Set(['steps', 'list']);
const DEVICES = new Set(['all', 'iphone', 'android', 'pc']);
const ARTICLE_LINK_RE = /^\/pages\/help\/article\/\?id=([a-z0-9-]+)$/;

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isUrl = (value) => typeof value === 'string' && (value.startsWith('/') || value.startsWith('https://'));

function validate(data) {
  const errors = [];
  const notices = [];
  const categoryIds = new Set();
  const articleIds = new Set();
  const articleLinks = []; // [記事の id, リンク先の id]

  for (const category of data.categories ?? []) {
    const name = `カテゴリ ${category.id ?? '（id なし）'}`;
    if (!ID_RE.test(category.id ?? '')) errors.push(`${name}：id は英小文字・数字・ハイフンだけ`);
    if (categoryIds.has(category.id)) errors.push(`${name}：id が重複`);
    categoryIds.add(category.id);
    if (!isText(category.label)) errors.push(`${name}：label が空`);
  }

  for (const article of data.articles ?? []) {
    const name = `記事 ${article.id ?? '（id なし）'}`;
    if (!ID_RE.test(article.id ?? '')) errors.push(`${name}：id は英小文字・数字・ハイフンだけ`);
    if (articleIds.has(article.id)) errors.push(`${name}：id が重複`);
    articleIds.add(article.id);
    if (!categoryIds.has(article.category)) errors.push(`${name}：無いカテゴリ ${article.category}`);
    if (!isText(article.title)) errors.push(`${name}：title が空`);
    if (!DATE_RE.test(article.updated ?? '')) errors.push(`${name}：updated は "YYYY-MM-DD"`);
    if (!Array.isArray(article.body) || !article.body.length) errors.push(`${name}：body が空`);
    // 誰向けか（「管理者」「全員」など。記事の頭に「対象：…」と出る）・どの端末か（all / iphone / android / pc）
    if (!Array.isArray(article.audience) || !article.audience.length || !article.audience.every(isText)) errors.push(`${name}：audience は空でない文字の配列（例 ["管理者"]）`);
    if (!Array.isArray(article.devices) || !article.devices.length || !article.devices.every((d) => DEVICES.has(d))) errors.push(`${name}：devices は ${[...DEVICES].join(' / ')} の配列`);

    (article.body ?? []).forEach((block, i) => {
      const where = `${name} の body[${i}]（${block?.type}）`;
      if (TEXT_TYPES.has(block?.type)) {
        if (!isText(block.text)) errors.push(`${where}：text が空`);
      } else if (LIST_TYPES.has(block?.type)) {
        if (!Array.isArray(block.items) || !block.items.length || !block.items.every(isText)) errors.push(`${where}：items は空でない文字の配列`);
      } else if (block?.type === 'image') {
        if (!isUrl(block.src)) errors.push(`${where}：src は / か https:// で始める`);
        if (typeof block.alt !== 'string') errors.push(`${where}：alt が無い（飾りなら ""）`);
      } else if (block?.type === 'link') {
        if (!isText(block.label)) errors.push(`${where}：label が空`);
        if (!isUrl(block.href)) errors.push(`${where}：href は / か https:// で始める`);
        const m = ARTICLE_LINK_RE.exec(block.href ?? '');
        if (m) articleLinks.push([article.id, m[1]]);
      } else {
        errors.push(`${where}：知らない type`);
      }
    });

    // 文の中のアイコン [icon:名前]：名前の形と、assets/img/icon/icon-名前.svg があるか
    const texts = [article.summary, ...(article.body ?? []).flatMap((b) => [b?.text, b?.label, ...(Array.isArray(b?.items) ? b.items : [])])];
    for (const text of texts.filter((t) => typeof t === 'string')) {
      for (const [, icon] of text.matchAll(ICON_TOKEN_RE)) {
        if (!/^[a-z0-9-]+$/.test(icon)) errors.push(`${name}：アイコンの名前は英小文字・数字・ハイフンだけ [icon:${icon}]`);
        else if (!existsSync(path.join(ICON_DIR, `icon-${icon}.svg`))) errors.push(`${name}：アイコンの画像が無い assets/img/icon/icon-${icon}.svg`);
      }
    }
    if (/\[icon:/.test(article.title ?? '')) errors.push(`${name}：title にアイコンは入れない（ページの題・一覧・チャットボットのリンクに文字のまま出る）`);

    if (article.checked !== true) notices.push(`確認がまだ：${article.id}（${article.title}）`);
    for (const todo of article.todo ?? []) notices.push(`  todo ${article.id}：${todo}`);
  }

  for (const article of data.articles ?? []) {
    for (const rid of article.related ?? []) {
      if (!articleIds.has(rid)) errors.push(`記事 ${article.id}：related に無い記事 ${rid}`);
      if (rid === article.id) errors.push(`記事 ${article.id}：related に自分自身`);
    }
  }
  for (const [from, to] of articleLinks) {
    if (!articleIds.has(to)) errors.push(`記事 ${from}：リンク先の記事が無い ${to}`);
  }
  for (const id of categoryIds) {
    if (!(data.articles ?? []).some((a) => a.category === id)) notices.push(`記事の無いカテゴリ：${id}`);
  }
  return { errors, notices, count: articleIds.size };
}

const data = JSON.parse(readFileSync(FILE, 'utf8'));
const { errors, notices, count } = validate(data);
console.log(`■ help.json：カテゴリ ${data.categories?.length ?? 0} 件・記事 ${count} 件`);
for (const notice of notices) console.log(`  注意  ${notice}`);
if (errors.length) {
  for (const error of errors) console.log(`  ✗ ${error}`);
  process.exit(1);
}
console.log('  誤りなし');
