import { createApplicationModel } from '../models/applications.mjs';

export function createApplicationController() {
  const model = createApplicationModel();
  function id(req) { return /^[1-9]\d*$/.test(req.params.id) ? Number(req.params.id) : NaN; }
  function validate(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const { studentName, company, status = 'Applied' } = body;
    if (![studentName, company].every((value) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 100)) return null;
    if (!['Applied', 'Shortlisted', 'Interview', 'Selected', 'Offered', 'Rejected'].includes(status)) return null;
    return { studentName: studentName.trim(), company: company.trim(), status };
  }
  return {
    list(req, res) { res.json(model.list()); },
    read(req, res) { const row = model.find(id(req)); if (!row) return res.status(404).json({ error: 'Application not found' }); res.json(row); },
    create(req, res) {
      const data = validate(req.body);
      if (!data) return res.status(400).json({ error: 'Provide studentName, company (1–100 characters) and a valid status' });
      res.status(201).json(model.create(data));
    },
    update(req, res) {
      if (!model.find(id(req))) return res.status(404).json({ error: 'Application not found' });
      const data = validate(req.body);
      if (!data) return res.status(400).json({ error: 'Provide studentName, company and a valid status' });
      res.json(model.update(id(req), data));
    },
    remove(req, res) {
      if (!model.remove(id(req))) return res.status(404).json({ error: 'Application not found' });
      res.json({ message: 'Practice application deleted' });
    },
  };
}
