import React from 'react';

const InlineLoader = ({ size = "small", color = "#667eea" }) => {
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    loader: {
      width: size === 'small' ? '16px' : size === 'medium' ? '24px' : '32px',
      height: size === 'small' ? '16px' : size === 'medium' ? '24px' : '32px',
      border: `${size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px'} solid ${color}20`,
      borderTop: `${size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px'} solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    text: {
      fontSize: size === 'small' ? '0.9rem' : size === 'medium' ? '1rem' : '1.1rem',
      color: color,
      fontWeight: '500'
    }
  };

  // Add CSS animation if not already present
  React.useEffect(() => {
    if (!document.getElementById('inline-loader-animation')) {
      const style = document.createElement('style');
      style.id = 'inline-loader-animation';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.loader}></div>
      <span style={styles.text}>Loading...</span>
    </div>
  );
};

export default InlineLoader; 