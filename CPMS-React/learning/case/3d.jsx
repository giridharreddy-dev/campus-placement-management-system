import { useId, useState } from 'react';
export default function RegistrationForm() {
  const id = useId();
  const [form, setForm] = useState({ name: '', email: '', cgpa: '' });
  const [submitted, setSubmitted] = useState(null);
  function change(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }
  function submit(event) {
    event.preventDefault();
    setSubmitted({ ...form, name: form.name.trim(), cgpa: Number(form.cgpa) });
  }
  return (
    <div>
      <h4>Practice placement registration</h4>
      <form onSubmit={submit}>
        <label htmlFor={`${id}-name`}>Name</label>
        <input
          id={`${id}-name`}
          name="name"
          required
          pattern=".*\S.*"
          value={form.name}
          onChange={change}
        />
        <label htmlFor={`${id}-email`}>Email</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          value={form.email}
          onChange={change}
        />
        <label htmlFor={`${id}-cgpa`}>CGPA</label>
        <input
          id={`${id}-cgpa`}
          name="cgpa"
          type="number"
          min="0"
          max="10"
          step="0.01"
          required
          value={form.cgpa}
          onChange={change}
        />
        <button>Preview registration</button>
      </form>
      {submitted && (
        <p role="status">
          {submitted.name} ({submitted.email}), CGPA {submitted.cgpa}. Preview
          only; no database record created.
        </p>
      )}
    </div>
  );
}
