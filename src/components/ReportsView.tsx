import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ReportPeriod, CashDenominationBreakdown } from '../types/finance';
import { formatPHP, exportTransactionsToCSV, DENOMINATION_VALUES, calculateBreakdownTotal } from '../utils/currency';
import { 
  Download, 
  Printer, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  PieChart
} from 'lucide-react';
import { InflowOutflowTrendChart, CategoryDonutChart } from './charts/FinancialCharts';

export default function ReportsView() {
  const { teamData } = useFinance();

  const [periodType, setPeriodType] = useState<ReportPeriod>('month');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedQuarter, setSelectedQuarter] = useState<number>(
    Math.floor(new Date().getMonth() / 3) + 1
  ); // 1-4

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    return teamData.transactions.filter((tx) => {
      const d = new Date(tx.whenDate);
      const txYear = d.getFullYear();
      const txMonth = d.getMonth();

      if (periodType === 'year') {
        return txYear === selectedYear;
      }
      if (periodType === 'quarter') {
        const txQuarter = Math.floor(txMonth / 3) + 1;
        return txYear === selectedYear && txQuarter === selectedQuarter;
      }
      // Monthly
      return txYear === selectedYear && txMonth === selectedMonth;
    });
  }, [teamData.transactions, periodType, selectedYear, selectedMonth, selectedQuarter]);

  // Financial aggregates
  const totalInflow = filteredTransactions
    .filter((t) => t.type === 'inflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = filteredTransactions
    .filter((t) => t.type === 'outflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSurplus = totalInflow - totalOutflow;

  // Category distributions
  const inflowByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'inflow')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  const outflowByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'outflow')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  // Aggregate Physical Cash Denomination Count for Offerings in this period
  const periodCashBreakdown = useMemo(() => {
    const totals: Record<string, number> = {
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
    let count = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.cashBreakdown) {
        count++;
        Object.entries(tx.cashBreakdown).forEach(([k, val]) => {
          totals[k] = (totals[k] || 0) + (Number(val) || 0);
        });
      }
    });

    return { totals, offeringCount: count };
  }, [filteredTransactions]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const periodLabel = useMemo(() => {
    if (periodType === 'month') {
      return `${monthNames[selectedMonth]} ${selectedYear}`;
    }
    if (periodType === 'quarter') {
      return `Q${selectedQuarter} ${selectedYear} (${
        selectedQuarter === 1 ? 'Jan - Mar' :
        selectedQuarter === 2 ? 'Apr - Jun' :
        selectedQuarter === 3 ? 'Jul - Sep' : 'Oct - Dec'
      })`;
    }
    return `Annual Report ${selectedYear}`;
  }, [periodType, selectedYear, selectedMonth, selectedQuarter]);

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      filteredTransactions,
      `${teamData.teamName}_Report_${periodLabel}`
    );
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-28 max-w-6xl mx-auto px-4 pt-4">
      {/* Top Header - Not printed */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Financial & Tax Reporting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate monthly, quarterly, and annual balance sheets with physical offering tallies
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF Audit Report</span>
          </button>
        </div>
      </div>

      {/* Period Selection Controls - Not printed */}
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Period Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                periodType === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType('quarter')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                periodType === 'quarter'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setPeriodType('year')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
                periodType === 'year'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Annually
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 text-xs">
            {periodType === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            {periodType === 'quarter' && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value={1}>Q1 (Jan - Mar)</option>
                <option value={2}>Q2 (Apr - Jun)</option>
                <option value={3}>Q3 (Jul - Sep)</option>
                <option value={4}>Q4 (Oct - Dec)</option>
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none font-mono"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Currently reviewing:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{periodLabel}</span>
          <span>({filteredTransactions.length} recorded entries)</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Printable Financial Statement Container */}
      {/* ===================================================================== */}
      <div className="print-page bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Ministry Letterhead */}
        <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-5 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Official Ministry Finance Report
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {teamData.teamName}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Team Code: <span className="font-mono font-bold">{teamData.teamCode}</span> · Republic of the Philippines
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <div>
              Period:{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {periodLabel}
              </span>
            </div>
            <div className="text-[11px] mt-0.5">
              Generated: {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Tax & Non-Profit Compliant
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <ArrowDownLeft className="w-4 h-4" />
              Total Inflow (Receipts)
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-200 tabular-nums mt-1">
              {formatPHP(totalInflow)}
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              Tithes, offerings & gifts
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              Total Outflow (Disbursements)
            </div>
            <div className="text-2xl font-bold font-mono text-rose-800 dark:text-rose-200 tabular-nums mt-1">
              {formatPHP(totalOutflow)}
            </div>
            <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              Ministry operations & love gifts
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Net Period Position
            </div>
            <div
              className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                netSurplus >= 0
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netSurplus >= 0 ? '+' : ''}
              {formatPHP(netSurplus)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {netSurplus >= 0 ? 'Operating Surplus' : 'Operating Deficit'}
            </div>
          </div>
        </div>

        {/* Visual Graphs & Charts for Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <CategoryDonutChart
            transactions={filteredTransactions}
            type="outflow"
            title={`Outflow Distribution (${periodLabel})`}
          />
          <CategoryDonutChart
            transactions={filteredTransactions}
            type="inflow"
            title={`Inflow Sources (${periodLabel})`}
          />
        </div>

        {/* Trendline Bar Chart */}
        <InflowOutflowTrendChart transactions={teamData.transactions} />

        {/* Categorized Inflow & Outflow Breakdown Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Inflow Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              Inflow by Category
            </h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {inflowByCategory.length === 0 ? (
                <div className="p-3 text-slate-400 text-center">No inflow in this period</div>
              ) : (
                inflowByCategory.map(([cat, amt]) => {
                  const pct = totalInflow > 0 ? (amt / totalInflow) * 100 : 0;
                  return (
                    <div key={cat} className="p-2.5 flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                        <div className="text-[10px] text-slate-400">{pct.toFixed(1)}% of receipts</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPHP(amt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Outflow Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              Outflow by Category
            </h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {outflowByCategory.length === 0 ? (
                <div className="p-3 text-slate-400 text-center">No outflow in this period</div>
              ) : (
                outflowByCategory.map(([cat, amt]) => {
                  const pct = totalOutflow > 0 ? (amt / totalOutflow) * 100 : 0;
                  return (
                    <div key={cat} className="p-2.5 flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                        <div className="text-[10px] text-slate-400">{pct.toFixed(1)}% of disbursements</div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatPHP(amt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Physical Cash Offering Denomination Audit Sheet */}
        {periodCashBreakdown.offeringCount > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Philippine Currency Audit Sheet (Offering Counts)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {periodCashBreakdown.offeringCount} offering counts consolidated
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(periodCashBreakdown.totals)
                  .filter(([_, count]) => count > 0)
                  .map(([key, count]) => {
                    const denom = DENOMINATION_VALUES[key as keyof CashDenominationBreakdown];
                    if (!denom) return null;
                    const subtotal = count * denom.value;
                    return (
                      <div
                        key={key}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                      >
                        <div className="text-[10px] text-slate-400 font-sans">{denom.label}</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {count} pcs
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          = {formatPHP(subtotal)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Reload Offering Vouchers Summary */}
        {teamData.offeringVouchers && teamData.offeringVouchers.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Reload Offering Reconciliation Sheets
              </h3>
              <span className="text-[11px] text-slate-500">
                {teamData.offeringVouchers.length} offering reconciliation vouchers recorded
              </span>
            </div>

            <div className="space-y-3">
              {teamData.offeringVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Reload Offering: {voucher.serviceTitle}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(voucher.whenDate).toLocaleDateString('en-PH', { dateStyle: 'full' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Remitted</div>
                      <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatPHP(voucher.netRemitted)}
                      </div>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400">Total Offering</div>
                      <div className="font-mono font-bold text-emerald-600">
                        {formatPHP(voucher.grossTotal)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400">Less (Disbursements)</div>
                      <div className="font-mono font-bold text-rose-600">
                        -{formatPHP(voucher.totalLess)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2">
                      <div className="text-[10px] text-slate-400">Reported By</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {voucher.reportedBy}
                      </div>
                    </div>
                  </div>

                  {/* Itemized Deductions list */}
                  {voucher.deductions && voucher.deductions.length > 0 && (
                    <div className="text-xs space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Less: Categories Deducted
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono">
                        {voucher.deductions.map((d, i) => (
                          <div key={i} className="flex justify-between p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60">
                            <span className="font-sans text-slate-700 dark:text-slate-300">
                              - {d.category}{d.recipient ? ` (${d.recipient})` : ''}:
                            </span>
                            <span className="font-bold text-rose-600">
                              {formatPHP(d.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemized Audit Ledger Table */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Itemized Audit Ledger ({filteredTransactions.length} Entries)
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description & Purpose</th>
                  <th className="py-2.5 px-3">Vendor / Donor</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Logged By</th>
                  <th className="py-2.5 px-3 text-right">Amount (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap text-slate-500">
                      {new Date(tx.whenDate).toLocaleDateString('en-PH')}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`font-semibold text-[10px] uppercase ${
                          tx.type === 'inflow'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-xs">
                      <div className="font-medium truncate">{tx.whatPurchased}</div>
                      {tx.whyPurchased && (
                        <div className="text-[10px] text-slate-400 truncate">{tx.whyPurchased}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.fromWhere}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {tx.account}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.madeBy}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                      <span
                        className={
                          tx.type === 'inflow'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {tx.type === 'inflow' ? '+' : '-'}
                        {formatPHP(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Audit Sign-off Signature Blocks (For Church & Tax Records) */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-8 text-center sm:text-left">
            Certified Ministry Audit Signatures
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-slate-400 dark:border-slate-600 h-10 w-44 mx-auto mb-1" />
              <div className="font-bold text-slate-900 dark:text-white">
                {teamData.members[0] || 'Sis. Elena (Treasurer)'}
              </div>
              <div className="text-[10px] text-slate-400">Head Treasurer / Bookkeeper</div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 dark:border-slate-600 h-10 w-44 mx-auto mb-1" />
              <div className="font-bold text-slate-900 dark:text-white">
                {teamData.members[1] || 'Deacon Mark'}
              </div>
              <div className="text-[10px] text-slate-400">Audit & Counting Committee</div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 dark:border-slate-600 h-10 w-44 mx-auto mb-1" />
              <div className="font-bold text-slate-900 dark:text-white">
                {teamData.members[2] || 'Ptr. Joel'}
              </div>
              <div className="text-[10px] text-slate-400">Senior Pastor / Chairman</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
