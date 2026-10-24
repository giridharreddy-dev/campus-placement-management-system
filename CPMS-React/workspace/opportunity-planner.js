import { sameId } from './demo-data.js';

export function deadlineInfo(value, now = new Date()) {
  const match =
    typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { date: null, days: null, label: 'No deadline provided' };
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return { date: null, days: null, label: 'No deadline provided' };
  // Compare calendar days, rather than elapsed hours, across time-zone/DST changes.
  const days = Math.round(
    (Date.UTC(year, month - 1, day) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000,
  );
  return {
    date,
    days,
    label:
      days < 0
        ? 'Deadline passed'
        : days === 0
          ? 'Closes today'
          : days === 1
            ? 'Closes tomorrow'
            : `Closes in ${days} days`,
  };
}

export const deadlineFilters = [
  'All deadlines',
  'Closing within 7 days',
  'Today or later',
  'Deadline passed',
  'No deadline provided',
];

export function matchesDeadline(drive, filter, now) {
  const { days } = deadlineInfo(drive.deadline, now);
  if (filter === 'Closing within 7 days')
    return days !== null && days >= 0 && days <= 7;
  if (filter === 'Today or later') return days !== null && days >= 0;
  if (filter === 'Deadline passed') return days !== null && days < 0;
  if (filter === 'No deadline provided') return days === null;
  return true;
}

export function compareDeadlines(a, b, now) {
  const rank = (drive) => {
    const { days } = deadlineInfo(drive.deadline, now);
    return days !== null && days >= 0 ? days : Number.POSITIVE_INFINITY;
  };
  const left = rank(a),
    right = rank(b);
  return left === right ? 0 : left < right ? -1 : 1;
}

export function toggleComparison(ids, id, availableIds) {
  const current = ids.filter((item) =>
    availableIds.some((available) => sameId(item, available)),
  );
  if (current.some((item) => sameId(item, id)))
    return current.filter((item) => !sameId(item, id));
  if (
    current.length >= 3 ||
    !availableIds.some((available) => sameId(available, id))
  )
    return current;
  return [...current, id];
}

const calendarText = (value) =>
  String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replace(/\r\n?|\n/g, '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,');
const dateStamp = (date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
function foldLine(line) {
  const encoder = new TextEncoder();
  let result = '',
    length = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) {
      result += '\r\n ';
      length = 1;
    }
    result += character;
    length += bytes;
  }
  return result;
}

export function buildDeadlineCalendar(drive, now = new Date()) {
  const { date, days } = deadlineInfo(drive.deadline, now);
  if (!date || days < 0) return null;
  const end = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1),
  );
  const start = drive.deadline.replaceAll('-', '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CPMS//Application Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:deadline-${encodeURIComponent(String(drive.id))}@cpms.local`,
    `DTSTAMP:${dateStamp(now)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll('-', '')}`,
    `SUMMARY:${calendarText(`${drive.name} · ${drive.position} application deadline`)}`,
    `DESCRIPTION:${calendarText('Application deadline shown in CPMS. Check the role details and placement office for the exact closing time.')}`,
    `LOCATION:${calendarText(drive.location)}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
    .map(foldLine)
    .join('\r\n');
}
