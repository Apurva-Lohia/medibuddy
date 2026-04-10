'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Medication, ChatMessage, CalendarEvent, ExternalCalendar } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  messages: ChatMessage[];
  calendarEvents: CalendarEvent[];
  externalCalendars: ExternalCalendar[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'ADD_MEDICATION'; payload: Medication }
  | { type: 'ADD_PAST_MEDICATION'; payload: Medication }
  | { type: 'REMOVE_MEDICATION'; payload: string }
  | { type: 'REMOVE_PAST_MEDICATION'; payload: string }
  | { type: 'UPDATE_MEDICATION'; payload: Medication }
  | { type: 'ADD_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'CONNECT_CALENDAR'; payload: ExternalCalendar }
  | { type: 'DISCONNECT_CALENDAR'; payload: ExternalCalendar['provider'] }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  messages: [],
  calendarEvents: [],
  externalCalendars: [],
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'ADD_MEDICATION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          currentMedications: [...state.user.currentMedications, action.payload],
        },
      };
    case 'ADD_PAST_MEDICATION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          pastMedications: [...state.user.pastMedications, action.payload],
        },
      };
    case 'REMOVE_MEDICATION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          currentMedications: state.user.currentMedications.filter(m => m.id !== action.payload),
        },
      };
    case 'REMOVE_PAST_MEDICATION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          pastMedications: state.user.pastMedications.filter(m => m.id !== action.payload),
        },
      };
    case 'UPDATE_MEDICATION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          currentMedications: state.user.currentMedications.map(m =>
            m.id === action.payload.id ? action.payload : m
          ),
        },
      };
    case 'ADD_CALENDAR_EVENT':
      return { ...state, calendarEvents: [...state.calendarEvents, action.payload] };
    case 'UPDATE_CALENDAR_EVENT':
      return {
        ...state,
        calendarEvents: state.calendarEvents.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'CONNECT_CALENDAR':
      return {
        ...state,
        externalCalendars: [
          ...state.externalCalendars.filter(c => c.provider !== action.payload.provider),
          action.payload,
        ],
      };
    case 'DISCONNECT_CALENDAR':
      return {
        ...state,
        externalCalendars: state.externalCalendars.filter(c => c.provider !== action.payload),
      };
    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, ...action.payload, updatedAt: new Date().toISOString() },
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  logout: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addMedication: (medication: Medication) => void;
  addPastMedication: (medication: Medication) => void;
  removeMedication: (id: string) => void;
  removePastMedication: (id: string) => void;
  updateMedication: (medication: Medication) => void;
  updateUser: (data: Partial<User>) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  generateCalendarEvents: (medication: Medication, startDate: Date, endDate: Date) => void;
  connectCalendar: (provider: ExternalCalendar['provider']) => Promise<boolean>;
  disconnectCalendar: (provider: ExternalCalendar['provider']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'medicare_companion_user';
const MESSAGES_KEY = 'medicare_companion_messages';
const CALENDAR_KEY = 'medicare_companion_calendar';
const CALENDARS_KEY = 'medicare_companion_calendars';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const storedMessages = localStorage.getItem(MESSAGES_KEY);
    const storedCalendar = localStorage.getItem(CALENDAR_KEY);
    const storedCalendars = localStorage.getItem(CALENDARS_KEY);

    if (storedUser) {
      dispatch({ type: 'SET_USER', payload: JSON.parse(storedUser) });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    if (storedMessages) {
      const messages = JSON.parse(storedMessages);
      messages.forEach((msg: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: msg }));
    }

    if (storedCalendar) {
      const events = JSON.parse(storedCalendar);
      events.forEach((event: CalendarEvent) => dispatch({ type: 'ADD_CALENDAR_EVENT', payload: event }));
    }

    if (storedCalendars) {
      const calendars = JSON.parse(storedCalendars);
      calendars.forEach((cal: ExternalCalendar) => dispatch({ type: 'CONNECT_CALENDAR', payload: cal }));
    }
  }, []);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    }
  }, [state.user]);

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(state.messages));
  }, [state.messages]);

  useEffect(() => {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(state.calendarEvents));
  }, [state.calendarEvents]);

  useEffect(() => {
    localStorage.setItem(CALENDARS_KEY, JSON.stringify(state.externalCalendars));
  }, [state.externalCalendars]);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.email === email) {
        dispatch({ type: 'SET_USER', payload: user });
        return true;
      }
    }
    
    const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const user = demoUsers.find((u: User) => u.email === email);
    
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      return true;
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
    demoUsers.push(newUser);
    localStorage.setItem('demo_users', JSON.stringify(demoUsers));
    
    dispatch({ type: 'SET_USER', payload: newUser });
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
  };

  const addMedication = (medication: Medication) => {
    dispatch({ type: 'ADD_MEDICATION', payload: medication });
  };

  const addPastMedication = (medication: Medication) => {
    dispatch({ type: 'ADD_PAST_MEDICATION', payload: medication });
  };

  const removeMedication = (id: string) => {
    dispatch({ type: 'REMOVE_MEDICATION', payload: id });
  };

  const removePastMedication = (id: string) => {
    dispatch({ type: 'REMOVE_PAST_MEDICATION', payload: id });
  };

  const updateMedication = (medication: Medication) => {
    dispatch({ type: 'UPDATE_MEDICATION', payload: medication });
  };

  const updateUser = (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
  };

  const updateCalendarEvent = (event: CalendarEvent) => {
    dispatch({ type: 'UPDATE_CALENDAR_EVENT', payload: event });
  };

  const generateCalendarEvents = (medication: Medication, startDate: Date, endDate: Date) => {
    const events: CalendarEvent[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      medication.times.forEach(time => {
        events.push({
          id: uuidv4(),
          medicationId: medication.id,
          date: current.toISOString().split('T')[0],
          time,
          status: 'pending',
          medication,
        });
      });
      current.setDate(current.getDate() + 1);
    }
    
    events.forEach(event => dispatch({ type: 'ADD_CALENDAR_EVENT', payload: event }));
  };

  const connectCalendar = async (provider: ExternalCalendar['provider']): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    dispatch({
      type: 'CONNECT_CALENDAR',
      payload: {
        provider,
        connected: true,
        lastSync: new Date().toISOString(),
      },
    });
    return true;
  };

  const disconnectCalendar = (provider: ExternalCalendar['provider']) => {
    dispatch({ type: 'DISCONNECT_CALENDAR', payload: provider });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        login,
        signup,
        logout,
        addMessage,
        addMedication,
        addPastMedication,
        removeMedication,
        removePastMedication,
        updateMedication,
        updateUser,
        updateCalendarEvent,
        generateCalendarEvents,
        connectCalendar,
        disconnectCalendar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
