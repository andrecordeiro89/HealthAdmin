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
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-2">
      <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Selecione o Hospital</h2>
      <p className="text-base text-slate-500 mb-8 text-center">Escolha o hospital para iniciar o gerenciamento de documentos.</p>
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-10 px-2">
        {hospitals.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHospital(h.id)}
            className={`group flex flex-col items-center justify-center p-6 rounded-2xl shadow-xl border-2 transition-all duration-200 bg-white hover:bg-indigo-50 border-gray-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${selectedHospital === h.id ? 'ring-4 ring-indigo-300 border-indigo-500' : ''}`}
            title={selectedHospital === h.id ? 'Hospital selecionado' : 'Selecionar hospital'}
          >
            {/* Ícone de hospital colorido */}
            <span className="mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="7" width="18" height="13" rx="3" fill="#ede9fe" />
                <path d="M8 21V17a1 1 0 011-1h6a1 1 0 011 1v4" stroke="#6366f1" strokeWidth="2" />
                <path d="M12 10v4" stroke="#a21caf" strokeWidth="2" />
                <path d="M10 12h4" stroke="#a21caf" strokeWidth="2" />
                <rect x="7" y="10" width="2" height="2" rx="1" fill="#a5b4fc" />
                <rect x="15" y="10" width="2" height="2" rx="1" fill="#a5b4fc" />
              </svg>
            </span>
            <span className="text-lg font-bold text-indigo-800 mb-1">{h.name}</span>
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
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 text-base"
        />
        <button
          onClick={() => { if (newHospitalName.trim()) { onAddNewHospital?.(newHospitalName); setNewHospitalName(''); }}}
          className="px-7 py-2 text-base font-semibold rounded-lg shadow-lg bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-200 hover:border-purple-400 text-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
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
