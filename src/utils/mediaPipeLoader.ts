/**
 * Utility to dynamically stream-load MediaPipe scripts from jsDelivr CDN
 * and handle singletons to avoid duplicate loads.
 */

let loadPromise: Promise<boolean> | null = null;

export function loadMediaPipeScripts(): Promise<boolean> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if scripts are already present in global window
    if ((window as any).Hands && (window as any).Camera) {
      resolve(true);
      return;
    }

    const loadScript = (url: string): Promise<void> => {
      return new Promise((res, rej) => {
        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        script.async = true;
        script.onload = () => res();
        script.onerror = (e) => rej(new Error(`Failed to load script ${url}`));
        document.head.appendChild(script);
      });
    };

    // Load Camera Utils then Hands sequentially
    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'))
      .then(() => {
        resolve(true);
      })
      .catch((err) => {
        console.error('MediaPipe loading failed', err);
        loadPromise = null; // enable retry
        reject(err);
      });
  });

  return loadPromise;
}
