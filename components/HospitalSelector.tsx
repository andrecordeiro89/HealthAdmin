import React, { useState } from 'react';
import { HospitalOption } from '../types'; // Hospital enum no longer directly used for ID
import { UI_TEXT, COMPANY_NAME } from '../constants';
import { Modal } from './Modal'; // Import Modal
import { buttonPrimary, buttonSecondary, buttonLight, buttonSize, cardLarge } from './uiClasses';

interface HospitalSelectorProps {
  hospitals: HospitalOption[];
  onSelect: (hospitalId: string) => void; // hospitalId is now string
  onViewHistory?: () => void; 
  onManageMaterialDatabase?: () => void;
  onAddNewHospital: (hospitalName: string) => boolean; // Function to add a new hospital
  onGenerateGlobalConsumptionReport?: () => void; // New prop for global consumption report
}

export const HospitalSelector: React.FC<HospitalSelectorProps> = ({ 
  hospitals, 
  onSelect, 
  onViewHistory, 
  onManageMaterialDatabase,
  onAddNewHospital,
  onGenerateGlobalConsumptionReport
}) => {
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [newHospitalName, setNewHospitalName] = useState<string>('');

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start py-10 px-2 bg-transparent">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight mb-2 text-center">Selecione o Hospital</h2>
      <p className="text-base text-slate-500 mb-8 text-center">Escolha o hospital para iniciar o gerenciamento de documentos.</p>
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-10 px-2">
        {hospitals.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHospital(h.id)}
            className={`group flex flex-col items-center justify-center p-7 rounded-3xl shadow-2xl border-2 transition-all duration-300 bg-gradient-to-br from-white via-indigo-50 to-white hover:from-indigo-50 hover:to-purple-100 border-indigo-100 hover:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${selectedHospital === h.id ? 'ring-4 ring-purple-300 border-indigo-500 scale-[1.03]' : ''}`}
            style={{boxShadow: '0 6px 32px 0 rgba(80,60,180,0.10), 0 1.5px 6px 0 rgba(80,60,180,0.08)'}}
            title={selectedHospital === h.id ? 'Hospital selecionado' : 'Selecionar hospital'}
          >
            {/* Ícone temático premium para hospital */}
            <span className="mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="hospital-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a5b4fc" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <rect x="6" y="12" width="36" height="28" rx="6" fill="url(#hospital-grad)" />
                <rect x="14" y="24" width="6" height="8" rx="2" fill="#fff" />
                <rect x="28" y="24" width="6" height="8" rx="2" fill="#fff" />
                <rect x="22" y="18" width="4" height="8" rx="2" fill="#fff" />
                <rect x="20" y="32" width="8" height="4" rx="2" fill="#ede9fe" />
                <path d="M24 22v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 24h4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-lg font-bold text-indigo-800 mb-1 tracking-wide group-hover:text-purple-700 transition-colors duration-200">{h.name}</span>
            <span className="text-xs text-slate-400">ID: {h.id}</span>
          </button>
        ))}
      </div>
      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
        <input
          type="text"
          placeholder="Adicionar novo hospital..."
          value={newHospitalName}
          onChange={e => setNewHospitalName(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-400 text-base shadow transition-all duration-200 bg-white hover:border-indigo-400"
        />
        <button
          onClick={() => { if (newHospitalName.trim()) { onAddNewHospital?.(newHospitalName); setNewHospitalName(''); }}}
          className="px-7 py-3 text-base font-semibold rounded-xl shadow-lg bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-200 hover:border-purple-400 text-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
          title="Adicionar novo hospital"
        >Adicionar</button>
      </div>
      <div className="w-full max-w-4xl flex flex-wrap gap-4 justify-center mb-6">
        {onGenerateGlobalConsumptionReport && (
          <button
            onClick={onGenerateGlobalConsumptionReport}
            className="px-7 py-3 text-lg font-semibold rounded-lg shadow bg-gradient-to-br from-indigo-100 to-purple-200 hover:from-indigo-200 hover:to-purple-300 text-indigo-700 border border-indigo-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out"
            title="Gerar relatório global de consumo"
          >Relatório Global</button>
        )}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="px-7 py-3 text-lg font-semibold rounded-lg shadow bg-gradient-to-br from-indigo-100 to-purple-200 hover:from-indigo-200 hover:to-purple-300 text-indigo-700 border border-indigo-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out"
            title="Ver histórico de pedidos"
          >Histórico</button>
        )}
        {onManageMaterialDatabase && (
          <button
            onClick={onManageMaterialDatabase}
            className="px-7 py-3 text-lg font-semibold rounded-lg shadow bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 text-purple-700 border border-purple-200 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out"
            title="Gerenciar base de materiais"
          >Materiais</button>
        )}
        <button
          onClick={() => selectedHospital && onSelect(selectedHospital)}
          disabled={!selectedHospital}
          className={
            `px-10 py-3 text-lg font-semibold rounded-xl shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed` +
            (selectedHospital ? '' : ' opacity-50 cursor-not-allowed')
          }
          title="Confirmar hospital selecionado"
        >Confirmar</button>
      </div>
    </div>
  );
};
