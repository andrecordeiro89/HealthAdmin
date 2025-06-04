import React from 'react';
import { COMPANY_NAME } from '../constants';

interface HeaderProps {
  title: string; // Expected format: "HealthAdmin - Sistema de Reposição OPME"
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const titleParts = title.split(' - ');
  const companyName = titleParts[0]; // Should be "HealthAdmin"
  const systemName = titleParts.slice(1).join(' - ');

  return (
    <header className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-5 text-center">
        <h1 className="text-3xl font-bold text-slate-700 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 32"
            className="w-8 h-8 mr-2 text-indigo-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 16H14L20 8L28 24L36 12L42 16H52" />
            <circle cx="57" cy="16" r="3" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-indigo-600 font-extrabold tracking-tight">{companyName}</span>
          {systemName && <span className="font-semibold text-slate-600"> - {systemName}</span>}
        </h1>
      </div>
    </header>
  );
};
