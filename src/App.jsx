import { useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import ChatPage from './pages/Chat';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)', fontSize: 13,
      }}>
        جاري التحميل...
      </div>
    );
  }

  return user ? <ChatPage /> : <AuthPage />;
}
