import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../services/socket';

export function useSocket({ onChunk, onDone, onNewConv } = {}) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef({ onChunk, onDone, onNewConv });

  useEffect(() => {
    cbRef.current = { onChunk, onDone, onNewConv };
  });

  useEffect(() => {
    let sock = getSocket();
    if (!sock) return;

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onStream = ({ conversationId, chunk }) => {
      cbRef.current.onChunk?.(conversationId, chunk);
    };

    const onDoneEvt = ({ fullReply, conversationId }) => {
      cbRef.current.onDone?.(conversationId, fullReply);
    };

    const onNewConvEvt = ({ conversationId, conversationName }) => {
      cbRef.current.onNewConv?.(conversationId, conversationName);
    };

    sock.on('connect',          onConnect);
    sock.on('disconnect',       onDisconnect);
    sock.on('stream',           onStream);
    sock.on('done',             onDoneEvt);
    sock.on('new-conversation', onNewConvEvt);
    setConnected(sock.connected);

    return () => {
      sock.off('connect',          onConnect);
      sock.off('disconnect',       onDisconnect);
      sock.off('stream',           onStream);
      sock.off('done',             onDoneEvt);
      sock.off('new-conversation', onNewConvEvt);
    };
  }, []); 

  const sendMessage = useCallback((content, conversationId) => {
    const sock = getSocket();
    if (!sock?.connected) return false;
    const payload = { content };
    if (conversationId) payload.conversationId = conversationId;
    sock.emit('send-message', payload);
    return true;
  }, []);

  return { connected, sendMessage };
}
