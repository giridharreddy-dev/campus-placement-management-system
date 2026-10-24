import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import jwt from 'jsonwebtoken';
import db from '../backend/db.js';
import { JWT_SECRET } from '../backend/middleware/auth.js';

// Uses short-lived sessions only inside the isolated headless browser.
// No application, company or account mutations are performed.
export async function checkLiveWorkspaceBrowser({
  command,
  evaluate,
  click,
  until,
  base,
  output,
}) {
  let checks = 0;
  const snapshot = async () => {
    const values = {};
    const [tables] = await db.query('SHOW TABLES');
    for (const row of tables) {
      const table = Object.values(row)[0];
      const [rows] = await db.query('SELECT * FROM ?? ORDER BY 1', [table]);
      values[table] = {
        count: rows.length,
        digest: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
      };
    }
    return values;
  };
  const baseline = await snapshot();
  try {
    const [accounts] = await db.query(
      'SELECT id, email, role, student_id, company_id FROM users ORDER BY id',
    );
    await command('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    for (const role of ['STUDENT', 'RECRUITER', 'ADMIN']) {
      const account = accounts.find((item) => item.role === role);
      assert.ok(account, role + ' account exists');
      const token = jwt.sign(account, JWT_SECRET, { expiresIn: '3m' });
      await command('Network.setCookie', {
        name: 'token',
        value: token,
        url: base,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      });
      await command('Page.navigate', { url: base + '/' });
      await until(
        () => evaluate("Boolean(document.querySelector('.ws-stats'))"),
        'live ' + role + ' workspace',
      );
      assert.equal(
        await evaluate(
          "document.querySelector('.ws-environment').textContent.trim()",
        ),
        'Connected portal',
      );
      checks++;
      assert.equal(
        await evaluate("document.querySelectorAll('.ws-role-switch').length"),
        0,
      );
      checks++;
      await click(
        "Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes('applications') || button.textContent.includes('pipeline'))",
      );
      const expected =
        role === 'STUDENT'
          ? (
              await db.query(
                'SELECT COUNT(*) AS count FROM applications WHERE student_id = ?',
                [account.student_id],
              )
            )[0][0].count
          : role === 'RECRUITER'
            ? (
                await db.query(
                  'SELECT COUNT(*) AS count FROM applications WHERE company_id = ?',
                  [account.company_id],
                )
              )[0][0].count
            : baseline.applications.count;
      assert.equal(
        await evaluate("document.querySelectorAll('.ws-application').length"),
        expected,
      );
      checks++;
      if (role === 'STUDENT') {
        await click(
          "Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes('Preparation'))",
        );
        assert.ok(
          await evaluate(
            'Boolean(document.querySelector(\'[aria-label="Placement preparation planner"]\'))',
          ),
        );
        checks++;
        await click(
          "Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Complete a round')",
        );
        assert.equal(
          await evaluate(
            "document.querySelector('.case-feature output').textContent",
          ),
          '1',
        );
        checks++;
        await click("document.querySelector('.ws-practice-details summary')");
        assert.ok(
          await evaluate(
            'Boolean(document.querySelector(\'iframe[title="Combined Experiment 1"]\'))',
          ),
        );
        checks++;
      }
      if (role === 'ADMIN') {
        await click(
          "Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes('Manage companies'))",
        );
        assert.equal(
          await evaluate(
            "document.querySelectorAll('.ws-company-table tbody tr').length",
          ),
          baseline.companies.count,
        );
        checks++;
        assert.ok(
          await evaluate(
            "Array.from(document.querySelectorAll('.ws-company-table tr')).some(row => row.querySelector('button.danger')?.disabled)",
          ),
        );
        checks++;
      }
      await click(
        "Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes('Overview'))",
      );
      const screen = await command('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(
        path.join(output, `workspace-live-${role.toLowerCase()}.png`),
        Buffer.from(screen.data, 'base64'),
      );
    }
    assert.deepEqual(
      await snapshot(),
      baseline,
      'All real CPMS tables unchanged',
    );
    checks++;
    console.log(
      `Read-only live portal: all three roles loaded; database records unchanged (${baseline.students.count} students, ${baseline.companies.count} companies, ${baseline.applications.count} applications, ${baseline.users.count} users).`,
    );
    return checks;
  } finally {
    await command('Network.deleteCookies', { name: 'token', url: base });
    await db.end();
  }
}
