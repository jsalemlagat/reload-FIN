import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatPHP } from '../utils/currency';
import { 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Edit2, 
  Plus, 
  Check, 
  Calendar,
  PiggyBank
} from 'lucide-react';
import { BudgetComparisonChart } from './charts/FinancialCharts';

export default function BudgetView() {
  const { teamData, updateBudget, addCategory } = useFinance();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [showAddBudget, setShowAddBudget] = useState(false);

  // Compute expenses for current month
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthExpenses = teamData.transactions.filter(
    (t) => t.type === 'outflow' && t.whenDate.startsWith(currentMonthPrefix)
  );

  // Map category to spent amount
  const spentByCategory: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
  });

  const totalMonthlyBudget = teamData.budgets.reduce(
    (sum, b) => sum + b.monthlyLimit,
    0
  );
  const totalSpentThisMonth = Object.values(spentByCategory).reduce(
    (sum, amt) => sum + amt,
    0
  );
  const overallRemaining = totalMonthlyBudget - totalSpentThisMonth;
  const overallPercent = totalMonthlyBudget > 0 
    ? (totalSpentThisMonth / totalMonthlyBudget) * 100 
    : 0;

  const handleStartEdit = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setLimitInput(String(currentLimit));
  };

  const handleSaveBudget = (cat: string) => {
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val >= 0) {
      updateBudget(cat, val);
    }
    setEditingCategory(null);
  };

  const handleCreateBudgetCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const limit = parseFloat(newCatLimit) || 0;
    addCategory('outflow', newCatName.trim());
    updateBudget(newCatName.trim(), limit);
    setNewCatName('');
    setNewCatLimit('');
    setShowAddBudget(false);
  };

  const currentMonthLabel = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 pb-28 max-w-6xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-500" />
            Automated Monthly Budgets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor and enforce spending caps for ministry allocations in {currentMonthLabel}
          </p>
        </div>

        <button
          onClick={() => setShowAddBudget(!showAddBudget)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Set Limit</span>
        </button>
      </div>

      {/* Add New Budget Category Form */}
      {showAddBudget && (
        <form
          onSubmit={handleCreateBudgetCategory}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 animate-fade-in"
        >
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Add or Set Monthly Category Budget
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Outflow Category Name</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Outreach, Youth Camp, Media"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Monthly Limit (PHP ₱)</label>
              <input
                type="number"
                min="0"
                required
                value={newCatLimit}
                onChange={(e) => setNewCatLimit(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddBudget(false)}
              className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
            >
              Save Budget
            </button>
          </div>
        </form>
      )}

      {/* Overall Budget Progress Card */}
      <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
              Total Ministry Budget · {currentMonthLabel}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5">
              {formatPHP(totalSpentThisMonth)} / {formatPHP(totalMonthlyBudget)}
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Allowance Left</div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
                overallRemaining >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {overallRemaining >= 0
                ? `${formatPHP(overallRemaining)} left`
                : `${formatPHP(Math.abs(overallRemaining))} over cap`}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercent > 100
                ? 'bg-rose-500'
                : overallPercent > 80
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, overallPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{overallPercent.toFixed(1)}% of total monthly cap reached</span>
          <span>{teamData.budgets.length} budgeted ministry categories</span>
        </div>
      </div>

      {/* Visual Comparative Budget Chart */}
      <BudgetComparisonChart budgets={teamData.budgets} transactions={teamData.transactions} />

      {/* Category Breakdown Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Category Limits & Current Utilization
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teamData.budgets.map((b) => {
            const spent = spentByCategory[b.category] || 0;
            const remaining = b.monthlyLimit - spent;
            const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
            const isOver = spent > b.monthlyLimit;
            const isNear = !isOver && pct >= 80;

            const isEditing = editingCategory === b.category;

            return (
              <div
                key={b.category}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-colors shadow-sm space-y-3 ${
                  isOver
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                    : isNear
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {b.category}
                      </span>
                      {isOver ? (
                        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Over Budget
                        </span>
                      ) : isNear ? (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Near Limit
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Healthy
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Spent: <span className="font-bold text-slate-800 dark:text-slate-200">{formatPHP(spent)}</span>
                    </div>
                  </div>

                  {/* Limit Editor */}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={limitInput}
                        onChange={(e) => setLimitInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <button
                        onClick={() => handleSaveBudget(b.category)}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(b.category, b.monthlyLimit)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-mono"
                      title="Edit monthly budget cap"
                    >
                      <span>Cap: {formatPHP(b.monthlyLimit)}</span>
                      <Edit2 className="w-3 h-3 opacity-60" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver
                        ? 'bg-rose-500'
                        : isNear
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{pct.toFixed(0)}% used</span>
                  <span
                    className={
                      remaining >= 0
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-rose-600 dark:text-rose-400 font-bold'
                    }
                  >
                    {remaining >= 0
                      ? `${formatPHP(remaining)} remaining`
                      : `${formatPHP(Math.abs(remaining))} excess`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
