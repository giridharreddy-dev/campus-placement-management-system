import { Component } from "react";
import { applications as defaultApplications } from "../data/placementData";

class PlacementSummary extends Component {
  render() {
    const { companies, applications: propApplications, stats } = this.props;
    const totalCompanies = stats?.totalCompanies ?? (companies ? companies.length : 0);
    const liveApplications = propApplications || defaultApplications;
    const applicationCount = stats?.totalApplications ?? liveApplications.length;

    const shortlisted = stats?.shortlisted ?? liveApplications.filter(
      (application) => application.status === "Shortlisted"
    ).length;

    const offers = stats?.offers ?? liveApplications.filter(
      (application) => application.status === "Offered" || application.status === "Selected"
    ).length;

    const summaryItems = [
      {
        id: 1,
        value: totalCompanies,
        label: "Companies",
        icon: "🏢",
      },
      {
        id: 2,
        value: applicationCount,
        label: "Applications",
        icon: "📄",
      },
      {
        id: 3,
        value: shortlisted,
        label: "Shortlisted",
        icon: "🎯",
      },
      {
        id: 4,
        value: offers,
        label: "Offers Received",
        icon: "🎉",
      },
    ];

    return (
      <section className="summary-section">
        <div className="section-heading">
          <div>
            <h2>Placement Overview</h2>
            <p className="section-description">
              A quick look at current placement activity.
            </p>
          </div>
        </div>

        <div className="summary-grid">
          {summaryItems.map((item) => (
            <div className="summary-card" key={item.id}>
              <div className="summary-icon" aria-hidden="true">
                {item.icon}
              </div>

              <div>
                <span className="summary-value">{item.value}</span>
                <span className="summary-label">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
}

export default PlacementSummary;
