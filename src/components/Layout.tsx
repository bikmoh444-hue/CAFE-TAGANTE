import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ArrowRightLeft, 
  Wallet, 
  CalendarClock, 
  BarChart3, 
  PieChart, 
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <span className={cn(
        "transition-transform duration-200 group-hover:scale-110",
        active ? "text-white" : "text-slate-400 group-hover:text-slate-900"
      )}>
        {icon}
      </span>
      <span className="font-medium flex-1 text-left">{label}</span>
      {active && <ChevronRight className="w-4 h-4 opacity-50" />}
    </button>
  );
}

export default function Layout({ 
  children, 
  activePage, 
  setActivePage 
}: { 
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}) {
  const { signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'presence', label: 'Présence Personnel', icon: <Users className="w-5 h-5" /> },
    { id: 'report_morning', label: 'Rapport Matin', icon: <FileText className="w-5 h-5" /> },
    { id: 'report_evening', label: 'Rapport Soir', icon: <FileText className="w-5 h-5" /> },
    { id: 'handover', label: 'Passation', icon: <ArrowRightLeft className="w-5 h-5" /> },
    { id: 'expenses', label: 'Grandes Dépenses', icon: <Wallet className="w-5 h-5" /> },
    { id: 'charges', label: 'Charges Mensuelles', icon: <CalendarClock className="w-5 h-5" /> },
    { id: 'daily_reports', label: 'Rapports Journaliers', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'monthly_reports', label: 'Rapports Mensuels', icon: <PieChart className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Café-Resto</h1>
              <p className="text-xs text-slate-500">Gestion Manager</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activePage === item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsSidebarOpen(false);
                }}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500">Administrateur</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex justify-center lg:justify-start">
            <h2 className="text-lg font-bold text-slate-900">
              {menuItems.find(i => i.id === activePage)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
