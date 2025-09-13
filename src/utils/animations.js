// Add CSS animations for mobile cards
export const addAnimationStyles = () => {
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
