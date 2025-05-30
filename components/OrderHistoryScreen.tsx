

import React from 'react';
import { ConsolidatedOrderData, HospitalOption } from '../types';
import { UI_TEXT } from '../constants';

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
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-indigo-600">{UI_TEXT.orderHistoryTitle}</h2> 
        <button
          onClick={onBack}
          className={purpleGradientLight}
        >
          {UI_TEXT.backToHospitalSelectionFromHistoryButton}
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-center text-slate-500 py-10">{UI_TEXT.noOrdersInHistory}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {UI_TEXT.orderIdLabel}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {UI_TEXT.hospitalLabel}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {UI_TEXT.orderDateLabel}
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {UI_TEXT.actionsLabel}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-medium">{order.orderId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{getHospitalName(order.hospital)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatDate(order.orderDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => onReprintPdf(order)}
                      className={smallPurpleGradientAction}
                      aria-label={`${UI_TEXT.reprintPdfButton} para o pedido ${order.orderId}`}
                    > 
                      {UI_TEXT.reprintPdfButton}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
