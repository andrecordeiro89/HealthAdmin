import React, { useState } from 'react';
import { HospitalOption } from '../types'; // Hospital enum no longer directly used for ID
import { UI_TEXT, COMPANY_NAME } from '../constants';
import { Modal } from './Modal'; // Import Modal
import { buttonPrimary, buttonSecondary, buttonLight, buttonSize, cardLarge } from './uiClasses';

interface HospitalSelectorProps {
  hospitals: HospitalOption[];
  selectedHospital: string | null;
  setSelectedHospital: React.Dispatch<React.SetStateAction<string | null>>;
  onSelect: (hospitalId: string) => void; // hospitalId is now string
  onViewHistory?: () => void;
  onManageMaterialDatabase?: () => void;
  onAddNewHospital: (hospitalName: string) => boolean; // Function to add a new hospital
  onGenerateGlobalConsumptionReport?: () => void; // New prop for global consumption report
  showTooltips: boolean;
  setShowTooltips: React.Dispatch<React.SetStateAction<boolean>>;
  onRemoveHospital: (hospitalId: string) => void;
  onEditHospitalName: (hospitalId: string, newName: string) => void;
}

// Novo componente para o botão de engrenagem
const SettingsButton = ({ onClick }: { onClick: () => void }) => (
  <button
    aria-label="Abrir configurações"
    className="p-2 rounded-full hover:bg-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
    onClick={onClick}
    type="button"
  >
    {/* Heroicons engrenagem premium com linhas mais grossas */}
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#6366f1" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.572-1.01c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.572c-.94-1.543.826-3.31 2.37-2.37.996.608 2.265.07 2.572-1.01z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </button>
);

