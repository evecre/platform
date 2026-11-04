// チャットボットの正答率と、faq.json の中身を確かめる（エンジンはブラウザと同じものを import する）
//   node scripts/check-faq.mjs          → faq.json の検査 ＋ faq-tests.json の正答率・外れた質問の一覧
//   node scripts/check-faq.mjs --tune   → しきい値を 0.05 刻みで動かしたときの表も出す
// faq.json に誤りがあれば終了コード 1（正答率が低いだけでは 1 にしない）
//
// 正答の数え方：
//   expect が id      → answer でその id を返したら正答
//   expect が null    → fallback なら正答（答えられない質問に、別の答えも、関係の無い「もしかして」も出さない）
// 到達：正答、または suggest（もしかして）の候補に期待の id が入っている（ユーザーが1回押せば答えにたどり着ける）

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine, THRESHOLD_ANSWER, THRESHOLD_SUGGEST, MIN_MARGIN } from '../assets/js/modules/chatbot/engine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'assets/data');
const MIN_PATTERNS = 5;
const TUNE_STEP = 0.05;
const TUNE_ANSWER = [0.3, 0.8];
const TUNE_SUGGEST = [0.1, 0.5];

function load(file) {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

function percent(n, total) {
  return total ? `${Math.round((n / total) * 100)}%` : '-';
}

// --- faq.json の検査 -----------------------------------------------------------

function validate(faq, tests) {
  const errors = [];
  const warnings = [];
  const categoryIds = new Set((faq.categories ?? []).map((c) => c.id));
  const ids = new Set();

  for (const item of faq.items ?? []) {
    const name = item.id ?? '（id なし）';
    if (!item.id) errors.push('id の無い項目があります');
    else if (ids.has(item.id)) errors.push(`id が重複しています：${item.id}`);
    ids.add(item.id);

    if (!categoryIds.has(item.category)) errors.push(`${name}：カテゴリ「${item.category}」は categories にありません`);
    if (!item.question) errors.push(`${name}：question がありません`);
    if (!item.answer) errors.push(`${name}：answer がありません`);
    else if (item.answer.includes('TODO')) warnings.push(`${name}：answer がまだ TODO です`);
    const patterns = item.patterns ?? [];
    if (patterns.length < MIN_PATTERNS) errors.push(`${name}：patterns が ${patterns.length} 個です（${MIN_PATTERNS} 個以上にする）`);
    for (const link of item.links ?? []) {
      if (!link.label || !/^(\/|https?:\/\/)/.test(link.href ?? '')) errors.push(`${name}：リンクの label か href がおかしいです（${JSON.stringify(link)}）`);
    }
  }

  for (const item of faq.items ?? []) {
    for (const rel of item.related ?? []) {
      if (!ids.has(rel)) errors.push(`${item.id}：related の「${rel}」はありません`);
      if (rel === item.id) errors.push(`${item.id}：related に自分自身が入っています`);
    }
  }

  for (const category of faq.categories ?? []) {
    const featured = faq.items.filter((item) => item.category === category.id && item.featured);
    if (!featured.length) warnings.push(`カテゴリ「${category.label}」に featured の質問がありません（選んでも候補が出ません）`);
  }

  for (const test of tests) {
    if (test.expect !== null && !ids.has(test.expect)) errors.push(`faq-tests.json：「${test.q}」の expect「${test.expect}」はありません`);
  }

  return { errors, warnings };
}

// --- 正答率 ---------------------------------------------------------------------

function run(engine, tests) {
  return tests.map((test) => {
    const result = engine.ask(test.q);
    const got = result.type === 'answer' ? result.item.id : null;
    const pass = test.expect === null ? result.type === 'fallback' : got === test.expect;
    const candidates = result.type === 'suggest' ? result.items.map((item) => item.id) : [];
    const wrong = got !== null && got !== test.expect; // 違う答えを出した（いちばん困る外れ方）
    const reach = pass || (test.expect !== null && candidates.includes(test.expect));
    return { ...test, type: result.type, got, candidates, pass, wrong, reach, top: result.top };
  });
}

function summarize(results) {
  const count = (fn) => results.filter(fn).length;
  return {
    total: results.length,
    pass: count((r) => r.pass),
    reach: count((r) => r.reach),
    wrong: count((r) => r.wrong),
    answer: count((r) => r.type === 'answer'),
    suggest: count((r) => r.type === 'suggest'),
    fallback: count((r) => r.type === 'fallback'),
  };
}

function range([from, to]) {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += TUNE_STEP) out.push(Math.round(v * 100) / 100);
  return out;
}

