import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CashDenominationBreakdown, ReloadOfferingDeduction } from '../types/finance';
import { DENOMINATION_VALUES, calculateBreakdownTotal, formatPHP } from '../utils/currency';
import { 
  X, 
  Check, 
  Banknote, 
  Coins, 
  User, 
  Calendar, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  CheckCheck,
  AlertCircle,
  FileSpreadsheet,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

interface ReloadOfferingTemplateModalProps {
  onClose: () => void;
}

const DEFAULT_BREAKDOWN: CashDenominationBreakdown = {
  b1000: 0,
  b500: 0,
  b200: 0,
  b100: 0,
  b50: 0,
  b20: 0,
  c20: 0,
  c10: 0,
  c5: 0,
  c1: 0,
  c025: 0,
};

export default function ReloadOfferingTemplateModal({
  onClose,
}: ReloadOfferingTemplateModalProps) {
  const { teamData, addReloadOfferingVoucher, currentMember } = useFinance();

  const [serviceTitle, setServiceTitle] = useState('Sunday Morning Service');
  const [whenDate, setWhenDate] = useState(new Date().toISOString().slice(0, 16));
  const [breakdown, setBreakdown] = useState<CashDenominationBreakdown>(DEFAULT_BREAKDOWN);
  const [manualGross, setManualGross] = useState<string>('');
  const [useBreakdownForTotal, setUseBreakdownForTotal] = useState(true);

  // Less categories requested: speaker, love gift, food, dinner
  const [speakerAmount, setSpeakerAmount] = useState('');
  const [speakerNote, setSpeakerNote] = useState('');

  const [loveGiftAmount, setLoveGiftAmount] = useState('');
  const [loveGiftNote, setLoveGiftNote] = useState('');

  const [foodAmount, setFoodAmount] = useState('');
  const [foodNote, setFoodNote] = useState('');

  const [dinnerAmount, setDinnerAmount] = useState('');
  const [dinnerNote, setDinnerNote] = useState('');

  // Additional custom deductions
  const [customDeductions, setCustomDeductions] = useState<{ category: string; amount: string; note: string }[]>([]);

  // Reported by
  const [reportedBy, setReportedBy] = useState(currentMember || teamData.members[0] || '');
  const [account, setAccount] = useState('Cash');
  const [notes, setNotes] = useState('');

  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab for breakdown inspection: Bills vs Coins
  const [showDenomDetails, setShowDenomDetails] = useState(true);

  // Denomination calculations
  const breakdownTotal = useMemo(() => calculateBreakdownTotal(breakdown), [breakdown]);
  
  const grossTotal = useMemo(() => {
    if (useBreakdownForTotal) {
      return breakdownTotal;
    }
    const parsed = parseFloat(manualGross);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [useBreakdownForTotal, breakdownTotal, manualGross]);

  // Deductions calculations
  const totalLess = useMemo(() => {
    const s = parseFloat(speakerAmount) || 0;
    const lg = parseFloat(loveGiftAmount) || 0;
    const f = parseFloat(foodAmount) || 0;
    const d = parseFloat(dinnerAmount) || 0;
    const customSum = customDeductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    return s + lg + f + d + customSum;
  }, [speakerAmount, loveGiftAmount, foodAmount, dinnerAmount, customDeductions]);

  const netRemitted = grossTotal - totalLess;

  // Breakdown sub-sums for notes vs coins
  const notesSubtotal = useMemo(() => {
    return (
      (breakdown.b1000 || 0) * 1000 +
      (breakdown.b500 || 0) * 500 +
      (breakdown.b200 || 0) * 200 +
      (breakdown.b100 || 0) * 100 +
      (breakdown.b50 || 0) * 50 +
      (breakdown.b20 || 0) * 20
    );
  }, [breakdown]);

  const coinsSubtotal = useMemo(() => {
    return (
      (breakdown.c20 || 0) * 20 +
      (breakdown.c10 || 0) * 10 +
      (breakdown.c5 || 0) * 5 +
      (breakdown.c1 || 0) * 1 +
      (breakdown.c025 || 0) * 0.25
    );
  }, [breakdown]);

  const updateDenomCount = (key: keyof CashDenominationBreakdown, delta: number) => {
    setBreakdown((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  };

  const handleDenomInputChange = (key: keyof CashDenominationBreakdown, val: string) => {
    const num = parseInt(val, 10);
    setBreakdown((prev) => ({
      ...prev,
      [key]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const addCustomDeductionRow = () => {
    setCustomDeductions([...customDeductions, { category: '', amount: '', note: '' }]);
  };

  const removeCustomDeductionRow = (index: number) => {
    setCustomDeductions(customDeductions.filter((_, idx) => idx !== index));
  };

  const updateCustomDeduction = (index: number, field: string, val: string) => {
    setCustomDeductions(
      customDeductions.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  // Generate plain text formatted exactly according to the template
  const generateTemplateText = () => {
    return `Reload Offering:
 Total: ${formatPHP(grossTotal)}
 less: 
   categories:  
    - speaker: ${formatPHP(parseFloat(speakerAmount) || 0)}${speakerNote ? ` (${speakerNote})` : ''}
    - love gift: ${formatPHP(parseFloat(loveGiftAmount) || 0)}${loveGiftNote ? ` (${loveGiftNote})` : ''}
    - food: ${formatPHP(parseFloat(foodAmount) || 0)}${foodNote ? ` (${foodNote})` : ''}
    - dinner: ${formatPHP(parseFloat(dinnerAmount) || 0)}${dinnerNote ? ` (${dinnerNote})` : ''}
${customDeductions
  .filter((c) => c.category && parseFloat(c.amount) > 0)
  .map((c) => `    - ${c.category}: ${formatPHP(parseFloat(c.amount))}${c.note ? ` (${c.note})` : ''}`)
  .join('\n')}

 breakdown (notes and coins):
   Notes (Papel): ${formatPHP(notesSubtotal)}
    ₱1000 x ${breakdown.b1000 || 0}
    ₱500  x ${breakdown.b500 || 0}
    ₱200  x ${breakdown.b200 || 0}
    ₱100  x ${breakdown.b100 || 0}
    ₱50   x ${breakdown.b50 || 0}
    ₱20   x ${breakdown.b20 || 0}
   Coins (Barya): ${formatPHP(coinsSubtotal)}
    ₱20   x ${breakdown.c20 || 0}
    ₱10   x ${breakdown.c10 || 0}
    ₱5    x ${breakdown.c5 || 0}
    ₱1    x ${breakdown.c1 || 0}
    25¢   x ${breakdown.c025 || 0}

 Net Remitted: ${formatPHP(netRemitted)}
 reported by: ${reportedBy}
 date: ${new Date(whenDate).toLocaleDateString('en-PH', { dateStyle: 'full' })}`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateTemplateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (grossTotal <= 0) {
      setErrorMessage('Please enter an offering total or count notes and coins.');
      return;
    }

    if (!reportedBy.trim()) {
      setErrorMessage('"Reported by" is required for accountability.');
      return;
    }

    // Build deductions list
    const deductions: ReloadOfferingDeduction[] = [];
    if (parseFloat(speakerAmount) > 0) {
      deductions.push({
        category: 'Speaker',
        amount: parseFloat(speakerAmount),
        note: speakerNote.trim() || 'Speaker honorarium',
        recipient: speakerNote.trim(),
      });
    }
    if (parseFloat(loveGiftAmount) > 0) {
      deductions.push({
        category: 'Love Gift',
        amount: parseFloat(loveGiftAmount),
        note: loveGiftNote.trim() || 'Ministry love gift',
        recipient: loveGiftNote.trim(),
      });
    }
    if (parseFloat(foodAmount) > 0) {
      deductions.push({
        category: 'Food',
        amount: parseFloat(foodAmount),
        note: foodNote.trim() || 'Fellowship food',
      });
    }
    if (parseFloat(dinnerAmount) > 0) {
      deductions.push({
        category: 'Dinner',
        amount: parseFloat(dinnerAmount),
        note: dinnerNote.trim() || 'Ministry dinner',
      });
    }

    customDeductions.forEach((c) => {
      const amt = parseFloat(c.amount);
      if (c.category && amt > 0) {
        deductions.push({
          category: c.category.trim(),
          amount: amt,
          note: c.note.trim(),
        });
      }
    });

    await addReloadOfferingVoucher({
      serviceTitle: serviceTitle.trim() || 'Sunday Worship Service',
      whenDate,
      grossTotal,
      breakdown,
      deductions,
      totalLess,
      netRemitted,
      reportedBy: reportedBy.trim(),
      account,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              RO
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Reload Offering Template
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Sunday Offering Count & Immediate Deductions Reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
              title="Copy formatted template text"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Template'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Service & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Offering Service / Gathering
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="e.g. Sunday Morning Service, Midweek Gathering"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={whenDate}
                onChange={(e) => setWhenDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* Section 1: Total Offering & Breakdown (Notes and Coins) */}
          {/* ================================================================= */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                  Reload Offering: Total
                </h3>
              </div>
              <div className="text-xs font-mono">
                Notes: <span className="font-bold">{formatPHP(notesSubtotal)}</span> · Coins: <span className="font-bold">{formatPHP(coinsSubtotal)}</span>
              </div>
            </div>

            {/* Total Display */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300/80 dark:border-emerald-800/80 shadow-sm">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Gross Offering Total (Notes + Coins)
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatPHP(grossTotal)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDenomDetails(!showDenomDetails)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200"
              >
                {showDenomDetails ? 'Hide Breakdown' : 'Count Notes & Coins'}
              </button>
            </div>

            {/* Denomination Breakdown (Notes and Coins) */}
            {showDenomDetails && (
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-1">
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-indigo-500" />
                    Philippine Notes (Papel)
                  </span>
                  <span className="font-mono text-slate-500">{formatPHP(notesSubtotal)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['b1000', 'b500', 'b200', 'b100', 'b50', 'b20'] as (keyof CashDenominationBreakdown)[]).map((key) => {
                    const denom = DENOMINATION_VALUES[key];
                    const count = breakdown[key] || 0;
                    const subtotal = count * denom.value;

                    return (
                      <div
                        key={key}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{denom.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">{formatPHP(subtotal)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => updateDenomCount(key, -1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count === 0 ? '' : count}
                            placeholder="0"
                            onChange={(e) => handleDenomInputChange(key, e.target.value)}
                            className="w-full h-6 text-center text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => updateDenomCount(key, 1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coins Section */}
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-1 pt-1">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    Philippine Coins (Barya)
                  </span>
                  <span className="font-mono text-slate-500">{formatPHP(coinsSubtotal)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['c20', 'c10', 'c5', 'c1', 'c025'] as (keyof CashDenominationBreakdown)[]).map((key) => {
                    const denom = DENOMINATION_VALUES[key];
                    const count = breakdown[key] || 0;
                    const subtotal = count * denom.value;

                    return (
                      <div
                        key={key}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{denom.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">{formatPHP(subtotal)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => updateDenomCount(key, -1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count === 0 ? '' : count}
                            placeholder="0"
                            onChange={(e) => handleDenomInputChange(key, e.target.value)}
                            className="w-full h-6 text-center text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => updateDenomCount(key, 1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* Section 2: less: categories (speaker, love gift, food, dinner) */}
          {/* ================================================================= */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Less: Categories (Immediate Disbursements)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                Total Less: -{formatPHP(totalLess)}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Category 1: Speaker */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Speaker
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={speakerAmount}
                    onChange={(e) => setSpeakerAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={speakerNote}
                  onChange={(e) => setSpeakerNote(e.target.value)}
                  placeholder="Speaker name / note..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Category 2: Love Gift */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Love Gift
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={loveGiftAmount}
                    onChange={(e) => setLoveGiftAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={loveGiftNote}
                  onChange={(e) => setLoveGiftNote(e.target.value)}
                  placeholder="Recipient / ministry purpose..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Category 3: Food */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Food
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={foodAmount}
                    onChange={(e) => setFoodAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={foodNote}
                  onChange={(e) => setFoodNote(e.target.value)}
                  placeholder="Snacks / refreshments note..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Category 4: Dinner */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Dinner
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dinnerAmount}
                    onChange={(e) => setDinnerAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={dinnerNote}
                  onChange={(e) => setDinnerNote(e.target.value)}
                  placeholder="Dinner details / team meal..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Additional Custom Deductions */}
              {customDeductions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center relative"
                >
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) => updateCustomDeduction(idx, 'category', e.target.value)}
                    placeholder="Custom category name..."
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => updateCustomDeduction(idx, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateCustomDeduction(idx, 'note', e.target.value)}
                      placeholder="Note / purpose..."
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomDeductionRow(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCustomDeductionRow}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Add another deduction category
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* Net Remittance Calculation */}
          {/* ================================================================= */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                Net Cash Remitted / Deposited
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Formula: Gross Offering ({formatPHP(grossTotal)}) Less Deductions ({formatPHP(totalLess)})
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatPHP(netRemitted)}
            </div>
          </div>

          {/* ================================================================= */}
          {/* Section 3: reported by: (Required) */}
          {/* ================================================================= */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              Reported By: (Required for Official Audit Trail) *
            </label>

            <div className="flex flex-wrap gap-1.5">
              {teamData.members.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setReportedBy(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    reportedBy === m
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Enter name of member reporting / counting..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
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
            className="flex-1 h-12 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Post Reload Offering ({formatPHP(grossTotal)})
          </button>
        </div>
      </div>
    </div>
  );
}
