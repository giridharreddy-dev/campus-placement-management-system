import { useState } from 'react';

export default function ModernJavaScript() {
  const [cgpa, setCgpa] = useState('8.2');
  // Form inputs are strings: convert explicitly instead of relying on coercion.
  const student = { name: 'Practice student', cgpa: Number(cgpa), skills: ['React', 'SQL'] };
  const { name, skills } = student; // Object destructuring
  const [primarySkill, ...otherSkills] = skills; // Array destructuring and rest
  const updatedStudent = { ...student, branch: 'CSE' }; // Object spread
  const addSkills = (...items) => [...skills, ...items]; // Rest parameter and array spread
  // Declarations are available before their textual position (hoisting).
  const greeting = greet(name);
  function greet(value) { return `Welcome, ${value}`; }
  return <section className="lab-panel"><h3>ES6+ concept playground</h3><p>These required topics supplement experiments 1–3.</p><label htmlFor="es6-cgpa">Practice CGPA (input is a string)</label><input id="es6-cgpa" type="number" min="0" max="10" step="0.1" value={cgpa} onChange={(event) => setCgpa(event.target.value)} />
    <dl><dt>Template literal + function hoisting</dt><dd>{greeting}</dd><dt>Explicit conversion vs implicit coercion</dt><dd>{`"${cgpa}" + 1 = ${cgpa + 1}; Number("${cgpa}") + 1 = ${Number(cgpa) + 1}`}</dd><dt>Destructuring + rest</dt><dd>{`${primarySkill}; remaining skills: ${otherSkills.join(', ')}`}</dd><dt>Spread + arrow function + rest parameters</dt><dd>{JSON.stringify({ ...updatedStudent, skills: addSkills('Node.js') })}</dd></dl>
    <p>JavaScript hoists declarations, not values or types. A <code>var</code> binding reads as undefined before assignment; <code>let</code> and <code>const</code> cannot be read before initialization (the temporal dead zone). Function expressions and arrow functions assigned to const follow that rule.</p>
  </section>;
}
