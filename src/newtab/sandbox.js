/* Runs ONLY in the manifest-declared opaque-origin sandbox: no extension APIs. */
addEventListener('message', function render(event) {
  if (event.source !== parent || event.data?.type !== 'tabflow:render-page' || typeof event.data.content !== 'string') return;
  removeEventListener('message', render);
  document.open();
  document.write(event.data.content);
  document.close();
});
