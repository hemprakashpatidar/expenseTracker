import { useState } from 'react';
import { getCategoryIcon, getCategoryColor } from '../../shared/categoryStyle.js';
import { formatAmount } from '../../shared/formatters.js';
import { removeRecurringTemplate } from './storage.js';
import styles from './ManageRecurring.module.css';

const ManageRecurring = ({ templates, onClose, onTemplatesChange }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (templateId) => {
    if (confirmDelete !== templateId) { setConfirmDelete(templateId); return; }
    onTemplatesChange(removeRecurringTemplate(templateId));
    setConfirmDelete(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.title}>🔄 Recurring Templates</div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {templates.length === 0 ? (
            <div className={styles.empty}>
              No recurring templates yet.<br />
              Expand any transaction and tap "Set as recurring".
            </div>
          ) : templates.map(t => (
            <div key={t.id} className={styles.item}>
              <div className={styles.icon} style={{ background: `${getCategoryColor(t.category)}18` }}>
                {getCategoryIcon(t.category)}
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{t.expense}</div>
                <div className={styles.meta}>{t.category} · {t.paymentMethod}</div>
                {t.handledMonths.length > 0 && (
                  <div className={styles.used}>Added {t.handledMonths.length}× so far</div>
                )}
              </div>
              <div className={styles.amount}>₹{formatAmount(t.amount)}</div>
              {confirmDelete === t.id ? (
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
                  <button className={styles.confirmBtn} onClick={() => handleDelete(t.id)}>Sure?</button>
                </div>
              ) : (
                <button className={styles.delBtn} onClick={() => handleDelete(t.id)}>🗑</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageRecurring;
