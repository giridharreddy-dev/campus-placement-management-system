import './env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db, { initDb } from './db.js';
import {
  authenticateToken,
  authorizeRole,
  JWT_SECRET,
} from './middleware/auth.js';
import workspaceRouter, {
  companyInput,
  persistCompanyDetails,
  transaction,
  notifyApplication,
} from './workspace.js';

const app = express();
const PORT = process.env.PORT || 5100;

app.use(express.json());
app.use(cookieParser());
app.use('/api/workspace', workspaceRouter(db));

// ==========================================
// 1. HEALTH & CONNECTIVITY
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.json({
      status: 'OK',
      database: 'Connected',
      solution: rows[0].solution,
    });
  } catch (error) {
    console.error('Health check database error:', error.message);
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// ==========================================
// 2. AUTHENTICATION API
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (
    !email ||
    typeof email !== 'string' ||
    !password ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      error: 'Email and password are required and must be valid strings.',
    });
  }

  try {
    const query = `
      SELECT u.id, u.email, u.password_hash, u.role, u.student_id, u.company_id,
             s.name AS student_name,
             c.name AS company_name
      FROM users u
      LEFT JOIN students s ON u.student_id = s.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.email = ?
    `;
    const [users] = await db.query(query, [email.trim()]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const displayName =
      user.role === 'STUDENT'
        ? user.student_name || 'Student'
        : user.role === 'RECRUITER'
          ? user.company_name
            ? `${user.company_name} Recruiter`
            : 'Recruiter'
          : 'System Administrator';

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      company_id: user.company_id,
      name: displayName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Set secure HttpOnly cookie for browser sessions
    res.cookie('cpms_angular_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      message: 'Login successful',
      token,
      user: tokenPayload,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res
      .status(500)
      .json({ error: 'Internal server error during authentication.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('cpms_angular_token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 3. STATS API
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const [companyCountRows] = await db.query(
      'SELECT COUNT(*) AS totalCompanies FROM companies',
    );
    const [appCountRows] = await db.query(
      'SELECT COUNT(*) AS totalApplications FROM applications',
    );
    const [shortlistedRows] = await db.query(
      "SELECT COUNT(*) AS shortlisted FROM applications WHERE status = 'Shortlisted'",
    );
    const [offersRows] = await db.query(
      "SELECT COUNT(*) AS offers FROM applications WHERE status IN ('Offered', 'Selected')",
    );

    res.json({
      totalCompanies: companyCountRows[0].totalCompanies,
      totalApplications: appCountRows[0].totalApplications,
      shortlisted: shortlistedRows[0].shortlisted,
      offers: offersRows[0].offers,
    });
  } catch (error) {
    console.error('Failed to retrieve statistics:', error.message);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// ==========================================
// 4. COMPANIES API
// ==========================================
app.get('/api/companies', async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.name, c.position, c.salary, c.ctc, c.location, c.openings,
      (c.base_applicants + COUNT(a.id)) AS applicants
      FROM companies c
      LEFT JOIN applications a ON c.id = a.company_id
      GROUP BY c.id
    `;
    const [companies] = await db.query(query);
    res.json(companies);
  } catch (error) {
    console.error('Failed to retrieve companies:', error.message);
    res.status(500).json({ error: 'Failed to retrieve companies' });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Company not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Failed to retrieve company:', error.message);
    res.status(500).json({ error: 'Failed to retrieve company' });
  }
});

// Admin-only company management
app.post(
  '/api/companies',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const values = companyInput(req.body);
      const result = await transaction(db, async (connection) => {
        const [saved] = await connection.execute(
          'INSERT INTO companies (name, position, salary, ctc, location, openings, base_applicants) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            values.name,
            values.position,
            values.salary,
            values.ctc,
            values.location,
            values.openings,
            values.baseApplicants,
          ],
        );
        await persistCompanyDetails(connection, saved.insertId, values.details);
        return saved;
      });
      res.status(201).json({ message: 'Company created', id: result.insertId });
    } catch (error) {
      if (error.status)
        return res.status(error.status).json({ error: error.message });
      console.error('Failed to create company:', error.message);
      res.status(500).json({ error: 'Failed to create company' });
    }
  },
);

app.put(
  '/api/companies/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const values = companyInput(req.body);
      const result = await transaction(db, async (connection) => {
        const [saved] = await connection.execute(
          'UPDATE companies SET name=?, position=?, salary=?, ctc=?, location=?, openings=? WHERE id=?',
          [
            values.name,
            values.position,
            values.salary,
            values.ctc,
            values.location,
            values.openings,
            req.params.id,
          ],
        );
        if (saved.affectedRows)
          await persistCompanyDetails(
            connection,
            req.params.id,
            values.details,
          );
        return saved;
      });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Company not found' });
      res.json({ message: 'Company updated successfully' });
    } catch (error) {
      if (error.status)
        return res.status(error.status).json({ error: error.message });
      console.error('Failed to update company:', error.message);
      res.status(500).json({ error: 'Failed to update company' });
    }
  },
);

app.delete(
  '/api/companies/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM companies WHERE id=?', [
        req.params.id,
      ]);
      if (rows.length === 0)
        return res.status(404).json({ error: 'Company not found' });

      // Check if company has active applicants (Applied, Shortlisted, Interview, Selected, Offered)
      const [activeApps] = await db.query(
        "SELECT COUNT(*) AS activeCount FROM applications WHERE company_id = ? AND status IN ('Applied', 'Shortlisted', 'Interview', 'Selected', 'Offered')",
        [req.params.id],
      );
      if (activeApps[0]?.activeCount > 0) {
        return res.status(409).json({
          error: `Cannot delete company with ${activeApps[0].activeCount} active applicant(s). Active applications must be resolved or withdrawn before deletion.`,
        });
      }

      // Clean up historical/rejected applications within a transaction so ON DELETE RESTRICT is satisfied without leaving orphaned records
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          "DELETE FROM applications WHERE company_id = ? AND status = 'Rejected'",
          [req.params.id],
        );
        const [result] = await connection.query(
          'DELETE FROM companies WHERE id=?',
          [req.params.id],
        );
        await connection.commit();

        if (result.affectedRows === 0)
          return res.status(404).json({ error: 'Company not found' });
        res.json({ message: 'Company deleted successfully' });
      } catch (txErr) {
        await connection.rollback();
        throw txErr;
      } finally {
        connection.release();
      }
    } catch (error) {
      if (error.errno === 1451) {
        return res
          .status(409)
          .json({ error: 'Cannot delete company with existing applications' });
      }
      console.error('Failed to delete company:', error.message);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  },
);

// ==========================================
// 5. STUDENTS API (Privacy & Ownership Enforced)
// ==========================================
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  // Validate permitted roles
  if (!['STUDENT', 'RECRUITER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: Unauthorized role.' });
  }

  // Students can only view their own profile
  if (
    req.user.role === 'STUDENT' &&
    (!req.user.student_id || req.user.student_id !== req.params.id)
  ) {
    return res.status(403).json({
      error: "Access denied: Cannot access another student's profile.",
    });
  }

  // Recruiters must be associated with a valid company
  if (req.user.role === 'RECRUITER' && !req.user.company_id) {
    return res.status(403).json({
      error:
        'Access denied: Recruiter account is not associated with a company.',
    });
  }

  try {
    // Recruiters can only view profiles of students who applied to their company
    if (req.user.role === 'RECRUITER') {
      const [appRows] = await db.query(
        'SELECT id FROM applications WHERE student_id = ? AND company_id = ?',
        [req.params.id, req.user.company_id],
      );
      if (appRows.length === 0) {
        return res.status(403).json({
          error: 'Access denied: Candidate has not applied to your company.',
        });
      }
    }

    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });
    const student = rows[0];
    const skills = student.skills
      ? student.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : ['Java', 'React', 'Node.js', 'SQL'];
    res.json({ ...student, skills });
  } catch (error) {
    console.error('Failed to retrieve student:', error.message);
    res.status(500).json({ error: 'Failed to retrieve student profile' });
  }
});

app.get(
  '/api/students/:id/applications',
  authenticateToken,
  async (req, res) => {
    // Only the student themselves or an Admin can access student application records
    if (req.user.role !== 'ADMIN' && req.user.student_id !== req.params.id) {
      return res
        .status(403)
        .json({ error: 'Access denied: Cannot access student applications.' });
    }

    try {
      const [applications] = await db.query(
        'SELECT company_id FROM applications WHERE student_id = ?',
        [req.params.id],
      );
      const appliedCompanyIds = applications.map((app) => app.company_id);
      res.json(appliedCompanyIds);
    } catch (error) {
      console.error('Failed to retrieve student applications:', error.message);
      res
        .status(500)
        .json({ error: 'Failed to retrieve student applications' });
    }
  },
);

app.get(
  '/api/students/:id/applications/details',
  authenticateToken,
  async (req, res) => {
    // Only the student themselves or an Admin can access student application details
    if (req.user.role !== 'ADMIN' && req.user.student_id !== req.params.id) {
      return res
        .status(403)
        .json({ error: 'Access denied: Cannot access student applications.' });
    }

    try {
      const query = `
      SELECT a.id, a.student_id, a.company_id, a.status, a.applied_date,
             c.name AS company_name, c.position, c.salary, c.ctc, c.location
      FROM applications a
      JOIN companies c ON a.company_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.applied_date DESC
    `;
      const [rows] = await db.query(query, [req.params.id]);
      res.json(rows);
    } catch (error) {
      console.error(
        'Failed to retrieve student application details:',
        error.message,
      );
      res.status(500).json({ error: 'Failed to retrieve application details' });
    }
  },
);

// ==========================================
// 6. APPLICATIONS API (Role & Ownership Enforced)
// ==========================================

// Recruiter & Admin applications overview
app.get(
  '/api/applications',
  authenticateToken,
  authorizeRole('ADMIN', 'RECRUITER'),
  async (req, res) => {
    try {
      let query = `
      SELECT a.id, a.student_id, a.company_id, a.status, a.applied_date,
             c.name AS company_name, c.position, s.name AS student_name,
             s.email AS student_email, s.branch AS student_branch, s.cgpa AS student_cgpa
      FROM applications a
      JOIN companies c ON a.company_id = c.id
      JOIN students s ON a.student_id = s.id
    `;
      const params = [];

      // Recruiter scoping: only view applications for their associated company
      if (req.user.role === 'RECRUITER') {
        if (!req.user.company_id) {
          return res.status(403).json({
            error:
              'Access denied: Recruiter account is not associated with a company.',
          });
        }
        query += ` WHERE a.company_id = ?`;
        params.push(req.user.company_id);
      }

      query += ` ORDER BY a.applied_date DESC`;

      const [applications] = await db.query(query, params);
      res.json(applications);
    } catch (error) {
      console.error('Failed to retrieve applications:', error.message);
      res.status(500).json({ error: 'Failed to retrieve applications' });
    }
  },
);

// Dedicated Recruiter applications endpoint
app.get(
  '/api/recruiter/applications',
  authenticateToken,
  authorizeRole('RECRUITER', 'ADMIN'),
  async (req, res) => {
    try {
      let query = `
      SELECT a.id, a.student_id, a.company_id, a.status, a.applied_date,
             c.name AS company_name, c.position, c.location,
             s.name AS student_name, s.email AS student_email,
             s.branch AS student_branch, s.cgpa AS student_cgpa, s.skills AS student_skills
      FROM applications a
      JOIN companies c ON a.company_id = c.id
      JOIN students s ON a.student_id = s.id
    `;
      const params = [];

      if (req.user.role === 'RECRUITER') {
        if (!req.user.company_id) {
          return res.status(403).json({
            error:
              'Access denied: Recruiter account is not associated with a company.',
          });
        }
        query += ` WHERE a.company_id = ?`;
        params.push(req.user.company_id);
      }

      query += ` ORDER BY a.applied_date DESC`;

      const [applications] = await db.query(query, params);
      res.json(applications);
    } catch (error) {
      console.error(
        'Failed to retrieve recruiter applications:',
        error.message,
      );
      res.status(500).json({ error: 'Failed to retrieve applications' });
    }
  },
);

// Student application submission
app.post(
  '/api/applications',
  authenticateToken,
  authorizeRole('STUDENT'),
  async (req, res) => {
    const { companyId, studentId: requestedStudentId } = req.body || {};

    // Never trust client-supplied student ID: enforce ownership boundary
    if (requestedStudentId && requestedStudentId !== req.user.student_id) {
      return res.status(403).json({
        error:
          'Access denied: You cannot submit applications on behalf of another student.',
      });
    }

    const effectiveStudentId = req.user.student_id;
    if (!effectiveStudentId) {
      return res
        .status(400)
        .json({ error: 'Student account is not linked to a student profile.' });
    }

    const numCompanyId = Number(companyId);
    if (!companyId || isNaN(numCompanyId) || numCompanyId <= 0) {
      return res.status(400).json({ error: 'Valid company ID is required.' });
    }

    try {
      const result = await transaction(db, async (connection) => {
        const [saved] = await connection.execute(
          'INSERT INTO applications (student_id, company_id, status) VALUES (?, ?, ?)',
          [effectiveStudentId, numCompanyId, 'Applied'],
        );
        await notifyApplication(
          connection,
          {
            id: saved.insertId,
            student_id: effectiveStudentId,
            company_id: numCompanyId,
          },
          'New placement application',
          `${effectiveStudentId} submitted application #${saved.insertId}.`,
        );
        return saved;
      });
      res.status(201).json({
        message: 'Application submitted successfully',
        id: result.insertId,
      });
    } catch (error) {
      if (error.errno === 1062) {
        return res
          .status(409)
          .json({ error: 'You have already applied to this company.' });
      }
      if (error.errno === 1452) {
        return res
          .status(400)
          .json({ error: 'Invalid student or company ID.' });
      }
      console.error('Failed to submit application:', error.message);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  },
);

// Application withdrawal (DELETE): Student (must own application) or Admin
app.delete(
  '/api/applications/:id',
  authenticateToken,
  authorizeRole('STUDENT', 'ADMIN'),
  async (req, res) => {
    const appId = req.params.id;

    try {
      const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [
        appId,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const application = rows[0];

      // Students can only withdraw their own applications
      if (
        req.user.role === 'STUDENT' &&
        application.student_id !== req.user.student_id
      ) {
        return res.status(403).json({
          error: 'Access denied: You can only withdraw your own applications.',
        });
      }

      await transaction(db, async (connection) => {
        await notifyApplication(
          connection,
          application,
          'Application withdrawn',
          `Application #${appId} was withdrawn. Any linked interviews were removed.`,
        );
        await connection.execute('DELETE FROM applications WHERE id = ?', [
          appId,
        ]);
      });
      res.json({
        message: 'Application withdrawn successfully',
        id: Number(appId),
      });
    } catch (error) {
      console.error('Failed to withdraw application:', error.message);
      res.status(500).json({ error: 'Failed to withdraw application' });
    }
  },
);

// Status transition rules:
// Recruiter: strict sequential progression: Applied -> Shortlisted -> Interview -> Selected -> Offered
// Any active stage can transition to Rejected.
// Recruiter cannot reopen Rejected.
const ALLOWED_RECRUITER_TRANSITIONS = {
  Applied: ['Shortlisted', 'Rejected'],
  Shortlisted: ['Interview', 'Rejected'],
  Interview: ['Selected', 'Rejected'],
  Selected: ['Offered', 'Rejected'],
  Offered: ['Rejected'],
  Rejected: [],
};

const ALL_VALID_STATUSES = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offered',
  'Rejected',
];

// Application status update: Recruiter (scoped to company) or Admin
app.patch(
  '/api/applications/:id/status',
  authenticateToken,
  authorizeRole('RECRUITER', 'ADMIN'),
  async (req, res) => {
    const { status } = req.body || {};

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        error: 'Status is required and must be a valid string.',
      });
    }

    const targetStatus = status.trim();

    // Disallow transitioning back to Applied for all roles
    if (targetStatus === 'Applied') {
      return res.status(400).json({
        error:
          "Transitioning status back to 'Applied' is not permitted. 'Applied' is the initial state assigned upon application submission.",
      });
    }

    const allowedStatuses = [
      'Shortlisted',
      'Interview',
      'Selected',
      'Offered',
      'Rejected',
    ];

    if (!allowedStatuses.includes(targetStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    try {
      const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [
        req.params.id,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const application = rows[0];
      const currentStatus = application.status;

      // Validate current status against known valid domain statuses
      if (!ALL_VALID_STATUSES.includes(currentStatus)) {
        return res.status(400).json({
          error: `Cannot transition application #${req.params.id} with unrecognized current status '${currentStatus}'.`,
        });
      }

      // Current and target status validation: transition to the exact same status is rejected
      if (currentStatus === targetStatus) {
        return res.status(400).json({
          error: `Application #${req.params.id} is already in '${targetStatus}' status. Transition must target a different stage.`,
        });
      }

      // Recruiter scoping & sequential progression checks
      if (req.user.role === 'RECRUITER') {
        if (
          !req.user.company_id ||
          Number(application.company_id) !== Number(req.user.company_id)
        ) {
          return res.status(403).json({
            error:
              'Access denied: You can only update applications for your assigned company.',
          });
        }

        const allowedNext = ALLOWED_RECRUITER_TRANSITIONS[currentStatus] || [];
        if (!allowedNext.includes(targetStatus)) {
          return res.status(400).json({
            error: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Recruiters must advance candidates sequentially and cannot reopen rejected applications.`,
          });
        }
      }

      // Admin role can override between active stages and reopen Rejected, but cannot transition to Applied (checked above)

      await transaction(db, async (connection) => {
        const [updated] = await connection.execute(
          'UPDATE applications SET status = ? WHERE id = ? AND status = ?',
          [targetStatus, req.params.id, currentStatus],
        );
        if (!updated.affectedRows)
          throw Object.assign(
            new Error(
              'This application changed in another session. Refresh and try again.',
            ),
            { status: 409 },
          );
        await notifyApplication(
          connection,
          application,
          `Application moved to ${targetStatus}`,
          `Application #${application.id}: ${currentStatus} → ${targetStatus}.`,
        );
      });
      res.json({
        message: 'Application status updated successfully',
        id: Number(req.params.id),
        status: targetStatus,
      });
    } catch (error) {
      if (error.status)
        return res.status(error.status).json({ error: error.message });
      console.error('Failed to update application status:', error.message);
      res.status(500).json({ error: 'Failed to update application status' });
    }
  },
);

const server = app.listen(PORT, async () => {
  console.log(
    `Backend API server running at http://localhost:${server.address().port}`,
  );
  await initDb().catch((err) =>
    console.warn('Database initialization note:', err.message),
  );
});

export default app;
