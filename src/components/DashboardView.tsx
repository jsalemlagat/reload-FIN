import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types/finance';
import { formatPHP, calculateBreakdownTotal } from '../utils/currency';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Plus, 
  Minus, 
  Camera, 
  Coins, 
  Search, 
  Calendar, 
  CreditCard,
  User,
  Image,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import TransactionModal from './TransactionModal';
import OfferingBreakdownSheet from './OfferingBreakdownSheet';
import ReceiptScannerModal from './ReceiptScannerModal';
import ReloadOfferingTemplateModal from './ReloadOfferingTemplateModal';
import { InflowOutflowTrendChart, CategoryDonutChart } from './charts/FinancialCharts';

export default function DashboardView() {
  const { teamData, deleteTransaction, addTransaction } = useFinance();

  // Modal triggers
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [showDirectOfferingSheet, setShowDirectOfferingSheet] = useState(false);
  const [showDirectScanner, setShowDirectScanner] = useState(false);
  const [showOfferingTemplate, setShowOfferingTemplate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartTab, setActiveChartTab] = useState<'both' | 'trends' | 'breakdown'>('both');

  // Computations
  const totalInflow = teamData.transactions
    .filter((t) => t.type === 'inflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = teamData.transactions
    .filter((t) => t.type === 'outflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  // Breakdown by Account
  const accountBalances = teamData.accounts.map((acc) => {
    const inflow = teamData.transactions
      .filter((t) => t.account === acc && t.type === 'inflow')
      .reduce((sum, t) => sum + t.amount, 0);
    const outflow = teamData.transactions
      .filter((t) => t.account === acc && t.type === 'outflow')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      account: acc,
      balance: inflow - outflow,
    };
  });


  // Filtered transactions for recent list
  const recentTransactions = teamData.transactions
    .filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.whatPurchased.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.fromWhere.toLowerCase().includes(q) ||
        t.madeBy.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    })
    .slice(0, 10);

  const handleApplyDirectOffering = (breakdown: any, total: number) => {
    addTransaction({
      type: 'inflow',
      amount: total,
      category: 'Offerings',
      whatPurchased: 'Sunday Service Offering Count',
      whyPurchased: 'Congregational Worship Offering',
      whenDate: new Date().toISOString().slice(0, 16),
      fromWhere: 'Sanctuary Main Hall',
      account: 'Cash',
      madeBy: teamData.members[0] || 'Treasurer',
      tags: ['Sunday Service'],
      cashBreakdown: breakdown,
    });
  };

  const handleApplyDirectScan = (result: any, imageBase64: string) => {
    addTransaction({
      type: 'outflow',
      amount: result.amount || 0,
      category: result.category || 'Groceries',
      whatPurchased: result.whatPurchased || 'Scanned Receipt Item',
      whyPurchased: result.whyPurchased || 'Ministry expense',
      whenDate: (result.date ? `${result.date}T12:00` : new Date().toISOString().slice(0, 16)),
      fromWhere: result.fromWhere || 'Merchant',
      account: 'Cash',
      madeBy: teamData.members[0] || 'Treasurer',
      tags: ['Receipt'],
      receiptImage: imageBase64,
    });
  };

  return (
    <div className="space-y-5 pb-24 max-w-6xl mx-auto px-4 pt-4">
      {/* Hero Financial Overview Card */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200/90">
              {teamData.teamName} · Ministry Treasury
            </span>
          </div>
          <span className="text-xs text-indigo-200 font-mono">
            PHP (₱)
          </span>
        </div>

        {/* Net Treasury Balance */}
        <div className="mb-6">
          <div className="text-xs text-indigo-200/80 font-medium">Net Available Balance</div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums mt-0.5">
            {formatPHP(netBalance)}
          </div>
        </div>

        {/* Inflow vs Outflow KPI Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Total Inflow
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tabular-nums">
              +{formatPHP(totalInflow)}
            </div>
            <div className="text-[10px] text-white/60 mt-0.5">
              Offerings, Gifts & Returns
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Total Outflow
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 tabular-nums">
              -{formatPHP(totalOutflow)}
            </div>
            <div className="text-[10px] text-white/60 mt-0.5">
              Groceries, Fuel, Love Gifts
            </div>
          </div>
        </div>
      </div>

      {/* Account Balance Strips (Cash, GCash, Maya, Bank) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {accountBalances.map((item) => (
          <div
            key={item.account}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate">{item.account}</span>
              <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1">
              {formatPHP(item.balance)}
            </div>
          </div>
        ))}
      </div>

      {/* Dedicated Reload Offering Template Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-lg shadow-emerald-700/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-sm border border-white/20 shadow-sm shrink-0">
            RO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 bg-emerald-700/50 px-2 py-0.5 rounded-full">
                Quick Template
              </span>
              <span className="text-xs font-semibold text-white/90">
                Reload Offering
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Total, Less Deductions & Denomination Count
            </div>
            <div className="text-[11px] text-white/80 mt-0.5">
              Speaker · Love Gift · Food · Dinner · Notes & Coins · Reported by
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOfferingTemplate(true)}
          className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shrink-0 shadow-md active:scale-95 transition-all text-center"
        >
          Use Reload Template
        </button>
      </div>

      {/* Quick Action Dock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setModalType('inflow')}
          className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-600/15 active:scale-95 transition-all text-xs font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span>+ Inflow / Offering</span>
        </button>

        <button
          onClick={() => setModalType('outflow')}
          className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center gap-1.5 shadow-md shadow-rose-600/15 active:scale-95 transition-all text-xs font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-rose-700/60 flex items-center justify-center">
            <Minus className="w-5 h-5" />
          </div>
          <span>- Outflow / Expense</span>
        </button>

        <button
          onClick={() => setShowDirectScanner(true)}
          className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex flex-col items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15 active:scale-95 transition-all text-xs font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-700/60 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <span>Scan Receipt AI</span>
        </button>

        <button
          onClick={() => setShowDirectOfferingSheet(true)}
          className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white flex flex-col items-center justify-center gap-1.5 shadow-md shadow-amber-600/15 active:scale-95 transition-all text-xs font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-amber-700/60 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <span>Count Bills & Coins</span>
        </button>
      </div>

      {/* Visual Analytics & Financial Charts */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Visual Analytics & Cash Flow Charts
            </h2>
          </div>

          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px]">
            <button
              onClick={() => setActiveChartTab('both')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeChartTab === 'both'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Charts
            </button>
            <button
              onClick={() => setActiveChartTab('trends')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeChartTab === 'trends'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveChartTab('breakdown')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeChartTab === 'breakdown'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(activeChartTab === 'both' || activeChartTab === 'trends') && (
            <div className={activeChartTab === 'both' ? 'lg:col-span-1' : 'col-span-full'}>
              <InflowOutflowTrendChart transactions={teamData.transactions} />
            </div>
          )}
          {(activeChartTab === 'both' || activeChartTab === 'breakdown') && (
            <div className={activeChartTab === 'both' ? 'lg:col-span-1' : 'col-span-full'}>
              <CategoryDonutChart transactions={teamData.transactions} type="outflow" />
            </div>
          )}
        </div>
      </div>

      {/* Recent Ledger Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Financial Entries
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {teamData.transactions.length} total records
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by item, vendor, purpose, or tag..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Transactions Tap-List */}
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No transactions match your search. Tap "+ Inflow" or "- Outflow" to record your first entry.
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTxForDetail(tx)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
              >
                {/* Left Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'inflow'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {tx.type === 'inflow' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                {/* Middle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {tx.whatPurchased}
                    </span>
                    {tx.receiptImage && (
                      <span className="text-[10px] text-indigo-500 flex items-center" title="Has receipt photo">
                        <Image className="w-3 h-3" />
                      </span>
                    )}
                    {tx.cashBreakdown && (
                      <span className="text-[10px] text-amber-500 font-mono" title="Has denomination breakdown">
                        ₱ tally
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed metadata with separators */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span>{tx.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tx.fromWhere || 'Store'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tx.account}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">by {tx.madeBy}</span>
                  </div>
                </div>

                {/* Right Amount */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div
                      className={`text-sm font-bold font-mono tabular-nums ${
                        tx.type === 'inflow'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'inflow' ? '+' : '-'}
                      {formatPHP(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(tx.whenDate).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction Detail Bottom Sheet Modal */}
      {selectedTxForDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Transaction Record Details
              </div>
              <button
                onClick={() => setSelectedTxForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Header Amount */}
              <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-xs uppercase font-semibold text-slate-400">
                  {selectedTxForDetail.type === 'inflow' ? 'Money Inflow' : 'Money Outflow'} · {selectedTxForDetail.category}
                </div>
                <div
                  className={`text-3xl font-extrabold font-mono tabular-nums mt-1 ${
                    selectedTxForDetail.type === 'inflow'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {selectedTxForDetail.type === 'inflow' ? '+' : '-'}
                  {formatPHP(selectedTxForDetail.amount)}
                </div>
              </div>

              {/* Data Fields */}
              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">What Purchased:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[260px]">
                    {selectedTxForDetail.whatPurchased}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Why Purchased (Purpose):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[260px]">
                    {selectedTxForDetail.whyPurchased || 'N/A'}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">From Where (Store / Donor):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedTxForDetail.fromWhere}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">When (Date & Time):</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {new Date(selectedTxForDetail.whenDate).toLocaleString('en-PH')}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Account Used:</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {selectedTxForDetail.account}
                  </span>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400">Who Made the Entry:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedTxForDetail.madeBy}
                  </span>
                </div>

                {selectedTxForDetail.tags && selectedTxForDetail.tags.length > 0 && (
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400">Tags:</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {selectedTxForDetail.tags.map((t) => (
                        <span key={t} className="text-[11px] text-slate-600 dark:text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offering Cash Breakdown Details if available */}
                {selectedTxForDetail.cashBreakdown && (
                  <div className="pt-3">
                    <div className="text-slate-500 font-semibold mb-1 flex items-center justify-between">
                      <span>Physical Cash Denomination Count:</span>
                      <span className="font-mono text-emerald-600">
                        {formatPHP(calculateBreakdownTotal(selectedTxForDetail.cashBreakdown))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] font-mono">
                      {Object.entries(selectedTxForDetail.cashBreakdown)
                        .filter(([_, count]) => (count as number) > 0)
                        .map(([k, count]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-400">{k.toUpperCase()}:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {count as number} pcs
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Attached Receipt Photo */}
                {selectedTxForDetail.receiptImage && (
                  <div className="pt-3">
                    <div className="text-slate-500 font-semibold mb-1">Attached Receipt Photo:</div>
                    <img
                      src={selectedTxForDetail.receiptImage}
                      alt="Attached receipt"
                      className="max-h-60 rounded-xl border border-slate-200 dark:border-slate-700 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  deleteTransaction(selectedTxForDetail.id);
                  setSelectedTxForDetail(null);
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Delete Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTx(selectedTxForDetail);
                  setSelectedTxForDetail(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Entry Modal */}
      {(modalType || editingTx) && (
        <TransactionModal
          initialType={modalType || 'outflow'}
          editingTransaction={editingTx}
          onClose={() => {
            setModalType(null);
            setEditingTx(null);
          }}
        />
      )}

      {/* Direct Offering Sheet */}
      {showDirectOfferingSheet && (
        <OfferingBreakdownSheet
          onApply={handleApplyDirectOffering}
          onClose={() => setShowDirectOfferingSheet(false)}
        />
      )}

      {/* Direct Scanner Modal */}
      {showDirectScanner && (
        <ReceiptScannerModal
          onApplyExtracted={handleApplyDirectScan}
          onClose={() => setShowDirectScanner(false)}
        />
      )}

      {/* Reload Offering Template Modal */}
      {showOfferingTemplate && (
        <ReloadOfferingTemplateModal
          onClose={() => setShowOfferingTemplate(false)}
        />
      )}
    </div>
  );
}
