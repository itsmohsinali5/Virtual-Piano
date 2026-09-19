import { DetectedNote } from '../types';
import { Sparkles, Activity, ShieldCheck, HelpCircle, RotateCcw } from 'lucide-react';

interface LeftPanelProps {
  detectedNotes: DetectedNote[];
  currentChord: string;
  sustainActive: boolean;
  trackingFPS: number;
  handsCount: number;
  triggerTutorial: () => void;
  onPanicReset: () => void;
}

export default function LeftPanel({
  detectedNotes,
  currentChord,
  sustainActive,
  trackingFPS,
  handsCount,
  triggerTutorial,
  onPanicReset,
}: LeftPanelProps) {
  return (
    <div 
      id="left-panel" 
      className="flex flex-col gap-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 backdrop-blur-md lg:col-span-3 transition-colors"
    >
      {/* Hand Status Stats Card */}
      <div className="space-y-3.5">
        <h3 className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
          <Activity className="h-3 w-3" /> AI Tracker Status
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-2.5">
            <div className="text-[10px] font-mono text-zinc-500">ENGINE RATE</div>
            <div className="text-lg font-mono font-bold text-white tracking-tight">
              {trackingFPS > 0 ? `${trackingFPS} FPS` : 'OFFLINE'}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-2.5">
            <div className="text-[10px] font-mono text-zinc-500">ACTIVE HANDS</div>
            <div className="text-lg font-mono font-bold text-white tracking-tight">
              {handsCount} / 2
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-900/20 px-3 py-2 text-xs">
          <span className="text-zinc-400">Tracking Confidence</span>
          <span className="flex items-center gap-1 font-mono font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> High
          </span>
        </div>
      </div>

      {/* Sustain Status Indicator */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono text-[10px] font-semibold text-zinc-400 tracking-wider">GESTURE SUSTAIN</span>
          <span className={`inline-block h-2 w-2 rounded-full ${sustainActive ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-zinc-700'}`} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sustainActive ? '✊' : '✋'}</span>
            <div>
              <div className={`text-xs font-bold leading-none ${sustainActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
                {sustainActive ? 'SUSTAIN LOCKED' : 'SUSTAIN OFF'}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                {sustainActive ? 'Ball fist ✊ to hold sustain' : 'Close hand into fist ✊ to hold'}
              </div>
            </div>
          </div>
          {sustainActive && (
            <button
              onClick={onPanicReset}
              className="px-2 py-1 flex items-center gap-1 rounded bg-red-950/20 border border-red-500/30 text-[10px] font-mono font-bold text-red-500 hover:bg-red-900/20 hover:text-white hover:border-red-500 transition cursor-pointer"
              title="Release active sustain"
            >
              <RotateCcw className="h-3 w-3" /> Clear Hold
            </button>
          )}
        </div>
      </div>

      {/* Real-time Harmony Analyzer */}
      <div className="h-[120px] lg:h-auto lg:flex-1 flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-3.5">
        <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wider text-zinc-400 uppercase mb-3">
          <Sparkles className="h-3 w-3 text-cyan-400" /> Live AI Harmony
        </h3>

        {currentChord ? (
          <div className="flex flex-col items-center justify-center py-4 rounded-lg bg-cyan-950/20 border border-cyan-500/20 animate-pulse text-center">
            <div className="text-[10px] font-mono text-cyan-500 tracking-widest font-semibold uppercase">DETECTED CHORD</div>
            <div className="text-2xl font-bold font-sans text-cyan-400 tracking-tight mt-1 px-3">
              {currentChord}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-zinc-800/50 text-center py-4">
            <p className="text-[11px] text-zinc-600 max-w-[130px] leading-relaxed">
              Play multiple keys concurrently with fingers to detect harmonies
            </p>
          </div>
        )}
      </div>

      {/* Active Note Tracking */}
      <div className="flex flex-col h-[180px] rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-3.5 overflow-hidden">
        <h3 className="font-mono text-[10px] font-semibold tracking-wider text-zinc-400 uppercase mb-2">
          Note Logger ({detectedNotes.length})
        </h3>
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 custom-scrollbar">
          {detectedNotes.length > 0 ? (
            detectedNotes.map((evt, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between rounded-lg bg-zinc-900/40 border border-zinc-850 px-2.5 py-1.5 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{evt.note}</span>
                  <span className="text-[10px] text-zinc-500">by {evt.hand}</span>
                </div>
                <div className="font-mono text-[10px] text-cyan-500/80 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-900/30">
                  {evt.finger}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <span className="text-[10px] text-zinc-650 font-mono">NO ACTIVE PRESSES</span>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Hint / Instructions Toggle */}
      <button 
        id="trigger-onboarding-btn"
        onClick={triggerTutorial} 
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white transition"
      >
        <HelpCircle className="h-4 w-4" /> Replay Tutorial
      </button>
    </div>
  );
}
