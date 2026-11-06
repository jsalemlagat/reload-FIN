import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Transaction, 
  TransactionType, 
  CashDenominationBreakdown 
} from '../types/finance';
import { calculateBreakdownTotal, formatPHP } from '../utils/currency';
import OfferingBreakdownSheet from './OfferingBreakdownSheet';
import ReceiptScannerModal from './ReceiptScannerModal';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Check, 
  Camera, 
  Banknote, 
  Tag as TagIcon, 
  Store, 
  CreditCard, 
  User, 
  FileText, 
  Calendar,
  AlertCircle,
  Plus,
  Mail
} from 'lucide-react';

interface TransactionModalProps {
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onClose: () => void;
}

export default function TransactionModal({
  initialType = 'outflow',
  editingTransaction,
  onClose,
}: TransactionModalProps) {
  const { 
    teamData, 
    addTransaction, 
    updateTransaction, 
    currentMember,
    addCategory,
    addAccount,
    addTag,
    addMember
  } = useFinance();

  const { currentUser } = useAuth();
  
  const LOCAL_DRAFT_KEY = 'bcc_reload_tx_draft';

  const [sendEmailCopy, setSendEmailCopy] = useState<boolean>(() => {
    if (editingTransaction?.sendEmailCopy !== undefined) return editingTransaction.sendEmailCopy;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sendEmailCopy !== undefined) return parsed.sendEmailCopy;
      }
    } catch {}
    return currentUser?.email ? true : false;
  });

  // Restore or initialize states with localStorage draft fallback if not editing
  const [type, setType] = useState<TransactionType>(() => {
    if (editingTransaction) return editingTransaction.type;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.type) return parsed.type;
      }
    } catch {}
    return initialType;
  });

  const [amount, setAmount] = useState<string>(() => {
    if (editingTransaction) return String(editingTransaction.amount);
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.amount !== undefined) return String(parsed.amount);
      }
    } catch {}
    return '';
  });

  const [category, setCategory] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.category;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.category) return parsed.category;
      }
    } catch {}
    return initialType === 'inflow' ? 'Offerings' : 'Groceries';
  });

  const [whatPurchased, setWhatPurchased] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.whatPurchased;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whatPurchased) return parsed.whatPurchased;
      }
    } catch {}
    return '';
  });

  const [whyPurchased, setWhyPurchased] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.whyPurchased;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whyPurchased) return parsed.whyPurchased;
      }
    } catch {}
    return '';
  });

  const [whenDate, setWhenDate] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.whenDate;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whenDate) return parsed.whenDate;
      }
    } catch {}
    return new Date().toISOString().slice(0, 16);
  });

  const [fromWhere, setFromWhere] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.fromWhere;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fromWhere) return parsed.fromWhere;
      }
    } catch {}
    return '';
  });

  const [account, setAccount] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.account;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.account) return parsed.account;
      }
    } catch {}
    return 'Cash';
  });

  const [madeBy, setMadeBy] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.madeBy;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.madeBy) return parsed.madeBy;
      }
    } catch {}
    return currentMember;
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (editingTransaction) return editingTransaction.tags;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedTags) return parsed.selectedTags;
      }
    } catch {}
    return [];
  });

  const [cashBreakdown, setCashBreakdown] = useState<CashDenominationBreakdown | undefined>(() => {
    if (editingTransaction) return editingTransaction.cashBreakdown;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cashBreakdown) return parsed.cashBreakdown;
      }
    } catch {}
    return undefined;
  });

  const [receiptImage, setReceiptImage] = useState<string | undefined>(() => {
    if (editingTransaction) return editingTransaction.receiptImage;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.receiptImage) return parsed.receiptImage;
      }
    } catch {}
    return undefined;
  });

  // Autosave draft when form values change (if not editing)
  useEffect(() => {
    if (editingTransaction) return;
    try {
      const draft = {
        type,
        amount,
        category,
        whatPurchased,
        whyPurchased,
        whenDate,
        fromWhere,
        account,
        madeBy,
        selectedTags,
        cashBreakdown,
        receiptImage,
        sendEmailCopy,
      };
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [type, amount, category, whatPurchased, whyPurchased, whenDate, fromWhere, account, madeBy, selectedTags, cashBreakdown, receiptImage, sendEmailCopy, editingTransaction]);

  // Modals for sub-flows
  const [showBreakdownSheet, setShowBreakdownSheet] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Inline custom adds
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync category when switching type
  useEffect(() => {
    if (!editingTransaction) {
      if (type === 'inflow') {
        setCategory(teamData.categoriesInflow[0] || 'Offerings');
      } else {
        setCategory(teamData.categoriesOutflow[0] || 'Groceries');
      }
    }
  }, [type, editingTransaction, teamData.categoriesInflow, teamData.categoriesOutflow]);

  const activeCategories = type === 'inflow' 
    ? teamData.categoriesInflow 
    : teamData.categoriesOutflow;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(type, newCategoryName.trim());
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    addTag(newTagName.trim());
    if (!selectedTags.includes(newTagName.trim())) {
      setSelectedTags([...selectedTags, newTagName.trim()]);
    }
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleBreakdownApplied = (breakdown: CashDenominationBreakdown, total: number) => {
    setCashBreakdown(breakdown);
    setAmount(total.toFixed(2));
    setAccount('Cash'); // Offering physical count is cash
  };

  const handleScanExtracted = (result: any, imageBase64: string) => {
    setReceiptImage(imageBase64);
    if (result.amount) setAmount(String(result.amount));
    if (result.whatPurchased) setWhatPurchased(result.whatPurchased);
    if (result.whyPurchased) setWhyPurchased(result.whyPurchased);
    if (result.fromWhere) setFromWhere(result.fromWhere);
    if (result.date) {
      // Convert YYYY-MM-DD to datetime-local
      setWhenDate(`${result.date}T12:00`);
    }
    if (result.category) {
      if (activeCategories.includes(result.category)) {
        setCategory(result.category);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!whatPurchased.trim()) {
      setFormError('Please describe what was purchased or received.');
      return;
    }

    if (!madeBy.trim()) {
      setFormError('"Who made the entry" is required for accountability.');
      return;
    }

    const payload = {
      type,
      amount: numAmount,
      category,
      whatPurchased: whatPurchased.trim(),
      whyPurchased: whyPurchased.trim() || 'General ministry record',
      whenDate,
      fromWhere: fromWhere.trim() || 'Not specified',
      account,
      madeBy: madeBy.trim(),
      tags: selectedTags,
      cashBreakdown: category === 'Offerings' ? cashBreakdown : undefined,
      receiptImage,
      sendEmailCopy,
    };

    if (editingTransaction) {
      await updateTransaction({
        ...editingTransaction,
        ...payload,
      });
    } else {
      await addTransaction(payload);
      try {
        localStorage.removeItem('bcc_reload_tx_draft');
      } catch {}
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'Edit Transaction' : 'Record New Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Money inflow & outflow tracking with full ministry audit trail
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Selector (Inflow vs Outflow) */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('inflow')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                type === 'inflow'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="text-base">↓</span>
              Money Inflow (Offerings / Gifts)
            </button>
            <button
              type="button"
              onClick={() => setType('outflow')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                type === 'outflow'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="text-base">↑</span>
              Money Outflow (Expenses)
            </button>
          </div>

          {/* Amount & Currency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                How Much? (Amount in PHP ₱) *
              </label>
              {category === 'Offerings' && (
                <button
                  type="button"
                  onClick={() => setShowBreakdownSheet(true)}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  {cashBreakdown
                    ? `Breakdown: ${formatPHP(calculateBreakdownTotal(cashBreakdown))}`
                    : 'Count Bills & Coins'}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-xl font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category *
              </label>
              {!isAddingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Category
                </button>
              ) : null}
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-2 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      category === cat
                        ? type === 'inflow'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* What was purchased */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              What was purchased / Item details *
            </label>
            <input
              type="text"
              required
              value={whatPurchased}
              onChange={(e) => setWhatPurchased(e.target.value)}
              placeholder="e.g. Communion bread, guitar strings, youth food, etc."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Why was it purchased */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Why was it purchased? (Purpose / Ministry reason)
            </label>
            <input
              type="text"
              value={whyPurchased}
              onChange={(e) => setWhyPurchased(e.target.value)}
              placeholder="e.g. Sunday Service worship preparation, Outreach mission"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* From Where & When (2-column on tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                From Where / Vendor / Store / Donor
              </label>
              <input
                type="text"
                value={fromWhere}
                onChange={(e) => setFromWhere(e.target.value)}
                placeholder="e.g. SM Supermarket, Shell, Bro. Mark"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                When? (Date & Time) *
              </label>
              <input
                type="datetime-local"
                required
                value={whenDate}
                onChange={(e) => setWhenDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* From Which Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              From Which Account? *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {teamData.accounts.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setAccount(acc)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    account === acc
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* Who Made the Entry (REQUIRED) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Who Made the Entry? (Required for Audit Trail) *
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teamData.members.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMadeBy(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    madeBy === m
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Active logger:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {madeBy || 'Please select a member'}
              </span>
            </div>
          </div>

          {/* Custom Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                Custom Tags for Detailed Analysis
              </label>
              {!isAddingTag ? (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New Tag
                </button>
              ) : null}
            </div>

            {isAddingTag ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Building Fund"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="px-2 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {teamData.availableTags.map((t) => {
                  const isSelected = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToggleTag(t)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Encoder Email Voucher Copy Option */}
          <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Email copy to encoder
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser?.email ? (
                    <>Send official voucher summary to <strong className="text-slate-700 dark:text-slate-300">{currentUser.email}</strong></>
                  ) : (
                    <>Sign in to automatically receive an official voucher copy in your email</>
                  )}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={sendEmailCopy}
                onChange={(e) => setSendEmailCopy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Receipt Camera Attachment & AI Scanner */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                Receipt Image & Camera Capture
              </span>
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                {receiptImage ? 'Re-scan / Change' : 'Scan Receipt with AI'}
              </button>
            </div>

            {receiptImage ? (
              <div className="relative inline-block mt-1">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="h-24 w-24 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setReceiptImage(undefined)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Capture thermal receipts, invoices, or delivery slips. AI will read the amount and store automatically.
              </p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`flex-1 h-12 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-transform ${
              type === 'inflow'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            <Check className="w-4 h-4" />
            {editingTransaction ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Sub-sheet: Offering Cash Denomination Breakdown */}
      {showBreakdownSheet && (
        <OfferingBreakdownSheet
          initialBreakdown={cashBreakdown}
          onApply={handleBreakdownApplied}
          onClose={() => setShowBreakdownSheet(false)}
        />
      )}

      {/* Sub-modal: Receipt Scanner with Gemini AI OCR */}
      {showScannerModal && (
        <ReceiptScannerModal
          onApplyExtracted={handleScanExtracted}
          onClose={() => setShowScannerModal(false)}
        />
      )}
    </div>
  );
}
