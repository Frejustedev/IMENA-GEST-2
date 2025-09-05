import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Pagination } from './Pagination';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface PatrimonyInventoryViewProps {
    assets: Asset[];
    onAddAsset: () => void;
    onEditAsset: (asset: Asset) => void;
    onDeleteAsset: (asset: Asset) => void;
}

type SortKey = 'family' | 'designation' | 'brand' | 'model' | 'acquisitionYear' | 'isFunctional' | 'currentAction';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfig: { key: SortKey; direction: SortDirection };
    requestSort: (key: SortKey) => void;
}> = ({ label, sortKey, sortConfig, requestSort }) => {
    const isSorted = sortConfig.key === sortKey;
    const icon = isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕';
    return (
        <button
            onClick={() => requestSort(sortKey)}
            className="flex items-center space-x-1 hover:text-slate-800 focus:outline-none"
        >
            <span>{label}</span>
            <span className={`text-xs ${isSorted ? 'text-sky-600' : 'text-slate-400'}`}>{icon}</span>
        </button>
    );
};

export const PatrimonyInventoryView: React.FC<PatrimonyInventoryViewProps> = ({ assets, onAddAsset, onEditAsset, onDeleteAsset }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [familyFilter, setFamilyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'family', direction: 'asc' });

    const assetFamilies = useMemo(() => {
        const assetsArray = Array.isArray(assets) ? assets : [];
        return [...new Set(assetsArray.map(a => a.family))];
    }, [assets]);

    const filteredAssets = useMemo(() => {
        const assetsArray = Array.isArray(assets) ? assets : [];
        let filtered = assetsArray.filter(asset => {
            const searchMatch =
                asset.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
            const familyMatch = familyFilter === 'all' || asset.family === familyFilter;
            const statusMatch =
                statusFilter === 'all' ||
                (statusFilter === 'functional' && asset.isFunctional) ||
                (statusFilter === 'not_functional' && !asset.isFunctional);
            return searchMatch && familyMatch && statusMatch;
        });

        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            const comparison = String(aValue).localeCompare(String(bValue), 'fr', { numeric: true });
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [assets, searchTerm, familyFilter, statusFilter, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ArchiveBoxIcon className="h-8 w-8 text-sky-600" />
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800">Inventaire du Patrimoine</h2>
                            <p className="text-sm text-slate-500">Gestion des biens durables et équipements de l'établissement.</p>
                        </div>
                    </div>
                    <button onClick={onAddAsset} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Nouvel Actif
                    </button>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-10 pr-3 text-sm"/>
                    </div>
                    <select value={familyFilter} onChange={e => setFamilyFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm">
                        <option value="all">Toutes les familles</option>
                        {assetFamilies.map(family => <option key={family} value={family}>{family}</option>)}
                    </select>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm">
                        <option value="all">Tous les états</option>
                        <option value="functional">Fonctionnel</option>
                        <option value="not_functional">Non Fonctionnel</option>
                    </select>
                </div>

                <div className="overflow-x-auto flex-grow">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><SortableHeader label="Famille" sortKey="family" sortConfig={sortConfig} requestSort={requestSort} /></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><SortableHeader label="Désignation" sortKey="designation" sortConfig={sortConfig} requestSort={requestSort} /></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><SortableHeader label="Marque" sortKey="brand" sortConfig={sortConfig} requestSort={requestSort} /></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">N° Série</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><SortableHeader label="Année Acq." sortKey="acquisitionYear" sortConfig={sortConfig} requestSort={requestSort} /></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"><SortableHeader label="État" sortKey="isFunctional" sortConfig={sortConfig} requestSort={requestSort} /></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedAssets.map(asset => (
                                <tr key={asset.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{asset.family}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{asset.designation}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{asset.brand || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{asset.serialNumber || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{asset.acquisitionYear}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.isFunctional ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {asset.isFunctional ? 'Fonctionnel' : 'Non Fonctionnel'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{asset.currentAction || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => onEditAsset(asset)} className="p-1 text-indigo-600 hover:text-indigo-900" title="Modifier"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => onDeleteAsset(asset)} className="p-1 text-red-600 hover:text-red-900" title="Supprimer"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {paginatedAssets.length === 0 && <p className="text-center text-slate-500 py-4">Aucun actif trouvé.</p>}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};