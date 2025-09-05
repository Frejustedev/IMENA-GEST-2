import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../services/authService';

/**
 * Hook personnalisé pour les actions d'authentification
 * Simplifie l'utilisation dans les composants
 */
export const useAuthActions = () => {
  const { state, login, logout, clearError } = useAuth();

  /**
   * Connexion avec gestion d'erreur simplifiée
   */
  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      clearError();
      const response = await login(credentials);
      
      if (!response.success) {
        return {
          success: false,
          message: response.message || 'Erreur de connexion'
        };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion au serveur'
      };
    }
  }, [login, clearError]);

  /**
   * Déconnexion sécurisée
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return {
        success: false,
        message: 'Erreur lors de la déconnexion'
      };
    }
  }, [logout]);

  /**
   * Vérification rapide de l'authentification
   */
  const isLoggedIn = useCallback(() => {
    return state.isAuthenticated && !!state.user;
  }, [state.isAuthenticated, state.user]);

  /**
   * Récupération des informations utilisateur
   */
  const getUserInfo = useCallback(() => {
    return {
      user: state.user,
      role: state.role,
      isAdmin: state.role?.name === 'Administrateur(trice)',
      permissions: state.role?.permissions || []
    };
  }, [state.user, state.role]);

  return {
    // État
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    role: state.role,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    clearError,
    
    // Utilitaires
    isLoggedIn,
    getUserInfo
  };
};

export default useAuthActions;
