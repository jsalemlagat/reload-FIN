import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, WORKSPACE_ID, WorkspaceMember } from './AuthContext';
import { 
  Transaction, 
  TeamSyncData, 
  BudgetLimit, 
  ViewTab, 
  ReloadOfferingVoucher 
} from '../types/finance';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface FinanceContextType {
  teamData: TeamSyncData;
  workspaceMembers: WorkspaceMember[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSynced: Date | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addReloadOfferingVoucher: (voucher: Omit<ReloadOfferingVoucher, 'id' | 'createdAt'>) => Promise<void>;
  deleteReloadOfferingVoucher: (id: string) => Promise<void>;
  updateBudget: (category: string, monthlyLimit: number) => void;
  addMember: (name: string) => void;
  updateMemberRole: (uid: string, role: 'admin' | 'encoder' | 'viewer') => Promise<void>;
  addCategory: (type: 'inflow' | 'outflow', categoryName: string) => void;
  addAccount: (accountName: string) => void;
  addTag: (tag: string) => void;
  joinTeamCode: (newCode: string) => Promise<boolean>;
  syncWithCloud: () => Promise<void>;
  currentMember: string;
  setCurrentMember: (name: string) => void;
  resetToSampleData: () => void;
}

const DEFAULT_INFLOW_CATEGORIES = ['Offerings', 'Gifts', 'Reimbursments'];
const DEFAULT_OUTFLOW_CATEGORIES = ['Groceries', 'Food', 'Practices', 'Fuel', 'Love Gift', 'Transportation', 'Speaker', 'Dinner'];
const DEFAULT_ACCOUNTS = ['Cash', 'E-Wallet', 'Bank Account'];
const DEFAULT_TAGS = ['Sunday Service', 'Youth Fellowship', 'Praise & Worship', 'Outreach', 'Admin', 'Emergency', 'Reload Offering'];

const DEFAULT_BUDGETS: BudgetLimit[] = [
  { category: 'Groceries', monthlyLimit: 8000 },
  { category: 'Food', monthlyLimit: 6000 },
  { category: 'Practices', monthlyLimit: 3000 },
  { category: 'Fuel', monthlyLimit: 4000 },
  { category: 'Love Gift', monthlyLimit: 12000 },
  { category: 'Transportation', monthlyLimit: 3500 },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { currentUser, currentMember: authMember, isWorkspaceAdmin } = useAuth();
  const { notify } = usePushNotifications();

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('bcc_reload_theme');
      if (savedTheme !== null) return savedTheme === 'dark';
      return true; // Default to dark mode
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bcc_reload_theme', darkMode ? 'dark' : 'light');
    } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Main Team / Workspace State
  const [teamData, setTeamData] = useState<TeamSyncData>({
    teamCode: 'BCC-RELOAD',
    teamName: 'BCC: Reload',
    members: ['Bem'],
    categoriesInflow: DEFAULT_INFLOW_CATEGORIES,
    categoriesOutflow: DEFAULT_OUTFLOW_CATEGORIES,
    accounts: DEFAULT_ACCOUNTS,
    availableTags: DEFAULT_TAGS,
    budgets: DEFAULT_BUDGETS,
    transactions: [],
    offeringVouchers: [],
    lastSyncedAt: Date.now(),
  });

  const [currentMember, setCurrentMember] = useState<string>(() => {
    return authMember?.displayName || 'Bem';
  });

  useEffect(() => {
    if (authMember?.displayName) {
      setCurrentMember(authMember.displayName);
    }
  }, [authMember]);

  // 1. Initialize Workspace document if needed
  useEffect(() => {
    if (!currentUser) return;
    const initWorkspace = async () => {
      const wsRef = doc(db, 'workspaces', WORKSPACE_ID);
      try {
        await setDoc(wsRef, {
          id: WORKSPACE_ID,
          name: 'BCC: Reload',
          teamCode: 'BCC-RELOAD',
          ownerUid: currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        // If it already exists, non-admin might fail write, which is expected
      }
    };
    initWorkspace();
  }, [currentUser]);

  // 2. Real-time Members listener
  useEffect(() => {
    if (!currentUser) return;
    const membersRef = collection(db, 'workspaces', WORKSPACE_ID, 'members');
    const unsubMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const membersList: WorkspaceMember[] = [];
        snapshot.forEach((d) => {
          membersList.push({ ...d.data() } as WorkspaceMember);
        });
        setWorkspaceMembers(membersList);

        // Update member names in teamData
        const memberNames = membersList.map((m) => m.displayName || m.email);
        setTeamData((prev) => ({
          ...prev,
          members: memberNames.length > 0 ? memberNames : ['Bem'],
        }));
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `workspaces/${WORKSPACE_ID}/members`);
      }
    );

    return () => unsubMembers();
  }, [currentUser]);

  // 3. Real-time Transactions listener
  useEffect(() => {
    if (!currentUser) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    const txRef = collection(db, 'workspaces', WORKSPACE_ID, 'transactions');
    const q = query(txRef, orderBy('createdAt', 'desc'));

    const unsubTx = onSnapshot(
      q,
      (snapshot) => {
        const txList: Transaction[] = [];
        snapshot.forEach((d) => {
          txList.push({ id: d.id, ...d.data() } as Transaction);
        });

        setTeamData((prev) => ({
          ...prev,
          transactions: txList,
          lastSyncedAt: Date.now(),
        }));
        setSyncStatus('synced');
        setLastSynced(new Date());
      },
      (err) => {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.GET, `workspaces/${WORKSPACE_ID}/transactions`);
      }
    );

    return () => unsubTx();
  }, [currentUser]);

  // Add Transaction to Firestore
  const addTransaction = useCallback(
    async (txInput: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!currentUser) {
        alert('Please sign in with Google or Email to add an entry.');
        return;
      }

      const txId = `tx-${Date.now()}`;
      const now = Date.now();
      const newTx: Transaction = {
        ...txInput,
        id: txId,
        encoderUid: currentUser.uid,
        encoderEmail: currentUser.email || '',
        createdAt: now,
        updatedAt: now,
      };

      try {
        setSyncStatus('syncing');
        const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'transactions', txId);
        await setDoc(docRef, newTx);

        // Dispatch real-time activity notification for all team members
        const notifColl = collection(db, 'workspaces', WORKSPACE_ID, 'notifications');
        await addDoc(notifColl, {
          type: 'entry_created',
          title: `New ${newTx.type === 'inflow' ? 'Inflow' : 'Expense'}: ₱${newTx.amount.toLocaleString()}`,
          message: `${newTx.madeBy} recorded ₱${newTx.amount.toLocaleString()} under ${newTx.category} (${newTx.whatPurchased}).`,
          targetId: txId,
          actorUid: currentUser.uid,
          actorName: newTx.madeBy,
          createdAt: new Date().toISOString(),
          readBy: [currentUser.uid],
        });

        // Trigger browser push notification
        notify(`New ${newTx.type === 'inflow' ? 'Inflow' : 'Expense'}: ₱${newTx.amount.toLocaleString()}`, {
          body: `${newTx.madeBy}: ${newTx.whatPurchased} (${newTx.category})`,
        });

        // If encoder requested email copy, trigger server email dispatch
        if (newTx.sendEmailCopy && currentUser.email) {
          try {
            await fetch('/api/send-entry-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientEmail: currentUser.email,
                entry: newTx,
                encoderName: newTx.madeBy,
                workspaceName: 'BCC: Reload',
              }),
            });
          } catch (e) {
            console.error('Failed to send email copy:', e);
          }
        }

        setSyncStatus('synced');
        setLastSynced(new Date());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.CREATE, `workspaces/${WORKSPACE_ID}/transactions/${txId}`);
      }
    },
    [currentUser, notify]
  );

  // Update Transaction in Firestore
  const updateTransaction = useCallback(
    async (tx: Transaction) => {
      try {
        setSyncStatus('syncing');
        const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'transactions', tx.id);
        await updateDoc(docRef, {
          ...tx,
          updatedAt: Date.now(),
        });
        setSyncStatus('synced');
        setLastSynced(new Date());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${WORKSPACE_ID}/transactions/${tx.id}`);
      }
    },
    []
  );

  // Delete Transaction from Firestore
  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        setSyncStatus('syncing');
        const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'transactions', id);
        await deleteDoc(docRef);
        setSyncStatus('synced');
        setLastSynced(new Date());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.DELETE, `workspaces/${WORKSPACE_ID}/transactions/${id}`);
      }
    },
    []
  );

  // Offering Vouchers (also stored as verified transactions)
  const addReloadOfferingVoucher = useCallback(
    async (voucherInput: Omit<ReloadOfferingVoucher, 'id' | 'createdAt'>) => {
      const voucherId = `vouch-${Date.now()}`;
      const voucher: ReloadOfferingVoucher = {
        ...voucherInput,
        id: voucherId,
        createdAt: Date.now(),
      };

      // Also create corresponding Inflow Transaction for the gross & outflow entries for deductions
      await addTransaction({
        type: 'inflow',
        amount: voucher.grossTotal,
        category: 'Offerings',
        whatPurchased: `Reload Offering Collection - ${voucher.serviceTitle}`,
        whyPurchased: 'Sunday Worship Offering Breakdown',
        whenDate: voucher.whenDate,
        fromWhere: 'Congregation / Sunday Service',
        account: voucher.account || 'Cash',
        madeBy: voucher.reportedBy,
        tags: ['Reload Offering', 'Sunday Service'],
        cashBreakdown: voucher.breakdown,
        notes: voucher.notes,
      });

      // Deductions
      for (const d of voucher.deductions) {
        if (d.amount > 0) {
          await addTransaction({
            type: 'outflow',
            amount: d.amount,
            category: d.category,
            whatPurchased: `Offering Less: ${d.category}${d.recipient ? ` (${d.recipient})` : ''}`,
            whyPurchased: d.note || `Immediate disbursement from offering collection`,
            whenDate: voucher.whenDate,
            fromWhere: voucher.serviceTitle,
            account: voucher.account || 'Cash',
            madeBy: voucher.reportedBy,
            tags: ['Reload Offering Deduction'],
          });
        }
      }
    },
    [addTransaction]
  );

  const deleteReloadOfferingVoucher = useCallback(async (id: string) => {
    // Delete local reference
    setTeamData((prev) => ({
      ...prev,
      offeringVouchers: (prev.offeringVouchers || []).filter((v) => v.id !== id),
    }));
  }, []);

  const updateBudget = useCallback((category: string, monthlyLimit: number) => {
    setTeamData((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.category === category ? { ...b, monthlyLimit } : b)),
    }));
  }, []);

  const addMember = useCallback((name: string) => {
    setTeamData((prev) => {
      if (prev.members.includes(name)) return prev;
      return { ...prev, members: [...prev.members, name] };
    });
  }, []);

  const updateMemberRole = useCallback(
    async (uid: string, role: 'admin' | 'encoder' | 'viewer') => {
      if (!isWorkspaceAdmin) {
        alert('Only workspace administrators can modify member roles.');
        return;
      }
      try {
        const memberRef = doc(db, 'workspaces', WORKSPACE_ID, 'members', uid);
        await updateDoc(memberRef, { role });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${WORKSPACE_ID}/members/${uid}`);
      }
    },
    [isWorkspaceAdmin]
  );

  const addCategory = useCallback((type: 'inflow' | 'outflow', categoryName: string) => {
    setTeamData((prev) => {
      if (type === 'inflow') {
        if (prev.categoriesInflow.includes(categoryName)) return prev;
        return { ...prev, categoriesInflow: [...prev.categoriesInflow, categoryName] };
      } else {
        if (prev.categoriesOutflow.includes(categoryName)) return prev;
        return { ...prev, categoriesOutflow: [...prev.categoriesOutflow, categoryName] };
      }
    });
  }, []);

  const addAccount = useCallback((accountName: string) => {
    setTeamData((prev) => {
      if (prev.accounts.includes(accountName)) return prev;
      return { ...prev, accounts: [...prev.accounts, accountName] };
    });
  }, []);

  const addTag = useCallback((tag: string) => {
    setTeamData((prev) => {
      if (prev.availableTags.includes(tag)) return prev;
      return { ...prev, availableTags: [...prev.availableTags, tag] };
    });
  }, []);

  const joinTeamCode = useCallback(async (newCode: string) => {
    setTeamData((prev) => ({
      ...prev,
      teamCode: newCode.toUpperCase(),
    }));
    return true;
  }, []);

  const syncWithCloud = useCallback(async () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setLastSynced(new Date());
    }, 400);
  }, []);

  const resetToSampleData = useCallback(() => {
    setTeamData((prev) => ({
      ...prev,
      transactions: [],
      offeringVouchers: [],
      members: ['Bem'],
    }));
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        teamData,
        workspaceMembers,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        syncStatus,
        lastSynced,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addReloadOfferingVoucher,
        deleteReloadOfferingVoucher,
        updateBudget,
        addMember,
        updateMemberRole,
        addCategory,
        addAccount,
        addTag,
        joinTeamCode,
        syncWithCloud,
        currentMember,
        setCurrentMember,
        resetToSampleData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
