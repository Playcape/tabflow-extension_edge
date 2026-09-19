/* Imported HTML stays in an opaque-origin frame. Chromium's manifest sandbox
 * has a separate CSP; srcdoc alone inherits the privileged extension CSP. */
import { ext, IS_CHROMIUM } from '../common/ext.js';
export function mountPage(frame, page, content) {
  frame.onload = null;
  frame.removeAttribute('srcdoc');
  if (page.method === 'embed') {
    const url = new URL(content.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS address for embedded Pages.');
    frame.src = url.href;
  } else if (IS_CHROMIUM) {
    frame.onload = () => { frame.onload = null; frame.contentWindow.postMessage({type:'tabflow:render-page', content}, '*'); };
    frame.src = ext.runtime.getURL('newtab/sandbox.html');
  } else {
    // Firefox may restrict inline scripts through extension CSP. Never weaken it.
    frame.removeAttribute('src');
    frame.srcdoc = content;
  }
}
