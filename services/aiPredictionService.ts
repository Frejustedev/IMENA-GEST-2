/**
 * Service d'Intelligence Artificielle pour IMENA-GEST
 * Prédictions de workflow, optimisations ML et recommandations intelligentes
 */

export interface PatientRiskProfile {
  patientId: string;
  riskScore: number; // 0-100
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  description: string;
}

export interface WorkflowPrediction {
  patientId: string;
  predictedPath: WorkflowStep[];
  confidence: number;
  estimatedDuration: number; // minutes
  resourceRequirements: ResourceRequirement[];
  alternatives: AlternativeFlow[];
  criticalPoints: string[];
}

export interface WorkflowStep {
  stepId: string;
  stepName: string;
  estimatedDuration: number;
  probability: number;
  dependencies: string[];
  resources: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ResourceRequirement {
  type: 'staff' | 'equipment' | 'room' | 'material';
  resource: string;
  quantity: number;
  timeSlot: {
    start: Date;
    end: Date;
  };
  criticality: 'optional' | 'preferred' | 'required';
}

export interface AlternativeFlow {
  flowId: string;
  description: string;
  probability: number;
  efficiency: number;
  riskLevel: number;
  estimatedDuration: number;
}

export interface MLOptimization {
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingData: number;
  lastTrained: Date;
  improvements: string[];
}

export interface PredictiveInsight {
  type: 'scheduling' | 'resource' | 'quality' | 'efficiency' | 'safety';
  insight: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  dataPoints: number;
}

export class AIPredictionService {
  // Modèles ML pré-entraînés (simulés)
  private static readonly ML_MODELS = {
    workflow_prediction: {
      accuracy: 0.89,
      lastTrained: '2024-01-15',
      trainingSize: 15420,
      features: ['age', 'exam_type', 'history', 'urgency', 'comorbidities']
    },
    resource_optimization: {
      accuracy: 0.92,
      lastTrained: '2024-01-10', 
      trainingSize: 8760,
      features: ['time_slot', 'staff_availability', 'equipment_status', 'patient_flow']
    },
    risk_assessment: {
      accuracy: 0.87,
      lastTrained: '2024-01-12',
      trainingSize: 12300,
      features: ['medical_history', 'exam_parameters', 'contraindications', 'allergies']
    }
  };

  /**
   * Prédit le workflow optimal pour un patient
   */
  static predictWorkflow(
    patientData: {
      age: number;
      examType: string;
      medicalHistory: string[];
      urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
      comorbidities: string[];
      allergies: string[];
    }
  ): WorkflowPrediction {
    // Algorithme de prédiction basé sur les patterns historiques
    const baseSteps = this.getBaseWorkflowSteps(patientData.examType);
    const optimizedSteps = this.optimizeStepsForPatient(baseSteps, patientData);
    
    const totalDuration = optimizedSteps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    const avgConfidence = optimizedSteps.reduce((sum, step) => sum + step.probability, 0) / optimizedSteps.length;

    const resourceRequirements = this.predictResourceNeeds(optimizedSteps, patientData);
    const alternatives = this.generateAlternativeFlows(optimizedSteps, patientData);
    const criticalPoints = this.identifyCriticalPoints(optimizedSteps, patientData);

    return {
      patientId: patientData.examType + '_' + Date.now(),
      predictedPath: optimizedSteps,
      confidence: Math.round(avgConfidence * 100) / 100,
      estimatedDuration: totalDuration,
      resourceRequirements,
      alternatives,
      criticalPoints
    };
  }

