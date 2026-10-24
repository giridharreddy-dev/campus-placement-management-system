import { useEffect, useState } from 'react';
export default function FetchExample() {
  const [result, setResult] = useState({ rows: [], loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('http://127.0.0.1:5010/basic/3b', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rows = await response.json();
        setResult({ rows, loading: false, error: '' });
      } catch (error) {
        if (error.name !== 'AbortError')
          setResult({
            rows: [],
            loading: false,
            error:
              'Start the syllabus server on port 5010, then reopen this experiment. ' +
              error.message,
          });
      }
    }
    load();
    return () => controller.abort();
  }, []);
  if (result.loading) return <p role="status">Loading...</p>;
  if (result.error) return <p role="alert">{result.error}</p>;
  return (
    <ul>
      {result.rows.map((row) => (
        <li key={row.id}>{row.name}</li>
      ))}
    </ul>
  );
}
