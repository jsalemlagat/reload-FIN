export type TransactionType = 'inflow' | 'outflow';

export interface CashDenominationBreakdown {
  b1000: number; // ₱1,000 bills
  b500: number;  // ₱500 bills
  b200: number;  // ₱200 bills
  b100: number;  // ₱100 bills
  b50: number;   // ₱50 bills
  b20: number;   // ₱20 bills
  c20: number;   // ₱20 coins
  c10: number;   // ₱10 coins
  c5: number;    // ₱5 coins
  c1: number;    // ₱1 coins
  c025: number;  // ₱0.25 coins (25 centavos)
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  whatPurchased: string; // What was purchased / item description
  whyPurchased: string;  // Reason / purpose
  whenDate: string;      // ISO date-time string YYYY-MM-DDTHH:mm
  fromWhere: string;     // Vendor, merchant, store, or donor source
  account: string;       // Cash, GCash, Maya, Bank, etc.
  madeBy: string;        // REQUIRED: Who made the entry
  tags: string[];        // Custom tags for detailed analysis
  cashBreakdown?: CashDenominationBreakdown; // Detailed offering cash count
  receiptImage?: string; // Captured photo / receipt attachment (data URL)
  notes?: string;
  encoderUid?: string;   // Firebase Auth UID of who created
  encoderEmail?: string; // Encoder email for copy
  sendEmailCopy?: boolean; // Whether an email copy was requested
  createdAt: number;
  updatedAt: number;
}

export interface EntryComment {
  id: string;
  transactionId: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface ActivityNotification {
  id: string;
  type: 'entry_created' | 'comment_reply';
  title: string;
  message: string;
  targetId: string;
  actorUid: string;
  actorName: string;
  createdAt: string;
  read?: boolean;
}

export interface BudgetLimit {
  category: string;
  monthlyLimit: number;
}

export interface ReloadOfferingDeduction {
  category: 'Speaker' | 'Love Gift' | 'Food' | 'Dinner' | string;
  amount: number;
  note?: string;
  recipient?: string;
}

export interface ReloadOfferingVoucher {
  id: string;
  serviceTitle: string; // e.g. "Sunday Morning Service"
  whenDate: string;     // ISO date
  grossTotal: number;   // Total collected
  breakdown: CashDenominationBreakdown; // Notes & Coins breakdown
  deductions: ReloadOfferingDeduction[]; // Less: Speaker, Love Gift, Food, Dinner
  totalLess: number;    // Sum of deductions
  netRemitted: number;  // Gross Total - Total Less
  reportedBy: string;   // REQUIRED: who reported/counted
  account: string;      // Cash or Account
  notes?: string;
  createdAt: number;
}

export interface TeamSyncData {
  teamCode: string;
  teamName: string;
  members: string[];
  transactions: Transaction[];
  budgets: BudgetLimit[];
  categoriesInflow: string[];
  categoriesOutflow: string[];
  accounts: string[];
  availableTags: string[];
  offeringVouchers?: ReloadOfferingVoucher[];
  lastSyncedAt: number;
}

export type ViewTab = 'dashboard' | 'transactions' | 'reports' | 'budgets' | 'settings';

export type ReportPeriod = 'month' | 'quarter' | 'year' | 'custom';
