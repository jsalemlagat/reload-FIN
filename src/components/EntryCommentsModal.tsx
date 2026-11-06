import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, User, Clock, Trash2 } from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, WORKSPACE_ID } from '../context/AuthContext';
import { Transaction, EntryComment } from '../types/finance';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EntryCommentsModal({ transaction, isOpen, onClose }: Props) {
  const { currentUser, currentMember, isWorkspaceAdmin } = useAuth();
  const { notify } = usePushNotifications();
  const [comments, setComments] = useState<EntryComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !transaction) {
      setComments([]);
      return;
    }

    const commentsRef = collection(db, 'workspaces', WORKSPACE_ID, 'transactions', transaction.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EntryComment[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as EntryComment);
        });
        setComments(list);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `workspaces/${WORKSPACE_ID}/transactions/${transaction.id}/comments`
        );
      }
    );

    return () => unsubscribe();
  }, [isOpen, transaction]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (!isOpen || !transaction) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    const content = newComment.trim();
    const commentPayload = {
      transactionId: transaction.id,
      authorUid: currentUser.uid,
      authorName: currentMember?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
      authorEmail: currentUser.email || '',
      authorPhoto: currentUser.photoURL || '',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      const commentsColl = collection(db, 'workspaces', WORKSPACE_ID, 'transactions', transaction.id, 'comments');
      await addDoc(commentsColl, commentPayload);

      // Create a notification for other members
      const notifColl = collection(db, 'workspaces', WORKSPACE_ID, 'notifications');
      await addDoc(notifColl, {
        type: 'comment_reply',
        title: `Comment on ₱${transaction.amount.toLocaleString()} ${transaction.category}`,
        message: `${commentPayload.authorName}: "${content.length > 60 ? content.slice(0, 60) + '...' : content}"`,
        targetId: transaction.id,
        actorUid: currentUser.uid,
        actorName: commentPayload.authorName,
        createdAt: new Date().toISOString(),
        readBy: [currentUser.uid],
      });

      // Browser push notification trigger
      notify(`Comment by ${commentPayload.authorName}`, {
        body: content,
      });

      setNewComment('');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `workspaces/${WORKSPACE_ID}/transactions/${transaction.id}/comments`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string, authorUid: string) => {
    if (!currentUser) return;
    if (authorUid !== currentUser.uid && !isWorkspaceAdmin) {
      alert('Only the author or an admin can delete this comment.');
      return;
    }

    try {
      const commentDoc = doc(db, 'workspaces', WORKSPACE_ID, 'transactions', transaction.id, 'comments', commentId);
      await deleteDoc(commentDoc);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `workspaces/${WORKSPACE_ID}/transactions/${transaction.id}/comments/${commentId}`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Entry Discussion & Comments</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                  {comments.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {transaction.category} &middot; ₱{transaction.amount.toLocaleString()} &middot; {transaction.whatPurchased}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 text-xs flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400">
            Logged by: <strong className="text-slate-900 dark:text-white">{transaction.madeBy}</strong>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {new Date(transaction.whenDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {comments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-medium">No comments yet</p>
              <p className="text-[11px] text-slate-400">
                Ask a question, add notes, or verify this financial entry with your team.
              </p>
            </div>
          ) : (
            comments.map((c) => {
              const isMine = currentUser?.uid === c.authorUid;
              return (
                <div 
                  key={c.id} 
                  className={`flex gap-2.5 items-start text-xs ${isMine ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>

                  <div className={`max-w-[78%] rounded-2xl p-3 shadow-xs space-y-1 ${
                    isMine 
                      ? 'bg-indigo-600 text-white rounded-tr-xs' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold text-[11px] ${isMine ? 'text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {c.authorName}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-70 text-[10px]">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {(isMine || isWorkspaceAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c.id, c.authorUid)}
                            className="hover:text-rose-400 transition ml-1"
                            title="Delete comment"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {!currentUser ? (
            <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400">
              Please sign in to join the conversation and post comments.
            </div>
          ) : (
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment or verification note..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
