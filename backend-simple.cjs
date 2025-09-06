const fastify = require('fastify')({ logger: true });
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imena-gest-secret-2024';
const DB_PATH = process.env.DB_PATH || './database.sqlite';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000,https://web-production-21857.up.railway.app';

// Plugin CORS
fastify.register(require('@fastify/cors'), {
  origin: CORS_ORIGIN.split(','),
  credentials: true
});

// Plugin pour parser le body
fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/multipart'));

// Activer le parser JSON natif de Fastify (normalement activé par défaut)
// mais on le force pour être sûr
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const data = JSON.parse(body);
    done(null, data);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Plugin pour servir les fichiers statiques (frontend build)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'dist'),
  prefix: '/',
});

// Servir l'index.html pour toutes les routes non-API (SPA routing)
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'API endpoint not found' });
  } else {
    reply.sendFile('index.html');
  }
});

// Base de données
let db;

// Initialisation de la base de données
async function initDatabase() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Créer les tables si elles n'existent pas
  await db.exec(`
    -- Table des rôles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      permissions TEXT NOT NULL, -- JSON array of permissions
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des utilisateurs
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role_id TEXT REFERENCES roles(id),
      role TEXT DEFAULT 'user', -- Keep for backward compatibility
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des patients
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      date_of_birth DATE,
      gender TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      referring_entity TEXT,
      current_room_id TEXT,
      status_in_room TEXT,
      room_specific_data TEXT, -- JSON pour les données spécifiques aux salles
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table de l'historique des patients (mouvements entre salles)
    CREATE TABLE IF NOT EXISTS patient_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER REFERENCES patients(id),
      room_id TEXT NOT NULL,
      entry_date DATETIME NOT NULL,
      exit_date DATETIME,
      status_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des documents des patients
    CREATE TABLE IF NOT EXISTS patient_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER REFERENCES patients(id),
      document_name TEXT NOT NULL,
      document_type TEXT,
      document_url TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des examens
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER REFERENCES patients(id),
      exam_type TEXT NOT NULL,
      exam_date DATETIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des salles
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      capacity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des stocks (étendue)
    CREATE TABLE IF NOT EXISTS stock_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      designation TEXT,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      max_quantity INTEGER,
      unit_price REAL DEFAULT 0,
      location TEXT,
      supplier TEXT,
      barcode TEXT,
      expiry_date DATE,
      storage_conditions TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des mouvements de stock
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movement_id TEXT UNIQUE NOT NULL,
      stock_item_id INTEGER REFERENCES stock_items(id),
      type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment', 'transfer')),
      quantity INTEGER NOT NULL,
      unit_price REAL,
      total_amount REAL,
      document_ref TEXT,
      destination_source TEXT,
      ordonnateur TEXT,
      notes TEXT,
      performed_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des assets (patrimoine)
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT UNIQUE NOT NULL,
      designation TEXT NOT NULL,
      category TEXT NOT NULL,
      acquisition_date DATE,
      acquisition_cost REAL,
      current_value REAL,
      depreciation_rate REAL DEFAULT 0,
      location TEXT,
      status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'out_of_service', 'disposed')),
      warranty_expiry DATE,
      supplier TEXT,
      serial_number TEXT,
      model TEXT,
      specifications TEXT, -- JSON
      is_functional BOOLEAN DEFAULT TRUE,
      current_action TEXT,
      responsible_person TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des maintenances d'assets
    CREATE TABLE IF NOT EXISTS asset_maintenances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      maintenance_id TEXT UNIQUE NOT NULL,
      asset_id INTEGER REFERENCES assets(id),
      type TEXT NOT NULL CHECK (type IN ('preventive', 'corrective', 'calibration', 'inspection')),
      scheduled_date DATE,
      performed_date DATE,
      performed_by TEXT,
      cost REAL,
      description TEXT,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
      next_maintenance_date DATE,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des configurations d'examen
    CREATE TABLE IF NOT EXISTS exam_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON string des champs
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des modèles de rapport
    CREATE TABLE IF NOT EXISTS report_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des logs système
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT UNIQUE NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
      category TEXT NOT NULL CHECK (category IN ('system', 'security', 'medical', 'user', 'performance', 'audit')),
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT, -- JSON data
      user_id INTEGER REFERENCES users(id),
      session_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      correlation_id TEXT,
      duration INTEGER, -- en millisecondes
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des événements de sécurité
    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT NOT NULL CHECK (type IN ('authentication', 'authorization', 'data_access', 'system_access', 'configuration_change', 'suspicious_activity')),
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      user_id INTEGER REFERENCES users(id),
      ip_address TEXT,
      user_agent TEXT,
      resource TEXT,
      action TEXT,
      success BOOLEAN NOT NULL,
      details TEXT, -- JSON details
      geolocation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id), -- NULL pour notifications globales
      read_status BOOLEAN DEFAULT FALSE,
      urgent BOOLEAN DEFAULT FALSE,
      data TEXT, -- JSON data supplémentaire
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME
    );

    -- Table des lots de traceurs (Hot Lab)
    CREATE TABLE IF NOT EXISTS tracer_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lot_id TEXT UNIQUE NOT NULL,
      tracer_name TEXT NOT NULL,
      isotope TEXT NOT NULL,
      activity_mbq REAL NOT NULL,
      calibration_time DATETIME NOT NULL,
      expiry_time DATETIME NOT NULL,
      supplier TEXT,
      batch_number TEXT,
      quality_control_passed BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'disposed')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des logs de préparation (Hot Lab)
    CREATE TABLE IF NOT EXISTS preparation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preparation_id TEXT UNIQUE NOT NULL,
      patient_id INTEGER REFERENCES patients(id),
      tracer_lot_id INTEGER REFERENCES tracer_lots(id),
      prepared_by INTEGER REFERENCES users(id),
      preparation_time DATETIME NOT NULL,
      activity_prepared_mbq REAL NOT NULL,
      volume_ml REAL,
      quality_checks TEXT, -- JSON des vérifications
      notes TEXT,
      status TEXT DEFAULT 'prepared' CHECK (status IN ('prepared', 'injected', 'disposed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des isotopes
    CREATE TABLE IF NOT EXISTS isotopes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isotope_id TEXT UNIQUE NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      half_life_hours REAL NOT NULL,
      decay_constant REAL NOT NULL,
      energy_kev REAL NOT NULL,
      dose_rate_factor REAL NOT NULL, -- mSv/h par GBq à 1m
      usage_type TEXT, -- diagnostic, therapeutic, both
      safety_class TEXT, -- low, medium, high
      regulatory_notes TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des produits radiopharmaceutiques
    CREATE TABLE IF NOT EXISTS radiopharmaceuticals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      isotope_id INTEGER REFERENCES isotopes(id),
      isotope TEXT NOT NULL, -- Garde pour compatibilité
      half_life_hours REAL NOT NULL,
      max_activity_mbq REAL,
      storage_conditions TEXT,
      preparation_protocol TEXT,
      safety_precautions TEXT,
      regulatory_approval TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Index pour les performances
    CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_exams_patient_id ON exams(patient_id);
    CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);
    
    -- Index pour les logs
    CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
    CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
    CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
    
    -- Index pour les événements de sécurité
    CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
    CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
    
    -- Index pour les notifications
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    
    -- Index pour Hot Lab
    CREATE INDEX IF NOT EXISTS idx_tracer_lots_status ON tracer_lots(status);
    CREATE INDEX IF NOT EXISTS idx_tracer_lots_expiry ON tracer_lots(expiry_time);
    CREATE INDEX IF NOT EXISTS idx_preparation_logs_patient_id ON preparation_logs(patient_id);
    CREATE INDEX IF NOT EXISTS idx_preparation_logs_preparation_time ON preparation_logs(preparation_time);
    
    -- Index pour Stock
    CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);
    CREATE INDEX IF NOT EXISTS idx_stock_items_location ON stock_items(location);
    CREATE INDEX IF NOT EXISTS idx_stock_items_expiry ON stock_items(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(stock_item_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
    
    -- Index pour Assets
    CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
    CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
    CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
    CREATE INDEX IF NOT EXISTS idx_asset_maintenances_asset_id ON asset_maintenances(asset_id);
    CREATE INDEX IF NOT EXISTS idx_asset_maintenances_scheduled_date ON asset_maintenances(scheduled_date);
  `);

      // Migration: Ajouter les colonnes manquantes à la table patients
    try {
      await db.run('ALTER TABLE patients ADD COLUMN referring_entity TEXT');
      console.log('✅ Colonne referring_entity ajoutée');
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
    }
    
    try {
      await db.run('ALTER TABLE patients ADD COLUMN current_room_id TEXT');
      console.log('✅ Colonne current_room_id ajoutée');
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
    }
    
    try {
      await db.run('ALTER TABLE patients ADD COLUMN status_in_room TEXT');
      console.log('✅ Colonne status_in_room ajoutée');
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
    }
    
    try {
      await db.run('ALTER TABLE patients ADD COLUMN room_specific_data TEXT');
      console.log('✅ Colonne room_specific_data ajoutée');
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
    }

    // Migration: Corriger les statuts incohérents
    try {
      const result = await db.run("UPDATE patients SET status_in_room = 'WAITING' WHERE status_in_room = 'En attente'");
      console.log(`✅ Statuts "En attente" corrigés vers "WAITING" (${result.changes} patients)`);
    } catch (error) {
      console.log('⚠️ Erreur lors de la correction des statuts:', error.message);
    }
    
    try {
      await db.run("UPDATE patients SET status_in_room = 'SEEN' WHERE status_in_room = 'En cours'");
      console.log('✅ Statuts "En cours" corrigés vers "SEEN"');
    } catch (error) {
      console.log('⚠️ Erreur lors de la correction des statuts:', error.message);
    }

    // Créer les rôles par défaut
    const adminRoleExists = await db.get('SELECT id FROM roles WHERE id = ?', ['admin']);
  if (!adminRoleExists) {
    const adminPermissions = JSON.stringify([
      'view_patients', 'edit_patients', 'create_patients', 'move_patients', 
      'manage_appointments', 'manage_users', 'manage_roles', 'view_hot_lab', 
      'edit_hot_lab', 'view_statistics'
    ]);
    await db.run(
      'INSERT INTO roles (id, name, display_name, permissions) VALUES (?, ?, ?, ?)',
      ['admin', 'admin', 'Administrateur(trice)', adminPermissions]
    );
    console.log('✅ Rôle administrateur créé');
  }

  const userRoleExists = await db.get('SELECT id FROM roles WHERE id = ?', ['user']);
  if (!userRoleExists) {
    const userPermissions = JSON.stringify(['view_patients', 'view_hot_lab']);
    await db.run(
      'INSERT INTO roles (id, name, display_name, permissions) VALUES (?, ?, ?, ?)',
      ['user', 'user', 'Utilisateur', userPermissions]
    );
    console.log('✅ Rôle utilisateur créé');
  }

  // Créer des utilisateurs réalistes pour l'équipe médicale
  const adminExists = await db.get('SELECT id FROM users WHERE email = ?', ['admin@imena-gest.com']);
  if (!adminExists) {
    const realisticUsers = [
      ['Administrateur Système', 'admin@imena-gest.com', 'ImenaGest2024!', 'admin', 'admin'],
      ['Dr. Catherine MARTIN', 'dr.martin@chu-exemple.fr', 'MedNuc2024!', 'role_doctor', 'doctor'],
      ['Dr. Pierre ROUSSEAU', 'dr.rousseau@chu-exemple.fr', 'MedNuc2024!', 'role_doctor', 'doctor'],
      ['Sophie BERNARD', 'sophie.bernard@chu-exemple.fr', 'Tech2024!', 'role_technician', 'technician'],
      ['Marc DUBOIS', 'marc.dubois@chu-exemple.fr', 'Tech2024!', 'role_technician', 'technician'],
      ['Marie LEROY', 'marie.leroy@chu-exemple.fr', 'Reception2024!', 'role_reception', 'reception'],
      ['Julie MOREAU', 'julie.moreau@chu-exemple.fr', 'Reception2024!', 'role_reception', 'reception']
    ];

    for (const [name, email, password, roleId, role] of realisticUsers) {
      const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      'INSERT INTO users (name, email, password, role_id, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, roleId, role]
      );
    }
    console.log('✅ 7 utilisateurs réalistes créés pour l\'équipe médicale');
    console.log('   - Dr. Catherine MARTIN (Médecin nucléaire)');
    console.log('   - Dr. Pierre ROUSSEAU (Médecin nucléaire)');
    console.log('   - Sophie BERNARD (Technicienne)');
    console.log('   - Marc DUBOIS (Technicien)');
    console.log('   - Marie LEROY (Réceptionniste)');
    console.log('   - Julie MOREAU (Réceptionniste)');
    console.log('   - admin@imena-gest.com (Administrateur)');
  }

  // Créer des données réalistes pour la livraison
  const patientsCount = await db.get('SELECT COUNT(*) as count FROM patients');
  if (patientsCount.count === 0) {
    // Patients réalistes avec différents statuts
    const realisticPatients = [
      // Patients en demande
      ['PAT2024001', 'Dubois Marie', '1975-03-15', 'F', 'DEMANDE', 'WAITING', 'Service Cardiologie - CHU'],
      ['PAT2024002', 'Martin Pierre', '1982-07-22', 'M', 'DEMANDE', 'WAITING', 'Cabinet Dr. Rousseau'],
      ['PAT2024003', 'Leroy Sophie', '1968-11-08', 'F', 'DEMANDE', 'WAITING', 'Service Oncologie - CHU'],
      
      // Patients en rendez-vous
      ['PAT2024004', 'Bernard Jean', '1955-05-12', 'M', 'RENDEZVOUS', 'WAITING', 'Service Rhumatologie'],
      ['PAT2024005', 'Petit Anne', '1990-09-30', 'F', 'RENDEZVOUS', 'SEEN', 'Cabinet Dr. Moreau'],
      
      // Patients en consultation
      ['PAT2024006', 'Durand Michel', '1963-12-03', 'M', 'CONSULTATION', 'WAITING', 'Service Urologie'],
      ['PAT2024007', 'Moreau Claire', '1978-04-18', 'F', 'CONSULTATION', 'WAITING', 'Service Endocrinologie'],
      
      // Patients en injection
      ['PAT2024008', 'Rousseau Paul', '1945-08-25', 'M', 'INJECTION', 'WAITING', 'Service Oncologie'],
      
      // Patients en examen
      ['PAT2024009', 'Garcia Elena', '1987-02-14', 'F', 'EXAMEN', 'WAITING', 'Service Néphrologie'],
      
      // Patients en compte rendu
      ['PAT2024010', 'Lefebvre Thomas', '1972-10-07', 'M', 'COMPTE_RENDU', 'WAITING', 'Service Cardiologie']
    ];

    for (const [patientId, name, dob, gender, roomId, status, referring] of realisticPatients) {
      const result = await db.run(
        'INSERT INTO patients (patient_id, name, date_of_birth, gender, current_room_id, status_in_room, referring_entity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [patientId, name, dob, gender, roomId, status, referring]
      );
      
      // Ajouter historique initial
    await db.run(
        'INSERT INTO patient_history (patient_id, room_id, entry_date, status_message) VALUES (?, ?, ?, ?)',
        [result.lastID, roomId, new Date().toISOString(), `Entré dans ${roomId}`]
      );
    }
    
    console.log('✅ 10 patients réalistes créés avec historique');
  }

  // Créer des configurations d'examen réalistes
  const examConfigsCount = await db.get('SELECT COUNT(*) as count FROM exam_configurations');
  if (examConfigsCount.count === 0) {
    const realisticExamConfigs = [
      ['exam_scinti_osseuse', 'Scintigraphie Osseuse', JSON.stringify({
        request: [
          {id: "indications", label: "Indications", type: "checkbox", options: ["Bilan extension", "Recherche métastases", "Douleurs osseuses", "Suivi thérapeutique"]},
          {id: "antecedents", label: "Antécédents", type: "textarea"}
        ],
        consultation: [
          {id: "contre_indications", label: "Contre-indications", type: "checkbox", options: ["Grossesse", "Allaitement", "Allergie"]},
          {id: "poids", label: "Poids (kg)", type: "number"}
        ],
        report: [
          {id: "conclusion", label: "Conclusion", type: "textarea"}
        ]
      })],
      ['exam_scinti_thyroide', 'Scintigraphie Thyroïdienne', JSON.stringify({
        request: [
          {id: "indication", label: "Indication", type: "select", options: ["Nodule thyroïdien", "Hyperthyroïdie", "Bilan pré-opératoire"]},
          {id: "tsh", label: "TSH récente", type: "text"}
        ],
        consultation: [
          {id: "palpation", label: "Palpation thyroïde", type: "textarea"}
        ],
        report: [
          {id: "morphologie", label: "Morphologie", type: "textarea"},
          {id: "fixation", label: "Fixation", type: "textarea"}
        ]
      })],
      ['exam_scinti_renale', 'Scintigraphie Rénale', JSON.stringify({
        request: [
          {id: "type_examen", label: "Type examen", type: "select", options: ["DMSA", "DTPA", "MAG3"]},
          {id: "creatinine", label: "Créatininémie", type: "number"}
        ],
        consultation: [
          {id: "hydratation", label: "Hydratation", type: "checkbox", options: ["Hydratation pré-examen"]}
        ],
        report: [
          {id: "fonction_renale", label: "Fonction rénale", type: "textarea"}
        ]
      })],
      ['exam_scinti_myocardique', 'Scintigraphie Myocardique', JSON.stringify({
        request: [
          {id: "indication", label: "Indication", type: "select", options: ["Ischémie myocardique", "Viabilité myocardique", "Fonction VG", "Recherche nécrose"]},
          {id: "type_protocole", label: "Protocole", type: "select", options: ["Repos seul", "Effort + repos", "Dipyridamole", "Dobutamine"]},
          {id: "ecg_recent", label: "ECG récent", type: "checkbox", options: ["ECG normal", "Troubles du rythme", "Bloc de branche", "Antécédent IDM"]},
          {id: "antecedents_cardiaques", label: "Antécédents cardiaques", type: "textarea"},
          {id: "traitement_en_cours", label: "Traitement cardiaque", type: "textarea"}
        ],
        consultation: [
          {id: "contre_indications", label: "Contre-indications", type: "checkbox", options: ["Grossesse", "Allaitement", "Asthme sévère", "BPCO décompensée"]},
          {id: "poids", label: "Poids (kg)", type: "number"},
          {id: "frequence_cardiaque", label: "FC repos (bpm)", type: "number"},
          {id: "tension_arterielle", label: "TA (mmHg)", type: "text"},
          {id: "arret_medicaments", label: "Arrêt médicaments", type: "checkbox", options: ["Bêta-bloquants arrêtés", "Dérivés nitrés arrêtés", "Théophylline arrêtée"]}
        ],
        report: [
          {id: "perfusion_repos", label: "Perfusion de repos", type: "textarea"},
          {id: "perfusion_effort", label: "Perfusion effort/stress", type: "textarea"},
          {id: "fonction_vg", label: "Fonction VG", type: "textarea"},
          {id: "fevg", label: "FEVG (%)", type: "number"},
          {id: "motilite_segmentaire", label: "Motilité segmentaire", type: "textarea"}
        ]
      })],
      ['exam_scinti_parathyroide', 'Scintigraphie Parathyroïdienne', JSON.stringify({
        request: [
          {id: "indication", label: "Indication", type: "select", options: ["Hyperparathyroïdie primaire", "Adénome parathyroïdien", "Hyperplasie parathyroïdienne", "Récidive post-chirurgie"]},
          {id: "calcemie", label: "Calcémie (mmol/L)", type: "number"},
          {id: "pth", label: "PTH (pg/mL)", type: "number"},
          {id: "phosphoremie", label: "Phosphorémie (mmol/L)", type: "number"},
          {id: "vitamine_d", label: "25-OH Vitamine D", type: "number"},
          {id: "echographie", label: "Échographie cervicale", type: "textarea"},
          {id: "antecedents", label: "Antécédents", type: "textarea"}
        ],
        consultation: [
          {id: "contre_indications", label: "Contre-indications", type: "checkbox", options: ["Grossesse", "Allaitement", "Allergie iode"]},
          {id: "poids", label: "Poids (kg)", type: "number"},
          {id: "palpation_cervicale", label: "Palpation cervicale", type: "textarea"},
          {id: "cicatrices", label: "Cicatrices cervicales", type: "checkbox", options: ["Thyroïdectomie", "Parathyroïdectomie", "Autres chirurgies cervicales"]}
        ],
        report: [
          {id: "thyroide_morphologie", label: "Thyroïde - Morphologie", type: "textarea"},
          {id: "thyroide_fixation", label: "Thyroïde - Fixation", type: "textarea"},
          {id: "parathyroides_localisation", label: "Parathyroïdes - Localisation", type: "textarea"},
          {id: "parathyroides_nombre", label: "Nombre de foyers", type: "number"},
          {id: "washout", label: "Washout thyroïdien", type: "select", options: ["Rapide (< 2h)", "Normal (2-3h)", "Lent (> 3h)"]},
          {id: "retention_parathyroide", label: "Rétention parathyroïdienne", type: "select", options: ["Absente", "Modérée", "Intense"]}
        ]
      })]
    ];

    for (const [configId, name, fields] of realisticExamConfigs) {
    await db.run(
        'INSERT INTO exam_configurations (config_id, name, fields) VALUES (?, ?, ?)',
        [configId, name, fields]
      );
    }
    console.log('✅ 4 configurations d\'examen réalistes créées');
  }

  // Créer des modèles de rapport réalistes
  const reportTemplatesCount = await db.get('SELECT COUNT(*) as count FROM report_templates');
  if (reportTemplatesCount.count === 0) {
    const realisticTemplates = [
      ['template_scinti_osseuse_normale', 'Scintigraphie Osseuse - Normale', JSON.stringify({
        reportContent: "<p><b>Technique :</b></p><p>Injection intraveineuse de 740 MBq de 99mTc-HMDP. Acquisition d'images corps entier et de clichés statiques 3 heures après injection.</p><p><b>Résultats :</b></p><p>Examen normal. Distribution homogène du traceur sur l'ensemble du squelette. Pas de foyer d'hyperfixation pathologique.</p>",
        conclusionContent: "<p><b>CONCLUSION :</b></p><p>Scintigraphie osseuse normale.</p>",
        examName: "Scintigraphie Osseuse"
      })],
      ['template_scinti_thyroide_normale', 'Scintigraphie Thyroïdienne - Normale', JSON.stringify({
        reportContent: "<p><b>Technique :</b></p><p>Injection de 185 MBq de 99mTc-Pertechnetate. Acquisition 20 minutes après injection.</p><p><b>Résultats :</b></p><p>Thyroïde de taille et morphologie normales. Fixation homogène et symétrique des deux lobes.</p>",
        conclusionContent: "<p><b>CONCLUSION :</b></p><p>Scintigraphie thyroïdienne normale.</p>",
        examName: "Scintigraphie Thyroïdienne"
      })],
      ['template_scinti_renale_normale', 'Scintigraphie Rénale - Normale', JSON.stringify({
        reportContent: "<p><b>Technique :</b></p><p>Injection de 185 MBq de 99mTc-DTPA. Acquisition dynamique puis statique.</p><p><b>Résultats :</b></p><p>Fonction rénale globale normale. Reins de taille et position normales.</p>",
        conclusionContent: "<p><b>CONCLUSION :</b></p><p>Fonction rénale normale bilatérale.</p>",
        examName: "Scintigraphie Rénale"
      })],
      ['template_scinti_myocardique_normale', 'Scintigraphie Myocardique - Normale', JSON.stringify({
        reportContent: "<p><b>Technique :</b></p><p>Injection de 925 MBq de 99mTc-MIBI. Acquisitions au repos et après épreuve d'effort (150W, 85% FCM atteinte).</p><p><b>Résultats :</b></p><p><b>Perfusion myocardique :</b> Perfusion homogène dans tous les territoires vasculaires au repos et à l'effort.</p><p><b>Fonction VG :</b> Contractilité globale et segmentaire normale. FEVG : 65%.</p>",
        conclusionContent: "<p><b>CONCLUSION :</b></p><p>Scintigraphie myocardique d'effort normale. Pas d'argument scintigraphique en faveur d'une ischémie myocardique.</p>",
        examName: "Scintigraphie Myocardique"
      })],
      ['template_scinti_parathyroide_normale', 'Scintigraphie Parathyroïdienne - Normale', JSON.stringify({
        reportContent: "<p><b>Technique :</b></p><p>Injection de 740 MBq de 99mTc-MIBI. Acquisitions précoces (10 min) et tardives (2h) centrées sur la région cervico-thoracique supérieure.</p><p><b>Résultats :</b></p><p><b>Thyroïde :</b> Morphologie et fixation normales des deux lobes thyroïdiens.</p><p><b>Parathyroïdes :</b> Pas de foyer de rétention du traceur en faveur d'un adénome parathyroïdien.</p>",
        conclusionContent: "<p><b>CONCLUSION :</b></p><p>Scintigraphie parathyroïdienne normale. Pas d'argument scintigraphique en faveur d'un adénome parathyroïdien.</p>",
        examName: "Scintigraphie Parathyroïdienne"
      })],
      ['template_scinti_parathyroide_adenome', 'Scintigraphie Parathyroïdienne - Adénome', JSON.stringify({
        reportContent: "<p><b>Technique :</b></p><p>Injection de 740 MBq de 99mTc-MIBI. Acquisitions précoces (10 min) et tardives (2h) centrées sur la région cervico-thoracique supérieure.</p><p><b>Résultats :</b></p><p><b>Thyroïde :</b> Morphologie normale des deux lobes thyroïdiens.</p><p><b>Parathyroïdes :</b> Foyer de rétention du traceur en région polaire inférieure du lobe thyroïdien droit, compatible avec un adénome parathyroïdien.</p>",
        conclusionContent: "<p><b>CONCLUSION :</b></p><p>Foyer de rétention du MIBI évocateur d'un adénome parathyroïdien polaire inférieur droit.</p>",
        examName: "Scintigraphie Parathyroïdienne"
      })]
    ];

    for (const [templateId, name, content] of realisticTemplates) {
      await db.run(
        'INSERT INTO report_templates (template_id, name, content) VALUES (?, ?, ?)',
        [templateId, name, content]
      );
    }
    console.log('✅ 3 modèles de rapport réalistes créés');
  }

  // Créer des lots de traceurs réalistes
  const tracerLotsCount = await db.get('SELECT COUNT(*) as count FROM tracer_lots');
  if (tracerLotsCount.count === 0) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const realisticTracers = [
      ['lot_hmdp_001', 'HMDP', '99mTc', 3700, today.toISOString(), tomorrow.toISOString(), 'CIS bio international', 'LOT240115'],
      ['lot_pertechnetate_001', 'Pertechnetate', '99mTc', 1850, today.toISOString(), tomorrow.toISOString(), 'CIS bio international', 'LOT240116'],
      ['lot_dtpa_001', 'DTPA', '99mTc', 925, today.toISOString(), tomorrow.toISOString(), 'CIS bio international', 'LOT240117'],
      ['lot_mibi_001', 'MIBI (Sestamibi)', '99mTc', 2775, today.toISOString(), tomorrow.toISOString(), 'CIS bio international', 'LOT240118'],
      ['lot_mibi_002', 'MIBI (Parathyroïdes)', '99mTc', 1480, today.toISOString(), tomorrow.toISOString(), 'CIS bio international', 'LOT240119'],
      ['lot_tetrofosmin_001', 'Tetrofosmin', '99mTc', 1850, today.toISOString(), tomorrow.toISOString(), 'GE Healthcare', 'LOT240120']
    ];

    for (const [lotId, tracerName, isotope, activity, calibTime, expiryTime, supplier, batchNumber] of realisticTracers) {
      await db.run(
        'INSERT INTO tracer_lots (lot_id, tracer_name, isotope, activity_mbq, calibration_time, expiry_time, supplier, batch_number, quality_control_passed, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [lotId, tracerName, isotope, activity, calibTime, expiryTime, supplier, batchNumber, true, 1]
      );
    }
    console.log('✅ 3 lots de traceurs réalistes créés');
  }

  // Créer des assets réalistes
  const assetsCount = await db.get('SELECT COUNT(*) as count FROM assets');
  if (assetsCount.count === 0) {
    const realisticAssets = [
      ['asset_gamma_001', 'Gamma-caméra Siemens Symbia T2', 'Imagerie médicale', '2018-03-15', 450000, 320000, 'Salle Gamma 1', 'Siemens Healthineers', 'SN123456789', 'Symbia T2'],
      ['asset_gamma_002', 'Gamma-caméra GE Discovery NM630', 'Imagerie médicale', '2020-09-10', 380000, 300000, 'Salle Gamma 2', 'GE Healthcare', 'SN987654321', 'Discovery NM630'],
      ['asset_activimetre_001', 'Activimètre Capintec CRC-25R', 'Radioprotection', '2019-05-20', 25000, 18000, 'Hot Lab', 'Capintec', 'SN456789123', 'CRC-25R'],
      ['asset_blindage_001', 'Château plombé mobile', 'Radioprotection', '2017-11-30', 8000, 6000, 'Hot Lab', 'LEMER PAX', 'SN789123456', 'CP-500'],
      ['asset_injecteur_001', 'Injecteur automatique Medrad', 'Injection', '2021-01-15', 35000, 28000, 'Salle Injection', 'Bayer Radiology', 'SN321654987', 'Stellant CT']
    ];

    for (const [assetId, designation, category, acqDate, acqCost, currentValue, location, supplier, serialNumber, model] of realisticAssets) {
      await db.run(
        'INSERT INTO assets (asset_id, designation, category, acquisition_date, acquisition_cost, current_value, location, supplier, serial_number, model, is_functional, current_action, responsible_person) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [assetId, designation, category, acqDate, acqCost, currentValue, location, supplier, serialNumber, model, true, 'En service', 'Technicien responsable']
      );
    }
    console.log('✅ 5 équipements médicaux réalistes créés');
  }

  // Créer des articles de stock réalistes
  const stockItemsCount = await db.get('SELECT COUNT(*) as count FROM stock_items');
  if (stockItemsCount.count === 0) {
    const realisticStock = [
      ['stock_seringues_5ml', 'Seringues 5ml', 'Seringues jetables 5ml', 'Consommables médicaux', 'boîte', 25, 10, 50, 12.50, 'Pharmacie centrale', 'BD Medical'],
      ['stock_seringues_10ml', 'Seringues 10ml', 'Seringues jetables 10ml', 'Consommables médicaux', 'boîte', 18, 10, 40, 15.80, 'Pharmacie centrale', 'BD Medical'],
      ['stock_aiguilles_21g', 'Aiguilles 21G', 'Aiguilles jetables 21G x 1.5"', 'Consommables médicaux', 'boîte', 30, 15, 60, 8.90, 'Pharmacie centrale', 'Terumo'],
      ['stock_compresses', 'Compresses stériles', 'Compresses stériles 10x10cm', 'Consommables médicaux', 'paquet', 45, 20, 80, 3.20, 'Réserve matériel', 'Hartmann'],
      ['stock_gants_latex', 'Gants latex', 'Gants d\'examen latex poudrés', 'Équipement protection', 'boîte', 12, 8, 30, 6.75, 'Vestiaires', 'Ansell'],
      ['stock_film_radio', 'Films radiographiques', 'Films 35x43cm', 'Imagerie', 'boîte', 8, 5, 20, 85.00, 'Chambre noire', 'Agfa HealthCare'],
      ['stock_produit_contraste', 'Produit de contraste', 'Iode 300mg/ml', 'Produits pharmaceutiques', 'flacon', 15, 10, 30, 45.60, 'Pharmacie sécurisée', 'Guerbet']
    ];

    for (const [itemId, name, designation, category, unit, currentStock, minQty, maxQty, unitPrice, location, supplier] of realisticStock) {
      await db.run(
        'INSERT INTO stock_items (item_id, name, designation, category, unit, current_stock, min_quantity, max_quantity, unit_price, location, supplier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [itemId, name, designation, category, unit, currentStock, minQty, maxQty, unitPrice, location, supplier, true]
      );
    }
    console.log('✅ 7 articles de stock réalistes créés');
  }

  const roomsCount = await db.get('SELECT COUNT(*) as count FROM rooms');
  if (roomsCount.count === 0) {
    const rooms = [
      ['DEMANDE', 'Demande', 'administrative', 50],
      ['RENDEZVOUS', 'Rendez-vous', 'administrative', 30],
      ['CONSULTATION', 'Consultation', 'medical', 10],
      ['INJECTION', 'Injection', 'medical', 6],
      ['EXAMEN', 'Examen', 'imaging', 4],
      ['COMPTE_RENDU', 'Compte Rendu', 'administrative', 5],
      ['RETRAIT_CR_SORTIE', 'Retrait CR / Sortie', 'administrative', 20],
      ['ARCHIVE', 'Archive', 'storage', 1000]
    ];
    for (const [id, name, type, capacity] of rooms) {
      await db.run(
        'INSERT INTO rooms (room_id, name, type, capacity) VALUES (?, ?, ?, ?)',
        [id, name, type, capacity]
      );
    }
    console.log('✅ 8 salles du workflow médical créées');
  }

  // Créer des notifications réalistes
  const notificationsCount = await db.get('SELECT COUNT(*) as count FROM notifications');
  if (notificationsCount.count === 0) {
    const realisticNotifications = [
      ['info', 'Système démarré', 'Application IMENA-GEST démarrée avec succès', null, false],
      ['warning', 'Stock bas', 'Stock de seringues 5ml en dessous du seuil minimum', null, false],
      ['info', 'Nouveau patient', 'Nouvelle demande d\'examen reçue', 1, false],
      ['success', 'Maintenance terminée', 'Maintenance préventive gamma-caméra 1 terminée', 1, false]
    ];

    for (const [type, title, message, userId, urgent] of realisticNotifications) {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await db.run(
        'INSERT INTO notifications (notification_id, type, title, message, user_id, urgent) VALUES (?, ?, ?, ?, ?, ?)',
        [notificationId, type, title, message, userId, urgent]
      );
    }
    console.log('✅ 4 notifications réalistes créées');
  }

  // Créer des logs système réalistes
  const logsCount = await db.get('SELECT COUNT(*) as count FROM system_logs');
  if (logsCount.count === 0) {
    const realisticLogs = [
      ['info', 'system', 'Application', 'Démarrage de l\'application IMENA-GEST', null, 1],
      ['info', 'medical', 'PatientService', 'Nouveau patient créé: PAT2024001', '{"patientId":"PAT2024001","action":"create"}', 1],
      ['info', 'user', 'AuthService', 'Connexion utilisateur: admin@imena-gest.com', '{"email":"admin@imena-gest.com","success":true}', 1],
      ['warn', 'system', 'StockService', 'Stock bas détecté: Seringues 5ml', '{"itemId":"stock_seringues_5ml","currentStock":25,"minStock":10}', null],
      ['info', 'medical', 'ExamService', 'Configuration d\'examen créée: Scintigraphie Osseuse', '{"configId":"exam_scinti_osseuse"}', 1]
    ];

    for (const [level, category, source, message, data, userId] of realisticLogs) {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await db.run(
        'INSERT INTO system_logs (log_id, level, category, source, message, data, user_id, correlation_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [logId, level, category, source, message, data, userId, correlationId]
      );
    }
    console.log('✅ 5 logs système réalistes créés');
  }

  // Créer les isotopes par défaut
  const isotopesCount = await db.get('SELECT COUNT(*) as count FROM isotopes');
  if (isotopesCount.count === 0) {
    const defaultIsotopes = [
      ['isotope_tc99m', 'Tc-99m', 'Technétium-99m', 6.02, 0.1151, 140, 0.0017, 'diagnostic', 'low', 'Isotope le plus utilisé en médecine nucléaire'],
      ['isotope_f18', 'F-18', 'Fluor-18', 1.83, 0.3788, 511, 0.013, 'diagnostic', 'medium', 'Utilisé pour TEP-FDG'],
      ['isotope_i131', 'I-131', 'Iode-131', 192.96, 0.00359, 364, 0.047, 'therapeutic', 'high', 'Thérapie thyroïde - Haute activité'],
      ['isotope_ga68', 'Ga-68', 'Gallium-68', 1.13, 0.6134, 511, 0.013, 'diagnostic', 'medium', 'TEP avec peptides marqués'],
      ['isotope_in111', 'In-111', 'Indium-111', 67.3, 0.0103, 245, 0.0085, 'diagnostic', 'medium', 'Marquage cellulaire']
    ];

    for (const [isotopeId, symbol, name, halfLife, decayConstant, energy, doseRate, usage, safety, notes] of defaultIsotopes) {
      await db.run(
        'INSERT INTO isotopes (isotope_id, symbol, name, half_life_hours, decay_constant, energy_kev, dose_rate_factor, usage_type, safety_class, regulatory_notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [isotopeId, symbol, name, halfLife, decayConstant, energy, doseRate, usage, safety, notes, 1]
      );
    }
    console.log('✅ 5 isotopes par défaut créés');
  }

  // Créer des produits radiopharmaceutiques liés aux isotopes
  const radiopharmaceuticalsCount = await db.get('SELECT COUNT(*) as count FROM radiopharmaceuticals');
  if (radiopharmaceuticalsCount.count === 0) {
    const defaultRadiopharmaceuticals = [
      ['prod_tc99m_hmdp', '99mTc-HMDP', 1, 'Tc-99m', 6.02, 3700, 'Réfrigérer 2-8°C', 'Kit lyophilisé + éluat', 'Port EPI complet', 'AMM France'],
      ['prod_tc99m_pertechnetate', '99mTc-Pertechnetate', 1, 'Tc-99m', 6.02, 1850, 'Réfrigérer 2-8°C', 'Éluat direct', 'Port EPI complet', 'AMM France'],
      ['prod_tc99m_mibi', '99mTc-MIBI (Sestamibi)', 1, 'Tc-99m', 6.02, 925, 'Réfrigérer 2-8°C', 'Kit lyophilisé', 'Port EPI complet', 'AMM France'],
      ['prod_f18_fdg', '18F-FDG', 2, 'F-18', 1.83, 370, 'Réfrigérer 2-8°C', 'Solution injectable', 'Blindage plombé', 'AMM France'],
      ['prod_i131_iodure', '131I-Iodure de Sodium', 3, 'I-131', 192.96, 3700, 'Température ambiante', 'Gélule ou solution', 'Isolement patient', 'AMM France - Thérapie']
    ];

    for (const [productId, name, isotopeDbId, isotope, halfLife, maxActivity, storage, protocol, safety, regulatory] of defaultRadiopharmaceuticals) {
      await db.run(
        'INSERT INTO radiopharmaceuticals (product_id, name, isotope_id, isotope, half_life_hours, max_activity_mbq, storage_conditions, preparation_protocol, safety_precautions, regulatory_approval) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [productId, name, isotopeDbId, isotope, halfLife, maxActivity, storage, protocol, safety, regulatory]
      );
    }
    console.log('✅ 5 produits radiopharmaceutiques créés');
  }
}

