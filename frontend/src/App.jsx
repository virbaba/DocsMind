import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load route pages for performance optimization
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Modern, dark-themed page fallback loader
const PageLoader = () => (
  <div className="h-screen w-screen bg-[#0c0d12] flex items-center justify-center font-sans">
    <div className="flex flex-col items-center gap-3">
      {/* Premium violet spinning loader */}
      <div className="w-10 h-10 border-[3.5px] border-[#5b4fd4]/20 border-t-[#5b4fd4] rounded-full animate-spin"></div>
      <span className="text-[10px] text-[#52525b] tracking-[0.2em] uppercase font-bold animate-pulse">
        Loading DocsMind
      </span>
    </div>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't render routes until auth state is resolved
  if (isLoading) return null;

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;