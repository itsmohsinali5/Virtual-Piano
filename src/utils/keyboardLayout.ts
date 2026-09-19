import { PianoKey } from '../types';

export const WHITE_NOTES = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  'C6', 'D6', 'E6', 'F6'
];

export const BLACK_NOTES_MAP: Record<string, string> = {
  'C4': 'C#4',
  'D4': 'D#4',
  'F4': 'F#4',
  'G4': 'G#4',
  'A4': 'A#4',
  'C5': 'C#5',
  'D5': 'D#5',
  'F5': 'F#5',
  'G5': 'G#5',
  'A5': 'A#5',
  'C6': 'C#6',
  'D6': 'D#6',
};

export function getKeyboardLayout(): PianoKey[] {
  const keys: PianoKey[] = [];
  const totalWhite = WHITE_NOTES.length;
  const whiteWidth = 100 / totalWhite;

  // Add white keys first
  WHITE_NOTES.forEach((note, index) => {
    keys.push({
      note,
      type: 'white',
      leftPercent: index * whiteWidth,
      widthPercent: whiteWidth
    });
  });

  // Add black keys overlay
  WHITE_NOTES.forEach((note, index) => {
    const blackNoteName = BLACK_NOTES_MAP[note];
    if (blackNoteName) {
      // Position the black key on the boundary of this white key and the next
      const currentWhiteLeft = index * whiteWidth;
      // Width is roughly 60% of white key width
      const blackWidth = whiteWidth * 0.6;
      const leftOffset = currentWhiteLeft + whiteWidth - (blackWidth / 2);

      keys.push({
        note: blackNoteName,
        type: 'black',
        leftPercent: leftOffset,
        widthPercent: blackWidth
      });
    }
  });

  return keys;
}
