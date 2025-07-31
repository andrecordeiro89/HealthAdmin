import React from 'react';

interface SpinnerProps {
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text = "Carregando..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-transparent">
      {/* Header Premium HealthAdmin */}
      <div className="flex flex-col items-center mb-8 relative">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm text-center mb-3" 
            style={{ 
              letterSpacing: '-0.02em',
              fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
              textShadow: '0 0 40px rgba(139, 92, 246, 0.15)'
            }}>
          HealthAdmin
        </h1>
        
        <p className="text-base sm:text-lg font-semibold text-slate-500 tracking-widest uppercase opacity-90 mb-4" 
           style={{ 
             letterSpacing: '0.15em',
             fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
             fontSize: '0.875rem'
           }}>
          Sistema Inteligente de Reposição OPME
        </p>
        
        {/* Linha Decorativa Premium */}
        <div className="w-full flex justify-center items-center">
          <div className="w-full max-w-md flex items-center relative">
            <div className="flex-1 relative">
              <div className="w-full h-[3px] rounded-full shadow-lg relative overflow-hidden" 
                   style={{ 
                     background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, #e0e7ff 20%, #c7d2fe 35%, #a5b4fc 50%, #c7d2fe 65%, #e0e7ff 80%, rgba(255,255,255,0) 100%)', 
                     boxShadow: '0 4px 16px 0 rgba(139, 92, 246, 0.25), 0 2px 8px 0 rgba(79, 70, 229, 0.15)' 
                   }}>
                {/* Brilho animado sutil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" 
                     style={{ animationDuration: '3s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Animation Premium */}
      <div className="flex flex-col items-center justify-center mb-8">
        <style>{`
          .premium-loader {
            width: 60px;
            height: 60px;
            position: relative;
            margin: 20px auto;
          }
          .premium-loader::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 4px solid transparent;
            border-top: 4px solid #8b5cf6;
            border-right: 4px solid #6366f1;
            border-radius: 50%;
            animation: premium-spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          }
          .premium-loader::after {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            width: calc(100% - 16px);
            height: calc(100% - 16px);
            border: 3px solid transparent;
            border-bottom: 3px solid #a855f7;
            border-left: 3px solid #4f46e5;
            border-radius: 50%;
            animation: premium-spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite reverse;
          }
          @keyframes premium-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .pulse-dot {
            width: 8px;
            height: 8px;
            background: linear-gradient(45deg, #8b5cf6, #6366f1);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: pulse-dot 1.5s ease-in-out infinite;
          }
          @keyframes pulse-dot {
            0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          }
        `}</style>
        <div className="premium-loader">
          <div className="pulse-dot"></div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center max-w-md">
        <p className="text-lg font-semibold text-slate-700 mb-2">{text}</p>
        <p className="text-sm text-slate-500">Processando com Inteligência Artificial...</p>
      </div>
    </div>
  );
};
