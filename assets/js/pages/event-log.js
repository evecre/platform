// イベント一覧（pages/event-log/）の入口
import { initCommon } from '../modules/common.js';
import { listEvents, RateLimitedError } from '../modules/api.js';
import { formatEventPeriodLines } from '../modules/format.js';
import { setImage, setStatusLabel, EVENT_TYPE_LABEL, eventTypeLabel } from '../modules/eventView.js';
import { setupFilterButtons } from '../modules/filterButtons.js';

initCommon({ page: 'event-log' });

const MESSAGES = {
  error: 'イベントを読み込めませんでした。時間をおいて開き直してください。',
  busy: 'ただいま混み合っています。1分ほどおいて開き直してください。',
  empty: '公開されているイベントはまだありません。',
  emptyFiltered: '該当するイベントはありません。',
};

const listEl = document.querySelector('[data-event-log-list]');
const messageEl = document.querySelector('[data-event-log-message]');
const countEl = document.querySelector('[data-event-log-count]');
const template = document.querySelector('[data-event-card-template]');
const statusButtons = [...document.querySelectorAll('[data-status-filter] [data-filter]')];
const typeGroup = document.querySelector('[data-type-filter]');
const typeTemplate = document.querySelector('[data-type-filter-template]');

let events = [];
// 2つの絞り込み（告知・アーカイブ／種別）。両方に当てはまるものを出す
let statusFilter = 'all';
let typeFilter = 'all';

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.toggle('u-hidden', !text);
}

function buildCard(event) {
  const fragment = template.content.cloneNode(true);
  const q = (name) => fragment.querySelector(`[data-card="${name}"]`);
  q('link').href = `/pages/event-log/detail/?id=${encodeURIComponent(event.id)}`;
  setImage(q('thumb'), event.headerImage);
  setStatusLabel(q('label'), 'c-event-card', event.status);
  q('title').textContent = event.title || '（タイトル未設定）';
  const type = eventTypeLabel(event.eventType);
  if (type) q('type').textContent = type;
  else q('type').remove();
  const lines = formatEventPeriodLines(event.dates, event.dateTimes);
  q('date').textContent = lines.length ? lines.join('、') : '日程未定';
  const venue = q('venue');
  if (event.venue) venue.textContent = event.venue;
  else venue.remove();
  return fragment;
}

function render() {
  const shown = events.filter(
    (event) => (statusFilter === 'all' || event.status === statusFilter) && (typeFilter === 'all' || event.eventType === typeFilter),
  );
  listEl.replaceChildren(...shown.map(buildCard));
  listEl.classList.toggle('u-hidden', shown.length === 0);
  if (shown.length) showMessage('');
  else showMessage(events.length ? MESSAGES.emptyFiltered : MESSAGES.empty);
  showCount(events.length, shown.length);
}

// 件数。絞っているときは「12件中 5件」。0件のとき（公開なし・絞って該当なし）は出さない（メッセージが出るので）
function showCount(total, shown) {
  countEl.textContent = shown === total ? `${total}件` : `${total}件中 ${shown}件`;
  countEl.classList.toggle('u-hidden', shown === 0);
}

setupFilterButtons(statusButtons, (value) => {
  statusFilter = value;
  render();
});

// 種別のボタンは、一覧にある（表示名を知っている）種別だけ。並びは EVENT_TYPE_LABEL の順
function setupTypeFilter() {
  const present = new Set(events.map((event) => event.eventType));
  const buttons = Object.keys(EVENT_TYPE_LABEL)
    .filter((id) => present.has(id))
    .map((id) => {
      const button = typeTemplate.content.firstElementChild.cloneNode(true);
      button.dataset.filter = id;
      button.textContent = EVENT_TYPE_LABEL[id];
      return button;
    });
  if (!buttons.length) return;
  typeGroup.append(...buttons);
  typeGroup.classList.remove('u-hidden');
  setupFilterButtons([...typeGroup.querySelectorAll('[data-filter]')], (value) => {
    typeFilter = value;
    render();
  });
}

try {
  events = (await listEvents()).filter((event) => event && typeof event.id === 'string');
  setupTypeFilter();
  render();
} catch (err) {
  console.warn('[event-log] 一覧を読み込めませんでした', err);
  showMessage(err instanceof RateLimitedError ? MESSAGES.busy : MESSAGES.error);
}
