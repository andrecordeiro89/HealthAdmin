import React, { useState } from 'react';
import { ProcessedDocumentEntry, MaterialUsed, ReplenishmentMaterial } from '../types'; // Added MaterialUsed and ReplenishmentMaterial
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, inputBase, buttonSize, cardLarge, cardBase, sectionGap } from './uiClasses';

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
      <h4 className="text-lg font-semibold text-indigo-600 mb-1">Materiais Utilizados:</h4> 
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

// Novo componente para tabela de materiais contaminados
const ContaminatedMaterialsTable: React.FC<{ contaminatedToShow: ReplenishmentMaterial[] }> = ({ contaminatedToShow }) => (
  <div className="w-full max-w-5xl mx-auto overflow-x-auto mb-8">
    <h3 className="text-2xl font-extrabold text-red-700 px-4 pt-4 pb-2 flex items-center gap-2 tracking-tight">
      <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
      Materiais Contaminados
    </h3>
    <div className="rounded-2xl shadow-xl border-2 border-red-200 bg-white/90 overflow-hidden animate-fade-in">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
            <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Descrição do Material</th>
            <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Código</th>
            <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Lote</th>
            <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Observação</th>
            <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Qtd. Consumida</th>
            <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Qtd. para Reposição</th>
            <th className="px-4 py-3 font-bold text-red-700 uppercase tracking-wide">Obs. Sistema</th>
          </tr>
        </thead>
        <tbody>
          {contaminatedToShow.map((mat, idx) => (
            <tr key={idx} className={
              `transition-all duration-150 ${idx % 2 === 0 ? 'bg-white/80' : 'bg-red-50/60'} hover:bg-red-100/60`}
            >
              <td className="px-4 py-2 border-r border-red-100 font-semibold text-red-800 align-top">{mat.description}</td>
              <td className="px-4 py-2 border-r border-red-100 text-red-700 align-top">{mat.code || <span className="italic text-red-400">-</span>}</td>
              <td className="px-4 py-2 border-r border-red-100 text-red-700 align-top">{mat.lotNumber || <span className="italic text-red-400">-</span>}</td>
              <td className="px-4 py-2 border-r border-red-100 text-red-600 align-top max-w-[200px] truncate" title={mat.observation || ''}>{mat.observation || <span className="italic text-red-400">-</span>}</td>
              <td className="px-4 py-2 border-r border-red-100 text-center text-red-700 font-bold align-top">{mat.totalConsumedQuantity}</td>
              <td className="px-4 py-2 border-r border-red-100 text-center text-red-700 font-bold align-top">{mat.replenishQuantity}</td>
              <td className="px-4 py-2 text-xs text-red-600 align-top max-w-[180px] truncate" title={mat.replenishmentSuggestionNote || ''}>{mat.replenishmentSuggestionNote || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Novo componente para tabela de materiais não contaminados
const MaterialsTablePremium: React.FC<{ materialsToShow: ReplenishmentMaterial[] }> = ({ materialsToShow }) => (
  <div className="w-full max-w-5xl mx-auto overflow-x-auto mb-8">
    <h3 className="text-2xl font-extrabold text-indigo-700 px-4 pt-4 pb-2 flex items-center gap-2 tracking-tight">
      <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 text-indigo-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 01-8 0M12 3v4m0 0a4 4 0 01-4 4m4-4a4 4 0 004 4' /></svg>
      Materiais Utilizados
    </h3>
    <div className="rounded-2xl shadow-xl border-2 border-indigo-100 bg-white/90 overflow-hidden animate-fade-in">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-50 to-white border-b-2 border-indigo-200">
            <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Descrição</th>
            <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Código</th>
            <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Lote</th>
            <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide text-center">Qtd. Consumida</th>
            <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide text-center">Qtd. para Reposição</th>
            <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Observação</th>
            <th className="px-4 py-3 font-bold text-indigo-700 uppercase tracking-wide">Obs. Sistema</th>
          </tr>
        </thead>
        <tbody>
          {materialsToShow.length === 0 && (
            <tr><td colSpan={7} className="text-center text-slate-400 py-6">Nenhum material processado para este lote.</td></tr>
          )}
          {materialsToShow.map((mat, idx) => (
            <tr key={idx} className={
              `transition-all duration-150 ${idx % 2 === 0 ? 'bg-white/80' : 'bg-indigo-50/60'} hover:bg-indigo-100/60`}
            >
              <td className="px-4 py-2 border-r border-indigo-100 font-semibold text-indigo-800 align-top">{mat.description}</td>
              <td className="px-4 py-2 border-r border-indigo-100 text-indigo-700 align-top">{mat.code || <span className="italic text-indigo-400">-</span>}</td>
              <td className="px-4 py-2 border-r border-indigo-100 text-indigo-700 align-top">{mat.lotNumber || <span className="italic text-indigo-400">-</span>}</td>
              <td className="px-4 py-2 border-r border-indigo-100 text-center text-indigo-700 font-bold align-top">{mat.totalConsumedQuantity}</td>
              <td className="px-4 py-2 border-r border-indigo-100 text-center text-indigo-700 font-bold align-top">{mat.replenishQuantity}</td>
              <td className="px-4 py-2 border-r border-indigo-100 text-indigo-600 align-top max-w-[200px] truncate" title={mat.observation || ''}>{mat.observation || <span className="italic text-indigo-400">-</span>}</td>
              <td className="px-4 py-2 text-xs text-indigo-600 align-top max-w-[180px] truncate" title={mat.replenishmentSuggestionNote || ''}>{mat.replenishmentSuggestionNote || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ExtractionReviewScreen: React.FC<ExtractionReviewScreenProps> = ({
  documents,
  onEditDocument,
  onConfirmAndGenerateReport,
  onGoBack, // This onGoBack is expected to lead to MaterialCorrectionScreen
  hospitalName,
  onOpenRemovePatientConfirmModal,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const successfulDocs = documents.filter(doc => doc.status === 'success' && doc.extractedData);

  const groupedDocuments = successfulDocs.reduce<GroupedDocuments>((acc, doc) => {
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

  // Agrupar materiais de todos os documentos processados
  const allMaterials: ReplenishmentMaterial[] = [];
  successfulDocs.forEach(doc => {
    doc.extractedData?.materialsUsed.forEach(mat => {
      allMaterials.push({
        description: mat.description,
        code: mat.code,
        lotNumber: mat.lotNumber,
        observation: mat.observation,
        quantity: mat.quantity,
        totalConsumedQuantity: mat.quantity,
        replenishQuantity: mat.quantity,
        sourceDocumentIds: [doc.id],
        contaminated: mat.contaminated,
        replenishmentSuggestionNote: mat.code ? undefined : 'Sistema: Material não cadastrado na base.'
      });
    });
  });

  // Separar contaminados e não contaminados
  const contaminatedMaterials = allMaterials.filter(mat => mat.contaminated);
  const nonContaminatedMaterials = allMaterials.filter(mat => !mat.contaminated);

  // Agrupar por material (descrição + código + lote)
  function groupMaterials(materials: ReplenishmentMaterial[]) {
    const materialMap = new Map<string, ReplenishmentMaterial>();
    materials.forEach(mat => {
      const key = `${mat.description.toLowerCase()}|${mat.code || ''}|${mat.lotNumber || ''}`;
      if (materialMap.has(key)) {
        const existing = materialMap.get(key)!;
        existing.totalConsumedQuantity += mat.quantity;
        existing.replenishQuantity += mat.quantity;
        if (mat.observation && (!existing.observation || !existing.observation.includes(mat.observation))) {
          existing.observation = existing.observation ? `${existing.observation} | ${mat.observation}` : mat.observation;
        }
        existing.sourceDocumentIds.push(...mat.sourceDocumentIds);
      } else {
        materialMap.set(key, { ...mat });
      }
    });
    return Array.from(materialMap.values());
  }
  const materialsToShow = groupMaterials(nonContaminatedMaterials);
  const contaminatedToShow = groupMaterials(contaminatedMaterials);

  // Modal de detalhes dos documentos
  const [showDocsModal, setShowDocsModal] = useState(false);

  if (successfulDocs.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl text-center border border-gray-200">
        <Alert message={UI_TEXT.noSuccessfullyProcessedDocsForReview} type={AlertType.Info} />
        <button
          onClick={onGoBack} // This button should lead back to MaterialCorrection or DocManagement
          className={`mt-6 ${buttonLight.replace("w-full ", "")}`}
        > 
          Voltar para Correção/Gerenciamento
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-white via-indigo-50 to-purple-50 pt-8 px-2">
      {/* Cabeçalho simulando PDF (sem logo) */}
      <div className="w-full max-w-3xl mx-auto text-center mb-8 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight mb-2 text-center">{hospitalName}</h2>
        <p className="text-lg font-normal text-slate-500 mb-4 text-center">Relatório de Consumo de Materiais</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-600 text-sm mb-1">
          <span><b>Data:</b> {new Date().toLocaleDateString()}</span>
          <span>|</span>
          <span><b>Lote:</b> {successfulDocs.length} documento(s)</span>
        </div>
      </div>
      {/* Card resumo do lote */}
      <div className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between p-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-semibold text-indigo-700">{hospitalName}</span>
          <span className="text-slate-400 text-sm">|</span>
          <span className="text-slate-600">{new Date().toLocaleDateString()}</span>
          <span className="text-slate-400 text-sm">|</span>
          <span className="text-slate-600">{successfulDocs.length} documento(s)</span>
        </div>
        <button
          className="ml-0 sm:ml-4 mt-3 sm:mt-0 px-4 py-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-200 text-purple-700 font-medium shadow border border-purple-200 hover:from-purple-200 hover:to-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
          onClick={() => setShowDocsModal(true)}
        >
          Ver Detalhes dos Documentos
        </button>
      </div>
      {/* Tabela de Materiais Contaminados */}
      {contaminatedToShow.length > 0 && (
        <ContaminatedMaterialsTable contaminatedToShow={contaminatedToShow} />
      )}
      {/* Tabela de Materiais Utilizados */}
      <MaterialsTablePremium materialsToShow={materialsToShow} />
      {/* Botões de ação centralizados */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-4 justify-center items-center mt-2 mb-8">
        <button
          onClick={onGoBack}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-200 text-purple-700 font-medium shadow border border-purple-200 hover:from-purple-200 hover:to-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
        >
          Voltar para Correção
        </button>
        <button
          onClick={onConfirmAndGenerateReport}
          disabled={materialsToShow.length === 0}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Gerar Relatório PDF
        </button>
      </div>
      {/* Modal de detalhes dos documentos */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xl font-bold"
              onClick={() => setShowDocsModal(false)}
              title="Fechar"
            >×</button>
            <h3 className="text-lg font-semibold text-indigo-700 mb-4">Detalhes dos Documentos Processados</h3>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
              {successfulDocs.map(doc => (
                <div key={doc.id} className="py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-700">{doc.fileName}</span>
                    <span className="text-xs text-green-700 ml-2">Sucesso</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-1">
                    <span><b>Paciente:</b> {doc.extractedData?.patientName || '-'}</span>
                    <span><b>Data Cirurgia:</b> {doc.extractedData?.surgeryDate || '-'}</span>
                    <span><b>Médico:</b> {doc.extractedData?.doctorName || '-'}</span>
                  </div>
                  <button
                    onClick={() => { setShowDocsModal(false); onEditDocument(doc.id); }}
                    className="mt-1 px-3 py-1 rounded bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold shadow hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >Editar Dados</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
