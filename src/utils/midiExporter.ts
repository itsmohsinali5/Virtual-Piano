import { MidiEvent } from '../types';

/**
 * Converts a note string (e.g., "C4", "C#4") to its standard MIDI note number.
 */
export function noteToMidiNumber(note: string): number {
  if (!note) return 60; // middle C fallback

  // Match pitch name (like C, C#, Db) and octave (like 4 or 5)
  const match = note.match(/^([A-G]#?|D[b]?|E[b]?|F#?|G#?|A#?|B[b]?)([0-8])$/i);
  if (!match) {
    // Robust parsing fallback for anything unscheduled
    const cleanNote = note.trim().toUpperCase();
    const octaveMatch = cleanNote.match(/\d+/);
    const octave = octaveMatch ? parseInt(octaveMatch[0], 10) : 4;
    const pitch = cleanNote.replace(/\d+/, '');
    
    const bases: Record<string, number> = {
      'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4,
      'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
    };
    const base = bases[pitch] ?? 0;
    return 12 * (octave + 1) + base;
  }

  let name = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  // Normalize flatted notes to equivalents
  if (name === 'DB') name = 'C#';
  if (name === 'EB') name = 'D#';
  if (name === 'GB') name = 'F#';
  if (name === 'AB') name = 'G#';
  if (name === 'BB') name = 'A#';

  const NOTE_BASE_NUMBERS: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  const base = NOTE_BASE_NUMBERS[name] ?? 0;
  return 12 * (octave + 1) + base;
}

/**
 * Generates a valid standard binary MIDI file (.mid) from a recorded queue
 * of notes and downloads it directly from the browser.
 */
export function exportMidiFile(events: MidiEvent[], fileName = 'virtual-piano.mid') {
  if (events.length === 0) return;

  // Let's create MIDI events
  // We use 480 ticks per quarter note (PPQN).
  // At 120 BPM, there are 2 beats per second.
  // Therefore, ticksPerSecond = 2 beats * 485 = 960 ticks per second.
  const ticksPerSecond = 960; 

  interface FlatEvent {
    tick: number;
    type: 'on' | 'off';
    midiNote: number;
    val: number; // velocity
  }

  const flattened: FlatEvent[] = [];

  events.forEach(evt => {
    const num = noteToMidiNumber(evt.note);
    const startTick = Math.round(evt.time * ticksPerSecond);
    const durSec = evt.duration || 0.5;
    const endTick = startTick + Math.round(durSec * ticksPerSecond);

    const velocityValue = evt.velocity !== undefined ? evt.velocity : 0.8;
    const velocityByte = Math.max(0, Math.min(127, Math.round(velocityValue * 127)));

    flattened.push({
      tick: startTick,
      type: 'on',
      midiNote: num,
      val: velocityByte
    });

    flattened.push({
      tick: endTick,
      type: 'off',
      midiNote: num,
      val: 0
    });
  });

  // Sort chronologically. If ticks are equal, make sure noteOff (off) runs BEFORE noteOn (on)
  // to avoid overlapping note cutoffs in standard synthesizers.
  flattened.sort((a, b) => {
    if (a.tick !== b.tick) {
      return a.tick - b.tick;
    }
    if (a.type === 'off' && b.type === 'on') return -1;
    if (a.type === 'on' && b.type === 'off') return 1;
    return 0;
  });

  // Helper: Variable-length Quantities (VLQ) for MIDI time deltas
  const getVLQBytes = (delta: number): number[] => {
    let value = Math.max(0, Math.round(delta));
    const bytes: number[] = [];
    bytes.push(value & 0x7F);
    while (value > 0x7F) {
      value >>= 7;
      bytes.push((value & 0x7F) | 0x80);
    }
    return bytes.reverse();
  };

  // Format 0 MIDI Header Configuration
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd" label
    0x00, 0x00, 0x00, 0x06, // Chunk size of 6 bytes
    0x00, 0x00,             // Format type (0 = single track)
    0x00, 0x01,             // 1 Track
    0x01, 0xe0              // 480 ticks per quarter note division (0x01E0)
  ];

  // Initialize track data with standard delta 0 tempo configurations
  let trackData: number[] = [
    // 1. Time Signature (4/4): Delta 0, FF 58 04 04 02 18 08
    0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08,
    // 2. Set Tempo (120 BPM = 500,000 microsec/quarter note): Delta 0, FF 51 03 07 A1 20
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20
  ];

  let currentTick = 0;

  flattened.forEach((evt) => {
    const delta = evt.tick - currentTick;
    const actualDelta = Math.max(0, delta);
    currentTick = evt.tick;

    // Delta time in VLQ bytes
    trackData.push(...getVLQBytes(actualDelta));

    // event MIDI status & bytes
    if (evt.type === 'on') {
      trackData.push(0x90); // Note-on (Channel 0)
      trackData.push(evt.midiNote);
      trackData.push(evt.val);
    } else {
      trackData.push(0x80); // Note-off (Channel 0)
      trackData.push(evt.midiNote);
      trackData.push(0x00); // 0 velocity
    }
  });

  // Track end event: Delta 0, FF 2F 00
  trackData.push(0x00); 
  trackData.push(0xff, 0x2f, 0x00); 

  // MTrk Track Header Length calculations
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk" label
    (trackData.length >> 24) & 0xff,
    (trackData.length >> 16) & 0xff,
    (trackData.length >> 8) & 0xff,
    trackData.length & 0xff
  ];

  const fullBytes = new Uint8Array([...header, ...trackHeader, ...trackData]);
  const blob = new Blob([fullBytes], { type: 'audio/midi' });

  // Browser download pipeline execution
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
