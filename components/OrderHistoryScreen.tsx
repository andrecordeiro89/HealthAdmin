import React, { useState } from 'react';
import { ConsolidatedOrderData, HospitalOption } from '../types';
import { UI_TEXT } from '../constants';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, inputBase, buttonSize, cardLarge, sectionGap } from './uiClasses';

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
  const [selectedDate, setSelectedDate] = useState('');

  // Filtro
  const filteredHistory = history.filter(order => {
    const hospitalMatch = selectedHospital ? order.hospital === selectedHospital : true;
    const dateMatch = selectedDate ? order.orderDate === selectedDate : true;
    return hospitalMatch && dateMatch;
  });

  // getHospitalName now uses the hospitalOptions prop passed from App.tsx
  const getHospitalName = (hospitalId: string): string => {
    const found = hospitalOptions.find(h => h.id === hospitalId);
    return found?.name || hospitalId; // Fallback to ID if not found (shouldn't happen in normal flow)
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        // Attempt to parse as ISO string first if it contains 'T'
        const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString.replace(/-/g, '/')); // Handle YYYY-MM-DD
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return dateString; // Return original if parsing fails
    }
  };
  
  const purpleGradientLight = "text-purple-700 font-medium py-2 px-4 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  const smallPurpleGradientAction = "text-white font-semibold text-xs py-1.5 px-3 rounded-md shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:saturate-50";

  return (
    <div className={"w-full h-full min-h-screen flex flex-col justify-center items-center bg-white/90 backdrop-blur-md rounded-none shadow-none border-none px-16 py-12 "} style={{boxSizing: 'border-box'}}>
      <div className={"w-full max-w-6xl mx-auto flex flex-col " + cardLarge}>
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex gap-2 items-center">
            <label className="text-xs font-medium text-slate-600">Hospital:</label>
            <select value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)} className={inputBase + " text-sm"}>
              <option value="">Todos</option>
              {hospitalOptions.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs font-medium text-slate-600">Data:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputBase + " text-sm"} />
          </div>
          <button onClick={onBack} className={buttonPrimary + " " + buttonSize}>Voltar</button>
        </div>
        <div className={"overflow-x-auto max-h-[60vh] " + sectionGap}>
          <table className="min-w-full text-sm text-left border border-gray-200">
            <thead className={tableHeader}>
              <tr>
                <th className={tableCell}>ID do Pedido</th>
                <th className={tableCell}>Hospital</th>
                <th className={tableCell}>Data</th>
                <th className={tableCell}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((order, idx) => (
                <tr key={order.orderId} className={zebraRow}>
                  <td className={tableCell}>{order.orderId}</td>
                  <td className={tableCell}>{hospitalOptions.find(h => h.id === order.hospital)?.name || order.hospital}</td>
                  <td className={tableCell}>{order.orderDate}</td>
                  <td className={tableCell}>
                    <button onClick={() => onReprintPdf(order)} className={buttonLight + " " + buttonSize} title="Reimprimir PDF">Reimprimir PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
