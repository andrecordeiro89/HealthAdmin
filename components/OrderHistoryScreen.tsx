import React, { useState } from 'react';
import { ConsolidatedOrderData, HospitalOption, ReplenishmentMaterial, GlobalMaterialConsumptionRow } from '../types';
import { UI_TEXT } from '../constants';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, inputBase, buttonSize, cardLarge, sectionGap } from './uiClasses';
import { Header } from './Header';
import { generateGlobalMaterialConsumptionPdf } from '../services/pdfService';
import { FaDownload, FaRegClock } from 'react-icons/fa';

interface OrderHistoryScreenProps {
  history: ConsolidatedOrderData[];
  hospitalOptions: HospitalOption[]; // This will be the dynamic list from App state
  onReprintPdf: (order: ConsolidatedOrderData) => Promise<void>;
  onBack: () => void;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ 
    history, 
    hospitalOptions, 
    onReprintPdf, 
    onBack 
}) => {
  const [selectedHospital, setSelectedHospital] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportRows, setReportRows] = useState<GlobalMaterialConsumptionRow[]>([]);
  const [localStorageExpiry, setLocalStorageExpiry] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Filtro por intervalo de datas e unidade
  const filteredHistory = history.filter(order => {
    const hospitalMatch = selectedHospital ? order.hospital === selectedHospital : true;
    let dateMatch = true;
    if (startDate) dateMatch = order.orderDate >= startDate;
    if (endDate) dateMatch = dateMatch && order.orderDate <= endDate;
    return hospitalMatch && dateMatch;
  });

  // getHospitalName agora usa hospitalOptions
  const getHospitalName = (hospitalId: string): string => {
    const found = hospitalOptions.find(h => h.id === hospitalId);
    return found?.name || hospitalId;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString.replace(/-/g, '/'));
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
  };

  // Lógica para gerar relatório global filtrado
  const handleGenerateReport = () => {
    const consumptionDataMap = new Map<string, GlobalMaterialConsumptionRow>();
    filteredHistory.forEach(order => {
      const hospitalDetails = hospitalOptions.find(h => h.id === order.hospital);
      const hospitalName = hospitalDetails?.name || order.hospital;
      order.materialsToReplenish.forEach(material => {
        const key = `${material.description.toLowerCase()}_${(material.code || 'N/A').toLowerCase()}_${hospitalName.toLowerCase()}`;
        if (consumptionDataMap.has(key)) {
          const existingEntry = consumptionDataMap.get(key)!;
          existingEntry.consumedQuantity += material.totalConsumedQuantity;
        } else {
          consumptionDataMap.set(key, {
            materialDescription: material.description,
            materialCode: material.code,
            hospitalName: hospitalName,
            consumedQuantity: material.totalConsumedQuantity,
          });
        }
      });
    });
    setReportRows(Array.from(consumptionDataMap.values()));
    setShowReport(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Buscar data de expiração do localStorage (exemplo: chave 'expiry')
  React.useEffect(() => {
    const expiry = localStorage.getItem('expiry');
    if (expiry) setLocalStorageExpiry(formatDate(expiry));
  }, []);

  // Função para exportar PDF premium do relatório global
  const handleExportPdf = async () => {
    const now = new Date();
    const isoString = now.toISOString();
    let periodText: string | undefined = undefined;
    if (startDate && endDate) {
      periodText = `Período: ${formatDate(startDate)} a ${formatDate(endDate)}`;
    } else if (startDate) {
      periodText = `Período: A partir de ${formatDate(startDate)}`;
    } else if (endDate) {
      periodText = `Período: Até ${formatDate(endDate)}`;
    }
    await generateGlobalMaterialConsumptionPdf(reportRows, isoString, periodText);
  };

  const purpleGradientLight = "text-purple-700 font-medium py-2 px-4 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  const smallPurpleGradientAction = "text-white font-semibold text-xs py-1.5 px-3 rounded-md shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:saturate-50";

  return (
    <>
      <style>{`
        html, body { margin: 0 !important; padding: 0 !important; }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: rgba(99, 102, 241, 0.1); border-radius: 2px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 2px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
      `}</style>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-white via-indigo-50 to-purple-50 text-slate-700 m-0 p-0">
        {/* Sidebar Premium */}
        <div className="w-80 min-h-screen bg-gradient-to-b from-white/95 via-indigo-50/90 to-purple-50/95 backdrop-blur-sm border-r border-indigo-200/60 shadow-2xl flex flex-col" style={{boxShadow: '4px 0 24px 0 rgba(80,60,180,0.12)'}}>
          {/* Header do Sidebar */}
          <div className="p-6 border-b border-indigo-200/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaRegClock className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-800 leading-tight">Histórico</h2>
                <p className="text-xs text-slate-600 font-medium">Pedidos & Relatórios</p>
              </div>
            </div>
            
            {/* Estatísticas Compactas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-indigo-100/80 to-white/90 rounded-xl p-3 border border-indigo-200/40">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Total</div>
                <div className="text-lg font-bold text-indigo-800">{filteredHistory.length}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-100/80 to-white/90 rounded-xl p-3 border border-purple-200/40">
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Hospitais</div>
                <div className="text-lg font-bold text-purple-800">{new Set(filteredHistory.map(h => h.hospital)).size}</div>
              </div>
            </div>
          </div>

          {/* Filtros Compactos */}
          <div className="p-6 flex-1 sidebar-scrollbar overflow-y-auto">
            <div className="space-y-5">
              {/* Filtro Hospital */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Hospital</label>
                <select 
                  value={selectedHospital} 
                  onChange={e => setSelectedHospital(e.target.value)}
                  className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm bg-white/90 transition outline-none shadow-sm"
                >
                  <option value="">Todos os hospitais</option>
                  {hospitalOptions.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Filtros de Data */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Data Inicial</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm bg-white/90 transition outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Data Final</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-lg border-2 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm bg-white/90 transition outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Divisor */}
              <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-6" />

              {/* Ações Rápidas */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Ações</h3>
                
                <button 
                  onClick={handleGenerateReport} 
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg transition-all duration-200 text-sm"
                >
                  Gerar Relatório
                </button>

                {showReport && (
                  <button 
                    onClick={handleExportPdf} 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
                  >
                    <FaDownload className="w-3 h-3" />
                    Exportar PDF
                  </button>
                )}

                <button 
                  onClick={onBack} 
                  className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg transition-all duration-200 text-sm"
                >
                  Voltar
                </button>
              </div>

              {/* Aviso de Expiração Compacto */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mt-6">
                <div className="flex items-start gap-3">
                  <FaRegClock className="text-amber-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-800 mb-1">Expiração Automática</div>
                    <div className="text-xs text-amber-700 leading-relaxed">
                      Dados removidos automaticamente após <strong>10 dias</strong>. Exporte relatórios importantes.
                    </div>
                    {localStorageExpiry && (
                      <div className="text-xs text-amber-600 font-semibold mt-2">
                        Expira em: {localStorageExpiry}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Área Principal */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header Principal */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-200/60 px-8 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-indigo-800 mb-1">HealthAdmin</h1>
                <p className="text-sm text-slate-600 font-medium">
                  {filteredHistory.length} pedido{filteredHistory.length !== 1 ? 's' : ''} encontrado{filteredHistory.length !== 1 ? 's' : ''}
                  {selectedHospital && ` • ${hospitalOptions.find(h => h.id === selectedHospital)?.name}`}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 p-8 overflow-auto">
            {/* Tabela de Relatório Global */}
            {showReport && (
              <div className="mb-8">
                <div className="bg-white/90 rounded-2xl shadow-xl border border-indigo-100 overflow-hidden" style={{boxShadow: '0 4px 24px 0 rgba(80,60,180,0.08)'}}>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">Relatório de Consumo Global</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[50vh]">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gradient-to-r from-indigo-50 to-white border-b-2 border-indigo-200 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">Unidade</th>
                          <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">Material</th>
                          <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">Código</th>
                          <th className="px-6 py-3 text-center font-bold text-indigo-700 uppercase tracking-wide">Qtd. Consumida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.length === 0 && (
                          <tr><td colSpan={4} className="text-center text-slate-400 py-8 font-semibold">Nenhum material encontrado para o período selecionado.</td></tr>
                        )}
                        {reportRows.map((row, idx) => (
                          <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'} hover:bg-indigo-100/60 transition-colors duration-150`}>
                            <td className="px-6 py-3 font-semibold text-indigo-800">{row.hospitalName}</td>
                            <td className="px-6 py-3 text-indigo-700">{row.materialDescription}</td>
                            <td className="px-6 py-3 text-indigo-700">{row.materialCode || '-'}</td>
                            <td className="px-6 py-3 text-center text-indigo-700 font-bold">{row.consumedQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela Principal de Histórico */}
            <div className="bg-white/90 rounded-2xl shadow-xl border border-indigo-100 overflow-hidden" style={{boxShadow: '0 4px 24px 0 rgba(80,60,180,0.08)'}}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Histórico de Pedidos</h3>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-indigo-50 to-white border-b-2 border-indigo-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">ID do Pedido</th>
                      <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">Hospital</th>
                      <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">Data</th>
                      <th className="px-6 py-3 text-left font-bold text-indigo-700 uppercase tracking-wide">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-slate-400 py-8 font-semibold">Nenhum pedido encontrado.</td></tr>
                    )}
                    {filteredHistory.map((order, idx) => (
                      <tr key={order.orderId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'} hover:bg-indigo-100/60 transition-colors duration-150`}>
                        <td className="px-6 py-3 font-mono text-indigo-800 font-semibold">{order.orderId}</td>
                        <td className="px-6 py-3 text-indigo-700">{hospitalOptions.find(h => h.id === order.hospital)?.name || order.hospital}</td>
                        <td className="px-6 py-3 text-indigo-700">{order.orderDate}</td>
                        <td className="px-6 py-3">
                          <button 
                            onClick={() => onReprintPdf(order)} 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-1.5 px-4 rounded-lg shadow-sm transition-all duration-200 text-xs"
                            title="Reimprimir PDF"
                          >
                            Reimprimir PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Toast de feedback */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 bg-white border border-indigo-200 shadow-xl rounded-xl px-6 py-3 text-indigo-700 font-semibold text-sm animate-fade-in">
            ✅ Relatório gerado com sucesso!
          </div>
        )}
      </div>
    </>
  );
};
