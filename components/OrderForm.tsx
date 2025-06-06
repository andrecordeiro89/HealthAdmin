import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExtractedData, MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';
import { inputBase, labelBase, buttonPrimary, buttonSecondary, buttonSize, cardLarge, sectionGap } from './uiClasses';
import MaterialCard from './MaterialCard';

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

  const inputClass = inputBase +
    " h-12 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-base placeholder-slate-400";
  const labelClass = labelBase + " text-slate-700 font-semibold mb-1 flex items-center gap-1";
  const textAreaClass = inputClass + " min-h-[60px]";
  const removeMaterialButtonClass =
    "absolute top-3 right-3 p-2 rounded-full text-white bg-gradient-to-br from-red-500 to-rose-600 shadow-md hover:scale-110 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-150 z-10";
  const badgeClass =
    "inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs ml-2 font-bold tracking-wide";

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
    <fieldset className="space-y-8 p-6 sm:p-8 border-2 border-indigo-100 rounded-2xl bg-white shadow-lg">
      <legend className="text-3xl font-extrabold text-indigo-800 px-2 mb-6 tracking-tight flex items-center gap-2">
        {UI_TEXT.materialsUsedSection}
      </legend>
      {materialsUsed.map((material, index) => (
        <MaterialCard
          key={index}
          material={material}
          index={index}
          onMaterialChange={onMaterialChange}
          onRemoveMaterial={onRemoveMaterial}
          materialDbItems={materialDbItems}
          badgeClass={badgeClass}
          removeMaterialButtonClass={removeMaterialButtonClass}
        />
      ))}
      <button
        type="button"
        onClick={onAddMaterial}
        className={addMaterialButtonClass +
          " mt-6 flex items-center justify-center w-full gap-2 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-lg shadow-md hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-150 animate-fade-in"}
        title="Adicionar novo material"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Adicionar Material
      </button>
    </fieldset>
  );
};

export { MaterialsUsedSection };
