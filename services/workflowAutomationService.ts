/**
 * Service d'automatisation de workflows pour IMENA-GEST
 * Orchestration intelligente, déclencheurs automatiques et optimisation des processus
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  variables: { [key: string]: any };
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  executionCount: number;
  successRate: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'condition' | 'api';
  configuration: {
    schedule?: string; // Cron expression
    event?: string; // Event type
    conditions?: any[];
    webhook?: string;
  };
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'approval' | 'notification' | 'integration' | 'delay';
  configuration: any;
  nextSteps: string[];
  errorHandling: {
    retryCount: number;
    retryDelay: number; // secondes
    fallbackStep?: string;
    continueOnError: boolean;
  };
  executionTime?: number;
  successRate?: number;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in' | 'exists';
  value: any;
  logical?: 'AND' | 'OR';
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  context: { [key: string]: any };
  logs: WorkflowLog[];
  progress: number; // 0-100
  totalSteps: number;
  completedSteps: number;
  triggeredBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  stepId?: string;
  message: string;
  data?: any;
  duration?: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: WorkflowCondition[];
  actions: AutomationAction[];
  lastTriggered?: Date;
  executionCount: number;
  category: 'patient_flow' | 'resource_management' | 'quality_control' | 'alerts' | 'reporting';
}

export interface AutomationAction {
  type: 'notification' | 'assignment' | 'status_update' | 'integration_call' | 'workflow_trigger';
  configuration: any;
  delaySeconds?: number;
}

export class WorkflowAutomationService {
  private static workflows: Map<string, WorkflowDefinition> = new Map();
  private static executions: Map<string, WorkflowExecution> = new Map();
  private static automationRules: AutomationRule[] = [];
  private static activeTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Crée un nouveau workflow
   */
  static createWorkflow(
    name: string,
    description: string,
    trigger: WorkflowTrigger,
    steps: Omit<WorkflowStep, 'id'>[],
    createdBy: string
  ): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: `workflow_${Date.now()}`,
      name,
      description,
      version: '1.0.0',
      status: 'draft',
      trigger,
      steps: steps.map((step, index) => ({
        ...step,
        id: `step_${index + 1}`,
        executionTime: 0,
        successRate: 100
      })),
      conditions: [],
      variables: {},
      createdBy,
      createdAt: new Date(),
      lastModified: new Date(),
      executionCount: 0,
      successRate: 100
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Workflow prédéfini : Parcours patient automatique
   */
  static createPatientFlowWorkflow(): WorkflowDefinition {
    const steps: Omit<WorkflowStep, 'id'>[] = [
      {
        name: 'Vérification éligibilité',
        type: 'condition',
        configuration: {
          checks: ['age_valid', 'contraindications', 'allergies']
        },
        nextSteps: ['step_2'],
        errorHandling: {
          retryCount: 0,
          retryDelay: 0,
          continueOnError: false
        }
      },
      {
        name: 'Planification automatique',
        type: 'action',
        configuration: {
          action: 'schedule_appointment',
          parameters: {
            urgency_based: true,
            resource_optimization: true
          }
        },
        nextSteps: ['step_3'],
        errorHandling: {
          retryCount: 3,
          retryDelay: 300,
          continueOnError: true
        }
      },
      {
        name: 'Notification patient',
        type: 'notification',
        configuration: {
          channels: ['sms', 'email'],
          template: 'appointment_confirmation',
          delay_hours: 24
        },
        nextSteps: ['step_4'],
        errorHandling: {
          retryCount: 2,
          retryDelay: 600,
          continueOnError: true
        }
      },
      {
        name: 'Préparation traceur',
        type: 'integration',
        configuration: {
          system: 'hot_lab',
          action: 'prepare_tracer',
          timing: 'exam_day_morning'
        },
        nextSteps: ['step_5'],
        errorHandling: {
          retryCount: 1,
          retryDelay: 1800,
          continueOnError: false
        }
      },
      {
        name: 'Rapport automatique',
        type: 'action',
        configuration: {
          action: 'generate_report',
          auto_send: true,
          recipients: ['referring_physician', 'patient']
        },
        nextSteps: [],
        errorHandling: {
          retryCount: 2,
          retryDelay: 300,
          continueOnError: true
        }
      }
    ];

    return this.createWorkflow(
      'Parcours Patient Automatique',
      'Automatisation complète du parcours patient de la demande au rapport',
      {
        type: 'event',
        configuration: {
          event: 'patient_registered'
        },
        enabled: true
      },
      steps,
      'system'
    );
  }

  /**
   * Workflow prédéfini : Gestion urgences
   */
  static createEmergencyWorkflow(): WorkflowDefinition {
    const steps: Omit<WorkflowStep, 'id'>[] = [
      {
        name: 'Évaluation urgence',
        type: 'condition',
        configuration: {
          urgency_score: '>= 8',
          availability_check: true
        },
        nextSteps: ['step_2'],
        errorHandling: {
          retryCount: 0,
          retryDelay: 0,
          continueOnError: false
        }
      },
      {
        name: 'Réorganisation planning',
        type: 'action',
        configuration: {
          action: 'reschedule_non_urgent',
          max_reschedules: 3,
          notify_affected: true
        },
        nextSteps: ['step_3'],
        errorHandling: {
          retryCount: 1,
          retryDelay: 60,
          continueOnError: false
        }
      },
      {
        name: 'Alerte équipe',
        type: 'notification',
        configuration: {
          recipients: ['on_call_physician', 'head_technician'],
          channels: ['sms', 'push'],
          priority: 'urgent'
        },
        nextSteps: ['step_4'],
        errorHandling: {
          retryCount: 3,
          retryDelay: 30,
          continueOnError: false
        }
      },
      {
        name: 'Préparation express',
        type: 'action',
        configuration: {
          action: 'express_preparation',
          resources: ['emergency_kit', 'priority_tracer']
        },
        nextSteps: [],
        errorHandling: {
          retryCount: 0,
          retryDelay: 0,
          continueOnError: false
        }
      }
    ];

    return this.createWorkflow(
      'Gestion Urgences',
      'Workflow automatique pour la prise en charge des urgences',
      {
        type: 'condition',
        configuration: {
          conditions: [
            { field: 'urgency_level', operator: '==', value: 'emergency' }
          ]
        },
        enabled: true
      },
      steps,
      'system'
    );
  }

  /**
   * Exécute un workflow
   */
  static async executeWorkflow(
    workflowId: string,
    context: { [key: string]: any } = {},
    triggeredBy: string = 'system',
    priority: WorkflowExecution['priority'] = 'medium'
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow non trouvé');
    }

    const execution: WorkflowExecution = {
      executionId: `exec_${Date.now()}`,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      context,
      logs: [],
      progress: 0,
      totalSteps: workflow.steps.length,
      completedSteps: 0,
      triggeredBy,
      priority
    };

    this.executions.set(execution.executionId, execution);
    
    // Log de démarrage
    this.addLog(execution, 'info', undefined, `Démarrage workflow: ${workflow.name}`);

    // Démarrage asynchrone de l'exécution
    this.runWorkflow(execution);

    return execution;
  }

  /**
   * Crée une règle d'automatisation
   */
  static createAutomationRule(
    name: string,
    description: string,
    category: AutomationRule['category'],
    conditions: WorkflowCondition[],
    actions: AutomationAction[],
    priority: number = 1
  ): AutomationRule {
    const rule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name,
      description,
      enabled: true,
      priority,
      conditions,
      actions,
      executionCount: 0,
      category
    };

    this.automationRules.push(rule);
    return rule;
  }

  /**
   * Évalue les règles d'automatisation pour un événement
   */
  static async evaluateAutomationRules(
    eventType: string,
    eventData: any
  ): Promise<{
    triggeredRules: string[];
    executedActions: number;
    errors: string[];
  }> {
    const triggeredRules: string[] = [];
    let executedActions = 0;
    const errors: string[] = [];

    // Filtrer les règles actives par priorité
    const activeRules = this.automationRules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      try {
        // Évaluation des conditions
        if (this.evaluateConditions(rule.conditions, eventData)) {
          triggeredRules.push(rule.id);
          rule.executionCount++;
          rule.lastTriggered = new Date();

          // Exécution des actions
          for (const action of rule.actions) {
            await this.executeAction(action, eventData);
            executedActions++;
          }
        }
      } catch (error) {
        errors.push(`Erreur règle ${rule.name}: ${error}`);
      }
    }

    return {
      triggeredRules,
      executedActions,
      errors
    };
  }

  /**
   * Optimise automatiquement les workflows
   */
  static optimizeWorkflows(): {
    optimizations: string[];
    performanceGain: number;
    recommendations: string[];
  } {
    const optimizations: string[] = [];
    let performanceGain = 0;
    const recommendations: string[] = [];

    for (const [workflowId, workflow] of this.workflows) {
      const executions = Array.from(this.executions.values())
        .filter(exec => exec.workflowId === workflowId);

      if (executions.length === 0) continue;

      // Analyse des performances par étape
      const stepPerformance = this.analyzeStepPerformance(workflow, executions);
      
      // Identification des goulots d'étranglement
      const slowSteps = stepPerformance.filter(step => step.avgDuration > 300); // Plus de 5 minutes
      
      if (slowSteps.length > 0) {
        optimizations.push(`Workflow ${workflow.name}: Optimisation de ${slowSteps.length} étapes lentes`);
        performanceGain += slowSteps.length * 5; // 5% gain par étape optimisée
        
        for (const step of slowSteps) {
          recommendations.push(`Optimiser l'étape "${step.name}" du workflow "${workflow.name}"`);
        }
      }

      // Analyse des échecs
      const failedExecs = executions.filter(exec => exec.status === 'failed');
      if (failedExecs.length > executions.length * 0.1) { // Plus de 10% d'échecs
        recommendations.push(`Améliorer la robustesse du workflow "${workflow.name}"`);
      }

      // Parallélisation possible
      const parallelizableSteps = this.identifyParallelizableSteps(workflow);
      if (parallelizableSteps.length > 0) {
        optimizations.push(`Workflow ${workflow.name}: ${parallelizableSteps.length} étapes parallélisables identifiées`);
        performanceGain += parallelizableSteps.length * 3;
      }
    }

    return {
      optimizations,
      performanceGain: Math.round(performanceGain),
      recommendations
    };
  }

  /**
   * Obtient les statistiques d'automatisation
   */
  static getAutomationStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    automationRules: number;
    rulesTriggerRate: number;
    topWorkflows: Array<{
      name: string;
      executions: number;
      successRate: number;
    }>;
  } {
    const workflows = Array.from(this.workflows.values());
    const executions = Array.from(this.executions.values());
    
    const activeWorkflows = workflows.filter(w => w.status === 'active');
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const avgExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, exec) => {
          return sum + (exec.endTime ? exec.endTime.getTime() - exec.startTime.getTime() : 0);
        }, 0) / completedExecutions.length / 1000 / 60 // en minutes
      : 0;

    const topWorkflows = workflows
      .map(workflow => ({
        name: workflow.name,
        executions: workflow.executionCount,
        successRate: workflow.successRate
      }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5);

    const triggeredRules = this.automationRules.filter(rule => rule.executionCount > 0);
    const rulesTriggerRate = this.automationRules.length > 0
      ? (triggeredRules.length / this.automationRules.length) * 100
      : 0;

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: activeWorkflows.length,
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? (completedExecutions.length / executions.length) * 100 : 0,
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      automationRules: this.automationRules.length,
      rulesTriggerRate: Math.round(rulesTriggerRate * 100) / 100,
      topWorkflows
    };
  }

  // Méthodes privées d'exécution
  private static async runWorkflow(execution: WorkflowExecution): Promise<void> {
    execution.status = 'running';
    const workflow = this.workflows.get(execution.workflowId)!;

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        execution.currentStep = step.id;
        
        this.addLog(execution, 'info', step.id, `Démarrage étape: ${step.name}`);
        
        const stepStartTime = Date.now();
        
        try {
          await this.executeStep(step, execution);
          
          const stepDuration = Date.now() - stepStartTime;
          this.addLog(execution, 'info', step.id, `Étape complétée en ${stepDuration}ms`);
          
          execution.completedSteps++;
          execution.progress = Math.round((execution.completedSteps / execution.totalSteps) * 100);
          
        } catch (stepError) {
          const stepDuration = Date.now() - stepStartTime;
          this.addLog(execution, 'error', step.id, `Échec étape: ${stepError}`, undefined, stepDuration);
          
          // Gestion des erreurs
          if (!step.errorHandling.continueOnError) {
            throw stepError;
          }
        }
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      this.addLog(execution, 'info', undefined, 'Workflow complété avec succès');
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.addLog(execution, 'error', undefined, `Échec workflow: ${error}`);
    }
  }

  private static async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    switch (step.type) {
      case 'action':
        await this.executeActionStep(step, execution);
        break;
      case 'condition':
        await this.executeConditionStep(step, execution);
        break;
      case 'notification':
        await this.executeNotificationStep(step, execution);
        break;
      case 'integration':
        await this.executeIntegrationStep(step, execution);
        break;
      case 'delay':
        await this.executeDelayStep(step, execution);
        break;
      case 'approval':
        await this.executeApprovalStep(step, execution);
        break;
    }
  }

  private static async executeActionStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    // Simulation d'exécution d'action
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulation d'échec occasionnel (5%)
    if (Math.random() < 0.05) {
      throw new Error('Échec action simulé');
    }
  }

  private static async executeConditionStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    // Évaluation des conditions
    const conditions = step.configuration.conditions || [];
    
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, execution.context)) {
        throw new Error(`Condition non satisfaite: ${condition}`);
      }
    }
  }

  private static async executeNotificationStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    // Simulation d'envoi de notification
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  }

  private static async executeIntegrationStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    // Simulation d'appel d'intégration
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  private static async executeDelayStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    const delayMs = step.configuration.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  private static async executeApprovalStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    // Simulation d'attente d'approbation (en réalité, nécessiterait une interaction utilisateur)
    execution.status = 'paused';
    this.addLog(execution, 'info', step.id, 'En attente d\'approbation');
    
    // Simulation d'approbation automatique après 5 secondes
    await new Promise(resolve => setTimeout(resolve, 5000));
    execution.status = 'running';
  }

  private static evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
    if (conditions.length === 0) return true;
    
    let result = true;
    
    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (condition.logical === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }
    
    return result;
  }

  private static evaluateCondition(condition: WorkflowCondition, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case '==': return fieldValue === condition.value;
      case '!=': return fieldValue !== condition.value;
      case '>': return fieldValue > condition.value;
      case '<': return fieldValue < condition.value;
      case '>=': return fieldValue >= condition.value;
      case '<=': return fieldValue <= condition.value;
      case 'contains': return String(fieldValue).includes(condition.value);
      case 'in': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'exists': return fieldValue !== undefined && fieldValue !== null;
      default: return false;
    }
  }

  private static async executeAction(action: AutomationAction, eventData: any): Promise<void> {
    if (action.delaySeconds) {
      await new Promise(resolve => setTimeout(resolve, action.delaySeconds! * 1000));
    }
    
    switch (action.type) {
      case 'notification':
        // Simulation d'envoi de notification
        console.log('Notification envoyée:', action.configuration);
        break;
      case 'assignment':
        // Simulation d'affectation
        console.log('Affectation réalisée:', action.configuration);
        break;
      case 'status_update':
        // Simulation de mise à jour de statut
        console.log('Statut mis à jour:', action.configuration);
        break;
      case 'integration_call':
        // Simulation d'appel d'intégration
        console.log('Intégration appelée:', action.configuration);
        break;
      case 'workflow_trigger':
        // Déclenchement d'un autre workflow
        const workflowId = action.configuration.workflowId;
        if (workflowId) {
          await this.executeWorkflow(workflowId, eventData, 'automation');
        }
        break;
    }
  }

  private static addLog(
    execution: WorkflowExecution,
    level: WorkflowLog['level'],
    stepId: string | undefined,
    message: string,
    data?: any,
    duration?: number
  ): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      stepId,
      message,
      data,
      duration
    });
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static analyzeStepPerformance(workflow: WorkflowDefinition, executions: WorkflowExecution[]) {
    const stepStats = workflow.steps.map(step => ({
      id: step.id,
      name: step.name,
      avgDuration: 0,
      successRate: 100,
      executionCount: 0
    }));

    for (const execution of executions) {
      for (const log of execution.logs) {
        if (log.stepId && log.duration) {
          const stepStat = stepStats.find(s => s.id === log.stepId);
          if (stepStat) {
            stepStat.avgDuration = (stepStat.avgDuration * stepStat.executionCount + log.duration) / (stepStat.executionCount + 1);
            stepStat.executionCount++;
          }
        }
      }
    }

    return stepStats;
  }

  private static identifyParallelizableSteps(workflow: WorkflowDefinition): WorkflowStep[] {
    // Logique simplifiée pour identifier les étapes parallélisables
    return workflow.steps.filter(step => 
      step.type === 'notification' || 
      (step.type === 'action' && !step.nextSteps.length)
    );
  }
}
