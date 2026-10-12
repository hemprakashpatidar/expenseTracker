import { useState } from 'react';
import { getCategoryIcon } from '../../shared/categoryStyle.js';
import { cx } from '../../shared/cx.js';
import styles from './Filters.module.css';

const Filters = ({ categories, paymentMethods, category, paymentMethod, onCategoryChange, onPaymentMethodChange }) => {
  const [showPanel, setShowPanel] = useState(false);
  const activeCount = (category !== 'All' ? 1 : 0) + (paymentMethod !== 'All' ? 1 : 0);

  return (
    <>
      {/* Filter row: toggle button + active chips */}
      <div className={styles.row}>
        <button
          className={cx(styles.toggle, activeCount > 0 && styles.hasFilters)}
          onClick={() => setShowPanel(open => !open)}
        >
          ⚙ Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
        </button>
        {category !== 'All' && (
          <button className={styles.chip} onClick={() => onCategoryChange('All')}>
            {getCategoryIcon(category)} {category} <span className={styles.chipX}>×</span>
          </button>
        )}
        {paymentMethod !== 'All' && (
          <button className={styles.chip} onClick={() => onPaymentMethodChange('All')}>
            💳 {paymentMethod} <span className={styles.chipX}>×</span>
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      {showPanel && (
        <div className={styles.panel}>
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Category</div>
            <div className={styles.options}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={cx(styles.option, category === cat && styles.active)}
                  onClick={() => { onCategoryChange(cat); setShowPanel(false); }}
                >
                  {cat === 'All' ? '🗂' : getCategoryIcon(cat)} {cat}
                </button>
              ))}
            </div>
          </div>
          {paymentMethods.length > 1 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Payment Method</div>
              <div className={styles.options}>
                {paymentMethods.map(pm => (
                  <button
                    key={pm}
                    className={cx(styles.option, paymentMethod === pm && styles.active)}
                    onClick={() => { onPaymentMethodChange(pm); setShowPanel(false); }}
                  >
                    {pm === 'All' ? '💳' : pm}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Filters;
