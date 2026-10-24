import { Component } from 'react';
export default class ClassCounter extends Component {
  state = { count: 0 };
  render() {
    return (
      <div>
        <h4>Practice interview rounds</h4>
        <output aria-live="polite">{this.state.count}</output>
        <button
          onClick={() =>
            this.setState((previous) => ({ count: previous.count + 1 }))
          }
        >
          Increase
        </button>
        <button
          onClick={() =>
            this.setState((previous) => ({
              count: Math.max(0, previous.count - 1),
            }))
          }
        >
          Decrease
        </button>
        <button onClick={() => this.setState({ count: 0 })}>Reset</button>
      </div>
    );
  }
}
