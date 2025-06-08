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
    <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-white via-indigo-50 to-purple-50 px-2 py-8">
      {/* Cabeçalho premium */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="title-premium">Materiais Utilizados</h1>
          <p className="text-slate-500 text-base mt-1">Visualize e exporte o consumo de materiais do lote processado.</p>
        </div>
      </div>

      {/* Barra de busca e filtros (placeholder, pode ser implementado depois) */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Buscar material, código, lote..."
          className="w-full sm:w-96 px-4 py-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 text-base shadow-sm bg-white"
          // onChange={...} // implementar busca se desejar
        />
        {/* Filtros avançados podem ser adicionados aqui */}
      </div>

      {/* Abas para alternar entre todos e contaminados */}
      <div className="w-full max-w-6xl flex gap-2 mb-2">
        <button className="px-4 py-2 rounded-t-lg font-semibold text-indigo-700 bg-indigo-50 border-b-2 border-indigo-600">Todos</button>
        <button className={`px-4 py-2 rounded-t-lg font-semibold ${contaminatedToShow.length > 0 ? 'text-red-700 bg-red-50 border-b-2 border-red-500' : 'text-slate-400 bg-slate-50 border-b-2 border-slate-200'}`}>Contaminados</button>
      </div>

      {/* Tabela de Materiais Contaminados (se houver) */}
      {contaminatedToShow.length > 0 && (
        <div className="w-full max-w-6xl mb-8 animate-fade-in">
          <h3 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
            <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
            Materiais Contaminados
          </h3>
          <div className="overflow-x-auto rounded-2xl shadow-xl border-2 border-red-200 bg-white/90">
            {/* Tabela contaminados */}
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
                  <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Descrição</th>
                  <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Código</th>
                  <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Lote</th>
                  <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Qtd. Consumida</th>
                  <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Qtd. Repor</th>
                  <th className="px-4 py-3 font-bold text-red-700 border-r border-red-100 uppercase tracking-wide">Observação</th>
                  <th className="px-4 py-3 font-bold text-red-700 uppercase tracking-wide">Obs. Sistema</th>
                </tr>
              </thead>
              <tbody>
                {contaminatedToShow.map((mat, idx) => (
                  <tr key={idx} className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white/80' : 'bg-red-50/60'} hover:bg-red-100/60`}>
                    <td className="px-4 py-2 border-r border-red-100 font-semibold text-red-800 align-top">{mat.description}</td>
                    <td className="px-4 py-2 border-r border-red-100 text-red-700 align-top">{mat.code || <span className="italic text-red-400">-</span>}</td>
                    <td className="px-4 py-2 border-r border-red-100 text-red-700 align-top">{mat.lotNumber || <span className="italic text-red-400">-</span>}</td>
                    <td className="px-4 py-2 border-r border-red-100 text-center text-red-700 font-bold align-top">{mat.totalConsumedQuantity}</td>
                    <td className="px-4 py-2 border-r border-red-100 text-center text-red-700 font-bold align-top">{mat.replenishQuantity}</td>
                    <td className="px-4 py-2 border-r border-red-100 text-red-600 align-top max-w-[200px] truncate" title={mat.observation || ''}>{mat.observation || <span className="italic text-red-400">-</span>}</td>
                    <td className="px-4 py-2 text-xs text-red-600 align-top max-w-[180px] truncate" title={mat.replenishmentSuggestionNote || ''}>{mat.replenishmentSuggestionNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabela de Materiais Utilizados */}
      <div className="w-full max-w-6xl mb-8 animate-fade-in">
        <h3 className="text-xl font-bold text-indigo-700 mb-2 flex items-center gap-2">
          <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-indigo-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 01-8 0M12 3v4m0 0a4 4 0 01-4 4m4-4a4 4 0 004 4' /></svg>
          Materiais Utilizados
        </h3>
        <div className="overflow-x-auto rounded-2xl shadow-xl border-2 border-indigo-100 bg-white/90">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-white border-b-2 border-indigo-200">
                <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Descrição</th>
                <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Lote</th>
                <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide text-center">Qtd. Consumida</th>
                <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide text-center">Qtd. Repor</th>
                <th className="px-4 py-3 font-bold text-indigo-700 border-r border-indigo-100 uppercase tracking-wide">Observação</th>
                <th className="px-4 py-3 font-bold text-indigo-700 uppercase tracking-wide">Obs. Sistema</th>
              </tr>
            </thead>
            <tbody>
              {materialsToShow.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-6">Nenhum material processado para este lote.</td></tr>
              )}
              {materialsToShow.map((mat, idx) => (
                <tr key={idx} className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white/80' : 'bg-indigo-50/60'} hover:bg-indigo-100/60`}>
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

      {/* Paginação (placeholder, pode ser implementada depois) */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div className="text-sm text-slate-500">Mostrando {materialsToShow.length} materiais</div>
        {/* Paginação real pode ser implementada aqui */}
        <div className="flex gap-1">
          <button className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 font-semibold">1</button>
          <button className="px-3 py-1 rounded bg-white text-slate-400 border border-slate-200">2</button>
          <button className="px-3 py-1 rounded bg-white text-slate-400 border border-slate-200">3</button>
          <span className="px-2">...</span>
          <button className="px-3 py-1 rounded bg-white text-slate-400 border border-slate-200">10</button>
        </div>
      </div>

      {/* Botões de ação alinhados à direita */}
      <div className="w-full max-w-6xl flex justify-end gap-2">
        <button
          onClick={onGoBack}
          className="px-6 py-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-200 text-purple-700 font-medium shadow border border-purple-200 hover:from-purple-200 hover:to-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
        >
          Voltar para Correção
        </button>
        <button
          className="px-6 py-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold shadow border-2 border-transparent hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          onClick={onConfirmAndGenerateReport}
          disabled={materialsToShow.length === 0}
        >
          Gerar Relatório PDF
        </button>
      </div>
    </div>
  );
};
