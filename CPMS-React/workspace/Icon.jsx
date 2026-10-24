const paths = {
  compare:
    'M8 3v18 M16 3v18 M3 7h6 M3 17h6 M15 7h6 M15 17h6 M5 5 3 7l2 2 M19 15l2 2-2 2',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  briefcase: 'M8 6V4h8v2 M3 7h18v13H3z M3 12c6 4 12 4 18 0 M10 13h4',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  document: 'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h6',
  calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 18h2',
  bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
  chart: 'M4 3v18h17 M8 17v-5 M13 17V7 M18 17v-8',
  people:
    'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M16 4a4 4 0 0 1 0 7 M18 14a4 4 0 0 1 4 4v3',
  user: 'M20 21v-3a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v3 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  plus: 'M12 4v16 M4 12h16',
  close: 'M5 5l14 14 M19 5 5 19',
  check: 'M4 12l5 5L20 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v6l4 2',
  location:
    'M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 0 1 14 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  logout: 'M9 3H3v18h6 M10 12h11 M16 7l5 5-5 5',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  book: 'M12 5c-3-3-7-3-10-1v16c4-2 7-2 10 1 3-3 6-3 10-1V4c-3-2-7-2-10 1v16',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  play: 'M8 4l13 8-13 8z',
  refresh:
    'M20 7v5h-5 M4 17v-5h5 M5 8a8 8 0 0 1 14-3l1 2 M19 16a8 8 0 0 1-14 3l-1-2',
};

export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
