import { ext } from '../common/ext.js';
import { normalizeDoc } from './migrations.js';
import { resolvePageContent } from './pageStorage.js';
import { mountPage } from './pageViewer.js';
try {
  const id = new URL(location.href).searchParams.get('page');
  const raw = (await ext.storage.local.get('tabflow_v3')).tabflow_v3;
  if (!raw) throw new Error('The workspace is not available.');
  const page = normalizeDoc(raw).pageSpaces.flatMap(space=>space.pages).find(page=>page.id===id);
  if (!page) throw new Error('This Page no longer exists. Open your workspace to choose another.');
  document.title = `${page.title} · TabFlow`;
  document.querySelector('#page-title').textContent = page.title;
  mountPage(document.querySelector('#page-frame'), page, await resolvePageContent(page, {strict:!!page.contentStorage}));
} catch (error) {
  const message = document.querySelector('#page-error'); message.hidden = false; message.textContent = error.message;
}
