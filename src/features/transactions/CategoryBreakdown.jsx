import { useState } from 'react';
import { getCategoryColor, getCategoryIcon } from '../../shared/categoryStyle.js';

const CategoryBreakdown = ({ breakdown }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={`et-breakdown-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>📊 Category Breakdown</span>
        <span style={{ fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="et-breakdown">
          <h3>💰 Spending by Category</h3>
          <div className="et-breakdown-grid">
            {Object.entries(breakdown).map(([cat, data]) => (
              <div
                key={cat}
                className="et-breakdown-card"
                style={{ background: getCategoryColor(cat) }}
              >
                <div className="bc-icon">{getCategoryIcon(cat)}</div>
                <div className="bc-cat">{cat}</div>
                <div className="bc-amt">₹{data.total.toFixed(0)}</div>
                <div className="bc-count">{data.count} items</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryBreakdown;
