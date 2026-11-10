// 表示用の整形（日付・ファイルの大きさ・URL）

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

// 本体の public/js/utils.js の formatDateWithTime と同じ表記に、年を足したもの（アーカイブは年をまたぐため）
function formatDateWithTime(dateStr, time) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = !Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d) ? WEEKDAYS_JA[new Date(y, m - 1, d).getDay()] : '';
  const base = `${y}/${m}/${d}${wd ? `（${wd}）` : ''}`;
  const start = time?.start || '';
  const end = time?.end || '';
  if (!start && !end) return base;
  return `${base} ${start}〜${end}`;
}

/**
 * 開催日と時刻を、表示する行の配列にする（本体の formatEventPeriodLines と同じ考え方）。
 * 時刻が1日も無ければ範囲1行（例 '2026/7/18（土） 〜 2026/7/19（日）'）、あれば日ごとに1行
 * @param {string[]} dates  'YYYY-MM-DD' の配列
 * @param {{ [date: string]: { start?: string, end?: string } }} [dateTimes]
 * @returns {string[]}  日程が無ければ空の配列
 */
export function formatEventPeriodLines(dates, dateTimes) {
  const list = Array.isArray(dates) ? [...dates].filter((d) => typeof d === 'string' && d).sort() : [];
  if (list.length === 0) return [];
  const dt = dateTimes && typeof dateTimes === 'object' ? dateTimes : {};
  const hasAnyTime = list.some((d) => dt[d] && (dt[d].start || dt[d].end));
  if (!hasAnyTime) {
    if (list.length === 1) return [formatDateWithTime(list[0])];
    return [`${formatDateWithTime(list[0])} 〜 ${formatDateWithTime(list[list.length - 1])}`];
  }
  return list.map((d) => formatDateWithTime(d, dt[d]));
}

/**
 * 1日の日付（例 '2026/11/8（日）'）。最終更新日など。'YYYY-MM-DD' でなければ ''
 * new Date('YYYY-MM-DD') は UTC で読まれて日本時間の前日になるので、年月日に分けて扱う
 */
export function formatDate(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? formatDateWithTime(dateStr) : '';
}

/** バイト数を「24 KB」「1.2 MB」の形に */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * API から来た URL を、src / href に入れてよい形にする（http / https とサイト内のパスだけ）。
 * javascript: などは null
 */
export function safeUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
