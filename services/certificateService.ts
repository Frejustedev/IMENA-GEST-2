/**
 * Service de gestion des certificats SSL/TLS pour IMENA-GEST
 * Gestion automatisée des certificats, renouvellement et monitoring
 */

export interface Certificate {
  id: string;
  commonName: string;
  subjectAltNames: string[];
  issuer: string;
  type: 'self_signed' | 'ca_signed' | 'lets_encrypt';
  keyAlgorithm: 'RSA' | 'ECDSA';
  keySize: number;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  fingerprint: string;
  status: 'valid' | 'expired' | 'revoked' | 'pending_renewal';
  autoRenew: boolean;
  filePaths: {
    certificate: string;
    privateKey: string;
    chain?: string;
    fullchain?: string;
  };
}

export interface CertificateRequest {
  commonName: string;
  subjectAltNames: string[];
  organization: string;
  organizationalUnit: string;
  country: string;
  state: string;
  city: string;
  keyAlgorithm: 'RSA' | 'ECDSA';
  keySize: number;
  validityDays: number;
  type: 'self_signed' | 'ca_signed' | 'lets_encrypt';
}

export interface CertificateValidation {
  isValid: boolean;
  daysUntilExpiry: number;
  issues: CertificateIssue[];
  securityScore: number;
  recommendations: string[];
}

export interface CertificateIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'expiration' | 'weak_key' | 'untrusted_ca' | 'hostname_mismatch' | 'revoked';
  description: string;
  remediation: string;
}

export interface SSLConfiguration {
  protocols: string[];
  cipherSuites: string[];
  keyExchange: string[];
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  ocsp: {
    enabled: boolean;
    stapling: boolean;
  };
  sessionSettings: {
    timeout: number;
    cacheSize: number;
    ticketLifetime: number;
  };
}

export class CertificateService {
  private static certificates: Map<string, Certificate> = new Map();
  private static renewalQueue: string[] = [];
  private static configuration: SSLConfiguration = this.getSecureDefaults();

  /**
   * Génère un nouveau certificat
   */
  static async generateCertificate(request: CertificateRequest): Promise<Certificate> {
    const certificateId = `cert_${Date.now()}`;
    
    // Validation de la demande
    this.validateCertificateRequest(request);

    let certificate: Certificate;

    switch (request.type) {
      case 'self_signed':
        certificate = await this.generateSelfSignedCertificate(certificateId, request);
        break;
      case 'lets_encrypt':
        certificate = await this.generateLetsEncryptCertificate(certificateId, request);
        break;
      case 'ca_signed':
        certificate = await this.generateCASignedCertificate(certificateId, request);
        break;
      default:
        throw new Error('Type de certificat non supporté');
    }

    this.certificates.set(certificateId, certificate);
    
    // Programmer le renouvellement automatique si activé
    if (certificate.autoRenew) {
      this.scheduleRenewal(certificateId);
    }

    return certificate;
  }

