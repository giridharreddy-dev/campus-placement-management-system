import { useEffect, useState, useRef } from "react";

function CandidateDetailModal({
  isOpen,
  application,
  onClose,
}) {
  const [studentDetails, setStudentDetails] = useState(null);
  const [error, setError] = useState(null);
  const closeBtnRef = useRef(null);
  const modalContentRef = useRef(null);
  const triggerElementRef = useRef(null);
  const prevIsOpenRef = useRef(false);

  // Capture trigger element on open and restore focus on close
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      triggerElementRef.current = document.activeElement;
    } else if (!isOpen && prevIsOpenRef.current) {
      const el = triggerElementRef.current;
      if (el && document.contains(el) && typeof el.focus === "function") {
        el.focus();
      } else {
        const fallback = document.querySelector('main') || document.body;
        fallback?.focus?.();
      }
      triggerElementRef.current = null;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      const el = triggerElementRef.current;
      if (el && document.contains(el) && typeof el.focus === "function") {
        el.focus();
      } else {
        const fallback = document.querySelector('main') || document.body;
        fallback?.focus?.();
      }
    };
  }, []);

  // Keyboard accessibility: Escape to close and Tab focus trapping within modal dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modalContentRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // If active focus somehow escaped dialog container, redirect focus back inside
        if (!modalContentRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
          return;
        }

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const initialTarget = closeBtnRef.current || modalContentRef.current?.querySelector('button') || modalContentRef.current;
    initialTarget?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Candidate Profile Data Fetching
  useEffect(() => {
    if (!isOpen || !application?.student_id) return;

    let isMounted = true;

    async function loadCandidateProfile() {
      try {
        const res = await fetch(`/api/students/${application.student_id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load candidate profile.");
        }
        const data = await res.json();
        if (isMounted) {
          setStudentDetails(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    }

    loadCandidateProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, application?.student_id]);

  if (!isOpen || !application) return null;

  const isCurrentCandidate = studentDetails?.id === application?.student_id;
  const activeStudentDetails = isCurrentCandidate ? studentDetails : null;
  const loading = !activeStudentDetails && !error;
  const candidateName = activeStudentDetails?.name || application.student_name || "Candidate Profile";
  const studentId = activeStudentDetails?.id || application.student_id;
  const email = activeStudentDetails?.email || application.student_email || "—";
  const phone = activeStudentDetails?.phone || "—";
  const branch = activeStudentDetails?.branch || application.student_branch || "—";
  const cgpa = activeStudentDetails?.cgpa || application.student_cgpa || "—";
  const rawSkills = activeStudentDetails?.skills || (application.student_skills ? application.student_skills.split(",") : []);
  const skills = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === "string"
    ? rawSkills.split(",")
    : [];
  const status = application.status || "Applied";
  const appliedDate = application.applied_date
    ? new Date(application.applied_date).toLocaleDateString()
    : "—";

  return (
    <div
      className="cpms-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalContentRef}
        className="cpms-modal-content candidate-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-detail-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cpms-modal-header">
          <div>
            <p className="system-label" style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
              CANDIDATE PROFILE
            </p>
            <h3
              id="candidate-detail-title"
              style={{ margin: "4px 0 0", fontSize: "20px", color: "#1e3a8a" }}
            >
              {candidateName}
            </h3>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="cpms-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="cpms-modal-body" style={{ padding: "18px 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
              Loading candidate details from student records...
            </div>
          ) : error ? (
            <div
              style={{
                padding: "14px",
                background: "#fef2f2",
                color: "#991b1b",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          ) : (
            <div
              className="candidate-profile-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="profile-field">
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Student ID
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {studentId}
                </span>
              </div>

              <div className="profile-field">
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Email Address
                </span>
                <span style={{ fontSize: "14px", color: "#111827" }}>
                  {email}
                </span>
              </div>

              <div className="profile-field">
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Phone Number
                </span>
                <span style={{ fontSize: "14px", color: "#111827" }}>
                  {phone}
                </span>
              </div>

              <div className="profile-field">
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Academic Branch
                </span>
                <span style={{ fontSize: "14px", color: "#111827" }}>
                  {branch}
                </span>
              </div>

              <div className="profile-field">
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  CGPA
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e5795" }}>
                  {cgpa} / 10
                </span>
              </div>

              <div className="profile-field">
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Application Date
                </span>
                <span style={{ fontSize: "14px", color: "#111827" }}>
                  {appliedDate}
                </span>
              </div>

              <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Current Application Status
                </span>
                <span
                  className={`status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {status}
                </span>
              </div>

              <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Technical Skills
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.length > 0 ? (
                    skills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "12px",
                          background: "#eef2ff",
                          color: "#3730a3",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {typeof skill === "string" ? skill.trim() : skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                      No skills listed
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="cpms-modal-footer"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "14px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "6px",
              background: "#1e5795",
              color: "#ffffff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetailModal;
