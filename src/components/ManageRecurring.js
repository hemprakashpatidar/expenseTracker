import React, { useState } from 'react';
import { getCategoryIcon, getCategoryColor, formatAmount } from '../utils/index.js';
import { removeRecurringTemplate } from '../utils/recurringUtils.js';

const ManageRecurring = ({ templates, onClose, onTemplatesChange }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (templateId) => {
    if (confirmDelete !== templateId) { setConfirmDelete(templateId); return; }
    onTemplatesChange(removeRecurringTemplate(templateId));
    setConfirmDelete(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

        .mr-overlay {
          position: fixed; inset: 0;
          background: rgba(15,15,30,0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 10000;
          animation: mr-fade-in 0.2s ease;
        }
        @keyframes mr-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mr-slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .mr-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%; max-width: 480px;
          max-height: 80vh; overflow-y: auto;
          font-family: 'DM Sans', sans-serif;
          animation: mr-slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mr-handle {
          width: 36px; height: 4px;
          background: #e2e4ea; border-radius: 2px;
          margin: 12px auto 0;
        }
        .mr-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px 12px;
          border-bottom: 1px solid #f0f1f5;
        }
        .mr-title {
          font-size: 16px; font-weight: 700; color: #1a1a2e;
          display: flex; align-items: center; gap: 7px;
        }
        .mr-close {
          width: 30px; height: 30px; background: #f3f4f6;
          border: none; border-radius: 8px; font-size: 13px;
          color: #6b7280; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .mr-close:hover { background: #e5e7eb; color: #1a1a2e; }

        .mr-body { padding: 12px 18px 28px; display: flex; flex-direction: column; gap: 8px; }

        .mr-empty {
          text-align: center; color: #9ca3af;
          font-size: 13px; padding: 24px 0; line-height: 1.6;
        }

        .mr-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          background: #f8f9fb; border-radius: 12px;
        }
        .mr-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .mr-info { flex: 1; min-width: 0; }
        .mr-name {
          font-size: 13px; font-weight: 600; color: #1a1a2e;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mr-meta { font-size: 11px; color: #9ca3af; margin-top: 1px; }
        .mr-amount {
          font-family: 'DM Mono', monospace;
          font-size: 13px; font-weight: 600; color: #1a1a2e; flex-shrink: 0;
        }
        .mr-del-btn {
          background: #fff0f0; color: #ef4444;
          border: 1.5px solid #fecaca; border-radius: 8px;
          padding: 5px 10px; font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          flex-shrink: 0; transition: background 0.15s;
        }
        .mr-del-btn:hover { background: #fee2e2; }
        .mr-confirm-btn {
          background: #ef4444; color: white; border: none;
          border-radius: 8px; padding: 5px 10px;
          font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer; flex-shrink: 0;
        }
        .mr-cancel-btn {
          background: transparent; border: none; color: #9ca3af;
          font-size: 11px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          padding: 5px 6px; text-decoration: underline; flex-shrink: 0;
        }
        .mr-used {
          font-size: 10px; color: #c0c4d0; margin-top: 2px;
        }
      `}</style>

      <div className="mr-overlay" onClick={onClose}>
        <div className="mr-modal" onClick={e => e.stopPropagation()}>
          <div className="mr-handle" />
          <div className="mr-header">
            <div className="mr-title">🔄 Recurring Templates</div>
            <button className="mr-close" onClick={onClose}>✕</button>
          </div>

          <div className="mr-body">
            {templates.length === 0 ? (
              <div className="mr-empty">
                No recurring templates yet.<br />
                Expand any transaction and tap "Set as recurring".
              </div>
            ) : templates.map(t => (
              <div key={t.id} className="mr-item">
                <div className="mr-icon" style={{ background: `${getCategoryColor(t.category)}18` }}>
                  {getCategoryIcon(t.category)}
                </div>
                <div className="mr-info">
                  <div className="mr-name">{t.expense}</div>
                  <div className="mr-meta">{t.category} · {t.paymentMethod}</div>
                  {t.handledMonths.length > 0 && (
                    <div className="mr-used">Added {t.handledMonths.length}× so far</div>
                  )}
                </div>
                <div className="mr-amount">₹{formatAmount(t.amount)}</div>
                {confirmDelete === t.id ? (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button className="mr-cancel-btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    <button className="mr-confirm-btn" onClick={() => handleDelete(t.id)}>Sure?</button>
                  </div>
                ) : (
                  <button className="mr-del-btn" onClick={() => handleDelete(t.id)}>🗑</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageRecurring;
