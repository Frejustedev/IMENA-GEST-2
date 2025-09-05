import { User, Role } from '../types';

/**
 * Interface pour les tokens JWT
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    role?: Role;
    tokens: AuthTokens;
  };
  code?: string;
}

/**
 * Interface pour les données de connexion
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface pour les données d'inscription
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  roleId: string;
}

/**
 * Configuration de l'API
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
const TOKEN_STORAGE_KEY = 'imena_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'imena_refresh_token';
const USER_STORAGE_KEY = 'imena_user_data';

/**
 * Service d'authentification sécurisé
 */
export class AuthService {
  private static instance: AuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeFromStorage();
    this.setupTokenRefresh();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialise les données depuis le stockage local
   */
  private initializeFromStorage(): void {
    try {
      this.accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        this.user = JSON.parse(userData);
      }

      // Vérifier si le token est expiré
      if (this.accessToken && this.isTokenExpired(this.accessToken)) {
        this.clearTokens();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation depuis le stockage:', error);
      this.clearTokens();
    }
  }

  /**
   * Vérifie si un token est expiré
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Configure le rafraîchissement automatique des tokens
   */
  private setupTokenRefresh(): void {
    if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const refreshTime = expirationTime - Date.now() - 60000; // 1 minute avant expiration

      if (refreshTime > 0) {
        this.refreshTimeout = setTimeout(() => {
          this.refreshAccessToken();
        }, refreshTime);
      }
    }
  }

  /**
   * Effectue une requête HTTP sécurisée
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
        ...options?.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, defaultOptions);

      // Si le token est expiré, essayer de le rafraîchir
      if (response.status === 401 && this.refreshToken) {
        const refreshSuccess = await this.refreshAccessToken();
        if (refreshSuccess) {
          // Retry la requête avec le nouveau token
          defaultOptions.headers = {
            ...defaultOptions.headers,
            'Authorization': `Bearer ${this.accessToken}`,
          };
          return await fetch(url, defaultOptions);
        }
      }

      return response;
    } catch (error) {
      console.error('Erreur de requête:', error);
      throw new Error('Erreur de connexion au serveur');
    }
  }

  /**
   * Connexion utilisateur
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.setTokens(data.data.tokens);
        this.setUser(data.data.user);
        this.setupTokenRefresh();
      }

      return data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Inscription utilisateur
   */
  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.setTokens(data.data.tokens);
        this.setUser(data.data.user);
        this.setupTokenRefresh();
      }

      return data;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Déconnexion utilisateur
   */
  public async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.clearTokens();
      this.clearRefreshTimeout();
    }
  }

  /**
   * Rafraîchit le token d'accès
   */
  public async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      this.clearTokens();
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data?.tokens) {
        this.setTokens(data.data.tokens);
        this.setupTokenRefresh();
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Changement de mot de passe
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Récupère le profil utilisateur
   */
  public async getProfile(): Promise<{ success: boolean; data?: { user: User; role?: Role } }> {
    try {
      const response = await this.makeRequest('/auth/profile');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return { success: false };
    }
  }

  /**
   * Définit les tokens et les stocke
   */
  private setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    localStorage.setItem(TOKEN_STORAGE_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  }

  /**
   * Définit l'utilisateur et le stocke
   */
  private setUser(user: User): void {
    this.user = user;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Efface tous les tokens et données utilisateur
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  /**
   * Efface le timeout de rafraîchissement
   */
  private clearRefreshTimeout(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  /**
   * Getters publics
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getUser(): User | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return !!(this.accessToken && !this.isTokenExpired(this.accessToken));
  }

  /**
   * Effectue une requête authentifiée
   */
  public async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated()) {
      throw new Error('Utilisateur non authentifié');
    }

    return this.makeRequest(endpoint, options);
  }
}

// Export de l'instance singleton
export default AuthService.getInstance();
