import html from './experiment1/index.html?raw';
import script from './experiment1/script.js?raw';

export default function EligibilityDesk() {
  const document = html.replace('<script src="script.js"></script>', `<script>${script}</script>`);
  return (
    <section className="case-feature">
      <h2>Placement eligibility desk</h2>
      <p>Check the 7.0 CGPA criterion. Each company may have additional requirements.</p>
      <iframe title="Combined Experiment 1" sandbox="allow-scripts" srcDoc={document} />
    </section>
  );
}
