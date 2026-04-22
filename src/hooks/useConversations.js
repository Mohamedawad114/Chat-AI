import { useState, useCallback, useRef } from 'react';
import { chatApi } from '../services/api';

export function useConversations() {
  const [convs, setConvs]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const cursorRef               = useRef(null);
  const hasMoreRef              = useRef(true);

  const load = useCallback(async (reset = false) => {
    if (loading) return;
    if (reset) { cursorRef.current = null; hasMoreRef.current = true; }
    if (!hasMoreRef.current) return;

    setLoading(true);
    try {
      const { data } = await chatApi.getConversations(cursorRef.current);
      const list =data.data || (Array.isArray(data) ? data : []);
      const next = data.meta?.nextCursor ;
      cursorRef.current = next;
      hasMoreRef.current = !!next;

      if (reset) setConvs(list);
      else setConvs(prev => [...prev, ...list]);
    } catch (e) {
      console.error('loadConvs error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading]);

const upsert = useCallback((id, conversationName) => {
  setConvs((prev) => {
    const exists = prev.find((c) => (c._id || c.id) === id);
    if (exists) {
      return prev.map((c) =>
        (c._id || c.id) === id
          ? { ...c, conversationName: conversationName || c.conversationName }
          : c,
      );
    }
    return [
      { _id: id, conversationName: conversationName || "محادثة جديدة..." },
      ...prev,
    ];
  });
}, []);

  const hasMore = hasMoreRef.current;

  return { convs, loading, hasMore, load, upsert };
}
