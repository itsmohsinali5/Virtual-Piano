export interface PianoKey {
  note: string; // e.g., "C4", "C#4"
  type: 'white' | 'black';
  leftPercent: number; // width representation
  widthPercent: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type JointConnections = [number, number][];

export interface DetectedNote {
  note: string;
  hand: 'Left' | 'Right';
  finger: string;
  timestamp: number;
}

export interface MidiEvent {
  note: string;
  time: number; // offset in seconds from start of recording
  duration?: number; // duration in seconds
  velocity: number;
}

export interface InstrumentSettings {
  sensitivity: number; // 0.1 to 0.9 (vertical collision tolerance)
  smoothing: number; // 0 to 0.9 (finger tracking interpolation)
  volume: number; // -40dB to 0dB
  particlesEnabled: boolean;
  synthType: 'cyber-fm' | 'cosmic-synth' | 'glowing-ambient';
  reverbWet: number; // 0 to 1
  delayWet: number; // 0 to 1
  gestureSustainEnabled: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}
