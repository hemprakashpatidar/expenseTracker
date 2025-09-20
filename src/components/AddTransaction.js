import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { getCategoryColor, getCategoryIcon } from '../utils/categoryUtils.js';
import { formatAmount } from '../utils/formatters.js';

const AddTransaction = ({ onClose, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    expense: '',
    amount: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    category: 'Other',
    paymentMethod: 'UPI' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Available categories
  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Education',
    'Other'
  ];
  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Wallet'];

  // Input sanitization
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>\"'&]/g, (match) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeInput(value)
    }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        amount: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
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
      
      // Get user data from localStorage
      const authData = localStorage.getItem('expense_tracker_auth');
      let userData = null;
      if (authData) {
        try {
          userData = JSON.parse(authData);
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }

      // Prepare request body
      const requestBody = {
        userName: userData?.userName || '',
        uuid: userData?.uuid || '',
        isMe: userData?.isMe || false,
          expense: formData.expense.trim(),
          amount: amount,
          date: formData.date,
          category: formData.category,
          paymentMethod: formData.paymentMethod
      };

      const response = await fetch(`${apiPath}/api/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer authenticated'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok) {
        // Success - close modal and refresh data
        onTransactionAdded && onTransactionAdded();
        onClose();
      } else {
        setError(result.message || 'Failed to add transaction. Please try again.');
      }
    } catch (error) {
      console.error('Add transaction error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    },
    modal: {
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      animation: 'slideInUp 0.3s ease-out',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: '2px solid #f8f9fa'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#6c757d',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '0.5rem'
    },
    input: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e9ecef',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    select: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e9ecef',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    categoryOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '4px'
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      marginTop: '8px'
    },
    categoryButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '2px solid #e9ecef',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    selectedCategory: {
      borderColor: '#667eea',
      backgroundColor: '#f8f9ff'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1rem'
    },
    button: {
      flex: 1,
      padding: '12px 24px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },
    secondaryButton: {
      background: '#f8f9fa',
      color: '#6c757d',
      border: '2px solid #e9ecef'
    },
    error: {
      background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '0.9rem',
      textAlign: 'center',
      marginBottom: '1rem'
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTopColor: '#fff',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '8px'
    }
  };

  // Add spinner animation
  useEffect(() => {
    if (!document.getElementById('add-transaction-spinner')) {
      const style = document.createElement('style');
      style.id = 'add-transaction-spinner';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>💰 Add New Transaction</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.color = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            ✕
          </button>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="expense">
              📝 Description *
            </label>
            <input
              id="expense"
              name="expense"
              type="text"
              value={formData.expense}
              onChange={handleInputChange}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
              placeholder="What did you spend on?"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="amount">
              💵 Amount (₹) *
            </label>
            <input
              id="amount"
              name="amount"
              type="text"
              value={formData.amount}
              onChange={handleAmountChange}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
              placeholder="0.00"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="date">
              📅 Date *
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              🏷️ Category *
            </label>
            <div style={styles.categoryGrid}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  style={{
                    ...styles.categoryButton,
                    ...(formData.category === category ? styles.selectedCategory : {}),
                    borderColor: formData.category === category ? getCategoryColor(category) : '#e9ecef',
                    backgroundColor: formData.category === category ? `${getCategoryColor(category)}20` : 'white'
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, category }))}
                  disabled={loading}
                  onMouseEnter={(e) => {
                    if (formData.category !== category) {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.borderColor = getCategoryColor(category);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.category !== category) {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#e9ecef';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>
                    {getCategoryIcon(category)}
                  </span>
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={styles.inputGroup}>
  <label style={styles.label} htmlFor="paymentMethod">
    💳 Payment Type *
  </label>
  <select
    id="paymentMethod"
    name="paymentMethod"
    value={formData.paymentMethod}
    onChange={handleInputChange}
    style={styles.select}
    disabled={loading}
  >
    {paymentMethods.map((type) => (
      <option key={type} value={type}>
        {type}
      </option>
    ))}
  </select>
</div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={{
                ...styles.button,
                ...styles.secondaryButton
              }}
              onClick={onClose}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#e9ecef';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.button,
                ...styles.primaryButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {loading && <span style={styles.loadingSpinner}></span>}
              {loading ? 'Adding...' : '➕ Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;
