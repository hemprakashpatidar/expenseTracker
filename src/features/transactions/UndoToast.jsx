import styles from './TransactionsPage.module.css';

const UndoToast = ({ message, onUndo }) => (
  <div className={styles.toast} role="status">
    <span className={styles.toastMessage}>{message}</span>
    <button className={styles.undoBtn} onClick={onUndo}>Undo</button>
  </div>
);

export default UndoToast;
