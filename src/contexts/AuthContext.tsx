import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  };
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  enable2FA: () => Promise<{ qrCode: string; secret: string }>;
  confirm2FA: (totpCode: string) => Promise<void>;
  disable2FA: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier le token au chargement
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getAccessToken();
        if (token) {
          const profileData = await authService.getProfile();
          if (profileData.success && profileData.data) {
            setUser(profileData.data.user);
          }
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        authService.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Rafraîchir le token automatiquement
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        try {
          await authService.refreshTokens();
        } catch (error) {
          console.error('Erreur refresh token:', error);
          // Si le refresh échoue, déconnecter l'utilisateur
          logout();
        }
      }
    }, 10 * 60 * 1000); // Toutes les 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Rediriger si changement de mot de passe requis
        if (response.data.user.mustChangePassword) {
          window.location.href = '/change-password';
        }
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
      
      return response; // Retourner la réponse pour LoginPage
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      setUser(null);
      authService.clearTokens();
      window.location.href = '/login';
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshTokens();
    } catch (error) {
      console.error('Erreur refresh:', error);
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      // Mettre à jour l'utilisateur
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      throw error;
    }
  }, [user]);

  const enable2FA = useCallback(async () => {
    try {
      return await authService.enable2FA();
    } catch (error) {
      console.error('Erreur activation 2FA:', error);
      throw error;
    }
  }, []);

  const confirm2FA = useCallback(async (totpCode: string) => {
    try {
      await authService.confirm2FA(totpCode);
      // Mettre à jour l'utilisateur
      if (user) {
        setUser({ ...user, twoFactorEnabled: true });
      }
    } catch (error) {
      console.error('Erreur confirmation 2FA:', error);
      throw error;
    }
  }, [user]);

  const disable2FA = useCallback(async (password: string) => {
    try {
      await authService.disable2FA(password);
      // Mettre à jour l'utilisateur
      if (user) {
        setUser({ ...user, twoFactorEnabled: false });
      }
    } catch (error) {
      console.error('Erreur désactivation 2FA:', error);
      throw error;
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    changePassword,
    enable2FA,
    confirm2FA,
    disable2FA
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};