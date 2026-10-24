export const DEMO_STUDENT = 'STU-DEMO001';
export const stages = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offered',
];
export const sameId = (a, b) => String(a) === String(b);
export const uid = () => crypto.randomUUID();
export function annualCompensation(value) {
  const text = String(value || '').toLowerCase();
  const number = parseFloat(text) || 0;
  if (text.includes('month'))
    return text.includes('k') ? number * 0.12 : (number * 12) / 100000;
  return number;
}
export function dateAfter(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function createDemoData() {
  const drives = [
    [
      1,
      'TechCorp',
      'Software Engineer',
      'Bangalore',
      '10.5 LPA',
      'Hybrid',
      8,
      ['React', 'Java', 'SQL'],
    ],
    [
      2,
      'DataSystems',
      'Data Analyst',
      'Pune',
      '8.0 LPA',
      'On-site',
      5,
      ['Python', 'SQL', 'Analytics'],
    ],
    [
      3,
      'CloudTech',
      'Full Stack Developer',
      'Hyderabad',
      '12.0 LPA',
      'Hybrid',
      12,
      ['React', 'Node.js', 'MySQL'],
    ],
    [
      4,
      'InnovateSoft',
      'DevOps Engineer',
      'Chennai',
      '9.5 LPA',
      'On-site',
      4,
      ['Linux', 'Docker', 'Cloud'],
    ],
    [
      5,
      'PixelWorks',
      'Frontend Developer',
      'Remote',
      '7.5 LPA',
      'Remote',
      6,
      ['JavaScript', 'React', 'CSS'],
    ],
    [
      6,
      'Orbit Labs',
      'Product Engineering Intern',
      'Bangalore',
      '35k / month',
      'Hybrid',
      10,
      ['Problem solving', 'Git', 'APIs'],
    ],
  ].map(([id, name, position, location, ctc, workMode, openings, tags], i) => ({
    id,
    name,
    position,
    location,
    ctc,
    salary: ctc,
    workMode,
    openings,
    tags,
    deadline: dateAfter(i + 3).slice(0, 10),
    description: `Join ${name}'s ${position.toLowerCase()} team. Work on meaningful products, collaborate with experienced engineers and grow through structured mentoring. The selection process includes an online assessment, a technical discussion and an HR conversation.`,
  }));
  const students = [
    {
      id: DEMO_STUDENT,
      name: 'Giri',
      email: 'giri@campus.edu',
      branch: 'Computer Science',
      cgpa: 8.2,
      skills: 'React, JavaScript, Node.js, MySQL',
      headline: 'Full stack developer · Class of 2027',
      phone: '',
      github: '',
      linkedin: '',
    },
    {
      id: 'STU-DEMO002',
      name: 'Priya Rao',
      email: 'priya@campus.edu',
      branch: 'Computer Science',
      cgpa: 8.8,
      skills: 'Python, SQL, React',
    },
    {
      id: 'STU-DEMO003',
      name: 'Arun Kumar',
      email: 'arun@campus.edu',
      branch: 'Electronics',
      cgpa: 7.9,
      skills: 'Java, Linux, Docker',
    },
    {
      id: 'STU-DEMO004',
      name: 'Sneha Reddy',
      email: 'sneha@campus.edu',
      branch: 'Information Technology',
      cgpa: 9.1,
      skills: 'React, TypeScript, SQL',
    },
  ];
  const applications = [
    ['app-101', DEMO_STUDENT, 1, 'Shortlisted'],
    ['app-102', DEMO_STUDENT, 3, 'Interview'],
    ['app-103', 'STU-DEMO002', 1, 'Applied'],
    ['app-104', 'STU-DEMO003', 1, 'Interview'],
    ['app-105', 'STU-DEMO004', 3, 'Offered'],
    ['app-106', 'STU-DEMO002', 2, 'Selected'],
    ['app-107', 'STU-DEMO003', 4, 'Applied'],
    ['app-108', 'STU-DEMO004', 5, 'Shortlisted'],
  ].map(([id, student_id, company_id, status], i) => ({
    id,
    student_id,
    company_id,
    status,
    applied_date: dateAfter(-9 + i),
  }));
  return {
    version: 1,
    drives,
    students,
    applications,
    savedIds: [6],
    profile: students[0],
    driveDetails: {},
    interviews: [
      {
        id: 'int-1',
        applicationId: 'app-102',
        companyId: 3,
        studentId: DEMO_STUDENT,
        title: 'Technical interview',
        at: dateAfter(2, 11),
        venue: 'Placement cell · Room 204',
        duration: '45 minutes',
      },
      {
        id: 'int-2',
        applicationId: 'app-104',
        companyId: 1,
        studentId: 'STU-DEMO003',
        title: 'Engineering discussion',
        at: dateAfter(3, 14),
        venue: 'TechCorp campus desk',
        duration: '30 minutes',
      },
    ],
    notices: [
      {
        id: 'notice-1',
        applicationId: 'app-102',
        studentId: DEMO_STUDENT,
        companyId: 3,
        title: 'Your CloudTech interview is scheduled',
        detail:
          'Your technical discussion is ready. Open your schedule for the time and venue.',
        createdAt: dateAfter(-1),
        read: false,
      },
      {
        id: 'notice-2',
        title: 'New opportunities this week',
        detail: 'PixelWorks and Orbit Labs are accepting campus applications.',
        createdAt: dateAfter(-2),
        read: false,
      },
      {
        id: 'notice-3',
        title: 'Welcome to the placement season',
        detail:
          'Complete your profile and save the opportunities you want to explore.',
        createdAt: dateAfter(-3),
        read: true,
      },
    ],
    activity: [
      {
        id: 'event-1',
        title: 'CloudTech moved your application to Interview',
        detail: 'Technical interview · Placement cell',
        createdAt: dateAfter(-1),
        applicationId: 'app-102',
      },
      {
        id: 'event-2',
        title: 'TechCorp shortlisted your application',
        detail: 'Software Engineer',
        createdAt: dateAfter(-2),
        applicationId: 'app-101',
      },
      {
        id: 'event-3',
        title: 'Your placement journey started',
        detail: 'Profile created and ready for the campus season',
        createdAt: dateAfter(-9),
      },
    ],
  };
}
export function createPersonalData() {
  return {
    version: 1,
    profile: {},
    savedIds: [],
    interviews: [],
    notices: [],
    activity: [],
    driveDetails: {},
  };
}
