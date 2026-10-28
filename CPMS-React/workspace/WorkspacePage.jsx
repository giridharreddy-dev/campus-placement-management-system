import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import Dialog from './Dialog';
import NotificationMenu from './NotificationMenu';
import useWorkspace from './useWorkspace';
import { DriveForm, ScheduleForm, ProfileForm } from './Forms';
import { stages, sameId, annualCompensation } from './demo-data';
import {
  exportApplications,
  exportInterview,
  exportDeadline,
} from './downloads';
import { ComparisonTray, OpportunityComparison } from './OpportunityComparison';
import {
  deadlineInfo,
  deadlineFilters,
  matchesDeadline,
  compareDeadlines,
  toggleComparison,
} from './opportunity-planner';
import PreparationPlanner from '../case-study/experiment2/PreparationPlanner';
import EligibilityDesk from '../case-study/EligibilityDesk';
import './workspace.css';

const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === 'true';
const PROJECT_SOURCE =
  'https://github.com/giridharreddy-dev/campus-placement-management-system';

const roleNames = {
  STUDENT: 'Student',
  RECRUITER: 'Recruiter',
  ADMIN: 'Placement officer',
};
const matchesSearch = (text, query) =>
  query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => text.toLowerCase().includes(term));
const titles = {
  overview: 'Overview',
  drives: 'Opportunities',
  companies: 'Manage companies',
  saved: 'Saved opportunities',
  applications: 'Applications',
  calendar: 'Interview schedule',
  activity: 'Activity',
  reports: 'Placement reports',
  profile: 'Career profile',
  preparation: 'Preparation',
};
const dateText = (
  date,
  options = { day: 'numeric', month: 'short', year: 'numeric' },
) =>
  date && !Number.isNaN(new Date(date).getTime())
    ? new Date(date).toLocaleDateString('en-IN', options)
    : 'Date not provided';