// Middleware d'authentification
async function authenticate(request, reply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ success: false, message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return reply.code(401).send({ success: false, message: 'Utilisateur non trouvé' });
    }

    request.user = user;
  } catch (error) {
    return reply.code(401).send({ success: false, message: 'Token invalide' });
  }
}

// Routes
// Santé
fastify.get('/health', async (request, reply) => {
  return {
    success: true,
    message: 'API IMENA-GEST Simple opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
});

// Authentification
fastify.post('/api/v1/auth/login', async (request, reply) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Email et mot de passe requis' 
    });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ 
        success: false, 
        message: 'Identifiants invalides' 
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Créer un objet role complet pour l'admin
    let roleObject = null;
    if (user.role === 'admin') {
      roleObject = {
        id: 'role_admin',
        name: 'Administrateur(trice)',
        displayName: 'Administrateur(trice)',
        permissions: [
          'view_patients', 'edit_patients', 'create_patients', 'move_patients', 
          'manage_appointments', 'manage_users', 'manage_roles', 'view_hot_lab', 
          'edit_hot_lab', 'view_statistics'
        ]
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          roleId: user.role === 'admin' ? 'role_admin' : user.role,
          role: roleObject  // Mettre l'objet role directement dans le champ role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la connexion' 
    });
  }
});

