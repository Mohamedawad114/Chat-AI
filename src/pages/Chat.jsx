import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';
import { useSocket } from '../hooks/useSocket';
import { useConversations } from '../hooks/useConversations';
import { useChatHistory } from '../hooks/useChatHistory';
import { useAuth } from '../context/AuthContext';
import styles from './Chat.module.css';

export default function ChatPage() {
  const { user } = useAuth();
  const [theme, setTheme]       = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId,  setActiveConvId]  = useState(null);
  const [activeConvName, setActiveConvName] = useState('محادثة جديدة');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputText, setInputText]   = useState('');
  const streamBufRef  = useRef('');
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const { convs, loading: convsLoading, hasMore: convsMore, load: loadConvs, upsert: upsertConv }
    = useConversations();

  const {
    messages, loading: histLoading, hasMore: histMore,
    load: loadHist, append, updateLast, appendStreaming, clear: clearMessages,
  } = useChatHistory();
  const handleChunk = useCallback((convId, chunk) => {
    streamBufRef.current += chunk;
    updateLast(streamBufRef.current);
  }, [updateLast]);

  const handleDone = useCallback((convId, fullReply) => {
    updateLast(fullReply || streamBufRef.current);
    streamBufRef.current = '';
    setIsStreaming(false);
  }, [updateLast]);

  const handleNewConv = useCallback((convId, convName) => {
    if (!activeConvId) setActiveConvId(convId);
    if (convName) {
      setActiveConvName(convName);
      upsertConv(convId, convName);
    } else {
      upsertConv(convId, 'محادثة جديدة...');
    }
  }, [activeConvId, upsertConv]);

  const { connected, sendMessage } = useSocket({
    onChunk:   handleChunk,
    onDone:    handleDone,
    onNewConv: handleNewConv,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadConvs(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = useCallback(async (id, name) => {
    setActiveConvId(id);
    setActiveConvName(name);
    setSidebarOpen(false);
    clearMessages();
    await loadHist(id, true);
  }, [clearMessages, loadHist]);

  const newChat = useCallback(() => {
    setActiveConvId(null);
    setActiveConvName('محادثة جديدة');
    clearMessages();
    setSidebarOpen(false);
    inputRef.current?.focus();
  }, [clearMessages]);

  const send = useCallback(() => {
    const text = inputText.trim();
    if (!text || isStreaming || !connected) return;

    append('user', text);
    appendStreaming();
    streamBufRef.current = '';
    setIsStreaming(true);
    setInputText('');
    inputRef.current.style.height = 'auto';

    const ok = sendMessage(text, activeConvId);
    if (!ok) {
      updateLast('❌ تعذّر الاتصال بالخادم');
      setIsStreaming(false);
    }
  }, [inputText, isStreaming, connected, activeConvId, append, appendStreaming, sendMessage, updateLast]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  return (
    <>
    <div className={styles.app}>
      <Sidebar
        convs={convs}
        hasMore={convsMore}
        loadingMore={convsLoading}
        onLoadMore={() => loadConvs(false)}
        activeId={activeConvId}
        onSelect={openConversation}
        onNew={newChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          <span className={styles.convTitle}>{activeConvName}</span>
          <div className={styles.topActions}>
            <div className={styles.statusPill}>
              <span className={`${styles.sDot} ${connected ? styles.on : ''}`} />
              <span style={{fontSize:"20px" ,marginLeft:"7px"}}>{connected ? 'متصل' : 'غير متصل'}</span>
            </div>
            <button className={styles.iconBtn}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title="وضع الليل">◑</button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {/* تحميل رسائل أقدم */}
          {histMore && (
            <button className={styles.loadOlder} onClick={() => loadHist(activeConvId, false)}
              disabled={histLoading}>
              {histLoading ? '...' : '↑ رسائل أقدم'}
            </button>
          )}

          {messages.length === 0 && !histLoading && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◎</div>
              <div className={styles.emptyTitle}>ابدأ محادثة</div>
              <p className={styles.emptySub}>اسأل عن أى شئ</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              role={msg.sendBy||msg.role}
              content={msg.content}
              streaming={msg.streaming}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={inputText}
              onChange={e => { setInputText(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              placeholder="اكتب رسالتك..."
              rows={1}
              disabled={isStreaming}
            />
            <button className={styles.sendBtn} onClick={send}
              disabled={!inputText.trim() || isStreaming || !connected}>
              ↑
            </button>
          </div>
        </div>
      </div>
      </div>
      </>
  );
}
