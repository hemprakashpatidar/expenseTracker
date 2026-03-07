import React from 'react';
import { getCategoryIcon, getCategoryColor, formatAmount } from '../utils/index.js';

const RecurringSuggestions = ({ suggestions, onConfirm, onSkip, addingId, allTemplatesCount, onManage }) => {
  if (!allTemplatesCount) return null;

  const manageBtn = (
    <button
      onClick={onManage}
      style={{
        background: 'none', border: 'none', color: '#4f46e5',
        fontSize: '11px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer', padding: 0, textDecoration: 'underline', flexShrink: 0,
      }}
    >
      Manage
    </button>
  );

  // All handled for this month — show compact row
  if (!suggestions.length) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1.5px solid #bbf7d0',
        borderRadius: '14px', padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ✅ All recurring handled this month
        </div>
        {manageBtn}
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '14px', padding: '12px 14px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1.5px solid #e0e7ff',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: '#4f46e5',
        textTransform: 'uppercase', letterSpacing: '0.6px',
        marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>🔄 Recurring this month</span>
        {manageBtn}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {suggestions.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', background: '#f8f9fb', borderRadius: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: `${getCategoryColor(s.category)}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0,
            }}>
              {getCategoryIcon(s.category)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: '#1a1a2e',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {s.expense}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.category}</div>
            </div>

            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#1a1a2e', flexShrink: 0 }}>
              ₹{formatAmount(s.amount)}
            </div>

            <button
              onClick={() => onSkip(s.id)}
              style={{
                background: 'transparent', border: 'none', fontSize: '11px',
                fontWeight: 600, color: '#9ca3af', fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', padding: '4px 6px', flexShrink: 0, textDecoration: 'underline',
              }}
            >
              Skip
            </button>

            <button
              onClick={() => onConfirm(s)}
              disabled={addingId === s.id}
              style={{
                background: '#4f46e5', border: 'none', borderRadius: '8px',
                padding: '5px 12px', color: 'white', fontSize: '11px',
                fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                cursor: addingId === s.id ? 'not-allowed' : 'pointer',
                flexShrink: 0, opacity: addingId === s.id ? 0.6 : 1,
              }}
            >
              {addingId === s.id ? '...' : '+ Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringSuggestions;
