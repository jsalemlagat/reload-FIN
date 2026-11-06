import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ViewTab } from '../types/finance';
import { LayoutDashboard, Receipt, FileText, PiggyBank, Settings } from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setActiveTab } = useFinance();

  const tabs: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Treasury', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'settings', label: 'Team', icon: Settings },
  ];

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="min-h-[48px] min-w-[44px] flex flex-col items-center justify-center relative transition-colors group select-none active:scale-95"
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-110'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-full px-1 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
