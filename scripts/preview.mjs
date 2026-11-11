import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = await realpath(process.cwd());
const args = process.argv.slice(2);
const value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const port = Number(value('--port', '4173'));
const host = value('--host', '0.0.0.0');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://preview.local');
    if (url.pathname === '/__review') {
      const parsedWidth = Number(url.searchParams.get('width'));
      const parsedHeight = Number(url.searchParams.get('height'));
      const width = Number.isFinite(parsedWidth) && parsedWidth > 0 ? Math.max(280, Math.min(1920, Math.round(parsedWidth))) : 390;
      const height = Number.isFinite(parsedHeight) && parsedHeight > 0 ? Math.max(500, Math.min(6000, Math.round(parsedHeight))) : 852;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>HolyMind responsive review</title></head><body style="margin:0;background:#302639;color:#f4efff;font:14px Arial;display:flex;flex-direction:column;align-items:center"><p>Responsive review · ${width} × ${height} CSS pixels</p><iframe title="HolyMind mobile preview" src="/" style="width:${width}px;height:${height}px;border:0;display:block;flex:none"></iframe></body></html>`);
      return;
    }
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.split('/').some(part => part.startsWith('.')) || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(403).end('Forbidden'); return;
    }
    let file = resolve(root, '.' + decoded);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const physical = await realpath(file);
    if (!physical.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    const body = await readFile(physical);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => console.log(`HolyMind preview listening on ${host}:${port}`));
