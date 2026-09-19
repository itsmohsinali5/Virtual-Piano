import { useState, useRef, useEffect } from 'react';
import { MidiEvent } from '../types';
import { Download, Play, Square, Circle, Trash2, ListMusic, Volume2 } from 'lucide-react';
import { exportMidiFile } from '../utils/midiExporter';
import { audioEngine } from '../utils/audioEngine';

interface RightPanelProps {
  recordingQueue: MidiEvent[];
  isRecording: boolean;
  onClearRecording: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  // Let's pass a function to trigger a visual keypress when replaying notes
  onReplayNoteTrigger: (note: string, velocity: number) => void;
}

export default function RightPanel({
  recordingQueue,
  isRecording,
  onClearRecording,
  onStartRecording,
  onStopRecording,
  onReplayNoteTrigger
}: RightPanelProps) {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playbackTimers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Cleanup playback timers on unmount
    return () => {
      playbackTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleExport = () => {
    exportMidiFile(recordingQueue, 'virtual-piano-performance.mid');
  };

  const handleStartPlayback = () => {
    if (recordingQueue.length === 0) return;
    setIsPlayingBack(true);

    // Cancel any active releases
    audioEngine.releaseAll();
    
    // Schedule all Note On and Note Off events relative to playback start
    recordingQueue.forEach((event) => {
      // note starts playing
      const startTimer = setTimeout(() => {
        audioEngine.playNote(event.note, event.velocity);
        onReplayNoteTrigger(event.note, event.velocity);
      }, event.time * 1000);

      playbackTimers.current.push(startTimer);

      // note stops playing
      if (event.duration) {
        const stopTimer = setTimeout(() => {
          audioEngine.stopNote(event.note);
        }, (event.time + event.duration) * 1000);

        playbackTimers.current.push(stopTimer);
      }
    });

    // Calculate maximum duration of performance to stop playing
    const lastEvent = recordingQueue.reduce((max, evt) => {
      const completionTime = evt.time + (evt.duration || 0.5);
      return completionTime > max ? completionTime : max;
    }, 0);

    const endTimer = setTimeout(() => {
      setIsPlayingBack(false);
      playbackTimers.current = [];
    }, (lastEvent + 1) * 1000);

    playbackTimers.current.push(endTimer);
  };

  const handleStopPlayback = () => {
    playbackTimers.current.forEach(clearTimeout);
    playbackTimers.current = [];
    audioEngine.releaseAll();
    setIsPlayingBack(false);
  };

  return (
    <div 
      id="right-panel" 
      className="flex flex-col gap-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 backdrop-blur-md lg:col-span-3 transition-colors"
    >
      {/* Recording Studio Unit */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
          <ListMusic className="h-3.5 w-3.5" /> MIDI Studio Recorder
        </h3>

        <div className="flex flex-col gap-2.5">
          {/* Main Record Switch */}
          {!isRecording ? (
            <button 
              id="start-rec-btn"
              onClick={onStartRecording}
              disabled={isPlayingBack}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 py-3 text-sm font-semibold text-rose-450 hover:bg-rose-500 hover:text-zinc-950 disabled:opacity-30 disabled:pointer-events-none shadow-[inset_0_1px_rgba(255,255,255,0.05)] shadow-rose-950/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all duration-300"
            >
              <Circle className="h-4 w-4 fill-rose-500 group-hover:fill-zinc-950 transition-colors animate-pulse" /> Record Improvisation
            </button>
          ) : (
            <button 
              id="stop-rec-btn"
              onClick={onStopRecording}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-zinc-200 transition"
            >
              <Square className="h-4 w-4 fill-zinc-950" /> Stop Recording
            </button>
          )}

          {/* Quick status bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-900 text-xs">
            <span className="text-zinc-500 font-mono">STATUS:</span>
            {isRecording ? (
              <span className="flex items-center gap-1.5 font-mono font-bold text-rose-400 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> REC ON AIR
              </span>
            ) : isPlayingBack ? (
              <span className="flex items-center gap-1.5 font-mono font-bold text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> REPLAYING
              </span>
            ) : (
              <span className="font-mono text-zinc-400">IDLE</span>
            )}
          </div>
        </div>
      </div>

      {/* Sequence List HUD */}
      <div className="h-[210px] lg:h-auto lg:flex-1 flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-3.5 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            Recorded Tracks ({recordingQueue.length})
          </span>
          {recordingQueue.length > 0 && !isRecording && !isPlayingBack && (
            <button 
              id="clear-recording-btn"
              onClick={onClearRecording}
              className="text-zinc-500 hover:text-zinc-350 p-1 transition"
              title="Wipe recording session"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 custom-scrollbar">
          {recordingQueue.length > 0 ? (
            recordingQueue.slice().reverse().map((evt, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between rounded-lg bg-zinc-900/50 border border-zinc-850 px-2.5 py-1.5 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400">{evt.note}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">velocity: {(evt.velocity * 100).toFixed(0)}%</span>
                </div>
                <div className="font-mono text-[10px] text-zinc-400">
                  +{evt.time.toFixed(2)}s
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <span className="text-xl opacity-30">🎹</span>
              <p className="text-[10px] text-zinc-600 max-w-[150px] leading-relaxed mt-1">
                Your performance will populate this timeline automatically as you play
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls & MIDI Exporters */}
      {recordingQueue.length > 0 && !isRecording && (
        <div className="space-y-2 mt-auto">
          {/* Replay session */}
          {!isPlayingBack ? (
            <button 
              id="play-rec-btn"
              onClick={handleStartPlayback}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/20 py-2.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500 hover:text-zinc-950 transition duration-250"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Playback Session
            </button>
          ) : (
            <button 
              id="stop-play-btn"
              onClick={handleStopPlayback}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 transition"
            >
              <Square className="h-3.5 w-3.5" /> Stop Playback
            </button>
          )}

          {/* Core Export button */}
          <button 
            id="export-rec-btn"
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-2.5 text-xs font-bold text-zinc-950 shadow-[0_4px_15px_rgba(34,211,238,0.2)] hover:bg-cyan-300 transition duration-250"
          >
            <Download className="h-3.5 w-3.5" /> Export Binary MIDI (.mid)
          </button>
        </div>
      )}
    </div>
  );
}
