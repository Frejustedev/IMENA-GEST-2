/**
 * Service de monitoring et logs centralisés pour IMENA-GEST
 * Surveillance système, métriques et alertes opérationnelles
 */

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'system' | 'security' | 'medical' | 'user' | 'performance' | 'audit';
  source: string;
  userId?: string;
  sessionId?: string;
  message: string;
  data?: any;
  duration?: number; // en ms
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface SystemMetric {
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  details?: any;
  dependencies?: HealthCheck[];
}

export interface Alert {
  id: string;
  timestamp: Date;
  type: 'performance' | 'security' | 'system' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  conditions: any;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: string[];
}

export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    activeUsers: number;
    peakConcurrency: number;
  };
  errors: {
    errorRate: number;
    criticalErrors: number;
    timeouts: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
}

export class MonitoringService {
  private static logs: LogEntry[] = [];
  private static metrics: SystemMetric[] = [];
  private static healthChecks: Map<string, HealthCheck> = new Map();
  private static alerts: Alert[] = [];
  
  /**
   * Enregistre un log dans SQLite
   */
  static async log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    source: string,
    message: string,
    data?: any,
    userId?: string,
    duration?: number
  ): Promise<LogEntry> {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      source,
      message,
      data,
      userId,
      duration,
      correlationId: this.generateCorrelationId()
    };

    try {
      // Envoyer le log vers l'API SQLite
      const response = await fetch('/api/v1/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          level,
          category,
          source,
          message,
          data,
          duration
        })
      });

      if (!response.ok) {
        console.error('Erreur lors de l\'envoi du log vers SQLite');
        // Fallback en mémoire si l'API échoue
        this.logs.push(logEntry);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du log:', error);
      // Fallback en mémoire si l'API échoue
      this.logs.push(logEntry);
    }

    // Limiter le nombre de logs en mémoire (fallback seulement)
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }

    // Auto-génération d'alertes pour les erreurs critiques
    if (level === 'critical' || level === 'error') {
      this.checkForAlertConditions(logEntry);
    }

    return logEntry;
  }

  /**
   * Logs spécialisés par domaine
   */
  static logMedical(action: string, patientId: string, userId: string, details?: any) {
    return this.log('info', 'medical', 'medical_system', 
      `Action médicale: ${action}`, 
      { patientId, ...details }, 
      userId
    );
  }

  static logSecurity(event: string, userId?: string, ipAddress?: string, severity: 'info' | 'warn' | 'error' = 'warn') {
    return this.log(severity, 'security', 'security_system', 
      `Événement sécurité: ${event}`, 
      { ipAddress }, 
      userId
    );
  }

  static logPerformance(operation: string, duration: number, success: boolean, details?: any) {
    return this.log(success ? 'info' : 'warn', 'performance', 'performance_monitor', 
      `Opération: ${operation} (${duration}ms)`, 
      details, 
      undefined, 
      duration
    );
  }

  /**
   * Enregistre une métrique système
   */
  static recordMetric(metric: string, value: number, unit: string, tags: Record<string, string> = {}) {
    const metricEntry: SystemMetric = {
      timestamp: new Date(),
      metric,
      value,
      unit,
      tags
    };

    this.metrics.push(metricEntry);
    
    // Limiter les métriques en mémoire (garder 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);

    return metricEntry;
  }

  /**
   * Vérifie la santé d'un service
   */
  static async checkHealth(serviceName: string, checkFunction: () => Promise<any>): Promise<HealthCheck> {
    const startTime = Date.now();
    let status: HealthCheck['status'] = 'healthy';
    let details: any = {};

    try {
      const result = await Promise.race([
        checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);
      
      details = result;
    } catch (error) {
      status = 'unhealthy';
      details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    const responseTime = Date.now() - startTime;
    
    if (responseTime > 3000) {
      status = status === 'healthy' ? 'degraded' : status;
    }

    const healthCheck: HealthCheck = {
      service: serviceName,
      status,
      lastCheck: new Date(),
      responseTime,
      details
    };

    this.healthChecks.set(serviceName, healthCheck);
    
    // Log si service dégradé
    if (status !== 'healthy') {
      this.log('warn', 'system', 'health_checker', 
        `Service ${serviceName} status: ${status}`, 
        { responseTime, details }
      );
    }

    return healthCheck;
  }

  /**
   * Obtient l'état global du système
   */
  static getSystemHealth(): {
    overall: HealthCheck['status'];
    services: HealthCheck[];
    lastUpdate: Date;
    criticalIssues: string[];
  } {
    const services = Array.from(this.healthChecks.values());
    const criticalIssues: string[] = [];
    
    let overall: HealthCheck['status'] = 'healthy';
    
    for (const service of services) {
      if (service.status === 'unhealthy') {
        overall = 'unhealthy';
        criticalIssues.push(`${service.service}: indisponible`);
      } else if (service.status === 'degraded' && overall === 'healthy') {
        overall = 'degraded';
        criticalIssues.push(`${service.service}: performances dégradées`);
      }
    }

    return {
      overall,
      services,
      lastUpdate: new Date(),
      criticalIssues
    };
  }

  /**
   * Génère des métriques de performance
   */
  static generatePerformanceReport(timeRange: 'last_hour' | 'last_day' | 'last_week' = 'last_hour'): PerformanceMetrics {
    const now = Date.now();
    let startTime: number;
    
    switch (timeRange) {
      case 'last_hour': startTime = now - 60 * 60 * 1000; break;
      case 'last_day': startTime = now - 24 * 60 * 60 * 1000; break;
      case 'last_week': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
    }

    const recentLogs = this.logs.filter(log => 
      log.timestamp.getTime() > startTime && log.category === 'performance'
    );

    const recentMetrics = this.metrics.filter(metric => 
      metric.timestamp.getTime() > startTime
    );

    // Calcul des temps de réponse
    const responseTimes = recentLogs
      .filter(log => log.duration !== undefined)
      .map(log => log.duration!)
      .sort((a, b) => a - b);

    const responseTime = {
      avg: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      p50: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.5)] : 0,
      p95: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
      p99: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0,
    };

    // Calcul du débit
    const requestCount = recentLogs.filter(log => log.source.includes('request')).length;
    const timeRangeHours = (now - startTime) / (1000 * 60 * 60);
    const requestsPerSecond = Math.round((requestCount / timeRangeHours) / 3600 * 100) / 100;

    // Calcul des erreurs
    const errorLogs = recentLogs.filter(log => log.level === 'error' || log.level === 'critical');
    const errorRate = recentLogs.length > 0 ? Math.round((errorLogs.length / recentLogs.length) * 10000) / 100 : 0;

    // Métriques système (simulées)
    const cpuMetrics = recentMetrics.filter(m => m.metric === 'cpu_usage');
    const memoryMetrics = recentMetrics.filter(m => m.metric === 'memory_usage');

    return {
      responseTime,
      throughput: {
        requestsPerSecond,
        activeUsers: this.getActiveUsersCount(),
        peakConcurrency: Math.max(...recentMetrics.filter(m => m.metric === 'concurrent_users').map(m => m.value), 0)
      },
      errors: {
        errorRate,
        criticalErrors: errorLogs.filter(log => log.level === 'critical').length,
        timeouts: errorLogs.filter(log => log.message.includes('timeout')).length
      },
      resources: {
        cpuUsage: cpuMetrics.length > 0 ? cpuMetrics[cpuMetrics.length - 1].value : 0,
        memoryUsage: memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0,
        diskUsage: 0, // À implémenter
        networkIO: 0  // À implémenter
      }
    };
  }

  /**
   * Crée une alerte
   */
  static createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    description: string,
    source: string,
    conditions: any
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      severity,
      title,
      description,
      source,
      conditions,
      acknowledged: false,
      resolved: false,
      actions: this.generateAlertActions(type, severity, conditions)
    };

    this.alerts.push(alert);
    
    // Log l'alerte
    this.log(severity === 'critical' ? 'critical' : 'warn', 'system', 'alert_manager', 
      `Alerte créée: ${title}`, 
      { alertId: alert.id, type, severity }
    );

    return alert;
  }

  /**
   * Reconnaissance d'une alerte
   */
  static acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    this.log('info', 'system', 'alert_manager', 
      `Alerte acquittée: ${alert.title}`, 
      { alertId, userId }
    );

    return true;
  }

  /**
   * Résolution d'une alerte
   */
  static resolveAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.log('info', 'system', 'alert_manager', 
      `Alerte résolue: ${alert.title}`, 
      { alertId, userId }
    );

    return true;
  }

  /**
   * Recherche dans les logs
   */
  static searchLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    level?: LogEntry['level'];
    category?: LogEntry['category'];
    source?: string;
    userId?: string;
    message?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }
    
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }
    
    if (filters.source) {
      filteredLogs = filteredLogs.filter(log => log.source.includes(filters.source!));
    }
    
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.message) {
      const searchTerm = filters.message.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    // Trier par timestamp décroissant
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limiter les résultats
    const limit = filters.limit || 1000;
    return filteredLogs.slice(0, limit);
  }

  /**
   * Obtient le dashboard de monitoring
   */
  static getDashboard(): {
    systemHealth: ReturnType<typeof MonitoringService.getSystemHealth>;
    performance: PerformanceMetrics;
    recentAlerts: Alert[];
    recentErrors: LogEntry[];
    metrics: {
      totalLogs: number;
      errorRate: number;
      activeAlerts: number;
      systemUptime: string;
    };
  } {
    const systemHealth = this.getSystemHealth();
    const performance = this.generatePerformanceReport('last_hour');
    const recentAlerts = this.alerts
      .filter(a => !a.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    const recentErrors = this.logs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    const totalLogs = this.logs.length;
    const errorLogs = this.logs.filter(log => log.level === 'error' || log.level === 'critical');
    const errorRate = totalLogs > 0 ? Math.round((errorLogs.length / totalLogs) * 10000) / 100 : 0;
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;

    return {
      systemHealth,
      performance,
      recentAlerts,
      recentErrors,
      metrics: {
        totalLogs,
        errorRate,
        activeAlerts,
        systemUptime: this.calculateUptime()
      }
    };
  }

  // Méthodes privées utilitaires
  private static generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static checkForAlertConditions(logEntry: LogEntry) {
    // Vérifier les conditions d'alertes automatiques
    const recentErrors = this.logs.filter(log => 
      log.level === 'error' && 
      log.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // 5 minutes
    );

    if (recentErrors.length > 10) {
      this.createAlert(
        'system',
        'high',
        'Taux d\'erreur élevé',
        `${recentErrors.length} erreurs dans les 5 dernières minutes`,
        'error_monitor',
        { errorCount: recentErrors.length, timeWindow: '5min' }
      );
    }

    if (logEntry.level === 'critical') {
      this.createAlert(
        'system',
        'critical',
        'Erreur critique détectée',
        logEntry.message,
        logEntry.source,
        { logId: logEntry.id }
      );
    }
  }

  private static generateAlertActions(type: Alert['type'], severity: Alert['severity'], conditions: any): string[] {
    const actions = ['Enquêter sur la cause', 'Vérifier les logs associés'];
    
    if (severity === 'critical') {
      actions.unshift('Notification immédiate équipe technique');
    }
    
    if (type === 'security') {
      actions.push('Examiner les tentatives d\'accès', 'Vérifier l\'intégrité du système');
    }
    
    if (type === 'performance') {
      actions.push('Vérifier les ressources système', 'Analyser les goulots d\'étranglement');
    }

    return actions;
  }

  private static getActiveUsersCount(): number {
    // Compter les utilisateurs actifs dans la dernière heure
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUserLogs = this.logs.filter(log => 
      log.timestamp > oneHourAgo && log.userId
    );
    
    const uniqueUsers = new Set(recentUserLogs.map(log => log.userId));
    return uniqueUsers.size;
  }

  private static calculateUptime(): string {
    // Simuler le calcul d'uptime (en production, utiliser le timestamp de démarrage)
    const uptimeHours = Math.floor(Math.random() * 720 + 48); // Entre 48h et 30 jours
    const days = Math.floor(uptimeHours / 24);
    const hours = uptimeHours % 24;
    
    return `${days}j ${hours}h`;
  }
}
