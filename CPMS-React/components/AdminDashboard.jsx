import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import ConfirmModal from "./ConfirmModal";

const VALID_STATUSES = ['Shortlisted', 'Interview', 'Selected', 'Offered', 'Rejected'];

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('APPLICATIONS'); // 'APPLICATIONS' | 'COMPANIES'

  // Application Filter & Search state
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Company management form & modal state
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    position: '',
    salary: '',
    ctc: '',
    location: '',
    openings: 5,
  });

  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Application withdrawal modal state
  const [withdrawingApp, setWithdrawingApp] = useState(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const reloadData = async () => {
    try {
      const [statsRes, companiesRes, appsRes] = await Promise.all([
        fetch('/api/stats', { credentials: 'include' }),
        fetch('/api/companies', { credentials: 'include' }),
        fetch('/api/applications', { credentials: 'include' }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (appsRes.ok) setApplications(await appsRes.json());
    } catch {
      // ignore reload error
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      try {
        const [statsRes, companiesRes, appsRes] = await Promise.all([
          fetch('/api/stats', { credentials: 'include' }),
          fetch('/api/companies', { credentials: 'include' }),
          fetch('/api/applications', { credentials: 'include' }),
        ]);

        if (!companiesRes.ok || !appsRes.ok) {
          throw new Error('Failed to load administrator portal data.');
        }

        const sData = statsRes.ok ? await statsRes.json() : null;
        const cData = await companiesRes.json();
        const aData = await appsRes.json();

        if (isMounted) {
          setStats(sData);
          setCompanies(cData);
          setApplications(aData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to update status.' });
        reloadData();
        return;
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      setActionMessage({ type: 'success', text: `Application #${appId} updated to "${newStatus}" via Admin Override.` });

      // Refresh stats
      fetch('/api/stats', { credentials: 'include' })
        .then((r) => r.ok && r.json())
        .then((s) => s && setStats(s))
        .catch(() => {});
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawingApp) return;

    try {
      const res = await fetch(`/api/applications/${withdrawingApp.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to withdraw application.' });
        setIsWithdrawModalOpen(false);
        setWithdrawingApp(null);
        return;
      }

      setApplications((prev) => prev.filter((a) => a.id !== withdrawingApp.id));
      setActionMessage({ type: 'success', text: `Application #${withdrawingApp.id} withdrawn successfully.` });
      setIsWithdrawModalOpen(false);
      setWithdrawingApp(null);
      reloadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
      setIsWithdrawModalOpen(false);
      setWithdrawingApp(null);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCompany),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to create company.' });
        return;
      }

      setActionMessage({ type: 'success', text: `Company "${newCompany.name}" registered successfully!` });
      setShowAddCompany(false);
      setNewCompany({ name: '', position: '', salary: '', ctc: '', location: '', openings: 5 });
      reloadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;
    setActionMessage(null);

    try {
      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingCompany),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to update company.' });
        return;
      }

      setActionMessage({ type: 'success', text: `Company "${editingCompany.name}" updated successfully!` });
      setEditingCompany(null);
      reloadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirmDeleteCompany = async () => {
    if (!deletingCompany) return;
    setIsDeleting(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/companies/${deletingCompany.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          type: 'error',
          text: data.error || `Cannot delete company "${deletingCompany.name}". It may have active applicants or records associated with it.`,
        });
        setIsDeleteModalOpen(false);
        setDeletingCompany(null);
        return;
      }

      setActionMessage({ type: 'success', text: `Company "${deletingCompany.name}" deleted successfully.` });
      setIsDeleteModalOpen(false);
      setDeletingCompany(null);
      reloadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
      setIsDeleteModalOpen(false);
      setDeletingCompany(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Applications Filter
  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;

    // Company filter
    if (companyFilter !== 'ALL' && app.company_name !== companyFilter) return false;

    // Branch filter
    if (branchFilter !== 'ALL' && app.student_branch !== branchFilter) return false;

    // Search query
    if (appSearchQuery.trim()) {
      const q = appSearchQuery.toLowerCase().trim();
      const sName = (app.student_name || '').toLowerCase();
      const sEmail = (app.student_email || '').toLowerCase();
      const sId = (app.student_id || '').toLowerCase();
      const cName = (app.company_name || '').toLowerCase();
      const pos = (app.position || '').toLowerCase();
      const branch = (app.student_branch || '').toLowerCase();

      return (
        sName.includes(q) ||
        sEmail.includes(q) ||
        sId.includes(q) ||
        cName.includes(q) ||
        pos.includes(q) ||
        branch.includes(q)
      );
    }

    return true;
  });

  // Unique companies and branches for dropdown filters
  const uniqueCompanies = Array.from(
    new Set([...companies.map((c) => c.name), ...applications.map((a) => a.company_name)].filter(Boolean))
  );
  const uniqueBranches = Array.from(new Set(applications.map((a) => a.student_branch).filter(Boolean)));

  // Funnel & Placement conversion statistics with distinct candidate baselines
  // 1. Distinct Candidate Baselines (prevents multi-offer candidates from inflating the denominator or numerator)
  const uniqueCandidateIds = Array.from(
    new Set(applications.map((a) => a.student_id).filter(Boolean))
  );
  const totalDistinctCandidates = uniqueCandidateIds.length;

  const distinctCandidatesOffered = Array.from(
    new Set(
      applications
        .filter((a) => a.status === 'Offered' || a.status === 'Selected')
        .map((a) => a.student_id)
        .filter(Boolean)
    )
  ).length;

  const distinctCandidatesShortlisted = Array.from(
    new Set(
      applications
        .filter((a) => a.status === 'Shortlisted')
        .map((a) => a.student_id)
        .filter(Boolean)
    )
  ).length;

  // Distinct candidate placement rate: % of unique applicants who reached Offered/Selected
  const candidateOfferRate =
    totalDistinctCandidates > 0
      ? Math.round((distinctCandidatesOffered / totalDistinctCandidates) * 100)
      : 0;

  // 2. Application-level submission metrics (synchronized with live application state)
  const totalAppsCount = applications.length > 0 ? applications.length : (stats?.totalApplications ?? 0);
  const shortlistedCount = applications.length > 0 ? applications.filter((a) => a.status === 'Shortlisted').length : (stats?.shortlisted ?? 0);
  const offersCount = applications.length > 0 ? applications.filter((a) => a.status === 'Offered' || a.status === 'Selected').length : (stats?.offers ?? 0);
  const shortlistRate = totalAppsCount > 0 ? Math.round((shortlistedCount / totalAppsCount) * 100) : 0;

  // Company application counts for safe deletion modal
  const activeAppsForDeletingCo = deletingCompany
    ? applications.filter(
        (a) =>
          Number(a.company_id) === Number(deletingCompany.id) &&
          ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Offered'].includes(a.status)
      )
    : [];

  const rejectedAppsForDeletingCo = deletingCompany
    ? applications.filter(
        (a) =>
          Number(a.company_id) === Number(deletingCompany.id) &&
          a.status === 'Rejected'
      )
    : [];

  return (
    <div className="cpms-app admin-app">
      <header className="cpms-header">
        <div className="brand-section">
          <p className="system-label">CENTRAL PLACEMENT ADMINISTRATION</p>
          <h1>University Placement Administration</h1>
          <p className="header-subtitle">
            Authenticated Admin: {user?.email} | Total Control Console
          </p>
        </div>

        <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span className="status-indicator"></span>
            Administration Active
          </div>
          <button
            type="button"
            onClick={logout}
            className="logout-button"
            title="Sign out of admin session"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="cpms-main">
        {/* Campus Overview & Funnel Metrics */}
        <section className="summary-section">
          <div className="section-heading">
            <div>
              <h2>University Placement Metrics</h2>
              <p className="section-description">Central operational overview across all departments</p>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">🏢</div>
              <div>
                <span className="summary-value">{stats?.totalCompanies ?? companies.length}</span>
                <span className="summary-label">Partner Companies</span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">📄</div>
              <div>
                <span className="summary-value">{totalAppsCount}</span>
                <span className="summary-label">Total Submissions</span>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                  {totalDistinctCandidates} distinct applicant{totalDistinctCandidates === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">🎯</div>
              <div>
                <span className="summary-value">{shortlistedCount}</span>
                <span className="summary-label">Shortlisted ({shortlistRate}% conv.)</span>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                  {distinctCandidatesShortlisted} distinct candidate{distinctCandidatesShortlisted === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" aria-hidden="true">🎉</div>
              <div>
                <span className="summary-value">{offersCount}</span>
                <span className="summary-label">Offers & Selections ({candidateOfferRate}% conv.)</span>
                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                  {distinctCandidatesOffered} of {totalDistinctCandidates} distinct candidate{totalDistinctCandidates === 1 ? '' : 's'} placed
                </span>
              </div>
            </div>
          </div>
        </section>

        {actionMessage && (
          <div
            className={`action-notification ${actionMessage.type === 'error' ? 'error' : 'success'}`}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: 500,
              background: actionMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: actionMessage.type === 'error' ? '#991b1b' : '#166534',
              border: `1px solid ${actionMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            }}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('APPLICATIONS')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: activeTab === 'APPLICATIONS' ? '2px solid #1e5795' : '1px solid #d1d5db',
              background: activeTab === 'APPLICATIONS' ? '#1e5795' : '#ffffff',
              color: activeTab === 'APPLICATIONS' ? '#ffffff' : '#374151',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Student Applications ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPANIES')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: activeTab === 'COMPANIES' ? '2px solid #1e5795' : '1px solid #d1d5db',
              background: activeTab === 'COMPANIES' ? '#1e5795' : '#ffffff',
              color: activeTab === 'COMPANIES' ? '#ffffff' : '#374151',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Manage Companies ({companies.length})
          </button>
        </div>

        {activeTab === 'APPLICATIONS' ? (
          <section className="dashboard-card admin-table-section">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' }}>
              <div>
                <h2>All Applications</h2>
                <p className="section-description">
                  Cross-company student submissions with administrative status override and withdrawal controls
                </p>
              </div>

              {/* Admin Filter Controls Toolbar */}
              <div
                className="admin-filter-toolbar"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px 12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  alignItems: 'center',
                }}
              >
                {/* Live Search */}
                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <input
                    type="text"
                    placeholder="Search candidate, email, ID, company, role..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Company filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Company:</label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '12px',
                      background: '#fff',
                    }}
                  >
                    <option value="ALL">All Companies</option>
                    {uniqueCompanies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Branch filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Branch:</label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '12px',
                      background: '#fff',
                    }}
                  >
                    <option value="ALL">All Branches</option>
                    {uniqueBranches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '12px',
                      background: '#fff',
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interview</option>
                    <option value="Selected">Selected</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading applications...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>{error}</div>
            ) : filteredApplications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No applications match your filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                      <th style={{ padding: '12px' }}>ID</th>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Company & Role</th>
                      <th style={{ padding: '12px' }}>Applied Date</th>
                      <th style={{ padding: '12px' }}>Status (Admin Override)</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>#{app.id}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{app.student_name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{app.student_email || app.student_id}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{app.student_branch || 'General'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{app.company_name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{app.position}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                          {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: '#ffffff',
                            }}
                            title="Admin Override: adjust candidate status or reopen rejected applications"
                          >
                            <option value="Applied" disabled>Applied (Initial Only)</option>
                            {VALID_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setWithdrawingApp(app);
                              setIsWithdrawModalOpen(true);
                            }}
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #f87171',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Withdraw
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="dashboard-card admin-companies-section">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Corporate Partners</h2>
                <p className="section-description">Registered campus recruiters and placement drives</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCompany(!showAddCompany)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#1e5795',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {showAddCompany ? 'Cancel' : '+ Add Partner Company'}
              </button>
            </div>

            {showAddCompany && (
              <form onSubmit={handleCreateCompany} style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', margin: '16px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Company Name</label>
                  <input
                    type="text"
                    required
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Position</label>
                  <input
                    type="text"
                    required
                    value={newCompany.position}
                    onChange={(e) => setNewCompany({ ...newCompany, position: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Salary / Base</label>
                  <input
                    type="text"
                    value={newCompany.salary}
                    onChange={(e) => setNewCompany({ ...newCompany, salary: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>CTC</label>
                  <input
                    type="text"
                    value={newCompany.ctc}
                    onChange={(e) => setNewCompany({ ...newCompany, ctc: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Location</label>
                  <input
                    type="text"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Openings</label>
                  <input
                    type="number"
                    value={newCompany.openings}
                    onChange={(e) => setNewCompany({ ...newCompany, openings: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      background: '#15803d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save Company
                  </button>
                </div>
              </form>
            )}

            {/* Inline Editing Form if a company is selected for edit */}
            {editingCompany && (
              <form onSubmit={handleUpdateCompany} style={{ background: '#eff6ff', padding: '20px', borderRadius: '8px', margin: '16px 0', border: '1px solid #bfdbfe', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1', fontWeight: 600, color: '#1e3a8a', fontSize: '14px' }}>
                  Edit Partner Company: #{editingCompany.id} ({editingCompany.name})
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Company Name</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Position</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.position}
                    onChange={(e) => setEditingCompany({ ...editingCompany, position: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Salary / Base</label>
                  <input
                    type="text"
                    value={editingCompany.salary || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, salary: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>CTC</label>
                  <input
                    type="text"
                    value={editingCompany.ctc || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, ctc: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Location</label>
                  <input
                    type="text"
                    value={editingCompany.location || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, location: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Openings</label>
                  <input
                    type="number"
                    value={editingCompany.openings || 0}
                    onChange={(e) => setEditingCompany({ ...editingCompany, openings: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      background: '#1e5795',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCompany(null)}
                    style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#4b5563',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th style={{ padding: '12px' }}>Position</th>
                    <th style={{ padding: '12px' }}>Location</th>
                    <th style={{ padding: '12px' }}>CTC</th>
                    <th style={{ padding: '12px' }}>Openings</th>
                    <th style={{ padding: '12px' }}>Applicants</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>#{c.id}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '12px' }}>{c.position}</td>
                      <td style={{ padding: '12px' }}>{c.location || '—'}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{c.ctc || c.salary || '—'}</td>
                      <td style={{ padding: '12px' }}>{c.openings}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1e5795' }}>{c.applicants}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingCompany(c)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: '#ffffff',
                              color: '#1e5795',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCompany(c);
                              setIsDeleteModalOpen(true);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#991b1b',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Application Withdrawal Confirmation Modal */}
      <ConfirmModal
        isOpen={isWithdrawModalOpen}
        title="Admin: Withdraw Application"
        isDanger={true}
        confirmLabel="Withdraw Application"
        cancelLabel="Cancel"
        message={
          <div>
            <p>
              Are you sure you want to administratively withdraw application <strong>#{withdrawingApp?.id}</strong> ({withdrawingApp?.student_name} for {withdrawingApp?.company_name})?
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
              This will remove the application from active recruiter records. The student will be able to re-apply if open positions remain.
            </p>
          </div>
        }
        onConfirm={handleConfirmWithdraw}
        onClose={() => {
          setIsWithdrawModalOpen(false);
          setWithdrawingApp(null);
        }}
      />

      {/* Safe Company Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Safe Company Deletion"
        isDanger={true}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Company"}
        confirmDisabled={activeAppsForDeletingCo.length > 0}
        cancelLabel="Cancel"
        isLoading={isDeleting}
        message={
          <div>
            <p>
              Are you sure you want to delete corporate partner <strong>{deletingCompany?.name}</strong>?
            </p>
            {activeAppsForDeletingCo.length > 0 ? (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#991b1b",
                  lineHeight: 1.5,
                }}
              >
                ⚠️ <strong>Active Applicant Warning:</strong> This company has {activeAppsForDeletingCo.length} active applicant(s) in progress (Applied, Shortlisted, Interview, Selected, Offered).
                Deletion is blocked to prevent accidental data loss. Active applications must be resolved or withdrawn first.
              </div>
            ) : rejectedAppsForDeletingCo.length > 0 ? (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#1e40af",
                  lineHeight: 1.5,
                }}
              >
                ℹ️ <strong>Historical Records Notice:</strong> This company has {rejectedAppsForDeletingCo.length} rejected applicant record(s) and 0 active applicants.
                Deletion will safely clean up these historical records without leaving orphaned data.
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                This company has no current applicants. It will be removed from the portal.
              </p>
            )}
          </div>
        }
        onConfirm={handleConfirmDeleteCompany}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCompany(null);
        }}
      />

      <footer className="cpms-footer">
        <p>Campus Placement Management System</p>
        <p>Administrative Control Center | Milestone 2 Role Architecture</p>
      </footer>
    </div>
  );
}

export default AdminDashboard;