function tune(faq, synonyms, tests) {
  const suggestValues = range(TUNE_SUGGEST);
  console.log('\n■ しきい値の表（正答 / 到達 / 誤答。行＝ANSWER、列＝SUGGEST。MARGIN は今の値のまま。* が今の設定）');
  console.log(['ANSWER＼SUGGEST', ...suggestValues.map((v) => v.toFixed(2).padStart(11))].join(''));
  for (const answer of range(TUNE_ANSWER)) {
    const cells = suggestValues.map((suggest) => {
      if (suggest > answer) return ''.padStart(11);
      const engine = createEngine({ faq, synonyms, thresholds: { answer, suggest } });
      const s = summarize(run(engine, tests));
      const mark = answer === THRESHOLD_ANSWER && suggest === THRESHOLD_SUGGEST ? '*' : ' ';
      return `${mark}${s.pass}/${s.reach}/${s.wrong}`.padStart(11);
    });
    console.log([answer.toFixed(2).padEnd(15), ...cells].join(''));
  }
  console.log(`（${tests.length} 件中の件数）`);
}

// --- 実行 -----------------------------------------------------------------------

const args = new Set(process.argv.slice(2));
const faq = load('faq.json');
const synonyms = load('synonyms.json');
const tests = load('faq-tests.json');

const { errors, warnings } = validate(faq, tests);
console.log(`■ faq.json の検査：${faq.items.length} 項目・${faq.categories.length} カテゴリ`);
for (const e of errors) console.log(`  NG  ${e}`);
if (warnings.length) {
  // 同じ種類の注意が多いときは、まとめて1行にする
  const todo = warnings.filter((w) => w.endsWith('TODO です'));
  for (const w of warnings.filter((w) => !todo.includes(w))) console.log(`  注意  ${w}`);
  if (todo.length) console.log(`  注意  answer がまだ TODO の項目：${todo.length} 件`);
}
if (!errors.length) console.log('  誤りはありません');

const engine = createEngine({ faq, synonyms });
const results = run(engine, tests);
const s = summarize(results);
console.log(`\n■ 正答率（しきい値 ANSWER ${THRESHOLD_ANSWER} / SUGGEST ${THRESHOLD_SUGGEST} / MARGIN ${MIN_MARGIN}）`);
console.log(`  正答：${s.pass} / ${s.total}（${percent(s.pass, s.total)}）`);
console.log(`  到達：${s.reach} / ${s.total}（${percent(s.reach, s.total)}）← 正答 ＋ もしかしての候補に正解がある`);
console.log(`  誤答：${s.wrong} / ${s.total}（違う答えを出した）`);
console.log(`  答え方：answer ${percent(s.answer, s.total)} / suggest ${percent(s.suggest, s.total)} / fallback ${percent(s.fallback, s.total)}`);

const misses = results.filter((r) => !r.pass);
if (misses.length) {
  console.log('\n■ 外れた質問（期待 → 実際。点数は上位3件）');
  for (const r of misses) {
    const actual = r.type === 'answer' ? `answer ${r.got}` : r.type === 'suggest' ? `suggest [${r.candidates.join(', ')}]` : 'fallback';
    const top = r.top.map((t) => `${t.id} ${t.score.toFixed(2)}`).join(' / ');
    console.log(`  ${r.reach ? '△' : '×'} 「${r.q}」 ${r.expect ?? '（答えない）'} → ${actual}`);
    console.log(`      ${top || '（点数なし）'}`);
  }
  console.log('  △ ＝ もしかしての候補には正解が出ている');
}

if (args.has('--tune')) tune(faq, synonyms, tests);

process.exit(errors.length ? 1 : 0);
