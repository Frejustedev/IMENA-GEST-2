import React, { useState, FormEvent } from 'react';
import { Role } from '../types';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { BeakerIcon } from './icons/BeakerIcon';

interface RegisterPageProps {
  onRegister: (name: string, email: string, password: string, roleId: string) => Promise<{ success: boolean; message?: string }>;
  onSwitchToLogin: () => void;
  roles: Role[];
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onSwitchToLogin, roles }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableRoles = roles.filter(r => r.name !== 'Administrateur(trice)');
  
  // Set default roleId if not already set and availableRoles is populated
  if (!roleId && availableRoles.length > 0) {
      setRoleId(availableRoles[0].id);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !roleId) {
        setError("Veuillez remplir tous les champs.");
        return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError('');
    setIsLoading(true);
    const result = await onRegister(name, email, password, roleId);
    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
            <BeakerIcon className="mx-auto h-12 w-auto text-sky-600" />
            <h2 className="mt-4 text-3xl font-bold text-slate-800">
                Créer un Compte
            </h2>
            <p className="mt-2 text-sm text-slate-600">
                Rejoignez la plateforme de gestion patient.
            </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="sr-only">Nom complet</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm pl-10"
                    placeholder="Nom complet" />
            </div>
          </div>
          <div>
            <label htmlFor="email-address" className="sr-only">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSymbolIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm pl-10"
                    placeholder="Adresse email" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Mot de passe</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm pl-10"
                    placeholder="Mot de passe" />
            </div>
          </div>
           <div>
            <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm pl-10"
                    placeholder="Confirmer le mot de passe" />
            </div>
          </div>
          <div>
            <label htmlFor="role" className="sr-only">Rôle</label>
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select id="role" name="role" value={roleId} onChange={(e) => setRoleId(e.target.value)} required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm pl-10">
                    {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded">
              <p>{error}</p>
            </div>
          )}

          <div>
            <button type="submit" disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300">
              {isLoading ? 'Inscription en cours...' : "S'inscrire"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          Déjà un compte ?{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-sky-600 hover:text-sky-500 focus:outline-none">
            Connectez-vous
          </button>
        </p>
      </div>
    </div>
  );
};