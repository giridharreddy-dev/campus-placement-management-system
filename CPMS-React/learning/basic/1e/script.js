function greet() {
  return 'Hello from a function declaration';
}
const add = function (a, b) {
  return a + b;
};
const multiply = (a, b) => a * b;
const output = document.querySelector('#output');
document.querySelector('#declaration').addEventListener('click', () => {
  output.textContent = greet();
});
document.querySelector('#expression').addEventListener('click', () => {
  output.textContent = `Sum: ${add(15, 10)}`;
});
document.querySelector('#arrow').addEventListener('click', () => {
  output.textContent = `Product: ${multiply(5, 10)}`;
});
