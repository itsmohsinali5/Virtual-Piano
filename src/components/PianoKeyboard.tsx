import { PianoKey } from '../types';
import { getKeyboardLayout } from '../utils/keyboardLayout';

interface PianoKeyboardProps {
  layout: PianoKey[];
  activeNotes: Set<string>;
  onPlayNote: (note: string) => void;
  onStopNote: (note: string) => void;
}

export default function PianoKeyboard({
  layout,
  activeNotes,
  onPlayNote,
  onStopNote,
}: PianoKeyboardProps) {
  // Categorize keys to render black keys after (above) white keys to handle overlay correct z-indexing
  const whiteKeys = layout.filter(k => k.type === 'white');
  const blackKeys = layout.filter(k => k.type === 'black');

  const handleMouseDown = (note: string) => {
    onPlayNote(note);
  };

  const handleMouseUp = (note: string) => {
    onStopNote(note);
  };

  const handleMouseLeave = (note: string) => {
    if (activeNotes.has(note)) {
      onStopNote(note);
    }
  };

  const getCleanLabel = (note: string) => {
    // Return letter name only for a subset of white keys to keep visual minimal beauty
    // (e.g. show C note markers, D, etc.)
    const matchesOctave = note.match(/([A-G]#?)([0-8])/);
    if (!matchesOctave) return '';
    const pitch = matchesOctave[1];
    const octave = matchesOctave[2];

    // Highlight Cs to make it easy to orient
    if (pitch === 'C') {
      return `C${octave}`;
    }
    return pitch;
  };

  return (
    <div 
      id="piano-keyboard-container" 
      className="relative w-full border border-zinc-850 bg-zinc-950 p-2 md:p-4 rounded-2xl select-none"
    >
      <div 
        id="piano-keys-frame" 
        className="relative w-full h-44 md:h-56 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900"
      >
        {/* Render White Keys first */}
        <div id="white-keys-group" className="absolute inset-0 flex">
          {whiteKeys.map((key) => {
            const isPressed = activeNotes.has(key.note);
            return (
              <button
                key={key.note}
                id={`key-${key.note}`}
                onMouseDown={() => handleMouseDown(key.note)}
                onMouseUp={() => handleMouseUp(key.note)}
                onMouseLeave={() => handleMouseLeave(key.note)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleMouseDown(key.note);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleMouseUp(key.note);
                }}
                style={{
                  left: `${key.leftPercent}%`,
                  width: `${key.widthPercent}%`,
                }}
                className={`absolute top-0 bottom-0 border-r border-zinc-900/60 transition-all duration-100 flex flex-col justify-end items-center pb-3 text-[9px] md:text-xs font-mono select-none outline-none ${
                  isPressed
                    ? 'bg-gradient-to-b from-cyan-950/40 to-cyan-500/80 text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.7)] border-t-2 border-t-cyan-400 font-bold z-10 scale-y-[0.98]'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650 active:bg-zinc-300'
                }`}
              >
                <span className={`block transition ${isPressed ? 'font-bold scale-110 text-zinc-950' : ''}`}>
                  {getCleanLabel(key.note)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Render Black Keys overlayed on top */}
        <div id="black-keys-group" className="absolute inset-0 pointer-events-none">
          {blackKeys.map((key) => {
            const isPressed = activeNotes.has(key.note);
            return (
              <button
                key={key.note}
                id={`key-${key.note}`}
                // Re-enable pointer events for the absolute buttons so they can be clicked
                style={{
                  left: `${key.leftPercent}%`,
                  width: `${key.widthPercent}%`,
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(key.note);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  handleMouseUp(key.note);
                }}
                onMouseLeave={() => handleMouseLeave(key.note)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMouseDown(key.note);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMouseUp(key.note);
                }}
                className={`absolute top-0 h-[60%] rounded-b transition-all duration-100 flex flex-col justify-end items-center pb-2 text-[8px] font-mono select-none outline-none z-20 ${
                  isPressed
                    ? 'bg-gradient-to-b from-indigo-950 to-indigo-500/90 text-zinc-100 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)] scale-y-[0.98]'
                    : 'bg-zinc-900 border-l border-r border-b border-zinc-800 text-zinc-500 hover:bg-zinc-850 active:bg-zinc-800'
                }`}
              >
                <span className={`block scale-90 ${isPressed ? 'text-white font-bold' : ''}`}>
                  {key.note.replace(/[0-9]/g, '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Keyboard decorative outline line */}
      <div className="flex justify-between items-center px-4 mt-2 font-mono text-[9px] text-zinc-650">
        <span>◀ LOW OCTAVE</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Active White Key</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Active Black Key</span>
        </div>
        <span>HIGH OCTAVE ▶</span>
      </div>
    </div>
  );
}
