import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 3000);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8' };

function send(res, file, status = 200) {
  res.writeHead(status, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end('Bad Request'); }
  if (pathname === '/index.html') { res.writeHead(301, { Location: '/' }); return res.end(); }
  const legacy = pathname.match(/^\/(.+)\.html$/);
  if (legacy) { res.writeHead(301, { Location: `/${legacy[1]}/` }); return res.end(); }
  if (pathname !== '/' && !pathname.endsWith('/') && !extname(pathname)) { res.writeHead(301, { Location: pathname + '/' }); return res.end(); }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const requested = normalize(join(root, relative));
  if (!requested.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  try {
    const info = await stat(requested);
    const file = info.isDirectory() ? join(requested, 'index.html') : requested;
    await stat(file);
    return send(res, file);
  } catch {
    return send(res, join(root, '404.html'), 404);
  }
}).listen(port, '0.0.0.0', () => console.log(`Preview: http://localhost:${port}`));
