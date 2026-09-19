# Contributing to Virtual Piano

Thanks for your interest in improving **Aethera Piano** (Virtual Piano). This document explains how to contribute in a way that keeps the project maintainable and easy to review.

## Ways to contribute

- Bug fixes
- UI/UX improvements
- Accessibility improvements
- Mobile / responsive improvements
- New piano features (synths, gestures, layouts, recording)
- Performance improvements
- Documentation updates
- Browser compatibility fixes

## Before you start

1. Check existing [issues](https://github.com/itsmohsinali5/virtual-piano/issues) and pull requests to avoid duplicate work.
2. For larger features, open an issue first so maintainers can give feedback early.
3. Keep hand tracking and audio processing browser-local unless a change clearly needs a backend.

## Development setup

```bash
git clone https://github.com/itsmohsinali5/virtual-piano.git
cd virtual-piano
npm install
npm run dev
```

Useful commands:

```bash
npm run lint    # TypeScript check
npm run build   # Production build
npm run preview # Preview the production build
```

## Pull request workflow

1. **Fork** the repository
2. **Create a branch** from `main`  
   `git checkout -b feature/short-description`
3. **Make your changes** — keep the diff focused on one concern
4. **Test your changes**
   - Manual: camera on/off, hand play, fist sustain, MIDI record/export, mouse piano
   - Automated: `npm run lint` and `npm run build`
5. **Commit** with a clear message (what / why, not a file dump)
6. **Open a Pull Request** against `main` and describe:
   - What changed
   - Why it changed
   - How you tested it
   - Screenshots or a short clip for UI changes (if possible)

## Coding guidelines

- Prefer TypeScript types already defined in `src/types.ts` when extending shared models.
- Follow existing component structure under `src/components/` and utilities under `src/utils/`.
- Avoid introducing unused dependencies.
- Do not commit secrets, `.env` files with credentials, or build artifacts (`dist/`, `node_modules/`).
- Do not add personal branding beyond the existing attribution footer.

## Reporting bugs

Please include:

- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Whether camera permission was granted

## Code of Conduct

Participation is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive.

## Questions

Open an issue, or contact the maintainer:

- Mohsin Ali — [itsmohsinali5@gmail.com](mailto:itsmohsinali5@gmail.com)
- Portfolio: [https://itsmohsinali5.vercel.app](https://itsmohsinali5.vercel.app)
