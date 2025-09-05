import React, { useState, useMemo } from 'react';
import { StockItem } from '../types';
import { CubeIcon } from './icons/CubeIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { ArrowUpOnSquareIcon } from './icons/ArrowUpOnSquareIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { Pagination } from './Pagination';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface PatrimonyStockViewProps {
  stockItems: StockItem[];
  onAddNewEntry: () => void;
  onAddNewExit: () => void;
  onViewItemDetail: (item: StockItem) => void;
  onAddStockItem: () => void;
  onEditStockItem: (item: StockItem) => void;
  onDeleteStockItem: (item: StockItem) => void;
}

const ITEMS_PER_PAGE = 10;

export const PatrimonyStockView: React.FC<PatrimonyStockViewProps> = ({ 
    stockItems, 
    onAddNewEntry, 
    onAddNewExit, 
    onViewItemDetail,
    onAddStockItem,
    onEditStockItem,
    onDeleteStockItem,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        return stockItems.filter(item => 
            item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.budgetLine && item.budgetLine.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [stockItems, searchTerm]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <CubeIcon className="h-8 w-8 text-sky-600" />
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800">Gestion de Stock</h2>
                            <p className="text-sm text-slate-500">Vue d'ensemble des articles en stock.</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                         <button onClick={onAddStockItem} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Ajouter un Article
                        </button>
                        <button onClick={onAddNewEntry} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Nouvelle Entrée
                        </button>
                        <button onClick={onAddNewExit} className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                            <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
                            Nouvelle Sortie
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-700">Articles en Stock</h3>
                     <div className="relative w-full max-w-sm">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Rechercher article..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-10 pr-3 text-sm"/>
                    </div>
                </div>

                <div className="overflow-x-auto flex-grow">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Désignation</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ligne Budgétaire</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock Actuel</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Unité</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dernier P.U.</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{item.designation}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{item.budgetLine || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-700">{item.currentStock}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{item.unit}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{item.unitPrice.toFixed(2)} €</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm space-x-2">
                                        <button onClick={() => onViewItemDetail(item)} className="p-1 text-sky-600 hover:text-sky-800" title="Voir la fiche de stock">
                                            <DocumentTextIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onEditStockItem(item)} className="p-1 text-indigo-600 hover:text-indigo-800" title="Modifier l'article">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDeleteStockItem(item)} className="p-1 text-red-600 hover:text-red-800" title="Supprimer l'article">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredItems.length === 0 && <p className="text-center text-slate-500 py-4">Aucun article trouvé.</p>}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};