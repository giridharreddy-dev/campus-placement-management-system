import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import PlacementSummary from "./PlacementSummary";
import StudentProfile from "./StudentProfile";
import CompanyCard from "./CompanyCard";
import ApplicationStatus from "./ApplicationStatus";
import PreparationPlanner from '../case-study/experiment2/PreparationPlanner';
import EligibilityDesk from '../case-study/EligibilityDesk';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [student, setStudent] = useState(null);
  const [studentApplications, setStudentApplications] = useState([]);
  const [appliedCompanyIds, setAppliedCompanyIds] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentData() {
      if (!user?.student_id) {
        if (isMounted) {
          setError('Student ID missing from user account.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const [companiesRes, studentRes, appsRes, statsRes] = await Promise.all([
          fetch('/api/companies', { credentials: 'include' }),
          fetch(`/api/students/${user.student_id}`, { credentials: 'include' }),
          fetch(`/api/students/${user.student_id}/applications/details`, { credentials: 'include' }),
          fetch('/api/stats', { credentials: 'include' }).catch(() => null),
        ]);

        if (!companiesRes.ok || !studentRes.ok || !appsRes.ok) {
          throw new Error('Failed to retrieve student dashboard data from the database.');
        }

        const companiesData = await companiesRes.json();
        const studentData = await studentRes.json();
        const appsData = await appsRes.json();

        let statsData = null;
        if (statsRes && statsRes.ok) {
          statsData = await statsRes.json();
        }

        if (isMounted) {
          setCompanies(companiesData);
          setStudent(studentData);
          setStudentApplications(appsData);
          setAppliedCompanyIds(appsData.map((a) => a.company_id));
          setStats(statsData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    loadStudentData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleApplicationCreated = (company, result) => {
    const newApp = {
      id: result.id,
      student_id: user?.student_id,
      company_id: company.id,
      status: 'Applied',
      applied_date: new Date().toISOString(),
      company_name: company.name,
      position: company.position,
      salary: company.salary,
      ctc: company.ctc,
      location: company.location,
    };
    setStudentApplications((prev) => [newApp, ...prev]);
    setAppliedCompanyIds((prev) => Array.from(new Set([...prev, company.id])));
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, applicants: (c.applicants ?? 0) + 1 } : c))
    );
    setStats((prev) => (prev ? {
      ...prev,
      totalApplications: (prev.totalApplications ?? 0) + 1,
    } : null));

    // Refresh live stats
    fetch('/api/stats', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((freshStats) => {
        if (freshStats) setStats(freshStats);
      })
      .catch(() => {});
  };

  const handleApplicationWithdrawn = (withdrawnAppId, companyId) => {
    setStudentApplications((prev) => prev.filter((a) => a.id !== withdrawnAppId));
    setAppliedCompanyIds((prev) => prev.filter((id) => Number(id) !== Number(companyId)));
    setCompanies((prev) =>
      prev.map((c) =>
        Number(c.id) === Number(companyId) ? { ...c, applicants: Math.max(0, (c.applicants ?? 1) - 1) } : c
      )
    );
    // Refresh stats from backend
    fetch('/api/stats', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((freshStats) => {
        if (freshStats) setStats(freshStats);
      })
      .catch(() => {});
  };

  const welcomeName = student?.name || user?.name || "Student";

  return (
    <div className="cpms-app">
      <header className="cpms-header">
        <div className="brand-section">
          <p className="system-label">STUDENT PORTAL</p>
          <h1>Campus Placement Management System</h1>
          <p className="header-subtitle">
            Welcome, {welcomeName} ({user?.student_id})
          </p>
        </div>

        <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span className="status-indicator"></span>
            Placement Season Active
          </div>
          <button
            type="button"
            onClick={logout}
            className="logout-button"
            title="Sign out of current session"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="cpms-main">
        <section className="welcome-section">
          <h2>Welcome, {welcomeName}!</h2>
          <p>
            Track your applications, explore corporate opportunities, and manage your campus placement journey.
          </p>
        </section>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading placement portal data...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#dc2626" }}>
            <p style={{ fontWeight: 600 }}>Error loading portal data:</p>
            <p style={{ marginTop: "6px" }}>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: "16px",
                padding: "8px 18px",
                borderRadius: "6px",
                background: "#1e5795",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <PlacementSummary
              stats={stats}
              companies={companies}
              applications={studentApplications}
            />

            <div className="content-grid">
              <StudentProfile student={student} />
              <ApplicationStatus
                applications={studentApplications}
                onApplicationWithdrawn={handleApplicationWithdrawn}
              />
              <CompanyCard
                companies={companies}
                appliedCompanyIds={appliedCompanyIds}
                initialAppliedCompanyIds={appliedCompanyIds}
                onApplySuccess={handleApplicationCreated}
              />
            </div>
            <PreparationPlanner name={welcomeName} />
            <EligibilityDesk />
          </>
        )}
      </main>

      <footer className="cpms-footer">
        <p>Campus Placement Management System</p>
        <p>Authenticated Student Portal | Secure Role-Based Session</p>
      </footer>
    </div>
  );
}

export default StudentDashboard;