  /**
   * Valide un certificat existant
   */
  static validateCertificate(certificateId: string): CertificateValidation {
    const certificate = this.certificates.get(certificateId);
    if (!certificate) {
      throw new Error('Certificat non trouvé');
    }

    const issues: CertificateIssue[] = [];
    const recommendations: string[] = [];
    let securityScore = 100;

    // Vérification de l'expiration
    const now = new Date();
    const daysUntilExpiry = Math.ceil((certificate.notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      issues.push({
        severity: 'critical',
        type: 'expiration',
        description: 'Certificat expiré',
        remediation: 'Renouveler immédiatement le certificat'
      });
      securityScore -= 50;
    } else if (daysUntilExpiry <= 30) {
      issues.push({
        severity: 'high',
        type: 'expiration',
        description: `Certificat expire dans ${daysUntilExpiry} jours`,
        remediation: 'Planifier le renouvellement du certificat'
      });
      securityScore -= 20;
    } else if (daysUntilExpiry <= 90) {
      recommendations.push('Préparer le renouvellement du certificat');
      securityScore -= 5;
    }

    // Vérification de la force de la clé
    if (certificate.keyAlgorithm === 'RSA' && certificate.keySize < 2048) {
      issues.push({
        severity: 'high',
        type: 'weak_key',
        description: 'Taille de clé RSA insuffisante',
        remediation: 'Utiliser une clé RSA d\'au moins 2048 bits'
      });
      securityScore -= 25;
    }

    if (certificate.keyAlgorithm === 'RSA' && certificate.keySize < 4096) {
      recommendations.push('Considérer l\'utilisation d\'une clé RSA de 4096 bits ou ECDSA');
    }

    // Vérification du type de certificat
    if (certificate.type === 'self_signed') {
      issues.push({
        severity: 'medium',
        type: 'untrusted_ca',
        description: 'Certificat auto-signé non recommandé pour la production',
        remediation: 'Utiliser un certificat signé par une autorité de certification reconnue'
      });
      securityScore -= 15;
    }

    // Vérifications supplémentaires
    const additionalChecks = this.performAdditionalSecurityChecks(certificate);
    issues.push(...additionalChecks.issues);
    recommendations.push(...additionalChecks.recommendations);
    securityScore -= additionalChecks.securityPenalty;

    return {
      isValid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      daysUntilExpiry,
      issues,
      securityScore: Math.max(0, securityScore),
      recommendations
    };
  }

  /**
   * Renouvelle automatiquement un certificat
   */
  static async renewCertificate(certificateId: string): Promise<Certificate> {
    const existingCert = this.certificates.get(certificateId);
    if (!existingCert) {
      throw new Error('Certificat non trouvé');
    }

    // Créer une nouvelle demande basée sur le certificat existant
    const renewalRequest: CertificateRequest = {
      commonName: existingCert.commonName,
      subjectAltNames: existingCert.subjectAltNames,
      organization: 'IMENA-GEST',
      organizationalUnit: 'Medical Nuclear Imaging',
      country: 'FR',
      state: 'France',
      city: 'Paris',
      keyAlgorithm: existingCert.keyAlgorithm,
      keySize: existingCert.keySize,
      validityDays: 365,
      type: existingCert.type
    };

    // Générer le nouveau certificat
    const newCertificate = await this.generateCertificate(renewalRequest);

    // Marquer l'ancien comme expiré et supprimer
    existingCert.status = 'expired';
    this.certificates.delete(certificateId);

    // Programmer le prochain renouvellement
    if (newCertificate.autoRenew) {
      this.scheduleRenewal(newCertificate.id);
    }

    return newCertificate;
  }

  /**
   * Configure SSL/TLS sécurisé
   */
  static configureSecureSSL(): SSLConfiguration {
    return {
      protocols: ['TLSv1.2', 'TLSv1.3'],
      cipherSuites: [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
      ],
      keyExchange: ['ECDHE'],
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true
      },
      ocsp: {
        enabled: true,
        stapling: true
      },
      sessionSettings: {
        timeout: 300, // 5 minutes
        cacheSize: 10240, // 10MB
        ticketLifetime: 300
      }
    };
  }

  /**
   * Génère la configuration Nginx sécurisée
   */
  static generateNginxSSLConfig(certificateId: string): string {
    const certificate = this.certificates.get(certificateId);
    if (!certificate) {
      throw new Error('Certificat non trouvé');
    }

    const config = this.configuration;

    return `
# Configuration SSL/TLS sécurisée pour IMENA-GEST
# Générée automatiquement le ${new Date().toISOString()}

# Certificats
ssl_certificate ${certificate.filePaths.certificate};
ssl_certificate_key ${certificate.filePaths.privateKey};
${certificate.filePaths.chain ? `ssl_trusted_certificate ${certificate.filePaths.chain};` : ''}

# Protocoles SSL/TLS
ssl_protocols ${config.protocols.join(' ')};
ssl_prefer_server_ciphers on;
ssl_ciphers '${config.cipherSuites.join(':')}';

# Paramètres DH
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# Session SSL
ssl_session_timeout ${config.sessionSettings.timeout}s;
ssl_session_cache shared:SSL:${config.sessionSettings.cacheSize / 1024}m;
ssl_session_tickets on;
ssl_session_ticket_key /etc/nginx/ssl/ticket.key;

# OCSP Stapling
${config.ocsp.enabled ? 'ssl_stapling on;' : ''}
${config.ocsp.stapling ? 'ssl_stapling_verify on;' : ''}

# Headers de sécurité
add_header Strict-Transport-Security "max-age=${config.hsts.maxAge}${config.hsts.includeSubDomains ? '; includeSubDomains' : ''}${config.hsts.preload ? '; preload' : ''}" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;

# Optimisations SSL
ssl_buffer_size 8k;
ssl_early_data on;
`;
  }

