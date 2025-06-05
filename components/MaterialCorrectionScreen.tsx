import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CorrectedMaterialItem, ProcessedDocumentEntry, MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';
import { Modal } from './Modal';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, buttonSecondary, inputBase, buttonSize, cardLarge, cardBase, sectionGap } from './uiClasses';

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
            <button onClick={onGoBack} className={buttonLight + " sm:w-auto"}>
              {UI_TEXT.backToDocumentManagementButton}
            </button>
            <button onClick={onSkip} className={buttonSecondary + " sm:w-auto"}>
              {UI_TEXT.skipCorrectionsButton.replace("Pular Correção e ", "")}
            </button>
            <button onClick={handleSubmitCorrections} className={buttonPrimary + " " + buttonSize + " shadow-lg"} title="Salvar correções e continuar para revisão">
              Salvar e Avançar
            </button>
          </div>
        </div>
      )}
      {/* Conteúdo principal da tela */}
      <div className={"flex-1 w-full h-full flex flex-row font-['Inter','Roboto','Montserrat',sans-serif] " + sectionGap} style={{paddingBottom: '120px'}}>
        {/* Coluna esquerda: Lista de pacientes e busca */}
        <div className="w-1/3 min-w-[240px] max-w-xs flex flex-col p-0" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)'}}>
          <div className="bg-gray-50 rounded-2xl shadow-md mx-2 mt-6 mb-4 flex flex-col gap-2 pb-4">
            <div className="flex flex-col gap-2 mb-4 mt-4">
              <button
                onClick={() => setShowStatusModal(true)}
                className={"px-3 py-2 rounded-lg font-bold bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-sm shadow hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-[210px] mx-auto w-full"}
                style={{minHeight: '36px'}}
              >
                Ver detalhes dos documentos
              </button>
              <button
                onClick={onRetryErroredDocuments}
                disabled={docsComErro.length === 0}
                className={"px-3 py-2 rounded-lg font-bold bg-gradient-to-br from-red-500 to-red-700 text-white text-sm shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed max-w-[210px] mx-auto w-full"}
                style={{minHeight: '36px'}}
              >
                Reprocessar documentos com erro
              </button>
            </div>
            <div className="p-4 pb-2">
              <label className="block text-base text-slate-600 font-semibold mb-1">Localizar Paciente</label>
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={inputBase + " w-full px-4 py-2 text-base font-medium text-slate-800 placeholder:text-slate-400 bg-white"}
              />
            </div>
            <div className="px-2 pb-2">
              {filteredPatientGroups.length === 0 ? (
                <p className="text-base text-slate-600 text-center mt-8 font-semibold">Nenhum paciente encontrado.</p>
              ) : (
                <ul className="space-y-3 mt-2">
                  {filteredPatientGroups.map(patientKey => (
                    <li key={patientKey}>
                      <button
                        className={
                          `w-full text-left px-4 py-3 rounded-lg font-bold transition border-2 focus:outline-none tracking-wide text-base shadow-sm ` +
                          (patientKey === searchTerm
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-indigo-900 ring-2 ring-indigo-400'
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-transparent hover:from-purple-600 hover:to-indigo-700')
                        }
                        onClick={() => setSearchTerm(patientKey)}
                        style={{letterSpacing: '0.02em'}}
                        title={patientKey === searchTerm ? 'Paciente selecionado' : 'Selecionar paciente'}
                      >
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
              <h3 className="text-xl sm:text-2xl font-extrabold text-indigo-700 mb-4 tracking-tight border-b-2 border-indigo-100 pb-2 uppercase">{patientKey}</h3>
              {groupedEditableDocs[patientKey]?.map(doc => (
                <div key={doc.id} className="mb-8 pb-8 border-b border-slate-200 last:border-b-0 last:mb-0 last:pb-0 bg-white/90 rounded-xl shadow-xl p-6">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-slate-700 text-sm font-semibold">{doc.fileName}</span>
                    {doc.imagePreviewUrl && (
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        className={"ml-2 px-3 py-1.5 rounded bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-bold shadow hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 " + buttonSize}
                      >Visualizar</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Paciente</label>
                      <input
                        type="text"
                        value={doc.extractedData?.patientName || ''}
                        onChange={e => handlePatientNameChange(doc.id, e.target.value)}
                        className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-semibold text-slate-700 mb-2"
                        placeholder="Nome do paciente"
                      />
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Data de Nascimento</label>
                      <input
                        type="text"
                        value={doc.extractedData?.patientDOB || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'patientDOB', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-semibold text-slate-700 mb-2"
                        placeholder="Data de nascimento"
                      />
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Data da Cirurgia</label>
                      <input
                        type="text"
                        value={doc.extractedData?.surgeryDate || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'surgeryDate', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-semibold text-slate-700 mb-2"
                        placeholder="Data da cirurgia"
                      />
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Procedimento</label>
                      <input
                        type="text"
                        value={doc.extractedData?.procedureName || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'procedureName', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-semibold text-slate-700 mb-2"
                        placeholder="Procedimento"
                      />
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Médico Responsável</label>
                      <input
                        type="text"
                        value={doc.extractedData?.doctorName || ''}
                        onChange={e => handlePatientInfoChange(doc.id, 'doctorName', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-semibold text-slate-700 mb-2"
                        placeholder="Médico responsável"
                      />
                    </div>
                    <div>
                      {/* Espaço reservado para possíveis dados adicionais do paciente */}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-indigo-700 mb-2">Materiais Utilizados</h4>
                    {doc.extractedData?.materialsUsed.map((material, index) => (
                      <div key={index} className={`mb-4 p-4 rounded-lg bg-gradient-to-br from-white via-indigo-50 to-purple-50 border border-indigo-100 shadow-sm ${material.contaminated ? 'ring-2 ring-red-400 bg-red-50/40' : ''}`}>
                        <div className="flex items-center mb-2">
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
                            className="mr-2 accent-red-500 w-5 h-5"
                            id={`contaminated-${doc.id}-${index}`}
                          />
                          <label htmlFor={`contaminated-${doc.id}-${index}`} className="text-xs font-semibold text-red-600 flex items-center cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Contaminado
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
                            <div className="relative flex items-center gap-1">
                              <input
                                type="text"
                                value={material.description}
                                onChange={e => {
                                  handleMaterialChange(doc.id, index, 'description', e.target.value);
                                  setShowSuggestionIdx(doc.id + '-' + index);
                                  setHighlightedIdx(-1);
                                }}
                                onFocus={() => {
                                  if (material.description) setShowSuggestionIdx(doc.id + '-' + index);
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestionIdx(null), 150)}
                                onKeyDown={e => {
                                  const filtered = materialDbItems.filter(m => m.description.toLowerCase().includes((material.description || '').toLowerCase()));
                                  if (showSuggestionIdx !== doc.id + '-' + index || filtered.length === 0) return;
                                  if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setHighlightedIdx(prev => (prev + 1) % filtered.length);
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setHighlightedIdx(prev => (prev - 1 + filtered.length) % filtered.length);
                                  } else if (e.key === 'Enter' && highlightedIdx >= 0) {
                                    e.preventDefault();
                                    handleMaterialChange(doc.id, index, 'description', filtered[highlightedIdx].description);
                                    setShowSuggestionIdx(null);
                                    setHighlightedIdx(-1);
                                  }
                                }}
                                className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700 mb-2"
                                autoComplete="off"
                              />
                              {/* Botão + para cadastro rápido */}
                              {material.description && !materialDbItems.some(m => m.description.toLowerCase() === material.description.toLowerCase()) && onMaterialDbUpdate && (
                                <button
                                  type="button"
                                  className="ml-1 text-indigo-600 text-base font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer bg-transparent border-none p-0 m-0"
                                  title="Cadastrar novo material"
                                  onClick={() => {
                                    setShowAddMaterialModal({ docId: doc.id, index, desc: material.description });
                                    setNewQuickMaterialCode('');
                                    setAddMaterialError(null);
                                  }}
                                  style={{minWidth: '0', boxShadow: 'none'}}
                                >+
                                </button>
                              )}
                              {/* Modal de cadastro rápido */}
                              {showAddMaterialModal && showAddMaterialModal.docId === doc.id && showAddMaterialModal.index === index && (
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
                                      handleMaterialChange(doc.id, index, 'description', desc);
                                      setShowAddMaterialModal(null);
                                    }}
                                    className="space-y-3"
                                  >
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
                                      <input type="text" value={showAddMaterialModal.desc} disabled className="w-full px-2 py-1.5 rounded border border-gray-300 bg-gray-100 text-sm" />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-slate-500 mb-1">Código (opcional)</label>
                                      <input type="text" value={newQuickMaterialCode} onChange={e => setNewQuickMaterialCode(e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm" />
                                    </div>
                                    {addMaterialError && <div className="text-xs text-red-600">{addMaterialError}</div>}
                                    <div className="flex justify-end gap-2 pt-2">
                                      <button type="button" onClick={() => setShowAddMaterialModal(null)} className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium">Cancelar</button>
                                      <button type="submit" className="px-3 py-1 rounded bg-gradient-to-br from-green-500 to-green-700 text-white font-bold">Cadastrar</button>
                                    </div>
                                  </form>
                                </Modal>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Código</label>
                            <input
                              type="text"
                              value={material.code || ''}
                              onChange={e => handleMaterialChange(doc.id, index, 'code', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700 mb-2"
                              placeholder="Código do material"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Quantidade</label>
                            <input
                              type="number"
                              min="1"
                              value={material.quantity}
                              onChange={e => handleMaterialChange(doc.id, index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700 mb-2"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Lote</label>
                            <input
                              type="text"
                              value={material.lotNumber || ''}
                              onChange={e => handleMaterialChange(doc.id, index, 'lotNumber', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700 mb-2"
                              placeholder="Lote"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Observação</label>
                            {/* Sugestão da IA, se houver */}
                            {material.observacaoOcr && (
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-semibold text-slate-700 bg-indigo-50 px-2 py-0.5 rounded">Sugestão da IA: {material.observacaoOcr}</span>
                                {(!material.observacaoUsuario || material.observacaoUsuario.trim() === '') && (
                                  <button
                                    type="button"
                                    className="text-xs text-indigo-600 font-semibold hover:underline focus:outline-none"
                                    onClick={() => handleMaterialChange(doc.id, index, 'observacaoUsuario', material.observacaoOcr || '')}
                                  >Aceitar sugestão da IA</button>
                                )}
                              </div>
                            )}
                            <input
                              type="text"
                              value={material.observacaoUsuario || ''}
                              onChange={e => handleMaterialChange(doc.id, index, 'observacaoUsuario', e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700 mb-2"
                              placeholder="Observação"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleRemoveMaterial(doc.id, index)}
                            className="px-3 py-1.5 rounded bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 ml-2"
                          >Remover Material</button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAddMaterial(doc.id)}
                        className="text-indigo-600 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer bg-transparent border-none p-0 m-0"
                        style={{minWidth: '0', boxShadow: 'none'}}
                      >+ Material</button>
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
    </div>
  );
};
