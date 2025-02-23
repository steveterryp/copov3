import React, { createContext } from 'react';

export type FormContextType = {
  currentStep: number;
  steps: Array<{ id: string; label: string }>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  formState: Record<string, any>;
  setFormState: (state: Record<string, any>) => void;
};

export const FormContext = createContext<FormContextType>({
  currentStep: 0,
  steps: [],
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  isLastStep: false,
  isFirstStep: true,
  formState: {},
  setFormState: () => {}
});
