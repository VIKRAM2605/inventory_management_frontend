import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const ErrorPortal = ({ children, isVisible }) => {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    // Get or create the portal container
    let container = document.getElementById('error-portal-root');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-portal-root';
      container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        isolation: isolate !important;
      `;
      document.body.appendChild(container);
    }
    
    setPortalRoot(container);

    // 🎯 ADD ERROR STATE CLASS TO BODY
    if (isVisible) {
      document.body.classList.add('error-modal-active');
    } else {
      document.body.classList.remove('error-modal-active');
    }

    return () => {
      document.body.classList.remove('error-modal-active');
      if (container && container.children.length === 0) {
        // Don't remove container, keep it for reuse
      }
    };
  }, [isVisible]);

  if (!isVisible || !portalRoot) return null;
  
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'auto',
        isolation: 'isolate'
      }}
    >
      {children}
    </div>,
    portalRoot
  );
};

export default ErrorPortal;
