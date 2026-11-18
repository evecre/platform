// 質問の文を、比べやすい形にそろえる（DOM に依存しない。ブラウザと Node の両方から使う）
//   1. NFKC 正規化・英字を小文字・ひらがなをカタカナに・記号と空白を除く
//   2. 類義語を代表の語に置き換える（長い語から順に）
//   3. よくある言い回しの語尾・つなぎを除く（FILLER_PHRASES はどこでも・TRAILING_PHRASES は文の終わりだけ）

// 除く言い回し。★1文字のもの（「の」「を」など）は入れない（2文字ずつ区切ったときの手がかりが減りすぎる）
// ★長いものを先に書く必要はない（読み込み時に長い順に並べ替える）
export const FILLER_PHRASES = [
  'ですか', 'ますか', 'でしょうか', 'ですが', 'ください', 'くださいますか',
  'には', 'したい', 'したいです', 'たいです', 'ほしい', 'ほしいです',
  'どうやって', 'どうすれば', 'どうしたら', 'どうやったら', 'どこで', 'どこから',
  '教えて', '知りたい', '方法', 'やり方', 'について',
  // 話し言葉のつなぎ
  'なんで', 'したらいい', 'すればいい', 'いいですか',
];

// 文の終わりにあるときだけ除く言い回し（途中で除くと語を壊す：「ガントはどこ」の「とは」など）
export const TRAILING_PHRASES = ['って何', 'ってなに', 'とは', 'って', 'なに', '何'];

const HIRAGANA_RE = /[ぁ-ゖ]/g;
const NOT_WORD_RE = /[^\p{L}\p{N}]/gu;

/** 文字の形だけをそろえる（類義語・言い回しは触らない） */
export function normalizeChars(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(HIRAGANA_RE, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
    .replace(NOT_WORD_RE, '');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 語の一覧を、長い順に並べた1つの正規表現にする（短い語が長い語の一部を先に食べないように） */
function alternation(words) {
  const sorted = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length);
  return sorted.length ? new RegExp(sorted.map(escapeRegExp).join('|'), 'g') : null;
}

/**
 * @param {{ [canonical: string]: string[] }} synonyms  synonyms.json の中身
 * @returns {(text: string) => string}
 */
export function createNormalizer(synonyms = {}) {
  const toCanonical = new Map();
  for (const [canonical, words] of Object.entries(synonyms)) {
    const target = normalizeChars(canonical);
    for (const word of words) {
      const key = normalizeChars(word);
      if (key && key !== target) toCanonical.set(key, target);
    }
  }
  const synonymRe = alternation([...toCanonical.keys()]);
  const fillerRe = alternation(FILLER_PHRASES.map(normalizeChars));
  const trailing = alternation(TRAILING_PHRASES.map(normalizeChars));
  const trailingRe = trailing ? new RegExp(`(?:${trailing.source})+$`) : null;

  return function normalize(text) {
    let out = normalizeChars(text);
    if (synonymRe) out = out.replace(synonymRe, (word) => toCanonical.get(word));
    if (fillerRe) out = out.replace(fillerRe, '');
    // 「柱って何」→「柱」。全部が消えるとき（「なに」だけの質問）は残す
    if (trailingRe) {
      const trimmed = out.replace(trailingRe, '');
      if (trimmed) out = trimmed;
    }
    return out;
  };
}

/** 2文字ずつに区切った集合（1文字しかないときは、その1文字） */
export function bigrams(text) {
  const set = new Set();
  if (text.length === 1) set.add(text);
  for (let i = 0; i < text.length - 1; i++) set.add(text.slice(i, i + 2));
  return set;
}