// Profile
fastify.get('/api/v1/auth/profile', { preHandler: authenticate }, async (request, reply) => {
  // Créer un objet role complet pour l'admin
  let roleObject = null;
  if (request.user.role === 'admin') {
    roleObject = {
      id: 'role_admin',
      name: 'Administrateur(trice)',
      displayName: 'Administrateur(trice)',
      permissions: [
        'view_patients', 'edit_patients', 'create_patients', 'move_patients', 
        'manage_appointments', 'manage_users', 'manage_roles', 'view_hot_lab', 
        'edit_hot_lab', 'view_statistics'
      ]
    };
  }

  return {
    success: true,
    data: {
      user: {
        ...request.user,
        roleId: request.user.role === 'admin' ? 'role_admin' : request.user.role,
        role: roleObject
      }
    }
  };
});

// Déconnexion
fastify.post('/api/v1/auth/logout', async (request, reply) => {
  // En production, on pourrait invalider le token dans une blacklist
  return {
    success: true,
    message: 'Déconnexion réussie'
  };
});

// Patients
fastify.get('/api/v1/patients', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { page = 1, limit = 20, search = '' } = request.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM patients';
    let countQuery = 'SELECT COUNT(*) as total FROM patients';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR patient_id LIKE ?';
      countQuery += ' WHERE name LIKE ? OR patient_id LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const patients = await db.all(query, params);
    const { total } = await db.get(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

    // Récupérer l'historique pour chaque patient
    const patientsWithHistory = await Promise.all(patients.map(async (patient) => {
      const history = await db.all(
        'SELECT * FROM patient_history WHERE patient_id = ? ORDER BY entry_date',
        [patient.id]
      );
      
      return {
        id: patient.patient_id,
        name: patient.name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        referringEntity: patient.referring_entity,
        currentRoomId: patient.current_room_id,
        statusInRoom: patient.status_in_room,
        roomSpecificData: patient.room_specific_data ? JSON.parse(patient.room_specific_data) : {},
        creationDate: patient.created_at,
        history: history.map(h => ({
          roomId: h.room_id,
          entryDate: h.entry_date,
          exitDate: h.exit_date,
          statusMessage: h.status_message
        }))
      };
    }));

    return {
      success: true,
      data: {
        patients: patientsWithHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des patients' 
    });
  }
});

