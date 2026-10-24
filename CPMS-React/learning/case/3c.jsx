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
      <h4>Student placement profile</h4>
      <Profile name={student.name} branch={student.branch} />
    </div>
  );
}
