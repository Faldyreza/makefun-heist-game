// serve.ts — a tiny static server for game/ (Node 22, stdlib only), so the
// entry can be played locally without a build step:
//   node serve.ts            serves game/ on http://localhost:8080
// It sends the MIME types a browser game needs, refuses any path outside
// game/, and otherwise does nothing clever: a development convenience.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'game'));
const port = Number(process.env.PORT ?? 8080);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const relPath = normalize(urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, ''));
  const filePath = join(gameDir, relPath);
  if (!filePath.startsWith(gameDir + sep) && filePath !== gameDir) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (!stat.isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': mimeTypes.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
    'content-length': stat.size,
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`serve.ts: MIDNIGHT VAULT at http://localhost:${port}`);
});