// Novo componente para o modal de configurações (unificado, premium, corporativo)
const SettingsModal = ({ isOpen, onClose, showTooltips, setShowTooltips, newHospitalName, setNewHospitalName, onAddNewHospital, hospitals, onRemoveHospital, onEditHospitalName }: any) => {
  const [editingHospitalId, setEditingHospitalId] = React.useState<string | null>(null);
  const [editingHospitalName, setEditingHospitalName] = React.useState<string>('');
  const [hospitalToDelete, setHospitalToDelete] = React.useState<any | null>(null);

  const handleConfirmDelete = () => {
    if (hospitalToDelete) {
      onRemoveHospital && onRemoveHospital(hospitalToDelete.id);
      setHospitalToDelete(null);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] font-sans" style={{fontFamily: 'Inter, Nunito Sans, Arial, sans-serif'}}>
      <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-lg relative flex flex-col overflow-hidden border border-indigo-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 z-10" aria-label="Fechar configurações">
          <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="flex flex-col gap-8 p-8 md:p-10 bg-white min-w-[320px]">
          <h2 className="text-2xl font-extrabold tracking-tight text-indigo-800 mb-2">Configurações</h2>
          {/* Preferências */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Preferências</h3>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Exibir dicas de feedback</span>
              <button onClick={() => setShowTooltips((v: boolean) => !v)} className={`w-12 h-7 rounded-full transition bg-indigo-100 ${showTooltips ? 'bg-indigo-400' : 'bg-slate-200'} shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-300`}>
                <span className={`block w-6 h-6 rounded-full bg-white shadow transform transition ${showTooltips ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
          </div>
          {/* Hospitais */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Hospitais</h3>
            <label className="block mb-2 font-medium">Adicionar novo hospital</label>
            <div className="flex flex-row gap-2 mb-6 flex-wrap items-center">
              <input
                type="text"
                placeholder="Nome do hospital..."
                value={newHospitalName}
                onChange={e => setNewHospitalName(e.target.value)}
                className="flex-1 min-w-[160px] px-4 py-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 text-base shadow bg-white transition"
              />
              <button
                onClick={() => { if (newHospitalName.trim()) { onAddNewHospital?.(newHospitalName); setNewHospitalName(''); }}}
                className="min-w-[110px] px-5 py-2 text-base font-semibold rounded-xl shadow bg-gradient-to-br from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500 border-none text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={!newHospitalName.trim()}
              >Adicionar</button>
            </div>
            <label className="block mb-2 font-medium">Editar ou excluir hospital</label>
            <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white/90 shadow">
              {hospitals && hospitals.length > 0 ? hospitals.map((h: any) => (
                <li key={h.id} className="flex items-center justify-between px-3 py-2 group hover:bg-indigo-50/40 transition">
                  {editingHospitalId === h.id ? (
                    <>
                      <input
                        type="text"
                        value={editingHospitalName}
                        onChange={e => setEditingHospitalName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 text-base bg-white mr-2 transition"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (editingHospitalName.trim() && editingHospitalName !== h.name) {
                            onEditHospitalName && onEditHospitalName(h.id, editingHospitalName.trim());
                          }
                          setEditingHospitalId(null);
                        }}
                        className="p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition mr-1 focus:outline-none focus:ring-2 focus:ring-green-300"
                        title="Salvar nome"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <button
                        onClick={() => setEditingHospitalId(null)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-300"
                        title="Cancelar"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-slate-700 text-sm font-medium truncate">{h.name}</span>
                      <span className="text-xs text-slate-400">ID: {h.id}</span>
                      <button
                        onClick={() => { setEditingHospitalId(h.id); setEditingHospitalName(h.name); }}
                        className="ml-2 p-1 rounded hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        title="Editar nome do hospital"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" className="transition-transform group-hover:scale-110">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setHospitalToDelete(h)}
                        className="ml-2 p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-300"
                        title={`Excluir ${h.name}`}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                          <rect x="3" y="6" width="18" height="13" rx="2"/>
                          <path d="M8 10v4M12 10v4M16 10v4"/>
                          <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </>
                  )}
                </li>
              )) : <li className="px-3 py-2 text-slate-400 text-sm">Nenhum hospital cadastrado</li>}
            </ul>
          </div>
        </div>
      </div>
      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={!!hospitalToDelete} onClose={() => setHospitalToDelete(null)} title="Confirmar Exclusão" size="sm">
        <div className="flex flex-col items-center gap-4 py-2">
          <span className="text-lg text-slate-700 text-center">Tem certeza que deseja excluir o hospital <b>{hospitalToDelete?.name}</b>?</span>
          <div className="flex flex-row gap-4 mt-4 justify-center">
            <button onClick={() => setHospitalToDelete(null)} className={buttonLight + ' ' + buttonSize}>Cancelar</button>
            <button onClick={handleConfirmDelete} className={buttonPrimary + ' ' + buttonSize + ' bg-gradient-to-br from-red-500 to-red-700 text-white'}>Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const HospitalSelector: React.FC<HospitalSelectorProps> = ({ 
  hospitals, 
  selectedHospital,
  setSelectedHospital,
  onSelect, 
  onViewHistory, 
  onManageMaterialDatabase,
  onAddNewHospital,
  onGenerateGlobalConsumptionReport,
  showTooltips,
  setShowTooltips,
  onRemoveHospital,
  onEditHospitalName
}) => {
  const [newHospitalName, setNewHospitalName] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const cardsContainerRef = React.useRef<HTMLDivElement>(null);

  // Função para remover hospital
  const handleRemoveHospital = (id: string) => {
    if (typeof onRemoveHospital === 'function') {
      onRemoveHospital(id);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start py-10 px-2 bg-transparent relative">
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        showTooltips={showTooltips}
        setShowTooltips={setShowTooltips}
        newHospitalName={newHospitalName}
        setNewHospitalName={setNewHospitalName}
        onAddNewHospital={onAddNewHospital}
        hospitals={hospitals}
        onRemoveHospital={handleRemoveHospital}
        onEditHospitalName={onEditHospitalName}
      />

      <div ref={cardsContainerRef} className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-10 px-2">
        {hospitals.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHospital(h.id)}
            className={`group flex flex-col items-center justify-center p-7 rounded-3xl shadow-2xl border-2 transition-all duration-300 bg-gradient-to-br from-white via-indigo-50 to-white hover:from-indigo-50 hover:to-purple-100 border-indigo-100 hover:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${selectedHospital === h.id ? 'ring-4 ring-purple-300 border-indigo-500 scale-[1.03]' : ''}`}
            style={{boxShadow: '0 6px 32px 0 rgba(80,60,180,0.10), 0 1.5px 6px 0 rgba(80,60,180,0.08)'}}
            title={selectedHospital === h.id ? 'Hospital selecionado' : 'Selecionar hospital'}
          >
            {/* Ícone de hospital com cruz médica */}
            <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 group-hover:text-purple-600 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-indigo-800 tracking-wide group-hover:text-purple-700 transition-colors duration-200 text-center">{h.name}</span>
          </button>
        ))}
      </div>
      <div className="w-full max-w-4xl flex flex-wrap gap-4 justify-center mb-6 items-center">
        {/* Botão de configurações à esquerda do botão Materiais */}
        <SettingsButton onClick={() => setShowSettings(true)} />
        {onGenerateGlobalConsumptionReport && (
          <button
            onClick={onGenerateGlobalConsumptionReport}
            className="px-7 py-3 text-lg font-semibold rounded-lg shadow bg-gradient-to-br from-indigo-100 to-purple-200 hover:from-indigo-200 hover:to-purple-300 text-indigo-700 border border-indigo-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out mb-0"
            title="Gerar relatório global de consumo"
          >Relatório Global</button>
        )}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="px-7 py-3 text-lg font-semibold rounded-lg shadow bg-gradient-to-br from-indigo-100 to-purple-200 hover:from-indigo-200 hover:to-purple-300 text-indigo-700 border border-indigo-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out mb-0"
            title="Ver histórico de pedidos"
          >Histórico</button>
        )}
        {onManageMaterialDatabase && (
          <button
            onClick={onManageMaterialDatabase}
            className="px-7 py-3 text-lg font-semibold rounded-lg shadow bg-gradient-to-br from-indigo-100 to-purple-200 hover:from-indigo-200 hover:to-purple-300 text-indigo-700 border border-indigo-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out mb-0"
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
