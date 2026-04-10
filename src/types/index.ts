export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  ethnicity?: string;
  currentConditions: string[];
  pastConditions: string[];
  allergies: string[];
  currentMedications: Medication[];
  pastMedications: Medication[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed';
  times: ('morning' | 'afternoon' | 'evening' | 'night')[];
  instructions?: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  pharmacy?: string;
  refillDate?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'safe' | 'caution' | 'danger';
  description: string;
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  drugs?: string[];
  interactionResult?: {
    safe: boolean;
    interactions: DrugInteraction[];
  };
}

export interface CalendarEvent {
  id: string;
  medicationId: string;
  date: string;
  time: 'morning' | 'afternoon' | 'evening' | 'night';
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  medication: Medication;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  age: string;
  sex: 'male' | 'female' | 'other' | '';
  height: string;
  weight: string;
  ethnicity: string;
  currentConditions: string[];
  pastConditions: string[];
  allergies: string[];
  currentMedications: Medication[];
  pastMedications: Medication[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface ExternalCalendar {
  provider: 'google' | 'apple' | 'outlook';
  connected: boolean;
  lastSync?: string;
}
