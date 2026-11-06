// イベント詳細（pages/event-log/detail/?id=…）の入口
import { initCommon } from '../modules/common.js';
import { getEvent, RateLimitedError } from '../modules/api.js';
import { formatEventPeriodLines, formatFileSize, safeUrl } from '../modules/format.js';
import { setImage, setStatusLabel } from '../modules/eventView.js';

initCommon({ page: 'event-detail' });

const SITE_NAME = 'イベクリ';
const MESSAGES = {
  notFound: 'イベントが見つかりませんでした。公開が終わったか、URL が違う可能性があります。',
  error: 'イベントを読み込めませんでした。時間をおいて開き直してください。',
  busy: 'ただいま混み合っています。1分ほどおいて開き直してください。',
  knowledgeBefore: 'ナレッジは開催後に公開されます。',
  knowledgeNone: 'ナレッジは公開されていません。',
  knowledgeEmpty: '公開されている振り返りはまだありません。',
};

// 振り返りの見出しは outcome で変わる（本体と同じ）。null は struggle と同じ
// success の struggle は普通は空なので、1つ目の項目は出ないことが多い（空の項目は外す）
const REVIEW_LABELS = {
  success: ['効いたこと', '何をしたら、うまくいった？'],
  struggle: ['困ったこと', '次にやるなら'],
};

const messageEl = document.querySelector('[data-detail-message]');
const contentEl = document.querySelector('[data-detail-content]');
const knowledgeTemplate = document.querySelector('[data-knowledge-template]');
const field = (name) => contentEl.querySelector(`[data-detail="${name}"]`);

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.toggle('u-hidden', !text);
}

/** 空の文字列なら要素ごと外す */
function setTextOrRemove(el, text) {
  if (typeof text === 'string' && text.trim()) el.textContent = text;
  else el.remove();
}

function renderBasic(event) {
  const { basic } = event;
  const title = basic.title || '（タイトル未設定）';
  document.title = `${title} | ${SITE_NAME}`;

  const headerImage = field('headerImage');
  setImage(headerImage, basic.headerImage);
  headerImage.alt = `${title}のヘッダー画像`;
  setStatusLabel(field('label'), 'p-event-detail', event.status);
  field('title').textContent = title;

  const lines = formatEventPeriodLines(basic.dates, basic.dateTimes);
  field('dates').replaceChildren(
    ...(lines.length ? lines : ['日程未定']).map((line) => {
      const li = document.createElement('li');
      li.className = 'p-event-detail__date';
      li.textContent = line;
      return li;
    }),
  );

  if (basic.venue) field('venue').textContent = basic.venue;
  else field('venueRow').remove();
  setTextOrRemove(field('summary'), basic.summary);
}

function buildKnowledge(item) {
  const fragment = knowledgeTemplate.content.cloneNode(true);
  const q = (selector) => fragment.querySelector(selector);
  const title = item.title || '（タスク名未設定）';
  q('.p-event-knowledge__title').textContent = title;

  const tags = Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string' && tag) : [];
  if (tags.length) {
    q('.p-event-knowledge__tags').replaceChildren(
      ...tags.map((tag) => {
        const li = document.createElement('li');
        li.className = 'p-event-knowledge__tag';
        li.textContent = tag;
        return li;
      }),
    );
  } else {
    q('.p-event-knowledge__tags').remove();
  }

  const [firstLabel, secondLabel] = REVIEW_LABELS[item.outcome === 'success' ? 'success' : 'struggle'];
  q('[data-knowledge="firstLabel"]').textContent = firstLabel;
  q('[data-knowledge="secondLabel"]').textContent = secondLabel;
  const struggle = q('[data-knowledge="struggle"]');
  if (typeof item.struggle === 'string' && item.struggle.trim()) struggle.textContent = item.struggle;
  else struggle.parentElement.remove();
  q('[data-knowledge="solution"]').textContent = item.solution || '';

  setTextOrRemove(q('.p-event-knowledge__text'), item.text);

  const images = (Array.isArray(item.images) ? item.images : []).map(safeUrl).filter(Boolean);
  if (images.length) {
    q('.p-event-knowledge__images').replaceChildren(
      ...images.map((src, i) => {
        const li = document.createElement('li');
        li.className = 'p-event-knowledge__image-item';
        const img = document.createElement('img');
        img.className = 'p-event-knowledge__image';
        img.src = src;
        img.alt = `${title}の画像 ${i + 1}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        // 読めない画像は枠ごと外す（壊れた画像のマークを見せない）
        img.addEventListener('error', () => li.remove());
        li.append(img);
        return li;
      }),
    );
  } else {
    q('.p-event-knowledge__images').remove();
  }

  const files = (Array.isArray(item.files) ? item.files : []).filter((file) => file && safeUrl(file.url));
  if (files.length) {
    q('.p-event-knowledge__files').replaceChildren(...files.map(buildFileLink));
  } else {
    q('.p-event-knowledge__files').remove();
  }
  return fragment;
}

function buildFileLink(file) {
  const li = document.createElement('li');
  li.className = 'p-event-knowledge__file-item';
  const a = document.createElement('a');
  a.className = 'p-event-knowledge__file';
  a.href = safeUrl(file.url);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const thumb = safeUrl(file.thumb);
  if (thumb) {
    const img = document.createElement('img');
    img.className = 'p-event-knowledge__file-thumb';
    img.src = thumb;
    img.alt = '';
    img.loading = 'lazy';
    a.append(img);
  }
  const name = document.createElement('span');
  name.className = 'p-event-knowledge__file-name';
  name.textContent = file.name || 'ファイル';
  a.append(name);
  const size = formatFileSize(file.size);
  if (size) {
    const sizeEl = document.createElement('span');
    sizeEl.className = 'p-event-knowledge__file-size';
    sizeEl.textContent = size;
    a.append(sizeEl);
  }
  li.append(a);
  return li;
}

function renderKnowledge(event) {
  const list = field('knowledgeList');
  const message = field('knowledgeMessage');
  const knowledge = Array.isArray(event.knowledge) ? event.knowledge.filter((item) => item && typeof item === 'object') : null;

  let text = '';
  if (knowledge === null) text = event.status === 'archive' ? MESSAGES.knowledgeNone : MESSAGES.knowledgeBefore;
  else if (knowledge.length === 0) text = MESSAGES.knowledgeEmpty;

  if (text) {
    message.textContent = text;
    message.classList.remove('u-hidden');
    list.remove();
  } else {
    list.replaceChildren(...knowledge.map(buildKnowledge));
  }
}

function showNotFound() {
  document.title = `イベントが見つかりません | ${SITE_NAME}`;
  showMessage(MESSAGES.notFound);
}

const id = new URLSearchParams(window.location.search).get('id');
try {
  const event = id ? await getEvent(id) : null;
  if (!event) {
    showNotFound();
  } else {
    renderBasic(event);
    renderKnowledge(event);
    showMessage('');
    contentEl.classList.remove('u-hidden');
  }
} catch (err) {
  console.warn('[event-detail] 詳細を読み込めませんでした', err);
  showMessage(err instanceof RateLimitedError ? MESSAGES.busy : MESSAGES.error);
}
