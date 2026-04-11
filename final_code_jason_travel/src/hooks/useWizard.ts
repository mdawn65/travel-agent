"use client";

import { useReducer } from "react";
import { TravelFormInput, TravelStyle, WizardPhase } from "@/types/travel";

interface WizardState {
  currentStep: number;
  formData: Partial<TravelFormInput>;
  phase: WizardPhase;
}

type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "UPDATE_FIELD"; key: keyof TravelFormInput; value: string | number | TravelStyle }
  | { type: "SET_PHASE"; phase: WizardPhase }
  | { type: "RESET" };

const TOTAL_STEPS = 5;

const initialState: WizardState = {
  currentStep: 0,
  formData: {
    origin: "",
    location: "",
    departureDate: "",
    returnDate: "",
    budget: 0,
    style: undefined,
    chatHistory: "",
  },
  phase: "input",
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
      };
    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: Math.max(0, Math.min(action.step, TOTAL_STEPS - 1)),
      };
    case "UPDATE_FIELD":
      return {
        ...state,
        formData: { ...state.formData, [action.key]: action.value },
      };
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  return {
    currentStep: state.currentStep,
    formData: state.formData,
    phase: state.phase,
    totalSteps: TOTAL_STEPS,
    nextStep: () => dispatch({ type: "NEXT_STEP" }),
    prevStep: () => dispatch({ type: "PREV_STEP" }),
    goToStep: (step: number) => dispatch({ type: "GO_TO_STEP", step }),
    updateField: (key: keyof TravelFormInput, value: string | number | TravelStyle) =>
      dispatch({ type: "UPDATE_FIELD", key, value }),
    setPhase: (phase: WizardPhase) => dispatch({ type: "SET_PHASE", phase }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
