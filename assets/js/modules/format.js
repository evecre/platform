// 表示用の整形

/**
 * URL（チャットボットのリンクなど）を、src / href に入れてよい形にする（http / https とサイト内のパスだけ）。
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
