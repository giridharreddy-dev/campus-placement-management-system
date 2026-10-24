import { useState } from 'react';
function Success() {
  return <p>The component is visible</p>;
}
export default function ConditionalExample() {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      {visible ? <Success /> : <p>The component is hidden</p>}
      <button onClick={() => setVisible((previous) => !previous)}>
        Toggle status
      </button>
    </div>
  );
}
