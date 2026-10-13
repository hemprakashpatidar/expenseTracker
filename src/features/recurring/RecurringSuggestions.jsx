import { getCategoryIcon, getCategoryColor } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import styles from './RecurringSuggestions.module.css';

const RecurringSuggestions = ({ suggestions, onConfirm, onSkip, addingId, allTemplatesCount, onManage }) => {
  if (!allTemplatesCount) return null;

  const manageBtn = <button className={styles.manage} onClick={onManage} aria-label="Manage recurring expenses">Manage</button>;

  // All handled for this month — show compact row
  if (!suggestions.length) {
    return (
      <div className={styles.done}>
        <div className={styles.doneText}><span aria-hidden="true">✅</span> All recurring handled this month</div>
        {manageBtn}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <span><span aria-hidden="true">🔄</span> Recurring this month</span>
        {manageBtn}
      </div>

      <div className={styles.items}>
        {suggestions.map(s => (
          <div key={s.id} className={styles.item}>
            <div className={styles.icon} style={{ background: `${getCategoryColor(s.category)}18` }} aria-hidden="true">
              {getCategoryIcon(s.category)}
            </div>

            <div className={styles.info}>
              <div className={styles.name}>{s.expense}</div>
              <div className={styles.category}>{s.category}</div>
            </div>

            <div className={styles.amount}>₹{formatAmount(s.amount)}</div>

            <button className={styles.skip} onClick={() => onSkip(s.id)} aria-label={`Skip ${s.expense} this month`}>Skip</button>

            <button className={styles.add} onClick={() => onConfirm(s)} disabled={addingId === s.id} aria-label={`Add ${s.expense} for this month`}>
              {addingId === s.id ? '...' : '+ Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringSuggestions;
