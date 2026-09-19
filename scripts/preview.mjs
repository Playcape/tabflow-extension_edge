import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../src/', import.meta.url));
export function serve(port = 4173) {
  const server = http.createServer(async (req, res) => {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/newtab/newtab.html' : new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403).end(); return; }
    try {
      const content = await readFile(path);
      res.writeHead(200, { 'Content-Type': ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await serve(); console.log('TabFlow preview: http://127.0.0.1:4173');
}
