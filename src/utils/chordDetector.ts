const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const SEMITONE_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface ChordPattern {
  name: string;
  intervals: number[];
}

// Sorted interval patterns from root (C-relative)
const CHORD_PATTERNS: ChordPattern[] = [
  { name: 'Major', intervals: [4, 7] },
  { name: 'Minor', intervals: [3, 7] },
  { name: 'Dominant 7th', intervals: [4, 7, 10] },
  { name: 'Major 7th', intervals: [4, 7, 11] },
  { name: 'Minor 7th', intervals: [3, 7, 10] },
  { name: 'Suspended 4th', intervals: [5, 7] },
  { name: 'Suspended 2nd', intervals: [2, 7] },
  { name: 'Diminished', intervals: [3, 6] },
  { name: 'Augmented', intervals: [4, 8] },
  { name: 'Minor-Major 7th', intervals: [3, 7, 11] },
  { name: 'Half-Diminished 7th', intervals: [3, 6, 10] },
  { name: 'Diminished 7th', intervals: [3, 6, 9] },
];

/**
 * Parses full MIDI notes (e.g., ['C4', 'E4', 'G4']) and returns detected chord.
 */
export function detectChord(notes: string[]): string {
  if (notes.length < 2) return '';

  // Get note base names and remove octave e.g. "C4" -> "C", "C#4" -> "C#"
  const cleanNotes = notes.map(note => {
    return note.replace(/[0-9]/g, '');
  });

  // Unique notes represented as pitch classes (0-11)
  const pitchClasses = Array.from(new Set(
    cleanNotes.map(n => NOTE_SEMITONES[n]).filter((v): v is number => v !== undefined)
  ));

  if (pitchClasses.length < 2) return '';

  // Try each note in the chord as the root
  for (const root of pitchClasses) {
    // Generate scale intervals relative to this root (modulo 12)
    const relativeIntervals = pitchClasses
      .map(p => (p - root + 12) % 12)
      .filter(p => p !== 0) // exclude root itself (interval 0)
      .sort((a, b) => a - b);

    // Search patterns matching these intervals
    for (const pattern of CHORD_PATTERNS) {
      if (arraysEqual(relativeIntervals, pattern.intervals)) {
        const rootName = SEMITONE_NOTES[root];
        return `${rootName} ${pattern.name}`;
      }
    }
  }

  // Fallback: simple combination of root and intervals
  const sortedPitches = [...pitchClasses].sort((a, b) => a - b);
  const rootNoteName = SEMITONE_NOTES[sortedPitches[0]];
  return `${rootNoteName} chord (Polyph.)`;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
