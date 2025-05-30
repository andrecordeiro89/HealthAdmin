import React from 'react';
import { COMPANY_NAME } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50/80 backdrop-blur-md text-slate-500 py-6 mt-auto border-t border-gray-200">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} <span className="text-slate-700 font-bold tracking-tight">{COMPANY_NAME}</span>. Todos os direitos reservados (Simulado).</p> {/* Changed font-semibold to font-bold and added tracking-tight */}
        <p className="text-sm">Uma solução <span className="text-slate-600 font-bold tracking-tight">{COMPANY_NAME}</span>.</p> {/* Changed to font-bold and added tracking-tight */}
      </div>
    </footer>
  );
};