import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deadlineInfo,
  matchesDeadline,
  compareDeadlines,
  toggleComparison,
  buildDeadlineCalendar,
} from '../workspace/opportunity-planner.js';

const now = new Date(2026, 9, 13, 23, 59);
test('deadlines use local calendar dates including the whole closing day', () => {
  assert.equal(deadlineInfo('2026-10-13', now).label, 'Closes today');
  assert.equal(deadlineInfo('2026-10-14', now).days, 1);
  assert.equal(deadlineInfo('2026-10-12', now).label, 'Deadline passed');
  assert.equal(
    deadlineInfo('2026-03-09', new Date(2026, 2, 8, 23, 59)).days,
    1,
  );
});
test('missing and invalid dates are never treated as upcoming deadlines', () => {
  for (const value of [null, '', 'invalid', '2026-02-30', '2026-13-01']) {
    assert.equal(deadlineInfo(value, now).days, null);
    assert.equal(
      matchesDeadline({ deadline: value }, 'Closing within 7 days', now),
      false,
    );
    assert.equal(buildDeadlineCalendar({ deadline: value }, now), null);
  }
});
test('closing-soon filtering includes today through day seven, but not past or undated roles', () => {
  for (const day of [13, 14, 20])
    assert.equal(
      matchesDeadline(
        { deadline: `2026-10-${day}` },
        'Closing within 7 days',
        now,
      ),
      true,
    );
  for (const day of [12, 21])
    assert.equal(
      matchesDeadline(
        { deadline: `2026-10-${day}` },
        'Closing within 7 days',
        now,
      ),
      false,
    );
  assert.equal(
    matchesDeadline({ deadline: '2026-10-12' }, 'Deadline passed', now),
    true,
  );
  assert.equal(matchesDeadline({}, 'No deadline provided', now), true);
});
test('closing-soon sort puts future dates before expired and undated records', () => {
  const roles = [
    { id: 1 },
    { id: 2, deadline: '2026-10-12' },
    { id: 3, deadline: '2026-10-20' },
    { id: 4, deadline: '2026-10-13' },
  ];
  assert.deepEqual(
    roles.sort((a, b) => compareDeadlines(a, b, now)).map((role) => role.id),
    [4, 3, 1, 2],
  );
});
test('comparison caps at three, handles mixed ID types and drops deleted opportunities', () => {
  assert.deepEqual(toggleComparison([1, 2, 3], 4, [1, 2, 3, 4]), [1, 2, 3]);
  assert.deepEqual(toggleComparison([1, 2, 3], '2', [1, 2, 3]), [1, 3]);
  assert.deepEqual(toggleComparison([1, 2, 3], 4, [1, 2, 4]), [1, 2, 4]);
  assert.deepEqual(toggleComparison([], 'missing', [1, 2]), []);
});
test('deadline calendar uses all-day dates and the next day as its exclusive end', () => {
  const text = buildDeadlineCalendar(
    { id: 9, name: 'Example', position: 'Engineer', deadline: '2026-12-31' },
    now,
  );
  assert.match(text, /DTSTART;VALUE=DATE:20261231\r\n/);
  assert.match(text, /DTEND;VALUE=DATE:20270101\r\n/);
  assert.match(text, /UID:deadline-9@cpms.local/);
  assert.match(text, /TRANSP:TRANSPARENT/);
  assert.equal(buildDeadlineCalendar({ deadline: '2026-10-12' }, now), null);
});
test('calendar exports escape untrusted text and fold long Unicode lines without splitting characters', () => {
  const text = buildDeadlineCalendar(
    {
      id: 'a\r\nB',
      name: 'Team, Inc;\r\nBEGIN:VEVENT',
      position: 'అ'.repeat(100),
      location: 'Room; A',
      deadline: '2026-10-14',
    },
    now,
  );
  assert.equal(
    text.split('\r\n').filter((line) => line === 'BEGIN:VEVENT').length,
    1,
  );
  assert.ok(
    text.split('\r\n').every((line) => Buffer.byteLength(line, 'utf8') <= 75),
  );
  assert.ok(!text.includes('\uFFFD'));
  const unfolded = text.replaceAll('\r\n ', '');
  assert.ok(unfolded.includes('Team\\, Inc\\;\\nBEGIN:VEVENT'));
  assert.match(unfolded, /LOCATION:Room\\; A/);
});
