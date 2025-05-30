

import React, { useState } from 'react';
import { HospitalOption } from '../types'; // Hospital enum no longer directly used for ID
import { UI_TEXT, COMPANY_NAME } from '../constants';
import { Modal } from './Modal'; // Import Modal

interface HospitalSelectorProps {
  hospitals: HospitalOption[];
  onSelect: (hospitalId: string) => void; // hospitalId is now string
  onViewHistory?: () => void; 
  onManageMaterialDatabase?: () => void;
  onAddNewHospital: (hospitalName: string) => boolean; // Function to add a new hospital
  onGenerateGlobalConsumptionReport?: () => void; // New prop for global consumption report
}

export const HospitalSelector: React.FC<HospitalSelectorProps> = ({ 
  hospitals, 
  onSelect, 
  onViewHistory, 
  onManageMaterialDatabase,
  onAddNewHospital,
  onGenerateGlobalConsumptionReport
}) => {
  const [selected, setSelected] = useState<string>(''); // selected hospital ID is string
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      onSelect(selected);
    }
  };

  const handleOpenAddHospitalModal = () => {
    setNewHospitalName(''); // Reset input
    setShowAddHospitalModal(true);
  };

  const handleCloseAddHospitalModal = () => {
    setShowAddHospitalModal(false);
  };

  const handleSaveNewHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHospitalName.trim()) {
      const success = onAddNewHospital(newHospitalName.trim());
      if (success) {
        handleCloseAddHospitalModal();
      }
      // Alert for success/failure is handled by App.tsx
    }
  };

  const purpleGradientPrimary = "w-full text-white font-semibold py-3 px-5 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientSecondary = "w-full text-white font-medium py-2.5 px-4 rounded-lg shadow-md bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const modalPurpleGradientPrimary = purpleGradientPrimary.replace("w-full ", ""); // for modal buttons
  const modalPurpleGradientLight = "text-purple-700 font-medium py-2 px-4 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";


  return (
    <>
      {/* Single Column Layout - Centered Card */}
      <div className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-xl shadow-2xl border border-gray-200">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-8 text-center">
            {UI_TEXT.selectHospitalPrompt}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="hospital" className="block text-sm font-medium text-slate-600 mb-1.5">
                Hospital
              </label>
              <select
                id="hospital"
                name="hospital"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="mt-1 block w-full pl-4 pr-10 py-3 text-base bg-gray-50 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-700 shadow-sm" 
                required
              > 
                <option value="" disabled className="text-gray-400">-- Escolha uma unidade hospitalar --</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id} className="text-slate-700">
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pt-2"> {/* Reduced padding-top here */}
              <button
                type="submit"
                disabled={!selected}
                className={purpleGradientPrimary}
              > 
                {UI_TEXT.confirmHospitalButton}
              </button>
            </div>
          </form>

          {/* Secondary Actions Section */}
          <div className="mt-10 pt-6 border-t border-gray-300">
            <h4 className="text-sm font-semibold text-center text-slate-500 mb-5 uppercase tracking-wider">Outras Ações</h4>
            <div className="space-y-3">
              {onViewHistory && (
                <button
                  type="button"
                  onClick={onViewHistory}
                  className={purpleGradientSecondary}
                >
                  {UI_TEXT.viewOrderHistoryButton}
                </button>
              )}
              {onManageMaterialDatabase && (
                <button
                  type="button"
                  onClick={onManageMaterialDatabase}
                  className={purpleGradientSecondary}
                >
                  {UI_TEXT.manageMaterialDbButtonLabel}
                </button>
              )}
              {onGenerateGlobalConsumptionReport && (
                <button
                  type="button"
                  onClick={onGenerateGlobalConsumptionReport}
                  className={`${purpleGradientSecondary} disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={!onGenerateGlobalConsumptionReport} 
                >
                  {UI_TEXT.generateGlobalConsumptionReportButton}
                </button>
              )}
               <button
                type="button"
                onClick={handleOpenAddHospitalModal}
                className={purpleGradientSecondary}
              >
                {UI_TEXT.addNewHospitalButtonLabel}
              </button>
            </div>
          </div>
      </div>

      {showAddHospitalModal && (
        <Modal
          isOpen={showAddHospitalModal}
          onClose={handleCloseAddHospitalModal}
          title={UI_TEXT.modalTitleAddNewHospital}
          size="md"
        >
          <form onSubmit={handleSaveNewHospital} className="space-y-4">
            <div>
              <label htmlFor="newHospitalName" className="block text-sm font-medium text-slate-600">
                {UI_TEXT.hospitalNameInputLabel}
              </label>
              <input
                type="text"
                id="newHospitalName"
                value={newHospitalName}
                onChange={(e) => setNewHospitalName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700" 
                required
                autoFocus
              /> 
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseAddHospitalModal}
                className={modalPurpleGradientLight}
              > 
                {UI_TEXT.cancelButton}
              </button>
              <button
                type="submit"
                className={modalPurpleGradientPrimary} 
              >
                {UI_TEXT.saveChangesButton}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
