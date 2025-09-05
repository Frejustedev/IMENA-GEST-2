import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AtSymbolIcon } from '../icons/AtSymbolIcon';
import { LockClosedIcon } from '../icons/LockClosedIcon';
import { BeakerIcon } from '../icons/BeakerIcon';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SecureLoginPageProps {
  onSwitchToRegister: () => void;
}

/**
 * Validation côté client pour l'email
 */
const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email requis';
  if (!emailRegex.test(email)) return 'Format d\'email invalide';
  return null;
};

/**
 * Validation côté client pour le mot de passe
 */
const validatePassword = (password: string): string | null => {
  if (!password) return 'Mot de passe requis';
  if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères';
  return null;
};

export const SecureLoginPage: React.FC<SecureLoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, state, clearError } = useAuth();
  
  // État du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // État de validation
  const [validationErrors, setValidationErrors] = useState({
    email: null as string | null,
    password: null as string | null,
  });
  
  // État UI
  const [showPassword, setShowPassword] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  /**
   * Validation en temps réel
   */
  const validateField = (field: string, value: string): void => {
    let error: string | null = null;
    
    switch (field) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
    }
    
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  /**
   * Gestion des changements d'input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Valider en temps réel si l'utilisateur a déjà tenté de soumettre
    if (attemptedSubmit) {
      validateField(name, value);
    }
    
    // Effacer les erreurs du serveur
    if (state.error) {
      clearError();
    }
  };

  /**
   * Validation complète du formulaire
   */
  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    setValidationErrors({
      email: emailError,
      password: passwordError,
    });
    
    return !emailError && !passwordError;
  };

  /**
   * Soumission du formulaire
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });
      
      // Si la connexion a échoué, les erreurs sont gérées par le contexte
      if (!result.success) {
        console.error('Échec de connexion:', result.message);
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    }
  };

  /**
   * Classe CSS pour les champs d'input
   */
  const getInputClassName = (fieldName: string): string => {
    const baseClass = "appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm pl-10 transition-colors duration-200";
    const hasError = validationErrors[fieldName as keyof typeof validationErrors];
    
    if (hasError) {
      return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    
    return `${baseClass} border-gray-300 focus:ring-sky-500 focus:border-sky-500`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <BeakerIcon className="mx-auto h-12 w-auto text-sky-600" />
          <h2 className="mt-4 text-3xl font-bold text-slate-800">
            Connexion Sécurisée
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Accédez à votre espace de travail IMENA-GEST
          </p>
        </div>

        {/* Alertes de sécurité */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <LockClosedIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-blue-700">
                <strong>Sécurité renforcée :</strong> Vos données sont protégées par un chiffrement de niveau bancaire.
              </p>
            </div>
          </div>
        </div>

        {/* Erreur du serveur */}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de connexion */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Champ Email */}
          <div>
            <label htmlFor="email" className="sr-only">Adresse email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSymbolIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={getInputClassName('email')}
                placeholder="Adresse email professionnelle"
                aria-describedby={validationErrors.email ? "email-error" : undefined}
              />
            </div>
            {validationErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label htmlFor="password" className="sr-only">Mot de passe</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`${getInputClassName('password')} pr-10`}
                placeholder="Mot de passe sécurisé"
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Bouton de connexion */}
          <div>
            <button
              type="submit"
              disabled={state.isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors duration-200"
              aria-describedby="login-button-description"
            >
              {state.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter de manière sécurisée'
              )}
            </button>
            <p id="login-button-description" className="sr-only">
              Cliquez pour vous connecter avec vos identifiants sécurisés
            </p>
          </div>
        </form>

        {/* Lien d'inscription */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Nouvel utilisateur ?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-medium text-sky-600 hover:text-sky-500 focus:outline-none focus:underline transition-colors duration-200"
            >
              Créer un compte sécurisé
            </button>
          </p>
        </div>

        {/* Footer de sécurité */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            🔒 Connexion protégée par chiffrement SSL/TLS
          </p>
        </div>
      </div>

      {/* Informations de sécurité */}
      <div className="mt-8 max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Mesures de Sécurité</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Authentification à deux facteurs recommandée</li>
            <li>• Mots de passe chiffrés avec bcrypt</li>
            <li>• Session sécurisée avec tokens JWT</li>
            <li>• Surveillance des tentatives de connexion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
