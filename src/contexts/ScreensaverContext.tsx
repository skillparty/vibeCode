import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Configuration, ScreensaverState, Quote } from '../types';
import { quotes } from '../data/quotes';

// Default configuration
const defaultConfig: Configuration = {
  transitionSpeed: 10000,
  currentTheme: 'matrix',
  transitionEffect: 'fade',
  autoMode: true,
  enableParticles: true,
  fontSize: 'medium',
  dayNightMode: 'auto',
  presentationMode: false,
  motionSensitivity: 'normal'
};

// Default screensaver state
const defaultState: ScreensaverState = {
  isActive: true,
  currentQuote: 0,
  currentPattern: 'matrix',
  isFullscreen: false,
  isPaused: false
};

// Context state interface
interface ScreensaverContextState {
  config: Configuration;
  state: ScreensaverState;
  quotes: Quote[];
  currentQuote: Quote;
}

// Action types
type ScreensaverAction =
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_CURRENT_QUOTE'; payload: number }
  | { type: 'SET_CURRENT_PATTERN'; payload: string }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'UPDATE_CONFIG'; payload: Partial<Configuration> }
  | { type: 'NEXT_QUOTE' }
  | { type: 'PREVIOUS_QUOTE' }
  | { type: 'TOGGLE_AUTO_MODE' }
  | { type: 'TOGGLE_PRESENTATION_MODE' };

// Context interface
interface ScreensaverContextType {
  state: ScreensaverContextState;
  dispatch: React.Dispatch<ScreensaverAction>;
  actions: {
    setActive: (active: boolean) => void;
    setCurrentQuote: (index: number) => void;
    setCurrentPattern: (pattern: string) => void;
    setFullscreen: (fullscreen: boolean) => void;
    setPaused: (paused: boolean) => void;
    updateConfig: (config: Partial<Configuration>) => void;
    nextQuote: () => void;
    previousQuote: () => void;
    toggleAutoMode: () => void;
    togglePresentationMode: () => void;
  };
}

// Reducer function
const screensaverReducer = (
  state: ScreensaverContextState,
  action: ScreensaverAction
): ScreensaverContextState => {
  switch (action.type) {
    case 'SET_ACTIVE':
      return {
        ...state,
        state: { ...state.state, isActive: action.payload }
      };
    
    case 'SET_CURRENT_QUOTE':
      const newIndex = Math.max(0, Math.min(action.payload, state.quotes.length - 1));
      return {
        ...state,
        state: { ...state.state, currentQuote: newIndex },
        currentQuote: state.quotes[newIndex]
      };
    
    case 'SET_CURRENT_PATTERN':
      return {
        ...state,
        state: { ...state.state, currentPattern: action.payload }
      };
    
    case 'SET_FULLSCREEN':
      return {
        ...state,
        state: { ...state.state, isFullscreen: action.payload }
      };
    
    case 'SET_PAUSED':
      return {
        ...state,
        state: { ...state.state, isPaused: action.payload }
      };
    
    case 'UPDATE_CONFIG':
      const updatedConfig = { ...state.config, ...action.payload };
      return {
        ...state,
        config: updatedConfig
      };
    
    case 'NEXT_QUOTE':
      const nextIndex = (state.state.currentQuote + 1) % state.quotes.length;
      return {
        ...state,
        state: { ...state.state, currentQuote: nextIndex },
        currentQuote: state.quotes[nextIndex]
      };
    
    case 'PREVIOUS_QUOTE':
      const prevIndex = state.state.currentQuote === 0 
        ? state.quotes.length - 1 
        : state.state.currentQuote - 1;
      return {
        ...state,
        state: { ...state.state, currentQuote: prevIndex },
        currentQuote: state.quotes[prevIndex]
      };
    
    case 'TOGGLE_AUTO_MODE':
      return {
        ...state,
        config: { ...state.config, autoMode: !state.config.autoMode }
      };
    
    case 'TOGGLE_PRESENTATION_MODE':
      return {
        ...state,
        config: { ...state.config, presentationMode: !state.config.presentationMode }
      };
    
    default:
      return state;
  }
};

// Create context
const ScreensaverContext = createContext<ScreensaverContextType | undefined>(undefined);

// Provider component
interface ScreensaverProviderProps {
  children: ReactNode;
}

export const ScreensaverProvider: React.FC<ScreensaverProviderProps> = ({ children }) => {
  // Initialize state with quotes
  const initialState: ScreensaverContextState = {
    config: defaultConfig,
    state: defaultState,
    quotes: quotes as Quote[],
    currentQuote: quotes[0] as Quote
  };

  const [state, dispatch] = useReducer(screensaverReducer, initialState);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('screensaver-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        dispatch({ type: 'UPDATE_CONFIG', payload: parsedConfig });
      }
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
    }
  }, []);

  // Save configuration to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('screensaver-config', JSON.stringify(state.config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }, [state.config]);

  // Action creators
  const actions = {
    setActive: (active: boolean) => dispatch({ type: 'SET_ACTIVE', payload: active }),
    setCurrentQuote: (index: number) => dispatch({ type: 'SET_CURRENT_QUOTE', payload: index }),
    setCurrentPattern: (pattern: string) => dispatch({ type: 'SET_CURRENT_PATTERN', payload: pattern }),
    setFullscreen: (fullscreen: boolean) => dispatch({ type: 'SET_FULLSCREEN', payload: fullscreen }),
    setPaused: (paused: boolean) => dispatch({ type: 'SET_PAUSED', payload: paused }),
    updateConfig: (config: Partial<Configuration>) => dispatch({ type: 'UPDATE_CONFIG', payload: config }),
    nextQuote: () => dispatch({ type: 'NEXT_QUOTE' }),
    previousQuote: () => dispatch({ type: 'PREVIOUS_QUOTE' }),
    toggleAutoMode: () => dispatch({ type: 'TOGGLE_AUTO_MODE' }),
    togglePresentationMode: () => dispatch({ type: 'TOGGLE_PRESENTATION_MODE' })
  };

  const contextValue: ScreensaverContextType = {
    state,
    dispatch,
    actions
  };

  return (
    <ScreensaverContext.Provider value={contextValue}>
      {children}
    </ScreensaverContext.Provider>
  );
};

// Custom hook to use the context
export const useScreensaver = (): ScreensaverContextType => {
  const context = useContext(ScreensaverContext);
  if (context === undefined) {
    throw new Error('useScreensaver must be used within a ScreensaverProvider');
  }
  return context;
};
