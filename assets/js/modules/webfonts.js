// Web フォントの読み込み（common.js から全ページで呼ぶ）
//   日本語：Adobe Fonts（りょうゴシック PlusN。kit は JS だけ（日本語のダイナミックサブセット）なので、CSS の link では読めない）
//     ★Adobe Fonts の kit の「ドメイン」に、localhost と evecre.pages.dev（独自ドメインにしたらそれも）が入っていないと読めない
//     Adobe の埋め込みコードはインラインスクリプトなので、同じことをここでする（CLAUDE.md §5：インラインスクリプトを書かない）
//   英字：Google Fonts（Ultra）は CSS の link なので、各ページの <head> に書いてある
//   フォント名は foundation/_variables.css の --font-family-*

const ADOBE_KIT_ID = 'jtx8lwo';

export function loadWebFonts() {
  if (document.querySelector('script[data-adobe-fonts]')) return;
  const script = document.createElement('script');
  script.src = `https://use.typekit.net/${ADOBE_KIT_ID}.js`;
  script.async = true;
  script.dataset.adobeFonts = '';
  script.addEventListener('load', () => {
    try {
      window.Typekit.load({ kitId: ADOBE_KIT_ID, async: true });
    } catch {
      // 読めなくても、代わりのフォントで表示される
    }
  });
  document.head.append(script);
}