  /**
   * Surveille les certificats et génère des alertes
   */
  static monitorCertificates(): {
    totalCertificates: number;
    validCertificates: number;
    expiringCertificates: number;
    expiredCertificates: number;
    alerts: Array<{
      certificateId: string;
      commonName: string;
      severity: string;
      message: string;
      action: string;
    }>;
  } {
    const alerts = [];
    let validCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    for (const [id, certificate] of this.certificates) {
      const validation = this.validateCertificate(id);
      
      if (validation.daysUntilExpiry <= 0) {
        expiredCount++;
        alerts.push({
          certificateId: id,
          commonName: certificate.commonName,
          severity: 'critical',
          message: 'Certificat expiré',
          action: 'Renouveler immédiatement'
        });
      } else if (validation.daysUntilExpiry <= 30) {
        expiringCount++;
        alerts.push({
          certificateId: id,
          commonName: certificate.commonName,
          severity: 'warning',
          message: `Expire dans ${validation.daysUntilExpiry} jours`,
          action: 'Programmer le renouvellement'
        });
      } else {
        validCount++;
      }

      // Alertes de sécurité
      const criticalIssues = validation.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        alerts.push({
          certificateId: id,
          commonName: certificate.commonName,
          severity: 'critical',
          message: `Problèmes de sécurité: ${criticalIssues.map(i => i.description).join(', ')}`,
          action: 'Corriger immédiatement'
        });
      }
    }

