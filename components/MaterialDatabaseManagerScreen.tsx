import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MaterialDatabaseItem } from '../types';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';
import { Modal } from './Modal';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, buttonSecondary, inputBase, buttonSize } from './uiClasses';

interface MaterialDatabaseManagerScreenProps {
  materialDbItems: MaterialDatabaseItem[];
  onUpdateMaterialDb: (updatedDb: MaterialDatabaseItem[]) => void;
  onGoBack: () => void;
}

interface ImportFeedback {
  success: boolean;
  message: string;
  importedCount?: number;
  skippedCount?: number;
  details?: string[];
}

export const MaterialDatabaseManagerScreen: React.FC<MaterialDatabaseManagerScreenProps> = ({
  materialDbItems,
  onUpdateMaterialDb,
  onGoBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [currentEdit, setCurrentEdit] = useState<Partial<MaterialDatabaseItem>>({});
  const [newMaterialDesc, setNewMaterialDesc] = useState('');
  const [newMaterialCode, setNewMaterialCode] = useState('');
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialDatabaseItem | null>(null);
  const [localAlert, setLocalAlert] = useState<{ type: AlertType, message: string } | null>(null);

  // Import related states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvHasHeader, setCsvHasHeader] = useState(true);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Autocomplete states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Autocomplete suggestions based on existing materials
  const suggestions = useMemo(() => {
    const desc = newMaterialDesc.trim().toLowerCase();
    if (!desc) return [];
    return materialDbItems.filter(m => m.description.toLowerCase().includes(desc));
  }, [newMaterialDesc, materialDbItems]);

  // Check for duplicate description
  const isDuplicateDesc = useMemo(() => {
    const desc = newMaterialDesc.trim().toLowerCase();
    return desc && materialDbItems.some(m => m.description.toLowerCase() === desc);
  }, [newMaterialDesc, materialDbItems]);

  // Check for duplicate code
  const isDuplicateCode = useMemo(() => {
    const code = newMaterialCode.trim().toLowerCase();
    return code && materialDbItems.some(m => m.code && m.code.toLowerCase() === code);
  }, [newMaterialCode, materialDbItems]);

  // Handle clicks outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Clear local alert after 5 seconds
  useEffect(() => {
    if (localAlert) {
      const timer = setTimeout(() => setLocalAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [localAlert]);

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    return [...materialDbItems].sort((a,b) => a.description.localeCompare(b.description)).filter(material =>
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.code && material.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [materialDbItems, searchTerm]);

  const handleAddMaterial = () => {
    const desc = newMaterialDesc.trim();
    const code = newMaterialCode.trim();

    if (!desc) {
      setLocalAlert({ type: AlertType.Warning, message: 'Descrição é obrigatória.' });
      return;
    }

    if (isDuplicateDesc) {
      setLocalAlert({ type: AlertType.Warning, message: 'Já existe um material com esta descrição.' });
      return;
    }

    if (code && isDuplicateCode) {
      setLocalAlert({ type: AlertType.Warning, message: 'Já existe um material com este código.' });
      return;
    }

    const newMaterial: MaterialDatabaseItem = {
      id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: desc,
      code: code || '',
    };

    onUpdateMaterialDb([...materialDbItems, newMaterial]);
    setNewMaterialDesc('');
    setNewMaterialCode('');
    setLocalAlert({ type: AlertType.Success, message: 'Material adicionado com sucesso!' });
  };

  const handleEditMaterial = (material: MaterialDatabaseItem) => {
    setEditingMaterialId(material.id);
    setCurrentEdit({ description: material.description, code: material.code });
  };

  const handleSaveEdit = () => {
    if (!editingMaterialId || !currentEdit.description?.trim()) {
      setLocalAlert({ type: AlertType.Warning, message: 'Descrição é obrigatória.' });
      return;
    }

    const desc = currentEdit.description.trim().toLowerCase();
    const code = currentEdit.code?.trim().toLowerCase() || '';

    // Check for duplicates (excluding the current item being edited)
    const duplicateDesc = materialDbItems.some(m => 
      m.id !== editingMaterialId && m.description.toLowerCase() === desc
    );
    const duplicateCode = code && materialDbItems.some(m => 
      m.id !== editingMaterialId && m.code && m.code.toLowerCase() === code
    );

    if (duplicateDesc) {
      setLocalAlert({ type: AlertType.Warning, message: 'Já existe um material com esta descrição.' });
      return;
    }

    if (duplicateCode) {
      setLocalAlert({ type: AlertType.Warning, message: 'Já existe um material com este código.' });
      return;
    }

    const updatedMaterials = materialDbItems.map(m =>
      m.id === editingMaterialId
        ? { ...m, description: currentEdit.description!.trim(), code: currentEdit.code?.trim() || '' }
        : m
    );

    onUpdateMaterialDb(updatedMaterials);
    setEditingMaterialId(null);
    setCurrentEdit({});
    setLocalAlert({ type: AlertType.Success, message: 'Material atualizado com sucesso!' });
  };

  const handleCancelEdit = () => {
    setEditingMaterialId(null);
    setCurrentEdit({});
  };

  const handleDeleteMaterial = (material: MaterialDatabaseItem) => {
    setMaterialToDelete(material);
    setShowConfirmDeleteModal(true);
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      const updatedMaterials = materialDbItems.filter(m => m.id !== materialToDelete.id);
      onUpdateMaterialDb(updatedMaterials);
      setLocalAlert({ type: AlertType.Success, message: 'Material removido com sucesso!' });
    }
    setShowConfirmDeleteModal(false);
    setMaterialToDelete(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          const selected = suggestions[highlightedIndex];
          setNewMaterialDesc(selected.description);
          setNewMaterialCode(selected.code || '');
          setShowSuggestions(false);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: MaterialDatabaseItem) => {
    setNewMaterialDesc(suggestion.description);
    setNewMaterialCode(suggestion.code || '');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // CSV Import functionality
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setImportFeedback(null);
    } else {
      setLocalAlert({ type: AlertType.Warning, message: 'Por favor, selecione um arquivo CSV válido.' });
    }
  };

  const parseCSV = (csvText: string): { description: string; code: string }[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const startIndex = csvHasHeader ? 1 : 0;
    
    return lines.slice(startIndex).map(line => {
      const [description, code] = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
      return { description: description || '', code: code || '' };
    });
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      setLocalAlert({ type: AlertType.Warning, message: 'Selecione um arquivo CSV primeiro.' });
      return;
    }

    setIsImporting(true);
    setImportFeedback(null);

    try {
      const csvText = await importFile.text();
      const parsedData = parseCSV(csvText);
      
      let importedCount = 0;
      let skippedCount = 0;
      const details: string[] = [];
      const newMaterials: MaterialDatabaseItem[] = [];

      parsedData.forEach((item, index) => {
        const { description, code } = item;
        
        if (!description.trim()) {
          skippedCount++;
          details.push(`Linha ${index + (csvHasHeader ? 2 : 1)}: Descrição vazia`);
          return;
        }

        // Check for duplicates in existing database
        const existingDesc = materialDbItems.some(m => 
          m.description.toLowerCase() === description.toLowerCase()
        );
        const existingCode = code && materialDbItems.some(m => 
          m.code && m.code.toLowerCase() === code.toLowerCase()
        );

        if (existingDesc) {
          skippedCount++;
          details.push(`Linha ${index + (csvHasHeader ? 2 : 1)}: Descrição já existe - "${description}"`);
          return;
        }

        if (existingCode) {
          skippedCount++;
          details.push(`Linha ${index + (csvHasHeader ? 2 : 1)}: Código já existe - "${code}"`);
          return;
        }

        // Check for duplicates within the import data
        const duplicateInImport = newMaterials.some(m => 
          m.description.toLowerCase() === description.toLowerCase() ||
          (code && m.code && m.code.toLowerCase() === code.toLowerCase())
        );

        if (duplicateInImport) {
          skippedCount++;
          details.push(`Linha ${index + (csvHasHeader ? 2 : 1)}: Duplicata no arquivo - "${description}"`);
          return;
        }

        newMaterials.push({
          id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}-${index}`,
          description: description.trim(),
          code: code.trim(),
        });
        importedCount++;
      });

      if (newMaterials.length > 0) {
        onUpdateMaterialDb([...materialDbItems, ...newMaterials]);
      }

      setImportFeedback({
        success: true,
        message: `Importação concluída: ${importedCount} materiais importados, ${skippedCount} ignorados.`,
        importedCount,
        skippedCount,
        details: details.slice(0, 10) // Limit details to first 10
      });

      setImportFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setImportFeedback({
        success: false,
        message: 'Erro ao processar o arquivo CSV. Verifique o formato.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // UI Classes
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
  const buttonClass = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const primaryButtonClass = `${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;
  const secondaryButtonClass = `${buttonClass} bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500`;
  const dangerButtonClass = `${buttonClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const labelClass = "block text-sm font-medium text-slate-600";

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Base de Materiais</h1>
        <button onClick={onGoBack} className={buttonSecondary + ' ' + buttonSize}>
          Voltar
        </button>
      </div>

      {localAlert && (
        <div className="mb-4">
          <Alert type={localAlert.type} message={localAlert.message} />
        </div>
      )}

      {/* Add Material Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Adicionar Novo Material</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className={labelClass}>Descrição *</label>
            <input
              type="text"
              value={newMaterialDesc}
              onChange={(e) => {
                setNewMaterialDesc(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className={`${inputClass} ${isDuplicateDesc ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="Digite a descrição do material"
            />
            {isDuplicateDesc && (
              <p className="text-red-500 text-xs mt-1">Material já existe na base</p>
            )}
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1"
              >
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={`px-3 py-2 cursor-pointer ${
                      index === highlightedIndex ? 'bg-indigo-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="font-medium">{suggestion.description}</div>
                    {suggestion.code && (
                      <div className="text-sm text-gray-500">Código: {suggestion.code}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className={labelClass}>Código</label>
            <input
              type="text"
              value={newMaterialCode}
              onChange={(e) => setNewMaterialCode(e.target.value)}
              className={`${inputClass} ${isDuplicateCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="Código do material (opcional)"
            />
            {isDuplicateCode && (
              <p className="text-red-500 text-xs mt-1">Código já existe na base</p>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddMaterial}
              disabled={Boolean(!newMaterialDesc.trim() || isDuplicateDesc || isDuplicateCode)}
              className={`${primaryButtonClass} disabled:opacity-50 disabled:cursor-not-allowed w-full`}
            >
              Adicionar Material
            </button>
          </div>
        </div>
      </div>

      {/* Import CSV Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Importar Materiais via CSV</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className={labelClass}>Arquivo CSV</label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-600 mt-1">
              Formato: descrição,código (uma linha por material)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={csvHasHeader}
                onChange={(e) => setCsvHasHeader(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-blue-700">Arquivo tem cabeçalho</span>
            </label>
            <button
              onClick={handleImportCSV}
              disabled={!importFile || isImporting}
              className={`${primaryButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
        {importFeedback && (
          <div className={`mt-3 p-3 rounded-md ${importFeedback.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">{importFeedback.message}</p>
            {importFeedback.details && importFeedback.details.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Ver detalhes</summary>
                <ul className="mt-1 text-sm">
                  {importFeedback.details.map((detail, index) => (
                    <li key={index} className="ml-4">• {detail}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className={labelClass}>Buscar Materiais</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={inputClass}
          placeholder="Busque por descrição ou código..."
        />
      </div>

      {/* Materials Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className={tableHeader + " text-left"}>Descrição</th>
              <th className={tableHeader + " text-left"}>Código</th>
              <th className={tableHeader + " text-center"}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'Nenhum material encontrado.' : 'Nenhum material cadastrado.'}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material, index) => (
                <tr key={material.id} className={zebraRow}>
                  <td className={tableCell}>
                    {editingMaterialId === material.id ? (
                      <input
                        type="text"
                        value={currentEdit.description || ''}
                        onChange={(e) => setCurrentEdit({ ...currentEdit, description: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      material.description
                    )}
                  </td>
                  <td className={tableCell}>
                    {editingMaterialId === material.id ? (
                      <input
                        type="text"
                        value={currentEdit.code || ''}
                        onChange={(e) => setCurrentEdit({ ...currentEdit, code: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      material.code || '-'
                    )}
                  </td>
                  <td className={tableCell + " text-center"}>
                    {editingMaterialId === material.id ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDeleteModal && (
        <Modal
          isOpen={showConfirmDeleteModal}
          onClose={() => setShowConfirmDeleteModal(false)}
          title="Confirmar Exclusão"
          size="md"
        >
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir o material "{materialToDelete?.description}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className={dangerButtonClass}
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};