  /**
   * Évalue le profil de risque d'un patient
   */
  static assessPatientRisk(
    patientData: {
      age: number;
      weight?: number;
      medicalHistory: string[];
      currentMedications: string[];
      allergies: string[];
      examType: string;
      contraindications: string[];
    }
  ): PatientRiskProfile {
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // Facteur âge
    if (patientData.age < 18) {
      riskFactors.push({
        factor: 'Âge pédiatrique',
        weight: 0.15,
        impact: 'negative',
        confidence: 0.95,
        description: 'Nécessite adaptation dosimétrique et surveillance renforcée'
      });
      riskScore += 15;
    } else if (patientData.age > 75) {
      riskFactors.push({
        factor: 'Âge avancé',
        weight: 0.10,
        impact: 'negative', 
        confidence: 0.88,
        description: 'Risque accru de complications et temps d\'élimination prolongé'
      });
      riskScore += 10;
    }

    // Allergies
    if (patientData.allergies.length > 0) {
      const allergyWeight = Math.min(patientData.allergies.length * 0.05, 0.20);
      riskFactors.push({
        factor: 'Allergies connues',
        weight: allergyWeight,
        impact: 'negative',
        confidence: 0.92,
        description: `${patientData.allergies.length} allergie(s) connue(s)`
      });
      riskScore += allergyWeight * 100;
    }

    // Antécédents médicaux critiques
    const criticalConditions = ['insuffisance rénale', 'diabète', 'insuffisance cardiaque', 'hyperthyroïdie'];
    const criticalFound = patientData.medicalHistory.filter(condition => 
      criticalConditions.some(critical => condition.toLowerCase().includes(critical))
    );

    if (criticalFound.length > 0) {
      riskFactors.push({
        factor: 'Comorbidités critiques',
        weight: 0.25,
        impact: 'negative',
        confidence: 0.90,
        description: `Conditions nécessitant surveillance: ${criticalFound.join(', ')}`
      });
      riskScore += 25;
    }

    // Contraindications
    if (patientData.contraindications.length > 0) {
      riskFactors.push({
        factor: 'Contraindications',
        weight: 0.30,
        impact: 'negative',
        confidence: 0.98,
        description: 'Contraindications formelles identifiées'
      });
      riskScore += 30;
    }

    // Interactions médicamenteuses
    const riskMedications = ['metformine', 'lithium', 'amiodarone'];
    const riskMedsFound = patientData.currentMedications.filter(med =>
      riskMedications.some(risk => med.toLowerCase().includes(risk))
    );

    if (riskMedsFound.length > 0) {
      riskFactors.push({
        factor: 'Médicaments à risque',
        weight: 0.15,
        impact: 'negative',
        confidence: 0.85,
        description: `Interactions possibles: ${riskMedsFound.join(', ')}`
      });
      riskScore += 15;
    }

    // Déterminer la catégorie de risque
    let riskCategory: PatientRiskProfile['riskCategory'];
    if (riskScore >= 50) riskCategory = 'critical';
    else if (riskScore >= 30) riskCategory = 'high';
    else if (riskScore >= 15) riskCategory = 'medium';
    else riskCategory = 'low';

    const recommendations = this.generateRiskRecommendations(riskCategory, riskFactors);

    return {
      patientId: 'risk_' + Date.now(),
      riskScore: Math.min(riskScore, 100),
      riskCategory,
      factors: riskFactors,
      recommendations,
      lastUpdated: new Date()
    };
  }

  /**
   * Optimise l'allocation des ressources
   */
  static optimizeResourceAllocation(
    timeSlot: { start: Date; end: Date },
    availableResources: {
      staff: Array<{ id: string; skills: string[]; availability: number }>;
      equipment: Array<{ id: string; type: string; status: 'available' | 'busy' | 'maintenance' }>;
      rooms: Array<{ id: string; type: string; capacity: number; occupied: boolean }>;
    },
    scheduledExams: Array<{ examType: string; duration: number; priority: number }>
  ): {
    optimizedSchedule: Array<{
      examId: string;
      startTime: Date;
      endTime: Date;
      assignedResources: {
        staff: string[];
        equipment: string[];
        room: string;
      };
      efficiency: number;
    }>;
    utilizationRate: number;
    conflictResolutions: string[];
  } {
    // Algorithme d'optimisation heuristique
    const schedule = [];
    const conflicts = [];
    let currentTime = new Date(timeSlot.start);
    
    // Tri des examens par priorité et durée
    const sortedExams = scheduledExams.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.duration - b.duration; // Examens courts en premier
    });

