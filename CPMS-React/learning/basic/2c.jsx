import { useState } from 'react';
export default function ClickExample() {
  const [message, setMessage] = useState('Choose an action');
  return (
    <div>
      <p role="status">{message}</p>
      <button onClick={() => setMessage('Hello from React')}>
        First action
      </button>
      <button onClick={() => setMessage('Button clicked')}>
        Second action
      </button>
    </div>
  );
}
