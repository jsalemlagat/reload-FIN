import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import ReportsView from './components/ReportsView';
import BudgetView from './components/BudgetView';
import SettingsView from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import { NotificationToast } from './components/NotificationToast';
import { AuthProvider } from './context/AuthContext';

function MainContent() {
  const { activeTab } = useFinance();

  return (
    <main className="min-h-screen">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'transactions' && <TransactionsView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'budgets' && <BudgetView />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
}

function AppContent() {
  const { isOnline } = usePWAInstall();
  const { toastMessage, clearToast } = useFinance();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <OfflineIndicator isOnline={isOnline} />
      <NotificationToast message={toastMessage} onClose={clearToast} />
      <TopBar />
      <MainContent />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
