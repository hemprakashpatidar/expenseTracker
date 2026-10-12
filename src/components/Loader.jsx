import React from 'react';

const Loader = ({ message = "Loading...", subMessage = "", size = "large" }) => {
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '2rem'
    },
    loader: {
      width: size === 'large' ? '80px' : size === 'medium' ? '60px' : '40px',
      height: size === 'large' ? '80px' : size === 'medium' ? '60px' : '40px',
      border: `${size === 'large' ? '6px' : size === 'medium' ? '4px' : '3px'} solid rgba(255, 255, 255, 0.3)`,
      borderTop: `${size === 'large' ? '6px' : size === 'medium' ? '4px' : '3px'} solid white`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '2rem'
    },
    text: {
      fontSize: size === 'large' ? '1.5rem' : size === 'medium' ? '1.2rem' : '1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      textAlign: 'center'
    },
    subtext: {
      fontSize: size === 'large' ? '1rem' : size === 'medium' ? '0.9rem' : '0.8rem',
      opacity: 0.8,
      textAlign: 'center',
      maxWidth: '300px',
      lineHeight: '1.4'
    },
    dots: {
      display: 'inline-block',
      animation: 'pulse 1.5s ease-in-out infinite'
    },
    icon: {
      fontSize: size === 'large' ? '2rem' : size === 'medium' ? '1.5rem' : '1.2rem',
      marginBottom: '1rem',
      animation: 'bounce 2s infinite'
    }
  };

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.icon}>💰</div>
      <div style={styles.loader}></div>
      <div style={styles.text}>
        {message}<span style={styles.dots}>...</span>
      </div>
      {subMessage && (
        <div style={styles.subtext}>
          {subMessage}
        </div>
      )}
    </div>
  );
};

export default Loader; 