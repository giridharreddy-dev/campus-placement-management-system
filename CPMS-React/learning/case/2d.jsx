import { useState } from 'react';
function Success() {
  return <p>Eligible for this practice drive</p>;
}
export default function ConditionalExample() {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      {visible ? <Success /> : <p>Keep preparing for this drive</p>}
      <button onClick={() => setVisible((previous) => !previous)}>
        Toggle status
      </button>
    </div>
  );
}
