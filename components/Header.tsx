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
    <header className="sticky top-0 z-40 bg-transparent w-full">
      <div className="container mx-auto px-4 py-5 flex items-center justify-end">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight flex items-center gap-3">
          {systemName && <span className="font-semibold text-slate-600 text-2xl">- {systemName}</span>}
        </h1>
      </div>
    </header>
  );
};
