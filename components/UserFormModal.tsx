import React, { useState, FormEvent, useEffect } from 'react';
import { User, Role } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User | Omit<User, 'id'>) => void;
  initialData?: User | null;
  roles: Role[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  roles
}) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [error, setError] = useState('');

  const isEditing = !!initialData;
  
  // Admins can't have their role changed, and non-admins can't be made admins
  const adminRole = roles.find(r => r.name === 'Administrateur(trice)');
  const isEditingAdmin = isEditing && initialData.roleId === adminRole?.id;

  const availableRoles = isEditingAdmin ? roles.filter(r => r.id === adminRole?.id) : roles.filter(r => r.id !== adminRole?.id);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
          setFormData(initialData);
      } else {
          setFormData({ roleId: availableRoles[0]?.id || '' });
      }
      setError('');
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.roleId || (!isEditing && !formData.passwordHash)) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    onSubmit(formData as User);
    onClose();
  };

  if (!isOpen) return null;

  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Modifier' : 'Ajouter'} un utilisateur</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className={commonLabelClass}>Nom complet <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={commonInputClass} required />
              </div>
              <div>
                <label htmlFor="email" className={commonLabelClass}>Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className={commonInputClass} required />
              </div>
              <div>
                <label htmlFor="passwordHash" className={commonLabelClass}>Mot de passe {isEditing ? '(laisser vide pour ne pas changer)' : <span className="text-red-500">*</span>}</label>
                <input type="password" name="passwordHash" id="passwordHash" value={formData.passwordHash || ''} onChange={handleChange} className={commonInputClass} required={!isEditing} />
              </div>
              <div>
                <label htmlFor="roleId" className={commonLabelClass}>Rôle <span className="text-red-500">*</span></label>
                <select name="roleId" id="roleId" value={formData.roleId} onChange={handleChange} className={`${commonInputClass} ${isEditingAdmin ? 'bg-gray-100' : ''}`} required disabled={isEditingAdmin}>
                  {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">{isEditing ? 'Enregistrer les modifications' : 'Ajouter l\'utilisateur'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};