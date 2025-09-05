/**
 * Service de gestion patrimoniale avancé pour IMENA-GEST
 * Inventaire, maintenance, comptabilité et conformité
 */

export interface Asset {
  id: string;
  family: string;
  designation: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  acquisitionYear: number;
  acquisitionCost?: number;
  currentValue?: number;
  depreciation?: number;
  isFunctional: boolean;
  currentAction?: 'En service' | 'En réparation' | 'Réformé' | 'En maintenance';
  fundingSource?: string;
  supplier?: string;
  location?: string;
  responsiblePerson?: string;
  warrantyExpiry?: string;
  nextMaintenanceDate?: string;
  maintenanceHistory: MaintenanceRecord[];
  documents: AssetDocument[];
  tags: string[];
  criticalLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'inspection' | 'calibration';
  description: string;
  performedBy: string;
  performedDate: Date;
  cost?: number;
  duration?: number; // en heures
  partsUsed?: string[];
  nextMaintenanceDate?: Date;
  notes?: string;
  status: 'completed' | 'in_progress' | 'cancelled';
}

export interface AssetDocument {
  id: string;
  name: string;
  type: 'manual' | 'warranty' | 'certificate' | 'invoice' | 'maintenance_plan' | 'other';
  uploadDate: Date;
  size: number;
  url: string;
}

export interface StockItem {
  id: string;
  designation: string;
  category: string;
  unit: string;
  budgetLine?: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  totalValue: number;
  supplier: string;
  location: string;
  expiryDate?: Date;
  batchNumber?: string;
  movements: StockMovement[];
  criticalLevel: 'normal' | 'low' | 'critical' | 'expired';
}

export interface StockMovement {
  id: string;
  date: Date;
  type: 'entry' | 'exit' | 'adjustment' | 'inventory' | 'transfer';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  documentRef?: string;
  destinationOrSource?: string;
  ordonnateur?: string;
  performer: string;
  notes?: string;
  batchNumber?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  qualityRating: number; // 1-5
  deliveryRating: number; // 1-5
  isActive: boolean;
  specialties: string[];
}

export interface InventorySession {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  performedBy: string[];
  status: 'in_progress' | 'completed' | 'cancelled';
  totalItemsPlanned: number;
  totalItemsActual: number;
  discrepancies: InventoryDiscrepancy[];
  notes?: string;
}

export interface InventoryDiscrepancy {
  itemId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  reason?: string;
  action: 'adjust' | 'investigate' | 'write_off';
}

export class PatrimonyService {
  /**
   * Calcule la dépréciation d'un équipement
   */
  static calculateDepreciation(
    acquisitionCost: number,
    acquisitionYear: number,
    usefulLife: number = 10, // années
    method: 'linear' | 'declining' = 'linear'
  ): {
    currentValue: number;
    depreciation: number;
    depreciationRate: number;
    yearsUsed: number;
  } {
    const currentYear = new Date().getFullYear();
    const yearsUsed = currentYear - acquisitionYear;
    
    if (yearsUsed <= 0) {
      return {
        currentValue: acquisitionCost,
        depreciation: 0,
        depreciationRate: 0,
        yearsUsed: 0
      };
    }

    let depreciation: number;
    let currentValue: number;

    if (method === 'linear') {
      const annualDepreciation = acquisitionCost / usefulLife;
      depreciation = Math.min(annualDepreciation * yearsUsed, acquisitionCost);
      currentValue = Math.max(acquisitionCost - depreciation, acquisitionCost * 0.1); // Valeur résiduelle 10%
    } else {
      // Méthode dégressive
      const depreciationRate = 2 / usefulLife;
      depreciation = acquisitionCost * (1 - Math.pow(1 - depreciationRate, yearsUsed));
      currentValue = acquisitionCost - depreciation;
    }

    return {
      currentValue: Math.round(currentValue * 100) / 100,
      depreciation: Math.round(depreciation * 100) / 100,
      depreciationRate: Math.round((depreciation / acquisitionCost) * 10000) / 100,
      yearsUsed
    };
  }

