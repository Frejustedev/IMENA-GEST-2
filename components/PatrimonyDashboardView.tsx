import React, { useMemo } from 'react';
import { Asset, StockItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface PatrimonyDashboardViewProps {
  assets: Asset[];
  stockItems: StockItem[];
  onNavigateToInventory: () => void;
  onNavigateToStock: () => void;
  onAddAsset: () => void;
  onAddStockEntry: () => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; onClick?: () => void; color?: string }> = ({ title, value, icon, onClick, color = 'bg-sky-100 text-sky-600' }) => (
    <button onClick={onClick} disabled={!onClick} className={`w-full bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4 text-left ${onClick ? 'hover:shadow-xl hover:scale-105 transition-all' : ''}`}>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </button>
);

export const PatrimonyDashboardView: React.FC<PatrimonyDashboardViewProps> = ({ assets, stockItems, onNavigateToInventory, onNavigateToStock, onAddAsset, onAddStockEntry }) => {
    // Protection contre les données non-tableau
    console.log('PatrimonyDashboard - assets:', assets, 'stockItems:', stockItems);

    const {
        totalAssetValue,
        totalStockValue,
        functionalCount,
        nonFunctionalCount,
        assetFamilyData,
        lowStockItems
    } = useMemo(() => {
        const assetsArray = Array.isArray(assets) ? assets : [];
        const stockItemsArray = Array.isArray(stockItems) ? stockItems : [];
        
        const totalAssetValue = assetsArray.reduce((sum, asset) => sum + (asset.acquisitionCost || 0) * asset.quantity, 0);
        const totalStockValue = stockItemsArray.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0);
        const functionalCount = assetsArray.filter(a => a.isFunctional).reduce((sum, a) => sum + a.quantity, 0);
        const nonFunctionalCount = assetsArray.filter(a => !a.isFunctional).reduce((sum, a) => sum + a.quantity, 0);

        const familyCounts = assetsArray.reduce((acc, asset) => {
            acc[asset.family] = (acc[asset.family] || 0) + asset.quantity;
            return acc;
        }, {} as { [key: string]: number });

        const assetFamilyData = Object.entries(familyCounts).map(([name, value]) => ({ name, value }));
        
        const lowStockItems = stockItemsArray.filter(item => item.currentStock <= 10).sort((a,b) => a.currentStock - b.currentStock);

        return { totalAssetValue, totalStockValue, functionalCount, nonFunctionalCount, assetFamilyData, lowStockItems };
    }, [assets, stockItems]);
    
    const COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f97316', '#ec4899'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-3">
                <BuildingOfficeIcon className="h-8 w-8 text-sky-600" />
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Tableau de Bord du Patrimoine</h2>
                    <p className="text-sm text-slate-500">Vue d'ensemble des actifs et des stocks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Valeur Totale des Actifs" value={`${totalAssetValue.toLocaleString('fr-FR')} €`} icon={<CurrencyDollarIcon className="h-8 w-8" />} onClick={onNavigateToInventory} />
                <KpiCard title="Valeur Totale du Stock" value={`${totalStockValue.toLocaleString('fr-FR')} €`} icon={<CurrencyDollarIcon className="h-8 w-8" />} onClick={onNavigateToStock} />
                <KpiCard title="Équipements Fonctionnels" value={functionalCount} icon={<CheckCircleIcon className="h-8 w-8" />} color="bg-green-100 text-green-600" onClick={onNavigateToInventory}/>
                <KpiCard title="Équipements Non-Fonctionnels" value={nonFunctionalCount} icon={<ExclamationTriangleIcon className="h-8 w-8" />} color="bg-red-100 text-red-600" onClick={onNavigateToInventory}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Répartition des Actifs par Famille</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={assetFamilyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {assetFamilyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} unités`, name]}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Stocks Faibles (≤ 10 unités)</h3>
                     {lowStockItems.length > 0 ? (
                        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2 flex-grow">
                           {lowStockItems.map(item => (
                               <li key={item.id} className="flex justify-between items-center p-2 bg-amber-50 border-l-4 border-amber-400 rounded">
                                   <span className="text-sm text-slate-700">{item.designation}</span>
                                   <span className="text-sm font-bold text-red-600">{item.currentStock} {item.unit}(s)</span>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-center text-slate-500 italic">Aucun article en stock faible.</p>
                        </div>
                    )}
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h3 className="text-lg font-semibold text-slate-700 mb-4">Actions Rapides</h3>
                 <div className="flex space-x-4">
                     <button onClick={onAddAsset} className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Ajouter un Actif
                    </button>
                    <button onClick={onAddStockEntry} className="flex items-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Enregistrer une Entrée
                    </button>
                 </div>
             </div>
        </div>
    );
};
