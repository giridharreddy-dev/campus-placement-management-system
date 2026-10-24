const input = document.querySelector('#name');
input.addEventListener('input', (event) => {
  document.querySelector('#output').textContent =
    `Welcome, ${event.target.value || 'student'}`;
});
