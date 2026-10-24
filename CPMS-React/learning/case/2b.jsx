import { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h4>Companies on practice shortlist</h4>
      <output aria-live="polite">{count}</output>
      <button onClick={() => setCount((previous) => previous + 1)}>
        Increase
      </button>
      <button onClick={() => setCount((previous) => Math.max(0, previous - 1))}>
        Decrease
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
