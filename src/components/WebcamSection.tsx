import { useEffect, useRef, useState } from 'react';
import { loadMediaPipeScripts } from '../utils/mediaPipeLoader';
import { InstrumentSettings, HandLandmark, PianoKey, DetectedNote, Particle } from '../types';
import { AlertCircle, Camera, Loader2, Sparkles, Tv } from 'lucide-react';

interface WebcamSectionProps {
  settings: InstrumentSettings;
  keyboardLayout: PianoKey[];
  onFingerAction: (note: string, eventType: 'start' | 'stop', hand: 'Left' | 'Right', finger: string) => void;
  onSustainAction: (active: boolean) => void;
  onFPSUpdate: (fps: number) => void;
  onHandsCountUpdate: (count: number) => void;
  // Hold record of notes pressed in playback and visual presses
  externalActiveNotes: Set<string>;
  isActive: boolean;
  isCameraOn: boolean;
  onToggleCamera: () => void;
}

// Map finger index to human labels
const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const FINGER_TIP_INDICES = [4, 8, 12, 16, 20];

export default function WebcamSection({
  settings,
  keyboardLayout,
  onFingerAction,
  onSustainAction,
  onFPSUpdate,
  onHandsCountUpdate,
  externalActiveNotes,
  isActive,
  isCameraOn,
  onToggleCamera,
}: WebcamSectionProps) {
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References to handle animations & loop-states without causing React state-render thrashing
  const trackingState = useRef({
    handsInstance: null as any,
    cameraInstance: null as any,
    activeTouches: {} as Record<string, string>, // fingertipKey -> activeNote
    particles: [] as Particle[],
    lastFrameTime: performance.now(),
    fpsCounter: 0,
    fpsTimer: performance.now(),
  });

  const settingsRef = useRef(settings);
  const keyboardLayoutRef = useRef(keyboardLayout);

  const onFingerActionRef = useRef(onFingerAction);
  const onSustainActionRef = useRef(onSustainAction);
  const onFPSUpdateRef = useRef(onFPSUpdate);
  const onHandsCountUpdateRef = useRef(onHandsCountUpdate);

  // Sync callbacks on every render so the asynchronous loop always uses the latest state closure
  useEffect(() => {
    onFingerActionRef.current = onFingerAction;
    onSustainActionRef.current = onSustainAction;
    onFPSUpdateRef.current = onFPSUpdate;
    onHandsCountUpdateRef.current = onHandsCountUpdate;
  });

  // Update refs to ensure MediaPipe loop always accesses the latest configuration immediately
  useEffect(() => {
    settingsRef.current = settings;
    keyboardLayoutRef.current = keyboardLayout;
  }, [settings, keyboardLayout]);

  useEffect(() => {
    if (!isActive) {
      setLoading(false);
      setCameraActive(false);
      stopAllStreams();
      return;
    }

    let active = true;

    async function initTracking() {
      try {
        setLoading(true);
        setErrorStatus(null);

        // 1. Download CDN files sequentially
        await loadMediaPipeScripts();
        if (!active) return;

        // 2. Setup video streams and checking constraints
        const hasCam = await checkCameraAvailability();
        if (!hasCam) {
          throw new Error('No webcam accessible. Please attach a camera or authorize frame access in browser.');
        }

        // 3. Initialize MediaPipe Hands
        const HandsClass = (window as any).Hands;
        if (!HandsClass) {
          throw new Error('MediaPipe Hands script did not register globally. Check network speed or refresh.');
        }

        const hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        hands.onResults(onHandsResults);
        trackingState.current.handsInstance = hands;

        setLoading(false);
        startWebcamStream(hands);
      } catch (err: any) {
        console.error('Failed to initialize webcam hand tracker:', err);
        setErrorStatus(err.message || 'Tracking system failed to load.');
        setLoading(false);
      }
    }

    initTracking();

    return () => {
      active = false;
      stopAllStreams();
    };
  }, [isActive]);

  // Check camera access permissions
  const checkCameraAvailability = async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(d => d.kind === 'videoinput');
    } catch (_) {
      return false;
    }
  };

  // Launch camera capture overlay
  const startWebcamStream = async (handsInstance: any) => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Play request was interrupted by a load or camera status change - this is safely handled & expected during fast resets/toggles
          console.warn('Webcam video play request was interrupted or prevented safely:', err);
        });
      }
      setCameraActive(true);

      const CameraClass = (window as any).Camera;
      if (CameraClass) {
        const camera = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await handsInstance.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
        trackingState.current.cameraInstance = camera;
      }
    } catch (err) {
      console.error('Camera permissions refused or camera in use', err);
      setErrorStatus('Camera permission refused. Please enable webcam access in settings.');
    }
  };

  const stopAllStreams = () => {
    try {
      if (trackingState.current.cameraInstance) {
        trackingState.current.cameraInstance.stop();
      }
    } catch (_) {}

    if (videoRef.current && videoRef.current.srcObject) {
      const src = videoRef.current.srcObject as MediaStream;
      src.getTracks().forEach(track => track.stop());
    }

    // Release synthesizers on teardown
    Object.keys(trackingState.current.activeTouches).forEach(key => {
      const note = trackingState.current.activeTouches[key];
      const match = key.split('_');
      const hand = match[0] as any;
      const finger = match[1];
      onFingerActionRef.current(note, 'stop', hand, finger);
    });
    trackingState.current.activeTouches = {};
  };

  // Draw particle trails and skeletons in an animation loop
  const drawOverlayAndFrame = (results: any, filterLineY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear previous drawing state
    ctx.clearRect(0, 0, width, height);

    // Render original mirrored video frame on canvas to unify UI layout nicely
    if (results.image) {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1); // mirror horizontal draw
      ctx.drawImage(results.image, 0, 0, width, height);
      ctx.restore();
    } else {
      // Background gradient fallback
      ctx.fillStyle = 'rgba(9, 9, 11, 0.4)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw Trigger line
    const actionLine = filterLineY * height;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, actionLine);
    ctx.lineTo(width, actionLine);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Add neon label for the trigger depth action boundary line
    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.font = '8px monospace';
    ctx.fillText('STRIKE ZONE ACTION LINE', 16, actionLine - 6);

    // Process Hand Tracking Graphics & Collisions
    let currentSustain = false;
    const currentFrameTouches = new Set<string>();

    if (results.multiHandLandmarks && results.multiHandedness) {
      onHandsCountUpdateRef.current(results.multiHandLandmarks.length);

      results.multiHandLandmarks.forEach((landmarks: HandLandmark[], handIdx: number) => {
        const handLabel = results.multiHandedness[handIdx].label === 'Left' ? 'Right' : 'Left'; // Map mirror hand labels inverted

        // Determine closed fist to toggle sustain
        const sustainOn = settingsRef.current.gestureSustainEnabled !== false && isHandFist(landmarks);
        if (sustainOn) {
          currentSustain = true;
        }

        // Draw joint connector links
        drawJointConnections(ctx, landmarks, width, height);

        // Process fingertip nodes and key collision triggers
        FINGER_TIP_INDICES.forEach((nodeIdx, idx) => {
          const fingerLabel = FINGER_LABELS[idx];
          const point = landmarks[nodeIdx];

          // Mirror calculation: webcam mirrored matches visually
          const mappedX = (1 - point.x) * width;
          const mappedY = point.y * height;

          // If the hand is in a closed fist shape, override collision to false
          // to prevent clenching fingers from triggering accidental key presses!
          const isColliding = point.y >= filterLineY && !sustainOn;

          // Determine key mapping based on x coordinate
          const xPercent = (mappedX / width) * 100;
          const targetKey = keyboardLayoutRef.current.find(
            k => xPercent >= k.leftPercent && xPercent < k.leftPercent + k.widthPercent
          );

          const touchID = `${handLabel}_${fingerLabel}`;
          const activeNote = trackingState.current.activeTouches[touchID];

          if (isColliding && targetKey) {
            currentFrameTouches.add(touchID);
            // Trigger note play
            if (!activeNote) {
              trackingState.current.activeTouches[touchID] = targetKey.note;
              onFingerActionRef.current(targetKey.note, 'start', handLabel, fingerLabel);
              createParticleBlast(mappedX, mappedY, targetKey.type);
            } else if (activeNote !== targetKey.note) {
              // Sliding across notes: release old first, then strike new
              onFingerActionRef.current(activeNote, 'stop', handLabel, fingerLabel);
              trackingState.current.activeTouches[touchID] = targetKey.note;
              onFingerActionRef.current(targetKey.note, 'start', handLabel, fingerLabel);
              createParticleBlast(mappedX, mappedY, targetKey.type);
            }
            // Constant trails
            if (settingsRef.current.particlesEnabled && Math.random() < 0.3) {
              createConstantParticleTail(mappedX, mappedY);
            }
          } else {
            // Release note when crossing back above action line
            if (activeNote) {
              onFingerActionRef.current(activeNote, 'stop', handLabel, fingerLabel);
              delete trackingState.current.activeTouches[touchID];
            }
          }

          // Draw fingertip node indicator
          ctx.beginPath();
          ctx.arc(mappedX, mappedY, isColliding ? 9 : 6, 0, 2 * Math.PI);
          ctx.fillStyle = isColliding
            ? 'rgba(236, 72, 153, 0.85)' // glowing collision pink
            : 'rgba(34, 211, 238, 0.75)'; // cyan locator
          ctx.shadowBlur = isColliding ? 20 : 8;
          ctx.shadowColor = isColliding ? '#ec4899' : '#22d3ee';
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow

          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(fingerLabel[0], mappedX, mappedY);
        });
      });
    } else {
      onHandsCountUpdateRef.current(0);
    }

    // First, process any sustain action updates to make sure the audio engine knows 
    // the correct sustain state BEFORE we release any active tracker notes.
    onSustainActionRef.current(currentSustain);

    // Release any notes for hands/fingers that are no longer tracked in this frame
    Object.keys(trackingState.current.activeTouches).forEach((touchID) => {
      if (!currentFrameTouches.has(touchID)) {
        const activeNote = trackingState.current.activeTouches[touchID];
        const parts = touchID.split('_');
        const hand = parts[0] as 'Left' | 'Right';
        const finger = parts[1];
        onFingerActionRef.current(activeNote, 'stop', hand, finger);
        delete trackingState.current.activeTouches[touchID];
      }
    });

    // Animate and draw visual particles overlay
    if (settingsRef.current.particlesEnabled) {
      animateAndDrawParticles(ctx);
    }
  };

  const onHandsResults = (results: any) => {
    // Keep monitor of tracking FPS rates
    const now = performance.now();
    trackingState.current.fpsCounter++;
    if (now - trackingState.current.fpsTimer >= 1000) {
      onFPSUpdateRef.current(trackingState.current.fpsCounter);
      trackingState.current.fpsCounter = 0;
      trackingState.current.fpsTimer = now;
    }

    const currentSensitivity = settingsRef.current.sensitivity;
    drawOverlayAndFrame(results, currentSensitivity);
  };

  // Math fist calculation
  const isHandFist = (landmarks: HandLandmark[]): boolean => {
    const getDist = (p1: HandLandmark, p2: HandLandmark) => {
      return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    };

    const wrist = landmarks[0];
    const indexFolded = getDist(landmarks[8], wrist) < getDist(landmarks[5], wrist);
    const middleFolded = getDist(landmarks[12], wrist) < getDist(landmarks[9], wrist);
    const ringFolded = getDist(landmarks[16], wrist) < getDist(landmarks[13], wrist);
    const pinkyFolded = getDist(landmarks[20], wrist) < getDist(landmarks[17], wrist);

    return indexFolded && middleFolded && ringFolded && pinkyFolded;
  };

  // Draw beautiful glowing neon lines between knuckles
  const drawJointConnections = (
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    width: number,
    height: number
  ) => {
    const CONNECTIONS = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [9, 10], [10, 11], [11, 12],
      // Ring
      [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Knuckles bridge linkage
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1.5;

    CONNECTIONS.forEach(([iA, iB]) => {
      const pA = landmarks[iA];
      const pB = landmarks[iB];

      const xA = (1 - pA.x) * width;
      const yA = pA.y * height;
      const xB = (1 - pB.x) * width;
      const yB = pB.y * height;

      ctx.beginPath();
      ctx.moveTo(xA, yA);
      ctx.lineTo(xB, yB);
      ctx.stroke();
    });

    // Draw little connector joint nodes
    landmarks.forEach((pt) => {
      const mappedX = (1 - pt.x) * width;
      const mappedY = pt.y * height;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.55)';
      ctx.beginPath();
      ctx.arc(mappedX, mappedY, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Particle Generators
  const createParticleBlast = (x: number, y: number, keyType: 'white' | 'black') => {
    const count = 12;
    const colors = keyType === 'white'
      ? ['#22d3ee', '#67e8f9', '#ffffff', '#818cf8'] // Cyan sparkles for white keys
      : ['#6366f1', '#a5b4fc', '#f472b6', '#3b82f6']; // Indigo / Pink sparkles for black keys

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      const life = Math.random() * 20 + 15;

      trackingState.current.particles.push({
        id: Math.random().toString(36).substring(2),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // slightly upwards launch
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1.5,
        opacity: 1,
        life,
        maxLife: life,
      });
    }
  };

  const createConstantParticleTail = (x: number, y: number) => {
    trackingState.current.particles.push({
      id: Math.random().toString(36).substring(2),
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 1.2, // floats upwards softly
      color: 'rgba(34, 211, 238, 0.4)',
      size: Math.random() * 1.5 + 0.8,
      opacity: 0.65,
      life: 25,
      maxLife: 25,
    });
  };

  const animateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    const list = trackingState.current.particles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life--;

      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }

      // Update positions
      p.x += p.vx;
      p.y += p.vy;

      // Render glowing point
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * (p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1.0; // reset
  };

  return (
    <div 
      id="tracker-visualizer-container" 
      className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex-1 min-h-[320px]"
    >
      {/* Hidden camera pipeline hook */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        width="640"
        height="480"
      />

      {/* Primary tracking interface */}
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        style={{ contentVisibility: 'auto' }}
      />

      {/* Quiet floating stop camera action */}
      {isActive && !loading && !errorStatus && cameraActive && (
        <button
          id="floating-stop-camera-btn"
          onClick={onToggleCamera}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-450 hover:bg-rose-950/75 hover:border-rose-500 text-[10px] uppercase font-bold transition cursor-pointer animate-fade-in"
          title="Disconnect webcam capture and pause tracking models"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Stop Camera
        </button>
      )}

      {/* Loading HUD interface */}
      {isActive && loading && (
        <div id="loader-hud" className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
          <div className="space-y-1.5">
            <h4 className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase">Preparing AI Engine...</h4>
            <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
              Downloading hand-tracking neural network files. This may take a few moments.
            </p>
          </div>
        </div>
      )}

      {/* Error HUD fallback */}
      {isActive && errorStatus && (
        <div id="error-hud" className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
          <div className="space-y-1.5">
            <h4 className="font-mono text-xs tracking-wider text-rose-500 font-bold uppercase">Webcam Engine Error</h4>
            <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
              {errorStatus}
            </p>
          </div>
          <button
            id="retry-camera-load"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            Refresh Interface
          </button>
        </div>
      )}

      {/* Camera fallback help prompt */}
      {isActive && !loading && !errorStatus && !cameraActive && (
        <div id="authorize-camera-hud" className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Camera className="h-10 w-10 text-zinc-400" />
          <div className="space-y-1.5">
            <h4 className="font-sans text-xs tracking-wider text-zinc-350 font-bold uppercase">Camera authorization required</h4>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Allow access to your webcam in the pop-up to start hands-free visual piano playing.
            </p>
          </div>
        </div>
      )}

      {/* Standby placeholder screen when tutorial is active or camera is explicitly powered off */}
      {!isActive && (
        <div id="standby-hud" className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center space-y-6 z-30">
          {!isCameraOn ? (
            <>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-850 text-zinc-550 shadow-inner">
                <Camera className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <h4 className="font-mono text-xs tracking-wider text-zinc-400 font-bold uppercase flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                  Webcam Feed Stopped
                </h4>
                <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed mx-auto px-4">
                  Visual AI tracking is disabled. Click engine keys below with your mouse/cursor to play, or reactivate the camera stream to track your hand coordinates.
                </p>
              </div>
              <button
                id="camera-enable-btn"
                onClick={onToggleCamera}
                className="mt-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] transition cursor-pointer"
              >
                ENABLE CAMERA TRACKING
              </button>
            </>
          ) : (
            <>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
                <Tv className="h-10 w-10" />
                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/20 scale-110 animate-ping opacity-30" />
              </div>
              <div className="space-y-2">
                <h4 className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Aethera Vision Standby
                </h4>
                <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed mx-auto">
                  Webcam capture and AI hand tracking are currently suspended during the interactive tutorial to optimize page performance.
                </p>
              </div>
              <div className="text-[10px] font-mono text-zinc-650 border border-zinc-900 px-3 py-1 bg-zinc-900/20 rounded">
                CALIBRATION CHORD READY • WAITING TO BOOT
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
