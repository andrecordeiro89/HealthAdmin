import React, { useEffect } from 'react';
import { modalBase, buttonLight, buttonSize, cardLarge } from './uiClasses';
import ReactDOM from 'react-dom';

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
  
  const modalCloseIcon = "text-indigo-500 hover:text-indigo-700 p-2 rounded-full hover:bg-indigo-100/70 transition-colors duration-150 text-2xl"; 

  const modalContent = (
    <>
      <style>{`
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-scale-in {
          animation: modal-scale-in 0.2s ease-out forwards;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{padding: 0, margin: 0}}>
        <div
          className={`bg-white p-8 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto text-slate-700 animate-modal-scale-in border border-gray-200 relative flex flex-col`}
          onClick={e => e.stopPropagation()}
          style={{boxSizing: 'border-box'}}
        >
          {title && (
            <div className="sticky top-0 z-10 bg-white flex justify-between items-center mb-6 pb-4 border-b border-gray-200" style={{paddingTop: 0}}>
              <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-4">{title}</h2>
              <button
                onClick={onClose}
                className="ml-2 text-lg font-bold text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 bg-transparent border-none p-0 h-5 w-5 flex items-center justify-center"
                aria-label="Fechar modal"
                style={{lineHeight: 1, fontSize: '1.5rem'}}
              >
                ×
              </button>
            </div>
          )}
          <div className="text-lg w-full flex-1">{children}</div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
