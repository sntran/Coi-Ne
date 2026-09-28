// Record sound from the microphone with MediaRecorder.

const TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/aac'];
const MAX_MS = 20000;
let stream = null;

export function canRecord() {
  return typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

function pickType() {
  if (typeof MediaRecorder.isTypeSupported !== 'function') return '';
  return TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

/**
 * Start to record. The recording stops after 20 seconds.
 * @returns {Promise<{stop: () => Promise<Blob>, done: Promise<Blob>}>}
 */
export async function startRecording() {
  if (!stream || !stream.active) {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  }
  const type = pickType();
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' }));
    rec.onerror = (e) => reject(e.error || new Error('Recording failed'));
  });
  rec.start();
  const timer = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, MAX_MS);
  return {
    done,
    stop() {
      clearTimeout(timer);
      if (rec.state === 'recording') rec.stop();
      return done;
    },
  };
}

/** Turn off the microphone. */
export function releaseMicrophone() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}
