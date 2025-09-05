import React, { useState, FormEvent, useEffect } from 'react';
import { StockItem } from '../types';

interface StockItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Partial<Omit<StockItem, 'movements' | 'currentStock' | 'unitPrice'>>) => void;
  initialData?: StockItem | null;
}

export const StockItemFormModal: React.FC<StockItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({ designation: '', unit: '', budgetLine: '' });
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          designation: initialData.designation,
          unit: initialData.unit,
          budgetLine: initialData.budgetLine || '',
        });
      } else {
        setFormData({ designation: '', unit: '', budgetLine: '' });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.designation || !formData.unit) {
      alert('La désignation et l\'unité sont obligatoires.');
      return;
    }
    onSubmit({ ...formData, id: initialData?.id });
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Modifier' : 'Ajouter'} un Article de Stock</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="designation" className={commonLabelClass}>Désignation <span className="text-red-500">*</span></label>
                <input type="text" name="designation" id="designation" value={formData.designation} onChange={handleChange} className={commonInputClass} required />
              </div>
              <div>
                <label htmlFor="unit" className={commonLabelClass}>Unité <span className="text-red-500">*</span></label>
                <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className={commonInputClass} placeholder="pièce, boîte, ramette..." required />
              </div>
              <div>
                <label htmlFor="budgetLine" className={commonLabelClass}>Ligne Budgétaire</label>
                <input type="text" name="budgetLine" id="budgetLine" value={formData.budgetLine} onChange={handleChange} className={commonInputClass} />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">{isEditing ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
