import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ApplicantLogin } from './pages/auth/ApplicantLogin';
import { ApplicantRegister } from './pages/auth/ApplicantRegister';
import { OfficerLogin } from './pages/auth/OfficerLogin';
import { ApplicantDashboard } from './pages/applicant/ApplicantDashboard';
import { ApplicationStepper } from './pages/applicant/ApplicationStepper';
import { ApplicationView } from './pages/applicant/ApplicationView';
import { TrackApplication } from './pages/applicant/TrackApplication';
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerApplicationReview } from './pages/officer/OfficerApplicationReview';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { IntegrationSandbox } from './pages/integrations/IntegrationSandbox';

// Protected Route wrappers
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/applicant/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/track" element={<TrackApplication />} />
              <Route path="/applicant/login" element={<ApplicantLogin />} />
              <Route path="/applicant/register" element={<ApplicantRegister />} />
              <Route path="/officer/login" element={<OfficerLogin />} />
              <Route path="/integrations/sandbox" element={<IntegrationSandbox />} />

              {/* Applicant Protected Routes */}
              <Route
                path="/applicant/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
                    <ApplicantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applicant/applications/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
                    <ApplicationStepper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applicant/applications/:id"
                element={
                  <ProtectedRoute allowedRoles={['APPLICANT', 'OFFICER', 'ADMIN']}>
                    <ApplicationView />
                  </ProtectedRoute>
                }
              />

              {/* Officer Protected Routes */}
              <Route
                path="/officer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/applications/:id/review"
                element={
                  <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                    <OfficerApplicationReview />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