    return {
      totalCertificates: this.certificates.size,
      validCertificates: validCount,
      expiringCertificates: expiringCount,
      expiredCertificates: expiredCount,
      alerts
    };
  }

  // Méthodes privées de génération
  private static async generateSelfSignedCertificate(
    id: string,
    request: CertificateRequest
  ): Promise<Certificate> {
    // Simulation de génération de certificat auto-signé
    const now = new Date();
    const notAfter = new Date(now.getTime() + request.validityDays * 24 * 60 * 60 * 1000);

    return {
      id,
      commonName: request.commonName,
      subjectAltNames: request.subjectAltNames,
      issuer: request.commonName, // Auto-signé
      type: 'self_signed',
      keyAlgorithm: request.keyAlgorithm,
      keySize: request.keySize,
      serialNumber: this.generateSerialNumber(),
      notBefore: now,
      notAfter,
      fingerprint: this.generateFingerprint(),
      status: 'valid',
      autoRenew: true,
      filePaths: {
        certificate: `./nginx/ssl/${request.commonName}.crt`,
        privateKey: `./nginx/ssl/${request.commonName}.key`,
        fullchain: `./nginx/ssl/${request.commonName}-fullchain.pem`
      }
    };
  }

  private static async generateLetsEncryptCertificate(
    id: string,
    request: CertificateRequest
  ): Promise<Certificate> {
    // Simulation de génération Let's Encrypt
    const now = new Date();
    const notAfter = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 jours

    return {
      id,
      commonName: request.commonName,
      subjectAltNames: request.subjectAltNames,
      issuer: "Let's Encrypt Authority X3",
      type: 'lets_encrypt',
      keyAlgorithm: request.keyAlgorithm,
      keySize: request.keySize,
      serialNumber: this.generateSerialNumber(),
      notBefore: now,
      notAfter,
      fingerprint: this.generateFingerprint(),
      status: 'valid',
      autoRenew: true,
      filePaths: {
        certificate: `/etc/letsencrypt/live/${request.commonName}/cert.pem`,
        privateKey: `/etc/letsencrypt/live/${request.commonName}/privkey.pem`,
        chain: `/etc/letsencrypt/live/${request.commonName}/chain.pem`,
        fullchain: `/etc/letsencrypt/live/${request.commonName}/fullchain.pem`
      }
    };
  }

  private static async generateCASignedCertificate(
    id: string,
    request: CertificateRequest
  ): Promise<Certificate> {
    // Simulation de génération signée par CA
    const now = new Date();
    const notAfter = new Date(now.getTime() + request.validityDays * 24 * 60 * 60 * 1000);

    return {
      id,
      commonName: request.commonName,
      subjectAltNames: request.subjectAltNames,
      issuer: 'IMENA-GEST Internal CA',
      type: 'ca_signed',
      keyAlgorithm: request.keyAlgorithm,
      keySize: request.keySize,
      serialNumber: this.generateSerialNumber(),
      notBefore: now,
      notAfter,
      fingerprint: this.generateFingerprint(),
      status: 'valid',
      autoRenew: false,
      filePaths: {
        certificate: `./ca/certs/${request.commonName}.crt`,
        privateKey: `./ca/private/${request.commonName}.key`,
        chain: './ca/certs/ca-chain.pem',
        fullchain: `./ca/certs/${request.commonName}-fullchain.pem`
      }
    };
  }

  private static validateCertificateRequest(request: CertificateRequest): void {
    if (!request.commonName) {
      throw new Error('Common Name est requis');
    }

    if (request.keyAlgorithm === 'RSA' && request.keySize < 2048) {
      throw new Error('Taille de clé RSA minimum: 2048 bits');
    }

    if (request.keyAlgorithm === 'ECDSA' && ![256, 384, 521].includes(request.keySize)) {
      throw new Error('Taille de clé ECDSA supportée: 256, 384, 521 bits');
    }

    if (request.validityDays > 825) { // Limite CA/Browser Forum
      throw new Error('Durée de validité maximum: 825 jours');
    }
  }

  private static scheduleRenewal(certificateId: string): void {
    const certificate = this.certificates.get(certificateId);
    if (!certificate) return;

    // Programmer le renouvellement 30 jours avant expiration
    const renewalDate = new Date(certificate.notAfter.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (renewalDate > new Date()) {
      // En production, utiliser un scheduler réel
      setTimeout(() => {
        this.renewCertificate(certificateId).catch(console.error);
      }, renewalDate.getTime() - Date.now());
    }
  }

  private static performAdditionalSecurityChecks(certificate: Certificate): {
    issues: CertificateIssue[];
    recommendations: string[];
    securityPenalty: number;
  } {
    const issues: CertificateIssue[] = [];
    const recommendations: string[] = [];
    let securityPenalty = 0;

    // Vérification des SAN
    if (certificate.subjectAltNames.length === 0) {
      recommendations.push('Ajouter des Subject Alternative Names pour une meilleure compatibilité');
    }

    // Vérification de l\'algorithme de clé
    if (certificate.keyAlgorithm === 'RSA' && certificate.keySize === 2048) {
      recommendations.push('Considérer l\'upgrade vers RSA 4096 ou ECDSA P-256');
    }

    return {
      issues,
      recommendations,
      securityPenalty
    };
  }

  private static generateSerialNumber(): string {
    return Math.random().toString(16).substring(2, 18).toUpperCase();
  }

  private static generateFingerprint(): string {
    return Array.from({ length: 20 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();
  }

  private static getSecureDefaults(): SSLConfiguration {
    return {
      protocols: ['TLSv1.2', 'TLSv1.3'],
      cipherSuites: [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305'
      ],
      keyExchange: ['ECDHE'],
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ocsp: {
        enabled: true,
        stapling: true
      },
      sessionSettings: {
        timeout: 300,
        cacheSize: 10240,
        ticketLifetime: 300
      }
    };
  }
}
