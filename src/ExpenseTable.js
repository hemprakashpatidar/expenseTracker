import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext.js';

// Add CSS animations for mobile cards
const addAnimationStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('mobile-card-animations')) {
    const style = document.createElement('style');
    style.id = 'mobile-card-animations';
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .mobile-card-enter {
        animation: slideInUp 0.4s ease-out;
      }
      
      .category-accent-glow {
        position: relative;
      }
      
      .category-accent-glow::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: inherit;
        border-radius: inherit;
        filter: blur(8px);
        opacity: 0.6;
        z-index: -1;
      }
    `;
    document.head.appendChild(style);
  }
};

// Function to format amount - only show decimals if they exist
const formatAmount = (amount) => {
  return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
};

// Function to format date from YYYY-MM-DD to dd-mm-yy
const formatDate = (dateString) => {
  if (!dateString || dateString === '—') return '—';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  } catch (error) {
    return '—';
  }
};

// Function to get category color based on category name
const getCategoryColor = (category) => {
  const colors = {
    'Food': '#FF6B35',
    'Travel': '#4A90E2',
    'Groceries': '#2ECC71',
    'Medicine': '#E74C3C',
    'Housing': '#8E44AD',
    'Utilities': '#F39C12',
    'Entertainment': '#E91E63',
    'Shopping': '#9C27B0',
    'Default': '#6C757D'
  };
  return colors[category] || colors['Default'];
};

// Function to get category icons
const getCategoryIcon = (category) => {
  const icons = {
    'Food': '🛒',
    'Travel': '🚗',
    'Groceries': '🛒',
    'Medicine': '💊',
    'Housing': '🏠',
    'Utilities': '⚡',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Other': '📦'
  };
  return icons[category] || '📦';
};

// Function to sort data
const sortData = (data, sortBy, direction = 'desc') => {
  return data.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        if (a.date === '—' && b.date === '—') return 0;
        if (a.date === '—') return 1;
        if (b.date === '—') return -1;
        
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        
        const dateA = new Date(2000 + yearA, monthA - 1, dayA);
        const dateB = new Date(2000 + yearB, monthB - 1, dayB);
        
        comparison = dateB - dateA;
        break;
      
      case 'amount':
        comparison = b.amount - a.amount;
        break;
      
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      
      case 'expense':
        comparison = a.expense.localeCompare(b.expense);
        break;
      
      default:
        return 0;
    }
    
    return direction === 'asc' ? -comparison : comparison;
  });
};

const ExpenseTable = () => {
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
        // Fetch both datasets and combine them
    Promise.all([
      fetch("https://ver-px.vercel.app/api/notion", {
        headers: {
          'Authorization': 'Bearer authenticated'
        }
      }).then(res => res.json()),
      fetch('https://ver-px.vercel.app/api/notion?type=cc', {
        headers: {
          'Authorization': 'Bearer authenticated'
        }
      }).then(res => res.json()).catch(err => {
        console.error('Error loading fallback data:', err);
        return { results: [] };
      })
    ])
    .then(([data1, data2]) => {
      // Parse data from first file
      const parsed1 = data1.results.map(row => ({
        expense: row.properties.Expense?.title?.[0]?.text?.content || '—',
        amount: row.properties.Amount?.number || 0,
        date: formatDate(row.properties.Date?.date?.start),
        category: row.properties.Category?.select?.name || 'Other'
      }));

      // Parse data from second file
      const parsed2 = data2.results.map(row => ({
        expense: row.properties.Expense?.title?.[0]?.text?.content || '—',
        amount: row.properties.Amount?.number || 0,
        date: formatDate(row.properties.Date?.date?.start),
        category: row.properties.Category?.select?.name || 'Other'
      }));

      // Combine both datasets
      const combinedData = [...parsed1, ...parsed2];
      
      // Store original data
      setOriginalData(combinedData);
      setFilteredData(combinedData);
      const sortedData = sortData([...combinedData], sortBy, sortDirection);
      setRows(sortedData);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      // Fallback: try to load just the local file if API fails
      fetch('/notion-data.json')
        .then(res => res.json())
        .then(data => {
          const parsed = data.results.map(row => ({
            expense: row.properties.Expense?.title?.[0]?.text?.content || '—',
            amount: row.properties.Amount?.number || 0,
            date: formatDate(row.properties.Date?.date?.start),
            category: row.properties.Category?.select?.name || 'Other'
          }));
          setOriginalData(parsed);
          setFilteredData(parsed);
          setRows(sortData([...parsed], sortBy, sortDirection));
        })
        .catch(fallbackError => {
          console.error('Error loading fallback data:', fallbackError);
          // Set empty data if all fails
          setOriginalData([]);
          setFilteredData([]);
          setRows([]);
        });
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

    setFilteredData(filtered);
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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '1rem' : '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    card: {
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: isMobile ? '15px' : '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    },
    header: {
      background: 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
      color: 'white',
      padding: isMobile ? '1.5rem 1rem' : '2rem',
      textAlign: 'center'
    },
    title: {
      margin: 0,
      fontSize: isMobile ? '1.8rem' : '2.5rem',
      fontWeight: '600',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      margin: '0.5rem 0 0 0',
      fontSize: isMobile ? '0.9rem' : '1.1rem',
      opacity: 0.9,
      fontWeight: '300'
    },
    controlsSection: {
      background: '#f8f9fa',
      borderBottom: '1px solid #e9ecef'
    },
    searchAndTotal: {
      padding: isMobile ? '1rem' : '1.5rem 2rem',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '1rem',
      alignItems: isMobile ? 'stretch' : 'center',
      justifyContent: 'space-between'
    },
    searchContainer: {
      position: 'relative',
      flex: isMobile ? 'none' : '1',
      maxWidth: isMobile ? '100%' : '300px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 40px 12px 16px',
      borderRadius: '10px',
      border: '2px solid #e9ecef',
      fontSize: '0.9rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    searchIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6c757d'
    },
    totalCard: {
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '10px',
      boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
      textAlign: 'center',
      minWidth: isMobile ? '100%' : 'auto'
    },
    categoryFilters: {
      padding: isMobile ? '1rem' : '1rem 2rem',
      display: 'flex',
      gap: '0.5rem',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    },
    categoryButton: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    sortControls: {
      padding: isMobile ? '1rem' : '1rem 2rem',
      display: 'flex',
      gap: '0.5rem',
      overflowX: 'auto',
      borderBottom: '1px solid #e9ecef'
    },
    sortButton: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap'
    },
    breakdownToggle: {
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      margin: isMobile ? '1rem' : '1rem 2rem 0 2rem'
    },
    breakdown: {
      padding: '1rem 2rem',
      background: '#fff',
      borderBottom: '1px solid #e9ecef'
    },
    breakdownGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    },
    breakdownCard: {
      padding: '1rem',
      borderRadius: '10px',
      textAlign: 'center',
      color: 'white',
      transition: 'transform 0.3s ease'
    },
    // Beautiful Mobile Card Layout
    mobileCardContainer: {
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem'
    },
    mobileCard: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
      borderRadius: '18px',
      padding: '0',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      overflow: 'hidden',
      position: 'relative'
    },
    mobileCardInner: {
      padding: '1.5rem',
      position: 'relative',
      zIndex: 2
    },
    categoryAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      zIndex: 1
    },
    mobileCardHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '1rem'
    },
    mobileCardExpense: {
      flex: 1,
      marginRight: '1rem'
    },
    expenseTitle: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#2c3e50',
      marginBottom: '0.5rem',
      lineHeight: '1.3'
    },
    categoryBadgeSmall: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'white',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    amountSection: {
      textAlign: 'right',
      minWidth: '80px'
    },
    mobileCardAmount: {
      fontSize: '1.4rem',
      fontWeight: '800',
      color: '#e74c3c',
      marginBottom: '0.3rem',
      textShadow: '0 1px 2px rgba(231, 76, 60, 0.1)'
    },
    currencySymbol: {
      fontSize: '1rem',
      fontWeight: '600',
      opacity: 0.8
    },
    mobileCardDate: {
      fontSize: '0.8rem',
      color: '#6c757d',
      background: 'rgba(108, 117, 125, 0.1)',
      padding: '4px 8px',
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: '500'
    },
    expandedInfo: {
      marginTop: '1.5rem',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: '12px',
      fontSize: '0.9rem',
      color: '#495057',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden'
    },
    expandedInfoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      pointerEvents: 'none'
    },
    expandedDetail: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.8rem',
      padding: '0.5rem 0',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
    },
    expandedLabel: {
      fontWeight: '600',
      color: '#495057',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    expandedValue: {
      fontWeight: '500',
      color: '#2c3e50'
    },
    expandedHint: {
      textAlign: 'center',
      fontStyle: 'italic',
      color: '#6c757d',
      fontSize: '0.8rem',
      marginTop: '1rem',
      opacity: 0.8
    },
    mobileTotalCard: {
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      color: 'white',
      borderRadius: '20px',
      padding: '2rem 1.5rem',
      textAlign: 'center',
      marginTop: '1rem',
      boxShadow: '0 12px 40px rgba(40, 167, 69, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    totalCardOverlay: {
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
      animation: 'shimmer 3s ease-in-out infinite',
      pointerEvents: 'none'
    },
    totalAmount: {
      fontSize: '2rem',
      fontWeight: '800',
      marginBottom: '0.5rem',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },
    totalLabel: {
      fontSize: '0.9rem',
      opacity: 0.9,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    // Desktop Table Styles
    tableContainer: {
      padding: isMobile ? '1rem' : '2rem',
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #495057 0%, #6c757d 100%)',
      color: 'white'
    },
    th: {
      padding: '1.2rem 1rem',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease'
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f1f3f4',
      fontSize: '0.95rem',
      color: '#2c3e50'
    },
    evenRow: {
      background: '#f8f9fa'
    },
    amountCell: {
      fontWeight: '600',
      color: '#e74c3c'
    },
    categoryBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500',
      color: 'white'
    },
    totalRow: {
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      color: 'white',
      fontWeight: '700',
      fontSize: '1.1rem'
    },
    totalRowTd: {
      padding: '1.5rem 1rem',
      borderBottom: 'none',
      color: 'white'
    },
    noData: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6c757d',
      fontSize: '1.1rem'
    }
  };

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

  const renderDesktopView = () => (
    <div style={styles.tableContainer}>
      {rows.length === 0 ? (
        <div style={styles.noData}>
          <p>📋 {filteredData.length === 0 && originalData.length > 0 ? 'No expenses match your filters' : 'Loading your expenses...'}</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th} onClick={() => handleSort('expense')}>
                🛍️ Expense {sortBy === 'expense' && (sortDirection === 'desc' ? '↓' : '↑')}
              </th>
              <th style={styles.th} onClick={() => handleSort('category')}>
                🏷️ Category {sortBy === 'category' && (sortDirection === 'desc' ? '↓' : '↑')}
              </th>
              <th style={styles.th} onClick={() => handleSort('amount')}>
                💵 Amount {sortBy === 'amount' && (sortDirection === 'desc' ? '↓' : '↑')}
              </th>
              <th style={styles.th} onClick={() => handleSort('date')}>
                📅 Date {sortBy === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr 
                key={i} 
                style={i % 2 === 0 ? styles.evenRow : {}}
              >
                <td style={styles.td}>{getCategoryIcon(r.category)} {r.expense}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.categoryBadge,
                    backgroundColor: getCategoryColor(r.category)
                  }}>
                    {r.category}
                  </span>
                </td>
                <td style={{...styles.td, ...styles.amountCell}}>₹{formatAmount(r.amount)}</td>
                <td style={styles.td}>{r.date}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr style={styles.totalRow}>
              <td style={styles.totalRowTd}>🎯 TOTAL</td>
              <td style={styles.totalRowTd}>—</td>
              <td style={styles.totalRowTd}>₹{formatAmount(totalAmount)}</td>
              <td style={styles.totalRowTd}>—</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );

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
        {isMobile ? renderMobileView() : renderDesktopView()}
      </div>
    </div>
  );
};

export default ExpenseTable;
