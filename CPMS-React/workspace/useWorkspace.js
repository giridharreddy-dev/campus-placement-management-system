import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDemoData,
  createPersonalData,
  DEMO_STUDENT,
  sameId,
  uid,
} from './demo-data';
import { demoSavedIds, demoEvents, isDemoWorkspace } from './demo-session';

async function request(url, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    ...(body
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'The request could not be completed.');
  return data;
}

async function fetchServer(user) {
  const applicationUrl =
    user.role === 'STUDENT'
      ? `/api/students/${user.student_id}/applications/details`
      : user.role === 'RECRUITER'
        ? '/api/recruiter/applications'
        : '/api/applications';
  const [companies, applications, student, workspace] = await Promise.all([
    request('/api/companies'),
    request(applicationUrl),
    user.role === 'STUDENT'
      ? request(`/api/students/${user.student_id}`)
      : Promise.resolve(null),
    request('/api/workspace'),
  ]);
  return { companies, applications, student, workspace };
}

export default function useWorkspace({ demo, user }) {
  const storageKey = demo
    ? 'cpms.demo.workspace.v1'
    : `cpms.personal.workspace.v1:${user?.id}:${user?.email}`;
  const [personal, setPersonal] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (
        stored?.version === 1 &&
        Array.isArray(stored.savedIds) &&
        Array.isArray(stored.activity) &&
        Array.isArray(stored.interviews) &&
        Array.isArray(stored.notices) &&
        stored.profile &&
        stored.driveDetails &&
        (!demo ||
          (Array.isArray(stored.drives) &&
            Array.isArray(stored.applications) &&
            Array.isArray(stored.students)))
      )
        return stored;
    } catch {
      /* Use a fresh local workspace if stored data is unavailable. */
    }
    return demo ? createDemoData() : createPersonalData();
  });
  const [role, setRole] = useState(demo ? 'STUDENT' : user.role);
  const [demoStudentId, setDemoStudentId] = useState(DEMO_STUDENT);
  const [demoCompanyId, setDemoCompanyId] = useState(1);
  const [server, setServer] = useState({
    companies: [],
    applications: [],
    student: null,
    workspace: { interviews: [], notices: [], profiles: [], driveDetails: {} },
  });
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState(null);
  const [storageError, setStorageError] = useState('');
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const loadServer = useCallback(async () => {
    const version = ++requestVersion.current;
    const data = await fetchServer(user);
    if (mounted.current && version === requestVersion.current) {
      setServer(data);
      setError('');
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(personal));
    } catch {
      setStorageError(
        'Changes could not be saved on this device. Free some browser storage before continuing.',
      );
    }
  }, [personal, storageKey]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (demo) return;
    mounted.current = true;
    const refresh = () => {
      if (document.hidden) return;
      loadServer().catch((e) => {
        if (mounted.current) {
          setError(e.message);
          setLoading(false);
        }
      });
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      mounted.current = false;
      ++requestVersion.current;
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [demo, loadServer]);

  useEffect(() => {
    if (!demo) return;
    const receive = (event) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const data = JSON.parse(event.newValue);
        if (isDemoWorkspace(data)) setPersonal(data);
      } catch { /* Ignore incomplete browser storage writes. */ }
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [demo, storageKey]);

  const studentId = demo
    ? personal.students.find((item) => sameId(item.id, demoStudentId))?.id || personal.students[0]?.id
    : user?.student_id;
  const student = demo
    ? personal.students.find((item) => sameId(item.id, studentId))
    : server.workspace.profiles.find((item) => sameId(item.id, studentId)) ||
      server.student;
  const profile = {
    ...student,
    ...(!demo && !student?.hasCareerProfile ? personal.profile : {}),
    id: studentId,
  };
  if (Array.isArray(profile.skills)) profile.skills = profile.skills.join(', ');
  const allDrives = demo
    ? personal.drives
    : server.companies.map((drive) => ({
        ...drive,
        ...personal.driveDetails[drive.id],
        ...server.workspace.driveDetails[drive.id],
      }));
  const allApplications = demo ? personal.applications : server.applications;
  const students = demo
    ? personal.students
    : server.workspace.profiles.length
      ? server.workspace.profiles
      : [
          ...new Map(
            server.applications.map((app) => [
              app.student_id,
              {
                id: app.student_id,
                name: app.student_name,
                email: app.student_email,
                branch: app.student_branch,
                cgpa: app.student_cgpa,
                skills: app.student_skills,
              },
            ]),
          ).values(),
        ];
  const companyId = demo
    ? allDrives.find((item) => sameId(item.id, demoCompanyId))?.id || allDrives[0]?.id
    : user?.company_id;
  const savedIds = demo ? demoSavedIds(personal, studentId) : personal.savedIds;
  const drives =
    role === 'RECRUITER'
      ? allDrives.filter((drive) => sameId(drive.id, companyId))
      : allDrives;
  const applications = allApplications
    .filter((app) =>
      role === 'STUDENT'
        ? sameId(app.student_id, studentId)
        : role === 'RECRUITER'
          ? sameId(app.company_id, companyId)
          : true,
    )
    .map((app) => ({
      ...app,
      company: allDrives.find((drive) => sameId(drive.id, app.company_id)),
      candidate: sameId(app.student_id, studentId)
        ? profile
        : students.find((item) => sameId(item.id, app.student_id)),
    }));
  const interviews = (
    demo
      ? personal.interviews.map((item) => ({
          ...item,
          kind: item.kind || 'official',
          canCancel:
            item.kind === 'personal' ? role === 'STUDENT' : role !== 'STUDENT',
        }))
      : [
          ...server.workspace.interviews,
          ...personal.interviews.map((item) => ({
            ...item,
            localOnly: true,
            canCancel: true,
          })),
        ]
  ).filter(
    (item) =>
      (!demo || item.kind !== 'personal' || role === 'STUDENT') &&
      (role === 'STUDENT'
        ? sameId(item.studentId, studentId)
        : role === 'RECRUITER'
          ? sameId(item.companyId, companyId)
          : true),
  );
  const record = (title, detail, applicationId) => {
    if (!demo) return;
    const application = personal.applications.find((app) => sameId(app.id, applicationId));
    const event = {
      studentId: application?.student_id || (role === 'STUDENT' ? studentId : undefined),
      companyId: application?.company_id || (role === 'RECRUITER' ? companyId : undefined),
      id: uid(),
      title,
      detail,
      applicationId,
      createdAt: new Date().toISOString(),
    };
    setPersonal((data) => ({
      ...data,
      activity: [event, ...data.activity].slice(0, 100),
      notices: [{ ...event, read: false }, ...data.notices].slice(0, 100),
    }));
  };
  async function run(key, action, success) {
    setBusy(key);
    try {
      await action();
      if (!demo && key !== 'refresh') {
        try {
          await loadServer();
        } catch {
          setError(
            'Your change was saved, but the latest data could not be loaded. Use Refresh workspace.',
          );
        }
      }
      setToast({ type: 'success', text: success });
      return true;
    } catch (e) {
      setToast({ type: 'error', text: e.message });
      return false;
    } finally {
      setBusy('');
    }
  }
  const actions = {
    switchRole: setRole,
    switchStudent: setDemoStudentId,
    switchCompany: setDemoCompanyId,
    dismissToast: () => setToast(null),
    refresh: () => run('refresh', loadServer, 'Workspace refreshed.'),
    saveDrive: (id) => {
      const saved = savedIds.some((item) => sameId(item, id));
      setPersonal((data) => ({
        ...data,
        ...(demo ? {
          savedByStudent: {
            ...data.savedByStudent,
            [studentId]: saved
              ? demoSavedIds(data, studentId).filter((item) => !sameId(item, id))
              : [...demoSavedIds(data, studentId), id],
          },
        } : {
          savedIds: saved ? data.savedIds.filter((item) => !sameId(item, id)) : [...data.savedIds, id],
        }),
      }));
      setToast({
        type: 'success',
        text: saved
          ? 'Opportunity removed from saved.'
          : 'Opportunity saved to your shortlist.',
      });
    },
    apply: (drive) =>
      run(
        `apply-${drive.id}`,
        async () => {
          if (
            allApplications.some(
              (app) =>
                sameId(app.company_id, drive.id) &&
                sameId(app.student_id, studentId) &&
                app.status !== 'Withdrawn',
            )
          )
            throw new Error(
              'You already have an application for this opportunity.',
            );
          if (demo) {
            const app = {
              id: uid(),
              student_id: studentId,
              company_id: drive.id,
              status: 'Applied',
              applied_date: new Date().toISOString(),
            };
            setPersonal((data) => ({
              ...data,
              applications: [...data.applications, app],
            }));
            record(`Applied to ${drive.name}`, drive.position, app.id);
          } else {
            const result = await request('/api/applications', 'POST', {
              companyId: drive.id,
            });
            setServer((data) => ({
              ...data,
              applications: [
                {
                  id: result.id,
                  student_id: studentId,
                  company_id: drive.id,
                  status: 'Applied',
                  applied_date: new Date().toISOString(),
                },
                ...data.applications,
              ],
            }));
            record(`Applied to ${drive.name}`, drive.position, result.id);
          }
        },
        `Application submitted to ${drive.name}.`,
      ),
    withdraw: (app) =>
      run(
        `withdraw-${app.id}`,
        async () => {
          if (demo)
            setPersonal((data) => ({
              ...data,
              applications: data.applications.map((item) =>
                sameId(item.id, app.id)
                  ? { ...item, status: 'Withdrawn' }
                  : item,
              ),
              interviews: data.interviews.filter(
                (item) => !sameId(item.applicationId, app.id),
              ),
            }));
          else {
            await request(`/api/applications/${app.id}`, 'DELETE');
            setServer((data) => ({
              ...data,
              applications: data.applications.filter(
                (item) => !sameId(item.id, app.id),
              ),
            }));
          }
          record(
            `Application withdrawn from ${app.company?.name || 'company'}`,
            'Withdrawal confirmed by the student.',
            app.id,
          );
        },
        'Application withdrawn.',
      ),
    advance: (app, status) =>
      run(
        `status-${app.id}`,
        async () => {
          if (demo)
            setPersonal((data) => ({
              ...data,
              applications: data.applications.map((item) =>
                sameId(item.id, app.id) ? { ...item, status } : item,
              ),
            }));
          else {
            await request(`/api/applications/${app.id}/status`, 'PATCH', {
              status,
            });
            setServer((data) => ({
              ...data,
              applications: data.applications.map((item) =>
                sameId(item.id, app.id) ? { ...item, status } : item,
              ),
            }));
          }
          record(
            `${app.candidate?.name || 'Candidate'} moved to ${status}`,
            `${app.company?.name} · ${app.status} → ${status}`,
            app.id,
          );
        },
        `Candidate moved to ${status}.`,
      ),
    schedule: (values) =>
      run(
        'schedule',
        async () => {
          const app = applications.find((item) =>
            sameId(item.id, values.applicationId),
          );
          if (!app)
            throw new Error('Choose an application for this interview.');
          if (new Date(values.at) <= new Date())
            throw new Error('Choose a future interview date and time.');
          if (!demo) {
            await request('/api/workspace/interviews', 'POST', {
              ...values,
              at: new Date(values.at).toISOString(),
            });
          } else
            setPersonal((data) => ({
              ...data,
              interviews: [
                ...data.interviews,
                {
                  ...values,
                  id: uid(),
                  companyId: app.company_id,
                  studentId: app.student_id,
                  kind: role === 'STUDENT' ? 'personal' : 'official',
                },
              ],
            }));
          record(
            `${values.title} scheduled`,
            `${app.company?.name} · ${new Date(values.at).toLocaleString()}`,
            app.id,
          );
        },
        'Interview added to the schedule.',
      ),
    cancelInterview: (id) =>
      run(
        'cancel-interview',
        async () => {
          const interview = interviews.find((item) => sameId(item.id, id));
          if (!demo && !interview?.localOnly)
            await request(`/api/workspace/interviews/${id}`, 'DELETE');
          else
            setPersonal((data) => ({
              ...data,
              interviews: data.interviews.filter(
                (item) => !sameId(item.id, id),
              ),
            }));
          record(
            'Interview removed from the schedule',
            'The calendar has been updated.',
          );
        },
        'Interview removed.',
      ),
    saveProfile: (values) =>
      run(
        'profile',
        async () => {
          if (!demo) await request('/api/workspace/profile', 'PUT', values);
          else
            setPersonal((data) => ({
              ...data,
              profile: { ...data.profile, ...values },
              ...(demo
                ? {
                    students: data.students.map((item) =>
                      sameId(item.id, studentId)
                        ? { ...item, ...values }
                        : item,
                    ),
                  }
                : {}),
            }));
          record('Profile updated', 'Career details saved.');
        },
        demo
          ? 'Career profile saved in the demo.'
          : 'Career profile saved to CPMS.',
      ),
    readNotice: (id) =>
      run(
        'read-notice',
        async () => {
          if (
            !demo &&
            server.workspace.notices.some((item) => sameId(item.id, id))
          )
            await request('/api/workspace/notifications/read', 'PATCH', { id });
          setPersonal((data) => ({
            ...data,
            notices: data.notices.map((notice) =>
              sameId(notice.id, id) ? { ...notice, read: true } : notice,
            ),
          }));
        },
        'Notification marked as read.',
      ),
    readAll: () =>
      run(
        'read-notices',
        async () => {
          if (!demo)
            await request('/api/workspace/notifications/read', 'PATCH', {});
          setPersonal((data) => ({
            ...data,
            notices: data.notices.map((notice) => ({ ...notice, read: true })),
          }));
        },
        'All notifications marked as read.',
      ),
    deleteCompany: (drive) =>
      run(
        `delete-company-${drive.id}`,
        async () => {
          if (
            applications.some(
              (app) =>
                sameId(app.company_id, drive.id) &&
                !['Rejected', 'Withdrawn'].includes(app.status),
            )
          )
            throw new Error(
              'Resolve or withdraw active applications before deleting this company.',
            );
          if (!demo) await request(`/api/companies/${drive.id}`, 'DELETE');
          setPersonal((data) => ({
            ...data,
            ...(demo
              ? {
                  drives: data.drives.filter(
                    (item) => !sameId(item.id, drive.id),
                  ),
                  applications: data.applications.filter(
                    (item) => !sameId(item.company_id, drive.id),
                  ),
                  interviews: data.interviews.filter(
                    (item) => !sameId(item.companyId, drive.id),
                  ),
                }
              : {}),
            savedIds: data.savedIds.filter((item) => !sameId(item, drive.id)),
          }));
          record(
            `${drive.name} removed`,
            'The company no longer appears in opportunities.',
          );
        },
        'Company deleted.',
      ),
    saveCompany: (values, id) =>
      run(
        'company',
        async () => {
          const tags = values.skills
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
          if (demo) {
            const drive = {
              ...values,
              tags,
              id: id || uid(),
              salary: values.salary || '',
              openings: Number(values.openings),
            };
            setPersonal((data) => ({
              ...data,
              drives: id
                ? data.drives.map((item) =>
                    sameId(item.id, id) ? drive : item,
                  )
                : [...data.drives, drive],
            }));
          } else {
            const payload = {
              ...values,
              salary: values.salary || '',
              openings: Number(values.openings),
            };
            const result = await request(
              id ? `/api/companies/${id}` : '/api/companies',
              id ? 'PUT' : 'POST',
              payload,
            );
            const driveId = id || result.id;
            setServer((data) => ({
              ...data,
              companies: id
                ? data.companies.map((item) =>
                    sameId(item.id, id) ? { ...item, ...payload } : item,
                  )
                : [...data.companies, { ...payload, id: driveId }],
            }));
            setPersonal((data) => ({
              ...data,
              driveDetails: {
                ...data.driveDetails,
                [driveId]: {
                  deadline: values.deadline,
                  workMode: values.workMode,
                  tags,
                  description: values.description,
                },
              },
            }));
          }
          record(
            `${id ? 'Updated' : 'Published'} ${values.name} opportunity`,
            values.position,
          );
        },
        id ? 'Opportunity updated.' : 'New opportunity published.',
      ),
    resetDemo: () => {
      setPersonal(createDemoData());
      setRole('STUDENT');
      setDemoStudentId(DEMO_STUDENT);
      setDemoCompanyId(1);
      setToast({ type: 'success', text: 'Demo reset to its starting data.' });
    },
  };
  return {
    demo,
    role,
    user,
    profile,
    students,
    studentId,
    companyId,
    drives,
    allDrives,
    applications,
    interviews,
    savedIds: savedIds.filter((id) =>
      allDrives.some((drive) => sameId(drive.id, id)),
    ),
    notices: demo
      ? demoEvents(personal.notices, personal, role, studentId, companyId)
      : [...server.workspace.notices, ...personal.notices],
    activity: demo
      ? demoEvents(personal.activity, personal, role, studentId, companyId)
      : [...server.workspace.notices, ...personal.activity].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
    loading,
    error,
    busy,
    toast,
    storageError,
    actions,
  };
}
