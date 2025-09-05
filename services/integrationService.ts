/**
 * Service d'intégrations tierces pour IMENA-GEST
 * PACS, RIS, HIS, HL7, DICOM et APIs externes
 */

export interface PacsIntegration {
  id: string;
  name: string;
  type: 'PACS' | 'RIS' | 'HIS' | 'LIS';
  endpoint: string;
  protocol: 'DICOM' | 'HL7' | 'REST' | 'SOAP' | 'FHIR';
  authentication: {
    type: 'basic' | 'oauth' | 'apikey' | 'certificate';
    credentials: any;
  };
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastSync: Date;
  configuration: any;
}

export interface DicomStudy {
  studyInstanceUID: string;
  patientID: string;
  patientName: string;
  studyDate: Date;
  modality: string;
  studyDescription: string;
  seriesCount: number;
  instanceCount: number;
  studySize: number; // en MB
  status: 'pending' | 'completed' | 'failed' | 'archived';
  location: string;
}

export interface HL7Message {
  messageType: 'ADT' | 'ORM' | 'ORU' | 'SIU' | 'DFT' | 'MDM';
  messageId: string;
  timestamp: Date;
  sendingApplication: string;
  receivingApplication: string;
  patientId: string;
  content: any;
  processed: boolean;
  errors?: string[];
}

export interface ExternalSystem {
  systemId: string;
  name: string;
  type: 'laboratory' | 'pharmacy' | 'billing' | 'scheduling' | 'reporting';
  apiVersion: string;
  baseUrl: string;
  healthEndpoint: string;
  status: 'online' | 'offline' | 'degraded';
  lastHealthCheck: Date;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    current: number;
  };
}

export interface DataMapping {
  sourceSystem: string;
  targetSystem: string;
  entityType: string;
  fieldMappings: Array<{
    sourceField: string;
    targetField: string;
    transformation?: string;
    required: boolean;
  }>;
  validationRules: Array<{
    field: string;
    rule: string;
    errorMessage: string;
  }>;
}

export interface SyncJob {
  jobId: string;
  type: 'full' | 'incremental' | 'manual';
  sourceSystem: string;
  targetSystem: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: string[];
  progress: number; // 0-100
}

export class IntegrationService {
  private static integrations: Map<string, PacsIntegration> = new Map();
  private static externalSystems: Map<string, ExternalSystem> = new Map();
  private static syncJobs: SyncJob[] = [];
  private static hl7Messages: HL7Message[] = [];

