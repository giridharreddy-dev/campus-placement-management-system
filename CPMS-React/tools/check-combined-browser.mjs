import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function checkCombinedBrowser({ command, evaluate, click, until, base, output }) {
  let checks = 0;
  let createdId;
  const api = 'http://127.0.0.1:5020/applications';
  const company = `Browser observation ${Date.now()}`;
  const select = async (id) => click(`document.querySelectorAll('.case-navigation button')[${id - 1}]`);
  try {
    await command('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await command('Page.navigate', { url: base + '/case-study' });
    await until(() => evaluate("Boolean(document.querySelector('.case-hero'))"), 'combined case-study page');
    assert.equal(await evaluate("document.querySelectorAll('.case-navigation button').length"), 5); checks++;
    const guide = await evaluate("document.querySelector('.case-hero a[download]').href");
    assert.match(await (await fetch(guide)).text(), /## Experiment 5:/); checks++;
    const screen = await command('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(output, 'combined-case-desktop.png'), Buffer.from(screen.data, 'base64'));
    for (let id = 1; id <= 5; id++) {
      await select(id);
      assert.equal(await evaluate("document.querySelectorAll('article > .lab-panel:first-of-type li').length"), 5); checks++;
      assert.equal(await evaluate("document.querySelectorAll('article details').length"), ({ 1: 2, 2: 1, 3: 1, 4: 3, 5: 1 })[id]); checks++;
    }
    await select(1);
    const html = await evaluate("document.querySelector('iframe').srcdoc");
    const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
    try {
      await command('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) }, sessionId);
      const run = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true }, sessionId)).result.value;
      await until(() => run("Boolean(document.querySelector('#check'))"), 'combined native eligibility checker');
      for (const [cgpa, pattern] of [['8.2', /meets the CGPA criterion/], ['6.5', /below/], ['11', /from 0 to 10/]]) {
        await run(`document.querySelector('#name').value = 'Giri'; document.querySelector('#cgpa').value = '${cgpa}'; document.querySelector('#check').click()`);
        assert.match(await run("document.querySelector('#result').textContent"), pattern); checks++;
      }
    } finally { await command('Target.closeTarget', { targetId }); }
    await select(2);
    await click("Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Complete a round')");
    assert.equal(await evaluate("document.querySelector('.case-feature output').textContent"), '1'); checks++;
    for (let i = 0; i < 3; i++) await click("Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Solve a problem')");
    assert.match(await evaluate("document.querySelector('.case-feature').textContent"), /Daily practice goal reached/); checks++;
    for (let i = 0; i < 4; i++) await click("Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Undo problem')");
    assert.equal(await evaluate("document.querySelectorAll('.case-feature output')[1].textContent"), '0'); checks++;
    await click("Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Preparation tip')");
    assert.match(await evaluate("document.querySelector('.case-feature').textContent"), /Explain your approach/); checks++;
    await select(3);
    await until(() => evaluate("document.querySelectorAll('.case-feature option').length === 4"), 'combined MySQL-backed student fetch'); checks++;
    await evaluate(`(() => { const input = document.querySelector('.case-feature input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '${company}'); input.dispatchEvent(new Event('input', {bubbles:true})); })()`);
    await evaluate("(() => { const select = document.querySelector('.case-feature select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, '1'); select.dispatchEvent(new Event('change', {bubbles:true})); })()");
    await click("document.querySelector('.case-feature form button')");
    await until(() => evaluate(`document.querySelector('.case-feature ul').textContent.includes('${company}')`), 'combined registration persisted');
    const rows = await (await fetch(api)).json();
    createdId = rows.find((row) => row.company === company)?.id;
    assert.ok(createdId); checks++;
    assert.equal(await evaluate("document.querySelector('.case-feature output').textContent"), '1'); checks++;
    await select(4);
    await click("Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Load applications')");
    await until(() => evaluate(`document.querySelector('.case-feature ul').textContent.includes('${company}')`), 'shared registration visible to placement officer'); checks++;
    await click(`Array.from(document.querySelectorAll('.case-feature li')).find(item => item.textContent.includes('${company}')).querySelector('button')`);
    await until(() => evaluate(`Array.from(document.querySelectorAll('.case-feature li')).find(item => item.textContent.includes('${company}'))?.textContent.includes('Shortlisted')`), 'combined shortlist persisted'); checks++;
    await click(`Array.from(document.querySelectorAll('.case-feature li')).find(item => item.textContent.includes('${company}')).querySelectorAll('button')[1]`);
    await until(() => evaluate(`!document.querySelector('.case-feature ul').textContent.includes('${company}')`), 'combined removal persisted');
    assert.ok(!(await (await fetch(api)).json()).some((row) => row.id === createdId)); checks++;
    createdId = undefined;
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth')); checks++;
    const mobile = await command('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(output, 'combined-case-mobile.png'), Buffer.from(mobile.data, 'base64'));
    return checks;
  } finally {
    if (createdId) await fetch(`${api}/${createdId}`, { method: 'DELETE' });
  }
}
