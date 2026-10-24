export default function ListExample() {
  const items = [
    { id: 1, name: 'Campus software drive' },
    { id: 2, name: 'Campus analyst drive' },
  ];
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
