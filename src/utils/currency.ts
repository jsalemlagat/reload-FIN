import { CashDenominationBreakdown, Transaction } from '../types/finance';

export const DENOMINATION_VALUES: Record<keyof CashDenominationBreakdown, { label: string; value: number; type: 'bill' | 'coin' }> = {
  b1000: { label: '₱1,000 Bill', value: 1000, type: 'bill' },
  b500:  { label: '₱500 Bill',   value: 500,  type: 'bill' },
  b200:  { label: '₱200 Bill',   value: 200,  type: 'bill' },
  b100:  { label: '₱100 Bill',   value: 100,  type: 'bill' },
  b50:   { label: '₱50 Bill',    value: 50,   type: 'bill' },
  b20:   { label: '₱20 Bill',    value: 20,   type: 'bill' },
  c20:   { label: '₱20 Coin',    value: 20,   type: 'coin' },
  c10:   { label: '₱10 Coin',    value: 10,   type: 'coin' },
  c5:    { label: '₱5 Coin',     value: 5,    type: 'coin' },
  c1:    { label: '₱1 Coin',     value: 1,    type: 'coin' },
  c025:  { label: '25¢ Coin',    value: 0.25, type: 'coin' },
};

export function calculateBreakdownTotal(breakdown?: CashDenominationBreakdown): number {
  if (!breakdown) return 0;
  return Object.entries(breakdown).reduce((sum, [key, count]) => {
    const denom = DENOMINATION_VALUES[key as keyof CashDenominationBreakdown];
    return sum + (denom ? denom.value * (Number(count) || 0) : 0);
  }, 0);
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  title: string = 'Financial_Ledger'
): void {
  const headers = [
    'Transaction ID',
    'Date & Time',
    'Type',
    'Category',
    'Amount (PHP)',
    'What Purchased / Description',
    'Why Purchased / Purpose',
    'From Where / Merchant / Donor',
    'Account',
    'Made By (Logged By)',
    'Tags',
    'Has Receipt Photo',
    'Denomination Total (if Offering)',
  ];

  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.whenDate}"`,
    `"${t.type.toUpperCase()}"`,
    `"${t.category}"`,
    t.amount.toFixed(2),
    `"${(t.whatPurchased || '').replace(/"/g, '""')}"`,
    `"${(t.whyPurchased || '').replace(/"/g, '""')}"`,
    `"${(t.fromWhere || '').replace(/"/g, '""')}"`,
    `"${t.account}"`,
    `"${t.madeBy}"`,
    `"${(t.tags || []).join(', ')}"`,
    t.receiptImage ? 'YES' : 'NO',
    t.cashBreakdown ? calculateBreakdownTotal(t.cashBreakdown).toFixed(2) : 'N/A',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
