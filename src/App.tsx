import { useState, useEffect, useRef } from 'react';
import { InstrumentSettings, DetectedNote, MidiEvent } from './types';
import { getKeyboardLayout } from './utils/keyboardLayout';
import { audioEngine } from './utils/audioEngine';
import { detectChord } from './utils/chordDetector';
import Onboarding from './components/Onboarding';
import SettingsPanel from './components/SettingsPanel';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import WebcamSection from './components/WebcamSection';
import PianoKeyboard from './components/PianoKeyboard';
import LandingPage from './components/LandingPage';
import { Sliders, Camera } from 'lucide-react';

export default function App() {
  const keyboardLayout = getKeyboardLayout();

  // Primary instrument settings
  const [settings, setSettings] = useState<InstrumentSettings>({
    sensitivity: 0.75, // vertical trigger height boundary fraction (0.75 of feed)
    smoothing: 0.45,
    volume: 80,
    particlesEnabled: true,
    synthType: 'cyber-fm',
    reverbWet: 0.35,
    delayWet: 0.20,
    gestureSustainEnabled: true,
  });

  // UI layouts & system states
  const [currentView, setCurrentView] = useState<'landing' | 'piano'>('landing');
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [detectedNotes, setDetectedNotes] = useState<DetectedNote[]>([]);
  const [currentChord, setCurrentChord] = useState<string>('');
  const [sustainActive, setSustainActive] = useState<boolean>(false);
  const [trackingFPS, setTrackingFPS] = useState<number>(0);
  const [handsCount, setHandsCount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      const ranTutorial = localStorage.getItem('virtual_piano_tutorial_viewed');
      return ranTutorial !== 'true';
    } catch (_) {
      return true;
    }
  });
  const [showSettingsExpanded, setShowSettingsExpanded] = useState<boolean>(false);

  // MIDI Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingQueue, setRecordingQueue] = useState<MidiEvent[]>([]);
  const recordingStartTime = useRef<number | null>(null);
  // Keep trace of pending unreleased events in recording
  const pendingRecordEvents = useRef<Record<string, { time: number; velocity: number }>>({});

  // Bootstrap initial volume & acoustics on startup
  useEffect(() => {
    audioEngine.setVolume(settings.volume);
    audioEngine.setEffects(settings.reverbWet, settings.delayWet);
    audioEngine.setSynthType(settings.synthType);
  }, []);

  // Force release of all active notes and sustain state when hands leave the webcam tracker view completely
  useEffect(() => {
    if (handsCount === 0) {
      audioEngine.releaseAll();
      audioEngine.setSustain(false);
      setSustainActive(false);
      setActiveNotes((prev) => {
        if (prev.size > 0) {
          return new Set();
        }
        return prev;
      });
      setCurrentChord('');
    }
  }, [handsCount]);

  // Sync state settings to audioEngine instance
  const handleUpdateSettings = (updated: Partial<InstrumentSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);

    if (updated.volume !== undefined) {
      audioEngine.setVolume(next.volume);
    }
    if (updated.reverbWet !== undefined || updated.delayWet !== undefined) {
      audioEngine.setEffects(next.reverbWet, next.delayWet);
    }
    if (updated.synthType !== undefined) {
      audioEngine.setSynthType(next.synthType);
    }
  };

  // Keyboard Play/Stop event pipelines
  const handlePlayNote = (note: string, velocity = 0.8, hand: 'Left' | 'Right' = 'Right', finger = 'Fingertip') => {
    // Start synthesis
    audioEngine.playNote(note, velocity);

    // Update active visual keys
    setActiveNotes((prev: Set<string>) => {
      const next = new Set(prev);
      next.add(note);
      // Reactive Chord analyzer update
      const computedChord = detectChord(Array.from(next) as string[]);
      setCurrentChord(computedChord);
      return next;
    });

    // Append to note scrolling logger
    setDetectedNotes((prev) => {
      const next = [...prev];
      next.unshift({
        note,
        hand,
        finger,
        timestamp: Date.now(),
      });
      return next.slice(0, 15); // keep max 15 entries
    });

    // Handle recording sequence scheduling if record is active
    if (isRecording && recordingStartTime.current !== null) {
      const nowOffset = (Date.now() - recordingStartTime.current) / 1000;
      pendingRecordEvents.current[note] = {
        time: nowOffset,
        velocity,
      };
    }
  };

  const handleStopNote = (note: string) => {
    // Stop synthesis
    audioEngine.stopNote(note);

    // Remove active visual highlight
    setActiveNotes((prev: Set<string>) => {
      const next = new Set(prev);
      next.delete(note);
      const computedChord = detectChord(Array.from(next) as string[]);
      setCurrentChord(computedChord);
      return next;
    });

    // Complete MIDI recording note durations
    if (isRecording && recordingStartTime.current !== null && pendingRecordEvents.current[note]) {
      const nowOffset = (Date.now() - recordingStartTime.current) / 1000;
      const startInfo = pendingRecordEvents.current[note];
      const duration = Math.max(0.05, nowOffset - startInfo.time);

      setRecordingQueue((prev) => [
        ...prev,
        {
          note,
          time: startInfo.time,
          duration,
          velocity: startInfo.velocity,
        },
      ]);

      delete pendingRecordEvents.current[note];
    }
  };

  // Callback interface for Webcam collisions
  const handleFingerAction = (note: string, eventType: 'start' | 'stop', hand: 'Left' | 'Right', finger: string) => {
    if (eventType === 'start') {
      handlePlayNote(note, 0.85, hand, finger);
    } else {
      handleStopNote(note);
    }
  };

  // Playback ghost event triggers to high-light keys on replay
  const handleReplayNoteTrigger = (note: string, velocity: number) => {
    // Glow key visually
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.add(note);
      return next;
    });

    // Remove glow automatically after a short timeout if stopped
    setTimeout(() => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }, 400);
  };

  const handleSustainAction = (active: boolean) => {
    setSustainActive((current) => {
      if (current !== active) {
        audioEngine.setSustain(active);
        return active;
      }
      return current;
    });
  };

  const handlePanicReset = () => {
    audioEngine.releaseAll();
    audioEngine.setSustain(false);
    setSustainActive(false);
    setActiveNotes(new Set());
    setCurrentChord('');
    setDetectedNotes([]);
    pendingRecordEvents.current = {};
  };

  // Recording triggers
  const handleStartRecording = () => {
    audioEngine.releaseAll();
    pendingRecordEvents.current = {};
    setRecordingQueue([]);
    recordingStartTime.current = Date.now();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Flush any pending unreleased notes
    if (recordingStartTime.current !== null) {
      const nowOffset = (Date.now() - recordingStartTime.current) / 1000;
      Object.keys(pendingRecordEvents.current).forEach((note) => {
        const startInfo = pendingRecordEvents.current[note];
        setRecordingQueue((prev) => [
          ...prev,
          {
            note,
            time: startInfo.time,
            duration: Math.max(0.1, nowOffset - startInfo.time),
            velocity: startInfo.velocity,
          },
        ]);
      });
    }
    pendingRecordEvents.current = {};
    recordingStartTime.current = null;
  };

  const handleClearRecording = () => {
    setRecordingQueue([]);
    pendingRecordEvents.current = {};
  };

  const handleOnboardingComplete = () => {
    // Unblock audio context
    audioEngine.startAudio();
    localStorage.setItem('virtual_piano_tutorial_viewed', 'true');
    setShowTutorial(false);
  };

  const handleStartPlaying = (skipTutorial: boolean) => {
    audioEngine.startAudio();
    if (skipTutorial) {
      localStorage.setItem('virtual_piano_tutorial_viewed', 'true');
      setShowTutorial(false);
      setCurrentView('piano');
      setIsCameraOn(true);
    } else {
      setShowTutorial(true);
      setCurrentView('piano');
      setIsCameraOn(true);
    }
  };

  const handleToggleCamera = () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    if (!nextState) {
      setHandsCount(0);
      setTrackingFPS(0);
      audioEngine.releaseAll();
      audioEngine.setSustain(false);
      setSustainActive(false);
    }
  };

  if (currentView === 'landing') {
    return <LandingPage onStartPlaying={handleStartPlaying} />;
  }

  return (
    <div id="instrument-app-root" className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col justify-between overflow-x-hidden p-3 md:p-6 select-none font-sans relative">
      {/* Dynamic Cyberpunk Atmospheric Gradients */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[500px] h-[400px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP STATUS HEADER SECTION */}
      <header id="piano-app-header" className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 mb-4 gap-4 relative z-20">
        <div className="flex items-center gap-2">
          <button 
            id="back-home-header-btn"
            onClick={() => {
              // Safe reset
              setIsCameraOn(false);
              setHandsCount(0);
              setTrackingFPS(0);
              audioEngine.releaseAll();
              setCurrentView('landing');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white hover:border-zinc-750 transition text-xs font-mono font-bold cursor-pointer mr-2 shadow-md"
            title="Return to home landing page"
          >
            ← Home
          </button>
          
          <img
            src="/favicon.svg"
            alt="Aethera Piano"
            className="h-10 w-10 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          />
          <div>
            <h1 className="font-mono text-lg font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
              Aethera <span className="text-cyan-400">Piano</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 font-medium">AI-POWERED HAND SPEC ENGINE</p>
          </div>
        </div>

        {/* Live system monitoring bar */}
        <div id="live-monitoring" className="flex flex-wrap items-center gap-2 md:gap-4.5 bg-zinc-950/50 border border-zinc-900 px-3.5 py-1.5 rounded-xl text-xs font-mono">
          {/* CAMERA CLOSE/STOP SWITCH OPTION */}
          <button
            id="camera-toggle-btn"
            onClick={handleToggleCamera}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold transition hover:cursor-pointer ${
              isCameraOn 
                ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                : 'border-rose-500/30 bg-rose-950/20 text-rose-450 hover:border-rose-500 hover:bg-rose-950/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
            }`}
            title={isCameraOn ? "Power off camera feed to save CPU and battery" : "Power on camera feed to start hand tracking"}
          >
            <Camera className="h-3.5 w-3.5" />
            {isCameraOn ? 'Close Camera' : 'Start Camera'}
          </button>
          
          <span className="h-3 w-px bg-zinc-800" />

          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${!isCameraOn ? 'bg-rose-500' : handsCount > 0 ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'}`} />
            {!isCameraOn ? 'Webcam Stopped' : handsCount > 0 ? 'Webcam Track Active' : 'Camera Ready'}
          </span>
          <span className="h-3 w-px bg-zinc-800 hidden sm:inline" />
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            FPS: <span className="font-bold text-white">{trackingFPS}</span>
          </span>
          <span className="h-3 w-px bg-zinc-800" />
          {/* STOP ALL AUDIO PANIC BUTTON */}
          <button
            id="panic-reset-btn"
            onClick={handlePanicReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-950/10 text-red-500 hover:bg-red-950/30 hover:border-red-500 transition text-[10px] uppercase font-bold cursor-pointer"
            title="Immediately stop all sounds and clear active sustain holds"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Stop Sounds
          </button>
          <span className="h-3 w-px bg-zinc-800" />
          {/* Settings Config Panel Expander Tag */}
          <button
            id="toggle-settings-btn"
            onClick={() => setShowSettingsExpanded(!showSettingsExpanded)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold transition hover:cursor-pointer ${
              showSettingsExpanded 
                ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> Engine Settings
          </button>
        </div>
      </header>

      {/* 2. MAIN BENTO GRID HUD WORKSPACE */}
      <main id="piano-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Left Control Bar (detected notes, chords, engine FPS statuses) */}
        <LeftPanel
          detectedNotes={detectedNotes}
          currentChord={currentChord}
          sustainActive={sustainActive}
          trackingFPS={trackingFPS}
          handsCount={handsCount}
          triggerTutorial={() => setShowTutorial(true)}
          onPanicReset={handlePanicReset}
        />

        {/* Center Live Webcam Capture Frame Section */}
        <section id="center-feed-section" className="lg:col-span-6 flex flex-col gap-4">
          <WebcamSection
            settings={settings}
            keyboardLayout={keyboardLayout}
            onFingerAction={handleFingerAction}
            onSustainAction={handleSustainAction}
            onFPSUpdate={setTrackingFPS}
            onHandsCountUpdate={setHandsCount}
            externalActiveNotes={activeNotes}
            isActive={!showTutorial && isCameraOn}
            isCameraOn={isCameraOn}
            onToggleCamera={handleToggleCamera}
          />
        </section>

        {/* Right Studio Track Recording Bar */}
        <RightPanel
          recordingQueue={recordingQueue}
          isRecording={isRecording}
          onClearRecording={handleClearRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onReplayNoteTrigger={handleReplayNoteTrigger}
        />

      </main>

      {/* 3. SETTINGS COLLAPSIBLE LAYER PANEL */}
      {showSettingsExpanded && (
        <section id="drawer-settings-section" className="w-full max-w-7xl mx-auto mt-5 relative z-10 animate-fade-in">
          <SettingsPanel
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        </section>
      )}

      {/* 4. BOTTOM PERSISTENT VIRTUAL PIANO DECK */}
      <footer id="app-footer-deck" className="w-full max-w-7xl mx-auto mt-6 relative z-10">
        <PianoKeyboard
          layout={keyboardLayout}
          activeNotes={activeNotes}
          onPlayNote={(note) => handlePlayNote(note, 0.85, 'Right', 'MouseClick')}
          onStopNote={handleStopNote}
        />
      </footer>

      {/* 5. USER INTERACTIVE ONBOARDING TUTORIAL SCREEN OVERLAY */}
      {showTutorial && (
        <Onboarding
          onStart={handleOnboardingComplete}
          onClose={handleOnboardingComplete}
        />
      )}
    </div>
  );
}
