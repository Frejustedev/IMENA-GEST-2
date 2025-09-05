/**
 * Service RGPD pour IMENA-GEST
 * Conformité HDS (Hébergement de Données de Santé) et protection des données
 */

export interface DataProcessingPurpose {
  id: string;
  name: string;
  description: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retentionPeriod: number; // en mois
  isActive: boolean;
  categories: string[];
}

export interface ConsentRecord {
  userId: string;
  purpose: string;
  consentGiven: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  version: string; // Version des CGU/politique
  withdrawalDate?: Date;
  method: 'explicit' | 'implicit' | 'granular';
}

export interface DataRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'deletion' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  description: string;
  requesterIdentity: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    identityDocument?: string;
  };
  data?: any;
  rejectionReason?: string;
  handledBy?: string;
}

export interface DataBreach {
  id: string;
  reportDate: Date;
  discoveryDate: Date;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDataTypes: string[];
  affectedPersonsCount: number;
  causeCategory: 'human_error' | 'system_failure' | 'malicious_attack' | 'natural_disaster' | 'other';
  containmentMeasures: string[];
  notificationToAuthority: boolean;
  notificationToDataSubjects: boolean;
  status: 'identified' | 'contained' | 'investigated' | 'resolved';
  investigationNotes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  sensitiveData: boolean;
  retentionDate: Date;
  details?: any;
}

export class GDPRService {
  private static readonly RETENTION_PERIODS = {
    medical_data: 120, // 10 ans
    administrative_data: 60, // 5 ans
    audit_logs: 72, // 6 ans
    consent_records: 36, // 3 ans après withdrawal
    access_logs: 12, // 1 an
  };

  /**
   * Enregistre un consentement utilisateur
   */
  static recordConsent(
    userId: string,
    purpose: string,
    consentGiven: boolean,
    method: ConsentRecord['method'] = 'explicit',
    version: string = '1.0'
  ): ConsentRecord {
    return {
      userId,
      purpose,
      consentGiven,
      timestamp: new Date(),
      method,
      version,
      // En production, récupérer via request
      ipAddress: '127.0.0.1',
      userAgent: 'IMENA-GEST/1.0'
    };
  }

  /**
   * Retire un consentement
   */
  static withdrawConsent(consentRecord: ConsentRecord): ConsentRecord {
    return {
      ...consentRecord,
      consentGiven: false,
      withdrawalDate: new Date()
    };
  }

  /**
   * Vérifie la validité d'un consentement
   */
  static isConsentValid(
    consentRecord: ConsentRecord,
    currentVersion: string,
    maxAge: number = 24 // mois
  ): {
    isValid: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    if (!consentRecord.consentGiven) {
      reasons.push('Consentement retiré');
    }
    
    if (consentRecord.withdrawalDate) {
      reasons.push('Consentement retiré le ' + consentRecord.withdrawalDate.toLocaleDateString());
    }
    
    if (consentRecord.version !== currentVersion) {
      reasons.push('Version obsolète des conditions');
    }
    
    const ageInMonths = (Date.now() - consentRecord.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageInMonths > maxAge) {
      reasons.push(`Consentement expiré (${Math.round(ageInMonths)} mois)`);
    }

    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  /**
   * Traite une demande d'accès aux données (Article 15 RGPD)
   */
  static processAccessRequest(request: DataRequest, userData: any): {
    data: any;
    format: 'json' | 'pdf' | 'csv';
    includedSources: string[];
    excludedSources: string[];
  } {
    // Filtrer et anonymiser les données
    const processedData = {
      personalInfo: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        birthDate: userData.birthDate
      },
      medicalData: {
        examinations: userData.examinations?.map((exam: any) => ({
          date: exam.date,
          type: exam.type,
          results: '[DONNÉES MÉDICALES - ACCÈS CONTRÔLÉ]'
        })) || [],
        appointments: userData.appointments || []
      },
      systemData: {
        accountCreation: userData.createdAt,
        lastLogin: userData.lastLogin,
        consentHistory: userData.consents || []
      }
    };

    return {
      data: processedData,
      format: 'json',
      includedSources: ['user_profile', 'medical_records', 'appointments', 'consent_history'],
      excludedSources: ['internal_notes', 'staff_comments', 'system_logs']
    };
  }

