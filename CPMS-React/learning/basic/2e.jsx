export default function StringExample() {
  const title = 'String literals';
  const name = 'Giri';
  const message = `Welcome, ${name}. ${title} is ready.`;
  return (
    <div>
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  );
}
