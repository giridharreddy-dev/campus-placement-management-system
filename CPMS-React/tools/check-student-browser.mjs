// Optional local integration check: read-only portal requests and session-local
// practice counters. It never clicks Apply or Withdraw on real applications.
import db from '../backend/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../backend/middleware/auth.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function checkStudentBrowser({ command, evaluate, click, until, base, output }) {
  try {
    const [rows] = await db.query("SELECT u.id, u.email, u.role, u.student_id, u.company_id, s.name FROM users u JOIN students s ON s.id = u.student_id WHERE u.role = 'STUDENT' ORDER BY u.id LIMIT 1");
    assert.ok(rows[0], 'A local student account is required for this optional check');
    const token = jwt.sign({ ...rows[0] }, JWT_SECRET, { expiresIn: '2m' });
    await command('Network.setCookie', { name: 'token', value: token, url: base, path: '/', httpOnly: true, sameSite: 'Lax' });
    await command('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await command('Page.navigate', { url: base + '/' });
    await until(() => evaluate("Boolean(document.querySelector('.ws-sidebar')) && !document.querySelector('.ws-loading')"), 'authenticated career workspace');
    await click("Array.from(document.querySelectorAll('.ws-sidebar nav button')).find(button => button.textContent.includes('Preparation'))");
    await until(() => evaluate("Boolean(document.querySelector('[aria-label=\"Placement preparation planner\"]'))"), 'integrated preparation planner in authenticated student portal');
    assert.ok(await evaluate("Boolean(document.querySelector('iframe[title=\"Combined Experiment 1\"]'))"));
    await click("Array.from(document.querySelectorAll('.case-feature button')).find(button => button.textContent === 'Complete a round')");
    assert.equal(await evaluate("document.querySelector('.case-feature output').textContent"), '1');
    await evaluate("document.querySelector('[aria-label=\"Placement preparation planner\"]').scrollIntoView({block:'start'})");
    const screen = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(output, 'student-integrated-case-study.png'), Buffer.from(screen.data, 'base64'));
    return 3;
  } finally {
    await command('Network.deleteCookies', { name: 'token', url: base });
    await db.end();
  }
}
