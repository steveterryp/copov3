import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';
import BasicInfoForm from './steps/BasicInfoForm';
import TeamSelection from './steps/TeamSelection';
import WorkflowSetup from './steps/WorkflowSetup';
import MetricsGoals from './steps/MetricsGoals';
import Resources from './steps/Resources';
import Review from './steps/Review';
import { validateStep, validateForm } from './validation';
import { usePoVSubmit } from '@/lib/hooks/usePoVSubmit';

const steps = [
  'Basic Information',
  'Team Selection',
  'Workflow Setup',
  'Metrics & Goals',
  'Resources',
  'Review'
] as const;

export interface PoVFormData {
  // Basic Info
  name: string;
  customer: string;
  startDate: string;
  endDate: string;
  objective: string;
  solution: string;
  status: 'draft' | 'active' | 'completed' | 'failed';

  // Team
  projectManager: string;
  salesEngineers: string[];
  technicalTeam: string[];

  // Workflow
  stages: {
    name: string;
    tasks: { title: string; description: string }[];
  }[];

  // Metrics
  kpis: {
    title: string;
    target: string;
    weight: number;
  }[];

  // Resources
  budget: number;
  resources: {
    type: 'Hardware' | 'Software License' | 'Cloud Infrastructure' | 'Development Environment' | 'Testing Environment' | 'Technical Support' | 'Training' | 'Documentation' | 'Other';
    quantity: number;
    notes: string;
  }[];
}

const initialFormData: PoVFormData = {
  name: '',
  customer: '',
  startDate: '',
  endDate: '',
  objective: '',
  solution: '',
  status: 'draft',
  projectManager: '',
  salesEngineers: [],
  technicalTeam: [],
  stages: [
    {
      name: 'Initiation',
      tasks: [
        { title: 'Scope Definition', description: 'Define project scope and boundaries' },
        { title: 'Success Criteria', description: 'Establish success metrics' }
      ]
    }
  ],
  kpis: [],
  budget: 0,
  resources: []
};

type StepKey = 'basicInfo' | 'team' | 'workflow' | 'metrics' | 'resources';

const PoVCreationForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PoVFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { isSubmitting, error: submitError, submitPoV } = usePoVSubmit();

  const validateCurrentStep = () => {
    const stepData = {
      basicInfo: {
        name: formData.name,
        customer: formData.customer,
        startDate: formData.startDate,
        endDate: formData.endDate,
        objective: formData.objective,
        solution: formData.solution,
        status: formData.status
      },
      team: {
        projectManager: formData.projectManager,
        salesEngineers: formData.salesEngineers,
        technicalTeam: formData.technicalTeam
      },
      workflow: {
        stages: formData.stages
      },
      metrics: {
        kpis: formData.kpis
      },
      resources: {
        budget: formData.budget,
        resources: formData.resources
      }
    };

    const stepKeys: StepKey[] = ['basicInfo', 'team', 'workflow', 'metrics', 'resources'];
    const currentStepKey = stepKeys[activeStep];
    if (!currentStepKey) return true;

    const { success, errors: validationErrors } = validateStep(
      currentStepKey,
      stepData[currentStepKey]
    );

    if (!success && validationErrors) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    const stepData = {
      basicInfo: {
        name: formData.name,
        customer: formData.customer,
        startDate: formData.startDate,
        endDate: formData.endDate,
        objective: formData.objective,
        solution: formData.solution,
        status: formData.status
      },
      team: {
        projectManager: formData.projectManager,
        salesEngineers: formData.salesEngineers,
        technicalTeam: formData.technicalTeam
      },
      workflow: {
        stages: formData.stages
      },
      metrics: {
        kpis: formData.kpis
      },
      resources: {
        budget: formData.budget,
        resources: formData.resources
      }
    };

    const { success, errors: validationErrors } = validateForm(stepData);

    if (!success && validationErrors) {
      setErrors(validationErrors);
      return;
    }

    await submitPoV(formData);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoForm
            data={formData}
            onUpdate={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        );
      case 1:
        return (
          <TeamSelection
            data={formData}
            onUpdate={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        );
      case 2:
        return (
          <WorkflowSetup
            data={formData}
            onUpdate={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        );
      case 3:
        return (
          <MetricsGoals
            data={formData}
            onUpdate={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        );
      case 4:
        return (
          <Resources
            data={formData}
            onUpdate={(data) => setFormData({ ...formData, ...data })}
            errors={errors}
          />
        );
      case 5:
        return <Review data={formData} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Stepper */}
        <nav aria-label="Progress" className="space-y-4">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center">
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index <= activeStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= activeStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`ml-4 h-0.5 w-12 ${
                      index < activeStep ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Please fix the validation errors before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {getStepContent(activeStep)}
        </div>

        <div className="flex justify-end gap-4">
          {activeStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating PoV...' : 'Create PoV'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PoVCreationForm;
