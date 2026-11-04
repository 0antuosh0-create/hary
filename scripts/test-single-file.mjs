// Builds nothing: serves ONLY dist/index.html (every other URL is a 404) and runs the browser tests against it.
// This reproduces a single-file host, so any image/font/video still loaded by URL would visibly break.
import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const html = fs.readFileSync('dist/index.html');
const server = http.createServer((request, response) => {
  if (request.url === '/' || request.url === '/index.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  } else {
    response.writeHead(404);
    response.end('not found');
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
console.log(`Serving only dist/index.html at ${url}`);

let failed = false;
for (const script of process.argv.slice(2)) {
  // Async spawn: the server above must keep answering requests while the tests run.
  const code = await new Promise(resolve => {
    const child = spawn('node', [script], { stdio: 'inherit', env: { ...process.env, TEST_URL: url, SINGLE_FILE: '1' } });
    child.on('exit', resolve);
  });
  if (code !== 0) failed = true;
}
server.close();
process.exit(failed ? 1 : 0);
