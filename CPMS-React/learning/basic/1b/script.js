const heading = document.getElementById('heading');
const items = document.getElementsByClassName('item');
const buttons = document.getElementsByTagName('button');
const first = document.querySelector('.item');
const all = document.querySelectorAll('.item');
document.querySelector('#output').textContent =
  `${heading.textContent}: ${items.length} items, ${buttons.length} button, first = ${first.textContent}, total = ${all.length}`;