    for (const exam of sortedExams) {
      const assignment = this.assignOptimalResources(
        exam,
        currentTime,
        availableResources
      );

      if (assignment) {
        schedule.push({
          examId: exam.examType + '_' + Date.now(),
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + exam.duration * 60 * 1000),
          assignedResources: assignment.resources,
          efficiency: assignment.efficiency
        });
        
        currentTime = new Date(currentTime.getTime() + exam.duration * 60 * 1000);
      } else {
        conflicts.push(`Impossible de programmer ${exam.examType} - ressources insuffisantes`);
      }
    }

    const totalSlotTime = (timeSlot.end.getTime() - timeSlot.start.getTime()) / (1000 * 60);
    const totalScheduledTime = schedule.reduce((sum, item) => 
      sum + (item.endTime.getTime() - item.startTime.getTime()) / (1000 * 60), 0
    );
    const utilizationRate = Math.round((totalScheduledTime / totalSlotTime) * 10000) / 100;

    return {
      optimizedSchedule: schedule,
      utilizationRate,
      conflictResolutions: conflicts
    };
  }

  /**
   * Génère des insights prédictifs
   */
  static generatePredictiveInsights(
    historicalData: {
      appointments: any[];
      examinations: any[];
      delays: any[];
      cancellations: any[];
      resourceUsage: any[];
    }
  ): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Analyse des patterns de retard
    const avgDelay = historicalData.delays.reduce((sum, d) => sum + d.duration, 0) / historicalData.delays.length;
    if (avgDelay > 15) {
      insights.push({
        type: 'scheduling',
        insight: `Retard moyen de ${Math.round(avgDelay)} minutes détecté`,
        confidence: 0.87,
        impact: 'high',
        actionable: true,
        suggestedActions: [
          'Augmenter les créneaux de 15 minutes',
          'Optimiser les temps de préparation',
          'Réviser la planification des examens complexes'
        ],
        dataPoints: historicalData.delays.length
      });
    }

    // Analyse des annulations
    const cancellationRate = (historicalData.cancellations.length / historicalData.appointments.length) * 100;
    if (cancellationRate > 10) {
      insights.push({
        type: 'efficiency',
        insight: `Taux d'annulation élevé: ${Math.round(cancellationRate)}%`,
        confidence: 0.91,
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Mettre en place des rappels automatiques',
          'Analyser les motifs d\'annulation',
          'Optimiser la liste d\'attente'
        ],
        dataPoints: historicalData.cancellations.length
      });
    }

    // Analyse de l'utilisation des ressources
    const peakHours = this.analyzeResourcePeaks(historicalData.resourceUsage);
    if (peakHours.length > 0) {
      insights.push({
        type: 'resource',
        insight: `Pics d'utilisation détectés: ${peakHours.join(', ')}h`,
        confidence: 0.84,
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Redistribuer les créneaux',
          'Planifier du personnel supplémentaire',
          'Optimiser les examens non-urgents'
        ],
        dataPoints: historicalData.resourceUsage.length
      });
    }

    // Prédiction qualité
    const qualityScore = this.calculateQualityTrend(historicalData.examinations);
    if (qualityScore < 0.85) {
      insights.push({
        type: 'quality',
        insight: `Tendance qualité en baisse: ${Math.round(qualityScore * 100)}%`,
        confidence: 0.79,
        impact: 'high',
        actionable: true,
        suggestedActions: [
          'Formation équipe technique',
          'Révision des protocoles',
          'Audit qualité approfondi'
        ],
        dataPoints: historicalData.examinations.length
      });
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Optimise les modèles ML
   */
  static optimizeMLModels(): MLOptimization[] {
    const optimizations: MLOptimization[] = [];

    for (const [modelName, modelData] of Object.entries(this.ML_MODELS)) {
      // Simulation d'optimisation ML
      const baseAccuracy = modelData.accuracy;
      const improvements = [];
      let newAccuracy = baseAccuracy;

      // Techniques d'optimisation
      if (modelData.trainingSize > 10000) {
        newAccuracy += 0.02;
        improvements.push('Augmentation dataset (+2% précision)');
      }

      if (modelData.features.length >= 5) {
        newAccuracy += 0.015;
        improvements.push('Feature engineering optimisé (+1.5% précision)');
      }

      // Hyperparameter tuning
      newAccuracy += 0.01;
      improvements.push('Hyperparamètres optimisés (+1% précision)');

      const precision = newAccuracy * (0.95 + Math.random() * 0.05);
      const recall = newAccuracy * (0.92 + Math.random() * 0.06);
      const f1Score = 2 * (precision * recall) / (precision + recall);

      optimizations.push({
        algorithm: modelName.replace('_', ' ').toUpperCase(),
        accuracy: Math.round(newAccuracy * 10000) / 100,
        precision: Math.round(precision * 10000) / 100,
        recall: Math.round(recall * 10000) / 100,
        f1Score: Math.round(f1Score * 10000) / 100,
        trainingData: modelData.trainingSize,
        lastTrained: new Date(),
        improvements
      });
    }

    return optimizations;
  }

  // Méthodes privées utilitaires
  private static getBaseWorkflowSteps(examType: string): WorkflowStep[] {
    const baseSteps: Record<string, WorkflowStep[]> = {
      'Scintigraphie Osseuse': [
        { stepId: 'prep', stepName: 'Préparation patient', estimatedDuration: 15, probability: 0.98, dependencies: [], resources: ['nurse'], riskLevel: 'low' },
        { stepId: 'injection', stepName: 'Injection traceur', estimatedDuration: 5, probability: 0.97, dependencies: ['prep'], resources: ['physician', 'tracer'], riskLevel: 'medium' },
        { stepId: 'wait', stepName: 'Temps d\'attente', estimatedDuration: 180, probability: 0.95, dependencies: ['injection'], resources: [], riskLevel: 'low' },
        { stepId: 'scan', stepName: 'Acquisition images', estimatedDuration: 45, probability: 0.99, dependencies: ['wait'], resources: ['technician', 'gamma_camera'], riskLevel: 'low' },
        { stepId: 'analysis', stepName: 'Analyse images', estimatedDuration: 30, probability: 0.96, dependencies: ['scan'], resources: ['physician'], riskLevel: 'low' }
      ],
      'Scintigraphie Thyroïdienne': [
        { stepId: 'prep', stepName: 'Préparation patient', estimatedDuration: 10, probability: 0.99, dependencies: [], resources: ['nurse'], riskLevel: 'low' },
        { stepId: 'injection', stepName: 'Injection traceur', estimatedDuration: 3, probability: 0.98, dependencies: ['prep'], resources: ['physician', 'tracer'], riskLevel: 'medium' },
        { stepId: 'wait', stepName: 'Temps d\'attente', estimatedDuration: 20, probability: 0.97, dependencies: ['injection'], resources: [], riskLevel: 'low' },
        { stepId: 'scan', stepName: 'Acquisition images', estimatedDuration: 25, probability: 0.99, dependencies: ['wait'], resources: ['technician', 'gamma_camera'], riskLevel: 'low' }
      ]
    };

    return baseSteps[examType] || baseSteps['Scintigraphie Osseuse'];
  }

  private static optimizeStepsForPatient(
    baseSteps: WorkflowStep[],
    patientData: any
  ): WorkflowStep[] {
    return baseSteps.map(step => {
      let adjustedDuration = step.estimatedDuration;
      let adjustedProbability = step.probability;

      // Ajustements selon l'âge
      if (patientData.age < 18) {
        adjustedDuration *= 1.2; // 20% plus long pour pédiatrie
        adjustedProbability *= 0.95; // Légèrement moins prévisible
      } else if (patientData.age > 75) {
        adjustedDuration *= 1.15; // 15% plus long pour seniors
      }

      // Ajustements selon l'urgence
      if (patientData.urgencyLevel === 'emergency') {
        adjustedDuration *= 0.8; // Procédures accélérées
        adjustedProbability *= 0.9; // Plus de variabilité
      }

      return {
        ...step,
        estimatedDuration: Math.round(adjustedDuration),
        probability: Math.round(adjustedProbability * 100) / 100
      };
    });
  }

  private static predictResourceNeeds(
    steps: WorkflowStep[],
    patientData: any
  ): ResourceRequirement[] {
    const requirements: ResourceRequirement[] = [];
    let currentTime = new Date();

    for (const step of steps) {
      for (const resource of step.resources) {
        const endTime = new Date(currentTime.getTime() + step.estimatedDuration * 60 * 1000);
        
        requirements.push({
          type: this.getResourceType(resource),
          resource,
          quantity: 1,
          timeSlot: {
            start: new Date(currentTime),
            end: endTime
          },
          criticality: step.riskLevel === 'high' ? 'required' : 'preferred'
        });
      }
      
      currentTime = new Date(currentTime.getTime() + step.estimatedDuration * 60 * 1000);
    }

    return requirements;
  }

  private static getResourceType(resource: string): ResourceRequirement['type'] {
    if (['physician', 'nurse', 'technician'].includes(resource)) return 'staff';
    if (['gamma_camera', 'scanner'].includes(resource)) return 'equipment';
    if (['tracer', 'contrast'].includes(resource)) return 'material';
    return 'room';
  }

  private static generateAlternativeFlows(
    steps: WorkflowStep[],
    patientData: any
  ): AlternativeFlow[] {
    return [
      {
        flowId: 'fast_track',
        description: 'Parcours accéléré',
        probability: 0.3,
        efficiency: 1.25,
        riskLevel: 0.15,
        estimatedDuration: steps.reduce((sum, s) => sum + s.estimatedDuration, 0) * 0.8
      },
      {
        flowId: 'detailed_prep',
        description: 'Préparation renforcée',
        probability: 0.2,
        efficiency: 0.9,
        riskLevel: 0.05,
        estimatedDuration: steps.reduce((sum, s) => sum + s.estimatedDuration, 0) * 1.15
      }
    ];
  }

  private static identifyCriticalPoints(
    steps: WorkflowStep[],
    patientData: any
  ): string[] {
    const criticalPoints = [];
    
    if (patientData.urgencyLevel === 'emergency') {
      criticalPoints.push('Délai injection critique en urgence');
    }
    
    if (patientData.allergies.length > 0) {
      criticalPoints.push('Surveillance renforcée post-injection (allergies)');
    }
    
    if (patientData.age < 18) {
      criticalPoints.push('Adaptation dosimétrique pédiatrique obligatoire');
    }

    return criticalPoints;
  }

  private static generateRiskRecommendations(
    riskCategory: PatientRiskProfile['riskCategory'],
    riskFactors: RiskFactor[]
  ): string[] {
    const recommendations = [];

    switch (riskCategory) {
      case 'critical':
        recommendations.push('Surveillance médicale continue requise');
        recommendations.push('Équipe de réanimation en alerte');
        recommendations.push('Consentement éclairé renforcé');
        break;
      case 'high':
        recommendations.push('Surveillance médicale renforcée');
        recommendations.push('Préparation spécifique adaptée');
        recommendations.push('Personnel expérimenté requis');
        break;
      case 'medium':
        recommendations.push('Surveillance standard avec vigilance');
        recommendations.push('Vérification des antécédents');
        break;
      case 'low':
        recommendations.push('Procédure standard applicable');
        break;
    }

    // Recommandations spécifiques aux facteurs
    if (riskFactors.some(f => f.factor.includes('Allergies'))) {
      recommendations.push('Prémédication antiallergique à considérer');
      recommendations.push('Matériel de réanimation disponible');
    }

    return recommendations;
  }

  private static assignOptimalResources(
    exam: any,
    startTime: Date,
    availableResources: any
  ): { resources: any; efficiency: number } | null {
    // Simulation d'assignement optimal
    const availableStaff = availableResources.staff.filter(s => s.availability > 0.5);
    const availableEquipment = availableResources.equipment.filter(e => e.status === 'available');
    const availableRooms = availableResources.rooms.filter(r => !r.occupied);

    if (availableStaff.length > 0 && availableEquipment.length > 0 && availableRooms.length > 0) {
      return {
        resources: {
          staff: [availableStaff[0].id],
          equipment: [availableEquipment[0].id],
          room: availableRooms[0].id
        },
        efficiency: 0.85 + Math.random() * 0.15
      };
    }

    return null;
  }

  private static analyzeResourcePeaks(resourceUsage: any[]): number[] {
    // Simulation d'analyse des pics
    return [9, 14, 16]; // Heures de pic typiques
  }

  private static calculateQualityTrend(examinations: any[]): number {
    // Simulation de calcul de tendance qualité
    return 0.82 + Math.random() * 0.15;
  }
}
