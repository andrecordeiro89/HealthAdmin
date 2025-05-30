

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; 
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };
  
  const modalCloseIcon = "text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-100/70 transition-colors duration-150"; 

  return (
    <>
      <style>{`
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); } /* Added translateY */
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-scale-in {
          animation: modal-scale-in 0.2s ease-out forwards;
        }
      `}</style>
      <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 transition-opacity duration-300 backdrop-blur-sm" 
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
      >
        <div
          className={`bg-white p-6 rounded-lg shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto text-slate-700 transform transition-all duration-300 scale-95 opacity-0 animate-modal-scale-in border border-gray-200`}
          onClick={(e) => e.stopPropagation()} 
        >
          {title && (
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h2 id="modal-title" className="text-xl font-semibold text-indigo-600">{title}</h2> 
              <button 
                onClick={onClose} 
                className={modalCloseIcon}
                aria-label="Fechar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div>{children}</div>
        </div>
      </div>
    </>
  );
};