const timeText = (date) =>
  new Date(date).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Brand({ demo }) {
  return (
    <a
      className="ws-brand"
      href={STATIC_DEMO ? import.meta.env.BASE_URL : demo ? '/demo' : '/'}
    >
      <span className="ws-brand-mark">
        <Icon name="briefcase" size={23} />
      </span>
      <span>
        CPMS<small>Campus careers</small>
      </span>
    </a>
  );
}
function Status({ status }) {
  return (
    <span className={`ws-status ws-status-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}
function Empty({ title, text, children }) {
  return (
    <div className="ws-empty">
      <span>
        <Icon name="briefcase" size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
function Logo({ company, size = '' }) {
  return (
    <span
      className={`ws-company-logo ${size}`}
      style={{
        '--logo-color': [
          '#6356d8',
          '#16846b',
          '#2772bd',
          '#b46a27',
          '#a44980',
          '#485e8b',
        ][String(company?.name || '').length % 6],
      }}
    >
      {(company?.name || 'C').slice(0, 2).toUpperCase()}
    </span>
  );
}
function FilterSummary({ count, noun, plural = `${noun}s`, chips, onReset }) {
  return (
    <div className="ws-filter-summary">
      <p className="ws-results" role="status">
        <strong>{count}</strong> {count === 1 ? noun : plural}
      </p>
      {chips.length > 0 && (
        <div className="ws-active-filters" aria-label="Active filters">
          {chips.map(({ label, clear }) => (
            <button
              key={label}
              className="ws-filter-chip"
              onClick={clear}
              aria-label={`Clear ${label}`}
            >
              {label}
              <Icon name="close" size={13} />
            </button>
          ))}
          <button className="ws-text-button" onClick={onReset}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
function Progress({ status }) {
  const index = stages.indexOf(status);
  return (
    <ol className="ws-progress" aria-label={`Application progress: ${status}`}>
      {stages.map((stage, i) => (
        <li key={stage} className={i <= index ? 'done' : ''}>
          <span>{i < index ? <Icon name="check" size={12} /> : i + 1}</span>
          <small>{stage}</small>
        </li>
      ))}
    </ol>
  );
}
function DriveCard({
  drive,
  model,
  onDetails,
  onCompare,
  compareSelected = false,
  compareLimitReached = false,
  now,
}) {
  const saved = model.savedIds.some((id) => sameId(id, drive.id));
  const applied = model.applications.some(
    (app) => sameId(app.company_id, drive.id) && app.status !== 'Withdrawn',
  );
  const deadline = deadlineInfo(drive.deadline, now);
  return (
    <article className="ws-drive-card">
      <div className="ws-drive-top">
        <Logo company={drive} />
        <button
          className={`ws-icon-button ${saved ? 'is-saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${drive.name}`}
          aria-pressed={saved}
          onClick={() => model.actions.saveDrive(drive.id)}
        >
          <Icon name="bookmark" />
        </button>
      </div>
      <p className="ws-company-name">{drive.name}</p>
      <h3>{drive.position}</h3>
      <p className="ws-muted ws-icon-line">
        <Icon name="location" size={15} />
        {drive.location || 'Location to be announced'}
        {drive.workMode && ` · ${drive.workMode}`}
      </p>
      <div className="ws-tags">
        {(drive.tags || []).slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="ws-drive-pay">
        <strong>{drive.ctc || drive.salary || 'Not disclosed'}</strong>
        <span>{drive.openings} openings</span>
      </div>
      <div className="ws-drive-bottom">
        <span className="ws-icon-line">
          <Icon name="clock" size={14} />
          {drive.deadline
            ? `Apply by ${dateText(drive.deadline, { day: 'numeric', month: 'short' })}`
            : 'Applications open'}
        </span>
        <button className="ws-text-button" onClick={() => onDetails(drive)}>
          {applied && model.role === 'STUDENT' ? 'Applied' : 'View role'}
          <Icon name="arrow" size={16} />
        </button>
      </div>
      {model.role === 'STUDENT' && (
        <div className="ws-drive-planning">
          <span
            className={`ws-deadline-label ${deadline.days !== null && deadline.days >= 0 && deadline.days <= 7 ? 'soon' : ''}`}
          >
            {deadline.label}
          </span>
          {onCompare && (
            <label className="ws-compare-check">
              <input
                type="checkbox"
                checked={compareSelected}
                disabled={!compareSelected && compareLimitReached}
                onChange={() => onCompare(drive.id)}
                aria-label={`Compare ${drive.name}`}
              />
              Compare
            </label>
          )}
        </div>
      )}
    </article>
  );
}

function CalendarView({ model, onSchedule, onCancel }) {
  const [period, setPeriod] = useState('all');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState('');
  const offset = month.getDay();
  const days = Array.from(
    { length: 42 },
    (_, index) =>
      new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  );
  const interviews = [...model.interviews]
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .filter((item) => {
      const end =
        new Date(item.at).getTime() + (parseInt(item.duration) || 30) * 60000;
      return (
        (!selected || dayKey(item.at) === selected) &&
        (period === 'all' || (period === 'upcoming' ? end > now : end <= now))
      );
    });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <>
      <div className="ws-section-heading">
        <div>
          <h2>Your next conversations</h2>
          <p>Keep every round, time and venue in one place.</p>
        </div>
        <button
          className="ws-button"
          onClick={() => onSchedule()}
          disabled={
            !model.applications.some(
              (app) => !['Rejected', 'Withdrawn'].includes(app.status),
            )
          }
        >
          <Icon name="plus" size={17} />
          {model.role === 'STUDENT' ? 'Add to schedule' : 'Schedule interview'}
        </button>
      </div>
      {!model.demo && (
        <p className="ws-device-note">
          Official interviews are shared with the candidate and responsible
          staff. Personal entries are private to their creator. Download an
          event for your calendar app.
        </p>
      )}
      <div className="ws-calendar-layout">
        <section className="ws-panel ws-calendar">
          <header>
            <button
              className="ws-icon-button"
              aria-label="Previous month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              ‹
            </button>
            <h3>{dateText(month, { month: 'long', year: 'numeric' })}</h3>
            <button
              className="ws-icon-button"
              aria-label="Next month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              ›
            </button>
          </header>
          <div className="ws-calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <b key={day}>{day}</b>
            ))}
            {days.map((day) => {
              const key = dayKey(day);
              const count = model.interviews.filter(
                (item) => dayKey(item.at) === key,
              ).length;
              return (
                <button
                  key={key}
                  className={`${day.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === dayKey(new Date()) ? 'today' : ''} ${key === selected ? 'selected' : ''}`}
                  aria-label={`${dateText(day)}${count ? `, ${count} interview` : ''}`}
                  aria-pressed={key === selected}
                  onClick={() => setSelected(key)}
                >
                  {day.getDate()}
                  {count > 0 && <i />}
                </button>
              );
            })}
          </div>
          <div className="ws-calendar-actions">
            <button
              className="ws-text-button"
              onClick={() => {
                const today = new Date();
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(dayKey(today));
                setPeriod('all');
              }}
            >
              Today
            </button>
            <button
              className="ws-text-button"
              onClick={() => {
                setSelected('');
                setPeriod('all');
              }}
            >
              Show all interviews
            </button>
          </div>
          <p className="ws-time-zone">Times shown in {timeZone}</p>
        </section>
        <section className="ws-agenda">
          <h3>
            {selected ? dateText(`${selected}T00:00:00`) : 'Interview agenda'}{' '}
            <span className="ws-count">{interviews.length}</span>
          </h3>
          <div
            className="ws-agenda-filters"
            role="group"
            aria-label="Interview period"
          >
            {[
              ['all', 'All'],
              ['upcoming', 'Upcoming'],
              ['past', 'Past'],
            ].map(([value, label]) => (
              <button
                key={value}
                className="ws-text-button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {interviews.length ? (
            interviews.map((item) => {
              const company = model.allDrives.find((drive) =>
                sameId(drive.id, item.companyId),
              );
              let meetingUrl;
              try {
                const url = new URL(item.venue);
                if (['https:', 'http:'].includes(url.protocol))
                  meetingUrl = url.href;
              } catch {
                /* In-person venues stay plain text. */
              }
              const start = new Date(item.at).getTime();
              const end = start + (parseInt(item.duration) || 30) * 60000;
              return (
                <article className="ws-panel ws-interview" key={item.id}>
                  <div className="ws-interview-date">
                    <strong>{new Date(item.at).getDate()}</strong>
                    <small>{dateText(item.at, { month: 'short' })}</small>
                  </div>
                  <div>
                    <p className="ws-kicker">
                      {company?.name || 'Campus interview'}
                    </p>
                    <h3>{item.title}</h3>
                    <span
                      className={`ws-meeting-state ${end <= now ? 'past' : ''}`}
                    >
                      {end <= now
                        ? 'Finished'
                        : start <= now
                          ? 'In progress'
                          : 'Scheduled'}
                    </span>
                    {!model.demo && (
                      <small className="ws-muted">
                        {item.localOnly
                          ? 'Older device-only entry'
                          : item.kind === 'personal'
                            ? 'Personal · only you'
                            : 'Official interview'}
                      </small>
                    )}
                    <p className="ws-muted">
                      {timeText(item.at)} · {item.duration}
                    </p>
                    <p className="ws-muted ws-icon-line">
                      <Icon name="location" size={15} />
                      {item.venue}
                    </p>
                    <div className="ws-inline-actions">
                      {meetingUrl && (
                        <a
                          className="ws-text-button"
                          href={meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon name="arrow" size={15} /> Open meeting
                        </a>
                      )}
                      <button
                        className="ws-text-button"
                        onClick={() =>
                          exportInterview(
                            item,
                            company?.name || 'Campus interview',
                          )
                        }
                      >
                        <Icon name="download" size={15} />
                        Calendar event
                      </button>
                      {item.canCancel && (
                        <button
                          className="ws-text-button danger"
                          onClick={() => onCancel(item)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <Empty
              title={
                period === 'past'
                  ? 'No past interviews'
                  : 'A little breathing room'
              }
              text={
                selected
                  ? 'No interviews match this date and filter. Choose another day or show all interviews.'
                  : period === 'upcoming'
                    ? 'No upcoming interviews. Use All to see your complete schedule.'
                    : period === 'past'
                      ? 'Finished interviews will appear here.'
                      : 'Your scheduled interviews will appear here.'
              }
            />
          )}
        </section>
      </div>
    </>
  );
}

function Reports({ applications }) {
  const groups = stages.map((stage) => ({
    stage,
    count: applications.filter((app) => app.status === stage).length,
  }));
  const maximum = Math.max(1, ...groups.map((item) => item.count));
  const branches = [
    ...new Set(
      applications.map((app) => app.candidate?.branch || 'Not specified'),
    ),
  ];
  return (
    <>
      <div className="ws-section-heading">
        <div>
          <h2>Recruitment at a glance</h2>
          <p>Clear numbers from the applications in this workspace.</p>
        </div>
        <button
          className="ws-button"
          onClick={() => exportApplications(applications)}
        >
          <Icon name="download" size={17} />
          Export CSV
        </button>
      </div>
      <div className="ws-two-columns">
        <section className="ws-panel">
          <h3>Application stages</h3>
          <p className="ws-muted">
            Current distribution across the placement journey
          </p>
          <div className="ws-report-bars">
            {groups.map(({ stage, count }) => (
              <div key={stage}>
                <span>{stage}</span>
                <div>
                  <i style={{ width: `${(count / maximum) * 100}%` }} />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="ws-panel">
          <h3>Branch overview</h3>
          <p className="ws-muted">Applications and offers by department</p>
          <div className="ws-table-scroll">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Applications</th>
                  <th>Offers</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch}>
                    <td>{branch}</td>
                    <td>
                      {
                        applications.filter(
                          (app) =>
                            (app.candidate?.branch || 'Not specified') ===
                            branch,
                        ).length
                      }
                    </td>
                    <td>
                      {
                        applications.filter(
                          (app) =>
                            (app.candidate?.branch || 'Not specified') ===
                              branch && app.status === 'Offered',
                        ).length
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!applications.length && (
              <p className="ws-muted">
                Reports will populate as applications arrive.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default function WorkspacePage({ demo = false, user = null, onLogout }) {
  const model = useWorkspace({ demo, user });
  const { role, actions, applications, profile, drives, notices, busy } = model;
  const student = role === 'STUDENT';
  const [view, setView] = useState('overview');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('All locations');
  const [workMode, setWorkMode] = useState('All arrangements');
  const [stage, setStage] = useState('All stages');
  const [sort, setSort] = useState('Latest');
  const [deadlineFilter, setDeadlineFilter] = useState('All deadlines');
  const [compareIds, setCompareIds] = useState([]);
  const [deadlineNow, setDeadlineNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setDeadlineNow(new Date());
    const timer = setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);
  const [layout, setLayout] = useState('list');
  const [dialog, setDialog] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [readGuide, setReadGuide] = useState(false);
  const sidebar = useRef(null);
  const menuTrigger = useRef(null);
  useEffect(() => {
    if (!mobileMenu) return;
    const media = window.matchMedia('(max-width: 760px)');
    const trigger = menuTrigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () =>
      [
        ...sidebar.current.querySelectorAll('a[href], button:not(:disabled)'),
      ].filter((element) => element.getClientRects().length > 0);
    elements()[0]?.focus();
    const keyboard = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenu(false);
      }
      if (event.key !== 'Tab') return;
      const targets = elements();
      const first = targets[0];
      const last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const resized = () => {
      if (!media.matches) setMobileMenu(false);
    };
    document.addEventListener('keydown', keyboard);
    media.addEventListener('change', resized);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keyboard);
      media.removeEventListener('change', resized);
      if (media.matches) trigger?.focus();
    };
  }, [mobileMenu]);
  const navigate = (next) => {
    setView(next);
    setQuery('');
    setMobileMenu(false);
  };
  const clearDriveFilters = () => {
    setQuery('');
    setLocation('All locations');
    setWorkMode('All arrangements');
    setSort('Latest');
    setDeadlineFilter('All deadlines');
  };
  const clearAppFilters = () => {
    setQuery('');
    setStage('All stages');
  };
  const driveFilters = [
    ...(deadlineFilter !== 'All deadlines'
      ? [
          {
            label: `Deadline: ${deadlineFilter}`,
            clear: () => setDeadlineFilter('All deadlines'),
          },
        ]
      : []),
    ...(query.trim()
      ? [{ label: `Search: ${query.trim()}`, clear: () => setQuery('') }]
      : []),
    ...(location !== 'All locations'
      ? [
          {
            label: `Location: ${location}`,
            clear: () => setLocation('All locations'),
          },
        ]
      : []),
    ...(workMode !== 'All arrangements'
      ? [
          {
            label: `Arrangement: ${workMode}`,
            clear: () => setWorkMode('All arrangements'),
          },
        ]
      : []),
    ...(sort !== 'Latest'
      ? [{ label: `Sort: ${sort}`, clear: () => setSort('Latest') }]
      : []),
  ];
  const appFilters = [
    ...(query.trim()
      ? [{ label: `Search: ${query.trim()}`, clear: () => setQuery('') }]
      : []),
    ...(stage !== 'All stages'
      ? [{ label: `Stage: ${stage}`, clear: () => setStage('All stages') }]
      : []),
  ];
  const unread = notices.filter((notice) => !notice.read).length;
  const name = student
    ? profile.name || user?.name || 'Student'
    : role === 'RECRUITER'
      ? 'Recruiting team'
      : 'Placement team';
  const nav = [
    ['overview', 'grid', 'Overview'],
    ...(role === 'ADMIN' ? [['companies', 'people', 'Manage companies']] : []),
    [
      'drives',
      'briefcase',
      student ? 'Explore opportunities' : 'Recruitment drives',
    ],
    [
      'applications',
      'document',
      student ? 'My applications' : 'Candidate pipeline',
    ],
    ['calendar', 'calendar', 'Interview schedule'],
    ...(student
      ? [['saved', 'bookmark', 'Saved opportunities']]
      : [['reports', 'chart', 'Reports & exports']]),
    ['activity', 'bell', 'Activity & updates'],
    ...(student
      ? [
          ['profile', 'user', 'Career profile'],
          ['preparation', 'book', 'Preparation'],
        ]
      : []),
  ];
  const availableDrives = drives.filter(
    (drive) =>
      view !== 'saved' || model.savedIds.some((id) => sameId(id, drive.id)),
  );
  const comparedDrives = compareIds
    .map((id) => drives.find((drive) => sameId(id, drive.id)))
    .filter(Boolean);
  const toggleCompare = (id) =>
    setCompareIds((ids) =>
      toggleComparison(
        ids,
        id,
        drives.map((drive) => drive.id),
      ),
    );
  const matchingDrives = availableDrives.filter(
    (drive) =>
      matchesSearch(
        `${drive.name} ${drive.position} ${(drive.tags || []).join(' ')}`,
        query,
      ) &&
      (location === 'All locations' || drive.location === location) &&
      (workMode === 'All arrangements' || drive.workMode === workMode) &&
      matchesDeadline(drive, deadlineFilter, deadlineNow),
  );
  matchingDrives.sort((a, b) =>
    sort === 'Closing soonest'
      ? compareDeadlines(a, b, deadlineNow)
      : sort === 'Compensation'
        ? annualCompensation(b.ctc) - annualCompensation(a.ctc)
        : sort === 'Company A–Z'
          ? a.name.localeCompare(b.name)
          : 0,
  );
  const matchingApps = applications.filter(
    (app) =>
      (stage === 'All stages' || app.status === stage) &&
      matchesSearch(
        `${app.company?.name} ${app.company?.position} ${app.candidate?.name} ${app.candidate?.branch}`,
        query,
      ),
  );
  const upcoming = [...model.interviews]
    .filter((item) => new Date(item.at) >= new Date())
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  const active = applications.filter(
    (app) => !['Rejected', 'Withdrawn'].includes(app.status),
  );
  const stats = student
    ? [
        [
          'Open opportunities',
          drives.length,
          'briefcase',
          'Find your next role',
          'drives',
        ],
        [
          'My applications',
          active.length,
          'document',
          'Your journey in progress',
          'applications',
        ],
        [
          'Upcoming interviews',
          upcoming.length,
          'calendar',
          'Get ready for your next round',
          'calendar',
        ],
        [
          'Saved opportunities',
          model.savedIds.length,
          'bookmark',
          'Your personal shortlist',
          'saved',
        ],
      ]
    : [
        [
          'Applications',
          applications.length,
          'people',
          'Candidates in your workspace',
          'applications',
        ],
        [
          'Shortlisted',
          applications.filter((app) => app.status === 'Shortlisted').length,
          'document',
          'Ready for the next round',
          'applications',
        ],
        [
          'Upcoming interviews',
          upcoming.length,
          'calendar',
          'Conversations on the calendar',
          'calendar',
        ],
        [
          'Offers extended',
          applications.filter((app) => app.status === 'Offered').length,
          'chart',
          'Celebrating the next chapter',
          'reports',
        ],
      ];
  const onDetails = (drive) => setDialog({ type: 'details', drive });
  const schedule = (app) => setDialog({ type: 'schedule', app });
  const stageAction = (app) => {
    const index = stages.indexOf(app.status);
    if (index < 0 || index >= stages.length - 1) return null;
    return (
      <button
        className="ws-button small"
        disabled={Boolean(busy)}
        onClick={() => actions.advance(app, stages[index + 1])}
      >
        {
          ['Shortlist', 'Move to interview', 'Mark selected', 'Extend offer'][
            index
          ]
        }
        <Icon name="arrow" size={14} />
      </button>
    );
  };
  const appActions = (app) => (
    <div className="ws-inline-actions">
      <button
        className="ws-text-button"
        onClick={() => setDialog({ type: 'application', app })}
      >
        {student ? 'View timeline' : 'View candidate'}
      </button>
      {student ? (
        !['Withdrawn', 'Rejected', 'Offered'].includes(app.status) && (
          <button
            className="ws-text-button danger"
            onClick={() => setDialog({ type: 'withdraw', app })}
          >
            Withdraw
          </button>
        )
      ) : (
        <>
          {stageAction(app)}
          {['Shortlisted', 'Interview'].includes(app.status) && (
            <button className="ws-text-button" onClick={() => schedule(app)}>
              <Icon name="calendar" size={15} />
              Schedule
            </button>
          )}
          {!['Rejected', 'Withdrawn', 'Offered'].includes(app.status) && (
            <button
              className="ws-text-button danger"
              onClick={() => setDialog({ type: 'reject', app })}
            >
              Reject
            </button>
          )}
        </>
      )}
    </div>
  );
  return (
    <div className="ws-app">
      <a className="ws-skip" href="#workspace-main">
        Skip to content
      </a>
      {mobileMenu && (
        <button
          className="ws-mobile-backdrop"
          tabIndex={-1}
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        id="workspace-navigation"
        ref={sidebar}
        className={`ws-sidebar ${mobileMenu ? 'open' : ''}`}
      >
        <button
          className="ws-icon-button ws-nav-close"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenu(false)}
        >
          <Icon name="close" />
        </button>
        <Brand demo={demo} />
        <p className="ws-nav-caption">WORKSPACE</p>
        <nav aria-label="Workspace navigation">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {id === 'saved' && model.savedIds.length > 0 && (
                <small>{model.savedIds.length}</small>
              )}
              {id === 'activity' && unread > 0 && <i className="ws-nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="ws-sidebar-bottom">
          {!STATIC_DEMO && (
            <>
              <p className="ws-nav-caption">LEARN & PRESENT</p>
              <a href="/case-study">
                <Icon name="book" />
                Five case studies
                <Icon name="arrow" size={14} />
              </a>
              <a href="/project-files">
                <Icon name="document" />
                Programs & source
                <Icon name="arrow" size={14} />
              </a>
              <a href="/syllabus?mode=basic">
                <Icon name="grid" />
                Basic experiments
                <Icon name="arrow" size={14} />
              </a>
            </>
          )}
          {STATIC_DEMO && (
            <a href={PROJECT_SOURCE} target="_blank" rel="noopener noreferrer">
              <Icon name="document" />
              Full project & setup
              <Icon name="arrow" size={14} />
            </a>
          )}
          {!demo && (
            <a href="/manage">
              <Icon name="people" />
              Full management tools
              <Icon name="arrow" size={14} />
            </a>
          )}
          <div className="ws-sidebar-tip">
            <span>Built for your next chapter.</span>
            <small>Discover. Prepare. Get placed.</small>
          </div>
          <div className="ws-account">
            <span className="ws-avatar">
              {student
                ? name.slice(0, 1).toUpperCase()
                : role === 'ADMIN'
                  ? 'P'
                  : 'R'}
            </span>
            <div>
              <strong>{student ? name : roleNames[role]}</strong>
              <small>{demo ? 'Demo workspace' : user?.email}</small>
            </div>
            {!demo && (
              <button
                className="ws-icon-button"
                onClick={onLogout}
                aria-label="Sign out"
              >
                <Icon name="logout" size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="ws-body" inert={mobileMenu}>
        <header className="ws-topbar">
          <div className="ws-topbar-title">
            <button
              className="ws-icon-button ws-menu-toggle"
              ref={menuTrigger}
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Open navigation"
              aria-expanded={mobileMenu}
              aria-controls="workspace-navigation"
            >
              <Icon name="menu" />
            </button>
            <span>
              Workspace <i>/</i> <strong>{titles[view]}</strong>
            </span>
          </div>
          <div className="ws-topbar-actions">
            {!demo && (
              <button
                className="ws-icon-button"
                disabled={Boolean(busy)}
                onClick={actions.refresh}
                aria-label="Refresh workspace"
                title="Refresh workspace"
              >
                <Icon name="refresh" />
              </button>
            )}
            <span className={`ws-environment ${demo ? 'demo' : ''}`}>
              <i />
              {demo
                ? 'Demo · sample data'
                : model.error
                  ? 'Connection needs attention'
                  : model.loading
                    ? 'Connecting…'
                    : 'Connected portal'}
            </span>
            {demo && (
              <label className="ws-role-switch">
                <span className="ws-sr-only">Demo role</span>
                <select
                  value={role}
                  onChange={(event) => {
                    actions.switchRole(event.target.value);
                    navigate('overview');
                    setLocation('All locations');
                    setWorkMode('All arrangements');
                    setStage('All stages');
                    setDeadlineFilter('All deadlines');
                    setCompareIds([]);
                  }}
                >
                  <option value="STUDENT">Student view</option>
                  <option value="RECRUITER">Recruiter view</option>
                  <option value="ADMIN">Placement officer view</option>
                </select>
              </label>
            )}
            <NotificationMenu
              key={`${view}-${role}-${mobileMenu}`}
              notices={notices}
              actions={actions}
              onViewAll={() => navigate('activity')}
            />
            <span className="ws-avatar small">{name.slice(0, 1)}</span>
          </div>
        </header>
        <main id="workspace-main" className="ws-main" tabIndex={-1}>
          {demo && (
            <div className="ws-demo-banner">
              <span>
                <Icon name="play" size={15} />
                {STATIC_DEMO
                  ? 'Browser-only demo: sample data stays in this browser. No real applications are sent.'
                  : 'Sample accounts only. Signed-in portal updates appear in the portal, not this demo.'}
              </span>
              <div>
                {role !== 'ADMIN' && (
                  <label className="ws-demo-account">
                    <span>{student ? 'Demo student' : 'Demo company'}</span>
                    <select
                      value={student ? model.studentId : model.companyId}
                      onChange={(event) => {
                        if (student) actions.switchStudent(event.target.value);
                        else actions.switchCompany(event.target.value);
                        navigate('overview');
                        setStage('All stages');
                        setDialog(null);
                      }}
                    >
                      {(student ? model.students : model.allDrives).map(
                        (account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                            {student ? ' · ' + account.email : ''}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                )}
                <button onClick={() => setReadGuide(!readGuide)}>
                  {readGuide ? 'Hide walkthrough' : 'Demo walkthrough'}
                </button>
                <button onClick={() => setDialog({ type: 'reset' })}>
                  <Icon name="refresh" size={13} />
                  Reset demo
                </button>
                <a
                  href={STATIC_DEMO ? PROJECT_SOURCE : '/'}
                  target={STATIC_DEMO ? '_blank' : undefined}
                  rel={STATIC_DEMO ? 'noopener noreferrer' : undefined}
                >
                  {STATIC_DEMO
                    ? 'Full project & setup'
                    : 'Open signed-in portal'}
                  <Icon name="arrow" size={13} />
                </a>
              </div>
            </div>
          )}
          {readGuide && demo && (
            <section className="ws-walkthrough">
              <h3>A simple story for your presentation</h3>
              <ol>
                <li>
                  Student: explore PixelWorks, save it and submit an
                  application.
                </li>
                <li>
                  Placement officer: open the pipeline, shortlist Giri and move
                  the application to Interview.
                </li>
                <li>
                  Schedule the interview, then return to Student view to see it.
                </li>
                <li>
                  Open Activity for the timeline and Reports to download the
                  applicant list.
                </li>
              </ol>
            </section>
          )}
          {model.storageError && (
            <p className="ws-alert" role="alert">
              {model.storageError}
            </p>
          )}
          {model.loading ? (
            <div className="ws-loading">
              <span className="spinner" />
              <h2>Getting your workspace ready…</h2>
              <p>Loading your opportunities and applications.</p>
            </div>
          ) : model.error ? (
            <Empty title="We couldn’t load the workspace" text={model.error}>
              <button
                className="ws-button"
                onClick={actions.refresh}
                disabled={Boolean(busy)}
              >
                Try again
              </button>
            </Empty>
          ) : (
            <>
              {view === 'overview' && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">YOUR CAREER, MOVING FORWARD</p>
                      <h1>
                        {student
                          ? `Welcome back, ${name.split(' ')[0]}`
                          : role === 'RECRUITER'
                            ? 'Find your next great hire'
                            : 'A clear view of your placement season'}
                        <span className="ws-heading-dot">.</span>
                      </h1>
                      <p>
                        {student
                          ? 'A little preparation today. A bigger opportunity tomorrow.'
                          : 'Bring opportunities, candidates and conversations together.'}
                      </p>
                    </div>
                    <span className="ws-today">
                      <Icon name="calendar" size={17} />
                      {dateText(new Date(), {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <section className="ws-hero">
                    <div>
                      <span className="ws-hero-label">
                        {student
                          ? 'THE NEXT CHAPTER STARTS HERE'
                          : 'A BETTER CAMPUS HIRING EXPERIENCE'}
                      </span>
                      <h2>
                        {student
                          ? 'Good opportunities.\nGreat beginnings.'
                          : 'Less coordination.\nMore meaningful connections.'}
                      </h2>
                      <p>
                        {student
                          ? 'Explore roles, follow your applications and show up prepared for your next conversation.'
                          : 'Keep the recruitment journey organised, from the first application to the final offer.'}
                      </p>
                      <button
                        className="ws-button white"
                        onClick={() =>
                          navigate(student ? 'drives' : 'applications')
                        }
                      >
                        {student
                          ? 'Explore opportunities'
                          : 'Open candidate pipeline'}
                        <Icon name="arrow" size={17} />
                      </button>
                    </div>
                    <div className="ws-hero-art" aria-hidden="true">
                      <div className="ws-orbit orbit-one" />
                      <div className="ws-orbit orbit-two" />
                      <div className="ws-journey-card">
                        <span className="ws-journey-icon">
                          <Icon name="briefcase" size={25} />
                        </span>
                        <strong>Your next chapter</strong>
                        <small>One step closer, every day.</small>
                        <div>
                          <span>
                            <Icon name="check" size={13} />
                            Discover
                          </span>
                          <span>
                            <Icon name="check" size={13} />
                            Connect
                          </span>
                          <span>
                            <Icon name="arrow" size={13} />
                            Grow
                          </span>
                        </div>
                      </div>
                      <span className="ws-art-spark">✦</span>
                    </div>
                  </section>
                  <section className="ws-stats" aria-label="Workspace summary">
                    {stats.map(([label, value, icon, caption, target], i) => (
                      <button
                        key={label}
                        className={`ws-stat stat-${i}`}
                        onClick={() => navigate(target)}
                      >
                        <span>
                          <Icon name={icon} />
                        </span>
                        <div>
                          <p>{label}</p>
                          <strong>{value}</strong>
                          <small>{caption}</small>
                        </div>
                        <Icon name="arrow" size={15} />
                      </button>
                    ))}
                  </section>
                  <div className="ws-overview-grid">
                    <section>
                      <div className="ws-section-heading">
                        <div>
                          <h2>
                            {student
                              ? 'Find a role that feels right'
                              : 'Recruitment opportunities'}
                          </h2>
                          <p>
                            {student
                              ? 'A few opportunities to start exploring.'
                              : 'The roles bringing your campus and employers together.'}
                          </p>
                        </div>
                        <button
                          className="ws-text-button"
                          onClick={() => navigate('drives')}
                        >
                          View all
                          <Icon name="arrow" size={16} />
                        </button>
                      </div>
                      <div className="ws-drive-grid compact">
                        {drives.slice(0, 2).map((drive) => (
                          <DriveCard
                            key={drive.id}
                            drive={drive}
                            model={model}
                            onDetails={onDetails}
                          />
                        ))}
                      </div>
                      {!drives.length && (
                        <Empty
                          title="The next opportunity is on its way"
                          text="Published opportunities will appear here."
                        />
                      )}
                      <section className="ws-panel ws-recent">
                        <div className="ws-section-heading">
                          <h3>Recent activity</h3>
                          <button
                            className="ws-text-button"
                            onClick={() => navigate('activity')}
                          >
                            View timeline
                          </button>
                        </div>
                        {model.activity.slice(0, 3).map((item) => (
                          <div className="ws-activity-row" key={item.id}>
                            <span className="ws-activity-dot">
                              <Icon name="check" size={12} />
                            </span>
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.detail}</p>
                            </div>
                            <time>
                              {dateText(item.createdAt, {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </time>
                          </div>
                        ))}
                        {!model.activity.length && (
                          <p className="ws-muted">
                            Your activity in this workspace will appear here.
                          </p>
                        )}
                      </section>
                    </section>
                    <aside className="ws-overview-aside">
                      <section className="ws-panel">
                        <div className="ws-section-heading">
                          <h3>Coming up next</h3>
                          <Icon name="calendar" size={18} />
                        </div>
                        {upcoming.slice(0, 2).map((item) => (
                          <button
                            className="ws-upcoming"
                            key={item.id}
                            onClick={() => navigate('calendar')}
                          >
                            <span className="ws-date-square">
                              <strong>{new Date(item.at).getDate()}</strong>
                              <small>
                                {dateText(item.at, { month: 'short' })}
                              </small>
                            </span>
                            <span>
                              <strong>{item.title}</strong>
                              <small>
                                {
                                  model.allDrives.find((drive) =>
                                    sameId(drive.id, item.companyId),
                                  )?.name
                                }
                              </small>
                              <small>
                                {timeText(item.at)} · {item.duration}
                              </small>
                            </span>
                          </button>
                        ))}
                        {!upcoming.length && (
                          <p className="ws-muted">
                            No upcoming interviews. Your next conversation will
                            appear here.
                          </p>
                        )}
                        <button
                          className="ws-button secondary full"
                          onClick={() => navigate('calendar')}
                        >
                          Open schedule
                          <Icon name="arrow" size={15} />
                        </button>
                      </section>
                      <section className="ws-preparation-promo">
                        <span className="ws-promo-icon">
                          <Icon name={student ? 'book' : 'chart'} size={24} />
                        </span>
                        <h3>
                          {student
                            ? 'Make preparation a habit.'
                            : 'Turn activity into insight.'}
                        </h3>
                        <p>
                          {student
                            ? 'Track your practice and build confidence, one interview round at a time.'
                            : 'See the candidate funnel and download a placement report.'}
                        </p>
                        <button
                          className="ws-text-button"
                          onClick={() =>
                            navigate(student ? 'preparation' : 'reports')
                          }
                        >
                          {student ? 'Start preparing' : 'View reports'}
                          <Icon name="arrow" size={16} />
                        </button>
                      </section>
                    </aside>
                  </div>
                </>
              )}
              {['drives', 'saved'].includes(view) && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">DISCOVER WHAT’S NEXT</p>
                      <h1>
                        {view === 'saved'
                          ? 'Your personal shortlist'
                          : student
                            ? 'Find your next opportunity'
                            : 'Recruitment drives'}
                      </h1>
                      <p>
                        {view === 'saved'
                          ? 'The roles you want to come back to.'
                          : 'Explore teams, roles and possibilities for your next chapter.'}
                      </p>
                    </div>
                    {role === 'ADMIN' && (
                      <button
                        className="ws-button"
                        onClick={() => setDialog({ type: 'company' })}
                      >
                        <Icon name="plus" size={17} />
                        Publish opportunity
                      </button>
                    )}
                  </div>
                  <div className="ws-filter-bar ws-opportunity-filters">
                    <label className="ws-search">
                      <Icon name="search" size={18} />
                      <span className="ws-sr-only">Search opportunities</span>
                      <input
                        placeholder="Search companies, roles or skills"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                    <label>
                      <span className="ws-filter-label">Location</span>
                      <select
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                      >
                        <option>All locations</option>
                        {[
                          ...new Set(
                            drives
                              .map((drive) => drive.location)
                              .filter(Boolean),
                          ),
                        ].map((place) => (
                          <option key={place}>{place}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="ws-filter-label">Work arrangement</span>
                      <select
                        value={workMode}
                        onChange={(event) => setWorkMode(event.target.value)}
                      >
                        <option>All arrangements</option>
                        <option>Hybrid</option>
                        <option>On-site</option>
                        <option>Remote</option>
                      </select>
                    </label>
                    <label>
                      <span className="ws-filter-label">
                        Sort opportunities
                      </span>
                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                      >
                        <option>Latest</option>
                        <option>Compensation</option>
                        <option>Company A–Z</option>
                        <option>Closing soonest</option>
                      </select>
                    </label>
                    <label>
                      <span className="ws-filter-label">
                        Application deadline
                      </span>
                      <select
                        value={deadlineFilter}
                        onChange={(event) =>
                          setDeadlineFilter(event.target.value)
                        }
                      >
                        {deadlineFilters.map((filter) => (
                          <option key={filter}>{filter}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {student && (
                    <ComparisonTray
                      drives={comparedDrives}
                      onRemove={toggleCompare}
                      onClear={() => setCompareIds([])}
                      onOpen={() => setDialog({ type: 'compare' })}
                    />
                  )}
                  <FilterSummary
                    count={matchingDrives.length}
                    noun="opportunity"
                    plural="opportunities"
                    chips={driveFilters}
                    onReset={clearDriveFilters}
                  />
                  {matchingDrives.length ? (
                    <div className="ws-drive-grid">
                      {matchingDrives.map((drive) => (
                        <DriveCard
                          key={drive.id}
                          drive={drive}
                          model={model}
                          onDetails={onDetails}
                          onCompare={student ? toggleCompare : undefined}
                          compareSelected={comparedDrives.some((item) =>
                            sameId(item.id, drive.id),
                          )}
                          compareLimitReached={comparedDrives.length >= 3}
                          now={deadlineNow}
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={
                        view === 'saved' && availableDrives.length === 0
                          ? 'Save something worth coming back to'
                          : 'No matching opportunities'
                      }
                      text={
                        view === 'saved' && availableDrives.length === 0
                          ? 'Use the bookmark button on an opportunity to add it here.'
                          : 'Try another search, location, work arrangement or deadline.'
                      }
                    >
                      <button
                        className="ws-button secondary"
                        onClick={() => {
                          clearDriveFilters();
                          if (availableDrives.length === 0) navigate('drives');
                        }}
                      >
                        {availableDrives.length === 0
                          ? 'Explore all opportunities'
                          : 'Reset opportunity filters'}
                      </button>
                    </Empty>
                  )}
                </>
              )}
              {view === 'applications' && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">EVERY STEP, IN ONE PLACE</p>
                      <h1>
                        {student
                          ? 'Your placement journey'
                          : 'Candidate pipeline'}
                      </h1>
                      <p>
                        {student
                          ? 'Follow your applications from the first step to the next chapter.'
                          : 'Review candidates, move them forward and plan their next conversation.'}
                      </p>
                    </div>
                    <button
                      className="ws-button secondary"
                      onClick={() => exportApplications(matchingApps)}
                    >
                      <Icon name="download" size={17} />
                      Export CSV
                    </button>
                  </div>
                  <div className="ws-filter-bar">
                    <label className="ws-search">
                      <Icon name="search" size={18} />
                      <span className="ws-sr-only">Search applications</span>
                      <input
                        value={query}
                        placeholder={
                          student
                            ? 'Search company or role'
                            : 'Search candidate, company or branch'
                        }
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                    <label>
                      <span className="ws-filter-label">Application stage</span>
                      <select
                        value={stage}
                        onChange={(event) => setStage(event.target.value)}
                      >
                        {['All stages', ...stages, 'Rejected', 'Withdrawn'].map(
                          (item) => (
                            <option key={item}>{item}</option>
                          ),
                        )}
                      </select>
                    </label>
                    {!student && (
                      <div className="ws-segment" aria-label="Pipeline layout">
                        <button
                          aria-pressed={layout === 'list'}
                          onClick={() => setLayout('list')}
                        >
                          List
                        </button>
                        <button
                          aria-pressed={layout === 'board'}
                          onClick={() => setLayout('board')}
                        >
                          Board
                        </button>
                      </div>
                    )}
                  </div>
                  <FilterSummary
                    count={matchingApps.length}
                    noun="application"
                    chips={appFilters}
                    onReset={clearAppFilters}
                  />
                  {matchingApps.length ? (
                    !student && layout === 'board' ? (
                      <div className="ws-board">
                        {[
                          ...stages,
                          ...['Rejected', 'Withdrawn'].filter((status) =>
                            matchingApps.some((app) => app.status === status),
                          ),
                        ].map((status) => (
                          <section key={status} className="ws-board-column">
                            <h3>
                              <Status status={status} />
                              <span>
                                {
                                  matchingApps.filter(
                                    (app) => app.status === status,
                                  ).length
                                }
                              </span>
                            </h3>
                            {matchingApps
                              .filter((app) => app.status === status)
                              .map((app) => (
                                <article key={app.id} className="ws-board-card">
                                  <span className="ws-avatar">
                                    {(app.candidate?.name || 'C')[0]}
                                  </span>
                                  <h4>
                                    {app.candidate?.name || app.student_id}
                                  </h4>
                                  <p>
                                    {app.company?.name} ·{' '}
                                    {app.company?.position}
                                  </p>
                                  <small>{app.candidate?.branch}</small>
                                  {appActions(app)}
                                </article>
                              ))}
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className="ws-application-list">
                        {matchingApps.map((app) => (
                          <article
                            key={app.id}
                            className="ws-panel ws-application"
                            data-application-id={app.id}
                          >
                            <div className="ws-application-heading">
                              <Logo company={app.company} />
                              <div>
                                <h3>
                                  {student
                                    ? app.company?.position
                                    : app.candidate?.name || app.student_id}
                                </h3>
                                <p>
                                  {app.company?.name}
                                  {!student && ` · ${app.company?.position}`}
                                </p>
                                <small>
                                  {student
                                    ? `Applied ${dateText(app.applied_date)}`
                                    : `${app.candidate?.branch || 'Branch not provided'} · ${app.candidate?.email || app.student_id}`}
                                </small>
                              </div>
                              <Status status={app.status} />
                            </div>
                            {student && stages.includes(app.status) && (
                              <Progress status={app.status} />
                            )}
                            <div className="ws-application-footer">
                              <span className="ws-muted">
                                {student
                                  ? app.company?.location
                                  : `Applied ${dateText(app.applied_date)}`}
                              </span>
                              {appActions(app)}
                            </div>
                          </article>
                        ))}
                      </div>
                    )
                  ) : (
                    <Empty
                      title="Your next step starts with an application"
                      text="Applications matching this view will appear here."
                    >
                      <button
                        className="ws-button secondary"
                        onClick={() => navigate('drives')}
                      >
                        Explore opportunities
                      </button>
                    </Empty>
                  )}
                </>
              )}
              {view === 'calendar' && (
                <CalendarView
                  model={model}
                  onSchedule={schedule}
                  onCancel={(interview) =>
                    setDialog({ type: 'cancel', interview })
                  }
                />
              )}
              {view === 'companies' && role === 'ADMIN' && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">PARTNER COMPANIES</p>
                      <h1>Manage companies</h1>
                      <p>
                        Create, review and update the opportunities students can
                        apply to.
                      </p>
                    </div>
                    <button
                      className="ws-button"
                      onClick={() => setDialog({ type: 'company' })}
                    >
                      <Icon name="plus" size={17} />
                      Add company
                    </button>
                  </div>
                  <section className="ws-panel">
                    <div className="ws-company-toolbar">
                      <label className="ws-company-search">
                        <span>Find a company</span>
                        <input
                          type="search"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Company, role or location"
                        />
                      </label>
                      <span className="ws-muted">
                        {
                          drives.filter((drive) =>
                            matchesSearch(
                              `${drive.name} ${drive.position} ${drive.location}`,
                              query,
                            ),
                          ).length
                        }{' '}
                        companies
                      </span>
                    </div>
                    <div className="ws-table-scroll">
                      <table className="ws-table ws-company-table">
                        <thead>
                          <tr>
                            <th>Company / role</th>
                            <th>Location</th>
                            <th>Compensation</th>
                            <th>Openings</th>
                            <th>Active applications</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drives
                            .filter((drive) =>
                              matchesSearch(
                                `${drive.name} ${drive.position} ${drive.location}`,
                                query,
                              ),
                            )
                            .map((drive) => {
                              const count = applications.filter(
                                (app) =>
                                  sameId(app.company_id, drive.id) &&
                                  !['Rejected', 'Withdrawn'].includes(
                                    app.status,
                                  ),
                              ).length;
                              return (
                                <tr key={drive.id}>
                                  <td>
                                    <strong>{drive.name}</strong>
                                    <small>{drive.position}</small>
                                  </td>
                                  <td>{drive.location || 'Not specified'}</td>
                                  <td>
                                    {drive.ctc ||
                                      drive.salary ||
                                      'Not disclosed'}
                                  </td>
                                  <td>{drive.openings}</td>
                                  <td>{count}</td>
                                  <td>
                                    <div className="ws-inline-actions">
                                      <button
                                        className="ws-text-button"
                                        onClick={() => onDetails(drive)}
                                      >
                                        View
                                      </button>
                                      <button
                                        className="ws-text-button"
                                        onClick={() =>
                                          setDialog({ type: 'company', drive })
                                        }
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="ws-text-button danger"
                                        disabled={Boolean(busy) || count > 0}
                                        title={
                                          count
                                            ? 'Resolve active applications before deleting'
                                            : 'Delete company'
                                        }
                                        onClick={() =>
                                          setDialog({
                                            type: 'delete-company',
                                            drive,
                                          })
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    {!drives.some((drive) =>
                      matchesSearch(
                        `${drive.name} ${drive.position} ${drive.location}`,
                        query,
                      ),
                    ) && (
                      <Empty
                        title="No companies found"
                        text="Try another search or add your first partner company."
                      />
                    )}
                    <p className="ws-device-note">
                      Companies with active applications cannot be deleted. The
                      server checks again before confirming removal.
                    </p>
                  </section>
                </>
              )}
              {view === 'activity' && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">STAY IN THE LOOP</p>
                      <h1>Activity & updates</h1>
                      <p>
                        {demo
                          ? 'Follow the story as you explore the demo.'
                          : 'Shared interview and application updates from your CPMS account.'}
                      </p>
                    </div>
                    <button
                      className="ws-button secondary"
                      onClick={actions.readAll}
                    >
                      <Icon name="check" size={17} />
                      Mark all read
                    </button>
                  </div>
                  <div className="ws-two-columns">
                    <section className="ws-panel">
                      <h3>
                        Notifications{' '}
                        <span className="ws-count">{unread} unread</span>
                      </h3>
                      {notices.map((notice) => (
                        <button
                          className={`ws-notice-item ${notice.read ? '' : 'unread'}`}
                          key={notice.id}
                          onClick={() => actions.readNotice(notice.id)}
                        >
                          <span className="ws-activity-dot">
                            <Icon name="bell" size={15} />
                          </span>
                          <span>
                            <strong>{notice.title}</strong>
                            <small>{notice.detail}</small>
                            <time>{dateText(notice.createdAt)}</time>
                          </span>
                          {!notice.read && <i />}
                        </button>
                      ))}
                      {!notices.length && (
                        <Empty
                          title="You’re all caught up"
                          text="New updates will appear here."
                        />
                      )}
                    </section>
                    <section className="ws-panel">
                      <h3>Activity timeline</h3>
                      <div className="ws-timeline">
                        {model.activity.map((item) => (
                          <article key={item.id}>
                            <span />
                            <div>
                              <time>
                                {dateText(item.createdAt)} ·{' '}
                                {timeText(item.createdAt)}
                              </time>
                              <h4>{item.title}</h4>
                              <p>{item.detail}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                      {!model.activity.length && (
                        <Empty
                          title="A fresh start"
                          text="Actions you take here will build your timeline."
                        />
                      )}
                    </section>
                  </div>
                </>
              )}
              {view === 'reports' && <Reports applications={applications} />}
              {view === 'profile' && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">PUT YOUR BEST SELF FORWARD</p>
                      <h1>Your career profile</h1>
                      <p>
                        A clear introduction to your skills, interests and work.
                      </p>
                    </div>
                  </div>
                  <div className="ws-profile-layout">
                    <aside className="ws-panel ws-profile-summary">
                      <span className="ws-avatar large">
                        {name.slice(0, 1)}
                      </span>
                      <h2>{name}</h2>
                      <p>
                        {profile.headline || 'Ready for the next opportunity'}
                      </p>
                      <span className="ws-status ws-status-applied">
                        {profile.branch || 'Student'}
                      </span>
                      <dl>
                        <dt>College email</dt>
                        <dd>
                          {profile.email || user?.email || 'Not provided'}
                        </dd>
                        <dt>Student ID</dt>
                        <dd>{profile.id}</dd>
                        <dt>CGPA</dt>
                        <dd>{profile.cgpa ?? 'Not provided'}</dd>
                      </dl>
                    </aside>
                    <section className="ws-panel">
                      <h3>Career details</h3>
                      <ProfileForm
                        key={profile.id}
                        profile={profile}
                        onSave={actions.saveProfile}
                        demo={demo}
                        busy={busy}
                      />
                    </section>
                  </div>
                </>
              )}
              {view === 'preparation' && (
                <>
                  <div className="ws-page-heading">
                    <div>
                      <p className="ws-kicker">SMALL STEPS. STEADY PROGRESS.</p>
                      <h1>Get ready for your next conversation</h1>
                      <p>
                        Build a practice habit with mock rounds and problem
                        solving.
                      </p>
                    </div>
                  </div>
                  <PreparationPlanner name={name} />
                  <details className="ws-panel ws-practice-details">
                    <summary>
                      JavaScript practice · placement criterion example
                    </summary>
                    <p className="ws-muted">
                      This classroom exercise demonstrates DOM events. It does
                      not control applications.
                    </p>
                    <EligibilityDesk />
                  </details>
                  <section className="ws-panel">
                    <h3>A simple preparation checklist</h3>
                    <PreparationChecklist />
                  </section>
                </>
              )}
            </>
          )}
          <footer className="ws-footer">
            <span>CPMS · A better beginning.</span>
            <span>
              {demo
                ? 'Interactive demo · changes saved in this browser'
                : 'Your campus placement workspace'}
            </span>
          </footer>
        </main>
      </div>
      {model.toast && (
        <div
          className={`ws-toast ${model.toast.type}`}
          role={model.toast.type === 'error' ? 'alert' : 'status'}
        >
          <Icon
            name={model.toast.type === 'error' ? 'close' : 'check'}
            size={19}
          />
          <span>{model.toast.text}</span>
          <button
            className="ws-icon-button"
            onClick={actions.dismissToast}
            aria-label="Dismiss message"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {dialog?.type === 'compare' && student && (
        <OpportunityComparison
          drives={comparedDrives}
          applications={applications}
          now={deadlineNow}
          onDetails={onDetails}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'details' && (
        <Dialog
          title="Opportunity details"
          onClose={() => setDialog(null)}
          wide
        >
          <div className="ws-role-details">
            <div className="ws-application-heading">
              <Logo company={dialog.drive} />
              <div>
                <p className="ws-kicker">{dialog.drive.name}</p>
                <h2>{dialog.drive.position}</h2>
                <p className="ws-muted">
                  {dialog.drive.location}
                  {dialog.drive.workMode && ` · ${dialog.drive.workMode}`}
                </p>
              </div>
            </div>
            <div className="ws-detail-metrics">
              <div>
                <small>Compensation</small>
                <strong>
                  {dialog.drive.ctc || dialog.drive.salary || 'Not disclosed'}
                </strong>
              </div>
              <div>
                <small>Open positions</small>
                <strong>{dialog.drive.openings}</strong>
              </div>
              <div>
                <small>Apply by</small>
                <strong>
                  {dialog.drive.deadline
                    ? dateText(dialog.drive.deadline)
                    : 'Contact placement office'}
                </strong>
              </div>
            </div>
            <h3>About the opportunity</h3>
            <p>
              {dialog.drive.description ||
                'Connect with the placement office for the detailed job description and selection process.'}
            </p>
            <div className="ws-tags">
              {(dialog.drive.tags || []).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="ws-dialog-actions">
              {student &&
                deadlineInfo(dialog.drive.deadline, deadlineNow).days !==
                  null &&
                deadlineInfo(dialog.drive.deadline, deadlineNow).days >= 0 && (
                  <button
                    className="ws-button secondary"
                    onClick={() => exportDeadline(dialog.drive)}
                  >
                    <Icon name="calendar" size={17} />
                    Add deadline to calendar
                  </button>
                )}
              <button
                className="ws-button secondary"
                onClick={() => actions.saveDrive(dialog.drive.id)}
              >
                <Icon name="bookmark" size={17} />
                {model.savedIds.some((id) => sameId(id, dialog.drive.id))
                  ? 'Saved'
                  : 'Save opportunity'}
              </button>
              {student && (
                <button
                  className="ws-button"
                  disabled={
                    Boolean(busy) ||
                    applications.some(
                      (app) =>
                        sameId(app.company_id, dialog.drive.id) &&
                        app.status !== 'Withdrawn',
                    )
                  }
                  onClick={async () => {
                    if (await actions.apply(dialog.drive)) setDialog(null);
                  }}
                >
                  {applications.some(
                    (app) =>
                      sameId(app.company_id, dialog.drive.id) &&
                      app.status !== 'Withdrawn',
                  )
                    ? 'Already applied'
                    : busy
                      ? 'Submitting…'
                      : 'Apply for this role'}
                  <Icon name="arrow" size={16} />
                </button>
              )}
              {role === 'ADMIN' && (
                <button
                  className="ws-button"
                  onClick={() =>
                    setDialog({ type: 'company', drive: dialog.drive })
                  }
                >
                  Edit opportunity
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
      {dialog?.type === 'company' && (
        <DriveForm
          drive={dialog.drive}
          onClose={() => setDialog(null)}
          onSave={actions.saveCompany}
          busy={busy}
          demo={demo}
        />
      )}
      {dialog?.type === 'schedule' && (
        <ScheduleForm
          selected={dialog.app}
          applications={applications.filter(
            (app) => !['Rejected', 'Withdrawn'].includes(app.status),
          )}
          onClose={() => setDialog(null)}
          onSave={actions.schedule}
          busy={busy}
          demo={demo}
          role={role}
        />
      )}
      {dialog?.type === 'application' && (
        <Dialog
          title={student ? 'Your application timeline' : 'Candidate details'}
          onClose={() => setDialog(null)}
          wide
        >
          <div className="ws-role-details">
            <div className="ws-application-heading">
              <span className="ws-avatar large">
                {(dialog.app.candidate?.name || 'S')[0]}
              </span>
              <div>
                <h2>{dialog.app.candidate?.name || dialog.app.student_id}</h2>
                <p>
                  {dialog.app.company?.position} · {dialog.app.company?.name}
                </p>
                <p className="ws-muted">{dialog.app.candidate?.email}</p>
              </div>
              <Status
                status={
                  applications.find((app) => sameId(app.id, dialog.app.id))
                    ?.status || dialog.app.status
                }
              />
            </div>
            {!student && (
              <div className="ws-detail-metrics">
                <div>
                  <small>Branch</small>
                  <strong>
                    {dialog.app.candidate?.branch || 'Not provided'}
                  </strong>
                </div>
                <div>
                  <small>CGPA</small>
                  <strong>
                    {dialog.app.candidate?.cgpa ?? 'Not provided'}
                  </strong>
                </div>
                <div>
                  <small>Skills</small>
                  <strong>
                    {dialog.app.candidate?.skills || 'Not provided'}
                  </strong>
                </div>
              </div>
            )}
            {!student && (
              <div className="ws-candidate-links">
                {dialog.app.candidate?.headline && (
                  <p>{dialog.app.candidate.headline}</p>
                )}
                {dialog.app.candidate?.phone && (
                  <p className="ws-muted">
                    Phone: {dialog.app.candidate.phone}
                  </p>
                )}
                {['github', 'linkedin'].map(
                  (key) =>
                    /^https?:\/\//i.test(dialog.app.candidate?.[key] || '') && (
                      <a
                        key={key}
                        href={dialog.app.candidate[key]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {key === 'github'
                          ? 'GitHub profile'
                          : 'LinkedIn profile'}{' '}
                        <Icon name="arrow" size={14} />
                      </a>
                    ),
                )}
              </div>
            )}
            <div className="ws-timeline">
              <article>
                <span />
                <div>
                  <time>{dateText(dialog.app.applied_date)}</time>
                  <h4>Application submitted</h4>
                  <p>
                    {dialog.app.company?.name} · {dialog.app.company?.position}
                  </p>
                </div>
              </article>
              {model.activity
                .filter((item) => sameId(item.applicationId, dialog.app.id))
                .slice()
                .reverse()
                .map((item) => (
                  <article key={item.id}>
                    <span />
                    <div>
                      <time>
                        {dateText(item.createdAt)} · {timeText(item.createdAt)}
                      </time>
                      <h4>{item.title}</h4>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                ))}
            </div>
            <p className="ws-device-note">
              Current stage:{' '}
              {applications.find((app) => sameId(app.id, dialog.app.id))
                ?.status || dialog.app.status}
              .
              {!demo &&
                ' Application and interview updates are saved in your CPMS account.'}
            </p>
          </div>
        </Dialog>
      )}
      {['withdraw', 'reject', 'cancel', 'reset', 'delete-company'].includes(
        dialog?.type,
      ) && (
        <Dialog
          title={
            dialog.type === 'withdraw'
              ? 'Withdraw this application?'
              : dialog.type === 'reject'
                ? 'Reject this candidate?'
                : dialog.type === 'reset'
                  ? 'Start the demo again?'
                  : dialog.type === 'delete-company'
                    ? 'Delete this company?'
                    : 'Remove this interview?'
          }
          onClose={() => setDialog(null)}
        >
          <div className="ws-confirm">
            <p>
              {dialog.type === 'reset'
                ? 'This replaces your sample applications, saved roles, schedules and profile edits with the starting demo data.'
                : dialog.type === 'withdraw'
                  ? `Your application for ${dialog.app.company?.position} at ${dialog.app.company?.name} will be withdrawn.`
                  : dialog.type === 'reject'
                    ? `${dialog.app.candidate?.name || 'This candidate'} will move to the Rejected stage.`
                    : dialog.type === 'delete-company'
                      ? `Delete ${dialog.drive.name} and its opportunity? Historical rejected applications linked to it will also be removed. Active applications prevent deletion.`
                      : 'This interview will be removed from the workspace calendar.'}
            </p>
            <div className="ws-dialog-actions">
              <button
                className="ws-button secondary"
                onClick={() => setDialog(null)}
              >
                Keep it
              </button>
              <button
                className="ws-button danger-button"
                disabled={Boolean(busy)}
                onClick={async () => {
                  let success = true;
                  if (dialog.type === 'reset') {
                    actions.resetDemo();
                    setCompareIds([]);
                    clearDriveFilters();
                    navigate('overview');
                  } else if (dialog.type === 'delete-company')
                    success = await actions.deleteCompany(dialog.drive);
                  else if (dialog.type === 'cancel')
                    success = await actions.cancelInterview(
                      dialog.interview.id,
                    );
                  else
                    success = await (dialog.type === 'withdraw'
                      ? actions.withdraw(dialog.app)
                      : actions.advance(dialog.app, 'Rejected'));
                  if (success) setDialog(null);
                }}
              >
                {busy
                  ? 'Working…'
                  : dialog.type === 'reset'
                    ? 'Reset demo'
                    : 'Confirm'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function PreparationChecklist() {
  const [checked, setChecked] = useState([]);
  const tasks = [
    'Review your resume and project explanations',
    'Practise a short introduction',
    'Solve three coding problems',
    'Prepare two questions for the interviewer',
  ];
  return (
    <div className="ws-checklist">
      {tasks.map((task, index) => (
        <label key={task}>
          <input
            type="checkbox"
            checked={checked.includes(index)}
            onChange={() =>
              setChecked((items) =>
                items.includes(index)
                  ? items.filter((item) => item !== index)
                  : [...items, index],
              )
            }
          />
          <span>{task}</span>
        </label>
      ))}
      <p className="ws-muted">
        {checked.length} of {tasks.length} complete this session
      </p>
    </div>
  );
}