  /**
   * Configure une intégration PACS/RIS
   */
  static configureIntegration(config: Omit<PacsIntegration, 'id' | 'status' | 'lastSync'>): PacsIntegration {
    const integration: PacsIntegration = {
      id: `integration_${Date.now()}`,
      ...config,
      status: 'disconnected',
      lastSync: new Date()
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }

  /**
   * Test la connectivité d'une intégration
   */
  static async testConnection(integrationId: string): Promise<{
    success: boolean;
    responseTime: number;
    details: any;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Intégration non trouvée');
    }

    const startTime = Date.now();
    
    try {
      // Simulation du test de connexion
      await this.simulateNetworkCall(integration.endpoint, 2000);
      
      const responseTime = Date.now() - startTime;
      
      // Mise à jour du statut
      integration.status = 'connected';
      integration.lastSync = new Date();
      
      return {
        success: true,
        responseTime,
        details: {
          endpoint: integration.endpoint,
          protocol: integration.protocol,
          timestamp: new Date()
        }
      };
    } catch (error) {
      integration.status = 'error';
      
      return {
        success: false,
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          endpoint: integration.endpoint
        }
      };
    }
  }

  /**
   * Envoie un examen vers le PACS
   */
  static async sendToPacs(
    pacsId: string,
    studyData: {
      patientId: string;
      studyDate: Date;
      modality: string;
      studyDescription: string;
      images: Array<{
        seriesNumber: number;
        instanceNumber: number;
        imageData: ArrayBuffer;
        metadata: any;
      }>;
    }
  ): Promise<{
    success: boolean;
    studyInstanceUID?: string;
    errors?: string[];
  }> {
    const integration = this.integrations.get(pacsId);
    if (!integration || integration.type !== 'PACS') {
      throw new Error('PACS non trouvé ou invalide');
    }

    try {
      // Génération d'un UID DICOM
      const studyInstanceUID = this.generateDicomUID();
      
      // Simulation de l'envoi DICOM
      await this.simulateNetworkCall(integration.endpoint + '/store', 5000);
      
      // Création de l'étude DICOM
      const dicomStudy: DicomStudy = {
        studyInstanceUID,
        patientID: studyData.patientId,
        patientName: 'Patient_' + studyData.patientId,
        studyDate: studyData.studyDate,
        modality: studyData.modality,
        studyDescription: studyData.studyDescription,
        seriesCount: studyData.images.length,
        instanceCount: studyData.images.reduce((sum, img) => sum + 1, 0),
        studySize: studyData.images.reduce((sum, img) => sum + img.imageData.byteLength, 0) / (1024 * 1024),
        status: 'completed',
        location: integration.endpoint
      };

      return {
        success: true,
        studyInstanceUID
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Erreur envoi PACS']
      };
    }
  }

  /**
   * Récupère les études d'un patient depuis le PACS
   */
  static async retrieveStudiesFromPacs(
    pacsId: string,
    patientId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<DicomStudy[]> {
    const integration = this.integrations.get(pacsId);
    if (!integration || integration.type !== 'PACS') {
      throw new Error('PACS non trouvé');
    }

    // Simulation de récupération DICOM
    await this.simulateNetworkCall(integration.endpoint + '/query', 1500);

    // Études simulées
    const mockStudies: DicomStudy[] = [
      {
        studyInstanceUID: this.generateDicomUID(),
        patientID: patientId,
        patientName: 'Patient_' + patientId,
        studyDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        modality: 'NM',
        studyDescription: 'Scintigraphie osseuse corps entier',
        seriesCount: 3,
        instanceCount: 45,
        studySize: 128.5,
        status: 'completed',
        location: integration.endpoint
      },
      {
        studyInstanceUID: this.generateDicomUID(),
        patientID: patientId,
        patientName: 'Patient_' + patientId,
        studyDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        modality: 'NM',
        studyDescription: 'Scintigraphie thyroïdienne',
        seriesCount: 2,
        instanceCount: 28,
        studySize: 64.2,
        status: 'completed',
        location: integration.endpoint
      }
    ];

    // Filtrage par date si spécifié
    if (dateRange) {
      return mockStudies.filter(study => 
        study.studyDate >= dateRange.start && study.studyDate <= dateRange.end
      );
    }

    return mockStudies;
  }

  /**
   * Traite un message HL7
   */
  static processHL7Message(
    rawMessage: string,
    sourceSystem: string
  ): {
    success: boolean;
    parsedMessage?: HL7Message;
    errors?: string[];
  } {
    try {
      // Parsing HL7 simplifié
      const segments = rawMessage.split('\r');
      const mshSegment = segments.find(s => s.startsWith('MSH'));
      
      if (!mshSegment) {
        throw new Error('Segment MSH manquant');
      }

      const mshFields = mshSegment.split('|');
      const messageType = mshFields[8] || 'UNKNOWN';
      const messageId = mshFields[9] || Date.now().toString();

      // Extraction patient ID (segment PID)
      const pidSegment = segments.find(s => s.startsWith('PID'));
      const patientId = pidSegment ? pidSegment.split('|')[3] : 'UNKNOWN';

      const hl7Message: HL7Message = {
        messageType: messageType.split('^')[0] as HL7Message['messageType'],
        messageId,
        timestamp: new Date(),
        sendingApplication: mshFields[2] || sourceSystem,
        receivingApplication: 'IMENA-GEST',
        patientId,
        content: this.parseHL7Segments(segments),
        processed: false
      };

      this.hl7Messages.push(hl7Message);

      // Traitement automatique selon le type
      this.autoProcessHL7Message(hl7Message);

      return {
        success: true,
        parsedMessage: hl7Message
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Erreur parsing HL7']
      };
    }
  }

  /**
   * Synchronise les données avec un système externe
   */
  static async synchronizeWithSystem(
    systemId: string,
    syncType: 'full' | 'incremental' = 'incremental'
  ): Promise<SyncJob> {
    const system = this.externalSystems.get(systemId);
    if (!system) {
      throw new Error('Système externe non trouvé');
    }

    const syncJob: SyncJob = {
      jobId: `sync_${Date.now()}`,
      type: syncType,
      sourceSystem: systemId,
      targetSystem: 'IMENA-GEST',
      status: 'queued',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      progress: 0
    };

    this.syncJobs.push(syncJob);

    // Démarrage asynchrone de la synchronisation
    this.executeSyncJob(syncJob);

    return syncJob;
  }

  /**
   * Mappe les données entre systèmes
   */
  static mapData(
    data: any,
    mapping: DataMapping
  ): {
    mappedData: any;
    errors: string[];
    warnings: string[];
  } {
    const mappedData: any = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const fieldMapping of mapping.fieldMappings) {
      try {
        let value = this.getNestedValue(data, fieldMapping.sourceField);

        // Application de la transformation si définie
        if (fieldMapping.transformation && value !== undefined) {
          value = this.applyTransformation(value, fieldMapping.transformation);
        }

        // Validation de la valeur requise
        if (fieldMapping.required && (value === undefined || value === null || value === '')) {
          errors.push(`Champ requis manquant: ${fieldMapping.sourceField}`);
          continue;
        }

        if (value !== undefined) {
          this.setNestedValue(mappedData, fieldMapping.targetField, value);
        }
      } catch (error) {
        errors.push(`Erreur mapping ${fieldMapping.sourceField}: ${error}`);
      }
    }

    // Application des règles de validation
    for (const rule of mapping.validationRules) {
      try {
        const value = this.getNestedValue(mappedData, rule.field);
        if (!this.validateRule(value, rule.rule)) {
          errors.push(rule.errorMessage);
        }
      } catch (error) {
        warnings.push(`Erreur validation ${rule.field}: ${error}`);
      }
    }

    return {
      mappedData,
      errors,
      warnings
    };
  }

  /**
   * Obtient le statut de toutes les intégrations
   */
  static getIntegrationsStatus(): {
    totalIntegrations: number;
    connectedCount: number;
    errorCount: number;
    integrations: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      lastSync: Date;
      healthScore: number;
    }>;
  } {
    const integrations = Array.from(this.integrations.values());
    
    return {
      totalIntegrations: integrations.length,
      connectedCount: integrations.filter(i => i.status === 'connected').length,
      errorCount: integrations.filter(i => i.status === 'error').length,
      integrations: integrations.map(integration => ({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        lastSync: integration.lastSync,
        healthScore: this.calculateHealthScore(integration)
      }))
    };
  }

  /**
   * Surveille la santé des systèmes externes
   */
  static async monitorExternalSystems(): Promise<Array<{
    systemId: string;
    name: string;
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    issues: string[];
  }>> {
    const results = [];
    
    for (const [systemId, system] of this.externalSystems) {
      try {
        const startTime = Date.now();
        await this.simulateNetworkCall(system.healthEndpoint, 1000);
        const responseTime = Date.now() - startTime;
        
        system.status = responseTime > 3000 ? 'degraded' : 'online';
        system.lastHealthCheck = new Date();
        
        results.push({
          systemId,
          name: system.name,
          status: system.status,
          responseTime,
          issues: responseTime > 3000 ? ['Temps de réponse élevé'] : []
        });
      } catch (error) {
        system.status = 'offline';
        results.push({
          systemId,
          name: system.name,
          status: 'offline',
          responseTime: -1,
          issues: ['Système inaccessible']
        });
      }
    }
    
    return results;
  }

  // Méthodes privées utilitaires
  private static async simulateNetworkCall(endpoint: string, delay: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500));
    
    // Simulation d'erreur aléatoire (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error('Erreur réseau simulée');
    }
  }

  private static generateDicomUID(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `1.2.826.0.1.3680043.8.498.${timestamp}.${random}`;
  }

  private static parseHL7Segments(segments: string[]): any {
    const parsed: any = {};
    
    for (const segment of segments) {
      const segmentType = segment.substring(0, 3);
      const fields = segment.split('|');
      parsed[segmentType] = fields;
    }
    
    return parsed;
  }

  private static autoProcessHL7Message(message: HL7Message): void {
    switch (message.messageType) {
      case 'ADT':
        // Traitement admission/sortie patient
        console.log(`Traitement ADT pour patient ${message.patientId}`);
        break;
      case 'ORM':
        // Traitement commande examen
        console.log(`Traitement commande examen pour patient ${message.patientId}`);
        break;
      case 'ORU':
        // Traitement résultat examen
        console.log(`Traitement résultat pour patient ${message.patientId}`);
        break;
    }
    
    message.processed = true;
  }

  private static async executeSyncJob(job: SyncJob): Promise<void> {
    job.status = 'running';
    
    try {
      // Simulation de synchronisation
      const totalRecords = 1000 + Math.floor(Math.random() * 5000);
      
      for (let i = 0; i < totalRecords; i++) {
        await new Promise(resolve => setTimeout(resolve, 1));
        
        job.recordsProcessed++;
        
        // Simulation d'erreurs (2% de chance)
        if (Math.random() < 0.02) {
          job.recordsFailed++;
          job.errors.push(`Erreur enregistrement ${i + 1}`);
        } else {
          job.recordsSuccessful++;
        }
        
        job.progress = Math.round((i / totalRecords) * 100);
      }
      
      job.status = 'completed';
      job.endTime = new Date();
    } catch (error) {
      job.status = 'failed';
      job.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
      job.endTime = new Date();
    }
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private static applyTransformation(value: any, transformation: string): any {
    switch (transformation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'dateFormat':
        return value instanceof Date ? value.toISOString() : value;
      default:
        return value;
    }
  }

  private static validateRule(value: any, rule: string): boolean {
    const [ruleType, ...params] = rule.split(':');
    
    switch (ruleType) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      case 'minLength':
        return typeof value === 'string' && value.length >= parseInt(params[0]);
      case 'maxLength':
        return typeof value === 'string' && value.length <= parseInt(params[0]);
      case 'pattern':
        return typeof value === 'string' && new RegExp(params[0]).test(value);
      default:
        return true;
    }
  }

  private static calculateHealthScore(integration: PacsIntegration): number {
    let score = 100;
    
    if (integration.status === 'error') score -= 50;
    if (integration.status === 'disconnected') score -= 30;
    
    const hoursSinceSync = (Date.now() - integration.lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync > 24) score -= 20;
    if (hoursSinceSync > 72) score -= 30;
    
    return Math.max(0, score);
  }
}
