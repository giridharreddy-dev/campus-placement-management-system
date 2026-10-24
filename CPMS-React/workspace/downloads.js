import { buildDeadlineCalendar } from './opportunity-planner';

export function exportDeadline(drive) {
  const content = buildDeadlineCalendar(drive);
  if (!content) return;
  downloadFile(
    'CPMS-application-deadline.ics',
    content,
    'text/calendar;charset=utf-8',
  );
}

export function downloadFile(name, content, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportApplications(applications) {
  const cell = (value) => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [
    ['Candidate', 'Email', 'Branch', 'Company', 'Role', 'Stage', 'Applied on'],
    ...applications.map((app) => [
      app.candidate?.name,
      app.candidate?.email,
      app.candidate?.branch,
      app.company?.name,
      app.company?.position,
      app.status,
      app.applied_date,
    ]),
  ];
  downloadFile(
    'CPMS-placement-report.csv',
    '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n'),
  );
}
export function exportInterview(interview, company) {
  const clean = (text) =>
    String(text || '')
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replaceAll('\r', '');
  const stamp = (date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const start = new Date(interview.at);
  const end = new Date(
    start.getTime() + (parseInt(interview.duration) || 30) * 60000,
  );
  downloadFile(
    'CPMS-interview.ics',
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CPMS//Placement Schedule//EN',
      'BEGIN:VEVENT',
      `UID:${clean(interview.id)}@cpms.local`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${clean(company + ' · ' + interview.title)}`,
      `LOCATION:${clean(interview.venue)}`,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n'),
    'text/calendar;charset=utf-8',
  );
}
