
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('at'));
  const [loading, setLoading] = useState(true);

  // ─── Hydrate on app start ─────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('at');
    const un = localStorage.getItem('un');
    const ue = localStorage.getItem('ue');

    if (t && un) {
      setToken(t);
      setUser({ name: un, email: ue || '' });
    }

    setLoading(false);
  }, []);

 
  useEffect(() => {
    if (token && user) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [token, user]);

  const saveAuth = useCallback((tokenVal, userObj) => {
    const name = userObj?.username || 'مستخدم';
    const email = userObj?.email || '';

    localStorage.setItem('at', tokenVal);
    localStorage.setItem('un', name);
    localStorage.setItem('ue', email);

    setToken(tokenVal);
    setUser({ name, email });
  }, []);

  // ─── Logout ────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('at');
    localStorage.removeItem('un');
    localStorage.removeItem('ue');

    setToken(null);
    setUser(null);

    disconnectSocket();
  }, []);

 
  return (
    <AuthContext.Provider value={{ user, token, loading, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
