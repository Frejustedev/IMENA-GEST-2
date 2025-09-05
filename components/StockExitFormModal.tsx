import React, { useState, FormEvent, useEffect } from 'react';
import { StockItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowUpOnSquareIcon } from './icons/ArrowUpOnSquareIcon';

interface StockExitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    destinationOrSource: string;
    documentRef: string;
    items: { stockItemId: string; quantity: number }[];
  }) => void;
  stockItems: StockItem[];
}

interface FormItem {
  id: number;
  stockItemId: string;
  quantity: number;
  maxQuantity: number;
  unit: string;
}

export const StockExitFormModal: React.FC<StockExitFormModalProps> = ({ isOpen, onClose, onSubmit, stockItems }) => {
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [documentRef, setDocumentRef] = useState('');
    const [items, setItems] = useState<FormItem[]>([
        { id: Date.now(), stockItemId: '', quantity: 1, maxQuantity: 0, unit: '' },
    ]);

    const availableStockItems = stockItems.filter(si => si.currentStock > 0);

    useEffect(() => {
        if (isOpen) {
            setDestination('');
            setDate(new Date().toISOString().split('T')[0]);
            setDocumentRef(`BS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
            setItems([{ id: Date.now(), stockItemId: '', quantity: 1, maxQuantity: 0, unit: '' }]);
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
                        updatedItem.maxQuantity = selectedStock?.currentStock || 0;
                        updatedItem.unit = selectedStock?.unit || '';
                        updatedItem.quantity = 1; // Reset quantity
                    }
                    if (field === 'quantity' && value > updatedItem.maxQuantity) {
                         updatedItem.quantity = updatedItem.maxQuantity; // Cap at max stock
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { id: Date.now(), stockItemId: '', quantity: 1, maxQuantity: 0, unit: '' }]);
    };
    
    const handleRemoveItem = (id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const validItems = items
            .filter(item => item.stockItemId && item.quantity > 0)
            .map(({ stockItemId, quantity }) => ({ stockItemId, quantity }));

        if (validItems.length === 0) {
            alert("Veuillez ajouter au moins un article valide.");
            return;
        }
        if (!destination) {
            alert("Veuillez renseigner la destination.");
            return;
        }
        onSubmit({ date, destinationOrSource: destination, documentRef, items: validItems });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
                <div className="p-4 border-b flex items-center space-x-2">
                    <ArrowUpOnSquareIcon className="h-6 w-6 text-orange-500" />
                    <h3 className="text-xl font-semibold text-gray-800">Bon de Sortie de Stock</h3>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                    <div className="p-6 overflow-y-auto space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium">Destination/Service</label><input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" required /></div>
                            <div><label className="text-sm font-medium">Réf. Document (Bon)</label><input type="text" value={documentRef} onChange={e => setDocumentRef(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
                            <div><label className="text-sm font-medium">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm" required /></div>
                        </div>
                        
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-6"><label className="text-xs">Article</label><select value={item.stockItemId} onChange={e => handleItemChange(item.id, 'stockItemId', e.target.value)} className="w-full border border-gray-300 rounded p-1 text-sm"><option value="" disabled>Choisir un article...</option>{availableStockItems.map(si => <option key={si.id} value={si.id}>{si.designation} (Stock: {si.currentStock})</option>)}</select></div>
                                    <div className="col-span-2"><label className="text-xs">Quantité</label><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded p-1 text-sm" min="1" max={item.maxQuantity}/></div>
                                    <div className="col-span-2"><label className="text-xs">Unité</label><input type="text" value={item.unit} className="w-full bg-slate-50 p-1 border-0 text-sm" readOnly /></div>
                                    <div className="col-span-2 self-end text-center"><button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 p-1 disabled:opacity-50" disabled={items.length <= 1}><TrashIcon className="h-5 w-5"/></button></div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-sky-600 hover:text-sky-800"><PlusIcon className="h-4 w-4 mr-1"/> Ajouter un article</button>
                    </div>

                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Annuler</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md">Enregistrer la Sortie</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
