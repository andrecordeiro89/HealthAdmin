import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExtractedData, MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';
import { inputBase, labelBase, buttonPrimary, buttonSecondary, buttonSize, cardLarge, sectionGap } from './uiClasses';

interface OrderFormProps {
  initialData: ExtractedData;
  onSubmit: (data: ExtractedData) => void;
  submitButtonText?: string;
  materialDbItems?: import('../types').MaterialDatabaseItem[];
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, submitButtonText, materialDbItems = [] }) => {
  const [formData, setFormData] = useState<ExtractedData>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as (HTMLInputElement | HTMLTextAreaElement);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (index: number, updatedMaterial: MaterialUsed) => {
    const newMaterials = [...formData.materialsUsed];
    newMaterials[index] = updatedMaterial;
    setFormData(prev => ({ ...prev, materialsUsed: newMaterials }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, { description: '', quantity: 1, code: null, lotNumber: null, observation: null }]
    }));
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materialsUsed.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, materialsUsed: newMaterials }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const purpleGradientPrimary = buttonPrimary;
  const purpleGradientSecondaryAddMaterial = buttonSecondary + " mt-4 flex items-center justify-center w-full";
  

  return (
    <form onSubmit={handleSubmit} className={"w-full h-full min-h-screen flex flex-col justify-center items-center bg-white/90 backdrop-blur-md rounded-none shadow-none border-none px-16 py-12 "} style={{boxSizing: 'border-box'}}>
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        <PatientInfoSection 
          patientName={formData.patientName}
          patientDOB={formData.patientDOB}
          surgeryDate={formData.surgeryDate}
          procedureName={formData.procedureName}
          doctorName={formData.doctorName}
          onChange={handleChange}
        />
        <div className={sectionGap}></div>
        <MaterialsUsedSection
          materialsUsed={formData.materialsUsed}
          onMaterialChange={handleMaterialChange}
          onAddMaterial={addMaterial}
          onRemoveMaterial={removeMaterial}
          addMaterialButtonClass={purpleGradientSecondaryAddMaterial + " " + buttonSize}
          materialDbItems={materialDbItems}
        />
        <div className="mt-4 text-center text-xs text-slate-500 italic px-2">
          {UI_TEXT.aiCorrectionFeedbackNote}
        </div>
        <div className="pt-5 flex flex-row justify-center">
          <button
            type="submit"
            className={purpleGradientPrimary + " " + buttonSize}
            title="Salvar alterações"
          >
            {submitButtonText || UI_TEXT.saveChangesButton} 
          </button>
        </div>
      </div>
    </form>
  );
};


