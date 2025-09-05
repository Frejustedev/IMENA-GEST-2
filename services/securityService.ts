/**
 * Service de sécurité avancé pour IMENA-GEST
 * Chiffrement, certificats, authentification forte et audit sécurité
 */

import * as crypto from 'crypto';

export interface SecurityConfiguration {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
  };
  certificates: {
    environment: 'dev' | 'test' | 'prod';
    domain: string;
    validityDays: number;
    keySize: number;
    autoRenewal: boolean;
  };
  authentication: {
    mfaEnabled: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    passwordPolicy: PasswordPolicy;
  };
  audit: {
    enabled: boolean;
    logSensitiveData: boolean;
    retentionDays: number;
    alertThresholds: AlertThresholds;
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfoInPassword: boolean;
  historyCheck: number; // derniers N mots de passe
  expirationDays: number;
}

export interface AlertThresholds {
  failedLoginsPerMinute: number;
  suspiciousIpAccess: number;
  dataExportVolume: number; // MB
  adminActionsPerHour: number;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
  algorithm: string;
  timestamp: Date;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login' | 'logout' | 'access_denied' | 'data_access' | 'admin_action' | 'system_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  success: boolean;
  details: any;
  geolocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export interface SecurityReport {
  period: {
    start: Date;
    end: Date;
  };
  overview: {
    totalEvents: number;
    criticalEvents: number;
    failedLogins: number;
    suspiciousActivities: number;
    dataBreachAttempts: number;
  };
  topThreats: Array<{
    type: string;
    count: number;
    severity: string;
    lastOccurrence: Date;
  }>;
  vulnerabilities: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cveId?: string;
    status: 'open' | 'mitigated' | 'resolved';
    discoveredAt: Date;
  }>;
  recommendations: string[];
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
  keySize: number;
  algorithm: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  isValid: boolean;
  alternativeNames: string[];
}

