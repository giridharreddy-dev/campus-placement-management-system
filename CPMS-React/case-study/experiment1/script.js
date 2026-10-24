const nameInput = document.getElementById('name');
const cgpaInput = document.querySelector('#cgpa');
const result = document.querySelector('#result');
const tracks = ['Software', 'Analytics'];

const eligible = function (cgpa) {
  return cgpa >= 7;
};
const describeTracks = (...items) => items.join(' and ');

document.getElementsByTagName('button')[0].addEventListener('click', checkEligibility);
for (const field of document.getElementsByClassName('field')) field.style.display = 'block';
document.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', () => {
    result.textContent = 'Ready to check your eligibility.';
  });
});

function checkEligibility() {
  const { value: name } = nameInput;
  const [studentName, cgpa] = [name.trim(), Number(cgpaInput.value)];
  if (!studentName || cgpaInput.value === '' || !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
    result.textContent = 'Enter a name and a CGPA from 0 to 10.';
    return;
  }
  result.textContent = eligible(cgpa)
    ? `${studentName}: meets the CGPA criterion for ${describeTracks(...tracks)} drives.`
    : `${studentName}: below the 7.0 CGPA criterion. Explore other drives.`;
}
