import React, { useState, FormEvent, useEffect } from 'react';
import { Role, Permission, ALL_PERMISSIONS } from '../types';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (role: Role | Omit<Role, 'id'>) => void;
  initialData?: Role | null;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Role>>({ name: '', permissions: [] });
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { name: '', permissions: [] });
      setError('');
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionId: Permission, checked: boolean) => {
    setFormData(prev => {
        const currentPermissions = prev.permissions || [];
        if (checked) {
            return { ...prev, permissions: [...currentPermissions, permissionId] };
        } else {
            return { ...prev, permissions: currentPermissions.filter(p => p !== permissionId) };
        }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Le nom du rôle est obligatoire.');
      return;
    }
    onSubmit(formData as Role | Omit<Role, 'id'>);
    onClose();
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";
  const commonCheckboxLabelClass = "flex items-center space-x-2 text-sm text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Modifier' : 'Ajouter'} un rôle</h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            <div>
              <label htmlFor="name" className={commonLabelClass}>Nom du Rôle <span className="text-red-500">*</span></label>
              <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={commonInputClass} required />
            </div>
            <fieldset>
                <legend className="text-md font-semibold text-gray-800">Permissions</legend>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-64 overflow-y-auto border p-3 rounded-md bg-slate-50">
                    {ALL_PERMISSIONS.map(permission => (
                        <label key={permission.id} className={commonCheckboxLabelClass}>
                            <input 
                                type="checkbox"
                                name={permission.id}
                                checked={formData.permissions?.includes(permission.id) || false}
                                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span>{permission.label}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
            {error && <p className="text-sm text-red-600">{error}</p>}
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