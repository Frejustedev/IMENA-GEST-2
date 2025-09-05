import React, { useState, FormEvent, useEffect } from 'react';
import { Asset } from '../types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: Asset | Omit<Asset, 'id'>) => void;
  initialData?: Asset | null;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          family: '',
          designation: '',
          quantity: 1,
          acquisitionYear: new Date().getFullYear(),
          isFunctional: true,
          currentAction: 'En service',
        });
      }
    }
  }, [isOpen, initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
        finalValue = value ? parseFloat(value) : '';
    }
    if (name === 'isFunctional') {
        finalValue = value === 'true';
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.family || !formData.designation || !formData.quantity || !formData.acquisitionYear) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    onSubmit(formData as Asset | Omit<Asset, 'id'>);
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";
  const requiredStar = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Modifier' : 'Ajouter'} un Actif</h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="family" className={commonLabelClass}>Famille d'équipement {requiredStar}</label><input type="text" name="family" id="family" value={formData.family || ''} onChange={handleChange} className={commonInputClass} required /></div>
                <div><label htmlFor="designation" className={commonLabelClass}>Désignation {requiredStar}</label><input type="text" name="designation" id="designation" value={formData.designation || ''} onChange={handleChange} className={commonInputClass} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label htmlFor="brand" className={commonLabelClass}>Marque</label><input type="text" name="brand" id="brand" value={formData.brand || ''} onChange={handleChange} className={commonInputClass} /></div>
                <div><label htmlFor="model" className={commonLabelClass}>Modèle</label><input type="text" name="model" id="model" value={formData.model || ''} onChange={handleChange} className={commonInputClass} /></div>
                <div><label htmlFor="serialNumber" className={commonLabelClass}>N° Série</label><input type="text" name="serialNumber" id="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className={commonInputClass} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label htmlFor="quantity" className={commonLabelClass}>Quantité {requiredStar}</label><input type="number" name="quantity" id="quantity" value={formData.quantity || ''} onChange={handleChange} className={commonInputClass} min="1" required /></div>
                <div><label htmlFor="acquisitionYear" className={commonLabelClass}>Année d'acquisition {requiredStar}</label><input type="number" name="acquisitionYear" id="acquisitionYear" value={formData.acquisitionYear || ''} onChange={handleChange} className={commonInputClass} min="1900" max={new Date().getFullYear() + 1} required /></div>
                <div><label htmlFor="acquisitionCost" className={commonLabelClass}>Coût d'acquisition</label><input type="number" name="acquisitionCost" id="acquisitionCost" value={formData.acquisitionCost || ''} onChange={handleChange} className={commonInputClass} min="0" step="0.01" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="isFunctional" className={commonLabelClass}>État de fonctionnement {requiredStar}</label><select name="isFunctional" id="isFunctional" value={String(formData.isFunctional)} onChange={handleChange} className={commonInputClass} required><option value="true">Fonctionnel</option><option value="false">Non Fonctionnel</option></select></div>
                <div><label htmlFor="currentAction" className={commonLabelClass}>Action</label><select name="currentAction" id="currentAction" value={formData.currentAction || ''} onChange={handleChange} className={commonInputClass}><option value="En service">En service</option><option value="En réparation">En réparation</option><option value="Réformé">Réformé (Mise à la réforme)</option></select></div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="fundingSource" className={commonLabelClass}>Source de Financement</label><input type="text" name="fundingSource" id="fundingSource" value={formData.fundingSource || ''} onChange={handleChange} className={commonInputClass} /></div>
                <div><label htmlFor="supplier" className={commonLabelClass}>Fournisseur</label><input type="text" name="supplier" id="supplier" value={formData.supplier || ''} onChange={handleChange} className={commonInputClass} /></div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md">{isEditing ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
