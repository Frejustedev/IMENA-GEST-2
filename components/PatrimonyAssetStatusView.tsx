import React, { useState } from 'react';
import { LifeSheetLot, LifeSheetUnit } from '../types';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { LifeSheetViewer } from './LifeSheetViewer';

interface PatrimonyAssetStatusViewProps {
  lifeSheetLots: LifeSheetLot[];
  lifeSheetUnits: LifeSheetUnit[];
  onSaveLifeSheet: (sheet: LifeSheetLot | LifeSheetUnit) => void;
}

type ActiveTab = 'lot' | 'unit';

export const PatrimonyAssetStatusView: React.FC<PatrimonyAssetStatusViewProps> = ({ lifeSheetLots, lifeSheetUnits, onSaveLifeSheet }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lot');
  const [selectedSheet, setSelectedSheet] = useState<LifeSheetLot | LifeSheetUnit | null>(null);

  const handleSelectSheet = (sheet: LifeSheetLot | LifeSheetUnit) => {
    setSelectedSheet(sheet);
  };

  const handleSaveAndClose = (updatedSheet: LifeSheetLot | LifeSheetUnit) => {
    onSaveLifeSheet(updatedSheet);
    setSelectedSheet(null);
  };

  if (selectedSheet) {
    return <LifeSheetViewer sheet={selectedSheet} onClose={() => setSelectedSheet(null)} onSave={handleSaveAndClose} />;
  }

  const TabButton: React.FC<{ tabId: ActiveTab, label: string, count: number }> = ({ tabId, label, count }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        activeTab === tabId
          ? 'border-b-2 border-sky-500 text-sky-600 bg-white'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label} <span className="bg-gray-200 text-gray-700 text-xs font-semibold ml-2 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <ClipboardDocumentListIcon className="h-8 w-8 text-sky-600" />
          <div>
            <h2 className="text-3xl font-bold text-slate-800">État du Patrimoine</h2>
            <p className="text-sm text-slate-500">Consulter les fiches de vie des actifs.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col min-h-[500px]">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <TabButton tabId="lot" label="Fiches de Vie (par Lot)" count={lifeSheetLots.length} />
            <TabButton tabId="unit" label="Fiches de Vie (par Unité)" count={lifeSheetUnits.length} />
          </nav>
        </div>

        <div className="mt-5 flex-grow overflow-y-auto">
          {activeTab === 'lot' && (
            <ul className="space-y-3">
              {lifeSheetLots.map(sheet => (
                <li key={sheet.id} onClick={() => handleSelectSheet(sheet)} className="p-3 bg-slate-50 rounded-md border hover:bg-slate-100 hover:shadow-sm cursor-pointer transition-all">
                  <p className="font-semibold text-sky-700">{sheet.designation}</p>
                  <p className="text-xs text-slate-500">Code: {sheet.identificationCode}</p>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'unit' && (
            <ul className="space-y-3">
              {lifeSheetUnits.map(sheet => (
                <li key={sheet.id} onClick={() => handleSelectSheet(sheet)} className="p-3 bg-slate-50 rounded-md border hover:bg-slate-100 hover:shadow-sm cursor-pointer transition-all">
                  <p className="font-semibold text-sky-700">{sheet.designation}</p>
                  <p className="text-xs text-slate-500">Code: {sheet.identificationCode}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};