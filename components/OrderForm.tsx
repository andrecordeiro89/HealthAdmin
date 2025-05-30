

import React, { useState, useEffect } from 'react';
import { ExtractedData, MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';

interface OrderFormProps {
  initialData: ExtractedData;
  onSubmit: (data: ExtractedData) => void;
  submitButtonText?: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, submitButtonText }) => {
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
  
  const purpleGradientPrimary = "w-full text-white font-semibold py-3 px-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientSecondaryAddMaterial = "mt-4 flex items-center justify-center w-full text-white font-medium py-2.5 px-4 rounded-lg shadow-md bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PatientInfoSection 
        patientName={formData.patientName}
        patientDOB={formData.patientDOB}
        surgeryDate={formData.surgeryDate}
        procedureName={formData.procedureName}
        doctorName={formData.doctorName}
        onChange={handleChange}
      />
      
      <MaterialsUsedSection
        materialsUsed={formData.materialsUsed}
        onMaterialChange={handleMaterialChange}
        onAddMaterial={addMaterial}
        onRemoveMaterial={removeMaterial}
        addMaterialButtonClass={purpleGradientSecondaryAddMaterial}
      />

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500 italic px-2">
          {UI_TEXT.aiCorrectionFeedbackNote}
        </p>
      </div>

      <div className="pt-5">
        <button
          type="submit"
          className={purpleGradientPrimary}
        >
          {submitButtonText || UI_TEXT.saveChangesButton} 
        </button>
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
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"; 
  const labelClass = "block text-sm font-medium text-slate-600";

  return (
    <fieldset className="space-y-6 p-4 sm:p-6 border border-gray-200 rounded-md bg-gray-50">
      <legend className="text-lg sm:text-xl font-semibold text-indigo-600 px-2">{UI_TEXT.patientInfoSection}</legend> 
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
}

const MaterialsUsedSection: React.FC<MaterialsUsedSectionProps> = (props) => {
  const { materialsUsed, onMaterialChange, onAddMaterial, onRemoveMaterial, addMaterialButtonClass } = props;

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"; 
  const labelClass = "block text-sm font-medium text-slate-600";
  const textAreaClass = inputClass + " min-h-[60px]";
  const removeMaterialButtonClass = "absolute top-2 right-2 p-1.5 rounded-full text-white bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:ring-offset-1 focus:ring-offset-white transition-all duration-150 z-10";


  return (
    <fieldset className="space-y-6 p-4 sm:p-6 border border-gray-200 rounded-md bg-gray-50">
      <legend className="text-lg sm:text-xl font-semibold text-indigo-600 px-2">{UI_TEXT.materialsUsedSection}</legend> 
      {materialsUsed.map((material, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-md space-y-4 relative bg-white">
          {materialsUsed.length > 0 && ( 
             <button 
                type="button" 
                onClick={() => onRemoveMaterial(index)} 
                className={removeMaterialButtonClass}
                aria-label="Remover material"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.086 3.223.244L6.75 5.79m12.506 0l-2.828-2.828A2.25 2.25 0 0015.025 2.25H8.975a2.25 2.25 0 00-1.591.659L4.558 5.79m3.839 11.25H15.17" />
                </svg>
              </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2">
              <label htmlFor={`materialDescription-${index}`} className={labelClass}>Descrição do Material</label>
              <input
                type="text"
                id={`materialDescription-${index}`}
                value={material.description}
                onChange={(e) => onMaterialChange(index, { ...material, description: e.target.value })}
                className={inputClass}
                required
              />
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
                    className={textAreaClass}
                    placeholder="Ex: Item de teste"
                    rows={1} // Start with 1 row, will expand with content
                />
            </div>
          </div>
        </div>
      ))}
      <button 
        type="button" 
        onClick={onAddMaterial} 
        className={addMaterialButtonClass}
      > 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Adicionar Material
      </button>
    </fieldset>
  );
};
