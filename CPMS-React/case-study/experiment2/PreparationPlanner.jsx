import { Component, useState } from 'react';

class InterviewRounds extends Component {
  state = { rounds: 0 };
  render() {
    return (
      <div className="case-tile">
        <h3>Mock interview rounds</h3>
        <output aria-live="polite">{this.state.rounds}</output>
        <button onClick={() => this.setState(({ rounds }) => ({ rounds: rounds + 1 }))}>
          Complete a round
        </button>
        <button onClick={() => this.setState({ rounds: 0 })}>Reset rounds</button>
      </div>
    );
  }
}

export default function PreparationPlanner({ name = 'Student' }) {
  const [problems, setProblems] = useState(0);
  const [showTip, setShowTip] = useState(false);
  return (
    <section className="case-feature" aria-label="Placement preparation planner">
      <h2>{`${name}'s placement preparation`}</h2>
      <p>Track this session's practice before attending a placement drive.</p>
      <div className="case-grid">
        <InterviewRounds />
        <div className="case-tile">
          <h3>Problems solved</h3>
          <output aria-live="polite">{problems}</output>
          <button onClick={() => setProblems((count) => count + 1)}>Solve a problem</button>
          <button onClick={() => setProblems((count) => Math.max(0, count - 1))}>
            Undo problem
          </button>
          <p>{problems >= 3 ? 'Daily practice goal reached!' : 'Aim to solve 3 problems today.'}</p>
          <button onClick={() => setShowTip((visible) => !visible)}>Preparation tip</button>
          {showTip && <p>Explain your approach, practise SQL and revise your project.</p>}
        </div>
      </div>
    </section>
  );
}
