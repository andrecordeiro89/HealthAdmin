

import React, { useState, useEffect, useMemo } from 'react';
import { UI_TEXT } from '../constants';
import { MaterialDatabaseItem } from '../types';
import { Alert, AlertType } from './Alert';
import { Modal } from './Modal';
import { Spinner } from './Spinner'; // Import Spinner

interface MaterialDatabaseManagerScreenProps {
  materialDbItems: MaterialDatabaseItem[];
  onMaterialDbUpdate: (updatedDb: MaterialDatabaseItem[]) => void;
  onBack: () => void;
  setGlobalAlert: (alert: { message: string, type: AlertType } | null) => void;
}

export const MaterialDatabaseManagerScreen: React.FC<MaterialDatabaseManagerScreenProps> = ({ 
    materialDbItems, 
    onMaterialDbUpdate, 
    onBack, 
    setGlobalAlert 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [currentEdit, setCurrentEdit] = useState<Partial<MaterialDatabaseItem>>({});
  
  const [newMaterialDesc, setNewMaterialDesc] = useState('');
  const [newMaterialCode, setNewMaterialCode] = useState('');

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialDatabaseItem | null>(null);
  const [localAlert, setLocalAlert] = useState<{ message: string, type: AlertType } | null>(null);

  // States for file import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvHasHeader, setCsvHasHeader] = useState<boolean>(true);
  const [importFeedback, setImportFeedback] = useState<{ message: string, type: AlertType, details?: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const purpleGradientPrimary = "text-white font-semibold py-2 px-4 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none h-fit";
  const purpleGradientLight = "text-purple-700 font-medium py-2 px-4 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  const redGradientDestructive = "text-white font-semibold py-2 px-4 rounded-lg shadow-lg bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const smallPurpleGradientAction = "text-white font-semibold text-xs py-1.5 px-3 rounded-md shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:saturate-50";
  const smallRedGradientDestructive = "text-white font-semibold text-xs py-1.5 px-3 rounded-md shadow-sm bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white focus:ring-rose-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:saturate-50";


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredMaterials = useMemo(() => {
    return [...materialDbItems].sort((a,b) => a.description.localeCompare(b.description)).filter(material =>
      material.description.toLowerCase().includes(searchTerm) ||
      (material.code && material.code.toLowerCase().includes(searchTerm))
    );
  }, [materialDbItems, searchTerm]);

  const resetAlerts = () => {
    setLocalAlert(null);
    setImportFeedback(null);
    // setGlobalAlert(null); // Global alerts are managed by App.tsx visibility timing
  }

  const handleAddNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();
    if (!newMaterialDesc.trim()) {
      setLocalAlert({ message: UI_TEXT.errorRequiredField("Descrição"), type: AlertType.Error });
      return;
    }

    const codeToCheck = newMaterialCode.trim().toLowerCase();
    const descToCheck = newMaterialDesc.trim().toLowerCase();

    const exists = materialDbItems.some(m => 
        m.description.toLowerCase() === descToCheck || 
        (codeToCheck && m.code && m.code.toLowerCase() === codeToCheck && m.code !== '')
    );

    if (exists) {
      setLocalAlert({ message: UI_TEXT.errorMaterialExists, type: AlertType.Error });
      return;
    }

    const newMaterial: MaterialDatabaseItem = {
      id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: newMaterialDesc.trim(),
      code: newMaterialCode.trim() || '', 
    };

    const updatedDb = [...materialDbItems, newMaterial].sort((a,b) => a.description.localeCompare(b.description));
    onMaterialDbUpdate(updatedDb);
    setNewMaterialDesc('');
    setNewMaterialCode('');
    setGlobalAlert({ message: UI_TEXT.materialAddedSuccess, type: AlertType.Success });
    setTimeout(() => setGlobalAlert(null), 3000);
  };

  const handleEdit = (material: MaterialDatabaseItem) => {
    setEditingMaterialId(material.id);
    setCurrentEdit({ description: material.description, code: material.code });
    resetAlerts();
  };

  const handleCancelEdit = () => {
    setEditingMaterialId(null);
    setCurrentEdit({});
  };

  const handleSaveEdit = (id: string) => {
    resetAlerts();
    if (!currentEdit.description?.trim()) {
      setLocalAlert({ message: UI_TEXT.errorRequiredField("Descrição"), type: AlertType.Error });
      return;
    }
    
    const codeToCheck = currentEdit.code?.trim().toLowerCase() || '';
    const descToCheck = currentEdit.description.trim().toLowerCase();

    const exists = materialDbItems.some(m => 
        m.id !== id && 
        (m.description.toLowerCase() === descToCheck || 
        (codeToCheck && m.code && m.code.toLowerCase() === codeToCheck && m.code !== ''))
    );

    if (exists) {
        setLocalAlert({ message: UI_TEXT.errorMaterialExists, type: AlertType.Error });
        return;
    }

    const updatedDb = materialDbItems.map(m =>
      m.id === id ? { ...m, description: currentEdit.description!.trim(), code: currentEdit.code?.trim() || '' } : m
    ).sort((a,b) => a.description.localeCompare(b.description));
    onMaterialDbUpdate(updatedDb);
    setEditingMaterialId(null);
    setCurrentEdit({});
    setGlobalAlert({ message: UI_TEXT.materialUpdatedSuccess, type: AlertType.Success });
    setTimeout(() => setGlobalAlert(null), 3000);
  };

  const handleInputChangeForEdit = (field: 'description' | 'code', value: string) => {
    setCurrentEdit(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDelete = (material: MaterialDatabaseItem) => {
    setMaterialToDelete(material);
    setShowConfirmDeleteModal(true);
    resetAlerts();
  };

  const handleConfirmDelete = () => {
    if (!materialToDelete) return;
    const updatedDb = materialDbItems.filter(m => m.id !== materialToDelete.id).sort((a,b) => a.description.localeCompare(b.description));
    onMaterialDbUpdate(updatedDb);
    setShowConfirmDeleteModal(false);
    setMaterialToDelete(null);
    setGlobalAlert({ message: UI_TEXT.materialDeletedSuccess, type: AlertType.Success });
    setTimeout(() => setGlobalAlert(null), 3000);
  };

  const processImportedItems = (itemsFromParser: {description: string, code: string, originalLineNumber: number}[]) => {
    let addedCount = 0;
    let skippedDueToDuplicatesCount = 0;
    const validationErrorDetails: string[] = [];
    let currentDbSnapshot = [...materialDbItems]; 
    const itemsProcessedFromFileThisBatch: {description: string, code: string}[] = [];

    itemsFromParser.forEach(item => {
        const desc = item.description.trim();
        const code = item.code.trim();

        if (!desc) {
            validationErrorDetails.push(UI_TEXT.importErrorLineDetail(item.originalLineNumber, "Descrição ausente."));
            return; 
        }

        const descLower = desc.toLowerCase();
        const codeLower = code.toLowerCase();

        const inDbExists = currentDbSnapshot.some(dbMat => 
            (code && dbMat.code && dbMat.code.toLowerCase() === codeLower && dbMat.code !== '') || 
            dbMat.description.toLowerCase() === descLower
        );

        if (inDbExists) {
            skippedDueToDuplicatesCount++;
            return; 
        }

        const inFileExists = itemsProcessedFromFileThisBatch.some(procItem =>
            (code && procItem.code && procItem.code.toLowerCase() === codeLower && procItem.code !== '') ||
            procItem.description.toLowerCase() === descLower
        );

        if (inFileExists) {
            validationErrorDetails.push(UI_TEXT.importErrorLineDetail(item.originalLineNumber, UI_TEXT.errorMaterialExistsInFile));
            return; 
        }

        const newMaterialEntry: MaterialDatabaseItem = {
            id: `db-mat-import-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            description: desc,
            code: code || '',
        };
        currentDbSnapshot.push(newMaterialEntry); 
        itemsProcessedFromFileThisBatch.push({description: desc, code: code});
        addedCount++;
    });

    if (addedCount > 0) {
       onMaterialDbUpdate(currentDbSnapshot.sort((a,b) => a.description.localeCompare(b.description)));
    }
    
    return { addedCount, skippedDueToDuplicatesCount, validationErrorDetails };
  };


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetAlerts();
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setImportFile(file);
      } else {
        setImportFeedback({ message: UI_TEXT.importInvalidFileType, type: AlertType.Error });
        setImportFile(null);
        event.target.value = ''; 
      }
    } else {
      setImportFile(null);
    }
  };

  const handleImportFile = () => {
    if (!importFile) {
      setImportFeedback({ message: UI_TEXT.importNoFileSelected, type: AlertType.Warning });
      return;
    }
    resetAlerts();
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setImportFeedback({ message: UI_TEXT.importFileReadError, type: AlertType.Error });
        setIsImporting(false);
        return;
      }

      const itemsToProcess: {description: string, code: string, originalLineNumber: number}[] = [];
      const parsingErrorDetails: string[] = [];
      const lines = content.split(/\r\n|\n|\r/);

      try {
        if (importFile.name.endsWith('.csv')) {
          const startIndex = csvHasHeader ? 1 : 0;
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const partsRaw: string[] = [];
            let currentPart = '';
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    partsRaw.push(currentPart);
                    currentPart = '';
                } else {
                    currentPart += char;
                }
            } 
            partsRaw.push(currentPart); 
            const parts = partsRaw.map(p => p.trim().replace(/^"|"$/g, ''));


            if (parts.length >= 2 && parts[1].trim()) { 
              itemsToProcess.push({ code: parts[0], description: parts[1], originalLineNumber: i + 1 });
            } else if (parts.length === 1 && parts[0].trim()) { 
              itemsToProcess.push({ code: '', description: parts[0], originalLineNumber: i + 1 });
            } else if (line) { 
                parsingErrorDetails.push(UI_TEXT.importErrorLineDetail(i + 1, "Formato CSV inválido ou descrição ausente."));
            }
          }
        } else if (importFile.name.endsWith('.txt')) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(';');
            if (parts.length >= 2 && parts.slice(1).join(';').trim()) { 
              itemsToProcess.push({ code: parts[0].trim(), description: parts.slice(1).join(';').trim(), originalLineNumber: i + 1 });
            } else if (parts.length === 1 && line.startsWith(';') && line.substring(1).trim()) { 
              itemsToProcess.push({ code: '', description: line.substring(1).trim(), originalLineNumber: i + 1 });
            } else if (parts.length === 1 && !line.includes(';') && parts[0].trim()) { 
                itemsToProcess.push({ code: '', description: parts[0].trim(), originalLineNumber: i + 1 });
            } else if (line) { 
                parsingErrorDetails.push(UI_TEXT.importErrorLineDetail(i + 1, "Formato TXT inválido, descrição ausente, ou use 'CODIGO;DESCRICAO'."));
            }
          }
        }
        
        const { addedCount, skippedDueToDuplicatesCount, validationErrorDetails } = processImportedItems(itemsToProcess);
        
        const allErrorDetails = [...parsingErrorDetails, ...validationErrorDetails];
        const totalSkippedOrInvalid = skippedDueToDuplicatesCount + validationErrorDetails.length;

        setImportFeedback({ 
            message: UI_TEXT.importSuccessMessage(addedCount, totalSkippedOrInvalid, parsingErrorDetails.length + validationErrorDetails.length), 
            type: allErrorDetails.length > 0 ? AlertType.Warning : AlertType.Success,
            details: allErrorDetails.length > 0 ? allErrorDetails.slice(0,10) : undefined 
        });
         if (addedCount > 0) {
            setGlobalAlert({ message: UI_TEXT.importSuccessMessage(addedCount, totalSkippedOrInvalid, parsingErrorDetails.length + validationErrorDetails.length).split(':')[0], type: AlertType.Success});
            setTimeout(() => setGlobalAlert(null), 4000);
        }


      } catch (error) {
        setImportFeedback({ message: `Erro inesperado ao processar o arquivo: ${(error as Error).message}`, type: AlertType.Error });
      } finally {
        setIsImporting(false);
        setImportFile(null); 
        const fileInput = document.getElementById('material-import-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.onerror = () => {
      setImportFeedback({ message: UI_TEXT.importFileReadError, type: AlertType.Error });
      setIsImporting(false);
    };
    reader.readAsText(importFile);
  };


  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 text-sm"; 
  const labelClass = "block text-sm font-medium text-slate-600";
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-indigo-600"> 
          {UI_TEXT.manageMaterialDbTitle}
        </h2>
        <button
          onClick={() => { resetAlerts(); onBack();}}
          className={purpleGradientLight}
          aria-label={UI_TEXT.backToHospitalSelectionButton}
        >
          {UI_TEXT.backToHospitalSelectionButton}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">{UI_TEXT.manageMaterialDbIntro}</p>

      {localAlert && <Alert message={localAlert.message} type={localAlert.type} onDismiss={() => setLocalAlert(null)} />}
      {importFeedback && !isImporting && (
        <Alert 
            message={importFeedback.message} 
            type={importFeedback.type} 
            onDismiss={() => setImportFeedback(null)}
        >
            {importFeedback.details && importFeedback.details.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                    <p className="font-semibold">Detalhes (primeiros {importFeedback.details.slice(0,10).length} erros):</p>
                    <ul className="list-disc list-inside">
                        {importFeedback.details.slice(0, 10).map((detail, idx) => <li key={idx}>{detail}</li>)}
                    </ul>
                </div>
            )}
        </Alert>
      )}


      {/* Add New Material Form */}
      <form onSubmit={handleAddNewMaterial} className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-600 mb-3">{UI_TEXT.addNewMaterialSectionTitle}</h3> 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="newMaterialDesc" className={labelClass}>{UI_TEXT.descriptionInputLabel}</label>
            <input
              type="text"
              id="newMaterialDesc"
              value={newMaterialDesc}
              onChange={(e) => setNewMaterialDesc(e.target.value)}
              className={inputClass}
              placeholder="Descrição detalhada do material"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="newMaterialCode" className={labelClass}>{UI_TEXT.codeInputLabel}</label>
            <input
              type="text"
              id="newMaterialCode"
              value={newMaterialCode}
              onChange={(e) => setNewMaterialCode(e.target.value)}
              className={inputClass}
              placeholder="Ex: P-205"
            />
          </div>
          <button
            type="submit"
            className={purpleGradientPrimary}
            aria-label={UI_TEXT.addButtonLabel}
          >
            {UI_TEXT.addButtonLabel}
          </button>
        </div>
      </form>

      {/* Import Materials Section */}
      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-600 mb-3">{UI_TEXT.importMaterialsSectionTitle}</h3> 
        <div className="space-y-3">
          <div>
            <label htmlFor="material-import-file-input" className={`${labelClass} mb-1`}>{UI_TEXT.selectFileLabel}</label>
            <input
              id="material-import-file-input"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className={`${inputClass} p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-colors`}
              aria-label={UI_TEXT.fileInputLabel}
            /> 
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>{UI_TEXT.csvFormatInstruction}</p>
            <p>{UI_TEXT.txtFormatInstruction}</p>
          </div>
          <div className="flex items-center">
            <input
              id="csvHasHeader"
              type="checkbox"
              checked={csvHasHeader}
              onChange={(e) => setCsvHasHeader(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              aria-labelledby="csvHasHeaderLabelText"
            /> 
            <label id="csvHasHeaderLabelText" htmlFor="csvHasHeader" className={`${labelClass} ml-2`}>{UI_TEXT.csvHasHeaderLabel}</label>
          </div>
          <button
            onClick={handleImportFile}
            disabled={!importFile || isImporting}
            className={`${purpleGradientPrimary} w-full sm:w-auto`}
            aria-label={isImporting ? UI_TEXT.importProcessing : UI_TEXT.importButtonLabel}
          >
            {isImporting ? UI_TEXT.importProcessing : UI_TEXT.importButtonLabel}
          </button>
        </div>
         {isImporting && <Spinner text={UI_TEXT.importProcessing}/>}
      </div>


      {/* List and Manage Existing Materials */}
      <h3 className="text-lg font-semibold text-indigo-600 mb-1">{UI_TEXT.currentMaterialsSectionTitle}</h3> 
      <label htmlFor="material-search-input" className="sr-only">{UI_TEXT.searchMaterialsPlaceholder}</label>
      <input
        id="material-search-input"
        type="text"
        placeholder={UI_TEXT.searchMaterialsPlaceholder}
        value={searchTerm}
        onChange={handleSearchChange}
        className={`${inputClass} mb-4 max-w-md`}
      />

      {filteredMaterials.length === 0 && !isImporting ? (
        <p className="text-slate-500 text-center py-4">{UI_TEXT.noMaterialsInDb}</p>
      ) : (
        <div className="overflow-x-auto max-h-[50vh] custom-scrollbar border border-gray-200 rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código</th>
                <th scope="col" className="px-4 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                  {editingMaterialId === material.id ? (
                    <>
                      <td className="px-4 py-2 whitespace-nowrap">
                         <label htmlFor={`edit-desc-${material.id}`} className="sr-only">Editar Descrição para {material.description}</label>
                        <input
                          id={`edit-desc-${material.id}`}
                          type="text"
                          value={currentEdit.description || ''}
                          onChange={(e) => handleInputChangeForEdit('description', e.target.value)}
                          className={`${inputClass} text-xs`}
                          aria-required="true"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <label htmlFor={`edit-code-${material.id}`} className="sr-only">Editar Código para {material.description}</label>
                        <input
                          id={`edit-code-${material.id}`}
                          type="text"
                          value={currentEdit.code || ''}
                          onChange={(e) => handleInputChangeForEdit('code', e.target.value)}
                          className={`${inputClass} text-xs`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center space-x-2">
                        <button
                          onClick={() => handleSaveEdit(material.id)}
                          className={`${smallPurpleGradientAction}`}
                          aria-label={`${UI_TEXT.saveMaterialChangesButtonLabel} para ${currentEdit.description || material.description}`}
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={`${purpleGradientLight.replace("py-2 px-4", "py-1.5 px-3").replace("font-medium", "font-normal text-xs")}`} 
                           aria-label={`${UI_TEXT.cancelEditButtonLabel} para ${currentEdit.description || material.description}`}
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-slate-700 align-top">{material.description}</td>
                      <td className="px-4 py-2 text-slate-600 align-top">{material.code || <span className="italic text-slate-400">N/A</span>}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center space-x-2 align-top">
                        <button
                          onClick={() => handleEdit(material)}
                          className={smallPurpleGradientAction}
                          aria-label={`${UI_TEXT.editMaterialButtonLabel} ${material.description}`}
                        >
                          {UI_TEXT.editMaterialButtonLabel}
                        </button>
                        <button
                          onClick={() => handleDelete(material)}
                          className={smallRedGradientDestructive}
                          aria-label={`${UI_TEXT.deleteMaterialButtonLabel} ${material.description}`}
                        >
                          {UI_TEXT.deleteMaterialButtonLabel}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmDeleteModal && materialToDelete && (
        <Modal
          isOpen={showConfirmDeleteModal}
          onClose={() => { setShowConfirmDeleteModal(false); setMaterialToDelete(null); }}
          title={UI_TEXT.confirmDeleteMaterialTitle}
          size="md"
        >
          <p className="text-slate-600 mb-6">{UI_TEXT.confirmDeleteMaterialMessage(materialToDelete.description, materialToDelete.code)}</p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setShowConfirmDeleteModal(false); setMaterialToDelete(null); }}
              className={purpleGradientLight.replace("w-full ", "")}
              aria-label={UI_TEXT.cancelButton}
            >
              {UI_TEXT.cancelButton}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className={redGradientDestructive}
              aria-label={UI_TEXT.confirmRemoveButton}
            >
              {UI_TEXT.confirmRemoveButton}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};