import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Presence from './pages/Presence';
import ServerReport from './pages/ServerReport';
import Handover from './pages/Handover';
import Expenses from './pages/Expenses';
import Charges from './pages/Charges';
import DailyReports from './pages/DailyReports';
import MonthlyReports from './pages/MonthlyReports';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Chargement du système...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'presence':
        return <Presence />;
      case 'report_morning':
        return <ServerReport shift="morning" />;
      case 'report_evening':
        return <ServerReport shift="evening" />;
      case 'handover':
        return <Handover />;
      case 'expenses':
        return <Expenses />;
      case 'charges':
        return <Charges />;
      case 'daily_reports':
        return <DailyReports />;
      case 'monthly_reports':
        return <MonthlyReports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
