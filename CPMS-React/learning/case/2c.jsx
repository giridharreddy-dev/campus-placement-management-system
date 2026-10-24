import { useState } from 'react';
export default function ClickExample() {
  const [message, setMessage] = useState('Choose an action');
  return (
    <div>
      <p role="status">{message}</p>
      <button onClick={() => setMessage('Prepare your resume')}>
        First action
      </button>
      <button onClick={() => setMessage('Practice an interview')}>
        Second action
      </button>
    </div>
  );
}
