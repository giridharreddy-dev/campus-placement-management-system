import Dialog from './Dialog';
import Icon from './Icon';
import { deadlineInfo } from './opportunity-planner';

export function ComparisonTray({ drives, onRemove, onClear, onOpen }) {
  if (!drives.length) return null;
  return (
    <section className="ws-compare-tray" aria-label="Selected opportunities">
      <div>
        <strong role="status">
          {drives.length} of 3 opportunities selected
        </strong>
        <p>
          Choose at least two roles to compare. Your choices stay selected while
          you filter.
        </p>
        <div className="ws-compare-chips">
          {drives.map((drive) => (
            <button
              key={drive.id}
              onClick={() => onRemove(drive.id)}
              aria-label={`Remove ${drive.name} from comparison`}
            >
              {drive.name}
              <Icon name="close" size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className="ws-compare-actions">
        <button className="ws-text-button" onClick={onClear}>
          Clear selection
        </button>
        <button
          className="ws-button"
          disabled={drives.length < 2}
          onClick={onOpen}
        >
          <Icon name="compare" size={17} />
          Compare roles
        </button>
      </div>
    </section>
  );
}

export function OpportunityComparison({
  drives,
  applications,
  now,
  onDetails,
  onClose,
}) {
  if (drives.length < 2) {
    return (
      <Dialog title="Compare opportunities" onClose={onClose}>
        <div className="ws-comparison">
          <p>
            Some selected roles are no longer available. Close this window and
            choose at least two opportunities to compare.
          </p>
        </div>
      </Dialog>
    );
  }
  const rows = [
    ['Role', (drive) => drive.position || 'Not provided'],
    ['Compensation', (drive) => drive.ctc || drive.salary || 'Not disclosed'],
    ['Location', (drive) => drive.location || 'Not provided'],
    ['Work arrangement', (drive) => drive.workMode || 'Not provided'],
    ['Open positions', (drive) => drive.openings ?? 'Not provided'],
    [
      'Apply by',
      (drive) => {
        const info = deadlineInfo(drive.deadline, now);
        return info.date
          ? `${info.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${info.label}`
          : info.label;
      },
    ],
    [
      'Skills',
      (drive) => (drive.tags?.length ? drive.tags.join(', ') : 'Not provided'),
    ],
    [
      'Your application',
      (drive) =>
        applications.find(
          (app) =>
            String(app.company_id) === String(drive.id) &&
            app.status !== 'Withdrawn',
        )?.status || 'Not applied',
    ],
  ];
  return (
    <Dialog title="Compare opportunities" onClose={onClose} wide>
      <div className="ws-comparison">
        <p>
          Compare the published details, then open a role to review it or apply.
        </p>
        <p className="ws-comparison-hint">
          Scroll across to see every opportunity on a smaller screen.
        </p>
        <div
          className="ws-comparison-scroll"
          role="region"
          aria-label="Opportunity comparison table"
          tabIndex={0}
        >
          <table className="ws-comparison-table">
            <caption className="ws-sr-only">
              Published opportunity details and your application status
            </caption>
            <thead>
              <tr>
                <th scope="col">Details</th>
                {drives.map((drive) => (
                  <th scope="col" key={drive.id}>
                    {drive.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {drives.map((drive) => (
                    <td key={drive.id}>{value(drive)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Next step</th>
                {drives.map((drive) => (
                  <td key={drive.id}>
                    <button
                      className="ws-button small secondary"
                      onClick={() => onDetails(drive)}
                    >
                      View role
                      <Icon name="arrow" size={14} />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Dialog>
  );
}
