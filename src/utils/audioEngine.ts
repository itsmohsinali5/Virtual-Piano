import * as Tone from 'tone';

class AudioEngine {
  private synths: Record<string, Tone.PolySynth> = {};
  private currentSynthType: 'cyber-fm' | 'cosmic-synth' | 'glowing-ambient' = 'cyber-fm';
  private verb: Tone.Reverb | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private volNode: Tone.Volume | null = null;
  private limiter: Tone.Limiter | null = null;
  
  // Track physical presses vs sustain-held notes
  private activePhysicalNotes = new Set<string>();
  private sustainedNotes = new Set<string>();
  private sustainActive = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Create Effects Chain
    this.volNode = new Tone.Volume(-12).toDestination();
    this.limiter = new Tone.Limiter(-1);
    this.verb = new Tone.Reverb({ decay: 2.5, preDelay: 0.1, wet: 0.35 });
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.25, wet: 0.2 });

    // Chain: Synth -> Delay -> Reverb -> Limiter -> Volume -> out
    this.verb.chain(this.limiter, this.volNode);
    this.delay.connect(this.verb);

    // Initialize Synths
    this.initSynths();
  }

  private initSynths() {
    // Cyber FM Synth (crisp, metallic, cyberpunk feel)
    const fmSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 1.2 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.8 },
    });
    fmSynth.maxPolyphony = 32;
    fmSynth.connect(this.delay!);
    this.synths['cyber-fm'] = fmSynth;

    // Cosmic Synth (warm, resonant, modern pluck synth)
    const cosmicSynth = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, type: 'lowpass', frequency: 1200 },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.0 },
      filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 0.8, baseFrequency: 300, octaves: 2.5, exponent: 2 },
    });
    cosmicSynth.maxPolyphony = 32;
    cosmicSynth.connect(this.delay!);
    this.synths['cosmic-synth'] = cosmicSynth;

    // Glowing Ambient Synth (lush, long pad chime)
    const ambientSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.2, decay: 0.8, sustain: 0.8, release: 2.5 },
    });
    ambientSynth.maxPolyphony = 32;
    ambientSynth.connect(this.delay!);
    this.synths['glowing-ambient'] = ambientSynth;
  }

  public async startAudio() {
    await Tone.start();
    console.log('Tone.js Audio Context started');
  }

  public playNote(note: string, velocityValue = 0.8) {
    if (!this.volNode) return;
    
    // Resume context if suspended
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    const currentSynth = this.synths[this.currentSynthType];
    if (!currentSynth) return;

    // Register active press
    this.activePhysicalNotes.add(note);

    try {
      // Trigger attack immediately with velocity
      currentSynth.triggerAttack(note, Tone.now(), velocityValue);
    } catch (e) {
      console.warn('Tone.js failed trigger attack for', note, e);
    }
  }

  public stopNote(note: string) {
    const currentSynth = this.synths[this.currentSynthType];
    if (!currentSynth) return;

    this.activePhysicalNotes.delete(note);

    if (this.sustainActive) {
      // Hold it in sustain list rather than releasing
      this.sustainedNotes.add(note);
    } else {
      try {
        currentSynth.triggerRelease(note, Tone.now() + 0.05);
      } catch (e) {
        console.warn('Tone.js failed to trigger release for', note, e);
      }
    }
  }

  public setSustain(active: boolean) {
    this.sustainActive = active;
    const currentSynth = this.synths[this.currentSynthType];
    if (!currentSynth) return;

    if (!active) {
      // Sustain released: stop all notes in sustained record that are not physically pressed anymore
      const notesToRelease: string[] = [];
      this.sustainedNotes.forEach((note) => {
        if (!this.activePhysicalNotes.has(note)) {
          notesToRelease.push(note);
        }
      });

      if (notesToRelease.length > 0) {
        try {
          currentSynth.triggerRelease(notesToRelease, Tone.now());
        } catch (e) {
          console.warn('Tone.js sustain release warning', e);
        }
      }
      this.sustainedNotes.clear();
    }
  }

  public setVolume(volumeValue: number) {
    if (!this.volNode) return;
    // Map numerical slider e.g., 0-100 to volume in decibels (-40dB to 0dB)
    if (volumeValue === 0) {
      this.volNode.volume.value = -Infinity;
    } else {
      const db = Tone.gainToDb(volumeValue / 100);
      this.volNode.volume.value = Math.max(-40, Math.min(6, db));
    }
  }

  public setEffects(reverbWet: number, delayWet: number) {
    if (this.verb) this.verb.wet.value = reverbWet;
    if (this.delay) this.delay.wet.value = delayWet;
  }

  public setSynthType(type: 'cyber-fm' | 'cosmic-synth' | 'glowing-ambient') {
    // Release active notes of the older synth
    const oldSynth = this.synths[this.currentSynthType];
    if (oldSynth) {
      try {
        oldSynth.releaseAll();
      } catch (_) {}
    }
    this.currentSynthType = type;
  }

  public getSustainActive(): boolean {
    return this.sustainActive;
  }

  public releaseAll() {
    const currentSynth = this.synths[this.currentSynthType];
    if (currentSynth) {
      try {
        currentSynth.releaseAll();
      } catch (_) {}
    }
    this.activePhysicalNotes.clear();
    this.sustainedNotes.clear();
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
