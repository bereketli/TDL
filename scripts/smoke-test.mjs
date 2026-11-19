import { spawn } from 'node:child_process';
import net from 'node:net';
const port = await new Promise((resolve, reject) => {
  const socket = net.createServer(); socket.once('error', reject);
  socket.listen(0, '127.0.0.1', () => { const address = socket.address(); socket.close(() => resolve(address.port)); });
});
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
let logs = ''; server.stdout.on('data', chunk => { logs += chunk; }); server.stderr.on('data', chunk => { logs += chunk; });
const origin = `http://127.0.0.1:${port}`;
try {
  let response;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    try { response = await fetch(origin, { signal: AbortSignal.timeout(2000) }); if (response.ok) break; } catch { /* Server startup. */ }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  if (!response?.ok) throw new Error(`Production page did not start: ${logs}`);
  const html = await response.text();
  if (!/<html\b[^>]*\bdata-theme="dark"/.test(html)) throw new Error('The initial server-rendered theme should be dark.');
  for (const content of ['Fuyat Hotel', 'Olkai Coffee Roasters', 'Hillside Real Estate', 'Debre Birhan MESOB Center', 'Physical sampling', 'Afaan Oromoo', 'tel:+251911475124', 'id="before-after"']) {
    if (!html.includes(content)) throw new Error(`Server-rendered page missing: ${content}`);
  }
  for (const [url, type] of [
    ['/images/brand/tdl-logo.webp', 'image/webp'],
    ['/images/projects/fuyat.webp', 'image/webp'],
    ['/images/studio/metalwork-in-progress.webp', 'image/webp'],
    ['/videos/facade-animation.mp4', 'video/mp4'],
    ['/videos/facade-animation.webp', 'image/webp'],
    ['/documents/tdl-company-catalogue-2026.pdf', 'application/pdf'],
    ['/_next/image?url=%2Fimages%2Fprojects%2Ffuyat.webp&w=640&q=75', 'image/'],
  ]) {
    const result = await fetch(origin + url);
    if (!result.ok || !result.headers.get('content-type')?.startsWith(type)) throw new Error(`Asset failed: ${url} ${result.status}`);
    await result.arrayBuffer();
  }
  if ((await fetch(origin + '/this-page-does-not-exist')).status !== 404) throw new Error('Unknown routes should return 404');
  console.log('Production smoke test passed: SSR, real project copy, language options, image files, image optimization, PDF and 404 handling.');
} finally {
  server.kill('SIGTERM');
  await new Promise(resolve => { if (server.exitCode !== null) resolve(); else { server.once('exit', resolve); setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 2000).unref(); } });
}
