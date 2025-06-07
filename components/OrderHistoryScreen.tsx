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
      `}</style>
      <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-white via-indigo-50 to-purple-50 text-slate-700 m-0 p-0">
        {/* Header premium com logotipo e linha sombreada, absolutamente colado ao topo */}
        <div className="w-full flex flex-col items-center select-none m-0 p-0" style={{marginTop: 0, paddingTop: 0}}>
          <div className="flex flex-row items-center justify-center mb-2 mt-0" style={{marginTop: 0}}>
            <span className="text-2xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight" style={{letterSpacing: '0.01em'}}>
              HealthAdmin
            </span>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
              <polyline points="2,12 11,12 15,21 21,3 27,18 32,12 46,12" stroke="#4F46E5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Linha premium do header */}
          <div className="w-full flex justify-center items-center">
            <div className="w-full max-w-screen-2xl flex items-center">
              <div className="flex-1">
                <div className="w-full h-[2.5px] rounded-full shadow-md" style={{background: 'linear-gradient(90deg, #fff 0%, #e0e7ff 40%, #ede9fe 60%, #fff 100%)', boxShadow: '0 2px 8px 0 rgba(80,60,180,0.07)'}} />
              </div>
            </div>
          </div>
        </div>
        {/* Card premium centralizado */}
        <div className="flex flex-1 flex-col items-center justify-center w-full px-2 pb-12">
          {/* Aviso premium de expiração do histórico */}
          <div className="w-full max-w-3xl mb-6">
            <div className="flex flex-row items-center gap-3 bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-2 border-indigo-200 rounded-2xl shadow-lg px-6 py-4">
              <FaRegClock className="text-indigo-500 w-7 h-7" />
              <div className="flex-1">
                <span className="block text-base sm:text-lg font-bold text-indigo-800 mb-1">Atenção: Expiração Automática do Histórico</span>
                <span className="block text-sm sm:text-base text-slate-600 font-medium">Por segurança e performance, os dados do seu histórico de consumo ficam disponíveis por até <b>10 dias</b> após o registro. Após esse período, eles serão removidos automaticamente do sistema. Recomendamos exportar os relatórios importantes antes do vencimento.</span>
              </div>
            </div>
          </div>
          <div className="w-full max-w-3xl bg-white/90 rounded-3xl shadow-2xl border border-indigo-100 p-8 flex flex-col gap-8 items-center" style={{boxShadow: '0 6px 32px 0 rgba(80,60,180,0.10), 0 1.5px 6px 0 rgba(80,60,180,0.08)'}}>
            {/* Filtros premium no topo */}
            <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl items-center justify-center">
                <div className="flex flex-col items-start w-full sm:w-auto">
                  <label htmlFor="hospital-select" className="text-xs font-semibold text-slate-700 mb-1">Hospital:</label>
                  <select id="hospital-select" aria-label="Selecionar hospital" value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}
                    className="rounded-xl shadow-md border-2 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 px-4 py-2 text-base bg-white transition min-w-[160px] outline-none">
                    <option value="">Todos</option>
                    {hospitalOptions.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-start w-full sm:w-auto">
                  <label htmlFor="start-date" className="text-xs font-semibold text-slate-700 mb-1">Data Inicial:</label>
                  <input id="start-date" aria-label="Data inicial" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="rounded-xl shadow-md border-2 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 px-4 py-2 text-base bg-white transition min-w-[130px] outline-none" />
                </div>
                <div className="flex flex-col items-start w-full sm:w-auto">
                  <label htmlFor="end-date" className="text-xs font-semibold text-slate-700 mb-1">Data Final:</label>
                  <input id="end-date" aria-label="Data final" type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="rounded-xl shadow-md border-2 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 px-4 py-2 text-base bg-white transition min-w-[130px] outline-none" />
                </div>
              </div>
            </div>
            {/* Divisor visual premium */}
            <div className="w-full h-[2px] bg-gradient-to-r from-indigo-50 via-indigo-100 to-purple-50 rounded-full shadow mb-4" />
            {/* Tabela premium de relatório */}
            {showReport && (
              <>
                <div className="w-full overflow-x-auto max-h-[60vh] mb-2 rounded-2xl border border-indigo-100 shadow-lg">
                  <table className="min-w-full text-sm text-left rounded-2xl overflow-hidden">
                    <thead className={tableHeader + " bg-gradient-to-r from-indigo-50 to-white border-b-2 border-indigo-200 sticky top-0 z-10"}>
                      <tr>
                        <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>Unidade</th>
                        <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>Material</th>
                        <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>Código</th>
                        <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide text-center"}>Qtd. Consumida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-slate-400 py-6 font-semibold">Nenhum material encontrado para o período selecionado.</td></tr>
                      )}
                      {reportRows.map((row, idx) => (
                        <tr key={idx} className={zebraRow + " transition-all duration-150 hover:bg-indigo-100/60 cursor-pointer"}>
                          <td className={tableCell + " font-semibold text-indigo-800 align-top"}>{row.hospitalName}</td>
                          <td className={tableCell + " text-indigo-700 align-top"}>{row.materialDescription}</td>
                          <td className={tableCell + " text-indigo-700 align-top"}>{row.materialCode || '-'}</td>
                          <td className={tableCell + " text-center text-indigo-700 font-bold align-top"}>{row.consumedQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* Tabela de pedidos históricos padrão */}
            <div className="w-full overflow-x-auto max-h-[60vh] rounded-2xl border border-indigo-100 shadow-lg mb-4">
              <table className="min-w-full text-sm text-left rounded-2xl overflow-hidden">
                <thead className={tableHeader + " bg-gradient-to-r from-indigo-50 to-white border-b-2 border-indigo-200"}>
                  <tr>
                    <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>ID do Pedido</th>
                    <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>Hospital</th>
                    <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>Data</th>
                    <th className={tableCell + " font-bold text-indigo-700 uppercase tracking-wide"}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((order, idx) => (
                    <tr key={order.orderId} className={zebraRow + " transition-all duration-150 hover:bg-indigo-50/60"}>
                      <td className={tableCell}>{order.orderId}</td>
                      <td className={tableCell}>{hospitalOptions.find(h => h.id === order.hospital)?.name || order.hospital}</td>
                      <td className={tableCell}>{order.orderDate}</td>
                      <td className={tableCell}>
                        <button onClick={() => onReprintPdf(order)} className={buttonLight + " " + buttonSize + " min-w-[120px]"} title="Reimprimir PDF">Reimprimir PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Divisor visual premium */}
            <div className="w-full h-[2px] bg-gradient-to-r from-indigo-50 via-indigo-100 to-purple-50 rounded-full shadow mb-4" />
            {/* Botões centralizados na parte de baixo do card */}
            <div className="w-full flex flex-row items-center justify-center gap-4 mt-2">
              <button onClick={onBack} className={buttonPrimary + " " + buttonSize + " min-w-[120px]"} aria-label="Voltar">Voltar</button>
              <button onClick={handleGenerateReport} className={purpleGradientLight + " min-w-[220px] text-base py-3 px-8"} aria-label="Gerar relatório global do período">
                Gerar Relatório Global do Período
              </button>
              {showReport && (
                <button onClick={handleExportPdf} className="flex flex-row items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg shadow bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 ease-in-out uppercase min-w-[120px]" aria-label="Exportar PDF do período">
                  <FaDownload className="w-4 h-4" /> PDF PERÍODO
                </button>
              )}
            </div>
            {/* Toast de feedback */}
            {showToast && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-indigo-200 shadow-lg rounded-xl px-6 py-3 text-indigo-700 font-semibold text-base animate-fade-in">
                Relatório gerado!
              </div>
            )}
            {/* Expiração do localStorage */}
            {localStorageExpiry && (
              <div className="w-full flex justify-end mt-1">
                <span className="text-xs text-slate-500">Expiração dos dados locais: <b>{localStorageExpiry}</b></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
