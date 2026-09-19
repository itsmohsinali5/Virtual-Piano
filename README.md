# Virtual Piano

**Aethera Piano** is a browser-based virtual instrument that lets you play piano with your hands — using only a webcam. Real-time hand tracking maps your fingertips to keys, Tone.js synthesizes the sound, and you can record performances and export them as standard MIDI files.

Everything runs locally in the browser. No account, no cloud API key, and no video leaves your machine.

---

## Features

- **Webcam hand tracking** — MediaPipe Hands tracks fingertip positions in real time (up to two hands)
- **Polyphonic play** — Trigger multiple notes and chords with finger collisions against a virtual keyboard overlay
- **Gesture sustain** — Close a hand into a fist to engage sustain; open the palm to release
- **Built-in synthesis** — Three Tone.js engines (Cyber FM, Cosmic Saw, Glowing Ambient) with reverb and delay
- **Live chord detection** — Identifies common chord types from currently held notes
- **MIDI record & export** — Capture a performance, play it back in-app, and download a Format 0 `.mid` file
- **Clickable piano deck** — Play with mouse/touch when the camera is off or unavailable
- **Onboarding tutorial** — Guided camera permission and controls walkthrough for first-time users
- **Privacy-first** — Vision and audio processing stay on-device

## Demo

Run the app locally (see [Getting Started](#getting-started)), then open `http://localhost:3000`.

> A hosted live demo URL can be added here once you deploy the project (for example on Vercel or GitHub Pages).

## Screenshots

Screenshots are not included in this repository yet. Contributions that add clear UI captures of the landing page and piano workspace are welcome.

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Build | Vite 6 |
| Audio | Tone.js |
| Vision | MediaPipe Hands (loaded from jsDelivr CDN) |
| Icons | Lucide React |

## How It Works

1. The browser requests camera access and streams video into a MediaPipe Hands pipeline.
2. Finger tip landmarks are mapped onto a virtual keyboard layout overlaid on the camera feed.
3. When a fingertip crosses the trigger region for a key, the audio engine plays that note via Tone.js.
4. A closed-fist gesture can latch sustain; opening the hand releases it.
5. Optionally, note events are recorded and exported as a MIDI file for use in a DAW.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- A modern browser with webcam support (Chrome, Edge, or Firefox recommended)
- Webcam permission when prompted

### Installation

```bash
git clone https://github.com/itsmohsinali5/virtual-piano.git
cd virtual-piano
npm install
```

> If you prefer Yarn or pnpm, those work too — use one lockfile consistently for the team.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run preview
```

### Type Check

```bash
npm run lint
```

No environment variables or API keys are required for local development.

## Project Structure

```text
virtual-piano/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── metadata.json
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── src/
    ├── main.tsx                 # App entry
    ├── App.tsx                  # Landing ↔ piano workspace routing & state
    ├── index.css                # Global styles
    ├── types.ts                 # Shared TypeScript types
    ├── components/
    │   ├── LandingPage.tsx      # Marketing / intro page
    │   ├── Onboarding.tsx       # First-run tutorial & camera permission
    │   ├── WebcamSection.tsx    # Camera feed + hand tracking overlay
    │   ├── PianoKeyboard.tsx    # Bottom interactive piano deck
    │   ├── LeftPanel.tsx        # Notes log, chord, tracking status
    │   ├── RightPanel.tsx       # MIDI record / playback / export
    │   └── SettingsPanel.tsx    # Synth, effects, tracking options
    └── utils/
        ├── audioEngine.ts       # Tone.js synths & effects
        ├── mediaPipeLoader.ts   # Dynamic MediaPipe script loading
        ├── keyboardLayout.ts    # Key geometry (C4–F6 range)
        ├── chordDetector.ts     # Chord name detection
        └── midiExporter.ts      # MIDI Format 0 writer
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and guidelines.

Quick path:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-idea`)
3. Make your changes
4. Test locally (`npm run lint` and `npm run build`)
5. Commit with a clear message
6. Open a Pull Request

### Welcome contribution areas

- Bug fixes
- UI/UX polish
- Accessibility improvements
- Mobile / responsive improvements
- New piano features (layouts, gestures, synths)
- Performance improvements
- Documentation
- Browser compatibility fixes

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Guidelines

- Prefer small, focused pull requests over large mixed changes.
- Match existing TypeScript, React, and Tailwind patterns in the codebase.
- Do not add remote AI/API dependencies for core play functionality — tracking and audio should remain browser-local unless a feature explicitly needs a backend.
- Keep camera/privacy messaging accurate: video is processed on-device.
- Run `npm run lint` and `npm run build` before opening a PR.

## Roadmap

Ideas under consideration (not commitments):

- [ ] Hosted demo deployment + README screenshots
- [ ] Additional keyboard ranges / octave shift controls
- [ ] Improved mobile layout for the piano workspace
- [ ] Optional computer-keyboard shortcuts for notes
- [ ] Accessibility pass (keyboard navigation, ARIA, reduced-motion)
- [ ] Unit tests for chord detection and MIDI export utilities

## License

No license file is currently included in this repository. All rights are reserved by the author unless a license is added later.

If you want others to use, modify, or redistribute this project under open-source terms, choose and add a license (for example MIT or Apache-2.0) before treating the repo as open source.

## Author

**Mohsin Ali**  
Senior Software Engineer

- Portfolio: [https://itsmohsinali5.vercel.app](https://itsmohsinali5.vercel.app)
- LinkedIn: [https://www.linkedin.com/in/itsmohsinali5](https://www.linkedin.com/in/itsmohsinali5)
- GitHub: [https://github.com/itsmohsinali5](https://github.com/itsmohsinali5)
- Email: [itsmohsinali5@gmail.com](mailto:itsmohsinali5@gmail.com)
