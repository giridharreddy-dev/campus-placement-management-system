import { DEMO_STUDENT, sameId } from './demo-data.js';

export function isDemoWorkspace(data) {
  return data?.version === 1 && data.profile && data.driveDetails &&
    ['savedIds', 'activity', 'interviews', 'notices', 'drives', 'applications', 'students']
      .every((key) => Array.isArray(data[key]));
}

export function demoSavedIds(data, studentId) {
  return data.savedByStudent?.[studentId] ||
    (sameId(studentId, DEMO_STUDENT) ? data.savedIds : []);
}

export function demoEvents(events, data, role, studentId, companyId) {
  return events.filter((event) => {
    // Older browser samples predate ownership metadata on the interview notice.
    const applicationId = event.applicationId || (event.id === 'notice-1' ? 'app-102' : undefined);
    const application = data.applications.find((app) => sameId(app.id, applicationId));
    const owner = event.studentId || application?.student_id;
    const company = event.companyId || application?.company_id;
    if (role === 'STUDENT') return !owner || sameId(owner, studentId);
    if (role === 'RECRUITER') return !company || sameId(company, companyId);
    return true;
  });
}