// Créer un patient
fastify.post('/api/v1/patients', { preHandler: authenticate }, async (request, reply) => {
  const { 
    patient_id, 
    name, 
    date_of_birth, 
    gender, 
    email, 
    phone, 
    address, 
    referring_entity,
    current_room_id = 'REQUEST',
    status_in_room = 'WAITING',
    room_specific_data = '{}',
    history = []
  } = request.body;

  if (!patient_id || !name) {
    return reply.code(400).send({ 
      success: false, 
      message: 'ID patient et nom requis' 
    });
  }

  try {
    // Commencer une transaction
    await db.run('BEGIN TRANSACTION');

    // Créer le patient
    const finalCurrentRoomId = current_room_id || 'REQUEST';
    const finalStatusInRoom = status_in_room || 'WAITING';
    const finalRoomSpecificData = room_specific_data || '{}';
    
    const result = await db.run(
      `INSERT INTO patients (patient_id, name, date_of_birth, gender, email, phone, address, referring_entity, current_room_id, status_in_room, room_specific_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, name, date_of_birth, gender, email, phone, address, referring_entity, finalCurrentRoomId, finalStatusInRoom, finalRoomSpecificData]
    );

    const patientId = result.lastID;

    // Ajouter l'historique initial si fourni
    if (Array.isArray(history) && history.length > 0) {
      for (const historyEntry of history) {
        await db.run(
          `INSERT INTO patient_history (patient_id, room_id, entry_date, exit_date, status_message) 
           VALUES (?, ?, ?, ?, ?)`,
          [patientId, historyEntry.roomId, historyEntry.entryDate, historyEntry.exitDate, historyEntry.statusMessage]
        );
      }
    } else {
      // Créer un historique par défaut
      const now = new Date().toISOString();
      const defaultRoomId = finalCurrentRoomId;
      await db.run(
        `INSERT INTO patient_history (patient_id, room_id, entry_date, status_message) 
         VALUES (?, ?, ?, ?)`,
        [patientId, defaultRoomId, now, 'Patient créé.']
      );
    }

    // Récupérer le patient complet avec son historique
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    const patientHistory = await db.all('SELECT * FROM patient_history WHERE patient_id = ? ORDER BY entry_date', [patientId]);

    // Valider la transaction
    await db.run('COMMIT');

    return {
      success: true,
      data: {
        ...patient,
        history: patientHistory.map(h => ({
          roomId: h.room_id,
          entryDate: h.entry_date,
          exitDate: h.exit_date,
          statusMessage: h.status_message
        }))
      }
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await db.run('ROLLBACK');
    
    if (error.code === 'SQLITE_CONSTRAINT') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Un patient avec cet ID existe déjà' 
      });
    }
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du patient' 
    });
  }
});

// Mettre à jour un patient
fastify.put('/api/v1/patients/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;

  try {
    // Construire la requête de mise à jour dynamiquement
    const fields = Object.keys(updates).filter(key => 
      ['name', 'date_of_birth', 'gender', 'email', 'phone', 'address', 'referring_entity', 'current_room_id', 'status_in_room', 'room_specific_data'].includes(key)
    );
    
    if (fields.length === 0) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Aucun champ valide à mettre à jour' 
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await db.run(
      `UPDATE patients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);

    if (!patient) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Patient non trouvé' 
      });
    }

    // Récupérer l'historique du patient
    const patientHistory = await db.all('SELECT * FROM patient_history WHERE patient_id = ? ORDER BY entry_date', [id]);

    return {
      success: true,
      data: {
        ...patient,
        history: patientHistory.map(h => ({
          roomId: h.room_id,
          entryDate: h.entry_date,
          exitDate: h.exit_date,
          statusMessage: h.status_message
        }))
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du patient' 
    });
  }
});

