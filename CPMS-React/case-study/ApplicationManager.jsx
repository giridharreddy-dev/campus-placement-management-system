import { useState } from 'react';

export default function ApplicationManager() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('Load the case-study applications to manage them.');
  const [busy, setBusy] = useState(false);
  async function request(method = 'GET', row) {
    setBusy(true);
    try {
      const base = 'http://127.0.0.1:5020/applications';
      const response = await fetch(base + (row ? `/${row.id}` : ''), {
        method,
        ...(method === 'PUT'
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Shortlisted' }),
            }
          : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const refreshed =
        method === 'GET'
          ? data
          : await fetch(base).then((result) => {
              if (!result.ok) throw new Error('Unable to refresh applications.');
              return result.json();
            });
      setRows(refreshed);
      setMessage(
        `${method} completed. ${refreshed.length} application(s) in the case-study database.`,
      );
    } catch (error) {
      setMessage(error.message || 'Start the case-study server on port 5020.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="case-feature">
      <h2>Manage placement applications</h2>
      <p>
        Register an application in Experiment 3, then read, shortlist or remove it here. These
        actions persist in cpms_case_study.
      </p>
      <button disabled={busy} onClick={() => request()}>
        Load applications
      </button>
      <p role="status">{message}</p>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <p>
              {row.name} → {row.company} · {row.status}
            </p>
            <button
              disabled={busy || row.status === 'Shortlisted'}
              onClick={() => request('PUT', row)}
            >
              Shortlist
            </button>
            <button disabled={busy} onClick={() => request('DELETE', row)}>
              Remove application
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
