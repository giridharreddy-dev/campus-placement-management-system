import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import CandidateDetailModal from "./CandidateDetailModal";
import ConfirmModal from "./ConfirmModal";

function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Modals
  const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecruiterData() {
      try {
        const [appsRes, companyRes] = await Promise.all([
          fetch("/api/recruiter/applications", { credentials: "include" }),
          user?.company_id
            ? fetch(`/api/companies/${user.company_id}`, { credentials: "include" })
            : Promise.resolve(null),
        ]);

        if (!appsRes.ok) {
          throw new Error("Failed to load applications for your company.");
        }

        const appsData = await appsRes.json();
        let cData = null;
        if (companyRes && companyRes.ok) {
          cData = await companyRes.json();
        }

        if (isMounted) {
          setApplications(appsData);
          setCompanyInfo(cData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    loadRecruiterData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingAppId(appId);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          type: "error",
          text: data.error || "Failed to update candidate status.",
        });
        fetch("/api/recruiter/applications", { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then((fresh) => {
            if (fresh) setApplications(fresh);
          })
          .catch(() => {});
        return;
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );

      // If the modal was viewing this application, update it too
      if (selectedCandidateApp && selectedCandidateApp.id === appId) {
        setSelectedCandidateApp((prev) => ({ ...prev, status: newStatus }));
      }

      setActionMessage({
        type: "success",
        text: `Application #${appId} successfully transitioned to "${newStatus}".`,
      });
    } catch {
      setActionMessage({
        type: "error",
        text: "Network error while updating application status.",
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingApp) return;
    await handleStatusChange(rejectingApp.id, "Rejected");
    setIsRejectModalOpen(false);
    setRejectingApp(null);
  };

  // Funnel & Tab Counts
  const counts = {
    total: applications.length,
    applied: applications.filter((a) => a.status === "Applied").length,
    shortlisted: applications.filter((a) => a.status === "Shortlisted").length,
    interview: applications.filter((a) => a.status === "Interview").length,
    selected: applications.filter((a) => a.status === "Selected").length,
    offered: applications.filter((a) => a.status === "Offered").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  // Filter by stage tab
  const tabFiltered =
    statusFilter === "ALL"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  // Search filter: Name, Email, Student ID, Skills
  const searchFiltered = tabFiltered.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (app.student_name || "").toLowerCase();
    const email = (app.student_email || "").toLowerCase();
    const sid = (app.student_id || "").toLowerCase();
    const skills = (app.student_skills || "").toLowerCase();
    return name.includes(q) || email.includes(q) || sid.includes(q) || skills.includes(q);
  });

  // Sorting
  const sortedApps = [...searchFiltered].sort((a, b) => {
    if (sortBy === "NEWEST") {
      return new Date(b.applied_date || 0) - new Date(a.applied_date || 0);
    }
    if (sortBy === "OLDEST") {
      return new Date(a.applied_date || 0) - new Date(b.applied_date || 0);
    }
    if (sortBy === "CGPA_HIGH") {
      return (parseFloat(b.student_cgpa) || 0) - (parseFloat(a.student_cgpa) || 0);
    }
    if (sortBy === "CGPA_LOW") {
      return (parseFloat(a.student_cgpa) || 0) - (parseFloat(b.student_cgpa) || 0);
    }
    if (sortBy === "NAME_AZ") {
      return (a.student_name || "").localeCompare(b.student_name || "");
    }
    return 0;
  });

  const getNextStage = (currentStatus) => {
    switch (currentStatus) {
      case "Applied":
        return { target: "Shortlisted", label: "Shortlist" };
      case "Shortlisted":
        return { target: "Interview", label: "Schedule Interview" };
      case "Interview":
        return { target: "Selected", label: "Select Candidate" };
      case "Selected":
        return { target: "Offered", label: "Extend Offer" };
      default:
        return null;
    }
  };

  const companyName = companyInfo?.name || applications[0]?.company_name || "Corporate Partner";

  return (
    <div className="cpms-app recruiter-app">
      <header className="cpms-header">
        <div className="brand-section">
          <p className="system-label">RECRUITER PORTAL</p>
          <h1>{companyName} Placement Operations</h1>
          <p className="header-subtitle">
            Authenticated Recruiter: {user?.email} | Target Role: {companyInfo?.position || "Campus Recruitment"}
          </p>
        </div>

        <div className="header-status" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div>
            <span className="status-indicator"></span>
            Company Portal Active
          </div>
          <button
            type="button"
            onClick={logout}
            className="logout-button"
            title="Sign out of recruiter session"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="cpms-main">
        {/* Recruiter Overview Cards */}
        <section className="summary-section">
          <div className="section-heading">
            <div>
              <h2>Applicant Funnel Overview</h2>
              <p className="section-description">
                Real-time applicant progression for {companyName}
              </p>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">👥</div>
              <div>
                <span className="summary-value">{counts.total}</span>
                <span className="summary-label">Total Applicants</span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">🎯</div>
              <div>
                <span className="summary-value">{counts.shortlisted}</span>
                <span className="summary-label">Shortlisted</span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">💬</div>
              <div>
                <span className="summary-value">{counts.interview}</span>
                <span className="summary-label">In Interview</span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">🎉</div>
              <div>
                <span className="summary-value">{counts.selected + counts.offered}</span>
                <span className="summary-label">Selected / Offered</span>
              </div>
            </div>
          </div>
        </section>

        {actionMessage && (
          <div
            className={`action-notification ${actionMessage.type === "error" ? "error" : "success"}`}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontWeight: 500,
              background: actionMessage.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: actionMessage.type === "error" ? "#991b1b" : "#166534",
              border: `1px solid ${actionMessage.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Applications Management Table */}
        <section className="dashboard-card recruiter-table-section">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
            <div>
              <h2>Candidate Pipeline</h2>
              <p className="section-description">
                Review applicant profiles, filter by stage, and advance qualified candidates
              </p>
            </div>

            {/* Stage Tabs with Counts */}
            <div className="stage-tabs-row" style={{ display: "flex", flexWrap: "wrap", gap: "6px", width: "100%", marginTop: "8px" }}>
              {[
                { key: "ALL", label: "All", count: counts.total },
                { key: "Applied", label: "Applied", count: counts.applied },
                { key: "Shortlisted", label: "Shortlisted", count: counts.shortlisted },
                { key: "Interview", label: "Interview", count: counts.interview },
                { key: "Selected", label: "Selected", count: counts.selected },
                { key: "Offered", label: "Offered", count: counts.offered },
                { key: "Rejected", label: "Rejected", count: counts.rejected },
              ].map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: isActive ? "1px solid #1e5795" : "1px solid #d1d5db",
                      background: isActive ? "#1e5795" : "#ffffff",
                      color: isActive ? "#ffffff" : "#4b5563",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background: isActive ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                        color: isActive ? "#ffffff" : "#374151",
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Sort Toolbar */}
            <div
              className="recruiter-toolbar"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "10px",
                padding: "10px 12px",
                background: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              {/* Search input */}
              <div style={{ flex: "1 1 240px", minWidth: "200px" }}>
                <input
                  type="text"
                  placeholder="Search by name, email, student ID, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Sorting selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label htmlFor="sort-select" style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563" }}>
                  Sort By:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    fontWeight: 500,
                    background: "#ffffff",
                  }}
                >
                  <option value="NEWEST">Newest application</option>
                  <option value="OLDEST">Oldest application</option>
                  <option value="CGPA_HIGH">Highest CGPA</option>
                  <option value="CGPA_LOW">Lowest CGPA</option>
                  <option value="NAME_AZ">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading candidate pipeline...</div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#dc2626" }}>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ marginTop: "12px", padding: "6px 14px", borderRadius: "6px" }}
              >
                Retry
              </button>
            </div>
          ) : sortedApps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
              <p>No candidates match the selected filters or search query.</p>
            </div>
          ) : (
            <div className="recruiter-table-wrapper" style={{ overflowX: "auto", marginTop: "16px" }}>
              <table className="recruiter-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                    <th style={{ padding: "12px" }}>Candidate</th>
                    <th style={{ padding: "12px" }}>Branch & CGPA</th>
                    <th style={{ padding: "12px" }}>Technical Skills</th>
                    <th style={{ padding: "12px" }}>Applied Date</th>
                    <th style={{ padding: "12px" }}>Current Status</th>
                    <th style={{ padding: "12px" }}>Workflow Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApps.map((app) => {
                    const skills = app.student_skills
                      ? app.student_skills.split(",").map((s) => s.trim())
                      : [];
                    const nextStage = getNextStage(app.status);
                    const isRejected = app.status === "Rejected";
                    const isOffered = app.status === "Offered";
                    const isProcessing = updatingAppId === app.id;

                    return (
                      <tr key={app.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCandidateApp(app);
                              setIsCandidateModalOpen(true);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              textAlign: "left",
                              cursor: "pointer",
                              color: "inherit",
                            }}
                            title="Click to view candidate profile"
                          >
                            <div style={{ fontWeight: 600, color: "#1e5795", textDecoration: "underline" }}>
                              {app.student_name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{app.student_email}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>ID: {app.student_id}</div>
                          </button>
                        </td>

                        <td style={{ padding: "12px" }}>
                          <div style={{ fontSize: "13px" }}>{app.student_branch || "N/A"}</div>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e5795" }}>
                            CGPA: {app.student_cgpa || "N/A"}
                          </div>
                        </td>

                        <td style={{ padding: "12px", maxWidth: "220px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                style={{
                                  fontSize: "11px",
                                  background: "#eef2ff",
                                  color: "#3730a3",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: "12px", fontSize: "12px", color: "#6b7280" }}>
                          {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : "—"}
                        </td>

                        <td style={{ padding: "12px" }}>
                          <span
                            className={`status-badge status-${(app.status || "Applied").toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {app.status || "Applied"}
                          </span>
                        </td>

                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {/* Guided Next Stage Button */}
                            {nextStage && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleStatusChange(app.id, nextStage.target)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#1e5795",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: isProcessing ? "wait" : "pointer",
                                  whiteSpace: "nowrap",
                                }}
                                title={`Advance candidate to ${nextStage.target}`}
                              >
                                {isProcessing ? "Updating..." : `Advance: ${nextStage.label}`}
                              </button>
                            )}

                            {/* Final Stage Offered Notice */}
                            {isOffered && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 8px",
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                Final Stage: Offer Extended
                              </span>
                            )}

                            {/* Finalized Decision Rejected Notice */}
                            {isRejected && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 8px",
                                  background: "#fef2f2",
                                  color: "#991b1b",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                  border: "1px solid #fecaca",
                                }}
                              >
                                Decision Finalized
                              </span>
                            )}

                            {/* Reject Action: available from active stages */}
                            {!isRejected && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => {
                                  setRejectingApp(app);
                                  setIsRejectModalOpen(true);
                                }}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #fca5a5",
                                  background: "#fff1f2",
                                  color: "#be123c",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: isProcessing ? "wait" : "pointer",
                                }}
                                title="Reject candidate"
                              >
                                Reject
                              </button>
                            )}

                            {/* View Profile Modal trigger button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCandidateApp(app);
                                setIsCandidateModalOpen(true);
                              }}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#374151",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              View Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Candidate Profile Modal */}
      <CandidateDetailModal
        key={selectedCandidateApp?.id || "none"}
        isOpen={isCandidateModalOpen}
        application={selectedCandidateApp}
        onClose={() => {
          setIsCandidateModalOpen(false);
          setSelectedCandidateApp(null);
        }}
      />

      {/* Rejection Confirmation Modal */}
      <ConfirmModal
        isOpen={isRejectModalOpen}
        title="Confirm Rejection"
        isDanger={true}
        confirmLabel="Reject Candidate"
        cancelLabel="Cancel"
        message={
          <div>
            <p>
              Are you sure you want to mark <strong>{rejectingApp?.student_name}</strong> as <strong>Rejected</strong>?
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
              Note: Recruiters cannot reopen rejected applications. Once rejected, only a system administrator can reconsider or override this candidate.
            </p>
          </div>
        }
        onConfirm={handleConfirmReject}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectingApp(null);
        }}
      />

      <footer className="cpms-footer">
        <p>Campus Placement Management System</p>
        <p>Company Recruitment Console | Multi-Recruiter Scoped Access</p>
      </footer>
    </div>
  );
}

export default RecruiterDashboard;
