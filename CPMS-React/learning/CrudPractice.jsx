import { useId, useState } from 'react';

export default function CrudPractice({ mode }) {
  const id = useId();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('Load records to connect to the teaching server.');
  const [busy, setBusy] = useState(false);
  async function request(method, suffix = '', body) {
    setBusy(true);
    try {
      const base = `http://127.0.0.1:5010/${mode}/4d`;
      const response = await fetch(base + suffix, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const list = method === 'GET' ? data : await fetch(base).then((result) => { if (!result.ok) throw new Error('Unable to refresh records'); return result.json(); });
      setRows(list);
      setMessage(`${method} succeeded. ${list.length} practice record(s).`);
    } catch (error) { setMessage(`Request failed: ${error.message}. Check that the teaching server is running.`); }
    finally { setBusy(false); }
  }
  return <div><h4>Application CRUD playground</h4><button disabled={busy} onClick={() => request('GET')}>Load records (GET)</button>
    <form onSubmit={(event) => { event.preventDefault(); request('POST', '', { studentName: name.trim(), company: company.trim() }); }}>
      <label htmlFor={`${id}-name`}>Practice student</label><input id={`${id}-name`} required maxLength={100} pattern=".*\S.*" value={name} onChange={(event) => setName(event.target.value)} />
      <label htmlFor={`${id}-company`}>Practice company</label><input id={`${id}-company`} required maxLength={100} pattern=".*\S.*" value={company} onChange={(event) => setCompany(event.target.value)} />
      <button disabled={busy}>Create (POST)</button>
    </form><p role="status">{message}</p>
    <ul>{rows.map((row) => <li key={row.id}><p>{row.studentName} → {row.company} · {row.status}</p><button disabled={busy || row.status === 'Shortlisted'} onClick={() => request('PUT', `/${row.id}`, { studentName: row.studentName, company: row.company, status: 'Shortlisted' })}>Shortlist (PUT)</button><button disabled={busy} onClick={() => request('DELETE', `/${row.id}`)}>Delete practice record</button></li>)}</ul>
  </div>;
}
