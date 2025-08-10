// Core TypeScript interfaces for the ASCII Screensaver application

export interface Pattern {
  name: string;
  initialize(): void;
  update(deltaTime: number): void;
  render(): void;
  cleanup(): void;
}

export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
  tags: string[];
  difficulty: number;
  asciiPattern: string;
  patternConfig: {
    density: string;
    speed: string;
    glitch: boolean;
  };
}

export interface Configuration {
  transitionSpeed: number; // 5000-20000ms
  currentTheme: 'matrix' | 'terminal' | 'retro' | 'blue';
  transitionEffect: 'fade' | 'slide' | 'typewriter' | 'rotate3d' | 'morph';
  autoMode: boolean;
  enableParticles: boolean;
  fontSize: 'small' | 'medium' | 'large';
  dayNightMode: 'day' | 'night' | 'auto';
  presentationMode: boolean;
  motionSensitivity: 'normal' | 'reduced';
}

export interface PatternConfig {
  characters: string;
  speed: 'slow' | 'medium' | 'fast';
  density: 'low' | 'medium' | 'high';
  direction?: 'up' | 'down' | 'left' | 'right' | 'horizontal' | 'vertical';
  glitchProbability?: number;
  waveLength?: number;
  amplitude?: number;
  patterns?: string[];
  rotationSpeed?: 'slow' | 'medium' | 'fast';
  complexity?: 'low' | 'medium' | 'high';
  currentTheme?: 'matrix' | 'terminal' | 'retro' | 'blue';
}

export interface ScreensaverState {
  isActive: boolean;
  currentQuote: number;
  currentPattern: string;
  isFullscreen: boolean;
  isPaused: boolean;
}

export interface TransitionState {
  type: 'idle' | 'transitioning';
  effect: string;
  progress: number;
  fromPattern?: string;
  toPattern?: string;
}