interface PatientInfoSectionProps {
  patientName: string | null;
  patientDOB: string | null;
  surgeryDate: string | null;
  procedureName: string | null;
  doctorName: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const PatientInfoSection: React.FC<PatientInfoSectionProps> = (props) => {
  const { patientName, patientDOB, surgeryDate, procedureName, doctorName, onChange } = props;
  
  const inputClass = inputBase;
  const labelClass = labelBase;

  return (
    <fieldset className="space-y-6 p-4 sm:p-6 border border-gray-200 rounded-md bg-gray-50">
      <legend className="text-2xl sm:text-3xl font-bold text-indigo-700 px-2 mb-4">{UI_TEXT.patientInfoSection}</legend> 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label htmlFor="patientName" className={labelClass}>Nome do Paciente</label>
          <input type="text" name="patientName" id="patientName" value={patientName || ''} onChange={onChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="patientDOB" className={labelClass}>Data de Nascimento (DD/MM/AAAA)</label>
          <input type="text" name="patientDOB" id="patientDOB" value={patientDOB || ''} onChange={onChange} placeholder="DD/MM/AAAA" className={inputClass} />
        </div>
        <div>
          <label htmlFor="surgeryDate" className={labelClass}>Data da Cirurgia (DD/MM/AAAA)</label>
          <input type="text" name="surgeryDate" id="surgeryDate" value={surgeryDate || ''} onChange={onChange} placeholder="DD/MM/AAAA" className={inputClass} />
        </div>
        <div>
          <label htmlFor="doctorName" className={labelClass}>Nome do Médico</label>
          <input type="text" name="doctorName" id="doctorName" value={doctorName || ''} onChange={onChange} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="procedureName" className={labelClass}>Nome do Procedimento</label>
          <textarea name="procedureName" id="procedureName" value={procedureName || ''} onChange={onChange} rows={3} className={inputClass + " min-h-[80px]"} />
        </div>
      </div>
    </fieldset>
  );
};


interface MaterialsUsedSectionProps {
  materialsUsed: MaterialUsed[];
  onMaterialChange: (index: number, material: MaterialUsed) => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (index: number) => void;
  addMaterialButtonClass: string;
  materialDbItems?: import('../types').MaterialDatabaseItem[];
}

const MaterialsUsedSection: React.FC<MaterialsUsedSectionProps> = (props) => {
  const { materialsUsed, onMaterialChange, onAddMaterial, onRemoveMaterial, addMaterialButtonClass, materialDbItems = [] } = props;

  const inputClass = inputBase;
  const labelClass = labelBase;
  const textAreaClass = inputClass + " min-h-[60px]";
  const removeMaterialButtonClass = "absolute top-2 right-2 p-1.5 rounded-full text-white bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:ring-offset-1 focus:ring-offset-white transition-all duration-150 z-10";

  // Autocomplete e validação para cada campo de descrição
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(null);
        setHighlightedIndex(-1);
      }
    }
    if (showSuggestions !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <fieldset className="space-y-6 p-4 sm:p-6 border border-gray-200 rounded-md bg-gray-50">
      <legend className="text-2xl sm:text-3xl font-bold text-indigo-700 px-2 mb-4">{UI_TEXT.materialsUsedSection}</legend> 
      {materialsUsed.map((material, index) => {
        // Sugestões filtradas para autocomplete
        const filteredSuggestions = useMemo(() => {
          const desc = material.description.trim().toLowerCase();
          if (!desc) return [];
          return materialDbItems.filter(m => m.description.toLowerCase().includes(desc));
        }, [material.description, materialDbItems]);
        // Duplicidade em tempo real
        const isDuplicateDesc = useMemo(() => {
          const desc = material.description.trim().toLowerCase();
          return desc && materialDbItems.some(m => m.description.toLowerCase() === desc);
        }, [material.description, materialDbItems]);
        return (
          <div key={index} className={`p-4 border border-gray-200 rounded-md space-y-4 relative bg-white ${index % 2 === 0 ? '' : 'bg-gray-50'}`}> 
            {materialsUsed.length > 0 && ( 
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
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-2 relative">
                <label htmlFor={`materialDescription-${index}`} className={labelClass}>Descrição do Material</label>
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
                  className={inputClass + (isDuplicateDesc ? ' border-red-400 ring-1 ring-red-300' : '')}
                  required
                  autoComplete="off"
                />
                {/* Sugestões de autocomplete */}
                {showSuggestions === index && filteredSuggestions.length > 0 && (
                  <ul
                    ref={suggestionsRef}
                    className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto text-sm"
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
                  <div className="text-sm text-red-600 mt-1">{UI_TEXT.errorMaterialExists}</div>
                )}
              </div>
              <div>
                <label htmlFor={`materialQuantity-${index}`} className={labelClass}>Quantidade</label>
                <input
                  type="number"
                  id={`materialQuantity-${index}`}
                  value={material.quantity}
                  onChange={(e) => onMaterialChange(index, { ...material, quantity: parseInt(e.target.value) || 0 })}
                  min="0" 
                  className={inputClass}
                  required
                />
              </div>
              <div className="md:col-span-1">
                 <label htmlFor={`materialCode-${index}`} className={labelClass}>Código (Opcional)</label>
                <input
                  type="text"
                  id={`materialCode-${index}`}
                  value={material.code || ''}
                  onChange={(e) => onMaterialChange(index, { ...material, code: e.target.value || null })}
                  className={inputClass}
                  placeholder="Ex: P-205"
                />
              </div>
               <div className="md:col-span-1">
                 <label htmlFor={`materialLotNumber-${index}`} className={labelClass}>Lote (Opcional)</label>
                <input
                  type="text"
                  id={`materialLotNumber-${index}`}
                  value={material.lotNumber || ''}
                  onChange={(e) => onMaterialChange(index, { ...material, lotNumber: e.target.value || null })}
                  className={inputClass}
                  placeholder="Ex: LOTE123"
                />
              </div>
               <div className="md:col-span-1">
                 <label htmlFor={`materialObservation-${index}`} className={labelClass}>Observação (Opcional)</label>
                  <textarea
                      id={`materialObservation-${index}`}
                      value={material.observation || ''}
                      onChange={(e) => onMaterialChange(index, { ...material, observation: e.target.value || null })}
                      className={inputClass + " min-h-[40px]"}
                      placeholder="Ex: Item de teste"
                      rows={1}
                  />
              </div>
            </div>
          </div>
        );
      })}
      <button 
        type="button" 
        onClick={onAddMaterial} 
        className={addMaterialButtonClass}
        title="Adicionar novo material"
      > 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Adicionar Material
      </button>
    </fieldset>
  );
};

export { MaterialsUsedSection };
