import type { VoiceJournalSettings } from './types';

export class AudioCapture {
  private settings: Pick<VoiceJournalSettings, 'silenceThreshold' | 'silenceDuration'>;

  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isChunking = false; // prevent double-trigger while onstop is in flight

  constructor(settings: Pick<VoiceJournalSettings, 'silenceThreshold' | 'silenceDuration'>) {
    this.settings = settings;
  }

  async start(
    onSilence: (blob: Blob) => Promise<void>,
    onStatusChange: (status: 'recording' | 'listening') => void
  ): Promise<void> {
    // Guard against calling start() while already running
    if (this.stream !== null) {
      throw new Error('AudioCapture is already running. Call stop() first.');
    }

    // Request microphone — throws on permission denied / no device
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;

    // Set up Web Audio analysis chain
    const audioContext = new AudioContext();
    this.audioContext = audioContext;
    // Resume in case browser created context in suspended state (common in Chrome without user gesture)
    await audioContext.resume();

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    this.analyserNode = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    this.sourceNode = source;
    source.connect(analyser);

    // Determine supported MIME type
    let mimeType: string;
    try {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else {
        mimeType = 'audio/webm';
      }
    } catch {
      mimeType = 'audio/webm';
    }

    // Internal helper: creates and starts a fresh MediaRecorder, returns it and its chunks array
    const createRecorder = (): { recorder: MediaRecorder; chunks: Blob[] } => {
      const chunks: Blob[] = [];
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType });
      } catch {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      }
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.start(1000); // 1-second timeslice
      return { recorder, chunks };
    };

    let { recorder, chunks } = createRecorder();
    this.mediaRecorder = recorder;

    // Silence-detection state
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let silenceCounter = 0;
    let currentStatus: 'recording' | 'listening' | null = null;

    // Poll every 100 ms
    this.intervalId = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);

      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const avg = sum / bufferLength;

      // NOTE: This is not absolute dB SPL. getByteFrequencyData returns FFT magnitude
      // values already mapped to 0–255 on the browser's internal dB scale. Averaging
      // and applying log10 gives a relative energy level. The silenceThreshold in
      // DEFAULT_SETTINGS (-45) is calibrated to this scale, not to dB SPL references.
      const db = avg > 0 ? 20 * Math.log10(avg / 255) : -Infinity;

      const isSilent = db < this.settings.silenceThreshold;

      // Emit status change only when it actually changes
      const nextStatus: 'recording' | 'listening' = isSilent ? 'listening' : 'recording';
      if (nextStatus !== currentStatus) {
        currentStatus = nextStatus;
        onStatusChange(nextStatus);
      }

      if (isSilent) {
        silenceCounter++;
      } else {
        silenceCounter = 0;
      }

      // silenceCounter * 100ms >= silenceDuration
      if (!this.isChunking && silenceCounter * 100 >= this.settings.silenceDuration) {
        silenceCounter = 0;
        this.isChunking = true;

        // Capture snapshot references before async work
        const recorderToStop = recorder;
        const chunksCopy = chunks;

        // Stop the current recorder; wait for onstop, then process and restart
        recorderToStop.onstop = async () => {
          this.isChunking = false;
          const blob = new Blob(chunksCopy, { type: mimeType });

          if (blob.size > 0) {
            await onSilence(blob);
          }

          // Restart only if we are still running (stop() not called)
          if (this.intervalId !== null) {
            const next = createRecorder();
            recorder = next.recorder;
            chunks = next.chunks;
            this.mediaRecorder = recorder;
          }
        };

        recorderToStop.stop();
      }
    }, 100);
  }

  stop(): void {
    // Clear the polling interval first so no new chunks/silence triggers fire
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop the recorder (may still flush a final ondataavailable, which is fine)
    if (this.mediaRecorder !== null) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch {
        // Recorder may already be inactive
      }
      this.mediaRecorder = null;
    }

    // Stop all media tracks to release the microphone indicator
    if (this.stream !== null) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    // Disconnect audio nodes before closing context
    if (this.sourceNode !== null) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyserNode !== null) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    // Close the AudioContext
    if (this.audioContext !== null) {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
      this.audioContext = null;
    }

    this.isChunking = false;
  }
}