  /**
   * Calcule la criticité d'un équipement
   */
  static calculateCriticalLevel(asset: Asset): Asset['criticalLevel'] {
    let score = 0;

    // Facteurs de criticité
    if (!asset.isFunctional) score += 3;
    if (asset.currentAction === 'En réparation') score += 2;
    if (asset.currentAction === 'Réformé') score += 4;
    
    // Âge de l'équipement
    const age = new Date().getFullYear() - asset.acquisitionYear;
    if (age > 15) score += 2;
    else if (age > 10) score += 1;

    // Maintenance en retard
    if (asset.nextMaintenanceDate) {
      const nextMaintenance = new Date(asset.nextMaintenanceDate);
      const daysDiff = (nextMaintenance.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysDiff < -30) score += 3; // Maintenance en retard de plus de 30 jours
      else if (daysDiff < 0) score += 1;
    }

    // Garantie expirée
    if (asset.warrantyExpiry) {
      const warrantyDate = new Date(asset.warrantyExpiry);
      if (warrantyDate < new Date()) score += 1;
    }

    // Déterminer le niveau
    if (score >= 6) return 'critical';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Génère un plan de maintenance préventive
   */
  static generateMaintenancePlan(
    asset: Asset,
    maintenanceType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    description: string
  ): Date[] {
    const dates: Date[] = [];
    const startDate = new Date();
    
    let interval: number;
    switch (maintenanceType) {
      case 'daily': interval = 1; break;
      case 'weekly': interval = 7; break;
      case 'monthly': interval = 30; break;
      case 'quarterly': interval = 90; break;
      case 'yearly': interval = 365; break;
    }

    // Générer les dates pour l'année suivante
    for (let i = 0; i < 12; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + (interval * (i + 1)));
      dates.push(nextDate);
    }

    return dates;
  }

