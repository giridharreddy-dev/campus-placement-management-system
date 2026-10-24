import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function checkProjectFilesBrowser({
  command,
  evaluate,
  click,
  until,
  base,
  output,
}) {
  let checks = 0;
  const search = async (value) => {
    await evaluate(`(() => {
      const input = document.querySelector('#file-search');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await until(
      () =>
        evaluate(
          `document.querySelector('#file-search').value === ${JSON.stringify(value)}`,
        ),
      'file search',
    );
  };
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await command('Page.navigate', { url: base + '/project-files' });
  await until(
    () => evaluate("Boolean(document.querySelector('.files-layout'))"),
    'three-set explorer',
  );
  assert.equal(
    await evaluate("document.querySelectorAll('.files-sets button').length"),
    3,
  );
  checks++;
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.files-sidebar > .files-tree > li > details').length",
    ),
    5,
  );
  checks++;
  await click("document.querySelector('.files-sidebar summary')");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.files-sidebar > .files-tree > li:first-child details > ul > li > details').length",
    ),
    5,
  );
  checks++;
  await search('Experiment-4/e/db.js');
  await until(
    () =>
      evaluate(
        "document.querySelectorAll('.files-sidebar button').length === 1",
      ),
    'basic 4e search',
  );
  await click("document.querySelector('.files-sidebar button')");
  assert.match(
    await evaluate("document.querySelector('.files-preview pre').textContent"),
    /YOUR_MYSQL_PASSWORD/,
  );
  checks++;
  await search('no-such-file');
  assert.ok(
    await evaluate(
      "document.querySelector('.files-sidebar').textContent.includes('No matching files.')",
    ),
  );
  checks++;
  await click("document.querySelectorAll('.files-sets button')[1]");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.files-sidebar > .files-tree > li > details').length",
    ),
    5,
  );
  checks++;
  await search('Experiment-2');
  await click("document.querySelector('.files-sidebar button')");
  await until(() => evaluate("Boolean(document.querySelector('.files-preview pre'))"), 'combined source loaded');
  assert.match(
    await evaluate("document.querySelector('.files-preview pre').textContent"),
    /extends Component/,
  );
  checks++;
  assert.equal(
    await evaluate(
      "document.querySelector('.files-main > p a').getAttribute('href')",
    ),
    '/case-study',
  );
  checks++;
  await click("document.querySelectorAll('.files-sets button')[2]");
  for (const name of [
    'backend',
    'components',
    'context',
    'database',
    'case-study',
    'learning',
  ]) {
    assert.ok(
      await evaluate(
        `Array.from(document.querySelectorAll('.files-sidebar > .files-tree > li > details > summary')).some(item => item.textContent === '${name}/')`,
      ),
    );
    checks++;
  }
  await search('backend/server.js');
  await click("document.querySelector('.files-sidebar button')");
  await until(() => evaluate("Boolean(document.querySelector('.files-preview pre'))"), 'backend source loaded');
  assert.match(
    await evaluate("document.querySelector('.files-preview pre').textContent"),
    /express/,
  );
  checks++;
  await search('.env');
  assert.equal(
    await evaluate("document.querySelectorAll('.files-sidebar button').length"),
    0,
  );
  checks++;
  await search('case-study/experiment5');
  await click("document.querySelector('.files-sidebar button')");
  await until(() => evaluate("Boolean(document.querySelector('.files-preview pre'))"), 'SQL source loaded');
  assert.match(
    await evaluate("document.querySelector('.files-preview pre').textContent"),
    /CREATE DATABASE IF NOT EXISTS cpms_case_study/,
  );
  checks++;
  await command('Page.navigate', { url: base + '/project-files' });
  await until(
    () => evaluate("Boolean(document.querySelector('.files-layout'))"),
    'explorer reload',
  );
  const desktop = await command('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(
    path.join(output, 'project-files-desktop.png'),
    Buffer.from(desktop.data, 'base64'),
  );
  await command('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  assert.ok(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
  );
  checks++;
  const mobile = await command('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(
    path.join(output, 'project-files-mobile.png'),
    Buffer.from(mobile.data, 'base64'),
  );
  await click("document.querySelector('.files-main > p a')");
  await until(
    () => evaluate("Boolean(document.querySelector('.lab-switch'))"),
    'basic programs navigation',
  );
  assert.equal(
    await evaluate(
      "document.querySelector('.lab-switch button[aria-pressed=true]').textContent.trim()",
    ),
    'Basic program',
  );
  checks++;
  return checks;
}