// Déplacer un patient vers une nouvelle salle
fastify.post('/api/v1/patients/:id/move', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { target_room_id, status_message } = request.body;

  if (!target_room_id) {
    return reply.code(400).send({ 
      success: false, 
      message: 'ID de salle de destination requis' 
    });
  }

  try {
    await db.run('BEGIN TRANSACTION');

    // Récupérer le patient actuel
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patient) {
      await db.run('ROLLBACK');
      return reply.code(404).send({ 
        success: false, 
        message: 'Patient non trouvé' 
      });
    }

    const now = new Date().toISOString();

    // Fermer l'historique de la salle actuelle
    if (patient.current_room_id) {
      await db.run(
        `UPDATE patient_history 
         SET exit_date = ? 
         WHERE patient_id = ? AND room_id = ? AND exit_date IS NULL`,
        [now, id, patient.current_room_id]
      );
    }

    // Ajouter l'entrée de sortie de la salle actuelle
    if (patient.current_room_id) {
      await db.run(
        `INSERT INTO patient_history (patient_id, room_id, entry_date, exit_date, status_message) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, patient.current_room_id, now, now, status_message || 'Déplacé manuellement.']
      );
    }

    // Ajouter l'entrée dans la nouvelle salle
    await db.run(
      `INSERT INTO patient_history (patient_id, room_id, entry_date, status_message) 
       VALUES (?, ?, ?, ?)`,
      [id, target_room_id, new Date(Date.parse(now) + 1).toISOString(), `Entré dans ${target_room_id}`]
    );

    // Mettre à jour le patient
    await db.run(
      `UPDATE patients SET current_room_id = ?, status_in_room = 'WAITING', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [target_room_id, id]
    );

    // Récupérer le patient mis à jour avec son historique
    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    const patientHistory = await db.all('SELECT * FROM patient_history WHERE patient_id = ? ORDER BY entry_date', [id]);

    await db.run('COMMIT');

    return {
      success: true,
      data: {
        ...updatedPatient,
        history: patientHistory.map(h => ({
          roomId: h.room_id,
          entryDate: h.entry_date,
          exitDate: h.exit_date,
          statusMessage: h.status_message
        }))
      }
    };
  } catch (error) {
    await db.run('ROLLBACK');
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors du déplacement du patient' 
    });
  }
});

// Traiter un formulaire de patient (nouvelle API)
fastify.post('/api/v1/patients/:id/process', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { room_id, form_data, status_message } = request.body;

  if (!room_id || !form_data) {
    return reply.code(400).send({ 
      success: false, 
      message: 'ID de salle et données de formulaire requis' 
    });
  }

  try {
    // Commencer une transaction
    await db.run('BEGIN TRANSACTION');

    const now = new Date().toISOString();
    
    // Récupérer le patient actuel (chercher par patient_id ou id)
    let currentPatient = await db.get('SELECT * FROM patients WHERE patient_id = ?', [id]);
    if (!currentPatient) {
      // Essayer avec l'ID numérique si l'ID string ne fonctionne pas
      currentPatient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    }
    if (!currentPatient) {
      await db.run('ROLLBACK');
      return reply.code(404).send({ 
        success: false, 
        message: 'Patient non trouvé' 
      });
    }

    // Mettre à jour les données spécifiques de la salle
    let roomSpecificData = {};
    try {
      roomSpecificData = JSON.parse(currentPatient.room_specific_data || '{}');
    } catch (error) {
      roomSpecificData = {};
    }
    
    roomSpecificData[room_id] = {
      ...roomSpecificData[room_id],
      ...form_data
    };

    // Déterminer le message de statut selon la salle
    let finalStatusMessage = status_message;
    if (!finalStatusMessage) {
      switch (room_id) {
        case 'DEMANDE':
          finalStatusMessage = `Demande complétée pour ${form_data.requestedExam || 'examen'}.`;
          break;
        case 'RENDEZVOUS':
          finalStatusMessage = `RDV planifié pour le ${form_data.dateRdv || ''} à ${form_data.heureRdv || ''}.`;
          break;
        case 'CONSULTATION':
          finalStatusMessage = 'Consultation terminée.';
          break;
        case 'INJECTION':
          finalStatusMessage = 'Injection enregistrée.';
          break;
        case 'EXAMEN':
          finalStatusMessage = `Examen saisi (Qualité: ${form_data.qualiteImages || 'N/A'}).`;
          break;
        case 'COMPTE_RENDU':
          finalStatusMessage = 'Compte rendu rédigé.';
          break;
        case 'RETRAIT_CR_SORTIE':
          finalStatusMessage = `CR retiré par ${form_data.retirePar || 'inconnu'}. Dossier archivé.`;
          break;
        default:
          finalStatusMessage = 'Action complétée.';
      }
    }

    // Mettre à jour l'historique - marquer la sortie de la salle actuelle
    await db.run(
      `UPDATE patient_history SET exit_date = ? WHERE patient_id = ? AND room_id = ? AND exit_date IS NULL`,
      [now, currentPatient.id, room_id]
    );

    // Ajouter une entrée d'historique pour l'action complétée
    await db.run(
      `INSERT INTO patient_history (patient_id, room_id, entry_date, status_message) 
       VALUES (?, ?, ?, ?)`,
      [currentPatient.id, room_id, now, finalStatusMessage]
    );

    // Déterminer la prochaine salle et le statut
    const roomConfigs = {
      'DEMANDE': { nextRoom: 'RENDEZVOUS' },
      'RENDEZVOUS': { nextRoom: 'CONSULTATION' },
      'CONSULTATION': { nextRoom: 'INJECTION' },
      'INJECTION': { nextRoom: 'EXAMEN' },
      'EXAMEN': { nextRoom: 'COMPTE_RENDU' },
      'COMPTE_RENDU': { nextRoom: 'RETRAIT_CR_SORTIE' },
      'RETRAIT_CR_SORTIE': { nextRoom: 'ARCHIVE' }
    };

    let nextRoomId = currentPatient.current_room_id;
    let nextStatus = 'SEEN';

    if (roomConfigs[room_id] && roomConfigs[room_id].nextRoom) {
      nextRoomId = roomConfigs[room_id].nextRoom;
      nextStatus = 'WAITING';
      
      // Ajouter l'entrée dans la nouvelle salle
      await db.run(
        `INSERT INTO patient_history (patient_id, room_id, entry_date, status_message) 
         VALUES (?, ?, ?, ?)`,
        [currentPatient.id, nextRoomId, new Date(Date.parse(now) + 1).toISOString(), `Entré dans ${nextRoomId}`]
      );
    }

    // Mettre à jour le patient
    await db.run(
      `UPDATE patients SET 
        current_room_id = ?, 
        status_in_room = ?, 
        room_specific_data = ?, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [nextRoomId, nextStatus, JSON.stringify(roomSpecificData), currentPatient.id]
    );

    // Récupérer le patient mis à jour avec son historique
    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [currentPatient.id]);
    const patientHistory = await db.all('SELECT * FROM patient_history WHERE patient_id = ? ORDER BY entry_date', [currentPatient.id]);

    // Valider la transaction
    await db.run('COMMIT');

    return {
      success: true,
      data: {
        id: updatedPatient.patient_id,
        name: updatedPatient.name,
        dateOfBirth: updatedPatient.date_of_birth,
        gender: updatedPatient.gender,
        email: updatedPatient.email,
        phone: updatedPatient.phone,
        address: updatedPatient.address,
        referringEntity: updatedPatient.referring_entity,
        currentRoomId: updatedPatient.current_room_id,
        statusInRoom: updatedPatient.status_in_room,
        roomSpecificData: updatedPatient.room_specific_data ? JSON.parse(updatedPatient.room_specific_data) : {},
        creationDate: updatedPatient.created_at,
        history: patientHistory.map(h => ({
          roomId: h.room_id,
          entryDate: h.entry_date,
          exitDate: h.exit_date,
          statusMessage: h.status_message
        }))
      }
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await db.run('ROLLBACK');
    
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors du traitement du formulaire patient' 
    });
  }
});

// Ajouter une entrée d'historique pour un patient
fastify.post('/api/v1/patients/:id/history', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { room_id, entry_date, exit_date, status_message } = request.body;

  if (!room_id || !entry_date) {
    return reply.code(400).send({ 
      success: false, 
      message: 'ID de salle et date d\'entrée requis' 
    });
  }

  try {
    const result = await db.run(
      `INSERT INTO patient_history (patient_id, room_id, entry_date, exit_date, status_message) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, room_id, entry_date, exit_date, status_message]
    );

    const historyEntry = await db.get('SELECT * FROM patient_history WHERE id = ?', [result.lastID]);

    return {
      success: true,
      data: {
        roomId: historyEntry.room_id,
        entryDate: historyEntry.entry_date,
        exitDate: historyEntry.exit_date,
        statusMessage: historyEntry.status_message
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de l\'ajout de l\'historique' 
    });
  }
});

// Supprimer un patient
fastify.delete('/api/v1/patients/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    // Chercher le patient par patient_id ou id numérique
    let patient = await db.get('SELECT * FROM patients WHERE patient_id = ?', [id]);
    if (!patient) {
      patient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);
    }

    if (!patient) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Patient non trouvé' 
      });
    }

    // Supprimer aussi l'historique du patient
    await db.run('DELETE FROM patient_history WHERE patient_id = ?', [patient.id]);
    await db.run('DELETE FROM patients WHERE id = ?', [patient.id]);

    return {
      success: true,
      message: 'Patient supprimé avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression du patient' 
    });
  }
});

// Récupérer un patient par ID
fastify.get('/api/v1/patients/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [id]);

    if (!patient) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Patient non trouvé' 
      });
    }

    return {
      success: true,
      data: patient
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération du patient' 
    });
  }
});

// Examens
fastify.get('/api/v1/exams', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { date } = request.query;
    let query = `
      SELECT e.*, p.name as patient_name, p.patient_id, u.name as created_by_name 
      FROM exams e
      LEFT JOIN patients p ON e.patient_id = p.id
      LEFT JOIN users u ON e.created_by = u.id
    `;
    const params = [];

    if (date) {
      query += ' WHERE DATE(e.exam_date) = DATE(?)';
      params.push(date);
    }

    query += ' ORDER BY e.exam_date ASC';

    const exams = await db.all(query, params);

    return {
      success: true,
      data: {
        exams
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des examens' 
    });
  }
});

