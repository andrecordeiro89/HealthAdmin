import React from 'react';

interface SpinnerProps {
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text = "Carregando..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-transparent">
      <div className="flex flex-row items-center justify-center mb-6 select-none">
        <span className="text-4xl sm:text-5xl font-extrabold text-indigo-700 tracking-tight">HealthAdmin</span>
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
          <polyline points="2,12 11,12 15,21 21,3 27,18 32,12 46,12" stroke="#4F46E5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex flex-col items-center justify-center">
        <style>{`
          .loader {
            width: 48px;
            height: 48px;
            margin: auto;
            position: relative;
          }
          .loader:before {
            content: '';
            width: 48px;
            height: 5px;
            background: #4F46E580;
            position: absolute;
            top: 60px;
            left: 0;
            border-radius: 50%;
            animation: shadow324 0.5s linear infinite;
          }
          .loader:after {
            content: '';
            width: 100%;
            height: 100%;
            background: #4F46E5;
            position: absolute;
            top: 0;
            left: 0;
            border-radius: 4px;
            animation: jump7456 0.5s linear infinite;
          }
          @keyframes jump7456 {
            15% { border-bottom-right-radius: 3px; }
            25% { transform: translateY(9px) rotate(22.5deg); }
            50% { transform: translateY(18px) scale(1, .9) rotate(45deg); border-bottom-right-radius: 40px; }
            75% { transform: translateY(9px) rotate(67.5deg); }
            100% { transform: translateY(0) rotate(90deg); }
          }
          @keyframes shadow324 {
            0%, 100% { transform: scale(1, 1); }
            50% { transform: scale(1.2, 1); }
          }
        `}</style>
        <div className="loader"></div>
      </div>
      <p className="mt-6 text-lg font-semibold text-slate-600 text-center">{text}</p>
    </div>
  );
};
