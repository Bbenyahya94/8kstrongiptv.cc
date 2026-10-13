import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 3000);
const routes = new Set(['subscription', 'reseller', 'panel', 'server-network', 'setup-guide', 'downloads', 'contact', 'faq']);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function redirect(res, location) {
  res.writeHead(301, { Location: location, 'Cache-Control': 'public, max-age=3600' });
  res.end();
}

async function send(req, res, file, status = 200) {
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(status, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  } catch {
    if (status === 404) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(req.method === 'HEAD' ? undefined : '404 Not Found');
    }
    return send(req, res, join(root, '404.html'), 404);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad Request'); }

  if (pathname === '/index.html') return redirect(res, '/');
  const htmlRoute = pathname.match(/^\/([^/]+)\.html$/);
  if (htmlRoute && routes.has(htmlRoute[1])) return redirect(res, `/${htmlRoute[1]}`);
  const slashRoute = pathname.match(/^\/([^/]+)\/$/);
  if (slashRoute && routes.has(slashRoute[1])) return redirect(res, `/${slashRoute[1]}`);
  if (pathname === '/') return send(req, res, join(root, 'index.html'));

  const cleanRoute = pathname.slice(1);
  if (routes.has(cleanRoute)) return send(req, res, join(root, cleanRoute, 'index.html'));

  const relative = normalize(pathname.replace(/^\/+/, ''));
  const requested = join(root, relative);
  if (relative.startsWith('..') || !requested.startsWith(root + sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  return send(req, res, requested);
});

server.listen(port, '0.0.0.0', () => console.log(`8K Strong IPTV listening on 0.0.0.0:${port}`));
