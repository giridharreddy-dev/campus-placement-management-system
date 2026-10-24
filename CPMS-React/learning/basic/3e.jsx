export default function ListExample() {
  const items = [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Orange' },
  ];
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
