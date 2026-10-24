function Profile({ name, branch }) {
  return (
    <p>
      {name} — {branch}
    </p>
  );
}
export default function Parent() {
  const student = { name: 'Giri', branch: 'CSE' };
  return (
    <div>
      <h4>Parent passes props to child</h4>
      <Profile name={student.name} branch={student.branch} />
    </div>
  );
}
