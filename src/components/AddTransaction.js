import React, { useState } from 'react';
import { getCategoryIcon } from '../utils/categoryUtils.js';

const AddTransaction = ({ onClose, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    expense: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    paymentMethod: 'UPI'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Groceries'
  ];
  const paymentMethods = ['Cash', 'Card', 'PhonePe', 'PayTM', 'Google Pay', 'Bank Transfer', 'RuPay', 'Wallet'];

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>"'&]/g, m => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' }[m]));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: sanitizeInput(value) }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, amount: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.expense.trim() || !formData.amount.trim()) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      setLoading(false);
      return;
    }

    try {
      const apiPath = process.env.REACT_APP_API_PATH;
      const authData = localStorage.getItem('expense_tracker_auth');
      let userData = null;
      if (authData) { try { userData = JSON.parse(authData); } catch (e) { } }

      const response = await fetch(`${apiPath}/api/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer authenticated' },
        body: JSON.stringify({
          userName: userData?.userName || '',
          uuid: userData?.uuid || '',
          isMe: userData?.isMe || false,
          expense: formData.expense.trim(),
          amount,
          date: formData.date,
          category: formData.category === 'Other (custom)' ? (formData.customCategory?.trim() || 'Other') : formData.category,
          paymentMethod: formData.paymentMethod === 'Other (custom)' ? (formData.customPayment?.trim() || 'Other') : formData.paymentMethod
        })
      });

      const result = await response.json();
      if (response.ok) {
        onTransactionAdded?.();
        onClose();
      } else {
        setError(result.message || 'Failed to add transaction. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

        .at-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 15, 30, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 10000;
          padding: 0;
          animation: at-fade-in 0.2s ease;
        }

        @keyframes at-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes at-slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes at-spin { to { transform: rotate(360deg); } }

        .at-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-width: 480px;
          max-height: 92vh;
          overflow-y: auto;
          padding: 0;
          animation: at-slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: 'DM Sans', sans-serif;
        }

        /* drag handle */
        .at-handle {
          width: 36px;
          height: 4px;
          background: #e2e4ea;
          border-radius: 2px;
          margin: 12px auto 0;
        }

        /* header */
        .at-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 12px;
          border-bottom: 1px solid #f0f1f5;
        }
        .at-header-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .at-close {
          width: 30px;
          height: 30px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .at-close:hover { background: #e5e7eb; color: #1a1a2e; }

        /* body */
        .at-body {
          padding: 14px 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        /* error */
        .at-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* field */
        .at-field { display: flex; flex-direction: column; gap: 5px; }
        .at-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .at-input, .at-select {
          background: #f8f9fb;
          border: 1.5px solid transparent;
          border-radius: 11px;
          padding: 10px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1a1a2e;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .at-input:focus, .at-select:focus {
          border-color: #4f46e5;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .at-input::placeholder { color: #c0c4d0; }
        .at-select { cursor: pointer; }

        /* amount row */
        .at-amount-row { display: flex; gap: 8px; }
        .at-amount-wrap {
          flex: 1;
          position: relative;
        }
        .at-currency {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          font-weight: 700;
          color: #4f46e5;
          font-family: 'DM Mono', monospace;
          pointer-events: none;
        }
        .at-amount-input {
          background: #f8f9fb;
          border: 1.5px solid transparent;
          border-radius: 11px;
          padding: 10px 12px 10px 26px;
          font-family: 'DM Mono', monospace;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .at-amount-input:focus {
          border-color: #4f46e5;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .at-amount-input::placeholder { color: #c0c4d0; font-size: 14px; font-family: 'DM Sans', sans-serif; }

        /* styled select wrapper */
        .at-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .at-select-icon {
          position: absolute;
          left: 12px;
          font-size: 16px;
          pointer-events: none;
          z-index: 1;
        }
        .at-select-chevron {
          position: absolute;
          right: 12px;
          font-size: 11px;
          color: #9ca3af;
          pointer-events: none;
        }
        .at-styled-select {
          width: 100%;
          background: #f8f9fb;
          border: 1.5px solid transparent;
          border-radius: 11px;
          padding: 10px 34px 10px 36px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .at-styled-select:focus {
          border-color: #4f46e5;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
        }
        .at-custom-input {
          margin-top: 7px;
          animation: at-slide-up 0.18s ease;
        }

        /* actions */
        .at-actions {
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }
        .at-cancel {
          flex: 1;
          background: #f3f4f6;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          cursor: pointer;
          transition: background 0.15s;
        }
        .at-cancel:hover { background: #e5e7eb; }
        .at-submit {
          flex: 2;
          background: #4f46e5;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .at-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .at-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .at-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: at-spin 0.7s linear infinite;
        }
      `}</style>

      <div className="at-overlay" onClick={onClose}>
        <div className="at-modal" onClick={e => e.stopPropagation()}>
          <div className="at-handle" />

          <div className="at-header">
            <div className="at-header-title">
              <span>💸</span> Add Transaction
            </div>
            <button className="at-close" onClick={onClose}>✕</button>
          </div>

          <form className="at-body" onSubmit={handleSubmit}>
            {error && (
              <div className="at-error">⚠️ {error}</div>
            )}

            {/* Description */}
            <div className="at-field">
              <label className="at-label">Description</label>
              <input
                className="at-input"
                name="expense"
                type="text"
                value={formData.expense}
                onChange={handleInputChange}
                placeholder="What did you spend on?"
                required
                disabled={loading}
              />
            </div>

            {/* Amount + Date row */}
            <div className="at-amount-row">
              <div className="at-field" style={{ flex: 1 }}>
                <label className="at-label">Amount</label>
                <div className="at-amount-wrap">
                  <span className="at-currency">₹</span>
                  <input
                    className="at-amount-input"
                    type="text"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="at-field" style={{ flex: 1 }}>
                <label className="at-label">Date</label>
                <input
                  className="at-input"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Category */}
            <div className="at-field">
              <label className="at-label">Category</label>
              <div className="at-select-wrap">
                <span className="at-select-icon">
                  {getCategoryIcon(formData.category === 'Other (custom)' ? 'Other' : formData.category)}
                </span>
                <select
                  className="at-styled-select"
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value, customCategory: '' }))}
                  disabled={loading}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                  ))}
                  <option value="Other (custom)">✏️ Other (custom)…</option>
                </select>
                <span className="at-select-chevron">▾</span>
              </div>
              {formData.category === 'Other (custom)' && (
                <input
                  className="at-input at-custom-input"
                  type="text"
                  name="customCategory"
                  value={formData.customCategory || ''}
                  onChange={handleInputChange}
                  placeholder="Enter custom category…"
                  disabled={loading}
                  autoFocus
                />
              )}
            </div>

            {/* Payment method */}
            <div className="at-field">
              <label className="at-label">Payment Method</label>
              <div className="at-select-wrap">
                <span className="at-select-icon">💳</span>
                <select
                  className="at-styled-select"
                  value={formData.paymentMethod}
                  onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value, customPayment: '' }))}
                  disabled={loading}
                >
                  {paymentMethods.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                  <option value="Other (custom)">✏️ Other (custom)…</option>
                </select>
                <span className="at-select-chevron">▾</span>
              </div>
              {formData.paymentMethod === 'Other (custom)' && (
                <input
                  className="at-input at-custom-input"
                  type="text"
                  name="customPayment"
                  value={formData.customPayment || ''}
                  onChange={handleInputChange}
                  placeholder="Enter payment method…"
                  disabled={loading}
                  autoFocus
                />
              )}
            </div>

            {/* Actions */}
            <div className="at-actions">
              <button type="button" className="at-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="at-submit" disabled={loading}>
                {loading ? <><span className="at-spinner" /> Adding...</> : <>＋ Add Transaction</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTransaction;