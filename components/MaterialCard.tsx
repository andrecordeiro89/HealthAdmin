import React, { useMemo, useRef, useState } from 'react';
import { MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';
import { inputBase, labelBase } from './uiClasses';

interface MaterialCardProps {
  material: MaterialUsed;
  index: number;
  onMaterialChange: (index: number, material: MaterialUsed) => void;
  onRemoveMaterial: (index: number) => void;
  materialDbItems?: import('../types').MaterialDatabaseItem[];
  badgeClass: string;
  removeMaterialButtonClass: string;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  index,
  onMaterialChange,
  onRemoveMaterial,
  materialDbItems = [],
  badgeClass,
  removeMaterialButtonClass,
}) => {
  const inputClass = inputBase +
    " h-12 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-base placeholder-slate-400";
  const labelClass = labelBase + " text-slate-700 font-semibold mb-1 flex items-center gap-1";

  // Autocomplete e validação para cada campo de descrição
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const filteredSuggestions = useMemo(() => {
    const desc = material.description.trim().toLowerCase();
    if (!desc) return [];
    return materialDbItems.filter(m => m.description.toLowerCase().includes(desc));
  }, [material.description, materialDbItems]);

  const isDuplicateDesc = useMemo(() => {
    const desc = material.description.trim().toLowerCase();
    return desc && materialDbItems.some(m => m.description.toLowerCase() === desc);
  }, [material.description, materialDbItems]);

  return (
    <div
      className={`relative mb-8 last:mb-0 p-6 rounded-xl border-2 border-indigo-100 shadow-md bg-white transition-all duration-200 group hover:shadow-xl hover:border-indigo-300`}
    >
      {/* Header premium: Checkbox Contaminado no topo à esquerda */}
      <div className="flex items-center mb-4 gap-3">
        <input
          type="checkbox"
          id={`contaminated-${index}`}
          checked={!!material.contaminated}
          onChange={e => onMaterialChange(index, { ...material, contaminated: e.target.checked })}
          className="accent-red-500 w-5 h-5 mr-2"
        />
        <label htmlFor={`contaminated-${index}`} className="text-red-600 font-semibold text-base cursor-pointer select-none">
          Contaminado
        </label>
        {material.contaminated && (
          <span className={badgeClass + ' ml-2'} title="Material contaminado">Contaminado</span>
        )}
      </div>
      {/* Linha premium dos campos principais */}
      <div className="grid grid-cols-12 gap-4 items-end">
        {/* Descrição */}
        <div className="col-span-6 relative">
          <label htmlFor={`materialDescription-${index}`} className={labelClass}>
            <svg className="w-4 h-4 text-indigo-400 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            Descrição do Material <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`materialDescription-${index}`}
            value={material.description}
            onChange={(e) => {
              onMaterialChange(index, { ...material, description: e.target.value });
              setShowSuggestions(index);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(index)}
            onBlur={() => setTimeout(() => setShowSuggestions(null), 150)}
            onKeyDown={(e) => {
              if (showSuggestions !== index || filteredSuggestions.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
              } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                e.preventDefault();
                onMaterialChange(index, { ...material, description: filteredSuggestions[highlightedIndex].description });
                setShowSuggestions(null);
                setHighlightedIndex(-1);
              }
            }}
            className={inputClass + (isDuplicateDesc ? ' border-red-400 ring-2 ring-red-300' : '')}
            required
            autoComplete="off"
            placeholder="Ex: TELA PROTÉSICA (7,5cm x 7,5cm)"
            aria-required="true"
          />
          {/* Sugestões de autocomplete */}
          {showSuggestions === index && filteredSuggestions.length > 0 && (
            <ul
              ref={suggestionsRef}
              className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto text-sm animate-fade-in"
            >
              {filteredSuggestions.map((suggestion, idx) => (
                <li
                  key={suggestion.id}
                  className={
                    'px-3 py-2 cursor-pointer hover:bg-indigo-100 ' +
                    (idx === highlightedIndex ? 'bg-indigo-100 font-semibold' : '')
                  }
                  onMouseDown={() => {
                    onMaterialChange(index, { ...material, description: suggestion.description });
                    setShowSuggestions(null);
                    setHighlightedIndex(-1);
                  }}
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
          {/* Feedback de duplicidade em tempo real */}
          {isDuplicateDesc && (
            <div className="text-sm text-red-600 mt-1 animate-pulse">{UI_TEXT.errorMaterialExists}</div>
          )}
        </div>
        {/* Código */}
        <div className="col-span-3">
          <label htmlFor={`materialCode-${index}`} className={labelClass}>
            <svg className="w-4 h-4 text-indigo-400 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Código <span className="text-slate-400 text-xs">(Opcional)</span>
          </label>
          <input
            type="text"
            id={`materialCode-${index}`}
            value={material.code || ''}
            onChange={(e) => onMaterialChange(index, { ...material, code: e.target.value || null })}
            className={inputClass}
            placeholder="Ex: 05010032"
            aria-required="false"
          />
        </div>
        {/* Quantidade */}
        <div className="col-span-2">
          <label htmlFor={`materialQuantity-${index}`} className={labelClass}>
            <svg className="w-4 h-4 text-indigo-400 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id={`materialQuantity-${index}`}
            value={material.quantity}
            onChange={(e) => onMaterialChange(index, { ...material, quantity: parseInt(e.target.value) || 0 })}
            min="0"
            className={inputClass}
            required
            aria-required="true"
            placeholder="1"
          />
        </div>
        {/* Botão Remover */}
        <div className="col-span-1 flex justify-end items-center">
          <button
            type="button"
            onClick={() => onRemoveMaterial(index)}
            className={removeMaterialButtonClass}
            aria-label="Remover material"
            title="Remover material"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.086 3.223.244L6.75 5.79m12.506 0l-2.828-2.828A2.25 2.25 0 0015.025 2.25H8.975a2.25 2.25 0 00-1.591.659L4.558 5.79m3.839 11.25H15.17" />
            </svg>
          </button>
        </div>
      </div>
      {/* Linha premium abaixo para Lote e Observação */}
      <div className="grid grid-cols-12 gap-4 mt-2">
        {/* Lote */}
        <div className="col-span-6">
          <label htmlFor={`materialLotNumber-${index}`} className={labelClass}>
            <svg className="w-4 h-4 text-indigo-400 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
            Lote <span className="text-slate-400 text-xs">(Opcional)</span>
          </label>
          <input
            type="text"
            id={`materialLotNumber-${index}`}
            value={material.lotNumber || ''}
            onChange={(e) => onMaterialChange(index, { ...material, lotNumber: e.target.value || null })}
            className={inputClass}
            placeholder="Ex: T33604"
            aria-required="false"
          />
        </div>
        {/* Observação */}
        <div className="col-span-6">
          <label htmlFor={`materialObservation-${index}`} className={labelClass}>
            <svg className="w-4 h-4 text-indigo-400 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m-4-4v8" /></svg>
            Observação <span className="text-slate-400 text-xs">(Opcional)</span>
          </label>
          <textarea
            id={`materialObservation-${index}`}
            value={material.observation || ''}
            onChange={(e) => onMaterialChange(index, { ...material, observation: e.target.value || null })}
            className={inputClass + " min-h-[40px] resize-none"}
            placeholder="Ex: Item de teste"
            rows={1}
            aria-required="false"
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialCard; 