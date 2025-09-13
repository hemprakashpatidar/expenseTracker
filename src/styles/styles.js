export  const stylesComponents = (isMobile) => ({
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
      minWidth: 'auto'
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
  });