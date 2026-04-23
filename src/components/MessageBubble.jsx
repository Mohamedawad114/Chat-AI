import styles from './MessageBubble.module.css';

export default function MessageBubble({ role, content, streaming }) {
  const isUser = role === 'user' || role === 'human';

  return (
    <div className={`${styles.row} ${isUser ? styles.user : styles.ai}`}>
      <div className={styles.avatar}>
        {isUser ? 'U' : '✦'}
      </div>
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        {streaming && !content ? (
          <span className={styles.typing}>
            <span /><span /><span />
          </span>
        ) : (
          <span style={{ whiteSpace: 'pre-wrap'  ,fontSize: "18px",
    wordSpacing: "12px",
    fontFamily: "inherit" }}>{content}</span>
        )}
        {streaming && content && (
          <span className={styles.cursor} />
        )}
      </div>
    </div>
  );
}
