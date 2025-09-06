/**
 * Service API centralisé pour IMENA-GEST
 * Gère toutes les requêtes HTTP avec authentification automatique
 */

// Configuration de l'API - utilise la même logique que authService
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

export class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Effectue une requête HTTP avec authentification automatique
   */
  public async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('imena_access_token');
    
    const defaultOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, defaultOptions);
      return response;
    } catch (error) {
      console.error('Erreur de requête API:', error);
      throw new Error('Erreur de connexion au serveur');
    }
  }

  /**
   * GET request
   */
  public async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  public async post(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  public async put(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  public async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Instance singleton exportée
export const apiService = ApiService.getInstance();
