import { Router } from 'express';
import { authenticateToken, authorizeRole } from './middleware/auth.js';

export const fail = (status, message) =>
  Object.assign(new Error(message), { status });
function text(value, name, maximum, required = false) {
  if (value === undefined || value === null) value = '';
  if (
    typeof value !== 'string' ||
    value.trim().length > maximum ||
    (required && !value.trim())
  )
    throw fail(
      400,
      `${name} ${required ? 'is required and ' : ''}must be text of at most ${maximum} characters.`,
    );
  return value.trim();
}
function id(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1)
    throw fail(400, 'Use a valid positive record ID.');
  return number;
}
function url(value, name) {
  const result = text(value, name, 300);
  if (result) {
    let parsed;
    try {
      parsed = new URL(result);
    } catch {
      throw fail(400, `${name} must be a valid https:// or http:// URL.`);
    }
    if (
      !['https:', 'http:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      throw fail(400, `${name} must be a valid https:// or http:// URL.`);
  }
  return result;
}

export function companyInput(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw fail(400, 'Use a JSON object for company details.');
  const fields = {
    name: text(body.name, 'Company name', 100, true),
    position: text(body.position, 'Job title', 100, true),
    salary: text(body.salary, 'Salary', 50),
    ctc: text(body.ctc, 'Compensation', 50),
    location: text(body.location, 'Location', 100),
    openings: Number(body.openings ?? 0),
    baseApplicants: Number(body.base_applicants ?? 0),
  };
  if (
    ![fields.openings, fields.baseApplicants].every(
      (value) => Number.isSafeInteger(value) && value >= 0 && value <= 100000,
    )
  )
    throw fail(
      400,
      'Openings and base applicants must be whole numbers from 0 to 100000.',
    );
  let details;
  if (
    ['workMode', 'deadline', 'skills', 'tags', 'description'].some((key) =>
      Object.hasOwn(body, key),
    )
  ) {
    const workMode = text(body.workMode, 'Work arrangement', 20);
    if (!['', 'Hybrid', 'On-site', 'Remote'].includes(workMode))
      throw fail(400, 'Choose Hybrid, On-site or Remote.');
    const deadline = text(body.deadline, 'Deadline', 10);
    if (
      deadline &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
        Number.isNaN(new Date(deadline).getTime()) ||
        new Date(deadline).toISOString().slice(0, 10) !== deadline)
    )
      throw fail(400, 'Use a valid deadline date.');
    const skills =
      body.tags === undefined
        ? text(body.skills, 'Skills', 255).split(',')
        : body.tags;
    if (!Array.isArray(skills) || skills.length > 30)
      throw fail(400, 'Use at most 30 skill tags.');
    const tags = [
      ...new Set(
        skills.map((item) => text(item, 'Skill tag', 80)).filter(Boolean),
      ),
    ];
    details = {
      workMode,
      deadline: deadline || null,
      tags,
      description: text(body.description, 'Description', 2000),
    };
  }
  return { ...fields, details };
}

export async function persistCompanyDetails(connection, companyId, details) {
  if (!details) return;
  await connection.execute(
    `INSERT INTO company_details (company_id, work_mode, deadline, tags, description)
    VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE work_mode=VALUES(work_mode), deadline=VALUES(deadline), tags=VALUES(tags), description=VALUES(description)`,
    [
      companyId,
      details.workMode,
      details.deadline,
      JSON.stringify(details.tags),
      details.description,
    ],
  );
}

export async function transaction(pool, action) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function notifyApplication(
  connection,
  application,
  title,
  detail,
) {
  await connection.execute(
    `INSERT INTO workspace_notifications (user_id, application_id, title, detail)
    SELECT id, ?, ?, ? FROM users WHERE role='ADMIN'
    OR (role='RECRUITER' AND company_id=?) OR (role='STUDENT' AND student_id=?)`,
    [
      application.id,
      title,
      detail,
      application.company_id,
      application.student_id,
    ],
  );
}

export default function workspaceRouter(pool) {
  const router = Router();
  router.use(authenticateToken, authorizeRole('STUDENT', 'RECRUITER', 'ADMIN'));
  router.use((req, res, next) => {
    if (req.user.role === 'STUDENT' && !req.user.student_id)
      return res
        .status(403)
        .json({ error: 'Your account needs a linked student profile.' });
    if (req.user.role === 'RECRUITER' && !req.user.company_id)
      return res
        .status(403)
        .json({ error: 'Your account needs an assigned company.' });
    next();
  });
  const handle = (action) => async (req, res, next) => {
    try {
      await action(req, res);
    } catch (error) {
      next(error);
    }
  };
  const scope = (user, alias = 'a') =>
    user.role === 'STUDENT'
      ? { sql: `${alias}.student_id = ?`, values: [user.student_id] }
      : user.role === 'RECRUITER'
        ? { sql: `${alias}.company_id = ?`, values: [user.company_id] }
        : { sql: '1=1', values: [] };

  router.get(
    '/',
    handle(async (req, res) => {
      const filter = scope(req.user);
      const [interviews] = await pool.execute(
        `SELECT i.id, i.application_id AS applicationId, i.created_by AS createdBy, i.kind, i.title,
      DATE_FORMAT(i.scheduled_at, '%Y-%m-%dT%H:%i:%s.000Z') AS at, i.venue, i.duration,
      a.company_id AS companyId, a.student_id AS studentId
      FROM interviews i JOIN applications a ON a.id=i.application_id WHERE ${filter.sql}
      AND (i.kind='official' OR i.created_by=?) ORDER BY i.scheduled_at`,
        [...filter.values, req.user.id],
      );
      const [notices] = await pool.execute(
        `SELECT id, application_id AS applicationId, title, detail, is_read AS \`read\`, created_at AS createdAt
      FROM workspace_notifications WHERE user_id=? ORDER BY id DESC LIMIT 200`,
        [req.user.id],
      );
      const profileFilter =
        req.user.role === 'STUDENT'
          ? 's.id=?'
          : req.user.role === 'RECRUITER'
            ? 'EXISTS (SELECT 1 FROM applications a WHERE a.student_id=s.id AND a.company_id=?)'
            : '1=1';
      const profileValues =
        req.user.role === 'STUDENT'
          ? [req.user.student_id]
          : req.user.role === 'RECRUITER'
            ? [req.user.company_id]
            : [];
      const [profiles] = await pool.execute(
        `SELECT s.id, s.name, s.email, s.phone, s.branch, s.cgpa, s.skills, (p.student_id IS NOT NULL) AS hasCareerProfile,
      COALESCE(p.headline,'') AS headline, COALESCE(p.github,'') AS github, COALESCE(p.linkedin,'') AS linkedin
      FROM students s LEFT JOIN career_profiles p ON p.student_id=s.id WHERE ${profileFilter}`,
        profileValues,
      );
      const [details] =
        await pool.query(`SELECT company_id AS id, work_mode AS workMode,
      DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline, tags, description FROM company_details`);
      res.json({
        interviews: interviews.map((item) => ({
          ...item,
          canCancel: req.user.role !== 'STUDENT' || item.kind === 'personal',
        })),
        notices: notices.map((item) => ({ ...item, read: Boolean(item.read) })),
        profiles,
        driveDetails: Object.fromEntries(
          details.map(({ id, tags, ...detail }) => [
            id,
            { ...detail, tags: JSON.parse(tags) },
          ]),
        ),
      });
    }),
  );

  router.put(
    '/profile',
    authorizeRole('STUDENT'),
    handle(async (req, res) => {
      const body = req.body || {};
      const profile = {
        name: text(body.name, 'Name', 100, true),
        phone: text(body.phone, 'Phone', 20),
        skills: text(body.skills, 'Skills', 255),
        headline: text(body.headline, 'Headline', 120),
        github: url(body.github, 'GitHub profile'),
        linkedin: url(body.linkedin, 'LinkedIn profile'),
      };
      await transaction(pool, async (connection) => {
        const [result] = await connection.execute(
          'UPDATE students SET name=?, phone=?, skills=? WHERE id=?',
          [profile.name, profile.phone, profile.skills, req.user.student_id],
        );
        if (!result.affectedRows) throw fail(404, 'Student profile not found.');
        await connection.execute(
          `INSERT INTO career_profiles (student_id, headline, github, linkedin) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE headline=VALUES(headline), github=VALUES(github), linkedin=VALUES(linkedin)`,
          [
            req.user.student_id,
            profile.headline,
            profile.github,
            profile.linkedin,
          ],
        );
      });
      res.json({ message: 'Career profile saved to CPMS.', profile });
    }),
  );

  router.post(
    '/interviews',
    handle(async (req, res) => {
      const body = req.body || {};
      const applicationId = id(body.applicationId);
      const title = text(body.title, 'Round name', 100, true);
      const venue = text(body.venue, 'Venue', 300, true);
      const duration = text(body.duration, 'Duration', 20, true);
      if (
        !['30 minutes', '45 minutes', '60 minutes', '90 minutes'].includes(
          duration,
        )
      )
        throw fail(400, 'Choose a supported interview duration.');
      const at = new Date(body.at);
      if (
        typeof body.at !== 'string' ||
        !body.at.endsWith('Z') ||
        Number.isNaN(at.getTime()) ||
        at <= new Date()
      )
        throw fail(400, 'Choose a future interview date and time.');
      const result = await transaction(pool, async (connection) => {
        const [rows] = await connection.execute(
          'SELECT * FROM applications WHERE id=? FOR UPDATE',
          [applicationId],
        );
        const application = rows[0];
        if (!application) throw fail(404, 'Application not found.');
        if (
          (req.user.role === 'STUDENT' &&
            application.student_id !== req.user.student_id) ||
          (req.user.role === 'RECRUITER' &&
            Number(application.company_id) !== Number(req.user.company_id))
        )
          throw fail(403, 'You cannot schedule for this application.');
        if (['Rejected', 'Withdrawn'].includes(application.status))
          throw fail(
            409,
            'Only active applications can have interviews scheduled.',
          );
        const kind = req.user.role === 'STUDENT' ? 'personal' : 'official';
        const [saved] = await connection.execute(
          `INSERT INTO interviews (application_id, created_by, kind, title, scheduled_at, venue, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            applicationId,
            req.user.id,
            kind,
            title,
            at.toISOString().slice(0, 19).replace('T', ' '),
            venue,
            duration,
          ],
        );
        const detail = `${at.toISOString()} · ${venue} · ${duration}`;
        if (kind === 'official')
          await notifyApplication(
            connection,
            application,
            `${title} scheduled`,
            detail,
          );
        else
          await connection.execute(
            'INSERT INTO workspace_notifications (user_id, application_id, title, detail) VALUES (?, ?, ?, ?)',
            [
              req.user.id,
              applicationId,
              `${title} added to your personal schedule`,
              detail,
            ],
          );
        return saved;
      });
      res
        .status(201)
        .json({ id: result.insertId, message: 'Interview saved.' });
    }),
  );

  router.delete(
    '/interviews/:id',
    handle(async (req, res) => {
      await transaction(pool, async (connection) => {
        const [rows] = await connection.execute(
          `SELECT i.*, a.student_id, a.company_id FROM interviews i
        JOIN applications a ON a.id=i.application_id WHERE i.id=? FOR UPDATE`,
          [id(req.params.id)],
        );
        const item = rows[0];
        if (!item) throw fail(404, 'Interview not found.');
        const allowed =
          item.kind === 'personal'
            ? Number(item.created_by) === Number(req.user.id)
            : req.user.role === 'ADMIN' ||
              (req.user.role === 'RECRUITER' &&
                Number(item.company_id) === Number(req.user.company_id));
        if (!allowed)
          throw fail(
            403,
            'Only the responsible staff can cancel an official interview; personal entries belong to their creator.',
          );
        await connection.execute('DELETE FROM interviews WHERE id=?', [
          item.id,
        ]);
        if (item.kind === 'official')
          await notifyApplication(
            connection,
            { ...item, id: item.application_id },
            `${item.title} cancelled`,
            'The placement interview was removed from the shared calendar.',
          );
      });
      res.json({ message: 'Interview removed.' });
    }),
  );

  router.patch(
    '/notifications/read',
    handle(async (req, res) => {
      const noticeId = req.body?.id;
      const [result] = await pool.execute(
        `UPDATE workspace_notifications SET is_read=TRUE WHERE user_id=?${noticeId === undefined ? '' : ' AND id=?'}`,
        noticeId === undefined ? [req.user.id] : [req.user.id, id(noticeId)],
      );
      if (noticeId !== undefined && !result.affectedRows)
        throw fail(404, 'Notification not found.');
      res.json({ message: 'Notifications updated.' });
    }),
  );

  router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const missing = error.code === 'ER_NO_SUCH_TABLE';
    res.status(error.status || 503).json({
      error: error.status
        ? error.message
        : missing
          ? 'Workspace tables are not ready. Run npm run db:workspace inside src/CPMS-React, then refresh.'
          : 'The workspace could not be saved or loaded. Check the API and database connection.',
    });
  });
  return router;
}