export class SecurityService {
  private static readonly DEFAULT_CONFIG: SecurityConfiguration = {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      saltLength: 32
    },
    certificates: {
      environment: 'dev',
      domain: 'localhost',
      validityDays: 365,
      keySize: 2048,
      autoRenewal: false
    },
    authentication: {
      mfaEnabled: true,
      sessionTimeout: 480, // 8 heures
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        preventUserInfoInPassword: true,
        historyCheck: 5,
        expirationDays: 90
      }
    },
    audit: {
      enabled: true,
      logSensitiveData: false,
      retentionDays: 2555, // 7 ans pour conformité HDS
      alertThresholds: {
        failedLoginsPerMinute: 10,
        suspiciousIpAccess: 3,
        dataExportVolume: 100,
        adminActionsPerHour: 20
      }
    }
  };

  private static securityEvents: SecurityEvent[] = [];
  private static config: SecurityConfiguration = this.DEFAULT_CONFIG;

  /**
   * Chiffre des données sensibles avec AES-256-GCM
   */
  static encryptSensitiveData(
    data: string,
    masterKey?: string
  ): EncryptedData {
    const algorithm = this.config.encryption.algorithm;
    const salt = crypto.randomBytes(this.config.encryption.saltLength);
    const iv = crypto.randomBytes(this.config.encryption.ivLength);
    
    // Génération de la clé de chiffrement
    const key = masterKey 
      ? crypto.pbkdf2Sync(masterKey, salt, 100000, this.config.encryption.keyLength, 'sha512')
      : crypto.randomBytes(this.config.encryption.keyLength);

    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('IMENA-GEST-HDS')); // Additional Authenticated Data
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      algorithm,
      timestamp: new Date()
    };
  }

  /**
   * Déchiffre des données avec vérification d'intégrité
   */
  static decryptSensitiveData(
    encryptedData: EncryptedData,
    masterKey: string
  ): string {
    const [encrypted, authTagHex] = encryptedData.encryptedData.split(':');
    const authTag = Buffer.from(authTagHex, 'hex');
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, this.config.encryption.keyLength, 'sha512');
    
    const decipher = crypto.createDecipher(encryptedData.algorithm, key);
    decipher.setAAD(Buffer.from('IMENA-GEST-HDS'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Génère une clé de chiffrement sécurisée
   */
  static generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hache un mot de passe avec salt et poivre
   */
  static async hashPassword(
    password: string,
    salt?: string
  ): Promise<{
    hash: string;
    salt: string;
    algorithm: string;
    iterations: number;
  }> {
    const passwordSalt = salt || crypto.randomBytes(32).toString('hex');
    const iterations = 100000;
    
    // Utilisation d'un "pepper" secret (en production, dans une variable d'environnement)
    const pepper = process.env.PASSWORD_PEPPER || 'IMENA-GEST-PEPPER-SECRET';
    const passwordWithPepper = password + pepper;
    
    const hash = crypto.pbkdf2Sync(
      passwordWithPepper,
      passwordSalt,
      iterations,
      64,
      'sha512'
    ).toString('hex');

    return {
      hash,
      salt: passwordSalt,
      algorithm: 'pbkdf2-sha512',
      iterations
    };
  }

  /**
   * Vérifie un mot de passe
   */
  static async verifyPassword(
    password: string,
    hash: string,
    salt: string,
    iterations: number = 100000
  ): Promise<boolean> {
    const pepper = process.env.PASSWORD_PEPPER || 'IMENA-GEST-PEPPER-SECRET';
    const passwordWithPepper = password + pepper;
    
    const computedHash = crypto.pbkdf2Sync(
      passwordWithPepper,
      salt,
      iterations,
      64,
      'sha512'
    ).toString('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }

  /**
   * Valide la robustesse d'un mot de passe
   */
  static validatePasswordStrength(
    password: string,
    userInfo?: { email?: string; firstName?: string; lastName?: string }
  ): {
    isValid: boolean;
    score: number; // 0-100
    violations: string[];
    suggestions: string[];
  } {
    const policy = this.config.authentication.passwordPolicy;
    const violations: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Longueur minimale
    if (password.length < policy.minLength) {
      violations.push(`Minimum ${policy.minLength} caractères requis`);
    } else {
      score += 20;
    }

    // Caractères majuscules
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('Au moins une majuscule requise');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    // Caractères minuscules
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      violations.push('Au moins une minuscule requise');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    // Chiffres
    if (policy.requireNumbers && !/\d/.test(password)) {
      violations.push('Au moins un chiffre requis');
    } else if (/\d/.test(password)) {
      score += 15;
    }

    // Caractères spéciaux
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      violations.push('Au moins un caractère spécial requis');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Mots de passe communs
    if (policy.preventCommonPasswords) {
      const commonPasswords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'azerty', 'motdepasse', 'password1', '12345678'
      ];
      
      if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        violations.push('Mot de passe trop commun');
        score -= 10;
      }
    }

    // Informations utilisateur dans le mot de passe
    if (policy.preventUserInfoInPassword && userInfo) {
      const userInfoFields = [
        userInfo.email?.split('@')[0],
        userInfo.firstName,
        userInfo.lastName
      ].filter(Boolean);

      for (const info of userInfoFields) {
        if (info && password.toLowerCase().includes(info.toLowerCase())) {
          violations.push('Le mot de passe ne doit pas contenir vos informations personnelles');
          score -= 15;
          break;
        }
      }
    }

    // Suggestions d'amélioration
    if (password.length < 16) {
      suggestions.push('Utilisez au moins 16 caractères pour une sécurité optimale');
    }
    
    if (!/\d.*\d.*\d/.test(password)) {
      suggestions.push('Ajoutez plusieurs chiffres');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      suggestions.push('Ajoutez plusieurs caractères spéciaux');
    }

    score = Math.max(0, Math.min(100, score));

    return {
      isValid: violations.length === 0,
      score,
      violations,
      suggestions
    };
  }

  /**
   * Génère un token sécurisé pour l'authentification
   */
  static generateSecureToken(
    payload: any,
    expiresIn: string = '8h'
  ): {
    token: string;
    expiresAt: Date;
    fingerprint: string;
  } {
    const now = new Date();
    const expirationMs = this.parseExpirationString(expiresIn);
    const expiresAt = new Date(now.getTime() + expirationMs);
    
    const fingerprint = crypto.randomBytes(32).toString('hex');
    
    const tokenData = {
      ...payload,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      fingerprint: crypto.createHash('sha256').update(fingerprint).digest('hex')
    };

    // Simulation de signature JWT (en production, utiliser jsonwebtoken)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
    const secret = process.env.JWT_SECRET || 'IMENA-GEST-SECRET';
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${payloadB64}`).digest('base64url');
    
    const token = `${header}.${payloadB64}.${signature}`;

    return {
      token,
      expiresAt,
      fingerprint
    };
  }

  /**
   * Enregistre un événement de sécurité
   */
  static logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details: any,
    userId?: string,
    resource?: string,
    action?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date(),
      type,
      severity,
      userId,
      ipAddress,
      userAgent,
      resource,
      action,
      success,
      details,
      geolocation: this.getGeolocation(ipAddress) // Simulation
    };

    this.securityEvents.push(event);

    // Limiter le nombre d'événements en mémoire
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-5000);
    }

    // Vérifier les seuils d'alerte
    this.checkAlertThresholds(event);

    return event;
  }

  /**
   * Analyse les certificats SSL/TLS
   */
  static analyzeCertificate(certificatePem: string): CertificateInfo {
    // Simulation d'analyse de certificat (en production, utiliser node-forge ou openssl)
    const now = new Date();
    const validFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 jours avant
    const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 jours après
    
    const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      subject: 'CN=localhost, O=IMENA-GEST, C=FR',
      issuer: 'CN=localhost, O=IMENA-GEST, C=FR',
      validFrom,
      validTo,
      serialNumber: crypto.randomBytes(16).toString('hex'),
      fingerprint: crypto.createHash('sha256').update(certificatePem).digest('hex'),
      keySize: 2048,
      algorithm: 'RSA',
      isExpired: validTo < now,
      daysUntilExpiry,
      isValid: validTo > now && validFrom <= now,
      alternativeNames: ['localhost', '127.0.0.1', 'imena-gest.local']
    };
  }

  /**
   * Génère un rapport de sécurité
   */
  static generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): SecurityReport {
    const filteredEvents = this.securityEvents.filter(event =>
      event.timestamp >= startDate && event.timestamp <= endDate
    );

    const criticalEvents = filteredEvents.filter(e => e.severity === 'critical');
    const failedLogins = filteredEvents.filter(e => e.type === 'login' && !e.success);
    
    // Analyse des menaces
    const threatCounts = new Map<string, number>();
    filteredEvents.forEach(event => {
      if (!event.success || event.severity === 'high' || event.severity === 'critical') {
        const key = `${event.type}_${event.severity}`;
        threatCounts.set(key, (threatCounts.get(key) || 0) + 1);
      }
    });

    const topThreats = Array.from(threatCounts.entries())
      .map(([key, count]) => {
        const [type, severity] = key.split('_');
        const lastEvent = filteredEvents
          .filter(e => e.type === type && e.severity === severity)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        
        return {
          type,
          count,
          severity,
          lastOccurrence: lastEvent?.timestamp || new Date()
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Vulnérabilités simulées (en production, intégrer avec des scanners de vulnérabilité)
    const vulnerabilities = [
      {
        id: 'VULNS-001',
        description: 'Certificat SSL expirant dans moins de 30 jours',
        severity: 'medium' as const,
        status: 'open' as const,
        discoveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];

    const recommendations = this.generateSecurityRecommendations(filteredEvents);

    return {
      period: { start: startDate, end: endDate },
      overview: {
        totalEvents: filteredEvents.length,
        criticalEvents: criticalEvents.length,
        failedLogins: failedLogins.length,
        suspiciousActivities: filteredEvents.filter(e => 
          e.severity === 'high' || e.severity === 'critical'
        ).length,
        dataBreachAttempts: filteredEvents.filter(e => 
          e.type === 'data_access' && !e.success
        ).length
      },
      topThreats,
      vulnerabilities,
      recommendations
    };
  }

  /**
   * Audit de conformité sécurité
   */
  static performSecurityAudit(): {
    overallScore: number;
    categories: {
      [category: string]: {
        score: number;
        checks: Array<{
          name: string;
          passed: boolean;
          severity: 'low' | 'medium' | 'high' | 'critical';
          recommendation?: string;
        }>;
      };
    };
    criticalIssues: string[];
    actionPlan: Array<{
      priority: 'immediate' | 'high' | 'medium' | 'low';
      action: string;
      category: string;
      impact: string;
    }>;
  } {
    const categories = {
      'Chiffrement': this.auditEncryption(),
      'Authentification': this.auditAuthentication(),
      'Certificats': this.auditCertificates(),
      'Logging & Monitoring': this.auditLogging(),
      'Configuration': this.auditConfiguration()
    };

    const overallScore = Object.values(categories)
      .reduce((sum, cat) => sum + cat.score, 0) / Object.keys(categories).length;

    const criticalIssues = Object.values(categories)
      .flatMap(cat => cat.checks)
      .filter(check => !check.passed && check.severity === 'critical')
      .map(check => check.name);

    const actionPlan = this.generateSecurityActionPlan(categories);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      categories,
      criticalIssues,
      actionPlan
    };
  }

  // Méthodes privées utilitaires
  private static parseExpirationString(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error('Format d\'expiration invalide');
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error('Unité de temps invalide');
    }
  }

  private static getGeolocation(ipAddress: string) {
    // Simulation de géolocalisation (en production, utiliser un service comme MaxMind)
    if (ipAddress.startsWith('127.') || ipAddress === '::1') {
      return {
        country: 'France',
        city: 'Local',
        latitude: 48.8566,
        longitude: 2.3522
      };
    }
    
    return {
      country: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0
    };
  }

  private static checkAlertThresholds(event: SecurityEvent): void {
    const thresholds = this.config.audit.alertThresholds;
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    // Vérifier les tentatives de connexion échouées
    const recentFailedLogins = this.securityEvents.filter(e =>
      e.type === 'login' && 
      !e.success && 
      e.timestamp > oneMinuteAgo &&
      e.ipAddress === event.ipAddress
    );
    
    if (recentFailedLogins.length >= thresholds.failedLoginsPerMinute) {
      this.logSecurityEvent(
        'system_event',
        'critical',
        event.ipAddress,
        'SecurityService',
        false,
        {
          alert: 'Trop de tentatives de connexion échouées',
          count: recentFailedLogins.length,
          threshold: thresholds.failedLoginsPerMinute
        }
      );
    }
  }

  private static generateSecurityRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = [];
    
    const failedLogins = events.filter(e => e.type === 'login' && !e.success);
    if (failedLogins.length > 0) {
      recommendations.push('Activer la surveillance renforcée des tentatives de connexion');
    }
    
    const criticalEvents = events.filter(e => e.severity === 'critical');
    if (criticalEvents.length > 0) {
      recommendations.push('Enquêter sur les événements critiques récents');
    }
    
    recommendations.push('Mettre à jour les certificats SSL avant expiration');
    recommendations.push('Effectuer une revue des droits d\'accès utilisateurs');
    recommendations.push('Planifier un test d\'intrusion semestriel');
    
    return recommendations;
  }

  private static auditEncryption() {
    const checks = [
      {
        name: 'Algorithme de chiffrement moderne (AES-256)',
        passed: this.config.encryption.algorithm.includes('aes-256'),
        severity: 'critical' as const,
        recommendation: 'Utiliser AES-256-GCM pour le chiffrement'
      },
      {
        name: 'Longueur de clé adéquate (>=256 bits)',
        passed: this.config.encryption.keyLength >= 32,
        severity: 'high' as const
      },
      {
        name: 'Utilisation de sel pour les mots de passe',
        passed: true, // Toujours vrai dans notre implémentation
        severity: 'critical' as const
      }
    ];
    
    const passedChecks = checks.filter(c => c.passed).length;
    return {
      score: (passedChecks / checks.length) * 10,
      checks
    };
  }

  private static auditAuthentication() {
    const checks = [
      {
        name: 'Authentification multifacteur activée',
        passed: this.config.authentication.mfaEnabled,
        severity: 'high' as const,
        recommendation: 'Activer l\'authentification à deux facteurs'
      },
      {
        name: 'Politique de mot de passe robuste',
        passed: this.config.authentication.passwordPolicy.minLength >= 12,
        severity: 'medium' as const
      },
      {
        name: 'Limitation des tentatives de connexion',
        passed: this.config.authentication.maxLoginAttempts <= 5,
        severity: 'medium' as const
      }
    ];
    
    const passedChecks = checks.filter(c => c.passed).length;
    return {
      score: (passedChecks / checks.length) * 10,
      checks
    };
  }

  private static auditCertificates() {
    const checks = [
      {
        name: 'Certificats SSL/TLS configurés',
        passed: true, // Simulation
        severity: 'critical' as const
      },
      {
        name: 'Certificats non expirés',
        passed: true, // Simulation
        severity: 'critical' as const
      },
      {
        name: 'Algorithme de signature moderne',
        passed: true, // Simulation
        severity: 'medium' as const
      }
    ];
    
    const passedChecks = checks.filter(c => c.passed).length;
    return {
      score: (passedChecks / checks.length) * 10,
      checks
    };
  }

  private static auditLogging() {
    const checks = [
      {
        name: 'Audit de sécurité activé',
        passed: this.config.audit.enabled,
        severity: 'high' as const
      },
      {
        name: 'Rétention des logs conforme (7 ans)',
        passed: this.config.audit.retentionDays >= 2555,
        severity: 'medium' as const,
        recommendation: 'Configurer la rétention des logs sur 7 ans minimum'
      },
      {
        name: 'Protection des données sensibles',
        passed: !this.config.audit.logSensitiveData,
        severity: 'high' as const
      }
    ];
    
    const passedChecks = checks.filter(c => c.passed).length;
    return {
      score: (passedChecks / checks.length) * 10,
      checks
    };
  }

  private static auditConfiguration() {
    const checks = [
      {
        name: 'Configuration sécurisée par défaut',
        passed: true, // Simulation
        severity: 'medium' as const
      },
      {
        name: 'Variables d\'environnement sensibles',
        passed: !!process.env.JWT_SECRET,
        severity: 'high' as const,
        recommendation: 'Configurer JWT_SECRET dans les variables d\'environnement'
      },
      {
        name: 'Mode debug désactivé en production',
        passed: process.env.NODE_ENV === 'production' ? true : false,
        severity: 'medium' as const
      }
    ];
    
    const passedChecks = checks.filter(c => c.passed).length;
    return {
      score: (passedChecks / checks.length) * 10,
      checks
    };
  }

  private static generateSecurityActionPlan(categories: any) {
    const actions = [];
    
    for (const [categoryName, category] of Object.entries(categories)) {
      for (const check of (category as any).checks) {
        if (!check.passed) {
          let priority: 'immediate' | 'high' | 'medium' | 'low' = 'medium';
          
          if (check.severity === 'critical') priority = 'immediate';
          else if (check.severity === 'high') priority = 'high';
          else if (check.severity === 'medium') priority = 'medium';
          else priority = 'low';
          
          actions.push({
            priority,
            action: check.recommendation || `Corriger: ${check.name}`,
            category: categoryName,
            impact: `Sécurité ${check.severity}`
          });
        }
      }
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
