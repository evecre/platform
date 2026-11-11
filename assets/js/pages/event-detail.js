// イベント詳細（pages/event-log/detail/?id=…）の入口
import { initCommon } from '../modules/common.js';
import { getEvent, RateLimitedError } from '../modules/api.js';
import { formatEventPeriodLines, formatDate, formatFileSize, safeUrl } from '../modules/format.js';
import { setImage, setStatusLabel, outcomeKey, eventTypeLabel } from '../modules/eventView.js';

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

// 振り返りの文言。キーは outcomeKey()（eventView.js）が決める。null は struggle と同じ
// success の struggle は普通は空なので、1つ目の項目は出ないことが多い（空の項目は外す）
const REVIEW_LABELS = {
  success: ['効いたこと', '何をしたら、うまくいった？'],
  struggle: ['困ったこと', '次にやるなら'],
};

// 判定の表示。見た目は data-state（success / struggle）で変える
const OUTCOME_LABEL = {
  success: 'うまくいった',
  struggle: 'つまずいた',
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
  const type = eventTypeLabel(basic.eventType);
  if (type) field('type').textContent = type;
  else field('typeRow').remove();
  const lastUpdated = formatDate(basic.lastUpdated);
  if (lastUpdated) field('lastUpdated').textContent = lastUpdated;
  else field('lastUpdatedRow').remove();
  setTextOrRemove(field('summary'), basic.summary);
}

/**
 * 目的と柱（詳細の purpose・pillars）。knowledge が1件以上あるときだけ値が入る（docs/api-contract.md）
 * null・空・項目が無い（古い snapshot）ときは見出しごと外し、両方無ければまとまりごと外す
 */
function renderPurpose(event) {
  const purpose = typeof event.purpose === 'string' ? event.purpose.trim() : '';
  const pillars = Array.isArray(event.pillars) ? event.pillars.filter((p) => typeof p === 'string' && p.trim()) : [];

  if (purpose) field('purpose').textContent = purpose;
  else field('purposeBlock').remove();

  if (pillars.length) {
    field('pillars').replaceChildren(
      ...pillars.map((pillar) => {
        const li = document.createElement('li');
        li.className = 'p-event-detail__pillar';
        li.textContent = pillar;
        return li;
      }),
    );
  } else {
    field('pillarsBlock').remove();
  }

  if (!purpose && !pillars.length) field('purposeSection').remove();
}

function buildKnowledge(item) {
  const fragment = knowledgeTemplate.content.cloneNode(true);
  const q = (name) => fragment.querySelector(`[data-knowledge="${name}"]`);
  const key = outcomeKey(item);
  const title = item.title || '（タスク名未設定）';

  const outcome = q('outcome');
  outcome.textContent = OUTCOME_LABEL[key];
  outcome.dataset.state = key;
  q('title').textContent = title;

  const tags = Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string' && tag) : [];
  if (tags.length) {
    q('tags').replaceChildren(
      ...tags.map((tag) => {
        const li = document.createElement('li');
        li.className = 'p-event-knowledge__tag';
        li.textContent = tag;
        return li;
      }),
    );
  } else {
    q('tags').remove();
  }

  const [firstLabel, secondLabel] = REVIEW_LABELS[key];
  q('firstLabel').textContent = firstLabel;
  q('secondLabel').textContent = secondLabel;
  if (typeof item.struggle === 'string' && item.struggle.trim()) q('struggle').textContent = item.struggle;
  else q('struggleRow').remove();
  q('solution').textContent = item.solution || '';

  // 「詳しく」：本文・画像・ファイル。どれも無ければまとまりごと外す
  const hasText = renderKnowledgeText(q('text'), item);
  const hasImages = renderImages(q('images'), item, title);
  const hasFiles = renderFiles(q('files'), item);
  if (!hasText && !hasImages && !hasFiles) q('detail').remove();
  return fragment;
}

/**
 * 本文を描く。★本文を描くのはここだけ
 * blocks（見出し heading・段落 text・箇条書きの1項目 item。印は本体が外してある）があればそれで描き、
 * 無ければ（古い snapshot・画像だけの記録）text を1つの段落にする。知らない type は段落として出す
 * @returns {boolean} 描いたか（空なら要素ごと外して false）
 */
function renderKnowledgeText(el, item) {
  const blocks = (Array.isArray(item.blocks) ? item.blocks : []).filter(
    (block) => block && typeof block.text === 'string' && block.text.trim(),
  );
  if (!blocks.length && typeof item.text === 'string' && item.text.trim()) blocks.push({ type: 'text', text: item.text });
  if (!blocks.length) {
    el.remove();
    return false;
  }

  let list = null; // 続いている箇条書きは1つの ul にまとめる
  for (const block of blocks) {
    if (block.type === 'item') {
      if (!list) {
        list = document.createElement('ul');
        list.className = 'p-event-knowledge__list';
        el.append(list);
      }
      const li = document.createElement('li');
      li.className = 'p-event-knowledge__list-item';
      li.textContent = block.text;
      list.append(li);
      continue;
    }
    list = null;
    const node = document.createElement(block.type === 'heading' ? 'h4' : 'p');
    node.className = block.type === 'heading' ? 'p-event-knowledge__heading' : 'p-event-knowledge__paragraph';
    node.textContent = block.text;
    el.append(node);
  }
  return true;
}

function renderImages(list, item, title) {
  const images = (Array.isArray(item.images) ? item.images : []).map(safeUrl).filter(Boolean);
  if (!images.length) {
    list.remove();
    return false;
  }
  list.replaceChildren(
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
  return true;
}

function renderFiles(list, item) {
  const files = (Array.isArray(item.files) ? item.files : []).filter((file) => file && safeUrl(file.url));
  if (!files.length) {
    list.remove();
    return false;
  }
  list.replaceChildren(...files.map(buildFileLink));
  return true;
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
    const count = field('knowledgeCount');
    count.textContent = knowledgeCountText(knowledge);
    count.classList.remove('u-hidden');
  }
}

// 例：「3件（つまずいた 2件・うまくいった 1件）」。0件の内訳は出さない
function knowledgeCountText(knowledge) {
  const struggles = knowledge.filter((item) => outcomeKey(item) === 'struggle').length;
  const successes = knowledge.length - struggles;
  const parts = [];
  if (struggles) parts.push(`${OUTCOME_LABEL.struggle} ${struggles}件`);
  if (successes) parts.push(`${OUTCOME_LABEL.success} ${successes}件`);
  return `${knowledge.length}件（${parts.join('・')}）`;
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
    renderPurpose(event);
    renderKnowledge(event);
    showMessage('');
    contentEl.classList.remove('u-hidden');
  }
} catch (err) {
  console.warn('[event-detail] 詳細を読み込めませんでした', err);
  showMessage(err instanceof RateLimitedError ? MESSAGES.busy : MESSAGES.error);
}
