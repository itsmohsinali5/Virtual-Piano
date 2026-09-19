import { useState } from 'react';
import { Camera, Hand, Music, Play, Sparkles, X, ChevronRight, ChevronLeft, Volume2, Loader2, AlertCircle } from 'lucide-react';

interface OnboardingProps {
  onStart: () => void;
  onClose: () => void;
}

export default function Onboarding({ onStart, onClose }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [askingPermission, setAskingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onStart();
    }
  };

  const handleNextClick = async () => {
    if (currentStep === 1) {
      setPermissionError(null);
      let alreadyGranted = false;
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'camera' as any });
          if (status.state === 'granted') {
            alreadyGranted = true;
          }
        }
      } catch (e) {
        console.warn('Permissions API query failed:', e);
      }

      if (!alreadyGranted) {
        setAskingPermission(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          nextStep();
        } catch (err: any) {
          console.error('Camera authorization failed:', err);
          setPermissionError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera permissions in your browser address bar/settings, or click "Proceed Anyway".'
              : 'Webcam not detected. Please connect a dynamic camera device, or click "Proceed Anyway" to operate in keys-only mode.'
          );
        } finally {
          setAskingPermission(false);
        }
        return;
      }
    }

    nextStep();
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div id="onboarding-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-md px-4">
      <div 
        id="onboarding-card" 
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-zinc-900/60 p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl md:p-12"
      >
        {/* Dynamic Glow background */}
        <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <button 
          id="close-onboarding"
          onClick={onClose} 
          className="absolute top-6 right-6 rounded-full border border-zinc-700/50 bg-zinc-800/40 p-2 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-400 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === currentStep 
                  ? 'w-8 bg-cyan-400' 
                  : i + 1 < currentStep 
                  ? 'w-4 bg-cyan-600/50' 
                  : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[300px] flex flex-col justify-between">
          <div>
            {currentStep === 1 && (
              <div id="step-1" className="space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-pulse">
                  <Camera className="h-10 w-10" />
                </div>
                <h2 className="font-sans text-3xl font-bold tracking-tight text-white">
                  Step 1: Allow Camera Access
                </h2>
                <p className="mx-auto max-w-md text-zinc-400 leading-relaxed text-sm">
                  We need webcam permissions to track your hands locally inside your browser. Your video stream is calculated in real-time and <span className="text-cyan-400 font-medium">never uploaded</span> or saved to any server.
                </p>

                {permissionError && (
                  <div className="mx-auto max-w-md p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex flex-col items-center gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      Action Required
                    </span>
                    <p className="text-center">{permissionError}</p>
                    <button
                      id="bypass-permission"
                      type="button"
                      onClick={() => {
                        setPermissionError(null);
                        nextStep();
                      }}
                      className="mt-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 font-semibold text-cyan-400 rounded-lg text-[10px] uppercase tracking-wider transition"
                    >
                      Proceed Anyway (Keys Only)
                    </button>
                  </div>
                )}

                <div className="mx-auto max-w-xs p-3 rounded-lg bg-zinc-850/40 border border-zinc-800 text-xs text-zinc-500">
                  ⚡ Recommended: Good lighting ensures high quality, precise tracking.
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div id="step-2" className="space-y-6 text-center">
                <div className="relative mx-auto flex h-24 w-36 items-center justify-center rounded-2xl bg-zinc-850/50 border border-zinc-800">
                  {/* Mock skeleton line representing hands */}
                  <svg className="absolute inset-0 w-full h-full p-2 text-cyan-400/40" viewBox="0 0 100 60">
                    <path d="M50,55 L45,40 L35,25 M45,40 L45,20 M45,40 L55,22 M50,55 L58,38 L68,26" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="35" cy="25" r="3" className="fill-cyan-400 animate-ping" />
                    <circle cx="45" cy="20" r="3" className="fill-indigo-400 animate-ping" />
                    <circle cx="55" cy="22" r="3" className="fill-fuchsia-400 animate-ping" />
                    <circle cx="68" cy="26" r="3" className="fill-pink-400 animate-ping" />
                  </svg>
                  <Hand className="h-8 w-8 text-cyan-400 relative z-10" />
                </div>
                <h2 className="font-sans text-3xl font-bold tracking-tight text-white">
                  Step 2: Position Your Hands
                </h2>
                <p className="mx-auto max-w-md text-zinc-400 leading-relaxed text-sm">
                  Put your hands in front of your camera. Our AI will automatically render a glowing skeletal trail tracking your joints and fingertips instant-by-instant.
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div id="step-3" className="space-y-6 text-center">
                <div className="mx-auto flex h-20 w-32 flex-col justify-end gap-1 p-2 rounded-xl bg-zinc-850/50 border border-zinc-800 overflow-hidden">
                  <div className="flex gap-1.5 justify-center w-full">
                    <span className="h-10 w-4 bg-zinc-800 rounded-t-sm" />
                    <span className="h-10 w-4 bg-cyan-500/90 rounded-t-sm shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse" />
                    <span className="h-10 w-4 bg-zinc-800 rounded-t-sm" />
                    <span className="h-10 w-4 bg-zinc-700/40 rounded-t-sm" />
                    <span className="h-10 w-4 bg-zinc-850 rounded-t-sm border border-zinc-700" />
                  </div>
                </div>
                <h2 className="font-sans text-3xl font-bold tracking-tight text-white">
                  Step 3: Play Piano Notes
                </h2>
                <p className="mx-auto max-w-md text-zinc-400 leading-relaxed text-sm">
                  When your virtual fingertips descend and collide with the virtual keys shown at the bottom of the screen, the synthesizer triggers notes instantly. Play with light tap gestures!
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div id="step-4" className="space-y-6 text-center">
                <div className="mx-auto flex h-20 w-40 items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/40 text-xs font-mono text-cyan-400 animate-pulse">C Major</span>
                  <span className="text-zinc-500">+</span>
                  <span className="px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-950/40 text-xs font-mono text-indigo-400">Polyphonic Chords</span>
                </div>
                <h2 className="font-sans text-3xl font-bold tracking-tight text-white">
                  Step 4: Play Chords
                </h2>
                <p className="mx-auto max-w-md text-zinc-400 leading-relaxed text-sm">
                  The app supports multi-touch, full polyphony! You can touch multiple keys concurrently with both hands to play gorgeous harmonized chords. It even recognizes the chord you are playing in real-time!
                </p>
              </div>
            )}

            {currentStep === 5 && (
              <div id="step-5" className="space-y-6 text-center">
                <div className="flex justify-center gap-8 text-center mx-auto max-w-xs">
                  <div className="space-y-2">
                    <span className="text-2xl">✊</span>
                    <div className="text-xs font-mono text-zinc-400">Fist Hand</div>
                    <div className="text-[10px] text-cyan-400 font-bold">SUSTAIN ON</div>
                  </div>
                  <div className="h-12 w-px bg-zinc-800" />
                  <div className="space-y-2">
                    <span className="text-2xl">✋</span>
                    <div className="text-xs font-mono text-zinc-400">Open Hand</div>
                    <div className="text-[10px] text-zinc-500">SUSTAIN OFF</div>
                  </div>
                </div>
                <h2 className="font-sans text-3xl font-bold tracking-tight text-white">
                  Step 5: Hand Gesture Tricks
                </h2>
                <p className="mx-auto max-w-md text-zinc-400 leading-relaxed text-sm">
                  Need a sustain pedal? Use gesture shortcuts! Ball one of your hands into a <span className="text-cyan-400 font-semibold">closed fist ✊</span> to hold the sustain pedal ON, and open it <span className="text-zinc-400 font-semibold">✋</span> to release the sustain.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-zinc-850 pt-6">
            <button 
              id="back-step"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
                currentStep === 1 
                  ? 'opacity-0 pointer-events-none' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {currentStep < totalSteps && (
              <button
                id="skip-tutorial-btn"
                onClick={onStart}
                className="text-xs font-mono font-semibold text-zinc-550 hover:text-cyan-400 transition cursor-pointer border border-zinc-800 hover:border-cyan-500/20 px-3.5 py-1.5 rounded-lg bg-zinc-900/30 font-bold"
              >
                Skip Tutorial
              </button>
            )}

            <button 
              id="next-step"
              onClick={handleNextClick}
              disabled={askingPermission}
              className="group flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 hover:shadow-[0_4px_25px_rgba(6,182,212,0.5)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {askingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Requesting...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  Enter Studio <Play className="h-4 w-4 fill-zinc-950" />
                </>
              ) : (
                <>
                  Next {currentStep === 1 ? 'Camera' : ''} <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
