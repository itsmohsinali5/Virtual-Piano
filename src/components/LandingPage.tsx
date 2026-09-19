import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Camera, 
  Download, 
  Sparkles, 
  Hand, 
  Layers, 
  CheckCircle, 
  Play, 
  Volume2, 
  Settings, 
  ChevronRight, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface LandingPageProps {
  onStartPlaying: (skipTutorial: boolean) => void;
}

export default function LandingPage({ onStartPlaying }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'tracking' | 'midi'>('all');
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  const [previewNotes, setPreviewNotes] = useState<string[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Automated melody sequence for the live landing preview
  const melody = [
    { note: 'C4', delay: 0 },
    { note: 'E4', delay: 300 },
    { note: 'G4', delay: 600 },
    { note: 'C5', delay: 900 },
    { note: 'E5', delay: 1200 },
    { note: 'D5', delay: 1800 },
    { note: 'B4', delay: 2100 },
    { note: 'G4', delay: 2400 },
  ];

  const playDemoSequence = () => {
    if (previewPlaying) return;
    setPreviewPlaying(true);
    audioEngine.startAudio();

    melody.forEach((item) => {
      setTimeout(() => {
        audioEngine.playNote(item.note, 0.7);
        setPreviewNotes((prev) => [...prev, item.note]);
        
        setTimeout(() => {
          audioEngine.stopNote(item.note);
          setPreviewNotes((prev) => prev.filter(n => n !== item.note));
        }, 400);
      }, item.delay);
    });

    setTimeout(() => {
      setPreviewPlaying(false);
    }, 3000);
  };

  const handleKeyTrigger = (note: string) => {
    audioEngine.startAudio();
    audioEngine.playNote(note, 0.85);
    setPreviewNotes((prev) => [...prev, note]);
    setTimeout(() => {
      audioEngine.stopNote(note);
      setPreviewNotes((prev) => prev.filter(n => n !== note));
    }, 500);
  };

  const demoKeys = [
    { note: 'C4', label: 'C', isBlack: false },
    { note: 'C#4', label: 'C#', isBlack: true },
    { note: 'D4', label: 'D', isBlack: false },
    { note: 'D#4', label: 'D#', isBlack: true },
    { note: 'E4', label: 'E', isBlack: false },
    { note: 'F4', label: 'F', isBlack: false },
    { note: 'F#4', label: 'F#', isBlack: true },
    { note: 'G4', label: 'G', isBlack: false },
    { note: 'G#4', label: 'G#', isBlack: true },
    { note: 'A4', label: 'A', isBlack: false },
    { note: 'A#4', label: 'A#', isBlack: true },
    { note: 'B4', label: 'B', isBlack: false },
    { note: 'C5', label: 'C', isBlack: false },
  ];

  const faqs = [
    {
      question: "How does Aethera track my hands with only a standard webcam?",
      answer: "Aethera embeds a high-speed local AI model (MediaPipe Hands architecture) natively in your browser. It calculates the 3D coordinates of 21 unique joint positions on each hand 30 times a second, meaning no video stream is ever sent to a server. Your privacy is 100% secure."
    },
    {
      question: "Can I play multiple notes at the same time?",
      answer: "Yes! The system is fully polyphonic. Multi-hand tracking allows you to trigger keys, perform chords, and slide across octaves seamlessly with all ten fingers tracked conjointly."
    },
    {
      question: "How do I play sustain notes without a foot pedal?",
      answer: "We created a specific AI Gesture Sustain trigger. Simply close your hand into a tight fist ✊ while playing to engage the sustain latch. Open your hand ✋ to release. You can also turn this option off in the Engine Settings panel on the dashboard."
    },
    {
      question: "Are the MIDI files downloaded compatible with standard players?",
      answer: "Yes, our exported MIDI file matches the exact binary standard format-0 spec including correct note-on delta-intervals, key velocities, and notes length. They are fully playable inside standard players and ready to drag-and-drop into any professional DAW (Ableton, FL Studio, Logic Pro, etc.)."
    }
  ];

  return (
    <div id="landing-page-root" className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col justify-between overflow-x-hidden select-none font-sans relative">
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-950/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[700px] h-[700px] bg-indigo-950/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-cyan-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* NAVBAR */}
      <nav id="landing-navbar" className="sticky top-0 z-50 border-b border-zinc-900 bg-[#07070a]/85 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="Aethera Piano"
              className="h-9 w-9 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            />
            <div>
              <span className="font-mono text-base font-black tracking-tight text-white uppercase flex items-center gap-1">
                Aethera <span className="text-cyan-400">Piano</span>
              </span>
              <p className="text-[8px] font-mono text-zinc-500 font-semibold leading-none tracking-widest">AI VISION INSTRUMENT</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono text-zinc-400">
            <a href="#features" className="hover:text-cyan-400 transition cursor-pointer">FEATURES</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition cursor-pointer">HOW IT WORKS</a>
            <a href="#demo" className="hover:text-cyan-400 transition cursor-pointer">LIVE PREVIEW</a>
            <a href="#faq" className="hover:text-cyan-400 transition cursor-pointer">F.A.Q.</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              id="navbar-cta"
              onClick={() => onStartPlaying(false)}
              className="px-4 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition cursor-pointer"
            >
              START PLAYING
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header id="landing-hero" className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center z-15">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-[10px] font-mono uppercase font-bold text-cyan-400 mb-6 tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Sparkles className="h-3 w-3 animate-pulse" /> Local Browser AI Hand Tracking • No Hardware MIDI Required
        </div>

        {/* Headline */}
        <h1 className="font-sans text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
          Play Piano With Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            Hands Using AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-zinc-450 text-sm md:text-base leading-relaxed mb-10">
          Experience the ultimate AI vision instrument. Aethera utilizes advanced neural networks to map your keys collision locally. Stream notes, activate gestural sustain, record your flow, and download fully verified, pristine MIDI files instantly.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            id="hero-cta-guided"
            onClick={() => onStartPlaying(false)}
            className="group flex items-center gap-2 pl-6 pr-5 py-3 rounded-2xl bg-cyan-500 text-zinc-950 text-sm font-bold shadow-[0_4px_30px_rgba(6,182,212,0.3)] hover:bg-cyan-400 hover:shadow-[0_4px_35px_rgba(6,182,212,0.5)] transition"
          >
            Start Playing Now
            <ArrowRight className="h-4 w-4 tracking-normal group-hover:translate-x-0.5 transition-transform" />
          </button>
          
          <button 
            id="hero-cta-skip"
            onClick={() => onStartPlaying(true)}
            className="group flex items-center gap-2 pl-5 pr-5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 text-sm font-medium hover:border-zinc-700 hover:text-white transition"
          >
            Skip Directly to Piano
          </button>
        </div>

        {/* Visual Cue - Floating hand and piano notes */}
        <div className="mt-16 relative mx-auto max-w-3xl rounded-2xl border border-zinc-900 bg-zinc-950/40 p-1 backdrop-blur-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <div className="bg-[#0b0b10] rounded-[14px] p-6 text-left border border-zinc-950">
            {/* System Monitor Bar Mock */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span>CAMERA STATUS: RUNNING</span>
                <span className="text-zinc-700">|</span>
                <span>LATENCY: 1.2ms</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
              </div>
            </div>

            {/* Simulated Hand skeletons overlaying piano keys */}
            <div className="relative h-44 rounded-xl border border-zinc-850 bg-zinc-950/80 flex items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 left-3 px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-950/20 text-[9px] font-mono text-cyan-400 font-bold tracking-wider uppercase">
                Active Tracking Simulation
              </div>

              {/* Hand Vector Overlay Graph */}
              <svg className="absolute inset-0 w-full h-full text-cyan-400/20" viewBox="0 0 400 200">
                {/* Simulated joint connections */}
                <path d="M120,180 L140,120 L115,75 M140,120 L140,55 M140,120 L165,60 L180,62 M120,180 L80,135 L60,110" fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="2.5" />
                <path d="M280,180 L260,120 L240,70 M260,120 L270,50 L275,52 M260,120 L295,65 M280,180 L320,130" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2.5" />
                
                {/* Active collision paths */}
                <circle cx="115" cy="75" r="4.5" className="fill-cyan-400 shadow-xl" />
                <line x1="115" y1="75" x2="115" y2="140" stroke="rgba(236,72,153,0.6)" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="270" cy="50" r="4.5" className="fill-indigo-400" />
                
                {/* Colliding fingertip indicator */}
                <circle cx="140" cy="140" r="7" className="fill-pink-500 animate-pulse" />
                <circle cx="140" cy="140" r="3" className="fill-white" />
              </svg>

              {/* Piano deck layout beneath visualizer */}
              <div className="w-full mt-24 flex justify-between h-14 bg-zinc-900 border-t border-zinc-800 rounded-b-lg">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 border-r border-zinc-950 flex flex-col justify-end p-1 transition ${
                      i === 6 ? 'bg-gradient-to-t from-pink-550 to-amber-700/25 shadow-inner' : 'bg-zinc-900'
                    }`}
                  >
                    <span className="text-[7px] font-mono text-zinc-650 text-center uppercase">
                      {i === 6 ? 'C4 pressed' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES SECTION (Bento Grid) */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">PRO INSTRUMENT DECK</span>
          <h2 className="font-sans text-3xl sm:text-5xl font-black tracking-tight text-white mt-3">
            Engineered For Precision
          </h2>
          <p className="text-zinc-450 mt-4 text-sm leading-relaxed">
            We coupled browser-native neural networks with state-of-the-art synthesizers to create a zero-latency tactile instrument.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 hover:border-cyan-500/45 hover:bg-zinc-900/20 transition group">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 mb-5 group-hover:scale-105 transition-all">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Real-time Computer Vision</h3>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Ditches cables and bulky hardware. Tracks 21 finger coordinates locally using your building-integrated webcam with zero remote uploads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 hover:border-indigo-500/45 hover:bg-zinc-900/20 transition group">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-950/30 text-indigo-400 border border-indigo-500/20 mb-5 group-hover:scale-105 transition-all">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Verified MIDI Exporter</h3>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Export pure MIDI file format-0 binaries without corruption. Open them with full velocity, note-on, and stop timings intact inside any modern DAW.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 hover:border-fuchsia-500/45 hover:bg-zinc-900/20 transition group">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-fuchsia-950/30 text-fuchsia-400 border border-fuchsia-500/20 mb-5 group-hover:scale-105 transition-all">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live AI Chord Detection</h3>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Analyzes played notes concurrently and displays detected chord formats (e.g., C Major, Amin7) automatically to improve theory drills.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 hover:border-cyan-550 hover:bg-zinc-900/20 transition group">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 mb-5 group-hover:scale-105 transition-all">
              <Hand className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Gesture Sustain Pedal</h3>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Clenching either hand into a fist ✊ automatically activates the sustain lock to hold beautiful chords, opening the palm ✋ releases it.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono tracking-widest text-indigo-400 font-bold uppercase">TRAJECTORY SEQUENCE</span>
          <h2 className="font-sans text-3xl sm:text-5xl font-black tracking-tight text-white mt-3">
            Simple 4-Step Flow
          </h2>
          <p className="text-zinc-450 mt-4 text-sm leading-relaxed">
            Follow this clear step setup process to turn your workspace into an interactive audio synth.
          </p>
        </div>

        {/* Steps display layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-cyan-500/30 flex items-center justify-center font-mono text-base font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] z-10">
              1
            </div>
            <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase mt-2">Initialize App</h3>
            <p className="text-xs text-zinc-450 max-w-xs">
              Click "Start Playing" and walk through our short browser safety calibration system.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-base font-bold text-zinc-400 z-10">
              2
            </div>
            <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase mt-2">Calibrate Camera</h3>
            <p className="text-xs text-zinc-450 max-w-xs">
              Enable your local camera to load the local AI tracking hand-skeletal models safely.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-base font-bold text-zinc-400 z-10">
              3
            </div>
            <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase mt-2">Strike and Harmonize</h3>
            <p className="text-xs text-zinc-450 max-w-xs">
              Decline finger joints below the virtual cyan sensor line to play beautiful polyphonic chords.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-indigo-500/30 flex items-center justify-center font-mono text-base font-bold text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10">
              4
            </div>
            <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase mt-2">Record & Export</h3>
            <p className="text-xs text-zinc-450 max-w-xs">
              Record live streams and export correct standard MIDI (.mid) direct to your download folder.
            </p>
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE DEMO PREVIEW SECTION */}
      <section id="demo" className="max-w-5xl mx-auto px-6 py-20 border-t border-zinc-900 relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono tracking-widest text-fuchsia-400 font-bold uppercase">INTERACTIVE DECK</span>
          <h2 className="font-sans text-3xl sm:text-4xl font-black tracking-tight text-white mt-3">
            Interactive Keys Preview
          </h2>
          <p className="text-zinc-450 mt-3 text-sm leading-relaxed">
            Click or tap the keys below to test the browser synth engine audio instantly right from this page! Or play the auto-sequence.
          </p>
        </div>

        {/* Demo instrument panel */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 md:p-8 backdrop-blur-sm max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-zinc-900 gap-4">
            <div>
              <span className="font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Engine Acoustics</span>
              <div className="flex items-center gap-2 text-xs font-bold text-white mt-0.5">
                <Volume2 className="h-4 w-4 text-cyan-400" />
                <span>CYBER-FM POLYPHONIC SYNTH</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="demo-play-sequence"
                onClick={playDemoSequence}
                disabled={previewPlaying}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold bg-zinc-900 border border-zinc-850 hover:border-cyan-500/30 text-cyan-400 hover:text-white rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-cyan-400" /> Play Auto Melody
              </button>
            </div>
          </div>

          {/* Interactive Keyboard Preview */}
          <div className="relative h-44 bg-zinc-900 rounded-2xl flex border-t-4 border-zinc-950 select-none overflow-hidden pb-1 px-1">
            {demoKeys.map((key) => {
              const active = previewNotes.includes(key.note);
              if (key.isBlack) {
                return null; // Handle black keys positioned absolutely
              }

              // Filter out adjacent blacks to position them cleanly
              const hasSharp = key.note !== 'E4' && key.note !== 'B4' && key.note !== 'C5';
              const sharpNote = key.note.slice(0, 1) + '#' + key.note.slice(1);
              const sharpActive = previewNotes.includes(sharpNote);

              return (
                <div key={key.note} className="flex-1 relative h-full">
                  {/* White Key */}
                  <button
                    onClick={() => handleKeyTrigger(key.note)}
                    className={`w-full h-full border-r border-zinc-950/40 rounded-b-md flex flex-col justify-end pb-3 text-center transition-all ${
                      active 
                        ? 'bg-gradient-to-t from-cyan-400/90 to-cyan-500/20 text-teal-950 translate-y-0.5 shadow-inner' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    <span className="font-mono text-[9px] font-bold tracking-tighter block">{key.label}</span>
                  </button>

                  {/* Black Key */}
                  {hasSharp && (
                    <button
                      onClick={() => handleKeyTrigger(sharpNote)}
                      className={`absolute top-0 right-0 w-7 h-[60%] rounded-b z-20 transition-all ${
                        sharpActive
                          ? 'bg-gradient-to-t from-indigo-400 to-indigo-650 shadow-[0_3px_10px_rgba(99,102,241,0.5)] h-[62%]'
                          : 'bg-zinc-950 border-r border-b border-zinc-900 hover:bg-zinc-900'
                      }`}
                      style={{ marginRight: '-14px' }}
                    >
                      <span className="font-mono text-[7px] text-zinc-500 font-bold block mt-12">#</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-900 relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">KNOWLEDGE INDEX</span>
          <h2 className="font-sans text-3xl sm:text-4xl font-black tracking-tight text-white mt-3">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-sm text-white hover:text-cyan-400 transition cursor-pointer"
              >
                <span>{faq.question}</span>
                <span className="text-cyan-400 font-mono text-[16px]">{activeFaq === i ? '−' : '+'}</span>
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-5 pt-1 text-xs text-zinc-450 leading-relaxed border-t border-zinc-900/60 bg-[#07070a]/40">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer id="landing-footer" className="border-t border-zinc-900 bg-[#050508] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="Aethera Piano"
              className="h-8 w-8 rounded-lg"
            />
            <div>
              <span className="font-mono text-sm font-black tracking-tight text-white uppercase">
                Aethera <span className="text-cyan-400">Piano</span>
              </span>
              <p className="text-[7px] font-mono text-zinc-600 font-bold tracking-widest leading-none">LOCAL WEB INTEL DECK</p>
            </div>
          </div>

          <div className="text-xs font-mono text-zinc-500 text-center md:text-right space-y-1">
            <p>
              Developed by{' '}
              <a
                href="https://itsmohsinali5.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-cyan-400 transition"
              >
                Mohsin Ali
              </a>
            </p>
            <p className="text-[10px] text-zinc-700">
              Hand tracking &amp; audio run locally in your browser
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