  /**
   * Traite une demande de suppression (Droit à l'effacement)
   */
  static processErasureRequest(
    request: DataRequest,
    userData: any
  ): {
    canDelete: boolean;
    blockers: string[];
    partialDeletionPlan?: string[];
    retentionReasons?: string[];
  } {
    const blockers: string[] = [];
    const retentionReasons: string[] = [];
    
    // Vérifier les obligations légales
    if (userData.medicalRecords && userData.medicalRecords.length > 0) {
      const latestExam = new Date(Math.max(...userData.medicalRecords.map((r: any) => new Date(r.date).getTime())));
      const retentionEnd = new Date(latestExam.getTime() + this.RETENTION_PERIODS.medical_data * 30 * 24 * 60 * 60 * 1000);
      
      if (retentionEnd > new Date()) {
        blockers.push('Obligation légale de conservation des données médicales');
        retentionReasons.push(`Conservation obligatoire jusqu'au ${retentionEnd.toLocaleDateString()}`);
      }
    }

    // Vérifier les procédures en cours
    if (userData.activeAppointments && userData.activeAppointments.length > 0) {
      blockers.push('Rendez-vous programmés en cours');
    }

    // Vérifier les obligations comptables
    if (userData.invoices && userData.invoices.length > 0) {
      blockers.push('Obligations comptables et fiscales');
      retentionReasons.push('Conservation des factures: 10 ans');
    }

    const canDelete = blockers.length === 0;
    
    const partialDeletionPlan = canDelete ? undefined : [
      'Suppression des données non essentielles',
      'Anonymisation des données médicales',
      'Conservation minimale pour obligations légales',
      'Pseudonymisation des identifiants'
    ];

    return {
      canDelete,
      blockers,
      partialDeletionPlan,
      retentionReasons
    };
  }

  /**
   * Vérifie la conformité d'une collecte de données
   */
  static validateDataCollection(
    dataTypes: string[],
    purposes: string[],
    legalBasis: string,
    consentRecords?: ConsentRecord[]
  ): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Vérifier la base légale
    if (legalBasis === 'consent' && (!consentRecords || consentRecords.length === 0)) {
      violations.push('Consentement requis mais non fourni');
    }

    // Vérifier la minimisation des données
    const sensitiveData = dataTypes.filter(type => 
      ['medical_records', 'genetic_data', 'biometric_data'].includes(type)
    );
    
    if (sensitiveData.length > 0 && !purposes.includes('medical_care')) {
      violations.push('Collecte de données sensibles sans finalité médicale claire');
    }

    // Vérifier la proportionnalité
    if (dataTypes.includes('location_data') && !purposes.includes('appointment_scheduling')) {
      recommendations.push('Justifier la collecte des données de géolocalisation');
    }

