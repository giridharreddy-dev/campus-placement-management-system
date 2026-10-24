import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import AdminDashboard from './components/AdminDashboard';
import { lazy, Suspense } from 'react';
import './App.css';
import './case-study/case-study.css';

const LearningLab = lazy(() => import('./learning/LearningLab'));
const CaseStudyPage = lazy(() => import('./case-study/CaseStudyPage'));
const ProjectFiles = lazy(() => import('./project-files/ProjectFiles'));
const WorkspacePage = lazy(() => import('./workspace/WorkspacePage'));

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="cpms-loading-screen">
        <div className="spinner" aria-hidden="true"></div>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (
    ['STUDENT', 'RECRUITER', 'ADMIN'].includes(user.role) &&
    window.location.pathname.replace(/\/$/, '') !== '/manage'
  ) {
    return (
      <Suspense fallback={<p>Loading your career workspace...</p>}>
        <WorkspacePage key={user.id} user={user} onLogout={logout} />
      </Suspense>
    );
  }
  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'RECRUITER':
      return <RecruiterDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Unrecognized User Role: {user.role}</h2>
          <p>Please contact placement administrators.</p>
        </div>
      );
  }
}

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/demo') {
    return (
      <Suspense fallback={<p>Loading the interactive demo...</p>}>
        <WorkspacePage demo />
      </Suspense>
    );
  }
  if (window.location.pathname.replace(/\/$/, '') === '/project-files') {
    return (
      <Suspense fallback={<p>Loading project folders...</p>}>
        <ProjectFiles />
      </Suspense>
    );
  }
  if (window.location.pathname.replace(/\/$/, '') === '/case-study') {
    return (
      <Suspense fallback={<p>Loading CPMS case studies...</p>}>
        <CaseStudyPage />
      </Suspense>
    );
  }
  if (
    window.location.pathname === '/syllabus' ||
    window.location.pathname === '/syllabus/'
  ) {
    return (
      <Suspense fallback={<p>Loading syllabus lab...</p>}>
        <LearningLab />
      </Suspense>
    );
  }
  return (
    <AuthProvider>
      {window.location.pathname.replace(/\/$/, '') === '/manage' && (
        <a className="ws-management-back" href="/">
          ← Back to career workspace
        </a>
      )}
      <AppContent />
    </AuthProvider>
  );
}

export default App;
