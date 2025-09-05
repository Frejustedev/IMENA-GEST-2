import React, { useState } from 'react';
import { User, Role, ALL_PERMISSIONS } from '../types';
import { Cog8ToothIcon } from './icons/Cog8ToothIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserFormModal } from './UserFormModal';
import { RoleFormModal } from './RoleFormModal';

interface AdministrationViewProps {
  users: User[];
  roles: Role[];
  onSaveUser: (user: User | Omit<User, 'id'>) => Promise<void>;
  onDeleteUser: (userId: string) => void;
  onSaveRole: (role: Role | Omit<Role, 'id'>) => Promise<void>;
  onDeleteRole: (role: Role) => void;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({ 
    users, 
    roles, 
    onSaveUser, 
    onDeleteUser, 
    onSaveRole, 
    onDeleteRole 
}) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };
  
  const handleOpenAddRoleModal = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRoleClick = (role: Role) => {
    if (role.name === 'Administrateur(trice)') {
        alert("Le rôle Administrateur ne peut pas être supprimé.");
        return;
    }
    onDeleteRole(role);
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'N/A';

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
            <Cog8ToothIcon className="h-8 w-8 text-sky-600" />
            <div>
            <h2 className="text-3xl font-bold text-slate-800">Administration</h2>
            <p className="text-sm text-slate-500">Gérez les utilisateurs, les rôles et les paramètres du système.</p>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-700">Liste des Utilisateurs</h3>
            <button
                onClick={handleOpenAddUserModal}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150"
                title="Ajouter un nouvel utilisateur"
            >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Ajouter Utilisateur
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getRoleName(user.roleId)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleOpenEditUserModal(user)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Modifier">
                                <PencilIcon className="h-5 w-5"/>
                            </button>
                            {getRoleName(user.roleId) !== 'Administrateur(trice)' && (
                                <button onClick={() => onDeleteUser(user.id)} className="text-red-600 hover:text-red-900 p-1" title="Supprimer">
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-700">Gestion des Rôles</h3>
            <button
                onClick={handleOpenAddRoleModal}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150"
                title="Ajouter un nouveau rôle"
            >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Ajouter Rôle
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom du Rôle</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Permissions</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {roles.map((role) => (
                        <tr key={role.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{role.name}</td>
                            <td className="px-6 py-4 whitespace-normal text-sm text-slate-500">
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.map(p => (
                                        <span key={p} className="bg-sky-100 text-sky-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {ALL_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => handleOpenEditRoleModal(role)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Modifier">
                                    <PencilIcon className="h-5 w-5"/>
                                </button>
                                {role.name !== 'Administrateur(trice)' && (
                                    <button onClick={() => handleDeleteRoleClick(role)} className="text-red-600 hover:text-red-900 p-1" title="Supprimer">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={onSaveUser}
        initialData={editingUser}
        roles={roles}
      />
      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSubmit={onSaveRole}
        initialData={editingRole}
      />
    </div>
  );
};