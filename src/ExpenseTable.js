import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext.js';
import Loader from './components/Loader.js';
import { addAnimationStyles } from './utils/animations.js';
import { formatDate } from './utils/formatters.js';
import { getCategoryColor, getCategoryIcon } from './utils/categoryUtils.js';
import { formatAmount } from './utils/formatters.js';
import { sortData } from './utils/dataUtils.js';
import { stylesComponents } from './styles/styles.js';

const ExpenseTable = () => {
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(true);

  // Add animations on component mount
  useEffect(() => {
    addAnimationStyles();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsLoading(true); // Start loading
    //Todo add fucntion to fetch data from notion in separate file and use it here
    // Fetch both datasets and combine them
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
    
    // Prepare request body with user data
    const requestBody = {
      userName: userData?.userName || '',
      uuid: userData?.uuid || '',
      type: 'default',
      isMe: userData?.isMe || false
    };
    
    const ccRequestBody = {
      userName: userData?.userName || '',
      uuid: userData?.uuid || '',
      type: 'cc',
      isMe: userData?.isMe || false
    };
    
    // Prepare API calls - only include cc data if isMe is true
    const apiCalls = [
      fetch(`${apiPath}/api/notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer authenticated'
        },
        body: JSON.stringify(requestBody)
      }).then(res => res.json())
    ];

    // Only add cc data fetch if isMe is true
    if (userData?.isMe) {
      apiCalls.push(
        fetch(`${apiPath}/api/notion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer authenticated'
          },
          body: JSON.stringify(ccRequestBody)
        }).then(res => res.json()).catch(err => {
          console.error('Error loading cc data:', err);
          return { results: [] };
        })
      );
    }

    Promise.all(apiCalls)
    .then((results) => {
      // Parse data from first file (always present)
      const parsed1 = results[0].results.map(row => ({
        expense: row.properties.Expense?.title?.[0]?.text?.content || '—',
        amount: row.properties.Amount?.number || 0,
        date: formatDate(row.properties.Date?.date?.start),
        category: row.properties.Category?.select?.name || 'Other'
      }));

      // Parse data from second file (only if isMe is true)
      const parsed2 = results[1] ? results[1].results.map(row => ({
        expense: row.properties.Expense?.title?.[0]?.text?.content || '—',
        amount: row.properties.Amount?.number || 0,
        date: formatDate(row.properties.Date?.date?.start),
        category: row.properties.Category?.select?.name || 'Other'
      })) : [];

      // Combine both datasets
      const combinedData = [...parsed1, ...parsed2];
      
      // Store original data
      setOriginalData(combinedData);
      const sortedData = sortData([...combinedData], sortBy, sortDirection);
      setRows(sortedData);
      setIsLoading(false); // Stop loading
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      // Set empty data if API fails
      setOriginalData([]);
      setRows([]);
      setIsLoading(false); // Stop loading
    });
  }, []);

  // Filter and sort data when filters change
  useEffect(() => {
    let filtered = originalData;

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(row => row.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.expense.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sortedData = sortData([...filtered], sortBy, sortDirection);
    setRows(sortedData);
  }, [selectedCategory, searchTerm, sortBy, sortDirection, originalData]);

  // Get unique categories for filter buttons
  const categories = ['All', ...new Set(originalData.map(row => row.category))];

  // Calculate category breakdown
  const categoryBreakdown = originalData.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = { total: 0, count: 0 };
    }
    acc[row.category].total += row.amount;
    acc[row.category].count += 1;
    return acc;
  }, {});

  // Function to toggle sort
  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  // Calculate total amount of filtered data
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  const styles = stylesComponents(isMobile);
  const renderCategoryBreakdown = () => (
    <div style={styles.breakdown}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>💰 Spending Breakdown by Category</h3>
      <div style={styles.breakdownGrid}>
        {Object.entries(categoryBreakdown).map(([category, data]) => (
          <div
            key={category}
            style={{
              ...styles.breakdownCard,
              backgroundColor: getCategoryColor(category)
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {getCategoryIcon(category)}
            </div>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{category}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>₹{data.total.toFixed(2)}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{data.count} expenses</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMobileView = () => (
    <div style={styles.mobileCardContainer}>
      {rows.map((r, i) => (
        <div
          key={i}
          className="mobile-card-enter"
          style={{
            ...styles.mobileCard,
            transform: expandedCard === i ? 'scale(1.02) translateY(-4px)' : 'scale(1)',
            boxShadow: expandedCard === i 
              ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            animationDelay: `${i * 0.1}s`
          }}
          onClick={() => setExpandedCard(expandedCard === i ? null : i)}
        >
          {/* Category Accent Bar with Glow */}
          <div 
            className="category-accent-glow"
            style={{
              ...styles.categoryAccent,
              background: `linear-gradient(90deg, ${getCategoryColor(r.category)}, ${getCategoryColor(r.category)}dd)`,
              boxShadow: `0 0 20px ${getCategoryColor(r.category)}33`
            }} 
          />
          
          <div style={styles.mobileCardInner}>
            {/* First Line - Expense Name Only */}
            <div style={{
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                color: '#2c3e50',
                lineHeight: '1.3',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '1.4rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}>
                  {getCategoryIcon(r.category)}
                </span>
                {r.expense}
              </div>
            </div>

            {/* Second Line - Amount and Date */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* Amount */}
              <div style={{
                flex: 1
              }}>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 1px 2px rgba(231, 76, 60, 0.1)'
                }}>
                  ₹{formatAmount(r.amount)}
                </div>
              </div>

              {/* Date */}
              <div style={{
                background: `linear-gradient(135deg, ${getCategoryColor(r.category)}20, ${getCategoryColor(r.category)}10)`,
                border: `1px solid ${getCategoryColor(r.category)}30`,
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                📅 {r.date}
              </div>
            </div>

            {/* Expanded Information */}
            {expandedCard === i && (
              <div style={{
                ...styles.expandedInfo,
                animation: 'slideInUp 0.3s ease-out'
              }}>
                <div style={styles.expandedInfoOverlay} />
                
                <div style={styles.expandedDetail}>
                  <span style={styles.expandedLabel}>
                    💳 Category
                  </span>
                  <span style={{
                    ...styles.expandedValue,
                    color: getCategoryColor(r.category),
                    fontWeight: '700',
                    textShadow: `0 1px 2px ${getCategoryColor(r.category)}30`
                  }}>
                    {r.category}
                  </span>
                </div>
                
                <div style={styles.expandedDetail}>
                  <span style={styles.expandedLabel}>
                    💰 Amount
                  </span>
                  <span style={{
                    ...styles.expandedValue,
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '1.1rem',
                    fontWeight: '700'
                  }}>
                    ₹{formatAmount(r.amount)}
                  </span>
                </div>
                
                <div style={styles.expandedDetail}>
                  <span style={styles.expandedLabel}>
                    📅 Date
                  </span>
                  <span style={styles.expandedValue}>
                    {r.date}
                  </span>
                </div>
                
                <div style={styles.expandedDetail}>
                  <span style={styles.expandedLabel}>
                    🛍️ Description
                  </span>
                  <span style={styles.expandedValue}>
                    {r.expense}
                  </span>
                </div>
                
                <div style={{
                  ...styles.expandedHint,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  marginTop: '1rem'
                }}>
                  💡 Tap anywhere to collapse
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Beautiful Total Card */}
      <div style={{
        ...styles.mobileTotalCard,
        animation: 'slideInUp 0.6s ease-out'
      }}>
        <div style={styles.totalCardOverlay} />
        <div style={{
          ...styles.totalAmount,
          background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎯 ₹{formatAmount(totalAmount)}
        </div>
        <div style={styles.totalLabel}>
          Total Expenses
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          opacity: 0.8, 
          marginTop: '0.5rem',
          fontWeight: '400'
        }}>
          {rows.length} {rows.length === 1 ? 'expense' : 'expenses'}
        </div>
      </div>
    </div>
  );

  // Add loading check at the beginning of the render function
  if (isLoading) {
    return (
      <Loader 
        message="Loading Your Expenses" 
        subMessage="Fetching data from Notion database"
        size="large"
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={styles.title}>💰 Expense Tracker</h1>
              <p style={styles.subtitle}>Track your expenses from Notion</p>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          {/* Search and Total */}
          <div style={styles.searchAndTotal}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="🔍 Search expenses..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9ecef';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>

            <div style={styles.totalCard}>
              <p style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.1rem', fontWeight: '600' }}>
                Total: ₹{formatAmount(totalAmount)}
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                {rows.length} of {originalData.length} expenses
              </p>
            </div>
          </div>

          {/* Category Filters */}
          <div style={styles.categoryFilters}>
            {categories.map((category) => (
              <button
                key={category}
                style={{
                  ...styles.categoryButton,
                  background: selectedCategory === category 
                    ? getCategoryColor(category) 
                    : '#fff',
                  color: selectedCategory === category ? '#fff' : '#6c757d',
                  border: selectedCategory === category 
                    ? 'none' 
                    : '2px solid #e9ecef'
                }}
                onClick={() => setSelectedCategory(category)}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.target.style.background = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {category === 'All' ? '📋' : getCategoryIcon(category)} {category}
              </button>
            ))}
          </div>

          {/* Breakdown Toggle */}
          <button
            style={styles.breakdownToggle}
            onClick={() => setShowBreakdown(!showBreakdown)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(111, 66, 193, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            📊 {showBreakdown ? 'Hide' : 'Show'} Category Breakdown
          </button>

          {/* Category Breakdown */}
          {showBreakdown && renderCategoryBreakdown()}
        </div>

        {/* Content - Mobile Cards or Desktop Table */}
        {renderMobileView()}
      </div>
    </div>
  );
};

export default ExpenseTable;
