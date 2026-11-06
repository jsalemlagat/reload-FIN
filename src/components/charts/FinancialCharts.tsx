import React, { useState } from 'react';
import { Transaction } from '../../types/finance';
import { formatPHP } from '../../utils/currency';
import { BarChart3, PieChart, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

// Color palette for categories in charts
const PALETTE = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#E11D48', // Rose
  '#D97706', // Amber
  '#0284C7', // Sky
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#0D9488', // Teal
  '#EA580C', // Orange
  '#64748B', // Slate
];

// -----------------------------------------------------------------------------
// 1. Inflow vs Outflow Trend Bar Chart (Monthly Timeline)
// -----------------------------------------------------------------------------

interface TrendChartProps {
  transactions: Transaction[];
}

export function InflowOutflowTrendChart({ transactions }: TrendChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    label: string;
    inflow: number;
    outflow: number;
    net: number;
  } | null>(null);

  // Group transactions by month for the past 6 months
  const monthlyData = React.useMemo(() => {
    const months: { key: string; label: string; inflow: number; outflow: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-PH', { month: 'short' });
      months.push({ key, label, inflow: 0, outflow: 0 });
    }

    transactions.forEach((tx) => {
      const txKey = tx.whenDate.slice(0, 7);
      const target = months.find((m) => m.key === txKey);
      if (target) {
        if (tx.type === 'inflow') {
          target.inflow += tx.amount;
        } else {
          target.outflow += tx.amount;
        }
      }
    });

    return months;
  }, [transactions]);

  const maxVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.inflow, m.outflow)),
    1000
  );

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Inflow vs Outflow Trends (6 Months)
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Inflow
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Outflow
          </span>
        </div>
      </div>

      {/* Hover info badge */}
      <div className="h-6 flex items-center justify-between text-xs font-mono">
        {hoveredBar ? (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">{hoveredBar.label}:</span>
            <span className="text-emerald-600 dark:text-emerald-400">+{formatPHP(hoveredBar.inflow)}</span>
            <span className="text-rose-600 dark:text-rose-400">-{formatPHP(hoveredBar.outflow)}</span>
            <span className="text-slate-500">
              (Net: {hoveredBar.net >= 0 ? '+' : ''}{formatPHP(hoveredBar.net)})
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Tap or hover any month bar to inspect cash flow</span>
        )}
      </div>

      {/* SVG Bar Chart */}
      <div className="h-44 sm:h-48 w-full pt-2">
        <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="40" y1="20" x2="580" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
          <line x1="40" y1="80" x2="580" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
          <line x1="40" y1="140" x2="580" y2="140" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
          <line x1="40" y1="170" x2="580" y2="170" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1.5" />

          {/* Bar Groups */}
          {monthlyData.map((m, idx) => {
            const groupWidth = (540 / monthlyData.length);
            const xCenter = 40 + idx * groupWidth + groupWidth / 2;
            const barW = 20;

            const inflowH = (m.inflow / maxVal) * 150;
            const outflowH = (m.outflow / maxVal) * 150;

            const inflowY = 170 - inflowH;
            const outflowY = 170 - outflowH;

            return (
              <g
                key={m.key}
                onMouseEnter={() =>
                  setHoveredBar({
                    label: m.label,
                    inflow: m.inflow,
                    outflow: m.outflow,
                    net: m.inflow - m.outflow,
                  })
                }
                onMouseLeave={() => setHoveredBar(null)}
                className="cursor-pointer group"
              >
                {/* Background hover pillar */}
                <rect
                  x={xCenter - barW - 6}
                  y="10"
                  width={barW * 2 + 12}
                  height="160"
                  fill="transparent"
                  className="group-hover:fill-slate-100/50 dark:group-hover:fill-slate-800/40 transition-colors rounded-lg"
                />

                {/* Inflow Bar */}
                <rect
                  x={xCenter - barW - 2}
                  y={inflowY}
                  width={barW}
                  height={Math.max(2, inflowH)}
                  rx="4"
                  className="fill-emerald-500 hover:fill-emerald-400 transition-all duration-300"
                />

                {/* Outflow Bar */}
                <rect
                  x={xCenter + 2}
                  y={outflowY}
                  width={barW}
                  height={Math.max(2, outflowH)}
                  rx="4"
                  className="fill-rose-500 hover:fill-rose-400 transition-all duration-300"
                />

                {/* Month Label */}
                <text
                  x={xCenter}
                  y="190"
                  textAnchor="middle"
                  className="text-[11px] font-medium fill-slate-500 dark:fill-slate-400 select-none"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Interactive Category Donut Chart
// -----------------------------------------------------------------------------

interface DonutChartProps {
  transactions: Transaction[];
  type?: 'outflow' | 'inflow';
  title?: string;
}

export function CategoryDonutChart({
  transactions,
  type = 'outflow',
  title,
}: DonutChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categoryTotals = React.useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [_, amt]) => sum + amt, 0);

    return { entries, total };
  }, [transactions, type]);

  const { entries, total } = categoryTotals;

  // Build SVG arc paths
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {title || (type === 'outflow' ? 'Outflow by Category' : 'Inflow Sources')}
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          {formatPHP(total)}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          No {type} records available for this period.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Graphic */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90 transform">
              {/* Background ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-slate-800/80"
              />

              {/* Slices */}
              {entries.map(([cat, amt], index) => {
                const color = PALETTE[index % PALETTE.length];
                const percent = total > 0 ? amt / total : 0;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += percent;

                const isHovered = hoveredCategory === cat;

                return (
                  <circle
                    key={cat}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400 truncate max-w-full">
                {hoveredCategory || (type === 'outflow' ? 'Total Outflow' : 'Total Inflow')}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {hoveredCategory
                  ? formatPHP(entries.find(([c]) => c === hoveredCategory)?.[1] || 0)
                  : formatPHP(total)}
              </span>
              {hoveredCategory && (
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {(((entries.find(([c]) => c === hoveredCategory)?.[1] || 0) / (total || 1)) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Category Percentage List */}
          <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto text-xs">
            {entries.map(([cat, amt], index) => {
              const color = PALETTE[index % PALETTE.length];
              const pct = total > 0 ? (amt / total) * 100 : 0;
              const isHovered = hoveredCategory === cat;

              return (
                <div
                  key={cat}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isHovered
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {cat}
                    </span>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2 font-mono">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatPHP(amt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Budget vs Actual Spending Comparison Horizontal Chart
// -----------------------------------------------------------------------------

interface BudgetChartProps {
  budgets: { category: string; monthlyLimit: number }[];
  transactions: Transaction[];
}

export function BudgetComparisonChart({ budgets, transactions }: BudgetChartProps) {
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const spentMap: Record<string, number> = {};

  transactions
    .filter((t) => t.type === 'outflow' && t.whenDate.startsWith(currentMonthPrefix))
    .forEach((t) => {
      spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
    });

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Budget vs Actual Spending Comparison
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Current Month</span>
      </div>

      <div className="space-y-3 pt-1">
        {budgets.map((b) => {
          const spent = spentMap[b.category] || 0;
          const limit = b.monthlyLimit || 1;
          const pct = Math.min(100, (spent / limit) * 100);
          const isOver = spent > limit;

          return (
            <div key={b.category} className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {b.category}
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  <span className={isOver ? 'text-rose-600 dark:text-rose-400 font-bold' : 'font-medium'}>
                    {formatPHP(spent)}
                  </span>{' '}
                  / {formatPHP(limit)}
                </span>
              </div>

              {/* Comparative Dual Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver
                      ? 'bg-rose-500'
                      : pct > 80
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
