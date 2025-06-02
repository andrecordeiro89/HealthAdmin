import React, { useState, useEffect, useMemo } from 'react';
import { CorrectedMaterialItem, ProcessedDocumentEntry, MaterialUsed } from '../types';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';
import { Modal } from './Modal';

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
}) => {
  const [editableDocuments, setEditableDocuments] = useState<ProcessedDocumentEntry[]>([]);
  const [viewingDocument, setViewingDocument] = useState<ProcessedDocumentEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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


  const handleMaterialChange = (
    docId: string, 
    materialIndex: number, 
    field: 'description' | 'code', 
    value: string
  ) => {
    setEditableDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId && doc.extractedData) {
          const newMaterialsUsed = [...doc.extractedData.materialsUsed];
          if (newMaterialsUsed[materialIndex]) {
            newMaterialsUsed[materialIndex] = {
              ...newMaterialsUsed[materialIndex],
              [field]: value || (field === 'code' ? null : ''), // Handle empty string for code as null
            };
            return { ...doc, extractedData: { ...doc.extractedData, materialsUsed: newMaterialsUsed } };
          }
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
        // Check for patient name change - this affects the current document data, not the material DB directly
        // The actual patientName in editedDoc is already updated.

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
            // Add observation to the edited material in editableDocuments
            const observationUpdate = ` (Correção Aplicada. Original: Desc='${originalMaterial.description}', Cód='${originalMaterial.code || 'N/A'}')`;
            editedMaterial.observation = (editedMaterial.observation || "") + observationUpdate;
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

  // Lista de arquivos com erro
  const docsComErro = processedDocuments.filter(doc => doc.status === 'error');

  if (successfullyProcessedOriginalDocs.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl text-center border border-gray-200">
        <Alert message={UI_TEXT.noSuccessfullyProcessedDocsForReview} type={AlertType.Info} />
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
    <div className="w-full h-[80vh] flex flex-row bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-xl border border-gray-200 overflow-hidden font-['Inter','Roboto','Montserrat',sans-serif]">
      {/* Mensagem de destaque sobre a importância da correção para IA */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-[60vw] max-w-2xl">
        <div className="bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-200 border-l-4 border-yellow-400 text-yellow-900 text-center text-base font-semibold rounded-lg shadow p-3 mb-4">
          Sua correção é fundamental para treinar e aprimorar a Inteligência Artificial do sistema. Por favor, revise e ajuste os dados com atenção!
        </div>
      </div>
      {/* Coluna esquerda: Lista de pacientes e busca */}
      <div className="w-1/3 min-w-[240px] max-w-xs flex flex-col p-0" style={{background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 60%, #d1d5db 100%)'}}>
        <div className="p-4 pb-2">
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-none shadow focus:ring-2 focus:ring-purple-400 text-base font-medium text-slate-800 placeholder:text-slate-400"
            style={{background: 'rgba(255,255,255,0.95)'}}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredPatientGroups.length === 0 ? (
            <p className="text-slate-200 text-base text-center mt-8 font-semibold">Nenhum paciente encontrado.</p>
          ) : (
            <ul className="space-y-1">
              {filteredPatientGroups.map(patientKey => (
                <li key={patientKey}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold transition border-2 focus:outline-none focus:ring-2 focus:ring-white/60 tracking-wide text-base shadow-sm
                      ${patientKey === searchTerm ? 'bg-white text-indigo-700 border-indigo-400 ring-2 ring-indigo-300' : 'bg-indigo-500/10 text-white border-transparent hover:bg-indigo-400/20'}`}
                    onClick={() => setSearchTerm(patientKey)}
                    style={{letterSpacing: '0.02em'}}
                  >
                    {patientKey}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Coluna direita: Dados e correções do paciente selecionado */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8">
        {/* Mantém o restante do conteúdo da tela, mas só mostra para o paciente selecionado */}
        {filteredPatientGroups.map(patientKey => (
          <section key={patientKey} className="mb-8">
            <h3 className="text-2xl font-extrabold text-indigo-700 mb-4 tracking-wide border-b-2 border-indigo-100 pb-2 uppercase">{patientKey}</h3>
            {groupedEditableDocs[patientKey]?.map(doc => (
              <div key={doc.id} className="mb-8 pb-8 border-b border-slate-200 last:border-b-0 last:mb-0 last:pb-0">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-slate-500 text-sm font-semibold">{doc.fileName}</span>
                  <button
                    onClick={() => handleViewDocument(doc.id)}
                    className="ml-2 px-3 py-1.5 rounded bg-gradient-to-br from-gray-500 to-gray-700 text-white text-xs font-bold shadow hover:from-gray-600 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >Visualizar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Paciente (Extraído pela IA):</label>
                    <div className="text-base font-bold text-indigo-800 mb-2">{doc.extractedData?.patientName || 'N/A'}</div>
                    <label className="block text-xs font-semibold text-indigo-600 mb-1">Sua Correção / Confirmação:</label>
                    <input
                      type="text"
                      value={doc.extractedData?.patientName || ''}
                      onChange={e => handlePatientNameChange(doc.id, e.target.value)}
                      className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base font-semibold text-slate-700 mb-4"
                      placeholder="Corrija o nome do paciente"
                    />
                  </div>
                  <div>
                    {/* Espaço reservado para possíveis dados adicionais do paciente */}
                  </div>
                </div>
                {doc.extractedData?.materialsUsed.map((material, index) => (
                  <div key={index} className="mt-6 p-4 rounded-lg bg-gradient-to-br from-white via-indigo-50 to-purple-50 border border-indigo-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-indigo-600 mb-1">Extraído pela IA:</h4>
                        <p className="text-xs text-slate-500 mb-1">Descrição do Material: <span className="font-semibold text-slate-700">{material.description}</span></p>
                        <p className="text-xs text-slate-500 mb-1">Código do Material (se aplicável): <span className="font-semibold text-slate-700">{material.code || 'N/A'}</span></p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-600 mb-1">Sua Correção / Confirmação:</h4>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição do Material</label>
                        <input
                          type="text"
                          value={material.description}
                          onChange={e => handleMaterialChange(doc.id, index, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700 mb-2"
                        />
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Código do Material (se aplicável)</label>
                        <input
                          type="text"
                          value={material.code || ''}
                          onChange={e => handleMaterialChange(doc.id, index, 'code', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-700"
                          placeholder="Ex: P-205 (se aplicável)"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2"><strong>Qtd. Consumida (neste doc):</strong> {material.quantity}</p>
                  </div>
                ))}
                {(!doc.extractedData || doc.extractedData.materialsUsed.length === 0) && (
                  <p className="text-sm text-slate-500 italic text-center py-2">Nenhum material extraído para este documento.</p>
                )}
              </div>
            ))}
          </section>
        ))}
        {/* Botões de ação fixos ao final da coluna de dados/correção */}
        <div className="mt-8 pt-6 border-t border-gray-200 space-y-3 md:space-y-0 md:flex md:flex-row md:justify-center md:space-x-4 items-center">
          <button
            onClick={onGoBack}
            className={purpleGradientLight}
          >
            {UI_TEXT.backToDocumentManagementButton}
          </button>
          <button
            onClick={onSkip}
            className={purpleGradientSecondary}
          >
            {UI_TEXT.skipCorrectionsButton}
          </button>
          <button
            onClick={handleSubmitCorrections}
            className={purpleGradientPrimary}
          >
            {UI_TEXT.saveCorrectionsButton}
          </button>
        </div>
      </div>
    </div>
  );
};
