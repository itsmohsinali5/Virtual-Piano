import { InstrumentSettings } from '../types';
import { Sliders, Sparkles, Volume2 } from 'lucide-react';

interface SettingsPanelProps {
  settings: InstrumentSettings;
  onUpdateSettings: (settings: Partial<InstrumentSettings>) => void;
}

export default function SettingsPanel({ settings, onUpdateSettings }: SettingsPanelProps) {
  return (
    <div 
      id="settings-panel" 
      className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 backdrop-blur-md transition-colors"
    >
      <h3 className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-cyan-400 uppercase mb-4">
        <Sliders className="h-4 w-4" /> Instrument Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Synth Engine Selection */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">
            SYNTH ENGINE
          </label>
          <div className="flex flex-col gap-1.5">
            {[
              { id: 'cyber-fm', label: '🦾 Cyber FM (Crisp Pin)', desc: 'FM digital chime' },
              { id: 'cosmic-synth', label: '🚀 Cosmic Saw (Rez Sweep)', desc: 'Warm filter pluck' },
              { id: 'glowing-ambient', label: '🌸 Glowing Glow (Pad)', desc: 'Lush slow attack' }
            ].map((syn) => (
              <button
                key={syn.id}
                id={`synth-select-${syn.id}`}
                onClick={() => onUpdateSettings({ synthType: syn.id as any })}
                className={`w-full flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${
                  settings.synthType === syn.id
                    ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'border-zinc-855 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-semibold">{syn.label}</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">{syn.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spatial Acoustics Controls */}
        <div className="space-y-4">
          <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">
            ACOUSTICS LAYER
          </label>
          
          {/* Reverb wetness slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Reverb Wet</span>
              <span className="font-mono text-cyan-400">{(settings.reverbWet * 100).toFixed(0)}%</span>
            </div>
            <input 
              id="reverb-slider"
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={settings.reverbWet}
              onChange={(e) => onUpdateSettings({ reverbWet: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Delay wetness slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Echoplex Delay</span>
              <span className="font-mono text-cyan-400">{(settings.delayWet * 100).toFixed(0)}%</span>
            </div>
            <input 
              id="delay-slider"
              type="range" 
              min="0" 
              max="0.8" 
              step="0.05"
              value={settings.delayWet}
              onChange={(e) => onUpdateSettings({ delayWet: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Hand Sensitivity Controls */}
        <div className="space-y-4">
          <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">
            TRACKER INTERPOLATION
          </label>

          {/* Jitter Smoothing slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Finger Jitter Smoothing</span>
              <span className="font-mono text-cyan-400">{(settings.smoothing * 100).toFixed(0)}%</span>
            </div>
            <input 
              id="smoothing-slider"
              type="range" 
              min="0" 
              max="0.9" 
              step="0.05"
              value={settings.smoothing}
              onChange={(e) => onUpdateSettings({ smoothing: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Touch Trigger Threshold (vertical collision constraint) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Key Strike Vertical Threshold</span>
              <span className="font-mono text-cyan-400">{(settings.sensitivity * 100).toFixed(0)}%</span>
            </div>
            <input 
              id="sensitivity-slider"
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05"
              value={settings.sensitivity}
              onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Sound & Aesthetics Switch */}
        <div className="space-y-4">
          <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">
            VOLUME & DISPLAY
          </label>

          {/* Master volume control */}
          <div className="space-y-1.5 flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-zinc-500 select-none shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">Synth Master</span>
                <span className="font-mono text-cyan-400">{settings.volume === 0 ? 'MUTE' : `${settings.volume}%`}</span>
              </div>
              <input 
                id="volume-slider"
                type="range" 
                min="0" 
                max="100" 
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ volume: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Particles ON/OFF switch */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-850/65 bg-zinc-900/10 px-3.5 py-1.5">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-455" /> Radiant Particle Trails
            </span>
            <button
              id="particles-toggle"
              onClick={() => onUpdateSettings({ particlesEnabled: !settings.particlesEnabled })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.particlesEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950/90 shadow ring-0 transition duration-200 ease-in-out ${
                  settings.particlesEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Gesture Sustain ON/OFF switch */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-850/65 bg-zinc-900/10 px-3.5 py-1.5">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              ✊ <span className="ml-0.5">Gesture Sustain Lock</span>
            </span>
            <button
              id="gesture-sustain-toggle"
              onClick={() => onUpdateSettings({ gestureSustainEnabled: !settings.gestureSustainEnabled })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.gestureSustainEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950/90 shadow ring-0 transition duration-200 ease-in-out ${
                  settings.gestureSustainEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
