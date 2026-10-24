import { useState } from 'react';
import Dialog from './Dialog';
import { dateAfter } from './demo-data';

export function DriveForm({ drive, onClose, onSave, busy, demo }) {
  const [values, setValues] = useState(() => ({
    name: drive?.name || '',
    position: drive?.position || '',
    location: drive?.location || '',
    ctc: drive?.ctc || '',
    salary: drive?.salary || '',
    openings: drive?.openings ?? 5,
    workMode: drive?.workMode || 'Hybrid',
    deadline: drive?.deadline || '',
    skills: drive?.tags?.join(', ') || '',
    description: drive?.description || '',
  }));
  const field = (key) => ({
    value: values[key],
    onChange: (event) =>
      setValues((data) => ({ ...data, [key]: event.target.value })),
  });
  return (
    <Dialog
      title={drive ? 'Edit opportunity' : 'Publish an opportunity'}
      onClose={onClose}
      wide
    >
      <form
        className="ws-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (await onSave(values, drive?.id)) onClose();
        }}
      >
        <div className="ws-form-grid">
          <label>
            Company name
            <input
              required
              maxLength={100}
              {...field('name')}
              placeholder="e.g. TechCorp"
            />
          </label>
          <label>
            Job title
            <input
              required
              maxLength={100}
              {...field('position')}
              placeholder="e.g. Software Engineer"
            />
          </label>
          <label>
            Location
            <input
              required
              maxLength={100}
              {...field('location')}
              placeholder="e.g. Hyderabad"
            />
          </label>
          <label>
            Compensation
            <input
              required
              maxLength={50}
              {...field('ctc')}
              placeholder="e.g. 10.5 LPA"
            />
          </label>
          <label>
            Base salary (optional)
            <input
              maxLength={50}
              {...field('salary')}
              placeholder="e.g. 8.0 LPA"
            />
          </label>
          <label>
            Open positions
            <input
              type="number"
              required
              min="0"
              max="10000"
              {...field('openings')}
            />
          </label>
          <label>
            Work arrangement
            <select {...field('workMode')}>
              <option>Hybrid</option>
              <option>On-site</option>
              <option>Remote</option>
            </select>
          </label>
          <label>
            Application deadline
            <input
              type="date"
              min={dateAfter(0).slice(0, 10)}
              {...field('deadline')}
            />
          </label>
          <label>
            Skills
            <input
              maxLength={200}
              {...field('skills')}
              placeholder="React, JavaScript, SQL"
            />
          </label>
        </div>
        <label>
          About the role
          <textarea
            rows="4"
            maxLength={2000}
            {...field('description')}
            placeholder="Describe the team, responsibilities and selection process."
          />
        </label>
        {!demo && (
          <p className="ws-device-note">
            Company, job description, skills and deadline are saved to CPMS and
            shared with students.
          </p>
        )}
        <div className="ws-dialog-actions">
          <button
            type="button"
            className="ws-button secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="ws-button" disabled={Boolean(busy)}>
            {busy ? 'Saving…' : drive ? 'Save changes' : 'Publish opportunity'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function ScheduleForm({
  applications,
  onClose,
  onSave,
  busy,
  selected,
  demo,
  role,
}) {
  const [values, setValues] = useState({
    applicationId: selected?.id || applications[0]?.id || '',
    title: 'Technical interview',
    at: dateAfter(1, 11),
    venue: '',
    duration: '45 minutes',
  });
  const field = (key) => ({
    value: values[key],
    onChange: (event) =>
      setValues((data) => ({ ...data, [key]: event.target.value })),
  });
  return (
    <Dialog
      title={
        role === 'STUDENT'
          ? 'Add to your personal schedule'
          : 'Schedule an interview'
      }
      onClose={onClose}
    >
      <form
        className="ws-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (await onSave(values)) onClose();
        }}
      >
        <label>
          Application
          <select required {...field('applicationId')}>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.candidate?.name || 'You'} · {app.company?.name} ·{' '}
                {app.company?.position}
              </option>
            ))}
          </select>
        </label>
        <label>
          Round name
          <input required maxLength={100} {...field('title')} />
        </label>
        <label>
          Date and time
          <input
            type="datetime-local"
            required
            min={dateAfter(0)}
            {...field('at')}
          />
        </label>
        <label>
          Venue or meeting link
          <input
            required
            maxLength={300}
            {...field('venue')}
            placeholder="Placement cell, Room 204"
          />
        </label>
        <label>
          Duration
          <select {...field('duration')}>
            <option>30 minutes</option>
            <option>45 minutes</option>
            <option>60 minutes</option>
            <option>90 minutes</option>
          </select>
        </label>
        {!demo && (
          <p className="ws-device-note">
            {role === 'STUDENT'
              ? 'This personal entry is saved to your CPMS account. Only you can see it.'
              : 'This interview is saved to CPMS and appears for the candidate and responsible staff. An in-app notification is created; no email is sent.'}
          </p>
        )}
        <div className="ws-dialog-actions">
          <button
            type="button"
            className="ws-button secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="ws-button"
            disabled={Boolean(busy) || !applications.length}
          >
            {busy ? 'Saving…' : 'Save interview'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function ProfileForm({ profile, onSave, demo, busy }) {
  const [values, setValues] = useState(() => ({
    name: profile.name || '',
    headline: profile.headline || '',
    phone: profile.phone || '',
    skills: profile.skills || '',
    github: profile.github || '',
    linkedin: profile.linkedin || '',
  }));
  const field = (key) => ({
    value: values[key],
    onChange: (event) =>
      setValues((data) => ({ ...data, [key]: event.target.value })),
  });
  return (
    <form
      className="ws-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
    >
      <div className="ws-form-grid">
        <label>
          Full name
          <input required maxLength={100} {...field('name')} />
        </label>
        <label>
          Career headline
          <input
            maxLength={120}
            {...field('headline')}
            placeholder="Full stack developer · Class of 2027"
          />
        </label>
        <label>
          Phone
          <input type="tel" maxLength={20} {...field('phone')} />
        </label>
        <label>
          Skills
          <input
            maxLength={255}
            {...field('skills')}
            placeholder="React, JavaScript, MySQL"
          />
        </label>
        <label>
          GitHub profile
          <input
            type="url"
            maxLength={300}
            {...field('github')}
            placeholder="https://github.com/your-name"
          />
        </label>
        <label>
          LinkedIn profile
          <input
            type="url"
            maxLength={300}
            {...field('linkedin')}
            placeholder="https://linkedin.com/in/your-name"
          />
        </label>
      </div>
      <p className="ws-device-note">
        {demo
          ? 'Career details are saved in this browser demo.'
          : 'Career details are saved to your CPMS account and visible to authorized recruiters. Your college email and academic record are managed by the placement office.'}
      </p>
      <button className="ws-button" disabled={Boolean(busy)}>
        {busy ? 'Saving…' : 'Save career profile'}
      </button>
    </form>
  );
}