// Salles
fastify.get('/api/v1/rooms', { preHandler: authenticate }, async (request, reply) => {
  try {
    const rooms = await db.all('SELECT * FROM rooms ORDER BY room_id');
    
    // Compter les patients dans chaque salle
    for (const room of rooms) {
      const { count } = await db.get(
        'SELECT COUNT(*) as count FROM patients WHERE current_room_id = ?',
        [room.room_id]
      );
      room.current_occupancy = count;
    }

    return {
      success: true,
      data: {
        rooms
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des salles' 
    });
  }
});

// Stock
fastify.get('/api/v1/stock', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { category } = request.query;
    let query = 'SELECT * FROM stock_items';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY name ASC';

    const items = await db.all(query, params);

    return {
      success: true,
      data: {
        items
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération du stock' 
    });
  }
});

// Statistiques simples
fastify.get('/api/v1/stats/summary', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { count: totalPatients } = await db.get('SELECT COUNT(*) as count FROM patients');
    const { count: todayExams } = await db.get(
      'SELECT COUNT(*) as count FROM exams WHERE DATE(exam_date) = DATE(?)',
      [new Date().toISOString()]
    );
    const { count: lowStock } = await db.get(
      'SELECT COUNT(*) as count FROM stock_items WHERE quantity <= min_quantity'
    );

    return {
      success: true,
      data: {
        totalPatients,
        todayExams,
        lowStock
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// ===== CONFIGURATIONS D'EXAMEN =====

// Récupérer toutes les configurations d'examen
fastify.get('/api/v1/exam-configurations', { preHandler: authenticate }, async (request, reply) => {
  try {
    const configs = await db.all('SELECT * FROM exam_configurations ORDER BY name ASC');
    
    // Parser les champs JSON
    const parsedConfigs = configs.map(config => ({
      ...config,
      fields: JSON.parse(config.fields)
    }));

    return {
      success: true,
      data: {
        examConfigurations: parsedConfigs
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des configurations d\'examen' 
    });
  }
});

// Créer une nouvelle configuration d'examen
fastify.post('/api/v1/exam-configurations', { preHandler: authenticate }, async (request, reply) => {
  const { config_id, name, fields } = request.body;

  if (!config_id || !name || !fields) {
    return reply.code(400).send({ 
      success: false, 
      message: 'ID, nom et champs requis' 
    });
  }

  try {
    const result = await db.run(
      'INSERT INTO exam_configurations (config_id, name, fields) VALUES (?, ?, ?)',
      [config_id, name, JSON.stringify(fields)]
    );

    const config = await db.get('SELECT * FROM exam_configurations WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: {
        ...config,
        fields: JSON.parse(config.fields)
      }
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Une configuration avec cet ID existe déjà' 
      });
    }
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création de la configuration d\'examen' 
    });
  }
});

// Mettre à jour une configuration d'examen
fastify.put('/api/v1/exam-configurations/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { name, fields } = request.body;

  try {
    // Essayer d'abord par config_id, puis par id numérique
    let result = await db.run(
      'UPDATE exam_configurations SET name = ?, fields = ?, updated_at = CURRENT_TIMESTAMP WHERE config_id = ?',
      [name, JSON.stringify(fields), id]
    );

    if (result.changes === 0) {
      // Si aucune ligne n'a été mise à jour, essayer avec l'ID numérique
      result = await db.run(
        'UPDATE exam_configurations SET name = ?, fields = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, JSON.stringify(fields), id]
      );
    }

    // Récupérer la configuration mise à jour
    let config = await db.get('SELECT * FROM exam_configurations WHERE config_id = ?', [id]);
    if (!config) {
      config = await db.get('SELECT * FROM exam_configurations WHERE id = ?', [id]);
    }
    
    if (!config) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Configuration non trouvée' 
      });
    }

    return {
      success: true,
      data: {
        ...config,
        fields: JSON.parse(config.fields)
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la configuration d\'examen' 
    });
  }
});

// Supprimer une configuration d'examen
fastify.delete('/api/v1/exam-configurations/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    let result = await db.run('DELETE FROM exam_configurations WHERE config_id = ?', [id]);
    
    if (result.changes === 0) {
      // Si aucune ligne n'a été supprimée, essayer avec l'ID numérique
      result = await db.run('DELETE FROM exam_configurations WHERE id = ?', [id]);
    }
    
    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Configuration non trouvée' 
      });
    }

    return {
      success: true,
      message: 'Configuration d\'examen supprimée avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression de la configuration d\'examen' 
    });
  }
});

// ===== MODÈLES DE RAPPORT =====

// Récupérer tous les modèles de rapport
fastify.get('/api/v1/report-templates', { preHandler: authenticate }, async (request, reply) => {
  try {
    const templates = await db.all('SELECT * FROM report_templates ORDER BY name ASC');

    return {
      success: true,
      data: {
        reportTemplates: templates
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des modèles de rapport' 
    });
  }
});

// Créer un nouveau modèle de rapport
fastify.post('/api/v1/report-templates', { preHandler: authenticate }, async (request, reply) => {
  const { template_id, name, content } = request.body;

  if (!template_id || !name || !content) {
    return reply.code(400).send({ 
      success: false, 
      message: 'ID, nom et contenu requis' 
    });
  }

  try {
    const result = await db.run(
      'INSERT INTO report_templates (template_id, name, content) VALUES (?, ?, ?)',
      [template_id, name, content]
    );

    const template = await db.get('SELECT * FROM report_templates WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: template
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Un modèle avec cet ID existe déjà' 
      });
    }
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du modèle de rapport' 
    });
  }
});

// Mettre à jour un modèle de rapport
fastify.put('/api/v1/report-templates/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { name, content } = request.body;

  try {
    // Essayer d'abord par template_id, puis par id numérique
    let result = await db.run(
      'UPDATE report_templates SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE template_id = ?',
      [name, content, id]
    );

    if (result.changes === 0) {
      // Si aucune ligne n'a été mise à jour, essayer avec l'ID numérique
      result = await db.run(
        'UPDATE report_templates SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, content, id]
      );
    }

    // Récupérer le modèle mis à jour
    let template = await db.get('SELECT * FROM report_templates WHERE template_id = ?', [id]);
    if (!template) {
      template = await db.get('SELECT * FROM report_templates WHERE id = ?', [id]);
    }
    
    if (!template) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Modèle non trouvé' 
      });
    }

    return {
      success: true,
      data: template
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du modèle de rapport' 
    });
  }
});

// Supprimer un modèle de rapport
fastify.delete('/api/v1/report-templates/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    let result = await db.run('DELETE FROM report_templates WHERE template_id = ?', [id]);
    
    if (result.changes === 0) {
      // Si aucune ligne n'a été supprimée, essayer avec l'ID numérique
      result = await db.run('DELETE FROM report_templates WHERE id = ?', [id]);
    }
    
    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Modèle non trouvé' 
      });
    }

    return {
      success: true,
      message: 'Modèle de rapport supprimé avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression du modèle de rapport' 
    });
  }
});

// ===== GESTION DES UTILISATEURS =====

// Récupérer tous les utilisateurs
fastify.get('/api/v1/users', { preHandler: authenticate }, async (request, reply) => {
  try {
    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.role_id, u.role, u.created_at, u.updated_at,
             r.name as role_name, r.display_name as role_display_name, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.name ASC
    `);

    // Parser les permissions JSON et restructurer les données
    const parsedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role_id || user.role, // Fallback sur l'ancien champ role
      role: user.role_id ? {
        id: user.role_id,
        name: user.role_name,
        displayName: user.role_display_name,
        permissions: JSON.parse(user.role_permissions || '[]')
      } : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    return {
      success: true,
      data: {
        users: parsedUsers
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des utilisateurs' 
    });
  }
});

// Créer un nouvel utilisateur
fastify.post('/api/v1/users', { preHandler: authenticate }, async (request, reply) => {
  const { name, email, password, roleId } = request.body;

  if (!name || !email || !password || !roleId) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Nom, email, mot de passe et rôle requis' 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.run(
      'INSERT INTO users (name, email, password, role_id, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, roleId, roleId] // role_id et role pour compatibilité
    );

    const user = await db.get(`
      SELECT u.id, u.name, u.email, u.role_id, u.role, u.created_at, u.updated_at,
             r.name as role_name, r.display_name as role_display_name, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [result.lastID]);
    
    // Restructurer les données
    const parsedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role_id,
      role: user.role_id ? {
        id: user.role_id,
        name: user.role_name,
        displayName: user.role_display_name,
        permissions: JSON.parse(user.role_permissions || '[]')
      } : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    return {
      success: true,
      data: parsedUser
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création de l\'utilisateur' 
    });
  }
});

// Mettre à jour un utilisateur
fastify.put('/api/v1/users/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { name, email, roleId, password } = request.body;

  try {
    let updateQuery = 'UPDATE users SET name = ?, email = ?, role_id = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    let values = [name, email, roleId, roleId, id]; // role_id et role pour compatibilité

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery = 'UPDATE users SET name = ?, email = ?, role_id = ?, role = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      values = [name, email, roleId, roleId, hashedPassword, id];
    }

    await db.run(updateQuery, values);

    const user = await db.get(`
      SELECT u.id, u.name, u.email, u.role_id, u.role, u.created_at, u.updated_at,
             r.name as role_name, r.display_name as role_display_name, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);
    
    if (!user) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Restructurer les données
    const parsedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role_id,
      role: user.role_id ? {
        id: user.role_id,
        name: user.role_name,
        displayName: user.role_display_name,
        permissions: JSON.parse(user.role_permissions || '[]')
      } : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    return {
      success: true,
      data: parsedUser
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Cet email est déjà utilisé' 
      });
    }
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de l\'utilisateur' 
    });
  }
});

// Supprimer un utilisateur
fastify.delete('/api/v1/users/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    // Vérifier qu'on ne supprime pas le dernier admin
    const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    const userToDelete = await db.get('SELECT role FROM users WHERE id = ?', [id]);
    
    if (userToDelete?.role === 'admin' && adminCount.count <= 1) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Impossible de supprimer le dernier administrateur' 
      });
    }

    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression de l\'utilisateur' 
    });
  }
});

// ===== GESTION DES RÔLES =====

// Récupérer tous les rôles
fastify.get('/api/v1/roles', { preHandler: authenticate }, async (request, reply) => {
  try {
    const roles = await db.all('SELECT * FROM roles ORDER BY name ASC');

    // Parser les permissions JSON
    const parsedRoles = roles.map(role => ({
      ...role,
      permissions: JSON.parse(role.permissions || '[]')
    }));

    return {
      success: true,
      data: {
        roles: parsedRoles
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des rôles' 
    });
  }
});

// Créer un nouveau rôle
fastify.post('/api/v1/roles', { preHandler: authenticate }, async (request, reply) => {
  const { id, name, displayName, permissions } = request.body;

  if (!id || !name || !displayName || !permissions) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Tous les champs sont obligatoires' 
    });
  }

  try {
    const permissionsJson = JSON.stringify(permissions);
    
    const result = await db.run(
      'INSERT INTO roles (id, name, display_name, permissions) VALUES (?, ?, ?, ?)',
      [id, name, displayName, permissionsJson]
    );

    const role = await db.get('SELECT * FROM roles WHERE id = ?', [id]);
    role.permissions = JSON.parse(role.permissions);
    
    return {
      success: true,
      data: {
        role: role
      }
    };
  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du rôle' 
    });
  }
});

// Mettre à jour un rôle
fastify.put('/api/v1/roles/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { name, displayName, permissions } = request.body;

  try {
    const permissionsJson = JSON.stringify(permissions);
    
    await db.run(
      'UPDATE roles SET name = ?, display_name = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, displayName, permissionsJson, id]
    );

    const role = await db.get('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (!role) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Rôle non trouvé' 
      });
    }

    role.permissions = JSON.parse(role.permissions);
    
    return {
      success: true,
      data: {
        role: role
      }
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du rôle' 
    });
  }
});

// Supprimer un rôle
fastify.delete('/api/v1/roles/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    // Vérifier qu'on ne supprime pas le rôle admin
    if (id === 'admin') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Le rôle administrateur ne peut pas être supprimé' 
      });
    }

    // Vérifier qu'aucun utilisateur n'utilise ce rôle
    const usersWithRole = await db.get('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id]);
    if (usersWithRole.count > 0) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Ce rôle est utilisé par des utilisateurs et ne peut pas être supprimé' 
      });
    }

    const result = await db.run('DELETE FROM roles WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return reply.code(404).send({
        success: false,
        message: 'Rôle non trouvé'
      });
    }

    return {
      success: true,
      message: 'Rôle supprimé avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la suppression du rôle:', error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression du rôle' 
    });
  }
});

// ===== LOGS SYSTÈME =====

// Créer un log
fastify.post('/api/v1/logs', { preHandler: authenticate }, async (request, reply) => {
  const { level, category, source, message, data, duration } = request.body;
  const userId = request.user?.id;

  if (!level || !category || !source || !message) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Level, category, source et message requis' 
    });
  }

  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const result = await db.run(
      `INSERT INTO system_logs (log_id, level, category, source, message, data, user_id, ip_address, user_agent, correlation_id, duration) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, level, category, source, message, data ? JSON.stringify(data) : null, userId, request.ip, request.headers['user-agent'], correlationId, duration]
    );

    const log = await db.get('SELECT * FROM system_logs WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: log
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du log' 
    });
  }
});

