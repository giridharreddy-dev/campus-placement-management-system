// The syllabus calls this function definition; here it means an expression.
function eligible(cgpa) {
  return cgpa >= 7 ? 'Eligible' : 'Keep preparing';
}
const vacancies = function (openings, filled) {
  return openings - filled;
};
const welcome = (name) => `Welcome to placements, ${name}`;
const output = document.querySelector('#output');
document.querySelector('#declaration').addEventListener('click', () => {
  output.textContent = eligible(8.2);
});
document.querySelector('#expression').addEventListener('click', () => {
  output.textContent = `${vacancies(10, 3)} vacancies`;
});
document.querySelector('#arrow').addEventListener('click', () => {
  output.textContent = welcome('Giri');
});