  /**
   * Calcule la valeur totale du stock
   */
  static calculateStockValue(stockItems: StockItem[]): {
    totalValue: number;
    itemCount: number;
    categoryBreakdown: Record<string, { value: number; count: number }>;
    criticalItems: number;
    lowStockItems: number;
  } {
    let totalValue = 0;
    let criticalItems = 0;
    let lowStockItems = 0;
    const categoryBreakdown: Record<string, { value: number; count: number }> = {};

    stockItems.forEach(item => {
      const itemValue = item.currentStock * item.unitPrice;
      totalValue += itemValue;

      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { value: 0, count: 0 };
      }
      categoryBreakdown[item.category].value += itemValue;
      categoryBreakdown[item.category].count += 1;

      if (item.criticalLevel === 'critical') criticalItems++;
      if (item.currentStock <= item.minStock) lowStockItems++;
    });

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      itemCount: stockItems.length,
      categoryBreakdown,
      criticalItems,
      lowStockItems
    };
  }

  /**
   * Détecte les articles en rupture ou faible stock
   */
  static detectStockAlerts(stockItems: StockItem[]): Array<{
    item: StockItem;
    alertType: 'out_of_stock' | 'low_stock' | 'expired' | 'expiring_soon';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const alerts = [];
    const now = new Date();

    for (const item of stockItems) {
      // Rupture de stock
      if (item.currentStock <= 0) {
        alerts.push({
          item,
          alertType: 'out_of_stock' as const,
          message: `Article en rupture de stock`,
          severity: 'critical' as const
        });
      }
      // Stock faible
      else if (item.currentStock <= item.minStock) {
        alerts.push({
          item,
          alertType: 'low_stock' as const,
          message: `Stock faible: ${item.currentStock}/${item.minStock} unités`,
          severity: 'high' as const
        });
      }

      // Articles expirés
      if (item.expiryDate && item.expiryDate < now) {
        alerts.push({
          item,
          alertType: 'expired' as const,
          message: `Article expiré depuis le ${item.expiryDate.toLocaleDateString('fr-FR')}`,
          severity: 'critical' as const
        });
      }
      // Articles bientôt expirés (30 jours)
      else if (item.expiryDate) {
        const daysUntilExpiry = (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          alerts.push({
            item,
            alertType: 'expiring_soon' as const,
            message: `Expire dans ${Math.ceil(daysUntilExpiry)} jours`,
            severity: daysUntilExpiry <= 7 ? 'high' : 'medium'
          });
        }
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Génère un rapport financier du patrimoine
   */
  static generateFinancialReport(assets: Asset[]): {
    totalAcquisitionValue: number;
    totalCurrentValue: number;
    totalDepreciation: number;
    byCategory: Record<string, {
      acquisitionValue: number;
      currentValue: number;
      depreciation: number;
      count: number;
    }>;
    byStatus: Record<string, { count: number; value: number }>;
    oldestAssets: Asset[];
    mostValuableAssets: Asset[];
  } {
    let totalAcquisitionValue = 0;
    let totalCurrentValue = 0;
    let totalDepreciation = 0;
    
    const byCategory: Record<string, any> = {};
    const byStatus: Record<string, any> = {};

    assets.forEach(asset => {
      const acquisitionCost = asset.acquisitionCost || 0;
      const currentValue = asset.currentValue || acquisitionCost;
      const depreciation = asset.depreciation || 0;

      totalAcquisitionValue += acquisitionCost;
      totalCurrentValue += currentValue;
      totalDepreciation += depreciation;

      // Par catégorie
      if (!byCategory[asset.family]) {
        byCategory[asset.family] = {
          acquisitionValue: 0,
          currentValue: 0,
          depreciation: 0,
          count: 0
        };
      }
      byCategory[asset.family].acquisitionValue += acquisitionCost;
      byCategory[asset.family].currentValue += currentValue;
      byCategory[asset.family].depreciation += depreciation;
      byCategory[asset.family].count += 1;

      // Par statut
      const status = asset.currentAction || 'En service';
      if (!byStatus[status]) {
        byStatus[status] = { count: 0, value: 0 };
      }
      byStatus[status].count += 1;
      byStatus[status].value += currentValue;
    });

    // Trier pour les top listes
    const oldestAssets = [...assets]
      .sort((a, b) => a.acquisitionYear - b.acquisitionYear)
      .slice(0, 5);

    const mostValuableAssets = [...assets]
      .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
      .slice(0, 5);

    return {
      totalAcquisitionValue: Math.round(totalAcquisitionValue * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalDepreciation: Math.round(totalDepreciation * 100) / 100,
      byCategory,
      byStatus,
      oldestAssets,
      mostValuableAssets
    };
  }

  /**
   * Optimise les commandes de stock (EOQ - Economic Order Quantity)
   */
  static calculateOptimalOrder(
    item: StockItem,
    annualDemand: number,
    orderingCost: number = 50, // Coût par commande
    holdingCostPercentage: number = 0.2 // 20% du coût unitaire
  ): {
    optimalOrderQuantity: number;
    reorderPoint: number;
    orderFrequency: number; // fois par an
    totalAnnualCost: number;
  } {
    const holdingCost = item.unitPrice * holdingCostPercentage;
    
    // Formule EOQ: √(2 × D × S / H)
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    
    // Point de commande (supposons un délai de livraison de 7 jours)
    const leadTimeDays = 7;
    const dailyDemand = annualDemand / 365;
    const reorderPoint = Math.ceil(dailyDemand * leadTimeDays * 1.2); // Marge de sécurité 20%
    
    const orderFrequency = annualDemand / eoq;
    const totalAnnualCost = (annualDemand / eoq) * orderingCost + (eoq / 2) * holdingCost;

    return {
      optimalOrderQuantity: Math.ceil(eoq),
      reorderPoint: Math.max(reorderPoint, item.minStock),
      orderFrequency: Math.round(orderFrequency * 100) / 100,
      totalAnnualCost: Math.round(totalAnnualCost * 100) / 100
    };
  }

  /**
   * Génère des alertes de maintenance
   */
  static generateMaintenanceAlerts(assets: Asset[]): Array<{
    asset: Asset;
    alertType: 'overdue' | 'due_soon' | 'warranty_expired' | 'calibration_due';
    message: string;
    daysOverdue?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const alerts = [];
    const now = new Date();

    for (const asset of assets) {
      // Maintenance en retard
      if (asset.nextMaintenanceDate) {
        const nextDate = new Date(asset.nextMaintenanceDate);
        const daysDiff = (now.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0) {
          alerts.push({
            asset,
            alertType: 'overdue',
            message: `Maintenance en retard de ${Math.ceil(daysDiff)} jours`,
            daysOverdue: Math.ceil(daysDiff),
            severity: daysDiff > 30 ? 'critical' : daysDiff > 7 ? 'high' : 'medium'
          });
        } else if (daysDiff > -7) {
          alerts.push({
            asset,
            alertType: 'due_soon',
            message: `Maintenance dans ${Math.abs(Math.floor(daysDiff))} jours`,
            severity: 'medium'
          });
        }
      }

      // Garantie expirée
      if (asset.warrantyExpiry) {
        const warrantyDate = new Date(asset.warrantyExpiry);
        if (warrantyDate < now) {
          const daysExpired = (now.getTime() - warrantyDate.getTime()) / (1000 * 60 * 60 * 24);
          alerts.push({
            asset,
            alertType: 'warranty_expired',
            message: `Garantie expirée depuis ${Math.ceil(daysExpired)} jours`,
            severity: 'low'
          });
        }
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
}
