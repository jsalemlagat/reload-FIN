import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types/finance';
import { formatPHP, calculateBreakdownTotal } from '../utils/currency';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Image, 
  Plus, 
  Trash2, 
  Edit3,
  Calendar,
  X,
  MessageSquare
} from 'lucide-react';
import TransactionModal from './TransactionModal';
import { EntryCommentsModal } from './EntryCommentsModal';

export default function TransactionsView() {
  const { teamData, deleteTransaction } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingDetailTx, setViewingDetailTx] = useState<Transaction | null>(null);
  const [commentingTx, setCommentingTx] = useState<Transaction | null>(null);

  // All available categories combined
  const allCategories = useMemo(() => {
    return Array.from(new Set([...teamData.categoriesInflow, ...teamData.categoriesOutflow]));
  }, [teamData.categoriesInflow, teamData.categoriesOutflow]);

  // Filtering & Sorting logic
  const filteredTransactions = useMemo(() => {
    return teamData.transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        // Account filter
        if (accountFilter !== 'all' && t.account !== accountFilter) return false;
        // Member filter
        if (memberFilter !== 'all' && t.madeBy !== memberFilter) return false;
        // Tag filter
        if (selectedTag !== 'all' && !(t.tags || []).includes(selectedTag)) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            t.whatPurchased.toLowerCase().includes(q) ||
            t.whyPurchased.toLowerCase().includes(q) ||
            t.fromWhere.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.madeBy.toLowerCase().includes(q) ||
            (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.whenDate).getTime() - new Date(a.whenDate).getTime();
        if (sortBy === 'date-asc') return new Date(a.whenDate).getTime() - new Date(b.whenDate).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [
    teamData.transactions,
    typeFilter,
    categoryFilter,
    accountFilter,
    memberFilter,
    selectedTag,
    searchQuery,
    sortBy,
  ]);

  const hasActiveFilters =
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    memberFilter !== 'all' ||
    selectedTag !== 'all' ||
    searchQuery !== '';

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setMemberFilter('all');
    setSelectedTag('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-28 max-w-6xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Transactions & Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete record of ministry inflows, outflows, and audit trail
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTx(null);
            setModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ledger by description, purpose, store, member, or tag..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Row 1: Type Tabs & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Interactive Segmented Type Buttons */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Entries
          </button>
          <button
            onClick={() => setTypeFilter('inflow')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
              typeFilter === 'inflow'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Inflow Only
          </button>
          <button
            onClick={() => setTypeFilter('outflow')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
              typeFilter === 'outflow'
                ? 'bg-rose-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Outflow Only
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="date-desc">Newest Date</option>
            <option value="date-asc">Oldest Date</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Filter Row 2: Category, Account, Member dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Account */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">All Accounts</option>
          {teamData.accounts.map((acc) => (
            <option key={acc} value={acc}>
              {acc}
            </option>
          ))}
        </select>

        {/* Member */}
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">All Loggers (Members)</option>
          {teamData.members.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Tag chips */}
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">All Tags</option>
          {teamData.availableTags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-2 py-1 text-slate-500 hover:text-rose-600 font-medium underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transaction List Count & Subtotal */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>Showing {filteredTransactions.length} entries</span>
        <span className="font-mono">
          Net:{' '}
          <span
            className={
              filteredTransactions.reduce(
                (sum, t) => sum + (t.type === 'inflow' ? t.amount : -t.amount),
                0
              ) >= 0
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-rose-600 dark:text-rose-400 font-bold'
            }
          >
            {formatPHP(
              filteredTransactions.reduce(
                (sum, t) => sum + (t.type === 'inflow' ? t.amount : -t.amount),
                0
              )
            )}
          </span>
        </span>
      </div>

      {/* Transaction Cards */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No entries found matching criteria. Try adjusting your filters or record a new transaction.
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setViewingDetailTx(tx)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm flex items-center justify-between gap-3 cursor-pointer group"
            >
              {/* Type Icon */}
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

              {/* Transaction Main Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {tx.whatPurchased}
                  </span>
                  {tx.receiptImage && (
                    <span className="text-indigo-500" title="Has receipt photo">
                      <Image className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {tx.cashBreakdown && (
                    <span className="text-[10px] text-amber-500 font-mono" title="Offering breakdown included">
                      ₱ count
                    </span>
                  )}
                </div>

                {/* Clean unboxed metadata with separators */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{tx.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tx.fromWhere || 'Store'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tx.account}</span>
                  <span aria-hidden="true">·</span>
                  <span>logged by {tx.madeBy}</span>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="text-right shrink-0">
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
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Comment Thread Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentingTx(tx);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition shrink-0"
                title="View & add comments"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Transaction Inspection Sheet */}
      {viewingDetailTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Ledger Entry Details
              </span>
              <button
                onClick={() => setViewingDetailTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-xs uppercase font-semibold text-slate-400">
                  {viewingDetailTx.type === 'inflow' ? 'Inflow' : 'Outflow'} · {viewingDetailTx.category}
                </div>
                <div
                  className={`text-3xl font-extrabold font-mono tabular-nums mt-1 ${
                    viewingDetailTx.type === 'inflow'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {viewingDetailTx.type === 'inflow' ? '+' : '-'}
                  {formatPHP(viewingDetailTx.amount)}
                </div>
              </div>

              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">What Purchased / Description:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[260px]">
                    {viewingDetailTx.whatPurchased}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Why Purchased (Purpose):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[260px]">
                    {viewingDetailTx.whyPurchased}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">From Where (Store / Donor):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewingDetailTx.fromWhere}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">When (Date & Time):</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {new Date(viewingDetailTx.whenDate).toLocaleString('en-PH')}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Account Used:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {viewingDetailTx.account}
                  </span>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-400">Who Made Entry (Logger):</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-600 dark:text-indigo-400">
                    {viewingDetailTx.madeBy}
                  </span>
                </div>

                {viewingDetailTx.tags && viewingDetailTx.tags.length > 0 && (
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400">Tags:</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {viewingDetailTx.tags.map((t) => (
                        <span key={t} className="text-[11px] text-slate-600 dark:text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {viewingDetailTx.cashBreakdown && (
                  <div className="pt-3">
                    <div className="text-slate-500 font-semibold mb-1 flex items-center justify-between">
                      <span>Denomination Breakdown Count:</span>
                      <span className="font-mono text-emerald-600">
                        {formatPHP(calculateBreakdownTotal(viewingDetailTx.cashBreakdown))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] font-mono">
                      {Object.entries(viewingDetailTx.cashBreakdown)
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

                {viewingDetailTx.receiptImage && (
                  <div className="pt-3">
                    <div className="text-slate-500 font-semibold mb-1">Receipt Attachment:</div>
                    <img
                      src={viewingDetailTx.receiptImage}
                      alt="Receipt image"
                      className="max-h-60 rounded-xl border border-slate-200 dark:border-slate-700 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  deleteTransaction(viewingDetailTx.id);
                  setViewingDetailTx(null);
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  const tx = viewingDetailTx;
                  setViewingDetailTx(null);
                  setCommentingTx(tx);
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center gap-1.5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTx(viewingDetailTx);
                  setViewingDetailTx(null);
                  setModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry Comments Thread Modal */}
      <EntryCommentsModal
        transaction={commentingTx}
        isOpen={!!commentingTx}
        onClose={() => setCommentingTx(null)}
      />

      {/* Transaction Create / Edit Modal */}
      {modalOpen && (
        <TransactionModal
          editingTransaction={editingTx}
          onClose={() => {
            setModalOpen(false);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
}
