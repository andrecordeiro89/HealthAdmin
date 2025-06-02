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

  return (
    <>
    <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between items-center text-center gap-2">
        <span className="text-indigo-700 font-semibold text-lg">
          {`Total de documentos: ${totalDocs}`}
        </span>
        <span className="text-green-700 font-semibold">
          {`Processados com sucesso: ${totalDocsProcessados}`}
        </span>
        <span className="text-red-600 font-semibold">
          {`Com erro: ${totalDocsErro}`}
        </span>
      </div>
      {docsComErro.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-red-600 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-semibold">Documentos com erro no processamento:</span>
          </div>
          <ul className="list-disc list-inside text-red-700 text-sm mb-2">
            {docsComErro.map(doc => (
              <li key={doc.id}>{doc.fileName} <span className="text-xs text-red-500 font-semibold">(erro)</span></li>
            ))}
          </ul>
          <button
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
            onClick={() => onRetryErroredDocuments && onRetryErroredDocuments()}
          >
            Tentar novamente processar documentos com erro
          </button>
        </div>
      )}
      <h2 className="text-xl sm:text-2xl font-bold text-indigo-600 mb-2 text-center"> 
        {UI_TEXT.aiCorrectionScreenTitle}
      </h2>
      <p className="text-sm text-slate-500 text-center mb-4 px-4">
        {aiCorrectionScreenIntroUpdated(hospitalName)}
      </p>

      <div className="my-4 p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm flex items-start"> 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0"> 
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-sm text-indigo-700 font-medium"> 
            {UI_TEXT.aiCorrectionFeedbackNote}
        </p>
      </div>

      <div className="space-y-6 mb-6 max-h-[calc(65vh-5rem)] overflow-y-auto pr-2 custom-scrollbar">
        {patientGroups.map(patientKey => (
          <div key={patientKey} className="bg-gray-100 p-3 sm:p-4 rounded-lg shadow-md border border-gray-300">
            <h3 className="text-lg font-semibold text-indigo-700 mb-3 border-b border-gray-300 pb-2"> 
              {patientKey === UI_TEXT.patientGroupHeader(null) && editableDocuments.find(doc => (doc.extractedData?.patientName || UI_TEXT.patientGroupHeader(null)) === patientKey) 
                ? (editableDocuments.find(doc => (doc.extractedData?.patientName || UI_TEXT.patientGroupHeader(null)) === patientKey)?.extractedData?.patientName || UI_TEXT.patientGroupHeader(null)) 
                : patientKey
              }
            </h3>
            {groupedEditableDocs[patientKey]?.map(doc => {
              const originalDocForComparison = successfullyProcessedOriginalDocs.find(od => od.id === doc.id);
              return (
                <div key={doc.id} className="mb-4 p-3 bg-white rounded-md shadow border border-gray-200">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-slate-700 truncate" title={doc.fileName}>{doc.fileName}</p>
                    <button
                      onClick={() => handleViewDocument(doc.id)}
                      className={smallPurpleGradientAction}
                      aria-label={`${UI_TEXT.viewDocumentButtonLabel} para ${doc.fileName}`}
                    >
                      {UI_TEXT.viewDocumentButtonLabel}
                    </button>
                  </div>

                  {/* Patient Name Editing Section */}
                  <div className="mb-4">
                     <p className={`${labelClass} mb-0.5`}>
                        {aiExtractedPatientNameLabel} <span className="text-slate-700 font-medium">{originalDocForComparison?.extractedData?.patientName || 'N/A'}</span>
                     </p>
                     <label htmlFor={`patientName-${doc.id}`} className={`${labelClass} text-indigo-600 font-semibold`}>{UI_TEXT.yourCorrectionLabel} ({patientNameLabel})</label> 
                     <input
                        type="text"
                        id={`patientName-${doc.id}`}
                        value={doc.extractedData?.patientName || ''}
                        onChange={(e) => handlePatientNameChange(doc.id, e.target.value)}
                        className={inputClass}
                        placeholder="Corrija o nome do paciente"
                    />
                  </div>
                  
                  {doc.extractedData?.materialsUsed.map((material, index) => {
                    const originalMaterial = originalDocForComparison?.extractedData?.materialsUsed[index];
                    return (
                      <div key={index} className="py-3 border-t border-gray-200 first-of-type:border-t-0"> {/* Use first-of-type for materials only */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-indigo-600 mb-1">{UI_TEXT.aiExtractedLabel}</h4> 
                            <p className={labelClass}>
                              {UI_TEXT.materialDescriptionLabel}: <span className="text-slate-700 font-medium">{originalMaterial?.description || 'N/A'}</span>
                            </p>
                            <p className={labelClass}>
                              {UI_TEXT.materialCodeLabel}: <span className="text-slate-700 font-medium">{originalMaterial?.code || 'N/A'}</span>
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-indigo-600 mb-1">{UI_TEXT.yourCorrectionLabel}</h4> 
                            <div>
                              <label htmlFor={`desc-${doc.id}-${index}`} className={labelClass}>{UI_TEXT.materialDescriptionLabel}</label>
                              <input
                                type="text"
                                id={`desc-${doc.id}-${index}`}
                                value={material.description}
                                onChange={(e) => handleMaterialChange(doc.id, index, 'description', e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div className="mt-2">
                              <label htmlFor={`code-${doc.id}-${index}`} className={labelClass}>{UI_TEXT.materialCodeLabel}</label>
                              <input
                                type="text"
                                id={`code-${doc.id}-${index}`}
                                value={material.code || ''}
                                onChange={(e) => handleMaterialChange(doc.id, index, 'code', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: P-205 (se aplicável)"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            <strong>Qtd. Consumida (neste doc):</strong> {material.quantity}
                        </p>
                      </div>
                    );
                  })}
                  {(!doc.extractedData || doc.extractedData.materialsUsed.length === 0) && (
                    <p className="text-sm text-slate-500 italic text-center py-2">Nenhum material extraído para este documento.</p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

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

    {viewingDocument && (
        <Modal
            isOpen={!!viewingDocument}
            onClose={handleCloseViewDocumentModal}
            title={UI_TEXT.modalTitleViewDocument(viewingDocument.fileName)}
            size="3xl" 
        >
            {viewingDocument.imagePreviewUrl ? (
                <img 
                    src={viewingDocument.imagePreviewUrl} 
                    alt={`Preview de ${viewingDocument.fileName}`} 
                    className="w-full h-auto max-h-[75vh] object-contain rounded" 
                />
            ) : (
                <p>Preview da imagem não disponível.</p>
            )}
             <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                    type="button" 
                    onClick={handleCloseViewDocumentModal}
                    className={modalPurpleGradientLight}
                >
                    {UI_TEXT.cancelButton}
                </button>
            </div>
        </Modal>
    )}
    </>
  );
};