// Récupérer les logs
fastify.get('/api/v1/logs', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      level, 
      category, 
      source, 
      userId,
      startDate,
      endDate 
    } = request.query;
    
    let whereConditions = [];
    let params = [];

    if (level) {
      whereConditions.push('level = ?');
      params.push(level);
    }
    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }
    if (source) {
      whereConditions.push('source LIKE ?');
      params.push(`%${source}%`);
    }
    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(userId);
    }
    if (startDate) {
      whereConditions.push('timestamp >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('timestamp <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const logs = await db.all(
      `SELECT * FROM system_logs ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      params
    );

    const { total } = await db.get(
      `SELECT COUNT(*) as total FROM system_logs ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des logs' 
    });
  }
});

// ===== NOTIFICATIONS =====

// Créer une notification
fastify.post('/api/v1/notifications', { preHandler: authenticate }, async (request, reply) => {
  const { type, title, message, userId, urgent, data, expiresAt } = request.body;

  if (!type || !title || !message) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Type, titre et message requis' 
    });
  }

  try {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await db.run(
      `INSERT INTO notifications (notification_id, type, title, message, user_id, urgent, data, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [notificationId, type, title, message, userId || null, urgent || false, data ? JSON.stringify(data) : null, expiresAt || null]
    );

    const notification = await db.get('SELECT * FROM notifications WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: notification
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création de la notification' 
    });
  }
});

// Récupérer les notifications d'un utilisateur
fastify.get('/api/v1/notifications', { preHandler: authenticate }, async (request, reply) => {
  try {
    const userId = request.user?.id;
    const { unreadOnly = false, limit = 50 } = request.query;
    
    let whereClause = '(user_id = ? OR user_id IS NULL)';
    let params = [userId];
    
    if (unreadOnly === 'true') {
      whereClause += ' AND read_status = FALSE';
    }
    
    whereClause += ' AND (expires_at IS NULL OR expires_at > datetime("now"))';
    params.push(limit);

    const notifications = await db.all(
      `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      params
    );

    return {
      success: true,
      data: notifications
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des notifications' 
    });
  }
});

// Marquer une notification comme lue
fastify.put('/api/v1/notifications/:id/read', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  
  try {
    await db.run(
      'UPDATE notifications SET read_status = TRUE, read_at = datetime("now") WHERE notification_id = ?',
      [id]
    );

    return {
      success: true,
      message: 'Notification marquée comme lue'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la notification' 
    });
  }
});

// ===== HOT LAB =====

// Créer un lot de traceur
fastify.post('/api/v1/hotlab/tracer-lots', { preHandler: authenticate }, async (request, reply) => {
  const { tracerName, isotope, activityMbq, calibrationTime, expiryTime, supplier, batchNumber } = request.body;
  const userId = request.user?.id;

  if (!tracerName || !isotope || !activityMbq || !calibrationTime || !expiryTime) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Données de traceur incomplètes' 
    });
  }

  try {
    const lotId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const result = await db.run(
      `INSERT INTO tracer_lots (lot_id, tracer_name, isotope, activity_mbq, calibration_time, expiry_time, supplier, batch_number, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lotId, tracerName, isotope, activityMbq, calibrationTime, expiryTime, supplier, batchNumber, userId]
    );

    const lot = await db.get('SELECT * FROM tracer_lots WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: lot
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du lot de traceur' 
    });
  }
});

// Récupérer les lots de traceurs
fastify.get('/api/v1/hotlab/tracer-lots', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { status = 'active' } = request.query;
    
    const lots = await db.all(
      'SELECT * FROM tracer_lots WHERE status = ? ORDER BY created_at DESC',
      [status]
    );

    return {
      success: true,
      data: lots
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des lots de traceurs' 
    });
  }
});

// Créer un log de préparation
fastify.post('/api/v1/hotlab/preparation-logs', { preHandler: authenticate }, async (request, reply) => {
  const { patientId, tracerLotId, preparationTime, activityPreparedMbq, volumeMl, preparedBy, qualityChecks, notes } = request.body;
  const userId = request.user?.id;

  if (!patientId || !tracerLotId || !preparationTime || !activityPreparedMbq) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Données de préparation incomplètes' 
    });
  }

  try {
    const preparationId = `prep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Trouver le patient par patient_id (string) pour obtenir l'id numérique
    let patientDbId = patientId;
    if (patientId && isNaN(patientId)) {
      const patient = await db.get('SELECT id FROM patients WHERE patient_id = ?', [patientId]);
      if (patient) {
        patientDbId = patient.id;
      }
    }
    
    // Essayer de trouver l'utilisateur par nom si fourni
    let preparedByUserId = userId;
    if (preparedBy) {
      const userByName = await db.get('SELECT id FROM users WHERE name LIKE ?', [`%${preparedBy}%`]);
      if (userByName) {
        preparedByUserId = userByName.id;
      }
    }
    
    const result = await db.run(
      `INSERT INTO preparation_logs (preparation_id, patient_id, tracer_lot_id, prepared_by, preparation_time, activity_prepared_mbq, volume_ml, quality_checks, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [preparationId, patientDbId, tracerLotId, preparedByUserId, preparationTime, activityPreparedMbq, volumeMl, qualityChecks ? JSON.stringify(qualityChecks) : null, notes]
    );

    const preparation = await db.get('SELECT * FROM preparation_logs WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: preparation
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du log de préparation' 
    });
  }
});

// Mettre à jour un lot de traceur
fastify.put('/api/v1/hotlab/tracer-lots/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { tracerName, isotope, activityMbq, calibrationTime, expiryTime, supplier, batchNumber } = request.body;

  try {
    // Essayer d'abord par lot_id, puis par id numérique
    let result = await db.run(
      `UPDATE tracer_lots SET 
        tracer_name = ?, isotope = ?, activity_mbq = ?, calibration_time = ?, 
        expiry_time = ?, supplier = ?, batch_number = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE lot_id = ?`,
      [tracerName, isotope, activityMbq, calibrationTime, expiryTime, supplier, batchNumber, id]
    );

    if (result.changes === 0) {
      result = await db.run(
        `UPDATE tracer_lots SET 
          tracer_name = ?, isotope = ?, activity_mbq = ?, calibration_time = ?, 
          expiry_time = ?, supplier = ?, batch_number = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [tracerName, isotope, activityMbq, calibrationTime, expiryTime, supplier, batchNumber, id]
      );
    }

    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Lot de traceur non trouvé' 
      });
    }

    // Récupérer le lot mis à jour
    let lot = await db.get('SELECT * FROM tracer_lots WHERE lot_id = ?', [id]);
    if (!lot) {
      lot = await db.get('SELECT * FROM tracer_lots WHERE id = ?', [id]);
    }

    return {
      success: true,
      data: lot
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du lot de traceur' 
    });
  }
});

// Supprimer un lot de traceur
fastify.delete('/api/v1/hotlab/tracer-lots/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    // Essayer d'abord par lot_id, puis par id numérique
    let result = await db.run('UPDATE tracer_lots SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE lot_id = ?', ['disposed', id]);
    
    if (result.changes === 0) {
      result = await db.run('UPDATE tracer_lots SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['disposed', id]);
    }
    
    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Lot de traceur non trouvé' 
      });
    }

    return {
      success: true,
      message: 'Lot de traceur supprimé avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression du lot de traceur' 
    });
  }
});

// Récupérer les logs de préparation
fastify.get('/api/v1/hotlab/preparation-logs', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { patientId, date } = request.query;
    let whereClause = '';
    let params = [];

    if (patientId) {
      // Gérer les deux types d'ID patient (numérique et string)
      if (isNaN(patientId)) {
        // Si c'est un string (ex: PAT2024001), chercher l'ID numérique
        const patient = await db.get('SELECT id FROM patients WHERE patient_id = ?', [patientId]);
        if (patient) {
          whereClause = 'WHERE pl.patient_id = ?';
          params.push(patient.id);
        } else {
          whereClause = 'WHERE 1 = 0'; // Aucun résultat si patient non trouvé
        }
      } else {
        whereClause = 'WHERE pl.patient_id = ?';
        params.push(patientId);
      }
    }
    
    if (date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += 'DATE(preparation_time) = ?';
      params.push(date);
    }

    const preparations = await db.all(
      `SELECT pl.*, p.name as patient_name, tl.tracer_name, tl.isotope, tl.batch_number, u.name as performed_by_name
       FROM preparation_logs pl 
       LEFT JOIN patients p ON pl.patient_id = p.id 
       LEFT JOIN tracer_lots tl ON pl.tracer_lot_id = tl.id 
       LEFT JOIN users u ON pl.prepared_by = u.id
       ${whereClause} ORDER BY pl.preparation_time DESC`,
      params
    );

    return {
      success: true,
      data: preparations
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des logs de préparation' 
    });
  }
});

// ===== ASSETS (PATRIMOINE) =====

// Récupérer tous les assets
fastify.get('/api/v1/assets', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { category, status, location } = request.query;
    
    let whereConditions = ['active = TRUE'];
    let params = [];

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    if (location) {
      whereConditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const assets = await db.all(
      `SELECT a.*, 
       COUNT(am.id) as maintenance_count,
       MAX(am.performed_date) as last_maintenance
       FROM assets a 
       LEFT JOIN asset_maintenances am ON a.id = am.asset_id 
       ${whereClause} 
       GROUP BY a.id 
       ORDER BY a.designation ASC`,
      params
    );

    return {
      success: true,
      data: assets
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des assets' 
    });
  }
});

