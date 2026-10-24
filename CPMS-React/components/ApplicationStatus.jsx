import { useState, useMemo } from "react";
import { applications as defaultApplications } from "../data/placementData";
import ConfirmModal from "./ConfirmModal";

const PIPELINE_STAGES = [
  { key: "Applied", label: "Applied", description: "Submission Received" },
  { key: "Shortlisted", label: "Shortlisted", description: "Profile Screened" },
  { key: "Interview", label: "Interview", description: "Technical & HR Rounds" },
  { key: "Selected", label: "Selected", description: "Candidate Selected" },
  { key: "Offered", label: "Offered", description: "Official Offer Issued" },
];

const STATUS_EXPLANATIONS = {
  Applied:
    "Your application has been received and logged in the recruitment portal. The recruitment committee is reviewing your academic credentials and verified technical skills.",
  Shortlisted:
    "Congratulations! Your profile has met the screening cutoff and has been shortlisted. Expect an interview schedule or assessment invitation shortly.",
  Interview:
    "You have advanced to active interview rounds. Check your email for scheduling details, interview links, and preparatory instructions from the recruitment team.",
  Selected:
    "Congratulations on clearing the interview rounds! You have been selected for the role. Final offer paperwork and institutional verification are underway.",
  Offered:
    "Official placement offer issued! Review your compensation package and role documentation with the University Placement Cell.",
  Rejected:
    "This application has concluded and will not move forward for this hiring drive. You remain eligible to apply for other active company drives on campus.",
};

