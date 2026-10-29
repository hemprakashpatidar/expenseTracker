import { useState } from 'react';
import { getCategoryLabel } from '../../shared/categoryStyle.js';
import { cx } from '../../shared/cx.js';
import Icon from '../../shared/Icon.jsx';
import CategoryIcon from '../../shared/CategoryIcon.jsx';
import styles from './Filters.module.css';

// Category chips are always visible; payment method sits behind its own chip
const Filters = ({ categories, paymentMethods, category, paymentMethod, onCategoryChange, onPaymentMethodChange }) => {
  const [showPayments, setShowPayments] = useState(false);
  const hasPaymentChoice = paymentMethods.length > 2; // 'All' plus at least two methods

  return (
    <div className={styles.wrap}>
      <div className={styles.row} role="group" aria-label="Filter by category">
        {categories.map(cat => (
          <button
            key={cat}
            className={cx(styles.chip, category === cat && styles.active)}
            onClick={() => onCategoryChange(cat)}
            aria-pressed={category === cat}
            title={cat === 'All' ? 'All categories' : cat}
          >
            {cat === 'All' ? 'All' : <><CategoryIcon category={cat} /> {getCategoryLabel(cat)}</>}
          </button>
        ))}
        {hasPaymentChoice && (
          <button
            className={cx(styles.chip, styles.paymentToggle, paymentMethod !== 'All' && styles.active)}
            onClick={() => setShowPayments(open => !open)}
            aria-expanded={showPayments}
          >
            <Icon name="creditCard" size={16} /> {paymentMethod === 'All' ? 'Payment' : paymentMethod} <Icon name="chevronDown" size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {hasPaymentChoice && showPayments && (
        <div className={styles.row} role="group" aria-label="Filter by payment method">
          {paymentMethods.map(pm => (
            <button
              key={pm}
              className={cx(styles.chip, paymentMethod === pm && styles.active)}
              onClick={() => { onPaymentMethodChange(pm); setShowPayments(false); }}
              aria-pressed={paymentMethod === pm}
            >
              {pm === 'All' ? 'All payments' : pm}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Filters;
