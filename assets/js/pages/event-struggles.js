// つまずいたことの横断索引（pages/event-log/struggles/）の入口
//   全イベントの振り返りから、つまずいた記録（outcomeKey が struggle）で solution が空でないものを集める
//   ふだんは listReflections()（GET /api/public/reflections）を1回だけ取る。並びは API のまま（イベントは開催の最終日が新しい順）
//   それが取れない（API がまだ持っていない・古い snapshot）ときだけ、詳細を1件ずつ取る形に戻す（collectByDetails）。
//   公開 API は同じ IP から1分60回までなので：
//     hasKnowledge が true のイベントだけ・開催の最終日が新しい順に MAX_EVENTS 件まで・順に（並列にしない）取る
//     getEvent() を使うので、sessionStorage のキャッシュ（5分）と、展示モードの snapshot 優先がそのまま効く
//   429（RateLimitedError）が出たらそこで止め、取れた分だけ出す
import { initCommon } from '../modules/common.js';
import { listEvents, getEvent, listReflections, RateLimitedError } from '../modules/api.js';
import { outcomeKey } from '../modules/eventView.js';
import { setupFilterButtons } from '../modules/filterButtons.js';

initCommon({ page: 'event-struggles' });

const MAX_EVENTS = 20; // 詳細を1件ずつ取るときの、イベントの上限（1回開くと、一覧1回＋この数だけ API に問い合わせる）

const MESSAGES = {
  loading: (done, total) => `イベントを読み込み中…（${done} / ${total}件）`,
  error: 'イベントを読み込めませんでした。時間をおいて開き直してください。',
  busy: 'ただいま混み合っています。1分ほどおいて開き直してください。',
  busyPartial: (done, total) => `ただいま混み合っているため、${total}件のイベントのうち ${done}件から集めたところで止めました。1分ほどおいて開き直すと続きが読めます。`,
  limited: `新しい${MAX_EVENTS}件のイベントから集めています。`,
  truncated: '記録が多いため、新しいものから集めています。古い記録の一部は出ていません。',
  empty: 'つまずいた記録は、まだ公開されていません。',
  emptyFiltered: 'このタグのつまずいた記録はありません。',
};

const listEl = document.querySelector('[data-struggles-list]');
const messageEl = document.querySelector('[data-struggles-message]');
const noticeEl = document.querySelector('[data-struggles-notice]');
const countEl = document.querySelector('[data-struggles-count]');
const template = document.querySelector('[data-struggle-template]');
const filterButtons = [...document.querySelectorAll('[data-filter]')];

const entries = []; // { event, item }
let filter = 'all';
let loading = true;

