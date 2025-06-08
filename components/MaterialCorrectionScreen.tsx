import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CorrectedMaterialItem, ProcessedDocumentEntry, MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';
import { Modal } from './Modal';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, buttonSecondary, inputBase, buttonSize, cardLarge, cardBase, sectionGap } from './uiClasses';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import CreatableSelect from 'react-select/creatable';

interface MaterialCorrectionScreenProps {
  hospitalName: string;
  processedDocuments: ProcessedDocumentEntry[]; // Primary data source
  onConfirmCorrections: (
    updatedDocs: ProcessedDocumentEntry[], 
    correctedForDb: CorrectedMaterialItem[]
  ) => void;
  onSkip: () => void;
  onGoBack: () => void; // To go back to Document Management
  onRetryErroredDocuments?: () => void;
  materialDbItems?: import('../types').MaterialDatabaseItem[]; // nova prop
  onMaterialDbUpdate?: (updatedDb: import('../types').MaterialDatabaseItem[]) => void;
}

interface GroupedEditableDocuments {
  [patientNameOrGenericKey: string]: ProcessedDocumentEntry[];
}


export const MaterialCorrectionScreen: React.FC<MaterialCorrectionScreenProps> = ({
  hospitalName,
  processedDocuments,
  onConfirmCorrections,
  onSkip,
  onGoBack,
  onRetryErroredDocuments,
  materialDbItems = [],
  onMaterialDbUpdate,
}) => {
  const [editableDocuments, setEditableDocuments] = useState<ProcessedDocumentEntry[]>([]);
  const [viewingDocument, setViewingDocument] = useState<ProcessedDocumentEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: number | null}>({});
  const [highlightedIndex, setHighlightedIndex] = useState<{[key: string]: number}>({});
  const [showSuggestionIdx, setShowSuggestionIdx] = useState<string | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState<{docId: string, index: number, desc: string} | null>(null);
  const [newQuickMaterialCode, setNewQuickMaterialCode] = useState('');
  const [addMaterialError, setAddMaterialError] = useState<string | null>(null);
  const [showFooterButtons, setShowFooterButtons] = useState(false);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState<{key: string, message: string} | null>(null);
  const [highlightedNewMaterialId, setHighlightedNewMaterialId] = useState<string | null>(null);

  // Placeholders for UI_TEXT that would be in constants.ts
  const patientNameLabel = "Nome do Paciente";
  const aiExtractedPatientNameLabel = "Nome do Paciente (Extraído pela IA):";
  const aiCorrectionScreenIntroUpdated = (hName: string) => `Revise o nome do paciente e os materiais extraídos pela IA de todos os documentos para o ${hName}. Suas correções ajudam a melhorar a precisão do sistema.`;


  const successfullyProcessedOriginalDocs = useMemo(() => {
    return processedDocuments.filter(doc => doc.status === 'success' && doc.extractedData);
  }, [processedDocuments]);

  const totalDocsProcessados = successfullyProcessedOriginalDocs.length;
  const totalDocsErro = processedDocuments.filter(doc => doc.status === 'error').length;
  const totalDocs = processedDocuments.length;

  useEffect(() => {
    // Initialize editableDocuments with a deep copy of successfully processed documents
    setEditableDocuments(JSON.parse(JSON.stringify(successfullyProcessedOriginalDocs)));
  }, [successfullyProcessedOriginalDocs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions({});
        setHighlightedIndex({});
        setShowSuggestionIdx(null);
        setHighlightedIdx(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      // Considera "final da página" se está a menos de 32px do rodapé
      setShowFooterButtons(scrollY + windowHeight >= docHeight - 32);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMaterialChange = (
    docId: string, 
    materialIndex: number, 
    field: 'description' | 'code' | 'quantity' | 'lotNumber' | 'observation' | 'observacaoUsuario', 
    value: string
  ) => {
    setEditableDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId && doc.extractedData) {
          const newMaterialsUsed = [...doc.extractedData.materialsUsed];
          if (newMaterialsUsed[materialIndex]) {
            newMaterialsUsed[materialIndex] = {
              ...newMaterialsUsed[materialIndex],
              [field]: field === 'quantity' ? Number(value) : value || (field === 'code' || field === 'lotNumber' || field === 'observation' ? null : ''),
            };
            return { ...doc, extractedData: { ...doc.extractedData, materialsUsed: newMaterialsUsed } };
          }
        }
        return doc;
      })
    );
  };

  const handleAddMaterial = (docId: string) => {
    setEditableDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId && doc.extractedData) {
          return {
            ...doc,
            extractedData: {
              ...doc.extractedData,
              materialsUsed: [
                ...doc.extractedData.materialsUsed,
                { description: '', quantity: 1, code: null, lotNumber: null, observation: null },
              ],
            },
          };
        }
        return doc;
      })
    );
  };

  const handleRemoveMaterial = (docId: string, materialIndex: number) => {
    setEditableDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId && doc.extractedData) {
          const newMaterialsUsed = doc.extractedData.materialsUsed.filter((_, idx) => idx !== materialIndex);
          return { ...doc, extractedData: { ...doc.extractedData, materialsUsed: newMaterialsUsed } };
        }
        return doc;
      })
    );
  };

  const handlePatientNameChange = (docId: string, newName: string) => {
    setEditableDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId && doc.extractedData) {
          return {
            ...doc,
            extractedData: {
              ...doc.extractedData,
              patientName: newName || null, // Store empty as null. Removed .trim() to allow spaces during typing.
            },
          };
        }
        return doc;
      })
    );
  };

  const handlePatientInfoChange = (docId: string, field: string, value: string) => {
    setEditableDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId && doc.extractedData) {
          return {
            ...doc,
            extractedData: {
              ...doc.extractedData,
              [field]: value || null, // Store empty as null. Removed .trim() to allow spaces during typing.
            },
          };
        }
        return doc;
      })
    );
  };

  const handleSubmitCorrections = () => {
    const correctedItemsForDb: CorrectedMaterialItem[] = [];

    // Apply trim to patient names before submitting
    const finalEditableDocuments = editableDocuments.map(doc => {
        if (doc.extractedData && doc.extractedData.patientName) {
            return {
                ...doc,
                extractedData: {
                    ...doc.extractedData,
                    patientName: doc.extractedData.patientName.trim() || null
                }
            };
        }
        return doc;
    });


    finalEditableDocuments.forEach(editedDoc => {
      const originalDoc = successfullyProcessedOriginalDocs.find(od => od.id === editedDoc.id);
      if (originalDoc && originalDoc.extractedData && editedDoc.extractedData) {
        // Check for patient name change - esta parte permanece para rastreio, mas NÃO adicionar observação automática
        editedDoc.extractedData.materialsUsed.forEach((editedMaterial, index) => {
          const originalMaterial = originalDoc.extractedData!.materialsUsed[index];
          if (originalMaterial && 
              (editedMaterial.description !== originalMaterial.description || editedMaterial.code !== originalMaterial.code)) {
            correctedItemsForDb.push({
              originalDescription: originalMaterial.description,
              originalCode: originalMaterial.code,
              correctedDescription: editedMaterial.description,
              correctedCode: editedMaterial.code,
            });
            // Remover: NÃO adicionar observação automática
            // (Correção Aplicada. Original: Desc='...', Cód='...')
          }
        });
      }
    });
    onConfirmCorrections(finalEditableDocuments, correctedItemsForDb);
  };

  const handleViewDocument = (docId: string) => {
    const docToView = editableDocuments.find(doc => doc.id === docId) || successfullyProcessedOriginalDocs.find(doc => doc.id === docId);
    if (docToView) {
      setViewingDocument(docToView);
    }
  };

  const handleCloseViewDocumentModal = () => {
    setViewingDocument(null);
  };
  
  const groupedEditableDocs = useMemo(() => {
    // Grouping key should remain based on the *original* patient name for UI stability during edits
    return successfullyProcessedOriginalDocs.reduce<GroupedEditableDocuments>((acc, originalDoc) => {
      if (originalDoc.status === 'success' && originalDoc.extractedData) {
        const patientName = originalDoc.extractedData.patientName?.trim();
        const key = patientName || UI_TEXT.patientGroupHeader(null);
        
        // Find the corresponding editable document to add to the group
        const editableVersion = editableDocuments.find(ed => ed.id === originalDoc.id);
        if (editableVersion) {
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(editableVersion);
        }
      }
      return acc;
    }, {});
  }, [successfullyProcessedOriginalDocs, editableDocuments]);


  const patientGroups = Object.keys(groupedEditableDocs).sort((a, b) => {
    const unknownKey = UI_TEXT.patientGroupHeader(null);
    if (a === unknownKey) return 1;
    if (b === unknownKey) return -1;
    return a.localeCompare(b);
  });

  const filteredPatientGroups = useMemo(() => {
    if (!searchTerm.trim()) return patientGroups;
    return patientGroups.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patientGroups, searchTerm]);

  const purpleGradientPrimary = "w-full md:w-auto text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientSecondary = "w-full md:w-auto text-white font-medium py-2.5 px-6 rounded-lg shadow-md bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full md:w-auto text-purple-700 font-medium py-2.5 px-6 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  const smallPurpleGradientAction = "ml-2 text-xs font-medium py-1 px-2.5 rounded-md shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-white focus:ring-indigo-500 transition-all duration-150 ease-in-out";
  const modalPurpleGradientLight = purpleGradientLight.replace("w-full md:w-auto ", "");

  // Listas de documentos por status
  const docsComErro = processedDocuments.filter(doc => doc.status === 'error');
  const docsComSucesso = processedDocuments.filter(doc => doc.status === 'success');
  const docsPendentes = processedDocuments.filter(doc => doc.status === 'pending' || doc.status === 'processing');

  const resumoStatus = `Processados com sucesso: ${docsComSucesso.length} | Com erro: ${docsComErro.length} | Pendentes: ${docsPendentes.length}`;

  if (successfullyProcessedOriginalDocs.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl text-center border border-gray-200">
        <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:space-x-4 justify-center">
            <button
                onClick={onGoBack}
                className={purpleGradientLight.replace("md:w-auto", "sm:w-auto")}
            >
                {UI_TEXT.backToDocumentManagementButton}
            </button>
            <button
                onClick={onSkip}
                className={purpleGradientSecondary.replace("md:w-auto", "sm:w-auto")}
            >
                {UI_TEXT.skipCorrectionsButton.replace("Pular Correção e ", "")}
            </button>
        </div>
      </div>
    );
  }

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 text-sm"; 
  const labelClass = "block text-xs font-medium text-slate-500";

  // Layout paisagem aprimorado: gradiente, tipografia, layout fluido
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start pt-4 px-4 bg-gradient-to-br from-white via-indigo-50 to-purple-50">
      {/* Espaço mínimo entre barra/botões e conteúdo principal */}
      <div style={{height: '8px'}} />
      {/* Modal de detalhes técnicos dos documentos */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Detalhes dos Documentos Processados" size="2xl">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full text-sm text-left border border-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className={tableHeader}>Arquivo</th>
                <th className={tableHeader}>Status</th>
                <th className={tableHeader}>Erro</th>
              </tr>
            </thead>
            <tbody>
              {processedDocuments.map((doc, idx) => (
                <tr key={doc.id} className={zebraRow + (doc.status === 'error' ? ' bg-red-50' : doc.status === 'success' ? ' bg-green-50' : ' bg-yellow-50')}>
                  <td className={tableCell + " font-mono"}>{doc.fileName}</td>
                  <td className={tableCell + " font-semibold"}>{doc.status === 'success' ? 'Sucesso' : doc.status === 'error' ? 'Erro' : 'Pendente'}</td>
                  <td className={tableCell + " text-xs text-red-700"}>{doc.errorMessage || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {docsComErro.length > 0 && onRetryErroredDocuments && (
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={onRetryErroredDocuments}
              className={"px-6 py-2 rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-white font-bold shadow-lg hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 text-base " + buttonSize}
              title="Tentar novamente processar todos os documentos com erro"
            >Reprocessar documentos com erro</button>
          </div>
        )}
        <></>
      </Modal>
      {showFooterButtons && (
        <div className="fixed bottom-0 left-0 w-full flex justify-end bg-transparent py-4 z-30">
          <div className="flex flex-row gap-4 w-full max-w-4xl px-4 justify-end">
            <button onClick={onGoBack} className={buttonLight + ' ' + buttonSize + ' sm:w-auto'}>
              Voltar
            </button>
            <button onClick={onSkip} className={buttonSecondary + ' ' + buttonSize + ' sm:w-auto'}>
              {UI_TEXT.skipCorrectionsButton.replace('Pular Correção e ', '')}
            </button>
            <button onClick={handleSubmitCorrections} className={buttonPrimary + ' ' + buttonSize + ' shadow-lg'} title="Salvar correções e continuar para revisão">
              Salvar e Avançar
            </button>
          </div>
        </div>
      )}
      {/* Conteúdo principal da tela */}
      <div className={"flex-1 w-full h-full flex flex-row font-['Inter','Roboto','Montserrat',sans-serif] " + sectionGap} style={{paddingBottom: '120px'}}>
        {/* Coluna esquerda: Lista de pacientes e busca */}
        <div className="w-1/3 min-w-[240px] max-w-xs flex flex-col p-0">
          <div className="bg-white/90 rounded-3xl shadow-2xl mx-3 mt-8 mb-6 flex flex-col gap-3 pb-6 border border-indigo-100 transition-all duration-300">
            <div className="flex flex-col gap-3 mb-5 mt-6 px-4">
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-base shadow-lg hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 max-w-[220px] mx-auto w-full"
                style={{minHeight: '40px'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Ver detalhes dos documentos
              </button>
              <button
                onClick={onRetryErroredDocuments}
                disabled={docsComErro.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold bg-gradient-to-br from-red-500 to-red-700 text-white text-base shadow-lg hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 max-w-[220px] mx-auto w-full"
                style={{minHeight: '40px'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Reprocessar documentos com erro
              </button>
            </div>
            <div className="px-5 pb-2">
              <label className="block text-base text-slate-600 font-semibold mb-2 tracking-wide">Localizar Paciente</label>
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={inputBase + " w-full px-4 py-2 text-base font-medium text-slate-800 placeholder:text-slate-400 bg-white rounded-lg shadow focus:ring-2 focus:ring-indigo-400 border border-indigo-200 transition-all duration-200"}
              />
            </div>
            <div className="px-3 pb-2">
              {filteredPatientGroups.length === 0 ? (
                <p className="text-base text-slate-600 text-center mt-8 font-semibold">Nenhum paciente encontrado.</p>
              ) : (
                <ul className="space-y-3 mt-3">
                  {filteredPatientGroups.map(patientKey => (
                    <li key={patientKey}>
                      <button
                        className={
                          `w-full text-left px-5 py-3 rounded-xl font-bold transition border-2 focus:outline-none tracking-wide text-base shadow-md flex items-center gap-2 ` +
                          (patientKey === searchTerm
                            ? 'bg-gradient-to-br from-purple-700 to-indigo-800 text-white border-indigo-900 ring-2 ring-indigo-400 scale-[1.03]'
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-transparent hover:from-purple-600 hover:to-indigo-700 hover:scale-[1.02]')
                        }
                        onClick={() => setSearchTerm(patientKey)}
                        style={{letterSpacing: '0.02em'}}
                        title={patientKey === searchTerm ? 'Paciente selecionado' : 'Selecionar paciente'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {patientKey}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {/* Coluna direita: Dados e correções do paciente selecionado */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 relative">
          {/* Para cada paciente/documento selecionado, renderize um card editável completo */}
          {filteredPatientGroups.map(patientKey => (
            <section key={patientKey} className="mb-8">
              {groupedEditableDocs[patientKey]?.map(doc => (
                <div key={doc.id} className="mb-8 pb-8 border-b border-slate-200 last:border-b-0 last:mb-0 last:pb-0 bg-white/90 rounded-xl shadow-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-4 items-start">
                    {/* Coluna esquerda: Campos do paciente */}
                    <div className="flex flex-col gap-3 mb-4 w-full max-w-[400px]">
                      <h2 className="text-2xl font-extrabold text-indigo-700 uppercase truncate mb-2">{doc.extractedData?.patientName || 'Paciente'}</h2>
                      <label className="block text-sm font-semibold text-slate-600 mt-4 mb-1">Nome do Paciente</label>
                      <input
                        type="text"
                        value={doc.extractedData?.patientName || ''}
                        onChange={e => handlePatientNameChange(doc.id, e.target.value)}
                        className="w-full max-w-[480px] px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-medium text-slate-800 bg-white shadow transition-all duration-200 hover:border-indigo-400"
                        placeholder="Nome do paciente"
                      />
                      <label className="block text-sm font-semibold text-slate-600 mt-4 mb-1">Data de Nascimento</label>
                      <input
                        type="text"
                        value={doc.extractedData?.patientDOB || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'patientDOB', e.target.value)}
                        className="w-full max-w-[480px] px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-medium text-slate-800 bg-white shadow transition-all duration-200 hover:border-indigo-400"
                        placeholder="Data de nascimento"
                      />
                      <label className="block text-sm font-semibold text-slate-600 mt-4 mb-1">Data da Cirurgia</label>
                      <input
                        type="text"
                        value={doc.extractedData?.surgeryDate || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'surgeryDate', e.target.value)}
                        className="w-full max-w-[480px] px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-medium text-slate-800 bg-white shadow transition-all duration-200 hover:border-indigo-400"
                        placeholder="Data da cirurgia"
                      />
                      <label className="block text-sm font-semibold text-slate-600 mt-4 mb-1">Procedimento</label>
                      <input
                        type="text"
                        value={doc.extractedData?.procedureName || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'procedureName', e.target.value)}
                        className="w-full max-w-[480px] px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-medium text-slate-800 bg-white shadow transition-all duration-200 hover:border-indigo-400"
                        placeholder="Procedimento"
                      />
                      <label className="block text-sm font-semibold text-slate-600 mt-4 mb-1">Médico Responsável</label>
                      <input
                        type="text"
                        value={doc.extractedData?.doctorName || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'doctorName', e.target.value)}
                        className="w-full max-w-[480px] px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-medium text-slate-800 bg-white shadow transition-all duration-200 hover:border-indigo-400"
                        placeholder="Médico responsável"
                      />
                      {doc.imagePreviewUrl && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={() => handleViewDocument(doc.id)}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-base font-bold shadow-md hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                            style={{ minWidth: '220px' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 opacity-80">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h9a2.25 2.25 0 002.25-2.25V9.75A2.25 2.25 0 0016.5 7.5h-6.75A2.25 2.25 0 007.5 9.75v7.5A2.25 2.25 0 009.75 19.5h4.5A2.25 2.25 0 0016.5 17.25V9z" />
                            </svg>
                            Visualizar Documento
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Coluna direita: Materiais Utilizados */}
                    <div className="flex flex-col gap-16 w-full max-w-[1000px] ml-16 pl-12">
                    <h4 className="text-3xl font-extrabold text-purple-700 mb-0 text-center tracking-tight leading-tight drop-shadow-sm select-none">Materiais Utilizados</h4>
                    {doc.extractedData?.materialsUsed.map((material, index) => (
                      <div key={index} className={`mb-6 p-7 rounded-2xl border border-indigo-100 shadow-lg bg-gradient-to-br from-white via-indigo-50 to-white/90 transition-all duration-300 ${material.contaminated ? 'ring-2 ring-red-400 bg-gradient-to-br from-red-50/70 to-white/90' : ''}`}> 
                        {/* Header premium: Checkbox Contaminado no topo à esquerda */}
                        <div className="flex items-center mb-5 gap-3">
                            <input
                              type="checkbox"
                              checked={!!material.contaminated}
                              onChange={e => {
                                setEditableDocuments(prevDocs =>
                                  prevDocs.map(docItem => {
                                    if (docItem.id === doc.id && docItem.extractedData) {
                                      const newMaterials = [...docItem.extractedData.materialsUsed];
                                      newMaterials[index] = {
                                        ...newMaterials[index],
                                        contaminated: e.target.checked
                                      };
                                      return { ...docItem, extractedData: { ...docItem.extractedData, materialsUsed: newMaterials } };
                                    }
                                    return docItem;
                                  })
                                );
                              }}
                            className="accent-red-500 w-5 h-5 mr-2 rounded-lg border-2 border-red-300 shadow focus:ring-2 focus:ring-red-400 transition-all duration-200"
                              id={`contaminated-${doc.id}-${index}`}
                            />
                          <label htmlFor={`contaminated-${doc.id}-${index}`} className="text-red-600 font-semibold text-base cursor-pointer select-none tracking-wide">Contaminado</label>
                          {material.contaminated && (
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-200 via-red-100 to-white text-red-700 rounded-full text-xs ml-2 font-bold tracking-wide shadow-sm border border-red-200" title="Material contaminado">Contaminado</span>
                          )}
                          </div>
                        {/* Linha premium dos campos principais */}
                        <div className="grid grid-cols-12 gap-5 items-end">
                            {/* Descrição */}
                            <div className="col-span-6">
                              <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor={`desc-${doc.id}-${index}`}>Descrição</label>
                              <CreatableSelect
                                inputId={`desc-${doc.id}-${index}`}
                                isClearable
                                placeholder="Selecione ou digite a descrição"
                                formatCreateLabel={inputValue => `Cadastrar novo: "${inputValue}"`}
                                value={material.description ? { label: material.description, value: material.description } : null}
                                options={materialDbItems.map(m => ({ label: m.description, value: m.description, code: m.code }))}
                                onChange={option => {
                                  if (!option) {
                                    handleMaterialChange(doc.id, index, 'description', '');
                                    handleMaterialChange(doc.id, index, 'code', '');
                                    return;
                                  }
                                  const selected = materialDbItems.find(m => m.description === option.value);
                                  handleMaterialChange(doc.id, index, 'description', option.value);
                                  handleMaterialChange(doc.id, index, 'code', selected ? selected.code : '');
                                }}
                                onCreateOption={inputValue => {
                                  // Cria novo material na base
                                  const newMaterial = {
                                    id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                    description: inputValue,
                                    code: '',
                                  };
                                  onMaterialDbUpdate && onMaterialDbUpdate([...materialDbItems, newMaterial]);
                                  handleMaterialChange(doc.id, index, 'description', inputValue);
                                  handleMaterialChange(doc.id, index, 'code', '');
                                }}
                                classNamePrefix="react-select"
                              />
                          </div>
                          {/* Código */}
                          <div className="col-span-3">
                            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor={`code-${doc.id}-${index}`}>Código</label>
                              <CreatableSelect
                                inputId={`code-${doc.id}-${index}`}
                                isClearable
                                placeholder="Selecione ou digite"
                                formatCreateLabel={inputValue => `Cadastrar novo: \"${inputValue}\"`}
                                value={material.code ? { label: material.code, value: material.code } : null}
                                options={materialDbItems.map(m => ({ label: m.code, value: m.code, description: m.description }))}
                                onChange={option => {
                                  if (!option) {
                                    handleMaterialChange(doc.id, index, 'code', '');
                                    handleMaterialChange(doc.id, index, 'description', '');
                                    return;
                                  }
                                  const selected = materialDbItems.find(m => m.code === option.value);
                                  handleMaterialChange(doc.id, index, 'code', option.value);
                                  handleMaterialChange(doc.id, index, 'description', selected ? selected.description : '');
                                }}
                                onCreateOption={inputValue => {
                                  // Cria novo material na base
                                  const newMaterial = {
                                    id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                    description: '',
                                    code: inputValue,
                                  };
                                  onMaterialDbUpdate && onMaterialDbUpdate([...materialDbItems, newMaterial]);
                                  handleMaterialChange(doc.id, index, 'code', inputValue);
                                  handleMaterialChange(doc.id, index, 'description', '');
                                }}
                                classNamePrefix="react-select"
                            />
                          </div>
                          {/* Quantidade */}
                            <div className="col-span-2 flex items-center max-w-[90px]">
                              <div className="w-full">
                            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor={`qty-${doc.id}-${index}`}>Qtd</label>
                            <input
                              id={`qty-${doc.id}-${index}`}
                              type="number"
                              min="1"
                              value={material.quantity}
                              onChange={e => handleMaterialChange(doc.id, index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700"
                            />
                              </div>
                          </div>
                          {/* Botão Remover */}
                            <div className="col-span-1 flex justify-end items-center h-full">
                            <button
                              onClick={() => handleRemoveMaterial(doc.id, index)}
                                className="px-2 py-1 rounded bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 mt-4"
                              title="Remover material"
                                style={{alignSelf: 'center'}}
                              >
                                Remover
                              </button>
                            </div>
                        </div>
                        {/* Linha premium abaixo para Lote e Observação */}
                        <div className="grid grid-cols-12 gap-4 mt-2">
                          {/* Lote */}
                          <div className="col-span-6">
                            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor={`lot-${doc.id}-${index}`}>Lote</label>
                            <input
                              id={`lot-${doc.id}-${index}`}
                              type="text"
                              value={material.lotNumber || ''}
                              onChange={e => handleMaterialChange(doc.id, index, 'lotNumber', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700"
                              placeholder="Lote"
                            />
                          </div>
                          {/* Observação */}
                          <div className="col-span-6">
                            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor={`obs-${doc.id}-${index}`}>Observação</label>
                            <input
                              id={`obs-${doc.id}-${index}`}
                              type="text"
                              value={material.observacaoUsuario || ''}
                              onChange={e => handleMaterialChange(doc.id, index, 'observacaoUsuario', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700"
                              placeholder="Observação"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end -mt-16 mr-8">
                      <button
                        type="button"
                        onClick={() => handleAddMaterial(doc.id)}
                        className="text-purple-700 font-bold text-lg hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-150 bg-transparent border-none shadow-none p-0 m-0"
                        style={{minWidth: '0', boxShadow: 'none'}}
                        title="Adicionar novo material"
                      >
                        +Material
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
      {/* Modal de visualização do documento */}
      {viewingDocument && (
        <Modal isOpen={!!viewingDocument} onClose={handleCloseViewDocumentModal} title="Visualização do Documento" size="3xl">
          <div className="w-full flex items-center justify-center">
            {viewingDocument.imagePreviewUrl ? (
              <img
                src={viewingDocument.imagePreviewUrl}
                alt="Documento"
                className="block mx-auto max-w-full max-h-[70vh] rounded shadow border border-gray-200 bg-white"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="text-red-600 font-semibold py-8 text-center bg-white rounded shadow-lg w-full">
                Arquivo não disponível para visualização.
              </div>
            )}
          </div>
        </Modal>
      )}
      {/* Modal de cadastro rápido: apenas campos de código e descrição, visual simples e elegante */}
      {showAddMaterialModal && (
        <Modal isOpen={true} onClose={() => setShowAddMaterialModal(null)} title="Cadastrar novo material" size="sm">
          <form
            onSubmit={e => {
              e.preventDefault();
              const desc = showAddMaterialModal.desc.trim();
              const code = newQuickMaterialCode.trim();
              if (!desc) {
                setAddMaterialError('Descrição obrigatória.');
                return;
              }
              if (materialDbItems.some(m => m.description.toLowerCase() === desc.toLowerCase() || (code && m.code && m.code.toLowerCase() === code.toLowerCase()))) {
                setAddMaterialError('Já existe material com essa descrição ou código.');
                return;
              }
              const newMaterial = {
                id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                description: desc,
                code: code || '',
              };
              onMaterialDbUpdate?.([
                ...materialDbItems,
                newMaterial
              ].sort((a, b) => a.description.localeCompare(b.description)));
              handleMaterialChange(showAddMaterialModal.docId, showAddMaterialModal.index, 'description', desc);
              setShowAddMaterialModal(null);
              setShowSuccessTooltip({key: showAddMaterialModal.docId + '-' + showAddMaterialModal.index, message: 'Material cadastrado com sucesso!'});
              setHighlightedNewMaterialId(newMaterial.id);
              setTimeout(() => setHighlightedNewMaterialId(null), 1000);
              setTimeout(() => setShowSuccessTooltip(null), 2500);
            }}
            className="space-y-4 p-2"
          >
            <div className="mb-2">
              <label className="block text-xs font-semibold text-indigo-700 mb-1">Descrição</label>
              <input type="text" value={showAddMaterialModal.desc} onChange={e => setShowAddMaterialModal(modal => modal ? {...modal, desc: e.target.value} : null)} className="w-full px-2 py-1.5 rounded border border-indigo-200 bg-white text-sm text-slate-700 font-semibold" />
            </div>
            <div className="mb-2">
              <label className="block text-xs font-semibold text-indigo-700 mb-1">Código (opcional)</label>
              <input type="text" value={newQuickMaterialCode} onChange={e => setNewQuickMaterialCode(e.target.value)} className="w-full px-2 py-1.5 rounded border border-indigo-200 text-sm" placeholder="Ex: P-205" />
            </div>
            {addMaterialError && <div className="text-xs text-red-600 font-semibold mb-2">{addMaterialError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddMaterialModal(null)} className="px-4 py-1.5 rounded font-semibold bg-gradient-to-br from-gray-200 to-gray-100 text-slate-700 hover:from-gray-300 hover:to-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 rounded font-bold bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Cadastrar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
