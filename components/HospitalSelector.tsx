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
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white/90 overflow-hidden">
      <div className={"w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 flex flex-col items-center " + cardLarge}>
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Selecione o Hospital</h2>
        <div className="w-full flex flex-col gap-4 mb-6">
          {hospitals.map(h => (
            <button
              key={h.id}
              onClick={() => setSelectedHospital(h.id)}
              className={`${buttonPrimary} text-lg font-bold w-full px-6 py-4 border-2 transition focus:outline-none shadow-sm text-center justify-center items-center ${selectedHospital === h.id ? 'ring-2 ring-indigo-400' : ''} ${buttonSize}`}
              style={{display: 'flex'}}
              title={selectedHospital === h.id ? 'Hospital selecionado' : 'Selecionar hospital'}
            >
              {h.name}
            </button>
          ))}
        </div>
        <div className="w-full flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Adicionar novo hospital..."
            value={newHospitalName}
            onChange={e => setNewHospitalName(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 text-base"
          />
          <button
            onClick={() => { if (newHospitalName.trim()) { onAddNewHospital?.(newHospitalName); setNewHospitalName(''); }}}
            className={buttonLight + " px-6 py-2 text-base font-bold " + buttonSize}
            title="Adicionar novo hospital"
          >Adicionar</button>
        </div>
        <div className="w-full flex flex-wrap gap-4 justify-center mb-6">
          <button
            onClick={() => selectedHospital && onSelect(selectedHospital)}
            disabled={!selectedHospital}
            className={buttonPrimary + " px-8 py-3 text-lg font-bold" + (selectedHospital ? '' : ' opacity-50 cursor-not-allowed') + " " + buttonSize}
            title="Confirmar hospital selecionado"
          >Confirmar</button>
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className={buttonSecondary + " px-6 py-3 text-lg font-bold " + buttonSize}
              title="Ver histórico de pedidos"
            >Histórico</button>
          )}
          {onManageMaterialDatabase && (
            <button
              onClick={onManageMaterialDatabase}
              className={buttonLight + " px-6 py-3 text-lg font-bold " + buttonSize}
              title="Gerenciar base de materiais"
            >Materiais</button>
          )}
          {onGenerateGlobalConsumptionReport && (
            <button
              onClick={onGenerateGlobalConsumptionReport}
              className={buttonSecondary + " px-6 py-3 text-lg font-bold " + buttonSize}
              title="Gerar relatório global de consumo"
            >Relatório Global</button>
          )}
        </div>
      </div>
    </div>
  );
};
