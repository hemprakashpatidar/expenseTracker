import React, { useState } from 'react';
import { getCategoryIcon } from '../utils/categoryUtils.js';

// Convert display date (DD-MM-YY or DD-MM-YYYY) back to YYYY-MM-DD for <input type="date">
const toInputDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Handle DD-MM-YY or DD-MM-YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [dd, mm, yy] = parts;
        const year = yy.length === 2 ? `20${yy}` : yy;
        return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
};

const EditTransaction = ({ transaction, onClose, onTransactionUpdated }) => {
    const knownCategories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
        'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Groceries'
    ];
    const knownPaymentMethods = ['Cash', 'Card', 'PhonePe', 'PayTM', 'Google Pay', 'Bank Transfer', 'RuPay', 'Wallet'];

    const isKnownCategory = knownCategories.includes(transaction.category);
    const isKnownPayment = knownPaymentMethods.includes(transaction.paymentMethod);

    const [formData, setFormData] = useState({
        expense: transaction.expense || '',
        amount: String(transaction.amount || ''),
        date: toInputDate(transaction.date),
        category: isKnownCategory ? transaction.category : 'Other (custom)',
        customCategory: isKnownCategory ? '' : (transaction.category || ''),
        paymentMethod: isKnownPayment ? transaction.paymentMethod : 'Other (custom)',
        customPayment: isKnownPayment ? '' : (transaction.paymentMethod || ''),
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

        const resolvedCategory = formData.category === 'Other (custom)'
            ? (formData.customCategory?.trim() || 'Other')
            : formData.category;
        const resolvedPayment = formData.paymentMethod === 'Other (custom)'
            ? (formData.customPayment?.trim() || 'Other')
            : formData.paymentMethod;

        try {
            const apiPath = process.env.REACT_APP_API_PATH;
            const authData = localStorage.getItem('expense_tracker_auth');
            let userData = null;
            if (authData) { try { userData = JSON.parse(authData); } catch (err) { } }

            const response = await fetch(`${apiPath}/api/edit-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer authenticated' },
                body: JSON.stringify({
                    pageId: transaction.id,
                    userName: userData?.userName || '',
                    uuid: userData?.uuid || '',
                    expense: formData.expense.trim(),
                    amount,
                    date: formData.date,
                    category: resolvedCategory,
                    paymentMethod: resolvedPayment,
                })
            });

            const result = await response.json();
            if (response.ok) {
                onTransactionUpdated?.({
                    ...transaction,
                    expense: formData.expense.trim(),
                    amount,
                    date: formData.date,
                    category: resolvedCategory,
                    paymentMethod: resolvedPayment,
                });
                onClose();
            } else {
                setError(result.message || 'Failed to update transaction. Please try again.');
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

        .et-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 15, 30, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 10000;
          animation: et-fade-in 0.2s ease;
        }
        @keyframes et-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes et-slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes et-spin { to { transform: rotate(360deg); } }

        .et-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-width: 480px;
          max-height: 92vh;
          overflow-y: auto;
          font-family: 'DM Sans', sans-serif;
          animation: et-slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .et-handle {
          width: 36px; height: 4px;
          background: #e2e4ea;
          border-radius: 2px;
          margin: 12px auto 0;
        }
        .et-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 14px;
          border-bottom: 1px solid #f0f1f5;
          background: #fff;
          border-radius: 0;
        }
        .et-header-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .et-title-pill {
          background: #f5f3ff;
          color: #7c3aed;
          border: 1.5px solid #ddd6fe;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .et-close {
          width: 30px; height: 30px;
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
        .et-close:hover { background: #e5e7eb; color: #1a1a2e; }

        .et-body {
          padding: 14px 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .et-error {
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
        .et-field { display: flex; flex-direction: column; gap: 5px; }
        .et-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .et-input, .et-select {
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
        .et-input:focus, .et-select:focus {
          border-color: #f59e0b;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .et-input::placeholder { color: #c0c4d0; }

        .et-amount-row { display: flex; gap: 8px; }
        .et-amount-wrap { flex: 1; position: relative; }
        .et-currency {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          font-weight: 700;
          color: #7c3aed;
        }
        .et-amount-input {
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
        .et-amount-input:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .et-amount-input::placeholder { color: #c0c4d0; font-size: 14px; font-family: 'DM Sans', sans-serif; }

        /* date gets neutral indigo focus, not orange */
        .et-date-input:focus {
          border-color: #4f46e5 !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.1) !important;
        }

        /* styled select */
        .et-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .et-select-icon {
          position: absolute;
          left: 12px;
          font-size: 16px;
          pointer-events: none;
          z-index: 1;
        }
        .et-select-chevron {
          position: absolute;
          right: 12px;
          font-size: 11px;
          color: #9ca3af;
          pointer-events: none;
        }
        .et-styled-select {
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
        .et-styled-select:focus {
          border-color: #f59e0b;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .et-custom-input {
          margin-top: 7px;
          animation: et-slide-up 0.18s ease;
        }

        /* diff highlight */
        .et-changed {
          border-color: #7c3aed !important;
          background: #f5f3ff !important;
        }

        .et-actions { display: flex; gap: 8px; margin-top: 2px; }
        .et-cancel {
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
        .et-cancel:hover { background: #e5e7eb; }
        .et-submit {
          flex: 2;
          background: #7c3aed;
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
        .et-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .et-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .et-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: et-spin 0.7s linear infinite;
        }
      `}</style>

            <div className="et-overlay" onClick={onClose}>
                <div className="et-modal" onClick={e => e.stopPropagation()}>
                    <div className="et-handle" />

                    <div className="et-header">
                        <div className="et-header-title">
                            <span className="et-title-pill">✏️ Edit Transaction</span>
                        </div>
                        <button className="et-close" onClick={onClose}>✕</button>
                    </div>

                    <form className="et-body" onSubmit={handleSubmit}>
                        {error && <div className="et-error">⚠️ {error}</div>}

                        {/* Description */}
                        <div className="et-field">
                            <label className="et-label">Description</label>
                            <input
                                className={`et-input${formData.expense !== transaction.expense ? ' et-changed' : ''}`}
                                name="expense"
                                type="text"
                                value={formData.expense}
                                onChange={handleInputChange}
                                placeholder="What did you spend on?"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Amount + Date */}
                        <div className="et-amount-row">
                            <div className="et-field" style={{ flex: 1 }}>
                                <label className="et-label">Amount</label>
                                <div className="et-amount-wrap">
                                    <span className="et-currency">₹</span>
                                    <input
                                        className={`et-amount-input${String(formData.amount) !== String(transaction.amount) ? ' et-changed' : ''}`}
                                        type="text"
                                        value={formData.amount}
                                        onChange={handleAmountChange}
                                        placeholder="0.00"
                                        required
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="et-field" style={{ flex: 1 }}>
                                <label className="et-label">Date</label>
                                <input
                                    className="et-input et-date-input"
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
                        <div className="et-field">
                            <label className="et-label">Category</label>
                            <div className="et-select-wrap">
                                <span className="et-select-icon">
                                    {getCategoryIcon(formData.category === 'Other (custom)' ? 'Other' : formData.category)}
                                </span>
                                <select
                                    className={`et-styled-select${formData.category !== (isKnownCategory ? transaction.category : 'Other (custom)') ? ' et-changed' : ''}`}
                                    value={formData.category}
                                    onChange={e => setFormData(p => ({ ...p, category: e.target.value, customCategory: e.target.value !== 'Other (custom)' ? '' : p.customCategory }))}
                                    disabled={loading}
                                >
                                    {knownCategories.map(cat => (
                                        <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                                    ))}
                                    <option value="Other (custom)">✏️ Other (custom)…</option>
                                </select>
                                <span className="et-select-chevron">▾</span>
                            </div>
                            {formData.category === 'Other (custom)' && (
                                <input
                                    className="et-input et-custom-input"
                                    type="text"
                                    name="customCategory"
                                    value={formData.customCategory || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter custom category…"
                                    disabled={loading}
                                />
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="et-field">
                            <label className="et-label">Payment Method</label>
                            <div className="et-select-wrap">
                                <span className="et-select-icon">💳</span>
                                <select
                                    className={`et-styled-select${formData.paymentMethod !== (isKnownPayment ? transaction.paymentMethod : 'Other (custom)') ? ' et-changed' : ''}`}
                                    value={formData.paymentMethod}
                                    onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value, customPayment: e.target.value !== 'Other (custom)' ? '' : p.customPayment }))}
                                    disabled={loading}
                                >
                                    {knownPaymentMethods.map(pm => (
                                        <option key={pm} value={pm}>{pm}</option>
                                    ))}
                                    <option value="Other (custom)">✏️ Other (custom)…</option>
                                </select>
                                <span className="et-select-chevron">▾</span>
                            </div>
                            {formData.paymentMethod === 'Other (custom)' && (
                                <input
                                    className="et-input et-custom-input"
                                    type="text"
                                    name="customPayment"
                                    value={formData.customPayment || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter payment method…"
                                    disabled={loading}
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className="et-actions">
                            <button type="button" className="et-cancel" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="et-submit" disabled={loading}>
                                {loading
                                    ? <><span className="et-spinner" /> Saving…</>
                                    : <>💾 Save Changes</>
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EditTransaction;