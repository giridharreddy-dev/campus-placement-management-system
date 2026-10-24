import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

// All writes in this check are to sample data in an isolated Chrome profile.
// The signed-in portal is inspected separately using read-only requests.
export async function checkWorkspaceBrowser({
  command,
  evaluate,
  click,
  until,
  base,
  output,
}) {
  let checks = 0;
  const nav = async (name) => {
    await click(
      `Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes(${JSON.stringify(name)}))`,
    );
  };
  const button = async (text, scope = 'document') =>
    click(
      `Array.from(${scope}.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)})`,
    );
  const fill = async (selector, value, event = 'input') => {
    await evaluate(
      `(() => { const input = document.querySelector(${JSON.stringify(selector)}); const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('${event}', {bubbles:true})); })()`,
    );
  };
  const role = async (value) => {
    await fill('.ws-role-switch select', value, 'change');
    await until(
      () =>
        evaluate(
          `document.querySelector('.ws-role-switch select').value === '${value}'`,
        ),
      'role switch',
    );
  };
  const shot = async (name) => {
    const screen = await command('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(
      path.join(output, name),
      Buffer.from(screen.data, 'base64'),
    );
  };
  const downloadDir = await fs.mkdtemp(
    path.join(output, 'workspace-downloads-'),
  );
  await command('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir,
  });
  await command('Page.navigate', { url: base + '/demo' });
  await until(
    () => evaluate("Boolean(document.querySelector('.ws-app'))"),
    'workspace demo',
  );
  await evaluate("localStorage.removeItem('cpms.demo.workspace.v1')");
  await command('Page.reload');
  await until(
    () =>
      evaluate(
        "document.querySelector('.ws-page-heading h1')?.textContent.includes('Giri')",
      ),
    'fresh student demo',
  );
  assert.match(
    await evaluate("document.querySelector('.ws-environment').textContent"),
    /sample data/,
  );
  checks++;
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-stat').length"),
    4,
  );
  checks++;
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ws-sidebar nav button').length",
    ),
    8,
  );
  checks++;
  await shot('workspace-student-desktop.png');
  await click("document.querySelector('.ws-bell')");
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('.ws-notice-popover[role=region]'))",
    ),
  );
  checks++;
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
  });
  assert.ok(
    await evaluate(
      "!document.querySelector('.ws-notice-popover') && document.activeElement === document.querySelector('.ws-bell')",
    ),
  );
  checks++;
  await click("document.querySelector('.ws-bell')");
  await evaluate(
    "(() => { const outside = document.querySelector('.ws-demo-banner button'); outside.focus(); outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); })()",
  );
  assert.ok(
    await evaluate(
      "!document.querySelector('.ws-notice-popover') && document.activeElement === document.querySelector('.ws-demo-banner button')",
    ),
  );
  checks++;
  await click("document.querySelector('.ws-bell')");
  await click('document.querySelector(\'[aria-label="Close notifications"]\')');
  assert.equal(
    await evaluate(
      "document.querySelector('.ws-bell').getAttribute('aria-expanded')",
    ),
    'false',
  );
  checks++;
  await button('Demo walkthrough');
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-walkthrough').textContent.includes('PixelWorks')",
    ),
  );
  checks++;
  await nav('Explore opportunities');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-drive-card').length"),
    6,
  );
  checks++;
  await fill('.ws-search input', 'CloudTech');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-drive-card').length"),
    1,
  );
  checks++;
  await fill('.ws-search input', 'no-such-company');
  assert.match(
    await evaluate("document.querySelector('.ws-empty h3').textContent"),
    /No matching/,
  );
  checks++;
  await fill('.ws-search input', '');
  await fill('.ws-filter-bar select', 'Remote', 'change');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-drive-card').length"),
    1,
  );
  checks++;
  assert.equal(
    await evaluate("document.querySelector('.ws-filter-chip').textContent"),
    'Location: Remote',
  );
  checks++;
  await click(
    'document.querySelector(\'[aria-label="Clear Location: Remote"]\')',
  );
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-drive-card').length"),
    6,
  );
  checks++;
  await fill('.ws-filter-bar select', 'Remote', 'change');
  await nav('Saved opportunities');
  assert.equal(
    await evaluate("document.querySelector('.ws-empty h3').textContent"),
    'No matching opportunities',
  );
  checks++;
  await button('Reset opportunity filters');
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-page-heading h1').textContent.includes('personal shortlist') && document.querySelectorAll('.ws-drive-card').length === 1",
    ),
  );
  checks++;
  await nav('Explore opportunities');
  await fill('.ws-search input', 'React');
  await evaluate(
    "(() => { const select = document.querySelectorAll('.ws-filter-bar select')[2]; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'Company A–Z'); select.dispatchEvent(new Event('change', { bubbles: true })); })()",
  );
  await shot('workspace-opportunity-filters.png');
  await button('Clear filters');
  assert.ok(
    await evaluate(
      "document.querySelectorAll('.ws-drive-card').length === 6 && document.querySelectorAll('.ws-filter-chip').length === 0 && document.querySelectorAll('.ws-filter-bar select')[2].value === 'Latest'",
    ),
  );
  checks++;
  await fill('.ws-filter-bar select', 'All locations', 'change');
  await click('document.querySelector(\'[aria-label="Save DataSystems"]\')');
  await nav('Saved opportunities');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-drive-card').length"),
    2,
  );
  checks++;
  await nav('Explore opportunities');
  await click(
    "Array.from(document.querySelectorAll('.ws-drive-card')).find(card => card.textContent.includes('PixelWorks')).querySelector('.ws-text-button')",
  );
  await until(
    () => evaluate("Boolean(document.querySelector('[role=dialog]'))"),
    'role details',
  );
  assert.match(
    await evaluate("document.querySelector('[role=dialog]').textContent"),
    /Frontend Developer/,
  );
  checks++;
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
  });
  assert.equal(
    await evaluate("document.querySelectorAll('[role=dialog]').length"),
    0,
  );
  checks++;
  await click(
    "Array.from(document.querySelectorAll('.ws-drive-card')).find(card => card.textContent.includes('PixelWorks')).querySelector('.ws-text-button')",
  );
  await button(
    'Apply for this role',
    "document.querySelector('[role=dialog]')",
  );
  await until(
    () => evaluate("!document.querySelector('[role=dialog]')"),
    'demo application submitted',
  );
  await nav('My applications');
  await fill('.ws-filter-bar select', 'Offered', 'change');
  await fill('.ws-search input', 'PixelWorks');
  await button('Clear filters');
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-filter-bar select').value === 'All stages' && document.querySelector('.ws-search input').value === ''",
    ),
  );
  checks++;
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-application').length"),
    3,
  );
  checks++;
  assert.match(
    await evaluate(
      "Array.from(document.querySelectorAll('.ws-application')).find(card => card.textContent.includes('PixelWorks')).textContent",
    ),
    /Applied/,
  );
  checks++;
  await click(
    "Array.from(document.querySelectorAll('.ws-application')).find(card => card.textContent.includes('PixelWorks')).querySelector('.ws-text-button')",
  );
  assert.match(
    await evaluate("document.querySelector('[role=dialog]').textContent"),
    /Application submitted/,
  );
  checks++;
  await click('document.querySelector(\'[aria-label="Close dialog"]\')');
  await role('RECRUITER');
  await nav('Candidate pipeline');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-application').length"),
    3,
  );
  checks++;
  assert.ok(
    await evaluate(
      "Array.from(document.querySelectorAll('.ws-application')).every(card => card.textContent.includes('TechCorp'))",
    ),
  );
  checks++;
  await button('Board');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-board-column').length"),
    5,
  );
  checks++;
  await shot('workspace-recruiter-board.png');
  await role('ADMIN');
  await nav('Recruitment drives');
  await button('Publish opportunity');
  const fields = await evaluate(
    "Array.from(document.querySelectorAll('.ws-dialog form input')).map(input => input.type)",
  );
  assert.equal(fields.length, 8);
  checks++;
  for (const [index, value] of [
    'DemoWorks',
    'Junior Web Developer',
    'Hyderabad',
    '6.0 LPA',
    '5.0 LPA',
    '7',
    '',
    'React, CSS',
  ].entries()) {
    // Use the ordered input elements, rather than their label positions.
    if (value)
      await evaluate(
        `(() => { const input = document.querySelectorAll('.ws-dialog form input')[${index}]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', {bubbles:true})); })()`,
      );
  }
  await fill(
    '.ws-dialog form textarea',
    'Build useful campus products with a friendly team.',
  );
  await button(
    'Publish opportunity',
    "document.querySelector('[role=dialog]')",
  );
  await until(
    () => evaluate("!document.querySelector('[role=dialog]')"),
    'new drive published',
  );
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-drive-card').length"),
    7,
  );
  checks++;
  await nav('Manage companies');
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ws-company-table tbody tr').length",
    ),
    7,
  );
  checks++;
  assert.ok(
    await evaluate(
      "Array.from(document.querySelectorAll('.ws-company-table tr')).find(row => row.textContent.includes('TechCorp')).querySelector('button.danger').disabled",
    ),
  );
  checks++;
  await fill('.ws-company-search input', 'DemoWorks');
  await button('Edit', "document.querySelector('.ws-company-table')");
  await evaluate(
    "(() => { const input = document.querySelectorAll('.ws-dialog form input')[1]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Updated demo role'); input.dispatchEvent(new Event('input', {bubbles:true})); })()",
  );
  await button('Save changes', "document.querySelector('[role=dialog]')");
  await until(
    () =>
      evaluate(
        "!document.querySelector('[role=dialog]') && document.querySelector('.ws-company-table').textContent.includes('Updated demo role')",
      ),
    'demo company edit',
  );
  checks++;
  await button('Delete', "document.querySelector('.ws-company-table')");
  await button('Confirm', "document.querySelector('[role=dialog]')");
  await until(
    () =>
      evaluate(
        "!document.querySelector('[role=dialog]') && document.querySelectorAll('.ws-company-table tbody tr').length === 0",
      ),
    'demo company delete',
  );
  checks++;
  await nav('Candidate pipeline');
  await button('List');
  await fill('.ws-search input', 'PixelWorks Giri');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-application').length"),
    1,
  );
  checks++;
  await button('Shortlist');
  await until(
    () =>
      evaluate(
        "document.querySelector('.ws-application .ws-status')?.textContent === 'Shortlisted'",
      ),
    'shortlist persisted',
  );
  checks++;
  await button('Move to interview');
  await until(
    () =>
      evaluate(
        "document.querySelector('.ws-application .ws-status')?.textContent === 'Interview'",
      ),
    'interview stage persisted',
  );
  checks++;
  await button('Schedule');
  await fill('.ws-dialog form input', 'Portfolio discussion');
  await evaluate(
    "(() => { const input = document.querySelectorAll('.ws-dialog form input')[2]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'https://meet.example.com/portfolio'); input.dispatchEvent(new Event('input',{bubbles:true})); })()",
  );
  await button('Save interview', "document.querySelector('[role=dialog]')");
  await until(
    () => evaluate("!document.querySelector('[role=dialog]')"),
    'interview saved',
  );
  await nav('Reports & exports');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-report-bars > div').length"),
    5,
  );
  checks++;
  await button('Export CSV');
  await until(async () => {
    try {
      return (
        await fs.readFile(
          path.join(downloadDir, 'CPMS-placement-report.csv'),
          'utf8',
        )
      ).includes('PixelWorks');
    } catch {
      return false;
    }
  }, 'CSV downloaded');
  checks++;
  await role('STUDENT');
  await nav('Interview schedule');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview').length"),
    2,
  );
  checks++;
  assert.match(
    await evaluate("document.querySelector('.ws-agenda').textContent"),
    /Portfolio discussion/,
  );
  checks++;
  assert.equal(
    await evaluate("document.querySelector('.ws-interview a')?.href"),
    'https://meet.example.com/portfolio',
  );
  assert.equal(
    await evaluate("document.querySelector('.ws-interview a')?.rel"),
    'noopener noreferrer',
  );
  checks += 2;
  await button('Calendar event', "document.querySelector('.ws-interview')");
  await until(async () => {
    try {
      return (
        await fs.readFile(path.join(downloadDir, 'CPMS-interview.ics'), 'utf8')
      ).includes('BEGIN:VEVENT');
    } catch {
      return false;
    }
  }, 'calendar downloaded');
  checks++;
  assert.match(
    await evaluate("document.querySelector('.ws-time-zone').textContent"),
    /Times shown in .+/,
  );
  checks++;
  await evaluate(`(() => {
    const key = 'cpms.demo.workspace.v1';
    const data = JSON.parse(localStorage.getItem(key));
    const base = data.interviews.find(item => item.studentId === 'STU-DEMO001');
    data.interviews.push(
      {...base, id: 'calendar-past-check', title: 'Finished fixture', at: new Date(Date.now() - 86400000 * 2).toISOString(), venue: 'javascript:alert(1)'},
      {...base, id: 'calendar-current-check', title: 'Current fixture', at: new Date(Date.now() - 300000).toISOString(), duration: '60 minutes', venue: 'Campus hall'}
    );
    localStorage.setItem(key, JSON.stringify(data));
  })()`);
  await command('Page.reload');
  await until(
    () => evaluate("Boolean(document.querySelector('.ws-sidebar'))"),
    'calendar fixture reload',
  );
  await nav('Interview schedule');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview').length"),
    4,
  );
  checks++;
  await button('Past', "document.querySelector('.ws-agenda-filters')");
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview').length"),
    1,
  );
  assert.equal(
    await evaluate("document.querySelector('.ws-meeting-state').textContent"),
    'Finished',
  );
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview a').length"),
    0,
  );
  checks += 3;
  await button('Upcoming', "document.querySelector('.ws-agenda-filters')");
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview').length"),
    3,
  );
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-agenda').textContent.includes('In progress')",
    ),
  );
  checks += 2;
  await click('document.querySelector(\'[aria-label="Previous month"]\')');
  await button('Today', "document.querySelector('.ws-calendar')");
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-calendar-grid .today').getAttribute('aria-pressed') === 'true'",
    ),
  );
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview').length"),
    1,
  );
  checks += 2;
  await button('Show all interviews');
  assert.equal(
    await evaluate("document.querySelectorAll('.ws-interview').length"),
    4,
  );
  checks++;
  await shot('workspace-calendar.png');
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
  await shot('workspace-calendar-mobile.png');
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(`(() => {
    const key = 'cpms.demo.workspace.v1';
    const data = JSON.parse(localStorage.getItem(key));
    data.interviews = data.interviews.filter(item => !item.id.startsWith('calendar-'));
    localStorage.setItem(key, JSON.stringify(data));
  })()`);
  await command('Page.reload');
  await until(
    () => evaluate("Boolean(document.querySelector('.ws-sidebar'))"),
    'calendar fixture cleanup',
  );
  await nav('Activity & updates');
  assert.match(
    await evaluate("document.querySelector('.ws-timeline').textContent"),
    /Portfolio discussion scheduled/,
  );
  checks++;
  await button('Mark all read');
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ws-notice-item.unread').length",
    ),
    0,
  );
  checks++;
  await nav('Career profile');
  await fill('.ws-form input', 'Giri Demo');
  await button('Save career profile');
  await until(
    () =>
      evaluate(
        "document.querySelector('.ws-profile-summary h2')?.textContent === 'Giri Demo'",
      ),
    'profile saved',
  );
  checks++;
  await command('Page.reload');
  await until(
    () =>
      evaluate(
        "document.querySelector('.ws-page-heading h1')?.textContent.includes('Giri')",
      ),
    'demo reload',
  );
  await nav('My applications');
  assert.match(
    await evaluate(
      "Array.from(document.querySelectorAll('.ws-application')).find(card => card.textContent.includes('PixelWorks')).textContent",
    ),
    /Interview/,
  );
  checks++;
  await nav('Preparation');
  await button('Complete a round');
  assert.equal(
    await evaluate(
      "document.querySelector('.case-feature output').textContent",
    ),
    '1',
  );
  checks++;
  await click("document.querySelector('.ws-checklist input')");
  assert.match(
    await evaluate("document.querySelector('.ws-checklist p').textContent"),
    /1 of 4/,
  );
  checks++;
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ws-practice-details iframe').length",
    ),
    1,
  );
  checks++;
  await nav('Overview');
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
  await shot('workspace-mobile.png');
  assert.equal(
    await evaluate(
      "getComputedStyle(document.querySelector('.ws-sidebar')).visibility",
    ),
    'hidden',
  );
  checks++;
  await click('document.querySelector(\'[aria-label="Open navigation"]\')');
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-sidebar').classList.contains('open')",
    ),
  );
  checks++;
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-body').inert && document.body.style.overflow === 'hidden' && document.activeElement.classList.contains('ws-nav-close')",
    ),
  );
  checks++;
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
    modifiers: 8,
  });
  assert.ok(
    await evaluate(
      "document.activeElement === [...document.querySelectorAll('.ws-sidebar a[href], .ws-sidebar button:not(:disabled)')].at(-1)",
    ),
  );
  checks++;
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
  });
  assert.ok(
    await evaluate("document.activeElement.classList.contains('ws-nav-close')"),
  );
  checks++;
  await shot('workspace-mobile-navigation.png');
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
  });
  assert.ok(
    await evaluate(
      "!document.querySelector('.ws-body').inert && document.body.style.overflow !== 'hidden' && document.activeElement === document.querySelector('[aria-label=\"Open navigation\"]')",
    ),
  );
  checks++;
  await click('document.querySelector(\'[aria-label="Open navigation"]\')');
  await nav('My applications');
  assert.ok(
    await evaluate(
      "!document.querySelector('.ws-sidebar').classList.contains('open')",
    ),
  );
  checks++;
  assert.ok(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
  );
  checks++;
  await nav('Explore opportunities');
  await fill('.ws-search input', 'a'.repeat(120));
  assert.ok(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
  );
  checks++;
  await fill('.ws-search input', 'React');
  await fill('.ws-filter-bar select', 'Bangalore', 'change');
  await shot('workspace-filters-mobile.png');
  assert.ok(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
  );
  checks++;
  await click("document.querySelector('.ws-bell')");
  assert.ok(
    await evaluate(
      "document.querySelector('.ws-notice-popover').getBoundingClientRect().left >= 0 && document.querySelector('.ws-notice-popover').getBoundingClientRect().right <= innerWidth",
    ),
  );
  checks++;
  await shot('workspace-notifications-mobile.png');
  await click('document.querySelector(\'[aria-label="Close notifications"]\')');
  await click('document.querySelector(\'[aria-label="Open navigation"]\')');
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await until(
    () =>
      evaluate(
        "!document.querySelector('.ws-sidebar').classList.contains('open') && !document.querySelector('.ws-body').inert",
      ),
    'desktop resize releases mobile navigation',
  );
  assert.notEqual(await evaluate('document.body.style.overflow'), 'hidden');
  checks++;
  await button('Reset demo');
  await button('Reset demo', "document.querySelector('[role=dialog]')");
  await until(
    () => evaluate("!document.querySelector('[role=dialog]')"),
    'demo reset',
  );
  assert.equal(
    await evaluate(
      "JSON.parse(localStorage.getItem('cpms.demo.workspace.v1')).applications.length",
    ),
    8,
  );
  checks++;
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await command('Page.navigate', { url: base + '/' });
  await until(
    () => evaluate("Boolean(document.querySelector('#login-email'))"),
    'new sign-in page',
  );
  assert.equal(
    await evaluate(
      "document.querySelector('.ws-demo-entry').getAttribute('href')",
    ),
    '/demo',
  );
  checks++;
  await button('Show');
  assert.equal(
    await evaluate("document.querySelector('#login-password').type"),
    'text',
  );
  checks++;
  await button('Student');
  assert.equal(
    await evaluate("document.querySelector('#login-email').value"),
    'rahul.sharma@university.edu',
  );
  checks++;
  await shot('workspace-login.png');
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
  assert.match(
    await evaluate(
      "document.querySelector('.ws-login-intro h1').textContent.replace(/\\s+/g, ' ')",
    ),
    /From campus to your next chapter/,
  );
  checks++;
  await shot('workspace-login-mobile.png');
  return checks;
}
