import { useState, useCallback, useRef } from 'react';
import { chatApi } from '../services/api';

export function useChatHistory() {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const cursorRef                 = useRef(null);
  const hasMoreRef                = useRef(false);
  const convIdRef                 = useRef(null);

  // يحمّل محادثة جديدة (reset) أو يحمّل رسائل أقدم
  const load = useCallback(async (conversationId, reset = false) => {
    if (loading) return;
    if (reset) {
      cursorRef.current  = null;
      hasMoreRef.current = true;
      convIdRef.current  = conversationId;
    }
    if (!hasMoreRef.current) return;
    if (convIdRef.current !== conversationId) return;

    setLoading(true);
    try {
      const { data } = await chatApi.getHistory(conversationId, cursorRef.current);
      // الـ API بيرجع أحدث الرسائل أول → نعكسهم عشان يكونوا chronological
      const raw  = data.messages || data.data || (Array.isArray(data) ? data : []);
      const list = [...raw].reverse();
      const next = data.nextCursor || data.cursor || null;
      cursorRef.current  = next;
      hasMoreRef.current = !!next;

      if (reset) {
        setMessages(list);
      } else {
        // رسائل أقدم تيجي في الأول
        setMessages(prev => [...list, ...prev]);
      }
    } catch (e) {
      console.error('loadHistory error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // يضيف رسالة جديدة في الأسفل (user أو AI)
  const append = useCallback((role, content) => {
    setMessages(prev => [...prev, {
      _id:     Date.now().toString(),
      role,
      content,
    }]);
  }, []);

  // يحدّث آخر رسالة AI (streaming chunks)
  const updateLast = useCallback((content) => {
    setMessages(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== 'assistant') return prev;
      return [...prev.slice(0, -1), { ...last, content }];
    });
  }, []);

  // يضيف placeholder للـ streaming
  const appendStreaming = useCallback(() => {
    setMessages(prev => [...prev, {
      _id:       'streaming',
      role:      'assistant',
      content:   '',
      streaming: true,
    }]);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    cursorRef.current  = null;
    hasMoreRef.current = false;
    convIdRef.current  = null;
  }, []);

  return {
    messages,
    loading,
    hasMore: hasMoreRef.current,
    load,
    append,
    updateLast,
    appendStreaming,
    clear,
  };
}
