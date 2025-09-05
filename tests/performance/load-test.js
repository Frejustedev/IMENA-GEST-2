/**
 * Tests de charge K6 pour IMENA-GEST
 * Simulation de charge réaliste environnement hospitalier
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Configuration des métriques custom
const errorRate = new Rate('error_rate');
const responseTimeTrend = new Trend('response_time');
const requestsCounter = new Counter('requests_total');

// Configuration des tests
export const options = {
  stages: [
    // Ramp-up progressif
    { duration: '2m', target: 10 },   // Montée à 10 utilisateurs en 2min
    { duration: '5m', target: 20 },   // Montée à 20 utilisateurs en 5min
    { duration: '10m', target: 50 },  // Montée à 50 utilisateurs en 10min
    { duration: '15m', target: 50 },  // Maintien à 50 utilisateurs
    { duration: '5m', target: 100 },  // Pic à 100 utilisateurs
    { duration: '10m', target: 100 }, // Maintien du pic
    { duration: '5m', target: 0 },    // Descente progressive
  ],
  
  thresholds: {
    // Critères de performance
    'http_req_duration': ['p(95)<2000'], // 95% des requêtes < 2s
    'http_req_duration{scenario:authentication}': ['p(95)<1000'], // Auth < 1s
    'http_req_duration{scenario:patient_search}': ['p(95)<1500'], // Recherche < 1.5s
    'http_req_duration{scenario:medical_data}': ['p(95)<3000'], // Données médicales < 3s
    'error_rate': ['rate<0.05'], // Taux d'erreur < 5%
    'checks': ['rate>0.95'], // 95% des vérifications réussies
  },
  
  // Configuration des scénarios
  scenarios: {
    // Scénario principal: workflow médical complet
    medical_workflow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 20 },
        { duration: '10m', target: 20 },
        { duration: '5m', target: 0 },
      ],
      tags: { scenario: 'medical_workflow' },
    },
    
    // Scénario authentification
    authentication_stress: {
      executor: 'constant-arrival-rate',
      rate: 5, // 5 connexions par seconde
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 10,
      maxVUs: 50,
      tags: { scenario: 'authentication' },
      exec: 'authenticationTest',
    },
    
    // Scénario recherche patients
    patient_search_load: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      stages: [
        { duration: '5m', target: 10 },
        { duration: '10m', target: 10 },
        { duration: '5m', target: 0 },
      ],
      preAllocatedVUs: 20,
      maxVUs: 100,
      tags: { scenario: 'patient_search' },
      exec: 'patientSearchTest',
    },
    
    // Scénario données médicales
    medical_data_stress: {
      executor: 'per-vu-iterations',
      vus: 15,
      iterations: 50,
      maxDuration: '20m',
      tags: { scenario: 'medical_data' },
      exec: 'medicalDataTest',
    },
  },
};

// Configuration de base
const BASE_URL = __ENV.BASE_URL || 'https://localhost';
const API_BASE = `${BASE_URL}/api`;

// Données de test
const testUsers = [
  { username: 'medecin1@test.com', password: 'TestPassword123!' },
  { username: 'technicien1@test.com', password: 'TestPassword123!' },
  { username: 'admin@test.com', password: 'TestPassword123!' },
];

const testPatients = [
  { name: 'Martin', firstName: 'Pierre' },
  { name: 'Dubois', firstName: 'Marie' },
  { name: 'Moreau', firstName: 'Jean' },
];

const examTypes = [
  'Scintigraphie Osseuse',
  'Scintigraphie Thyroïdienne',
  'Scintigraphie Parathyroïdienne',
  'Scintigraphie Rénale DMSA',
  'Scintigraphie Rénale DTPA',
];

// Utilitaires
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePatientData() {
  return {
    name: `Patient${Math.floor(Math.random() * 10000)}`,
    firstName: `Prenom${Math.floor(Math.random() * 1000)}`,
    birthDate: new Date(1950 + Math.random() * 70, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
    phone: `06${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    email: `patient${Math.floor(Math.random() * 10000)}@test.com`,
  };
}

// Fonction d'authentification
function authenticate() {
  const user = randomChoice(testUsers);
  
  const loginResponse = http.post(`${API_BASE}/auth/login`, JSON.stringify({
    email: user.username,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });
  
  requestsCounter.add(1);
  errorRate.add(loginResponse.status !== 200);
  responseTimeTrend.add(loginResponse.timings.duration);
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json() && r.json().token,
  });
  
  if (loginSuccess) {
    return {
      token: loginResponse.json().token,
      user: loginResponse.json().user,
    };
  }
  
  console.error(`Authentication failed: ${loginResponse.status} ${loginResponse.body}`);
  return null;
}

// Test par défaut - Workflow médical complet
export default function medicalWorkflowTest() {
  // Authentification
  const auth = authenticate();
  if (!auth) return;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.token}`,
  };
  
  group('Medical Workflow', () => {
    // 1. Vérification du dashboard
    group('Dashboard Access', () => {
      const dashboardResponse = http.get(`${API_BASE}/dashboard`, { headers, timeout: '30s' });
      
      requestsCounter.add(1);
      errorRate.add(dashboardResponse.status !== 200);
      responseTimeTrend.add(dashboardResponse.timings.duration);
      
      check(dashboardResponse, {
        'dashboard status is 200': (r) => r.status === 200,
        'dashboard has metrics': (r) => r.json() && typeof r.json() === 'object',
      });
    });
    
    // 2. Recherche de patients
    group('Patient Search', () => {
      const searchTerm = randomChoice(testPatients).name;
      const searchResponse = http.get(`${API_BASE}/patients/search?q=${searchTerm}`, { headers, timeout: '30s' });
      
      requestsCounter.add(1);
      errorRate.add(searchResponse.status !== 200);
      responseTimeTrend.add(searchResponse.timings.duration);
      
      check(searchResponse, {
        'search status is 200': (r) => r.status === 200,
        'search returns array': (r) => Array.isArray(r.json()),
      });
    });
    
    // 3. Consultation Hot Lab
    group('Hot Lab Data', () => {
      const hotLabResponse = http.get(`${API_BASE}/hot-lab/products`, { headers, timeout: '30s' });
      
      requestsCounter.add(1);
      errorRate.add(hotLabResponse.status !== 200);
      responseTimeTrend.add(hotLabResponse.timings.duration);
      
      check(hotLabResponse, {
        'hot lab status is 200': (r) => r.status === 200,
        'hot lab has products': (r) => r.json() && Array.isArray(r.json()),
      });
    });
    
    // 4. Création d'un nouveau patient (stress test)
    if (Math.random() < 0.3) { // 30% de chance
      group('Patient Creation', () => {
        const patientData = generatePatientData();
        const createResponse = http.post(`${API_BASE}/patients`, JSON.stringify(patientData), { headers, timeout: '30s' });
        
        requestsCounter.add(1);
        errorRate.add(createResponse.status !== 201);
        responseTimeTrend.add(createResponse.timings.duration);
        
        check(createResponse, {
          'patient creation status is 201': (r) => r.status === 201,
          'patient has id': (r) => r.json() && r.json().id,
        });
      });
    }
    
    // 5. Consultation statistiques
    group('Statistics Access', () => {
      const statsResponse = http.get(`${API_BASE}/statistics/overview`, { headers, timeout: '30s' });
      
      requestsCounter.add(1);
      errorRate.add(statsResponse.status !== 200);
      responseTimeTrend.add(statsResponse.timings.duration);
      
      check(statsResponse, {
        'statistics status is 200': (r) => r.status === 200,
      });
    });
  });
  
  // Pause réaliste entre les actions
  sleep(Math.random() * 5 + 2); // 2-7 secondes
}

// Test spécialisé - Authentification
export function authenticationTest() {
  group('Authentication Stress', () => {
    const auth = authenticate();
    
    if (auth) {
      // Test de validation du token
      const validateResponse = http.get(`${API_BASE}/auth/validate`, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
        timeout: '15s',
      });
      
      requestsCounter.add(1);
      errorRate.add(validateResponse.status !== 200);
      responseTimeTrend.add(validateResponse.timings.duration);
      
      check(validateResponse, {
        'token validation successful': (r) => r.status === 200,
      });
      
      // Logout
      const logoutResponse = http.post(`${API_BASE}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${auth.token}` },
        timeout: '15s',
      });
      
      requestsCounter.add(1);
      errorRate.add(logoutResponse.status !== 200);
      responseTimeTrend.add(logoutResponse.timings.duration);
    }
  });
  
  sleep(1);
}

// Test spécialisé - Recherche patients
export function patientSearchTest() {
  const auth = authenticate();
  if (!auth) return;
  
  const headers = {
    'Authorization': `Bearer ${auth.token}`,
  };
  
  group('Patient Search Load', () => {
    // Test différents types de recherche
    const searchTypes = [
      { endpoint: '/patients/search', param: 'q', value: randomChoice(testPatients).name },
      { endpoint: '/patients/search', param: 'q', value: randomChoice(testPatients).firstName },
      { endpoint: '/patients', param: 'status', value: 'active' },
      { endpoint: '/patients', param: 'examType', value: randomChoice(examTypes) },
    ];
    
    const searchTest = randomChoice(searchTypes);
    const searchUrl = `${API_BASE}${searchTest.endpoint}?${searchTest.param}=${searchTest.value}`;
    
    const searchResponse = http.get(searchUrl, { headers, timeout: '30s' });
    
    requestsCounter.add(1);
    errorRate.add(searchResponse.status !== 200);
    responseTimeTrend.add(searchResponse.timings.duration);
    
    check(searchResponse, {
      'search request successful': (r) => r.status === 200,
      'search response time acceptable': (r) => r.timings.duration < 2000,
    });
  });
  
  sleep(Math.random() * 2 + 0.5);
}

// Test spécialisé - Données médicales
export function medicalDataTest() {
  const auth = authenticate();
  if (!auth) return;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.token}`,
  };
  
  group('Medical Data Operations', () => {
    // Test accès données sensibles
    const endpoints = [
      '/patients',
      '/examinations',
      '/hot-lab/lots',
      '/reports',
      '/statistics/detailed',
    ];
    
    for (const endpoint of endpoints) {
      const response = http.get(`${API_BASE}${endpoint}`, { headers, timeout: '45s' });
      
      requestsCounter.add(1);
      errorRate.add(response.status !== 200);
      responseTimeTrend.add(response.timings.duration);
      
      check(response, {
        [`${endpoint} accessible`]: (r) => r.status === 200,
        [`${endpoint} response time OK`]: (r) => r.timings.duration < 3000,
      });
      
      sleep(0.5); // Pause entre requêtes
    }
    
    // Test création examen (simulation)
    if (Math.random() < 0.2) { // 20% de chance
      const examData = {
        patientId: `patient_${Math.floor(Math.random() * 1000)}`,
        examType: randomChoice(examTypes),
        scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Test de charge - Examen simulé',
      };
      
      const createExamResponse = http.post(`${API_BASE}/examinations`, JSON.stringify(examData), { headers, timeout: '30s' });
      
      requestsCounter.add(1);
      errorRate.add(createExamResponse.status !== 201);
      responseTimeTrend.add(createExamResponse.timings.duration);
      
      check(createExamResponse, {
        'exam creation handled': (r) => r.status === 201 || r.status === 400, // 400 pour validation
      });
    }
  });
  
  sleep(Math.random() * 3 + 1);
}

// Configuration de teardown
export function teardown(data) {
  console.log('📊 Résumé des tests de charge:');
  console.log(`   Requêtes totales: ${requestsCounter.count}`);
  console.log(`   Taux d'erreur: ${(errorRate.rate * 100).toFixed(2)}%`);
  console.log(`   Temps de réponse moyen: ${responseTimeTrend.avg.toFixed(2)}ms`);
  console.log(`   P95 temps de réponse: ${responseTimeTrend.p(95).toFixed(2)}ms`);
}

// Configuration setup
export function setup() {
  console.log('🚀 Démarrage des tests de charge IMENA-GEST');
  console.log(`   URL cible: ${BASE_URL}`);
  console.log(`   Durée estimée: ~40 minutes`);
  
  // Test de connectivité
  const healthCheck = http.get(`${BASE_URL}/health`, { timeout: '10s' });
  if (healthCheck.status !== 200) {
    console.error('❌ Application non accessible - Arrêt des tests');
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }
  
  console.log('✅ Application accessible - Début des tests');
  return { startTime: Date.now() };
}
