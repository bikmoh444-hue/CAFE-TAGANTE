import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import ServerReport from './pages/ServerReport';
import Handover from './pages/Handover';
import OtherRevenues from './pages/OtherRevenues';
import Expenses from './pages/Expenses';
import MonthlyCharges from './pages/MonthlyCharges';
import Statistics from './pages/Statistics';
import DailyReport from './pages/ DailyReport';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report-morning"
            element={
              <ProtectedRoute>
                <ServerReport shift="matin" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report-evening"
            element={
              <ProtectedRoute>
                <ServerReport shift="soir" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/daily-report"
            element={
              <ProtectedRoute>
                <DailyReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/handover"
            element={
              <ProtectedRoute>
                <Handover />
              </ProtectedRoute>
            }
          />

          <Route
            path="/other-revenues"
            element={
              <ProtectedRoute>
                <OtherRevenues />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/monthly-charges"
            element={
              <ProtectedRoute>
                <MonthlyCharges />
              </ProtectedRoute>
            }
          />

          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}