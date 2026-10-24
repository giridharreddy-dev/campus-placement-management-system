import { useState } from "react";

function CompanyCard({
  companies = [],
  appliedCompanyIds,
  initialAppliedCompanyIds = [],
  onApplySuccess,
}) {
  const [locallyApplied, setLocallyApplied] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [appMessage, setAppMessage] = useState(null);
  const [submittingCompanyId, setSubmittingCompanyId] = useState(null);

  const isApplied = (companyId) => {
    if (appliedCompanyIds !== undefined) {
      return appliedCompanyIds.some((id) => Number(id) === Number(companyId));
    }
    return (
      initialAppliedCompanyIds.some((id) => Number(id) === Number(companyId)) ||
      locallyApplied.some((id) => Number(id) === Number(companyId))
    );
  };

  const handleApply = async (company) => {
    if (isApplied(company.id) || submittingCompanyId === company.id) return;

    setSubmittingCompanyId(company.id);
    setAppMessage(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyId: company.id })
      });
      
      const data = await res.json();

      if (!res.ok) {
        setAppMessage({ type: 'error', text: data.error || 'Failed to submit application.' });
        return;
      }

      // Success
      setAppMessage({ type: 'success', text: `Application submitted successfully to ${company.name}!` });
      setLocallyApplied((prev) => [...prev, company.id]);
      setApplicantCounts((prev) => ({
        ...prev,
        [company.id]: (prev[company.id] ?? company.applicants ?? 0) + 1
      }));

      if (onApplySuccess) {
        onApplySuccess(company, data);
      }
    } catch (err) {
      console.error('Failed to apply to company:', err);
      setAppMessage({ type: 'error', text: 'Network error. Please try again later.' });
    } finally {
      setSubmittingCompanyId(null);
    }
  };

  return (
    <section className="dashboard-card company-section">
      <div className="card-header">
        <div>
          <h2>Available Opportunities</h2>
          <p className="section-description">
            Explore companies recruiting for your next role.
          </p>
        </div>

        <span className="company-count">
          {companies.length} Companies
        </span>
      </div>

      {appMessage && (
        <div className={`application-message ${appMessage.type === 'error' ? 'error-msg' : ''}`} role="status">
          {appMessage.text}
        </div>
      )}

      <div className="company-list">
        {companies.map((company) => {
          const hasApplied = isApplied(company.id);
          const currentApplicantCount = company.applicants !== undefined
            ? company.applicants
            : (applicantCounts[company.id] ?? 0);

          return (
            <article className="company-card" key={company.id}>
              <div className="company-info">
                <div className="company-title-row">
                  <div className="company-avatar" aria-hidden="true">
                    {company.name.charAt(0)}
                  </div>

                  <div>
                    <h3>{company.name}</h3>
                    <p className="job-role">{company.position}</p>
                  </div>
                </div>

                <div className="company-details">
                  <span>
                    <strong>Salary:</strong> {company.salary}
                  </span>

                  <span>
                    <strong>CTC:</strong> {company.ctc}
                  </span>

                  <span>
                    <strong>Location:</strong> {company.location}
                  </span>

                  <span>
                    <strong>Openings:</strong> {company.openings}
                  </span>

                  <span>
                    <strong>Applicants:</strong> {currentApplicantCount}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={`apply-button ${hasApplied ? "applied-button" : ""}`}
                onClick={() => handleApply(company)}
                disabled={hasApplied || submittingCompanyId === company.id}
              >
                {hasApplied ? "✓ Applied" : submittingCompanyId === company.id ? "Applying..." : "Apply Now"}
              </button>
            </article>
          );
        })}
      </div>

      <p className="demo-note">
        Applications submitted are validated by backend session authorization and recorded in the database.
      </p>
    </section>
  );
}

export default CompanyCard;
