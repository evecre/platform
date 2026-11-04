// チャットボットのパネル（c-chatbot）。右下のボタンからパネルを重ねて開く。common.js から起動する
//   流れ：あいさつ＋カテゴリ → featured の質問 → 回答（links・related・ほかの質問をする）
//         自由入力は engine.ask の結果で、回答 / もしかして（候補3つ＋どれでもない）/ 答えられない（カテゴリ）
//   開閉のたびに document へ chatbot:open / chatbot:close を発火する（展示モードの自動送りが止まる・再開する）
//   展示モードでは、CHATBOT_RESET_MS 操作が無ければ閉じて最初の状態に戻す
//   文字はすべて textContent で入れる（改行は CSS の white-space: pre-line）。URL は safeUrl() を通す
import { createEngine } from './engine.js';
import { createCharacter, pickCharacter } from '../character.js';
import { safeUrl } from '../format.js';
import { CHATBOT_RESET_MS, kioskTime } from '../kiosk.js';

const DATA_BASE = '/assets/data';
const ACTIVITY_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'input'];
const MAX_QUERY_LENGTH = 200;
// 答えられなかった質問を console.info に出すのは、手元で動かしているときだけ
const IS_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const TEXT = {
  title: 'イベクリに質問する',
  open: 'イベクリに質問する（チャットを開く）',
  close: '閉じる',
  placeholder: '質問を入力',
  send: '送信',
  loading: '準備しています…',
  loadError: '質問の準備ができませんでした。時間をおいて、もう一度開いてください。',
  greeting: 'こんにちは！イベクリについて、気になることを聞いてください。\n下から選ぶこともできます。',
  category: (label) => `「${label}」のよくある質問です。`,
  again: 'ほかに知りたいことはありますか？',
  suggest: 'もしかして：',
  fallback: 'うまく答えられませんでした。こちらから選んでください',
  otherQuestion: 'ほかの質問をする',
  noneOfThese: 'どれでもない',
};

/**
 * @param {{ kiosk: boolean }} options
 */
