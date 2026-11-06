import { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, ExternalLink, MessageSquare, PlusCircle } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, WORKSPACE_ID } from '../context/AuthContext';
import { ActivityNotification } from '../types/finance';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export function NotificationCenter() {
  const { currentUser } = useAuth();
  const { permission, requestPermission } = usePushNotifications();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const notifRef = collection(db, 'workspaces', WORKSPACE_ID, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(25));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ActivityNotification[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const readBy = (data.readBy as string[]) || [];
          list.push({
            id: d.id,
            ...data,
            read: readBy.includes(currentUser.uid),
          } as ActivityNotification);
        });
        setNotifications(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `workspaces/${WORKSPACE_ID}/notifications`);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notifId: string) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'notifications', notifId);
      await updateDoc(docRef, {
        readBy: arrayUnion(currentUser.uid),
      });
    } catch (err) {
      console.warn('Could not mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    for (const n of notifications) {
      if (!n.read) {
        markAsRead(n.id);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Notifications & Activity"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Activity Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Push Permission Prompt */}
            {permission !== 'granted' && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                    Get instant push alerts for entries & comments
                  </span>
                </div>
                <button
                  onClick={requestPermission}
                  className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px] shadow-xs shrink-0 hover:bg-indigo-500 transition"
                >
                  Enable
                </button>
              </div>
            )}

            {/* Notifications Feed */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Bell className="w-6 h-6 mx-auto opacity-30" />
                  <p className="font-medium text-xs">No activity yet</p>
                  <p className="text-[10px]">Notifications appear when members post entries or reply to comments.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3.5 transition flex gap-3 items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      n.type === 'comment_reply'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {n.type === 'comment_reply' ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
