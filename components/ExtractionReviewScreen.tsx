

import React, { useState } from 'react';
import { ProcessedDocumentEntry, MaterialUsed } from '../types'; // Added MaterialUsed
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';

interface ExtractionReviewScreenProps {
  documents: ProcessedDocumentEntry[];
  onEditDocument: (docId: string) => void;
  onConfirmAndGenerateReport: () => void;
  onGoBack: () => void; // This will now navigate to MaterialCorrectionScreen
  hospitalName: string;
  onOpenRemovePatientConfirmModal: (groupKey: string) => void;
}

interface GroupedDocuments {
  [patientNameOrGenericKey: string]: ProcessedDocumentEntry[];
}

const DetailItem: React.FC<{ label: string, value: string | null | undefined }> = ({ label, value }) => (
  value ? <p className="text-xs text-slate-500"><strong className="text-slate-400">{label}:</strong> {value}</p> : null
);

const MaterialsTable: React.FC<{ materials: MaterialUsed[] }> = ({ materials }) => {
  if (!materials || materials.length === 0) {
    return <p className="text-xs text-slate-400 italic mt-1">Nenhum material listado para este documento.</p>;
  }
  return (
    <div className="mt-2 text-xs">
      <h4 className="font-semibold text-indigo-600 mb-1">Materiais Utilizados:</h4> 
      <div className="max-h-32 overflow-y-auto bg-gray-50 p-1.5 rounded border border-gray-200">
        {materials.map((material, index) => (
          <div key={index} className={`py-1 ${index < materials.length -1 ? 'border-b border-gray-200' : ''}`}>
            <p className="text-slate-700">{material.description}</p>
            <div className="flex justify-between text-slate-500">
              <span>Qtd: {material.quantity}</span>
              {material.code && <span>Cód: {material.code}</span>}
            </div>
             {material.observation && <p className="text-xs text-slate-400 italic col-span-full">Obs: {material.observation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};


export const ExtractionReviewScreen: React.FC<ExtractionReviewScreenProps> = ({
  documents,
  onEditDocument,
  onConfirmAndGenerateReport,
  onGoBack, // This onGoBack is expected to lead to MaterialCorrectionScreen
  hospitalName,
  onOpenRemovePatientConfirmModal,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const successfulDocuments = documents.filter(doc => doc.status === 'success' && doc.extractedData);

  const groupedDocuments = successfulDocuments.reduce<GroupedDocuments>((acc, doc) => {
    const patientName = doc.extractedData?.patientName?.trim();
    const key = patientName || UI_TEXT.patientGroupHeader(null); 
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(doc);
    return acc;
  }, {});

  const patientGroups = Object.keys(groupedDocuments).sort((a, b) => {
    const unknownKey = UI_TEXT.patientGroupHeader(null);
    if (a === unknownKey) return 1; // Put "Paciente Não Identificado" last
    if (b === unknownKey) return -1;
    return a.localeCompare(b);
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const purpleGradientPrimary = "w-full sm:w-auto flex-grow text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full sm:w-auto flex-grow sm:flex-grow-0 text-purple-700 font-medium py-2.5 px-5 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  const smallPurpleGradientAction = "ml-2 flex-shrink-0 text-xs font-semibold py-1 px-2.5 rounded-md shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:saturate-50";
  const smallRedGradientDestructiveIcon = "ml-2 p-1.5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-rose-500 focus:ring-offset-white shadow-sm";


  if (successfulDocuments.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl text-center border border-gray-200">
        <Alert message={UI_TEXT.noSuccessfullyProcessedDocsForReview} type={AlertType.Info} />
        <button
          onClick={onGoBack} // This button should lead back to MaterialCorrection or DocManagement
          className={`mt-6 ${purpleGradientLight.replace("w-full ", "")}`}
        > 
          Voltar para Correção/Gerenciamento
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-indigo-600 mb-1 text-center"> 
        {UI_TEXT.reviewExtractedDataTitle}
      </h2>
      <p className="text-sm text-slate-500 text-center mb-6">Hospital: {hospitalName}</p>

      <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
        {patientGroups.map(groupKey => (
          <div key={groupKey} className="bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-100/70 rounded-t-lg cursor-pointer" onClick={() => toggleGroup(groupKey)}>
              <button
                
                className="flex-grow flex justify-between items-center text-left text-slate-700 focus:outline-none"
                aria-expanded={!!expandedGroups[groupKey]}
                aria-controls={`patient-docs-${groupKey.replace(/\s+/g, '-')}`}
              >
                <span className="font-semibold text-base sm:text-lg">{groupKey} ({groupedDocuments[groupKey].length} doc(s))</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" 
                     className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 text-slate-400 ${expandedGroups[groupKey] ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenRemovePatientConfirmModal(groupKey);}}
                title={UI_TEXT.removePatientGroupButton}
                className={smallRedGradientDestructiveIcon}
                aria-label={`${UI_TEXT.removePatientGroupButton} para ${groupKey}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.086 3.223.244L6.75 5.79m12.506 0l-2.828-2.828A2.25 2.25 0 0015.025 2.25H8.975a2.25 2.25 0 00-1.591.659L4.558 5.79m3.839 11.25H15.17" />
                </svg>
              </button>
            </div>

            {expandedGroups[groupKey] && (
              <div id={`patient-docs-${groupKey.replace(/\s+/g, '-')}`} className="border-t border-gray-200 p-3 sm:p-4 space-y-4">
                {groupedDocuments[groupKey].map(doc => (
                  <div key={doc.id} className="bg-white p-3 sm:p-4 rounded-md border border-gray-200 shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-indigo-700 truncate flex-grow" title={doc.fileName}> 
                         {doc.fileName}
                      </p>
                      <button
                        onClick={() => onEditDocument(doc.id)}
                        className={smallPurpleGradientAction}
                      > 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 mr-1 inline-block">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        {UI_TEXT.editButtonLabel}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-2">
                        <DetailItem label="Paciente" value={doc.extractedData?.patientName} />
                        <DetailItem label="Data Nasc." value={doc.extractedData?.patientDOB} />
                        <DetailItem label="Data Cirurgia" value={doc.extractedData?.surgeryDate} />
                        <DetailItem label="Médico" value={doc.extractedData?.doctorName} />
                        <div className="md:col-span-2">
                            <DetailItem label="Procedimento" value={doc.extractedData?.procedureName} />
                        </div>
                    </div>

                    {doc.extractedData?.materialsUsed && (
                        <MaterialsTable materials={doc.extractedData.materialsUsed} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 space-y-3 sm:space-y-0 sm:flex sm:space-x-4">
        <button
          onClick={onGoBack} // This will now lead to DATA_CORRECTION_AI_FEEDBACK
          className={purpleGradientLight}
        >
          Voltar para Correção de Materiais
        </button>
        <button
          onClick={onConfirmAndGenerateReport}
          disabled={successfulDocuments.length === 0}
          className={purpleGradientPrimary}
        > 
          {UI_TEXT.confirmAndGenerateReportButton}
        </button>
      </div>
    </div>
  );
};
