import authService from './authService';
import { Role } from '../types';

export interface RoleApiResponse {
  success: boolean;
  data: {
    roles: Role[];
  };
}

export interface SingleRoleApiResponse {
  success: boolean;
  data: Role;
}

export interface CreateRoleData {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name: string;
  displayName: string;
  permissions: string[];
}

class RoleApiService {
  private basePath = '/roles';

  async getRoles(): Promise<Role[]> {
    try {
      const response = await authService.authenticatedRequest(this.basePath);
      const data: RoleApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors de la récupération des rôles');
      }
      
      return data.data.roles;
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      throw error;
    }
  }

  async createRole(roleData: CreateRoleData): Promise<Role> {
    try {
      const response = await authService.authenticatedRequest(this.basePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
      
      const data: SingleRoleApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors de la création du rôle');
      }
      
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  }

  async updateRole(roleId: string, roleData: UpdateRoleData): Promise<Role> {
    try {
      const response = await authService.authenticatedRequest(`${this.basePath}/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
      
      const data: SingleRoleApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors de la mise à jour du rôle');
      }
      
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  }

  async deleteRole(roleId: string): Promise<void> {
    try {
      const response = await authService.authenticatedRequest(`${this.basePath}/${roleId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors de la suppression du rôle');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      throw error;
    }
  }
}

export const roleApiService = new RoleApiService();
