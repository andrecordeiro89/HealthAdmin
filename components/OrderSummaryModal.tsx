import React from 'react';
import { OrderRequest, ReplenishmentMaterial } from '../types'; 
import { UI_TEXT } from '../constants';

interface OrderSummaryModalProps {
  order: OrderRequest; 
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({ order, onConfirm, onCancel }) => {
  
  const purpleGradientPrimary = "px-6 py-2.5 text-white font-semibold rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out";
  const purpleGradientLight = "px-6 py-2.5 text-purple-700 font-medium rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out";
  const modalCloseIcon = "text-indigo-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-100/70 transition-colors duration-150"; 


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-slate-700 border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-4">{UI_TEXT.orderSummarySection || "Resumo do Pedido"}</h2> 
          <button onClick={onCancel} className={modalCloseIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">ID do Pedido: <span className="font-normal text-slate-700">{order.id}</span></h3> 
        </div>

        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold text-indigo-600 mb-3">{UI_TEXT.patientInfoSection}</h3> 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p><strong className="text-slate-500">Paciente:</strong> {order.patientName || 'N/A'}</p>
            <p><strong className="text-slate-500">Data Nasc.:</strong> {order.patientDOB || 'N/A'}</p>
            <p><strong className="text-slate-500">Data Cirurgia:</strong> {order.surgeryDate || 'N/A'}</p>
            <p><strong className="text-slate-500">Médico:</strong> {order.doctorName || 'N/A'}</p>
            <p className="sm:col-span-2"><strong className="text-slate-500">Procedimento:</strong> {order.procedureName || 'N/A'}</p>
          </div>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3">{UI_TEXT.replenishmentDetails || "Detalhes da Reposição"}</h3> 
            {order.materialsToReplenish.length > 0 ? (
            <div className="space-y-3">
                {order.materialsToReplenish.map((material: ReplenishmentMaterial, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md shadow-sm border border-gray-200">
                    <p className="font-medium text-indigo-600">{material.description} {material.code ? `(${material.code})` : ''}</p> 
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 text-xs mt-1 text-slate-500">
                        <p><strong className="text-slate-400">Consumido:</strong> {
                          (order.originalMaterialsConsumed || []).find(m => m.description === material.description || m.code === material.code)?.quantity || material.quantity
                        } unid.</p>
                        {/* Stock information removed from display */}
                        <p className={`font-semibold ${material.replenishQuantity > 0 ? 'text-orange-500' : 'text-purple-600'}`}> 
                           Repor: {material.replenishQuantity} unid.
                        </p>
                         {material.observation?.toLowerCase().includes("verificar") && 
                            <p className="text-yellow-600 col-span-full">Material não cadastrado ou com pendência. Verificar necessidade e quantidade de reposição.</p>
                        }
                         {material.observation?.toLowerCase().includes("baixo") && // This note might become less relevant or change
                            <p className="text-orange-500 col-span-full">Observação: {material.observation}</p> // Simplified display for other observations
                        }
                         {material.replenishmentSuggestionNote && 
                            <p className="text-sky-600 col-span-full italic text-xs">{material.replenishmentSuggestionNote}</p> 
                         }
                    </div>
                </div>
                ))}
            </div>
            ) : (
                <p className="text-slate-400">Nenhum material para reposição neste pedido.</p>
            )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className={purpleGradientLight}
          > 
            Cancelar / Editar
          </button>
          <button
            onClick={onConfirm}
            className={purpleGradientPrimary}
          > 
            {UI_TEXT.confirmSubmitButton || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};