function ApplicationStatus({
  applications: propApplications,
  onApplicationWithdrawn,
}) {
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const apps = useMemo(() => {
    if (propApplications && Array.isArray(propApplications)) {
      return propApplications;
    }
    return defaultApplications.filter((app) => app.studentId === "STU001");
  }, [propApplications]);

  // Determine active application
  const activeApp = useMemo(() => {
    if (apps.length === 0) return null;
    if (selectedAppId) {
      const found = apps.find((a) => a.id === selectedAppId);
      if (found) return found;
    }
    return apps[0];
  }, [apps, selectedAppId]);

  const getStatusClass = (statusStr) => {
    const s = statusStr || "Applied";
    return `status-badge status-${s.toLowerCase().replace(/\s+/g, "-")}`;
  };

  const handleConfirmWithdraw = async () => {
    if (!activeApp || isWithdrawing) return;

    setIsWithdrawing(true);
    setStatusMsg(null);

    const companyName = activeApp.company_name || activeApp.company || "this company";

    try {
      const res = await fetch(`/api/applications/${activeApp.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: "error",
          text: data.error || "Failed to withdraw application.",
        });
        setIsWithdrawModalOpen(false);
        return;
      }

      setStatusMsg({
        type: "success",
        text: `Application for ${companyName} has been successfully withdrawn.`,
      });

      setIsWithdrawModalOpen(false);

      if (onApplicationWithdrawn && activeApp.id) {
        onApplicationWithdrawn(activeApp.id, activeApp.company_id);
      }
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      setStatusMsg({
        type: "error",
        text: "Network error while withdrawing application.",
      });
      setIsWithdrawModalOpen(false);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Stepper calculations
  const currentStatus = activeApp?.status || "Applied";
  const isRejected = currentStatus === "Rejected";
  const activeStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <section className="dashboard-card application-section">
      <div className="card-header">
        <div>
          <h2>My Applications</h2>
          <p className="section-description">
            Track and manage your active placement submissions
          </p>
        </div>

        <span className="application-badge-count">
          {apps.length} {apps.length === 1 ? "Submission" : "Submissions"}
        </span>
      </div>

      <div className="status-content">
        {apps.length === 0 ? (
          <div
            className="status-empty"
            style={{ padding: "30px 0", textAlign: "center", color: "#6b7280" }}
          >
            <p style={{ fontWeight: 600 }}>No active applications.</p>
            <p style={{ fontSize: "13px", marginTop: "6px" }}>
              Browse available opportunities below to apply for open positions.
            </p>
          </div>
        ) : (
          <>
            {apps.length > 1 && (
              <div
                className="app-selector-row"
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                }}
              >
                {apps.map((app) => {
                  const compName =
                    app.company_name || app.company || `Company #${app.company_id}`;
                  const isActive = activeApp && activeApp.id === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        setSelectedAppId(app.id);
                        setStatusMsg(null);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: isActive ? "1px solid #1e5795" : "1px solid #d1d5db",
                        background: isActive ? "#1e5795" : "#f9fafb",
                        color: isActive ? "#ffffff" : "#4b5563",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      {compName}
                    </button>
                  );
                })}
              </div>
            )}

            {activeApp && (
              <>
                <p className="application-company">
                  {activeApp.company_name || activeApp.company || "Company"}
                </p>

                <h3>{activeApp.position || "Position"}</h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "6px",
                  }}
                >
                  <span className={getStatusClass(activeApp.status)}>
                    {activeApp.status || "Applied"}
                  </span>
                  {activeApp.applied_date && (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Applied on: {new Date(activeApp.applied_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Visual Application Progress Stepper */}
                <div
                  className="application-stepper-container"
                  style={{
                    margin: "24px 0 16px",
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      position: "relative",
                    }}
                  >
                    {PIPELINE_STAGES.map((stage, idx) => {
                      const isCompleted = !isRejected && activeStageIndex > idx;
                      const isCurrent = !isRejected && activeStageIndex === idx;

                      let circleBg = "#ffffff";
                      let circleBorder = "#d1d5db";
                      let circleColor = "#6b7280";

                      if (isCompleted) {
                        circleBg = "#15803d";
                        circleBorder = "#15803d";
                        circleColor = "#ffffff";
                      } else if (isCurrent) {
                        circleBg = "#1e5795";
                        circleBorder = "#1e5795";
                        circleColor = "#ffffff";
                      }

                      return (
                        <div
                          key={stage.key}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            flex: 1,
                            position: "relative",
                            zIndex: 2,
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: circleBg,
                              border: `2px solid ${circleBorder}`,
                              color: circleColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: 700,
                              marginBottom: "6px",
                              boxShadow: isCurrent ? "0 0 0 4px rgba(30, 87, 149, 0.15)" : "none",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: isCurrent ? 700 : 600,
                              color: isCurrent ? "#1e5795" : isCompleted ? "#15803d" : "#4b5563",
                            }}
                          >
                            {stage.label}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              marginTop: "2px",
                            }}
                          >
                            {stage.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rejected exit callout if applicable */}
                  {isRejected && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "10px 14px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#991b1b",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>🛑</span>
                      <div>
                        <strong>Application Status Notice:</strong> This application was not moved forward for this hiring cycle. You are encouraged to apply to other partner companies with open roles.
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Status Explanation */}
                <div
                  className="status-description-box"
                  style={{
                    padding: "12px 14px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    marginTop: "10px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>
                    {STATUS_EXPLANATIONS[currentStatus] ||
                      `Your application for ${activeApp.position} at ${activeApp.company_name} is currently in the ${currentStatus} stage.`}
                  </p>
                </div>

                {/* Authenticated Student Action: Withdraw Application */}
                <div className="status-actions" style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="withdraw-button"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={isWithdrawing}
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #f87171",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: isWithdrawing ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
                  </button>
                </div>

                {statusMsg && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      background:
                        statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
                      color:
                        statusMsg.type === "error" ? "#991b1b" : "#166534",
                      border:
                        statusMsg.type === "error"
                          ? "1px solid #fecaca"
                          : "1px solid #bbf7d0",
                    }}
                  >
                    {statusMsg.text}
                  </div>
                )}

                {/* Accessible Withdrawal Confirmation Modal */}
                <ConfirmModal
                  isOpen={isWithdrawModalOpen}
                  title="Confirm Application Withdrawal"
                  isDanger={true}
                  confirmLabel={isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
                  cancelLabel="Keep Application"
                  isLoading={isWithdrawing}
                  message={
                    <div>
                      <p>
                        Are you sure you want to withdraw your application for{" "}
                        <strong>{activeApp.company_name || activeApp.company || "this company"}</strong>?
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "8px",
                          lineHeight: 1.5,
                        }}
                      >
                        Withdrawing this application will notify the recruitment team and remove your profile from consideration. You can re-apply while openings remain active.
                      </p>
                    </div>
                  }
                  onConfirm={handleConfirmWithdraw}
                  onClose={() => setIsWithdrawModalOpen(false)}
                />
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default ApplicationStatus;
