import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export type UserRole = 'admin' | 'encoder' | 'viewer';

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  joinedAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentMember: WorkspaceMember | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isWorkspaceAdmin: boolean;
  isWorkspaceEncoder: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const WORKSPACE_ID = 'bcc-reload';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize or synchronize member profile in workspace
  const syncWorkspaceMember = async (user: User) => {
    const memberRef = doc(db, 'workspaces', WORKSPACE_ID, 'members', user.uid);
    try {
      const snap = await getDoc(memberRef);
      if (!snap.exists()) {
        // Default role: admin for the primary owner (thejscl@gmail.com), encoder for others
        const initialRole: UserRole = user.email === 'thejscl@gmail.com' ? 'admin' : 'encoder';
        const newMember: WorkspaceMember = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Ministry Worker',
          photoURL: user.photoURL || '',
          role: initialRole,
          joinedAt: new Date().toISOString(),
        };
        await setDoc(memberRef, newMember);
        setCurrentMember(newMember);
      } else {
        setCurrentMember(snap.data() as WorkspaceMember);
      }
    } catch (err) {
      console.error('Error syncing workspace member:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncWorkspaceMember(user);

        // Listen in real time to member role updates
        const memberRef = doc(db, 'workspaces', WORKSPACE_ID, 'members', user.uid);
        const unsubMember = onSnapshot(memberRef, (docSnap) => {
          if (docSnap.exists()) {
            setCurrentMember(docSnap.data() as WorkspaceMember);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `workspaces/${WORKSPACE_ID}/members/${user.uid}`);
        });

        setLoading(false);
        return () => unsubMember();
      } else {
        setCurrentMember(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncWorkspaceMember(result.user);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await syncWorkspaceMember(result.user);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
      await syncWorkspaceMember(result.user);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentMember(null);
  };

  const isWorkspaceAdmin = currentMember?.role === 'admin';
  const isWorkspaceEncoder = currentMember?.role === 'encoder' || isWorkspaceAdmin;
  const canEdit = isWorkspaceEncoder;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentMember,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        isWorkspaceAdmin,
        isWorkspaceEncoder,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
