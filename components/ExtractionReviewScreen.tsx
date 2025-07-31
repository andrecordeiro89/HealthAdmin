import React, { useState } from 'react';
import { ProcessedDocumentEntry, MaterialUsed, ReplenishmentMaterial } from '../types';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, inputBase, buttonSize, cardLarge, cardBase, sectionGap } from './uiClasses';

interface ExtractionReviewScreenProps {
  documents: ProcessedDocumentEntry[];
  onEditDocument: (docId: string) => void;
  onConfirmAndGenerateReport: () => void;
  onGoBack: () => void;
  hospitalName: string;
  onOpenRemovePatientConfirmModal: (groupKey: string) => void;
}

interface GroupedDocuments {
  [patientNameOrGenericKey: string]: ProcessedDocumentEntry[];
}

export const ExtractionReviewScreen: React.FC<ExtractionReviewScreenProps> = ({
  documents,
  onEditDocument,
  onConfirmAndGenerateReport,
  onGoBack,
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
    if (a === unknownKey) return 1;
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

  if (successfulDocs.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl text-center border border-gray-200">
        <Alert message={UI_TEXT.noSuccessfullyProcessedDocsForReview} type={AlertType.Info} />
        <button
          onClick={onGoBack}
          className={`mt-6 ${buttonLight.replace("w-full ", "")}`}
        >
          Voltar para Correção/Gerenciamento
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-white via-indigo-50 to-purple-50 px-4 py-8">
      {/* Single Premium Card Container */}
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden" style={{ boxShadow: '0 6px 32px 0 rgba(80,60,180,0.10), 0 1.5px 6px 0 rgba(80,60,180,0.08)' }}>

        {/* Card Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Side - Title and Stats */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  Materiais Utilizados
                </h1>
                <p className="text-indigo-100 text-sm font-medium">
                  Visualize e exporte o consumo de materiais do lote processado
                </p>
              </div>

              {/* Inline Stats */}
              <div className="hidden lg:flex items-center gap-3 ml-6">
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/30">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full" />
                  <span className="text-sm font-semibold text-white">{materialsToShow.length} normais</span>
                </div>

                {contaminatedToShow.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/30 rounded-lg px-3 py-2 backdrop-blur-sm border border-red-300/50">
                    <div className="w-2 h-2 bg-red-200 rounded-full" />
                    <span className="text-sm font-semibold text-white">{contaminatedToShow.length} contaminados</span>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-semibold text-white">{hospitalName}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onGoBack}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-white/30 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>

              <button
                onClick={onConfirmAndGenerateReport}
                disabled={materialsToShow.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gerar PDF
              </button>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="lg:hidden flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/30">
              <div className="w-2 h-2 bg-emerald-300 rounded-full" />
              <span className="text-sm font-semibold text-white">{materialsToShow.length} normais</span>
            </div>

            {contaminatedToShow.length > 0 && (
              <div className="flex items-center gap-2 bg-red-500/30 rounded-lg px-3 py-2 backdrop-blur-sm border border-red-300/50">
                <div className="w-2 h-2 bg-red-200 rounded-full" />
                <span className="text-sm font-semibold text-white">{contaminatedToShow.length} contaminados</span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-semibold text-white">{hospitalName}</span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar material, código, lote..."
                  className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm font-medium bg-white shadow-sm"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-white rounded-lg p-1 border border-indigo-200 shadow-sm">
                <button className="px-4 py-2 rounded-md font-semibold text-indigo-700 bg-indigo-100 shadow-sm transition-all">
                  Todos ({materialsToShow.length + contaminatedToShow.length})
                </button>
                <button className={`px-4 py-2 rounded-md font-semibold transition-all ${contaminatedToShow.length > 0
                    ? 'text-red-700 hover:bg-red-50'
                    : 'text-slate-400 cursor-not-allowed'
                  }`}>
                  Contaminados ({contaminatedToShow.length})
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Materiais Contaminados (se houver) */}
          {contaminatedToShow.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Materiais Contaminados
              </h3>
              <div className="overflow-x-auto rounded-xl shadow-lg border-2 border-red-200 bg-white">
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
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
              <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-indigo-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 01-8 0M12 3v4m0 0a4 4 0 01-4 4m4-4a4 4 0 004 4' />
              </svg>
              Materiais Utilizados
            </h3>
            <div className="overflow-x-auto rounded-xl shadow-lg border-2 border-indigo-100 bg-white">
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

          {/* Pagination and Summary */}
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600 font-medium">
                  Mostrando <span className="font-bold text-indigo-700">{materialsToShow.length}</span> materiais normais
                  {contaminatedToShow.length > 0 && (
                    <span> e <span className="font-bold text-red-700">{contaminatedToShow.length}</span> contaminados</span>
                  )}
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 font-semibold shadow-sm border border-indigo-200">1</button>
                <button className="px-3 py-2 rounded-lg bg-white text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors">2</button>
                <button className="px-3 py-2 rounded-lg bg-white text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors">3</button>
                <span className="px-2 text-slate-400">...</span>
                <button className="px-3 py-2 rounded-lg bg-white text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors">10</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};