export function startChatbot({ kiosk }) {
  const character = pickCharacter();
  const ui = buildUi(character);
  let engine = null;
  let loading = null; // 読み込み中の Promise（失敗したら null に戻し、次に開いたときにやり直す）
  let isOpen = false;
  let resetTimer = 0;

  document.body.append(ui.layout);

  // --- 開く・閉じる -------------------------------------------------------

  function open() {
    if (isOpen) return;
    isOpen = true;
    ui.root.classList.add('is-open');
    ui.toggle.setAttribute('aria-expanded', 'true');
    ui.input.focus();
    ensureReady();
    if (kiosk) restartResetTimer();
    document.dispatchEvent(new CustomEvent('chatbot:open'));
  }

  function close({ returnFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    ui.root.classList.remove('is-open');
    ui.toggle.setAttribute('aria-expanded', 'false');
    window.clearTimeout(resetTimer);
    if (returnFocus) ui.toggle.focus();
    document.dispatchEvent(new CustomEvent('chatbot:close'));
  }

  // 展示モード：操作が無ければ閉じて、最初のあいさつからやり直す
  function restartResetTimer() {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      close({ returnFocus: false });
      ui.input.value = '';
      if (engine) {
        ui.log.replaceChildren();
        greet();
      }
    }, kioskTime(CHATBOT_RESET_MS));
  }

  // --- データ -------------------------------------------------------------

  function ensureReady() {
    if (engine) return Promise.resolve(true);
    if (loading) return loading;
    const notice = botMessage(TEXT.loading);
    loading = loadEngine()
      .then((created) => {
        engine = created;
        notice.remove();
        greet();
        return true;
      })
      .catch((err) => {
        console.error('[chatbot] FAQ を読み込めませんでした：', err);
        notice.remove();
        botMessage(TEXT.loadError);
        loading = null;
        return false;
      });
    return loading;
  }

  // --- 会話の流れ ---------------------------------------------------------

  function greet() {
    const message = botMessage(TEXT.greeting);
    message.append(categoryChoices());
  }

  function showCategories(text) {
    const message = botMessage(text);
    message.append(categoryChoices());
  }

  function chooseCategory(category) {
    startTurn(category.label);
    const message = botMessage(TEXT.category(category.label));
    message.append(choices(engine.featured(category.id).map((item) => questionChoice(item))));
  }

  function chooseItem(item) {
    startTurn(item.question);
    showAnswer(item);
  }

  function showAnswer(item) {
    const message = botMessage(item.answer);

    const links = (item.links || [])
      .map((link) => ({ label: link.label, href: safeUrl(link.href) }))
      .filter((link) => link.label && link.href);
    if (links.length) {
      const list = document.createElement('ul');
      list.className = 'c-chatbot__links';
      for (const link of links) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'c-chatbot__link';
        a.href = link.href;
        a.textContent = link.label;
        // 同じページの中の移動（Top の #how-to など）は、パネルを閉じて見せる
        a.addEventListener('click', () => close({ returnFocus: false }));
        li.append(a);
        list.append(li);
      }
      message.append(list);
    }

    const related = (item.related || []).map((id) => engine.getItem(id)).filter(Boolean);
    message.append(
      choices([
        ...related.map((rel) => questionChoice(rel)),
        choice(TEXT.otherQuestion, 'other', () => {
          startTurn(TEXT.otherQuestion);
          showCategories(TEXT.again);
        }),
      ]),
    );
  }

  async function submitQuery(query) {
    startTurn(query);
    if (!(await ensureReady())) return;
    const result = engine.ask(query);
    if (result.type === 'answer') {
      showAnswer(result.item);
    } else if (result.type === 'suggest') {
      const message = botMessage(TEXT.suggest);
      message.append(
        choices([
          ...result.items.map((item) => questionChoice(item)),
          choice(TEXT.noneOfThese, 'other', () => {
            startTurn(TEXT.noneOfThese);
            showCategories(TEXT.fallback);
          }),
        ]),
      );
    } else {
      showCategories(TEXT.fallback);
    }
  }

  // --- 部品 ---------------------------------------------------------------

  // ユーザーの発言を足し、そこが一覧の一番上に来るようにスクロールする（長い回答を頭から読めるように）
  function startTurn(text) {
    const message = appendMessage('user', text);
    // 返事を足し終えてから動かす（先に動かすと、まだ高さが足りず下まで届かない）
    window.requestAnimationFrame(() => {
      ui.log.scrollTop = message.offsetTop;
    });
  }

  function botMessage(text) {
    return appendMessage('bot', text);
  }

  function appendMessage(from, text) {
    const message = document.createElement('div');
    message.className = `c-chatbot__message c-chatbot__message--${from}`;
    const body = document.createElement('p');
    body.className = 'c-chatbot__text';
    body.textContent = text;
    message.append(body);
    ui.log.append(message);
    return message;
  }

  function categoryChoices() {
    return choices(engine.categories.map((category) => choice(category.label, 'category', () => chooseCategory(category))));
  }

  function questionChoice(item) {
    return choice(item.question, 'question', () => chooseItem(item));
  }

  function choice(label, kind, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `c-chatbot__choice c-chatbot__choice--${kind}`;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function choices(buttons) {
    const group = document.createElement('div');
    group.className = 'c-chatbot__choices';
    group.append(...buttons);
    return group;
  }

  // --- 操作 ---------------------------------------------------------------

  ui.toggle.addEventListener('click', () => (isOpen ? close() : open()));
  ui.close.addEventListener('click', () => close());

  ui.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = ui.input.value.trim().slice(0, MAX_QUERY_LENGTH);
    if (!query) return;
    ui.input.value = '';
    submitQuery(query);
  });

  // パネルの中のキー操作は、Top の舞台（矢印キーで画面を送る）に渡さない
  ui.panel.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') close();
  });
  ui.toggle.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  if (kiosk) {
    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, () => isOpen && restartResetTimer(), { passive: true, capture: true });
    }
  }

  return { open, close };

  async function loadEngine() {
    const [faq, synonyms] = await Promise.all([
      fetchJson(`${DATA_BASE}/faq.json`),
      fetchJson(`${DATA_BASE}/synonyms.json`).catch(() => ({})), // 類義語が無くても動かす
    ]);
    return createEngine({
      faq,
      synonyms,
      onUnanswered: IS_DEV
        ? (record) => console.info('[chatbot] 答えられなかった質問：', record.query, record.type, record.top)
        : undefined,
    });
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// パネルの HTML。クラス名の一覧は assets/css/README.md の「チャットボット」
function buildUi(character) {
  const layout = document.createElement('div');
  layout.className = 'l-chatbot';

  const root = document.createElement('div');
  root.className = 'c-chatbot';
  root.dataset.chatbot = '';

  const panel = document.createElement('div');
  panel.className = 'c-chatbot__panel';
  panel.id = 'chatbot-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'chatbot-title');

  const header = document.createElement('div');
  header.className = 'c-chatbot__header';
  const title = document.createElement('h2');
  title.className = 'c-chatbot__title';
  title.id = 'chatbot-title';
  title.textContent = TEXT.title;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'c-chatbot__close';
  close.setAttribute('aria-label', TEXT.close);
  close.textContent = '×';
  header.append(createCharacter(character, { className: 'c-chatbot__avatar' }), title, close);

  const log = document.createElement('div');
  log.className = 'c-chatbot__log';
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  const form = document.createElement('form');
  form.className = 'c-chatbot__form';
  const input = document.createElement('input');
  input.className = 'c-chatbot__input';
  input.type = 'text';
  input.name = 'q';
  input.maxLength = MAX_QUERY_LENGTH;
  input.autocomplete = 'off';
  input.enterKeyHint = 'send';
  input.placeholder = TEXT.placeholder;
  input.setAttribute('aria-label', TEXT.placeholder);
  const send = document.createElement('button');
  send.type = 'submit';
  send.className = 'c-chatbot__send';
  send.textContent = TEXT.send;
  form.append(input, send);

  panel.append(header, log, form);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'c-chatbot__toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panel.id);
  toggle.setAttribute('aria-label', TEXT.open);
  toggle.append(createCharacter(character, { className: 'c-chatbot__toggle-character' }));

  root.append(panel, toggle);
  layout.append(root);
  return { layout, root, panel, log, form, input, close, toggle };
}
