import { useState } from 'react';
import { getCategoryIcon } from '../../shared/categoryStyle.js';

const Filters = ({ categories, paymentMethods, category, paymentMethod, onCategoryChange, onPaymentMethodChange }) => {
  const [showPanel, setShowPanel] = useState(false);
  const activeCount = (category !== 'All' ? 1 : 0) + (paymentMethod !== 'All' ? 1 : 0);

  return (
    <>
      {/* Filter row: toggle button + active chips */}
      <div className="et-filter-row">
        <button
          className={`et-filter-toggle${activeCount > 0 ? ' has-filters' : ''}`}
          onClick={() => setShowPanel(open => !open)}
        >
          ⚙ Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
        </button>
        {category !== 'All' && (
          <button className="et-active-chip" onClick={() => onCategoryChange('All')}>
            {getCategoryIcon(category)} {category} <span className="et-chip-x">×</span>
          </button>
        )}
        {paymentMethod !== 'All' && (
          <button className="et-active-chip" onClick={() => onPaymentMethodChange('All')}>
            💳 {paymentMethod} <span className="et-chip-x">×</span>
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      {showPanel && (
        <div className="et-filter-panel">
          <div className="et-filter-section">
            <div className="et-filter-section-label">Category</div>
            <div className="et-cats">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`et-cat-btn${category === cat ? ' active' : ''}`}
                  onClick={() => { onCategoryChange(cat); setShowPanel(false); }}
                >
                  {cat === 'All' ? '🗂' : getCategoryIcon(cat)} {cat}
                </button>
              ))}
            </div>
          </div>
          {paymentMethods.length > 1 && (
            <div className="et-filter-section">
              <div className="et-filter-section-label">Payment Method</div>
              <div className="et-cats">
                {paymentMethods.map(pm => (
                  <button
                    key={pm}
                    className={`et-cat-btn${paymentMethod === pm ? ' active' : ''}`}
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
