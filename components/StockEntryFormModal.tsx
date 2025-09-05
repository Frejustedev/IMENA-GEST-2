import React, { useState, FormEvent, useEffect } from 'react';
import { StockItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface StockEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    ordonnateur: string;
    service: string;
    documentRef: string;
    items: { stockItemId: string; quantity: number; unitPrice: number }[];
  }) => void;
  stockItems: StockItem[];
}

interface FormItem {
  id: number;
  stockItemId: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export const StockEntryFormModal: React.FC<StockEntryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stockItems,
}) => {
  const [service, setService] = useState('');
  const [ordonnateur, setOrdonnateur] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentRef, setDocumentRef] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    { id: Date.now(), stockItemId: '', designation: '', unit: '', quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    if (isOpen) {
        // Reset form state on open
        setService('');
        setOrdonnateur('');
        setDate(new Date().toISOString().split('T')[0]);
        setDocumentRef(`BE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
        setItems([{ id: Date.now(), stockItemId: '', designation: '', unit: '', quantity: 1, unitPrice: 0 }]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemChange = (id: number, field: keyof FormItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'stockItemId') {
            const selectedStock = stockItems.find(si => si.id === value);
            updatedItem.designation = selectedStock?.designation || '';
            updatedItem.unit = selectedStock?.unit || '';
            updatedItem.unitPrice = selectedStock?.unitPrice || 0;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    setItems(prevItems => [
      ...prevItems,
      { id: Date.now(), stockItemId: '', designation: '', unit: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const calculateTotal = (item: FormItem) => (item.quantity * item.unitPrice).toFixed(2);
  
  const calculateGrandTotal = () => items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0).toFixed(2);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validItems = items
      .filter(item => item.stockItemId && item.quantity > 0)
      .map(({ stockItemId, quantity, unitPrice }) => ({ stockItemId, quantity, unitPrice }));

    if (validItems.length === 0) {
      alert("Veuillez ajouter au moins un article valide.");
      return;
    }
    onSubmit({ date, ordonnateur, service, documentRef, items: validItems });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Ordre d'Entrée des Matières</h3>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Cachet du Service</label><input type="text" value={service} onChange={e => setService(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
              <div><label className="text-sm font-medium">Référence Document</label><input type="text" value={documentRef} onChange={e => setDocumentRef(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
              <div><label className="text-sm font-medium">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" required /></div>
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Code d'identification</th>
                    <th className="p-2 text-left">Désignation</th>
                    <th className="p-2 text-left">Unité</th>
                    <th className="p-2 text-left">Quantité</th>
                    <th className="p-2 text-left">Valeur Unitaire</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2"><select value={item.stockItemId} onChange={e => handleItemChange(item.id, 'stockItemId', e.target.value)} className="w-full border border-gray-300 rounded p-1"><option value="" disabled>Choisir...</option>{stockItems.map(si => <option key={si.id} value={si.id}>{si.id}</option>)}</select></td>
                      <td className="p-2"><input type="text" value={item.designation} className="w-full bg-slate-50 p-1 border-0" readOnly /></td>
                      <td className="p-2"><input type="text" value={item.unit} className="w-20 bg-slate-50 p-1 border-0" readOnly /></td>
                      <td className="p-2"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-24 border border-gray-300 rounded p-1" min="1"/></td>
                      <td className="p-2"><input type="number" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-24 border border-gray-300 rounded p-1" min="0" step="0.01"/></td>
                      <td className="p-2"><input type="text" value={calculateTotal(item)} className="w-24 bg-slate-50 p-1 border-0" readOnly /></td>
                      <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 p-1 disabled:opacity-50" disabled={items.length <= 1}><TrashIcon className="h-5 w-5"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-sky-600 hover:text-sky-800"><PlusIcon className="h-4 w-4 mr-1"/> Ajouter une ligne</button>
            <div className="text-right font-bold">TOTAL: {calculateGrandTotal()}</div>
             <div><label className="text-sm font-medium">Prénom et nom de l'ordonnateur</label><input type="text" value={ordonnateur} onChange={e => setOrdonnateur(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" required /></div>
          </div>
          <div className="p-4 bg-gray-50 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded-md">Enregistrer l'Entrée</button>
          </div>
        </form>
      </div>
    </div>
  );
};