function setText(el, text) {
  el.textContent = text;
  el.classList.toggle('u-hidden', !text);
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/** つまずいた記録として索引に載せるか */
function isStruggleEntry(item) {
  return item && typeof item === 'object' && outcomeKey(item) === 'struggle' && hasText(item.solution);
}

/** 開催の最終日（'YYYY-MM-DD'）。文字列のまま比べる。日程未定は '' */
function lastDate(event) {
  const dates = Array.isArray(event.dates) ? event.dates.filter((d) => typeof d === 'string') : [];
  return dates.length ? [...dates].sort().at(-1) : '';
}

function buildEntry({ event, item }) {
  const fragment = template.content.cloneNode(true);
  const q = (name) => fragment.querySelector(`[data-struggle="${name}"]`);

  if (hasText(item.struggle)) q('struggle').textContent = item.struggle;
  else q('struggleRow').remove();
  q('solution').textContent = item.solution;

  const link = q('event');
  link.href = `/pages/event-log/detail/?id=${encodeURIComponent(event.id)}`;
  link.textContent = event.title || '（タイトル未設定）';
  q('task').textContent = item.title || '（タスク名未設定）';

  const tags = Array.isArray(item.tags) ? item.tags.filter(hasText) : [];
  if (tags.length) {
    q('tags').replaceChildren(
      ...tags.map((tag) => {
        const li = document.createElement('li');
        li.className = 'p-event-struggles__tag';
        li.textContent = tag;
        return li;
      }),
    );
  } else {
    q('tags').remove();
  }
  return fragment;
}

function render() {
  const shown = filter === 'all' ? entries : entries.filter(({ item }) => Array.isArray(item.tags) && item.tags.includes(filter));
  listEl.replaceChildren(...shown.map(buildEntry));
  listEl.classList.toggle('u-hidden', shown.length === 0);

  // 件数（絞っているときは「8件中 3件」）。0件のときは出さない
  countEl.textContent = shown.length === entries.length ? `${entries.length}件` : `${entries.length}件中 ${shown.length}件`;
  countEl.classList.toggle('u-hidden', shown.length === 0);

  if (!loading && !shown.length) setText(messageEl, entries.length ? MESSAGES.emptyFiltered : MESSAGES.empty);
}

setupFilterButtons(filterButtons, (value) => {
  filter = value;
  render();
});

/** 振り返りの一覧（1回で全部）から集める */
function collectFromReflections({ items, truncated }) {
  for (const item of items) {
    const event = item?.event;
    if (event && typeof event.id === 'string' && isStruggleEntry(item)) entries.push({ event: { id: event.id, title: event.title }, item });
  }
  loading = false;
  setText(messageEl, '');
  setText(noticeEl, truncated ? MESSAGES.truncated : '');
  render();
}

async function collect() {
  let reflections = null;
  try {
    reflections = await listReflections();
  } catch (err) {
    // 回数制限で断られたら、詳細を1件ずつ取っても断られるので、ここで止める
    if (err instanceof RateLimitedError) {
      setText(messageEl, MESSAGES.busy);
      return;
    }
    console.warn('[event-struggles] 振り返りの一覧を読み込めませんでした', err);
  }
  if (reflections) collectFromReflections(reflections);
  else await collectByDetails();
}

/** 詳細を1件ずつ取って集める（振り返りの一覧が取れないとき） */
async function collectByDetails() {
  let events;
  try {
    events = (await listEvents()).filter((event) => event && typeof event.id === 'string');
  } catch (err) {
    console.warn('[event-struggles] 一覧を読み込めませんでした', err);
    setText(messageEl, err instanceof RateLimitedError ? MESSAGES.busy : MESSAGES.error);
    return;
  }

  const withKnowledge = events
    .filter((event) => event.hasKnowledge === true)
    .sort((a, b) => lastDate(b).localeCompare(lastDate(a))); // 新しい順。日程未定（''）は最後
  const targets = withKnowledge.slice(0, MAX_EVENTS);
  const notices = [];
  if (withKnowledge.length > MAX_EVENTS) notices.push(MESSAGES.limited);

  let done = 0;
  let busy = false;
  for (const event of targets) {
    setText(messageEl, MESSAGES.loading(done, targets.length));
    try {
      const detail = await getEvent(event.id);
      const knowledge = Array.isArray(detail?.knowledge) ? detail.knowledge : [];
      for (const item of knowledge) {
        if (isStruggleEntry(item)) entries.push({ event: { id: event.id, title: detail.basic?.title ?? event.title }, item });
      }
    } catch (err) {
      if (err instanceof RateLimitedError) {
        busy = true;
        break;
      }
      // 1件取れなくても止めない（取れた分だけ出す）
      console.warn(`[event-struggles] 詳細を読み込めませんでした：${event.id}`, err);
    }
    done++;
    render(); // 取れた分から順に見せる
  }

  loading = false;
  // 1件も集まらないうちに混み合ったら「まだ公開されていません」ではなく、混み合いのメッセージだけを出す
  if (busy && !entries.length) {
    setText(messageEl, MESSAGES.busy);
    return;
  }
  if (busy) notices.unshift(MESSAGES.busyPartial(done, targets.length));
  setText(messageEl, '');
  setText(noticeEl, notices.join('\n'));
  render();
}

await collect();
