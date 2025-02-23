import React, { createContext, useContext, useReducer } from 'react';
import { PoVFormData } from './PoVCreationForm';

type PoVFormState = {
  currentStep: number;
  steps: Array<{ id: string; label: string }>;
  formState: Partial<PoVFormData>;
};

type PoVFormAction = 
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_FORM_STATE'; payload: Partial<PoVFormData> }
  | { type: 'RESET_FORM' };

const initialState: PoVFormState = {
  currentStep: 0,
  steps: [
    { id: 'basicInfo', label: 'Basic Information' },
    { id: 'team', label: 'Team Selection' },
    { id: 'workflow', label: 'Workflow Setup' },
    { id: 'metrics', label: 'Metrics & Goals' },
    { id: 'resources', label: 'Resources' },
    { id: 'review', label: 'Review' }
  ],
  formState: {
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
  }
};

const PoVFormContext = createContext<{
  state: PoVFormState;
  dispatch: React.Dispatch<PoVFormAction>;
}>({
  state: initialState,
  dispatch: () => null
});

function formReducer(state: PoVFormState, action: PoVFormAction): PoVFormState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_FORM_STATE':
      return { ...state, formState: { ...state.formState, ...action.payload } };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

export function PoVFormProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  return (
    <PoVFormContext.Provider value={{ state, dispatch }}>
      {children}
    </PoVFormContext.Provider>
  );
}

export function usePoVForm() {
  const context = useContext(PoVFormContext);
  if (!context) {
    throw new Error('usePoVForm must be used within a PoVFormProvider');
  }
  return context;
}
