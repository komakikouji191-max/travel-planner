import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { const data = await readFile(new URL(file[0], import.meta.url)); res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` }); res.end(data); }
  catch { res.writeHead(500); res.end('Unable to read file'); }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log('Travel planner listening on port ' + (process.env.PORT || 3000)));
