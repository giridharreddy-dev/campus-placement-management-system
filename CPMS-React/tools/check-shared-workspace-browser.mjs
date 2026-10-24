import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import db from '../backend/db.js';
import { JWT_SECRET } from '../backend/middleware/auth.js';

// This checker is allowed to write ONLY to the disposable integration database.
export async function checkSharedWorkspaceBrowser({
  command,
  evaluate,
  click,
  until,
  base,
  output,
}) {
  assert.match(
    process.env.DB_NAME || '',
    /^cpms_workspace_verify_[a-f0-9]{16}$/,
  );
  let checks = 0;
  const [accounts] = await db.query(
    'SELECT id,email,role,student_id,company_id FROM users',
  );
  const session = async (email) => {
    const account = accounts.find((item) => item.email === email);
    assert.ok(account, 'Fixture account exists');
    await command('Network.setCookie', {
      name: 'token',
      value: jwt.sign(account, JWT_SECRET, { expiresIn: '10m' }),
      url: base,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    });
    await command('Page.navigate', { url: base + '/' });
    await until(
      () => evaluate("Boolean(document.querySelector('.ws-stats'))"),
      'shared ' + account.role + ' workspace',
    );
  };
  const nav = (name) =>
    click(
      `Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes(${JSON.stringify(name)}))`,
    );
  const button = (name, scope = 'document') =>
    click(
      `Array.from(${scope}.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(name)})`,
    );
  const fill = async (expression, value) =>
    evaluate(
      `(() => { const input=${expression}; const prototype=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true})); })()`,
    );
  const field = (label, value) =>
    fill(
      `Array.from(document.querySelectorAll('.ws-form label')).find(label=>label.textContent.trim().startsWith(${JSON.stringify(label)})).querySelector('input,textarea,select')`,
      value,
    );
  const shot = async (name) => {
    const image = await command('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(
      path.join(output, name),
      Buffer.from(image.data, 'base64'),
    );
  };
  try {
    // Guard the browser proxy before performing any writes.
    await session('rahul.sharma@university.edu');
    assert.equal(
      await evaluate(
        "(async () => (await (await fetch('/api/workspace')).json()).profiles[0].name)()",
      ),
      'Rahul Portfolio',
      'Browser is connected to the disposable fixture, not live CPMS',
    );
    checks++;
    await session('admin@placement.edu');
    await nav('Manage companies');
    assert.ok(
      await evaluate(
        "document.querySelector('.ws-company-table').textContent.includes('TechCorp')",
      ),
    );
    checks++;
    assert.ok(
      await evaluate(
        "Array.from(document.querySelectorAll('.ws-company-table tr')).find(row=>row.textContent.includes('TechCorp')).querySelector('button.danger').disabled",
      ),
    );
    checks++;
    await button('Add company');
    await field('Company name', 'BrowserWorks');
    await field('Job title', 'Portfolio Developer');
    await field('Location', 'Hyderabad');
    await field('Compensation', '12 LPA');
    await field('Base salary', '9 LPA');
    await field('About the role', 'Browser-created shared description.');
    await button(
      'Publish opportunity',
      "document.querySelector('[role=dialog]')",
    );
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-company-table').textContent.includes('BrowserWorks') && !document.querySelector('[role=dialog]')",
        ),
      'company created',
    );
    checks++;
    await fill(
      "document.querySelector('.ws-company-search input')",
      'BrowserWorks',
    );
    assert.equal(
      await evaluate(
        "document.querySelectorAll('.ws-company-table tbody tr').length",
      ),
      1,
    );
    checks++;
    await button('Edit', "document.querySelector('.ws-company-table')");
    await field('Job title', 'Updated Portfolio Developer');
    await button('Save changes', "document.querySelector('[role=dialog]')");
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-company-table').textContent.includes('Updated Portfolio Developer') && !document.querySelector('[role=dialog]')",
        ),
      'company edited',
    );
    checks++;
    await button('Delete', "document.querySelector('.ws-company-table')");
    await button('Keep it', "document.querySelector('[role=dialog]')");
    assert.equal(
      await evaluate(
        "document.querySelectorAll('.ws-company-table tbody tr').length",
      ),
      1,
    );
    checks++;
    await shot('workspace-company-management.png');
    await command('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert.ok(
      await evaluate(
        'document.documentElement.scrollWidth <= window.innerWidth',
      ),
    );
    checks++;
    await shot('workspace-company-management-mobile.png');
    await command('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await button('Delete', "document.querySelector('.ws-company-table')");
    await button('Confirm', "document.querySelector('[role=dialog]')");
    await until(
      () =>
        evaluate(
          "document.querySelectorAll('.ws-company-table tbody tr').length === 0 && !document.querySelector('[role=dialog]')",
        ),
      'company deleted',
    );
    checks++;
    await click('document.querySelector(\'[aria-label="Refresh workspace"]\')');
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-toast')?.textContent.includes('refreshed')",
        ),
      'manual refresh',
    );
    checks++;

    await session('rahul.sharma@university.edu');
    assert.ok(
      await evaluate(
        "!Array.from(document.querySelectorAll('.ws-sidebar nav button')).some(button=>button.textContent.includes('Manage companies'))",
      ),
    );
    checks++;
    await nav('Career profile');
    await field('Full name', 'Rahul Browser');
    await field('Career headline', 'React developer from the shared profile');
    await button('Save career profile');
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-profile-summary h2')?.textContent === 'Rahul Browser'",
        ),
      'profile saved',
    );
    checks++;
    await command('Page.reload');
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-page-heading h1')?.textContent.includes('Rahul')",
        ),
      'profile reload',
    );
    await nav('Career profile');
    assert.equal(
      await evaluate(
        "document.querySelector('.ws-profile-summary h2').textContent",
      ),
      'Rahul Browser',
    );
    checks++;

    await session('recruiter.techcorp@placement.edu');
    await nav('Candidate pipeline');
    await button('View candidate');
    assert.match(
      await evaluate("document.querySelector('[role=dialog]').textContent"),
      /React developer from the shared profile/,
    );
    checks++;
    assert.equal(
      await evaluate(
        "document.querySelector('.ws-candidate-links a').getAttribute('href')",
      ),
      'https://github.com/example',
    );
    checks++;
    await command('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
    });
    await button('Shortlist');
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-application .ws-status')?.textContent === 'Shortlisted'",
        ),
      'candidate shortlisted',
    );
    checks++;
    await button('Schedule');
    await field('Round name', 'Shared browser interview');
    await field('Venue or meeting link', 'Placement cell, Room 301');
    await button('Save interview');
    await until(
      () => evaluate("!document.querySelector('[role=dialog]')"),
      'official interview saved',
    );
    checks++;

    await session('rahul.sharma@university.edu');
    await nav('Interview schedule');
    assert.match(
      await evaluate("document.querySelector('.ws-agenda').textContent"),
      /Shared browser interview/,
    );
    checks++;
    assert.ok(
      await evaluate(
        "!Array.from(document.querySelectorAll('.ws-agenda button')).some(button=>button.textContent.trim()==='Remove')",
      ),
    );
    checks++;
    assert.ok(
      await evaluate(
        "Array.from(document.querySelectorAll('.ws-agenda button')).some(button=>button.textContent.includes('Calendar event'))",
      ),
    );
    checks++;
    await shot('workspace-shared-student-calendar.png');
    await button('Add to schedule');
    await field('Round name', 'Private browser practice');
    await field('Venue or meeting link', 'My study desk');
    await button('Save interview');
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-agenda').textContent.includes('Private browser practice') && !document.querySelector('[role=dialog]')",
        ),
      'private schedule saved',
    );
    checks++;
    await nav('Activity & updates');
    assert.match(
      await evaluate("document.querySelector('main').textContent"),
      /Shared browser interview scheduled/,
    );
    checks++;
    await button('Mark all read');
    await until(
      () =>
        evaluate(
          "document.querySelector('.ws-count')?.textContent === '0 unread'",
        ),
      'server notifications read',
    );
    checks++;
    await command('Page.reload');
    await until(
      () => evaluate("Boolean(document.querySelector('.ws-stats'))"),
      'notification reload',
    );
    assert.match(
      await evaluate(
        "document.querySelector('.ws-bell').getAttribute('aria-label')",
      ),
      /0 unread/,
    );
    checks++;

    await session('recruiter.techcorp@placement.edu');
    await nav('Interview schedule');
    assert.ok(
      await evaluate(
        "!document.querySelector('.ws-agenda').textContent.includes('Private browser practice')",
      ),
    );
    checks++;
    await button('Remove', "document.querySelector('.ws-agenda')");
    await button('Confirm', "document.querySelector('[role=dialog]')");
    await until(
      () =>
        evaluate(
          "!document.querySelector('.ws-agenda').textContent.includes('Shared browser interview') && !document.querySelector('[role=dialog]')",
        ),
      'official cancellation',
    );
    checks++;
    await session('rahul.sharma@university.edu');
    await nav('Activity & updates');
    assert.match(
      await evaluate("document.querySelector('main').textContent"),
      /Shared browser interview cancelled/,
    );
    checks++;
    await nav('Interview schedule');
    assert.match(
      await evaluate("document.querySelector('.ws-agenda').textContent"),
      /Private browser practice/,
    );
    checks++;
    await button('Remove', "document.querySelector('.ws-agenda')");
    await button('Confirm', "document.querySelector('[role=dialog]')");
    await until(
      () =>
        evaluate(
          "!document.querySelector('.ws-agenda').textContent.includes('Private browser practice') && !document.querySelector('[role=dialog]')",
        ),
      'personal entry removed',
    );
    checks++;
    return checks;
  } finally {
    await command('Network.deleteCookies', { name: 'token', url: base });
    await db.end();
  }
}
