import { useEffect, useState } from 'react';

const API = 'http://127.0.0.1:5020';
function StudentProfile({ student }) {
  return (
    <p>
      {student.name} · CGPA {student.cgpa}
    </p>
  );
}

export default function ApplicationDesk() {
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ studentId: '', company: '' });
  const [saved, setSaved] = useState(0);
  const [message, setMessage] = useState('Loading placement records...');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const responses = await Promise.all(
          ['/students', '/applications'].map((route) =>
            fetch(API + route, { signal: controller.signal }),
          ),
        );
        if (responses.some((response) => !response.ok)) throw new Error('Database unavailable');
        const [people, rows] = await Promise.all(responses.map((response) => response.json()));
        setStudents(people);
        setApplications(rows);
        setMessage('Select a student and enter a company.');
      } catch (error) {
        if (error.name !== 'AbortError')
          setMessage('Start the case-study server and initialize its database.');
      }
    }
    load();
    return () => controller.abort();
  }, []);
  async function register(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(API + '/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const row = await response.json();
      if (!response.ok) throw new Error(row.error);
      setApplications((rows) => [...rows, row]);
      setSaved((count) => count + 1);
      setMessage('Application saved in MySQL.');
    } catch (error) {
      setMessage(error.message || 'Unable to save the application.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="case-feature">
      <h2>Placement registration desk</h2>
      <p>
        This session: <output>{saved}</output> new applications.
      </p>
      {students.map((student) => (
        <StudentProfile key={student.id} student={student} />
      ))}
      <form onSubmit={register}>
        <label>
          Student
          <select
            required
            value={form.studentId}
            onChange={(event) => setForm({ ...form, studentId: event.target.value })}
          >
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Company
          <input
            required
            maxLength={100}
            pattern=".*\S.*"
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
          />
        </label>
        <button disabled={busy || !students.length}>Register application</button>
      </form>
      <p role="status">{message}</p>
      <ul>
        {applications.map((row) => (
          <li key={row.id}>
            {row.name} → {row.company} · {row.status}
          </li>
        ))}
      </ul>
    </section>
  );
}
