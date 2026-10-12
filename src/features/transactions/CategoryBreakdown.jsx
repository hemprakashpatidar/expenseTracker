import { useState } from 'react';
import { getCategoryColor, getCategoryIcon } from '../../shared/categoryStyle.js';
import { cx } from '../../shared/cx.js';
import styles from './CategoryBreakdown.module.css';

const CategoryBreakdown = ({ breakdown }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={cx(styles.toggle, open && styles.open)} onClick={() => setOpen(o => !o)}>
        <span>📊 Category Breakdown</span>
        <span className={styles.arrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.panel}>
          <h3 className={styles.heading}>💰 Spending by Category</h3>
          <div className={styles.grid}>
            {Object.entries(breakdown).map(([cat, data]) => (
              <div
                key={cat}
                className={styles.card}
                style={{ background: getCategoryColor(cat) }}
              >
                <div className={styles.icon}>{getCategoryIcon(cat)}</div>
                <div className={styles.category}>{cat}</div>
                <div className={styles.amount}>₹{data.total.toFixed(0)}</div>
                <div className={styles.count}>{data.count} items</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryBreakdown;
