import React, { useMemo } from 'react';
import { StockItem } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';

interface StockItemDetailViewProps {
  stockItem: StockItem;
  onClose: () => void;
}

interface LedgerEntry {
    date: string;
    documentRef?: string;
    sourceOrDest?: string;
    entryQty?: number;
    entryPU?: number;
    entryTotal?: number;
    exitQty?: number;
    exitPU?: number;
    exitTotal?: number;
    stockQty: number;
    stockPU: number;
    stockTotal: number;
}

export const StockItemDetailView: React.FC<StockItemDetailViewProps> = ({ stockItem, onClose }) => {
    
    const ledgerEntries = useMemo(() => {
        let runningStock = 0;
        let lastUnitPrice = 0;
        
        const sortedMovements = [...stockItem.movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return sortedMovements.map(m => {
            const entry: Partial<LedgerEntry> = {
                date: new Date(m.date).toLocaleDateString('fr-FR'),
                documentRef: m.documentRef,
                sourceOrDest: m.destinationOrSource,
            };

            if (m.type === 'Entrée') {
                runningStock += m.quantity;
                lastUnitPrice = m.unitPrice;
                entry.entryQty = m.quantity;
                entry.entryPU = m.unitPrice;
                entry.entryTotal = m.quantity * m.unitPrice;
            } else { // Sortie or Consommation
                runningStock -= m.quantity;
                entry.exitQty = m.quantity;
                entry.exitPU = m.unitPrice;
                entry.exitTotal = m.quantity * m.unitPrice;
            }

            entry.stockQty = runningStock;
            entry.stockPU = lastUnitPrice;
            entry.stockTotal = runningStock * lastUnitPrice;

            return entry as LedgerEntry;
        });
    }, [stockItem.movements]);


    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl animate-fadeIn printable-content">
            <div className="flex items-start justify-between mb-6 border-b border-slate-200 pb-4">
                <div>
                    <p className="text-sm text-slate-500">FICHE DE STOCK</p>
                    <h2 className="text-3xl font-bold text-slate-800">{stockItem.designation}</h2>
                    <p className="text-sm text-slate-600"><strong>Ligne Budgétaire:</strong> {stockItem.budgetLine || 'N/A'}</p>
                </div>
                 <div className="flex items-center space-x-2 no-print">
                    <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm flex items-center">
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        Imprimer
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm">
                        &larr; Retour
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-slate-400 text-sm">
                    <thead>
                        <tr className="bg-slate-100">
                            <th rowSpan={2} className="border border-slate-300 p-2 font-semibold">Date</th>
                            <th colSpan={3} className="border border-slate-300 p-2 font-semibold">ENTREE</th>
                            <th colSpan={3} className="border border-slate-300 p-2 font-semibold">SORTIE</th>
                            <th colSpan={3} className="border border-slate-300 p-2 font-semibold">STOCK</th>
                        </tr>
                        <tr className="bg-slate-50">
                            <th className="border border-slate-300 p-1 font-medium">Quantité</th>
                            <th className="border border-slate-300 p-1 font-medium">P.U. TTC</th>
                            <th className="border border-slate-300 p-1 font-medium">Total TTC</th>
                            <th className="border border-slate-300 p-1 font-medium">Quantité</th>
                            <th className="border border-slate-300 p-1 font-medium">P.U. TTC</th>
                            <th className="border border-slate-300 p-1 font-medium">Total TTC</th>
                            <th className="border border-slate-300 p-1 font-medium">Quantité</th>
                            <th className="border border-slate-300 p-1 font-medium">P.U. TTC</th>
                            <th className="border border-slate-300 p-1 font-medium">Total TTC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledgerEntries.map((entry, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                                <td className="border border-slate-300 p-2">{entry.date}</td>
                                <td className="border border-slate-300 p-2 text-center">{entry.entryQty || ''}</td>
                                <td className="border border-slate-300 p-2 text-right">{entry.entryPU?.toFixed(2) || ''}</td>
                                <td className="border border-slate-300 p-2 text-right font-medium">{entry.entryTotal?.toFixed(2) || ''}</td>
                                <td className="border border-slate-300 p-2 text-center">{entry.exitQty || ''}</td>
                                <td className="border border-slate-300 p-2 text-right">{entry.exitPU?.toFixed(2) || ''}</td>
                                <td className="border border-slate-300 p-2 text-right font-medium">{entry.exitTotal?.toFixed(2) || ''}</td>
                                <td className="border border-slate-300 p-2 text-center font-bold bg-slate-100">{entry.stockQty}</td>
                                <td className="border border-slate-300 p-2 text-right font-bold bg-slate-100">{entry.stockPU.toFixed(2)}</td>
                                <td className="border border-slate-300 p-2 text-right font-bold bg-slate-100">{entry.stockTotal.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <style>{`
                .animate-fadeIn {
                  animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
             `}</style>
        </div>
    );
};
