// Windows headless Chrome check. Start frontend, portal API and lab servers first.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { lessons } from '../learning/catalog.js';
import { checkCombinedBrowser } from './check-combined-browser.mjs';
import { checkProjectFilesBrowser } from './check-project-files-browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.verification');
await fs.mkdir(output, { recursive: true });
// Vite ignores node_modules in both repository layouts, so profile writes
// cannot trigger HMR reloads during an assertion.
const profileRoot = path.join(root, 'node_modules', '.cache', 'browser-check');
await fs.mkdir(profileRoot, { recursive: true });
const profile = await fs.mkdtemp(path.join(profileRoot, 'chrome-'));
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--disable-gpu', '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let checks = 0;
const pending = new Map();
let sequence = 0;
const exceptions = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label) {
  for (let i = 0; i < 100; i++) { const value = await check(); if (value) return value; await pause(100); }
  throw new Error('Browser timeout: ' + label);
}
function command(method, params = {}, sessionId) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, method === 'Page.captureScreenshot' ? 30000 : 10000);
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function click(expression) { await evaluate(`(${expression}).click()`); await pause(80); }
try {
  const info = await until(async () => { try { return (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n'); } catch { return null; } }, 'Chrome startup');
  const tab = await (await fetch(`http://127.0.0.1:${info[0]}/json/new`, { method: 'PUT' })).json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.text);
    if (data.method === 'Page.javascriptDialogOpening') void command('Page.handleJavaScriptDialog', { accept: false }, data.sessionId);
    const waiter = pending.get(data.id);
    if (waiter) { pending.delete(data.id); if (data.error) waiter.reject(new Error(data.error.message)); else waiter.resolve(data.result); }
  });
  await command('Page.enable'); await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  const base = process.env.BROWSER_BASE_URL || 'http://127.0.0.1:5173';
  if (process.env.BROWSER_SHARED_ONLY === '1') {
    const { checkSharedWorkspaceBrowser } = await import('./check-shared-workspace-browser.mjs');
    checks += await checkSharedWorkspaceBrowser({ command, evaluate, click, until, base, output });
    assert.deepEqual(exceptions, []);
    console.log(`Shared workspace browser: ${checks} checks passed, including company CRUD, cross-role profile and interview visibility, private schedules, notifications and mobile management. No uncaught JavaScript exceptions.`);
  } else if (process.env.BROWSER_WORKSPACE_ONLY === '1') {
    const { checkWorkspaceBrowser } = await import('./check-workspace-browser.mjs');
    checks += await checkWorkspaceBrowser({ command, evaluate, click, until, base, output });
    if (process.env.BROWSER_VERIFY_LIVE === '1') {
      const { checkLiveWorkspaceBrowser } = await import('./check-live-workspace-browser.mjs');
      checks += await checkLiveWorkspaceBrowser({ command, evaluate, click, until, base, output });
    }
    assert.deepEqual(exceptions, []);
    console.log(`Career workspace: ${checks} browser checks passed. Demo flow, role switching, persistence, scheduling, exports, mobile navigation and sign-in verified. No uncaught JavaScript exceptions.`);
  } else if (process.env.BROWSER_PROJECT_FILES_ONLY === '1') {
    checks += await checkProjectFilesBrowser({ command, evaluate, click, until, base, output });
    assert.deepEqual(exceptions, []);
    console.log(`Folder explorer: ${checks} checks passed, including all three sets, subfolders, search, source loading, mobile layout and basic-program navigation. No uncaught JavaScript exceptions.`);
  } else {
  await command('Page.navigate', { url: base + '/syllabus' });
  await until(() => evaluate("document.querySelector('.lab-hero h1')?.textContent"), 'learning page');
  assert.equal(await evaluate("document.querySelectorAll('.lab-sidebar button').length"), 25); checks++;
  await pause(500);
  const screen = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(path.join(output, 'syllabus-desktop.png'), Buffer.from(screen.data, 'base64'));
  for (const lesson of lessons) {
    await click(`Array.from(document.querySelectorAll('.lab-sidebar button')).find(button => button.querySelector('b').textContent === '${lesson.id}')`);
    for (const mode of ['basic', 'case']) {
      await click(`document.querySelectorAll('.lab-switch button')[${mode === 'basic' ? 0 : 1}]`);
      assert.equal(await evaluate("document.querySelector('.lab-content > h2').textContent"), lesson.title);
      const sourceCount = await evaluate("document.querySelectorAll('.lab-panel details').length");
      assert.ok(sourceCount >= (lesson.unit === 1 ? 2 : 1));
      if (lesson.id === '3b' && mode === 'case') {
        await until(() => evaluate("document.querySelector('.lab-panel ul li')?.textContent"), 'API-loaded list');
        assert.equal(await evaluate("document.querySelectorAll('.lab-panel:first-of-type ul li').length"), 2);
      }
      if (lesson.unit <= 3 && mode === 'basic') {
        assert.match(await evaluate("document.querySelector('.lab-panel details summary').textContent"), /FSD\/Experiment-1|src\/Experiments[23]/);
        const previewUrl = await evaluate("document.querySelector('iframe').src");
        const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
        await command('Page.enable', {}, sessionId);
        await command('Runtime.enable', {}, sessionId);
        await command('Page.navigate', { url: previewUrl }, sessionId);
        const run = async (expression) => {
          const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
          if (result.exceptionDetails) throw new Error(`${lesson.id}: ${result.exceptionDetails.text}`);
          return result.result.value;
        };
        await until(() => run("Boolean(document.querySelector('h1,h2'))"), 'original ' + lesson.id);
        if (lesson.id === '1c') {
          await run("document.querySelector('#btn').click()");
          assert.match(await run("document.querySelector('#msg').textContent"), /Button Clicked/);
        }
        if (lesson.id === '1d') {
          await run("document.querySelector('#btn3').click()");
          assert.equal(await run("document.querySelector('#output').textContent"), 'Button 3 Clicked!');
        }
        if (lesson.id === '1e') {
          await run('addition()');
          assert.equal(await run("document.querySelector('#output').textContent"), 'addition = 25');
        }
        if (lesson.id === '2a') {
          await run("document.querySelector('button').click()");
          await until(async () => await run("document.querySelectorAll('h1')[1]?.textContent") === '1', 'original class counter');
        }
        if (lesson.id === '2b' || lesson.id === '3a') {
          await run(lesson.id === '2b' ? "document.querySelector('button').click()" : "document.querySelectorAll('button')[1].click()");
          await until(async () => await run("document.querySelector('.count').textContent") === '1', 'original functional counter');
        }
        if (lesson.id === '2c') {
          await run("document.querySelector('button').click()");
          await until(() => run("document.querySelector('.message').textContent.includes('submitted successfully')"), 'original click action');
        }
        if (lesson.id === '2d') {
          await run("document.querySelector('button').click()");
          await until(() => run("Boolean(document.querySelector('.success'))"), 'original condition');
        }
        if (lesson.id === '3b') {
          await until(() => run("Boolean(document.querySelector('.student-card')) || /Failed|Error|fetch/i.test(document.body.textContent)"), 'original external fetch output or error');
        }
        if (lesson.id === '3e') assert.equal(await run("document.querySelectorAll('.company-card').length"), 6);
        if (lesson.id === '3c') assert.match(await run("document.querySelector('.student-card').textContent"), /Rahul Sharma/);
        if (lesson.id === '3d') {
          for (const [name, value] of Object.entries({ name: 'Giri', email: 'giri@example.com', cgpa: '8.5', role: 'Developer', branch: 'CSE', status: 'Applied' })) {
            await run(`(() => { const input = document.querySelector('#${name}'); const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, '${value}'); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true})); })()`);
            await pause(30);
          }
          await run("document.querySelector('form button').click()");
          await until(() => run("Boolean(document.querySelector('.result-card'))"), 'original form submit');
          assert.match(await run("document.querySelector('.result-card').textContent"), /Giri/);
        }
        if (lesson.id === '3e') {
          await evaluate("document.querySelector('.lab-content > h2').scrollIntoView()");
          await pause(150);
          const originalScreen = await command('Page.captureScreenshot', { format: 'png' });
          await fs.writeFile(path.join(output, 'original-basic-program.png'), Buffer.from(originalScreen.data, 'base64'));
        }
        checks++;
        await command('Target.closeTarget', { targetId });
      }
      if (lesson.unit === 1 && mode === 'case') {
        // Execute the exact embedded HTML in a separate headless tab. This
        // avoids depending on Chromium's opaque sandbox-frame process layout.
        const srcdoc = await evaluate("document.querySelector('iframe').srcdoc");
        const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
        await command('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(srcdoc) }, sessionId);
        const selectors = { '1a': '#message', '1b': '#heading', '1c': '#name', '1d': '#action', '1e': '#expression' };
        await until(async () => {
          const result = await command('Runtime.evaluate', { expression: `Boolean(document.querySelector('${selectors[lesson.id]}'))`, returnByValue: true }, sessionId);
          return result.result.value;
        }, 'native HTML content');
        const actions = {
          '1a': "document.querySelector('#message').textContent",
          '1b': "document.querySelector('#output').textContent",
          '1c': "(() => { const input = document.querySelector('#name'); input.value = 'Giri'; input.dispatchEvent(new Event('input')); return document.querySelector('#output').textContent; })()",
          '1d': "(() => { document.querySelector('#action').click(); return document.querySelector('#output').textContent; })()",
          '1e': "(() => { document.querySelector('#expression').click(); return document.querySelector('#output').textContent; })()",
        };
        const native = await command('Runtime.evaluate', { expression: actions[lesson.id], returnByValue: true }, sessionId);
        const patterns = { '1a': /Welcome|linked successfully/, '1b': /2 items, 1 button/, '1c': /Welcome, Giri/, '1d': /shortlisted|clicked successfully/, '1e': /7 vacancies|Sum: 25/ };
        if (typeof native.result.value !== 'string') throw new Error(JSON.stringify(native));
        assert.match(native.result.value, patterns[lesson.id]); checks++;
        await command('Target.closeTarget', { targetId });
      }
      checks++;
    }
  }
  await click("Array.from(document.querySelectorAll('.lab-sidebar button')).find(button => button.querySelector('b').textContent === '2a')");
  assert.ok(await evaluate("document.querySelectorAll('.lab-source .code-token.keyword').length > 0")); checks++;
  assert.match(await evaluate("document.querySelector('.lab-source code').textContent"), /return \(\s*\n/); checks++;
  await evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async (value) => {window.copiedCode = value;}}})");
  await click("document.querySelector('.lab-source-toolbar button')");
  assert.equal(await evaluate('window.copiedCode'), await evaluate("document.querySelector('.lab-source code').textContent")); checks++;
  await evaluate("document.querySelector('.lab-source').scrollIntoView({block:'start'})");
  const formatted = await command('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(output, 'formatted-jsx-code.png'), Buffer.from(formatted.data, 'base64'));
  await click("Array.from(document.querySelectorAll('.lab-panel button')).find(button => button.textContent === 'Increase')");
  assert.equal(await evaluate("document.querySelector('.lab-panel output').textContent"), '1'); checks++;
  await click("Array.from(document.querySelectorAll('.lab-sidebar button')).find(button => button.querySelector('b').textContent === '4d')");
  await evaluate(`(() => { const inputs = document.querySelectorAll('.lab-panel:first-of-type form input'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; ['Browser practice', 'Browser company'].forEach((value, i) => { setter.call(inputs[i], value); inputs[i].dispatchEvent(new Event('input', { bubbles: true })); }); })()`);
  await click("document.querySelector('.lab-panel:first-of-type form button')");
  await until(() => evaluate("document.querySelector('.lab-panel:first-of-type li')?.textContent.includes('Browser practice')"), 'CRUD create'); checks++;
  await click("Array.from(document.querySelectorAll('.lab-panel button')).find(button => button.textContent === 'Shortlist (PUT)')");
  await until(() => evaluate("document.querySelector('.lab-panel:first-of-type li')?.textContent.includes('Shortlisted')"), 'CRUD update'); checks++;
  await click("Array.from(document.querySelectorAll('.lab-panel button')).find(button => button.textContent === 'Delete practice record')");
  await until(() => evaluate("!document.querySelector('.lab-panel:first-of-type li')"), 'CRUD delete'); checks++;
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth')); checks++;
  const mobile = await command('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(output, 'syllabus-mobile.png'), Buffer.from(mobile.data, 'base64'));
  checks += await checkCombinedBrowser({ command, evaluate, click, until, base, output });
  checks += await checkProjectFilesBrowser({ command, evaluate, click, until, base, output });
  if (process.env.BROWSER_VERIFY_STUDENT === '1') {
    const { checkStudentBrowser } = await import('./check-student-browser.mjs');
    checks += await checkStudentBrowser({ command, evaluate, click, until, base, output });
  }
  await command('Page.navigate', { url: base + '/' });
  await until(() => evaluate("Boolean(document.querySelector('#login-email'))"), 'portal login');
  assert.equal(await evaluate("document.querySelector('.cpms-lab-link').getAttribute('href')"), '/syllabus'); checks++;
  assert.deepEqual(exceptions, []);
  console.log(`Browser: ${checks} checks passed; individual examples, five combined case studies, MySQL registration/shortlisting/removal, source display, mobile layout and portal navigation verified. No uncaught JavaScript exceptions.`);
  }
} finally {
  if (exceptions.length) console.error('Browser exceptions:', exceptions);
  if (socket) socket.close();
  chrome.kill();
}