// Créer un asset
fastify.post('/api/v1/assets', { preHandler: authenticate }, async (request, reply) => {
  const { 
    designation, category, acquisitionDate, acquisitionCost, location, 
    supplier, serialNumber, model, specifications, responsiblePerson 
  } = request.body;

  if (!designation || !category) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Désignation et catégorie requis' 
    });
  }

  try {
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const currentValue = acquisitionCost || 0;
    
    const result = await db.run(
      `INSERT INTO assets (asset_id, designation, category, acquisition_date, acquisition_cost, current_value, location, supplier, serial_number, model, specifications, responsible_person) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [assetId, designation, category, acquisitionDate, acquisitionCost, currentValue, location, supplier, serialNumber, model, specifications ? JSON.stringify(specifications) : null, responsiblePerson]
    );

    const asset = await db.get('SELECT * FROM assets WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: asset
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création de l\'asset' 
    });
  }
});

// Mettre à jour un asset
fastify.put('/api/v1/assets/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;

  try {
    const fields = Object.keys(updates).filter(key => 
      ['designation', 'category', 'acquisition_date', 'acquisition_cost', 'current_value', 'location', 'status', 'supplier', 'serial_number', 'model', 'specifications', 'is_functional', 'current_action', 'responsible_person'].includes(key)
    );
    
    if (fields.length === 0) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Aucun champ valide à mettre à jour' 
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      if (field === 'specifications' && updates[field]) {
        return JSON.stringify(updates[field]);
      }
      return updates[field];
    });
    values.push(id);

    // Essayer d'abord par asset_id, puis par id numérique
    let result = await db.run(
      `UPDATE assets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?`,
      values
    );

    if (result.changes === 0) {
      result = await db.run(
        `UPDATE assets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    let asset = await db.get('SELECT * FROM assets WHERE asset_id = ?', [id]);
    if (!asset) {
      asset = await db.get('SELECT * FROM assets WHERE id = ?', [id]);
    }

    if (!asset) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Asset non trouvé' 
      });
    }

    return {
      success: true,
      data: asset
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de l\'asset' 
    });
  }
});

// ===== MOUVEMENTS DE STOCK =====

// Créer un mouvement de stock
fastify.post('/api/v1/stock/movements', { preHandler: authenticate }, async (request, reply) => {
  const { 
    stockItemId, type, quantity, unitPrice, documentRef, 
    destinationSource, ordonnateur, notes 
  } = request.body;
  const userId = request.user?.id;

  if (!stockItemId || !type || !quantity) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Article, type et quantité requis' 
    });
  }

  try {
    await db.run('BEGIN TRANSACTION');

    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const totalAmount = (quantity * (unitPrice || 0));
    
    // Créer le mouvement
    const result = await db.run(
      `INSERT INTO stock_movements (movement_id, stock_item_id, type, quantity, unit_price, total_amount, document_ref, destination_source, ordonnateur, notes, performed_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [movementId, stockItemId, type, quantity, unitPrice, totalAmount, documentRef, destinationSource, ordonnateur, notes, userId]
    );

    // Mettre à jour le stock actuel
    const stockItem = await db.get('SELECT * FROM stock_items WHERE id = ? OR item_id = ?', [stockItemId, stockItemId]);
    if (stockItem) {
      let newStock = stockItem.current_stock;
      
      if (type === 'entry') {
        newStock += quantity;
      } else if (type === 'exit') {
        newStock -= quantity;
      } else if (type === 'adjustment') {
        newStock = quantity; // Ajustement absolu
      }

      await db.run(
        'UPDATE stock_items SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStock, stockItem.id]
      );
    }

    await db.run('COMMIT');

    const movement = await db.get('SELECT * FROM stock_movements WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: movement
    };
  } catch (error) {
    await db.run('ROLLBACK');
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création du mouvement de stock' 
    });
  }
});

// Récupérer les mouvements de stock
fastify.get('/api/v1/stock/movements', { preHandler: authenticate }, async (request, reply) => {
  try {
    const { stockItemId, type, startDate, endDate, limit = 100 } = request.query;
    
    let whereConditions = [];
    let params = [];

    if (stockItemId) {
      whereConditions.push('(sm.stock_item_id = ? OR si.item_id = ?)');
      params.push(stockItemId, stockItemId);
    }
    if (type) {
      whereConditions.push('sm.type = ?');
      params.push(type);
    }
    if (startDate) {
      whereConditions.push('sm.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('sm.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    params.push(limit);

    const movements = await db.all(
      `SELECT sm.*, si.name as item_name, si.unit, u.name as performed_by_name
       FROM stock_movements sm 
       LEFT JOIN stock_items si ON sm.stock_item_id = si.id 
       LEFT JOIN users u ON sm.performed_by = u.id 
       ${whereClause} 
       ORDER BY sm.created_at DESC 
       LIMIT ?`,
      params
    );

    return {
      success: true,
      data: movements
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des mouvements de stock' 
    });
  }
});

// Mettre à jour un log de préparation
fastify.put('/api/v1/hotlab/preparation-logs/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const { patientId, tracerLotId, activityPreparedMbq, volumeMl, preparedBy, status, notes } = request.body;

  try {
    // Trouver le patient par patient_id si c'est un string
    let patientDbId = patientId;
    if (patientId && isNaN(patientId)) {
      const patient = await db.get('SELECT id FROM patients WHERE patient_id = ?', [patientId]);
      if (patient) {
        patientDbId = patient.id;
      }
    }

    // Essayer d'abord par preparation_id, puis par id numérique
    let result = await db.run(
      `UPDATE preparation_logs SET 
        patient_id = ?, tracer_lot_id = ?, activity_prepared_mbq = ?, 
        volume_ml = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE preparation_id = ?`,
      [patientDbId, tracerLotId, activityPreparedMbq, volumeMl, status, notes, id]
    );

    if (result.changes === 0) {
      result = await db.run(
        `UPDATE preparation_logs SET 
          patient_id = ?, tracer_lot_id = ?, activity_prepared_mbq = ?, 
          volume_ml = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [patientDbId, tracerLotId, activityPreparedMbq, volumeMl, status, notes, id]
      );
    }

    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Préparation non trouvée' 
      });
    }

    let preparation = await db.get('SELECT * FROM preparation_logs WHERE preparation_id = ?', [id]);
    if (!preparation) {
      preparation = await db.get('SELECT * FROM preparation_logs WHERE id = ?', [id]);
    }

    return {
      success: true,
      data: preparation
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la préparation' 
    });
  }
});

// Supprimer un log de préparation
fastify.delete('/api/v1/hotlab/preparation-logs/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    let result = await db.run('UPDATE preparation_logs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE preparation_id = ?', ['disposed', id]);
    
    if (result.changes === 0) {
      result = await db.run('UPDATE preparation_logs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['disposed', id]);
    }
    
    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Préparation non trouvée' 
      });
    }

    return {
      success: true,
      message: 'Préparation supprimée avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression de la préparation' 
    });
  }
});

// ===== GESTION DES ISOTOPES =====

// Récupérer tous les isotopes
fastify.get('/api/v1/isotopes', { preHandler: authenticate }, async (request, reply) => {
  try {
    const isotopes = await db.all(
      'SELECT * FROM isotopes WHERE active = TRUE ORDER BY symbol ASC'
    );

    return {
      success: true,
      data: isotopes
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la récupération des isotopes' 
    });
  }
});

// Créer un isotope
fastify.post('/api/v1/isotopes', { preHandler: authenticate }, async (request, reply) => {
  const { 
    symbol, name, halfLifeHours, decayConstant, energyKeV, 
    doseRateFactor, usageType, safetyClass, regulatoryNotes 
  } = request.body;
  const userId = request.user?.id;

  if (!symbol || !name || !halfLifeHours || !energyKeV) {
    return reply.code(400).send({ 
      success: false, 
      message: 'Symbole, nom, demi-vie et énergie requis' 
    });
  }

  try {
    const isotopeId = `isotope_${symbol.toLowerCase().replace('-', '_')}_${Date.now()}`;
    
    const result = await db.run(
      `INSERT INTO isotopes (isotope_id, symbol, name, half_life_hours, decay_constant, energy_kev, dose_rate_factor, usage_type, safety_class, regulatory_notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isotopeId, symbol, name, halfLifeHours, decayConstant, energyKeV, doseRateFactor, usageType, safetyClass, regulatoryNotes, userId]
    );

    const isotope = await db.get('SELECT * FROM isotopes WHERE id = ?', [result.lastID]);
    
    return {
      success: true,
      data: isotope
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return reply.code(400).send({ 
        success: false, 
        message: 'Un isotope avec ce symbole existe déjà' 
      });
    }
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la création de l\'isotope' 
    });
  }
});

// Mettre à jour un isotope
fastify.put('/api/v1/isotopes/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;

  try {
    const fields = Object.keys(updates).filter(key => 
      ['symbol', 'name', 'half_life_hours', 'decay_constant', 'energy_kev', 'dose_rate_factor', 'usage_type', 'safety_class', 'regulatory_notes'].includes(key)
    );
    
    if (fields.length === 0) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Aucun champ valide à mettre à jour' 
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    // Essayer d'abord par isotope_id, puis par id numérique
    let result = await db.run(
      `UPDATE isotopes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE isotope_id = ?`,
      values
    );

    if (result.changes === 0) {
      result = await db.run(
        `UPDATE isotopes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    let isotope = await db.get('SELECT * FROM isotopes WHERE isotope_id = ?', [id]);
    if (!isotope) {
      isotope = await db.get('SELECT * FROM isotopes WHERE id = ?', [id]);
    }

    if (!isotope) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Isotope non trouvé' 
      });
    }

    return {
      success: true,
      data: isotope
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de l\'isotope' 
    });
  }
});

// Supprimer un isotope (soft delete)
fastify.delete('/api/v1/isotopes/:id', { preHandler: authenticate }, async (request, reply) => {
  const { id } = request.params;

  try {
    let result = await db.run('UPDATE isotopes SET active = FALSE WHERE isotope_id = ?', [id]);
    
    if (result.changes === 0) {
      result = await db.run('UPDATE isotopes SET active = FALSE WHERE id = ?', [id]);
    }
    
    if (result.changes === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'Isotope non trouvé' 
      });
    }

    return {
      success: true,
      message: 'Isotope supprimé avec succès'
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Erreur lors de la suppression de l\'isotope' 
    });
  }
});

// Démarrage du serveur
const start = async () => {
  try {
    await initDatabase();
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    
    console.log('');
    console.log('🚀 ========================================');
    console.log('🏥 IMENA-GEST BACKEND SIMPLE DÉMARRÉ');
    console.log('🚀 ========================================');
    console.log('');
    console.log(`📍 API : http://localhost:${PORT}`);
    console.log(`💚 Santé : http://localhost:${PORT}/health`);
    console.log('');
    console.log('🔐 Identifiants par défaut :');
    console.log('   Email : admin@imena-gest.com');
    console.log('   Mot de passe : ImenaGest2024!');
    console.log('');
    console.log('📋 Endpoints disponibles :');
    console.log('   POST   /api/v1/auth/login');
    console.log('   GET    /api/v1/auth/profile');
    console.log('   POST   /api/v1/auth/logout');
    console.log('   GET    /api/v1/patients');
    console.log('   POST   /api/v1/patients');
    console.log('   GET    /api/v1/exams');
    console.log('   GET    /api/v1/rooms');
    console.log('   GET    /api/v1/stock');
    console.log('   GET    /api/v1/stats/summary');
    console.log('');
    console.log('✨ Base de données SQLite : ' + DB_PATH);
    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await db.close();
  await fastify.close();
  process.exit(0);
});

start();
