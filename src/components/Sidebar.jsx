import styles from './Sidebar.module.css';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  convs, hasMore, loadingMore, onLoadMore,
  activeId, onSelect, onNew, isOpen, onClose,
}) {
  const { user, logout } = useAuth();
  const initials = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <span className={styles.logo}>✦ ChatAI</span>
          <button className={styles.newBtn} onClick={onNew} title="محادثة جديدة">+</button>
        </div>

        <div className={styles.list}>
          {convs.length === 0 && (
            <p className={styles.empty}>لا توجد محادثات بعد</p>
          )}
          {convs.map(c => {
            const id   = c._id || c.id;
            const name = c.conversationName || c.name || c.title || 'محادثة';

            return (
              <button
                key={id}
                className={`${styles.item} ${activeId === id ? styles.active : ''}`}
                onClick={() => onSelect(id, name)}
              >
                {name}
              </button>
            );
          })}
          {hasMore && (
            <button className={styles.loadMore} onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? '...' : 'تحميل المزيد'}
            </button>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || '—'}</span>
            <span className={styles.userEmail}>{user?.email || ''}</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="خروج">↩</button>
        </div>
      </aside>
    </>
  );
}
