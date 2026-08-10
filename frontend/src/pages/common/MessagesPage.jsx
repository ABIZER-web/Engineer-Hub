// frontend/src/pages/common/MessagesPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyConversations, getConversationMessages, sendMessage } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
import { Menu, MessageCircle, Send, ArrowLeft, Loader2, ShoppingBag, Briefcase } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const POLL_MS = 5000;

const CONTEXT_ICON = { marketplace: ShoppingBag, freelance: Briefcase, general: MessageCircle };

const MessagesPage = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(conversationId || null);
  const [messages, setMessages] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const isMounted = useRef(true);

  const fetchList = useCallback(async () => {
    try {
      const res = await getMyConversations();
      if (isMounted.current) setConversations(res.conversations || []);
    } catch { /* silent on poll */ }
    finally { if (isMounted.current) setLoadingList(false); }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchList();
    const id = setInterval(fetchList, POLL_MS);
    return () => { isMounted.current = false; clearInterval(id); };
  }, [fetchList]);

  const fetchThread = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await getConversationMessages(id);
      if (isMounted.current) { setMessages(res.messages || []); setActiveConvo(res.conversation); }
    } catch (e) { toast.error(e.message); }
    finally { if (isMounted.current) setLoadingThread(false); }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingThread(true);
    fetchThread(activeId);
    const id = setInterval(() => fetchThread(activeId), POLL_MS);
    return () => clearInterval(id);
  }, [activeId, fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (id) => {
    setActiveId(id);
    navigate(`/messages/${id}`, { replace: true });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      const res = await sendMessage(activeId, text);
      setMessages(prev => [...prev, res.message]);
      fetchList();
    } catch (e) {
      toast.error(e.message);
      setDraft(text);
    } finally { setSending(false); }
  };

  const otherParticipant = (convo) => convo?.participants?.find(p => p._id !== user?._id);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <h1 className="text-base font-black text-emerald-600 flex items-center gap-1.5"><MessageCircle size={16} />Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden max-w-6xl mx-auto w-full">
          {/* Conversation list */}
          <div className={`w-full sm:w-80 flex-shrink-0 border-r border-emerald-100/30 overflow-y-auto ${activeId ? 'hidden sm:block' : 'block'}`}>
            {loadingList ? (
              <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/80 rounded-xl animate-pulse" />)}</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-blue-900/40">No conversations yet</p>
                <p className="text-[10px] text-blue-900/30 mt-1">Message a seller or freelancer to start one</p>
              </div>
            ) : conversations.map(c => {
              const other = otherParticipant(c);
              const Icon = CONTEXT_ICON[c.contextType] || MessageCircle;
              return (
                <button key={c._id} onClick={() => openConversation(c._id)}
                  className={`w-full text-left px-4 py-3 border-b border-emerald-50/70 hover:bg-emerald-50/40 transition-colors ${activeId === c._id ? 'bg-emerald-50/60' : ''}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-black text-blue-900 truncate">{other ? `${other.firstName} ${other.lastName || ''}` : 'Unknown'}</p>
                    {c.unreadCount > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">{c.unreadCount}</span>}
                  </div>
                  {c.contextLabel && (
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 truncate mb-0.5"><Icon size={9} />{c.contextLabel}</p>
                  )}
                  <p className="text-[11px] text-blue-900/40 font-medium truncate">{c.lastMessageText || 'No messages yet'}</p>
                </button>
              );
            })}
          </div>

          {/* Thread */}
          <div className={`flex-1 flex flex-col ${activeId ? 'flex' : 'hidden sm:flex'}`}>
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs font-bold text-blue-900/30">Select a conversation</p>
              </div>
            ) : loadingThread ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-emerald-400" /></div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-100/30 bg-white/60">
                  <button onClick={() => setActiveId(null)} className="sm:hidden p-1 text-blue-900/40"><ArrowLeft size={16} /></button>
                  <p className="text-xs font-black text-blue-900">{(() => { const o = otherParticipant(activeConvo); return o ? `${o.firstName} ${o.lastName || ''}` : ''; })()}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map(m => {
                    const mine = m.sender === user?._id || m.sender?._id === user?._id;
                    return (
                      <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs font-medium ${mine ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-br-sm' : 'bg-white border border-emerald-100/40 text-blue-900 rounded-bl-sm'}`}>
                          <p>{m.text}</p>
                          <p className={`text-[9px] mt-1 ${mine ? 'text-white/60' : 'text-blue-900/30'}`}>{formatRelativeTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-emerald-100/30 bg-white/60">
                  <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-white focus:outline-none focus:border-emerald-300 transition-all" />
                  <button type="submit" disabled={!draft.trim() || sending}
                    className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-all flex-shrink-0">
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
