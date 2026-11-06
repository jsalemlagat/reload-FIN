import React, { useState } from 'react';
import { CashDenominationBreakdown } from '../types/finance';
import { DENOMINATION_VALUES, calculateBreakdownTotal, formatPHP } from '../utils/currency';
import { Coins, Banknote, X, Check, RotateCcw } from 'lucide-react';

interface OfferingBreakdownSheetProps {
  initialBreakdown?: CashDenominationBreakdown;
  onApply: (breakdown: CashDenominationBreakdown, total: number) => void;
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

export default function OfferingBreakdownSheet({
  initialBreakdown,
  onApply,
  onClose,
}: OfferingBreakdownSheetProps) {
  const [breakdown, setBreakdown] = useState<CashDenominationBreakdown>(
    initialBreakdown || DEFAULT_BREAKDOWN
  );

  const total = calculateBreakdownTotal(breakdown);

  const updateCount = (key: keyof CashDenominationBreakdown, delta: number) => {
    setBreakdown((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  };

  const handleInputChange = (key: keyof CashDenominationBreakdown, val: string) => {
    const num = parseInt(val, 10);
    setBreakdown((prev) => ({
      ...prev,
      [key]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const handleReset = () => {
    setBreakdown(DEFAULT_BREAKDOWN);
  };

  // Group into bills and coins
  const billKeys: (keyof CashDenominationBreakdown)[] = ['b1000', 'b500', 'b200', 'b100', 'b50', 'b20'];
  const coinKeys: (keyof CashDenominationBreakdown)[] = ['c20', 'c10', 'c5', 'c1', 'c025'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Philippine Currency Count Sheet
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official physical count tally for Church Offerings & Tithes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Total Ticker Bar */}
        <div className="px-5 py-3 bg-emerald-600 text-white flex items-center justify-between shadow-inner">
          <div>
            <div className="text-[10px] uppercase font-semibold text-emerald-100 tracking-wider">
              Calculated Total Offering
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums">
              {formatPHP(total)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 transition-colors text-emerald-50"
            title="Reset all counts to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Scrollable Denomination List */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh] divide-y divide-slate-100 dark:divide-slate-800">
          {/* Bills Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Banknote className="w-3.5 h-3.5 text-indigo-500" />
              <span>Bangko Sentral Bills (Papel)</span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {billKeys.map((key) => {
                const config = DENOMINATION_VALUES[key];
                const count = breakdown[key] || 0;
                const subtotal = count * config.value;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-[100px]">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {config.label}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        = {formatPHP(subtotal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCount(key, -1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        placeholder="0"
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-14 h-8 text-center text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => updateCount(key, 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coins Section */}
          <div className="space-y-2 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Coins (Barya)</span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {coinKeys.map((key) => {
                const config = DENOMINATION_VALUES[key];
                const count = breakdown[key] || 0;
                const subtotal = count * config.value;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-[100px]">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {config.label}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        = {formatPHP(subtotal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCount(key, -1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        placeholder="0"
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-14 h-8 text-center text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => updateCount(key, 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(breakdown, total);
              onClose();
            }}
            className="flex-1 h-11 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-transform"
          >
            <Check className="w-4 h-4" />
            Apply Total ({formatPHP(total)})
          </button>
        </div>
      </div>
    </div>
  );
}
