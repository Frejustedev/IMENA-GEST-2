import React, { useState } from 'react';
import { LifeSheetLot, LifeSheetUnit, LifeSheetMovementLot, LifeSheetMovementUnit } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TrashIcon } from './icons/TrashIcon';

interface LifeSheetFormProps {
  sheet: LifeSheetLot | LifeSheetUnit;
  onClose: () => void;
  onSave: (sheet: LifeSheetLot | LifeSheetUnit) => void;
}

// Type guard to differentiate between sheet types
function isLifeSheetLot(sheet: any): sheet is LifeSheetLot {
  return (sheet as LifeSheetLot).lotValue !== undefined;
}

const inputClass = "w-full p-1 border border-transparent focus:border-slate-300 focus:outline-none rounded printable-form-field bg-transparent hover:bg-slate-100 focus:bg-white";
const inputClassNumeric = `${inputClass} text-right`;
const inputClassCenter = `${inputClass} text-center`;
const selectClass = `${inputClass}`;

export const LifeSheetViewer: React.FC<LifeSheetFormProps> = ({ sheet, onClose, onSave }) => {
    const [formData, setFormData] = useState<LifeSheetLot | LifeSheetUnit>(JSON.parse(JSON.stringify(sheet))); // Deep copy to prevent mutation
    const isLot = isLifeSheetLot(formData);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name.includes('Value') || name.includes('Amount') ? parseFloat(value) || 0 : value }));
    };

    const handleMovementChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newMovements = [...formData.movements];
        const movement = { ...newMovements[index] } as any;
        
        // Handle numeric conversion
        if (['entryUnits', 'entryAmount', 'exitUnits', 'exitAmount'].includes(name)) {
            movement[name] = parseFloat(value) || undefined; // Use undefined for empty numeric fields
        } else {
            movement[name] = value;
        }

        newMovements[index] = movement;
        setFormData(prev => ({ ...prev, movements: newMovements }));
    };

    const addMovement = () => {
        const newMovement = isLot 
            ? { id: `mvt_l_${Date.now()}`, date: new Date().toISOString().split('T')[0], nature: '' }
            : { id: `mvt_u_${Date.now()}`, date: new Date().toISOString().split('T')[0], nature: '' };

        setFormData(prev => ({ ...prev, movements: [...prev.movements, newMovement] as any }));
    };

    const removeMovement = (id: string) => {
        setFormData(prev => ({ ...prev, movements: prev.movements.filter((m) => m.id !== id) }));
    };

    const handleSave = () => {
        onSave(formData);
    };
    
    return (
        <div className="bg-slate-50 p-6 rounded-xl shadow-2xl animate-fadeIn printable-content">
            <div className="flex items-start justify-between mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Fiche de Vie</h2>
                    <p className="text-sm text-slate-500">{isLot ? 'Formulaire pour un Lot' : 'Formulaire pour une Unité'}</p>
                </div>
                <div className="flex items-center space-x-2 no-print">
                    <button type="button" onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm flex items-center">
                        <PrinterIcon className="h-5 w-5 mr-2" /> Imprimer
                    </button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">
                        Enregistrer
                    </button>
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm">
                        Fermer
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 border border-gray-300">
                <p className="text-sm mb-4">CACHET DU SERVICE</p>
                <h3 className="text-center font-bold text-lg mb-6">{isLot ? 'FICHE DE VIE (pour un lot)' : 'FICHE DE VIE UNITE'}</h3>
                
                {isLot ? (
                    <>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm">
                            <div className="flex items-center"><strong>DESIGNATION :</strong> <input name="designation" value={(formData as LifeSheetLot).designation} onChange={handleHeaderChange} className={`${inputClass} ml-2`} /></div>
                            <div className="flex items-center"><strong>VALEUR DU LOT :</strong> <input type="number" name="lotValue" value={(formData as LifeSheetLot).lotValue} onChange={handleHeaderChange} className={`${inputClassNumeric} ml-2`} /></div>
                            <div className="flex items-center"><strong>CODE D'IDENTIFICATION :</strong> <input name="identificationCode" value={formData.identificationCode} onChange={handleHeaderChange} className={`${inputClass} ml-2`} /></div>
                            <div className="flex items-center"><strong>VALEUR UNITAIRE D'ENTREE :</strong> <input type="number" name="unitValue" value={(formData as LifeSheetLot).unitValue} onChange={handleHeaderChange} className={`${inputClassNumeric} ml-2`} /></div>
                        </div>
                        <table className="min-w-full border-collapse border border-black text-xs">
                           <thead>
                                <tr className="bg-gray-100">
                                    <th rowSpan={2} className="border border-black p-1 font-semibold">Date</th>
                                    <th rowSpan={2} className="border border-black p-1 font-semibold">NATURE DU MOUVEMENT</th>
                                    <th colSpan={3} className="border border-black p-1 font-semibold">ENTREE</th>
                                    <th colSpan={3} className="border border-black p-1 font-semibold">SORTIE</th>
                                    <th rowSpan={2} className="border border-black p-1 font-semibold no-print">Action</th>
                                </tr>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 font-medium">NB d'unités</th><th className="border border-black p-1 font-medium">Montant TTC</th><th className="border border-black p-1 font-medium">Destination</th>
                                    <th className="border border-black p-1 font-medium">NB d'unités</th><th className="border border-black p-1 font-medium">Montant TTC</th><th className="border border-black p-1 font-medium">Destination</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.movements as LifeSheetMovementLot[]).map((m, index) => (
                                    <tr key={m.id}>
                                        <td className="border border-black"><input type="date" name="date" value={m.date.split('T')[0]} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black"><input name="nature" value={m.nature} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black"><input type="number" name="entryUnits" value={m.entryUnits || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClassCenter} /></td>
                                        <td className="border border-black"><input type="number" step="0.01" name="entryAmount" value={m.entryAmount || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClassNumeric} /></td>
                                        <td className="border border-black"><input name="entryDestination" value={m.entryDestination || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black"><input type="number" name="exitUnits" value={m.exitUnits || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClassCenter} /></td>
                                        <td className="border border-black"><input type="number" step="0.01" name="exitAmount" value={m.exitAmount || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClassNumeric} /></td>
                                        <td className="border border-black"><input name="exitDestination" value={m.exitDestination || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black p-1 text-center no-print"><button type="button" onClick={() => removeMovement(m.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : ( // Unit Sheet
                    <>
                        <div className="grid grid-cols-1 gap-y-2 mb-4 text-sm">
                           <div className="flex items-center"><strong>DESIGNATION :</strong> <input name="designation" value={formData.designation} onChange={handleHeaderChange} className={`${inputClass} ml-2`} /></div>
                           <div className="flex items-center"><strong>CODE D'IDENTIFICATION :</strong> <input name="identificationCode" value={formData.identificationCode} onChange={handleHeaderChange} className={`${inputClass} ml-2`} /></div>
                        </div>
                        <table className="min-w-full border-collapse border border-black text-xs">
                           <thead>
                                <tr className="bg-gray-100">
                                    <th rowSpan={2} className="border border-black p-1 font-semibold">Date</th><th rowSpan={2} className="border border-black p-1 font-semibold">NATURE DU MOUVEMENT</th>
                                    <th colSpan={3} className="border border-black p-1 font-semibold">ENTREE</th><th colSpan={3} className="border border-black p-1 font-semibold">SORTIE</th>
                                    <th rowSpan={2} className="border border-black p-1 font-semibold no-print">Action</th>
                                </tr>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 font-medium">Montant TTC</th><th className="border border-black p-1 font-medium">Etat</th><th className="border border-black p-1 font-medium">Destination</th>
                                    <th className="border border-black p-1 font-medium">Montant TTC</th><th className="border border-black p-1 font-medium">Etat</th><th className="border border-black p-1 font-medium">Destination</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.movements as LifeSheetMovementUnit[]).map((m, index) => (
                                    <tr key={m.id}>
                                        <td className="border border-black"><input type="date" name="date" value={m.date.split('T')[0]} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black"><input name="nature" value={m.nature} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black"><input type="number" step="0.01" name="entryAmount" value={m.entryAmount || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClassNumeric} /></td>
                                        <td className="border border-black"><select name="entryState" value={m.entryState || ''} onChange={(e) => handleMovementChange(index, e)} className={selectClass}><option value=""></option><option value="Bon">Bon</option><option value="Moyen">Moyen</option><option value="Mauvais">Mauvais</option></select></td>
                                        <td className="border border-black"><input name="entryDestination" value={m.entryDestination || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black"><input type="number" step="0.01" name="exitAmount" value={m.exitAmount || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClassNumeric} /></td>
                                        <td className="border border-black"><select name="exitState" value={m.exitState || ''} onChange={(e) => handleMovementChange(index, e)} className={selectClass}><option value=""></option><option value="Vendu">Vendu</option><option value="Réformé">Réformé</option><option value="Transféré">Transféré</option></select></td>
                                        <td className="border border-black"><input name="exitDestination" value={m.exitDestination || ''} onChange={(e) => handleMovementChange(index, e)} className={inputClass} /></td>
                                        <td className="border border-black p-1 text-center no-print"><button type="button" onClick={() => removeMovement(m.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                 <button type="button" onClick={addMovement} className="mt-4 flex items-center text-sm text-sky-600 hover:text-sky-800 no-print">
                    <PlusCircleIcon className="h-5 w-5 mr-1" />
                    Ajouter un mouvement
                </button>
            </div>

            <style>{`
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @media print {
                    .printable-content { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; background-color: white !important; }
                    body { font-size: 10pt; }
                }
            `}</style>
        </div>
    );
};