    // Vérifier les durées de conservation
    if (purposes.includes('marketing') && dataTypes.includes('medical_data')) {
      violations.push('Données médicales utilisées à des fins marketing');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Génère un rapport de violation de données
   */
  static generateBreachReport(breach: DataBreach): {
    reportId: string;
    urgency: 'immediate' | 'within_72h' | 'monitoring';
    notificationRequired: boolean;
    reportData: any;
  } {
    const reportId = `BR-${Date.now()}`;
    
    let urgency: 'immediate' | 'within_72h' | 'monitoring' = 'monitoring';
    let notificationRequired = false;

    // Évaluer l'urgence
    if (breach.severity === 'critical' || breach.affectedPersonsCount > 1000) {
      urgency = 'immediate';
      notificationRequired = true;
    } else if (breach.severity === 'high' || breach.affectedPersonsCount > 100) {
      urgency = 'within_72h';
      notificationRequired = true;
    }

    // Types de données sensibles
    const sensitiveTypes = ['medical_data', 'genetic_data', 'biometric_data', 'financial_data'];
    if (breach.affectedDataTypes.some(type => sensitiveTypes.includes(type))) {
      urgency = 'immediate';
      notificationRequired = true;
    }

    const reportData = {
      breach,
      riskAssessment: {
        likelihoodOfHarm: breach.severity,
        potentialConsequences: this.assessBreachConsequences(breach),
        mitigationMeasures: breach.containmentMeasures
      },
      notificationPlan: {
        toCNIL: notificationRequired,
        toDataSubjects: breach.affectedPersonsCount < 10000, // Notification individuelle si < 10k
        timeline: urgency === 'immediate' ? '24h' : '72h'
      }
    };

    return {
      reportId,
      urgency,
      notificationRequired,
      reportData
    };
  }

  /**
   * Effectue un audit de conformité RGPD
   */
  static performComplianceAudit(systemData: {
    users: any[];
    consentRecords: ConsentRecord[];
    dataRequests: DataRequest[];
    auditLogs: AuditLog[];
    breaches: DataBreach[];
  }): {
    overallScore: number;
    categories: Record<string, { score: number; issues: string[]; recommendations: string[] }>;
    criticalIssues: string[];
    actionPlan: Array<{ priority: 'high' | 'medium' | 'low'; action: string; deadline: string }>;
  } {
    const categories = {
      'Consentement': this.auditConsent(systemData.consentRecords),
      'Droits des personnes': this.auditDataRights(systemData.dataRequests),
      'Sécurité': this.auditSecurity(systemData.auditLogs, systemData.breaches),
      'Gouvernance': this.auditGovernance(systemData)
    };

    const overallScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0) / Object.keys(categories).length;
    
    const criticalIssues = Object.values(categories)
      .flatMap(cat => cat.issues)
      .filter(issue => issue.includes('CRITIQUE'));

    const actionPlan = this.generateActionPlan(categories);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      categories,
      criticalIssues,
      actionPlan
    };
  }

  // Méthodes privées d'audit
  private static auditConsent(consents: ConsentRecord[]) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 10;

    const totalConsents = consents.length;
    const validConsents = consents.filter(c => c.consentGiven && !c.withdrawalDate).length;
    const withdrawnConsents = consents.filter(c => c.withdrawalDate).length;

    if (validConsents / totalConsents < 0.8) {
      issues.push('Taux de consentement faible (< 80%)');
      score -= 2;
    }

    if (withdrawnConsents / totalConsents > 0.2) {
      recommendations.push('Analyser les raisons de retrait de consentement');
      score -= 1;
    }

    return { score, issues, recommendations };
  }

  private static auditDataRights(requests: DataRequest[]) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 10;

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const overdueRequests = requests.filter(r => {
      const daysSinceRequest = (Date.now() - r.requestDate.getTime()) / (1000 * 60 * 60 * 24);
      return r.status === 'pending' && daysSinceRequest > 30;
    });

    if (overdueRequests.length > 0) {
      issues.push(`CRITIQUE: ${overdueRequests.length} demandes en retard (> 30 jours)`);
      score -= 5;
    }

    if (pendingRequests.length > 5) {
      issues.push(`${pendingRequests.length} demandes en attente`);
      score -= 2;
    }

    return { score, issues, recommendations };
  }

  private static auditSecurity(logs: AuditLog[], breaches: DataBreach[]) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 10;

    const recentBreaches = breaches.filter(b => {
      const daysSince = (Date.now() - b.reportDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 365;
    });

    if (recentBreaches.length > 0) {
      issues.push(`${recentBreaches.length} violation(s) dans l'année`);
      score -= recentBreaches.length * 2;
    }

    const failedLogins = logs.filter(l => l.action === 'login' && !l.success).length;
    if (failedLogins > logs.length * 0.1) {
      recommendations.push('Taux d\'échec de connexion élevé - renforcer la sécurité');
      score -= 1;
    }

    return { score, issues, recommendations };
  }

  private static auditGovernance(systemData: any) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 10;

    // Vérifications basiques de gouvernance
    if (!systemData.dataProtectionOfficer) {
      issues.push('Pas de DPO désigné');
      score -= 3;
    }

    recommendations.push('Mettre à jour le registre des traitements');
    recommendations.push('Effectuer une AIPD pour les nouveaux traitements');

    return { score, issues, recommendations };
  }

  private static generateActionPlan(categories: any) {
    const actions = [];
    
    for (const [category, data] of Object.entries(categories)) {
      for (const issue of data.issues) {
        let priority: 'high' | 'medium' | 'low' = 'medium';
        let deadline = '3 mois';
        
        if (issue.includes('CRITIQUE')) {
          priority = 'high';
          deadline = '1 mois';
        } else if (data.score < 7) {
          priority = 'high';
          deadline = '2 mois';
        }
        
        actions.push({
          priority,
          action: `${category}: Résoudre - ${issue}`,
          deadline
        });
      }
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static assessBreachConsequences(breach: DataBreach): string[] {
    const consequences = [];
    
    if (breach.affectedDataTypes.includes('medical_data')) {
      consequences.push('Violation du secret médical');
      consequences.push('Risque de discrimination');
    }
    
    if (breach.affectedDataTypes.includes('financial_data')) {
      consequences.push('Risque de fraude financière');
    }
    
    if (breach.affectedPersonsCount > 1000) {
      consequences.push('Impact à grande échelle');
    }
    
    return consequences;
  }
}
