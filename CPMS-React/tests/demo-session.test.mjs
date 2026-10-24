import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData, DEMO_STUDENT } from '../workspace/demo-data.js';
import { demoSavedIds, demoEvents, isDemoWorkspace } from '../workspace/demo-session.js';

test('demo contains four independent student identities and their applications', () => {
  const data = createDemoData();
  assert.equal(data.students.length, 4);
  for (const student of data.students) {
    assert.ok(data.applications.some((app) => app.student_id === student.id));
  }
  assert.ok(isDemoWorkspace(data));
  assert.ok(!isDemoWorkspace({ ...data, applications: null }));
});

test('legacy saved roles belong to Giri, while other students have independent bookmarks', () => {
  const data = createDemoData();
  assert.deepEqual(demoSavedIds(data, DEMO_STUDENT), [6]);
  assert.deepEqual(demoSavedIds(data, 'STU-DEMO002'), []);
  data.savedByStudent = { 'STU-DEMO002': [2] };
  assert.deepEqual(demoSavedIds(data, 'STU-DEMO002'), [2]);
  assert.deepEqual(demoSavedIds(data, DEMO_STUDENT), [6]);
});

test('candidate updates follow the student and recruiter company', () => {
  const data = createDemoData();
  const events = [{ id: 1, applicationId: 'app-103', title: 'Priya moved to Interview' }];
  data.applications.find((app) => app.id === 'app-103').status = 'Interview';
  assert.equal(demoEvents(events, data, 'STUDENT', 'STU-DEMO002', 1).length, 1);
  assert.equal(demoEvents(events, data, 'STUDENT', DEMO_STUDENT, 1).length, 0);
  assert.equal(demoEvents(events, data, 'RECRUITER', DEMO_STUDENT, 1).length, 1);
  assert.equal(demoEvents(events, data, 'RECRUITER', DEMO_STUDENT, 2).length, 0);
  assert.equal(demoEvents(events, data, 'ADMIN', DEMO_STUDENT, 2).length, 1);
  assert.equal(data.applications.find((app) => app.student_id === 'STU-DEMO002' && app.company_id === 1).status, 'Interview');
});

test('existing browser interview notices stay with their original student', () => {
  const data = createDemoData();
  const legacy = [{ id: 'notice-1', title: 'Your CloudTech interview is scheduled' }];
  assert.equal(demoEvents(legacy, data, 'STUDENT', DEMO_STUDENT, 1).length, 1);
  assert.equal(demoEvents(legacy, data, 'STUDENT', 'STU-DEMO002', 1).length, 0);
});
