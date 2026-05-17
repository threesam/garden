'use client';
import { useRef, useState, useCallback } from 'react';
import type { JournalStatus } from '@/lib/journal/types';

type RecorderStatus = Extract<JournalStatus, 'idle' | 'recording' | 'listening'>;

export function useVoiceRecorder({
  onChunk,
  silenceThreshold = -45,
  silenceDuration = 1500,
}: {
  onChunk: (blob: Blob) => Promise<void>;
  silenceThreshold?: number;
  silenceDuration?: number;
}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');

  const streamRef      = useRef<MediaStream | null>(null);
  const ctxRef         = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceRef     = useRef(0);
  const isActiveRef    = useRef(false);
  const chunkSettled   = useRef<Promise<void>>(Promise.resolve());

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Stop + restart the MediaRecorder to flush a chunk.
  const flushChunk = useCallback((mimeType: string) => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;

    rec.stop(); // onstop will restart it
    chunksRef.current = [];

    // onstop is async — track it so drain() can wait
    chunkSettled.current = new Promise<void>((resolve) => {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        const run = async () => {
          if (blob.size > 0) await onChunk(blob);

          // Restart recorder only if session is still active
          if (isActiveRef.current && streamRef.current && ctxRef.current?.state !== 'closed') {
            const next = new MediaRecorder(streamRef.current, { mimeType });
            next.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            next.onstop = () => {}; // overwritten on next flush
            recorderRef.current = next;
            next.start(1000 /* timeslice ms */);
          }
          resolve();
        };
        void run();
      };
    });
  }, [onChunk]);

  const start = useCallback(async () => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {};
    recorderRef.current = recorder;
    recorder.start(1000);
    setStatus('recording');

    const freqData = new Uint8Array(analyser.frequencyBinCount);

    intervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(freqData);
      const avg = freqData.reduce((s, v) => s + v, 0) / freqData.length;
      const db = avg > 0 ? 20 * Math.log10(avg / 255) : -Infinity;

      if (db < silenceThreshold) {
        silenceRef.current += 100;
        if (silenceRef.current >= silenceDuration) {
          setStatus('listening');
          silenceRef.current = 0;
          flushChunk(mimeType);
        }
      } else {
        silenceRef.current = 0;
        setStatus('recording');
      }
    }, 100);
  }, [flushChunk, silenceThreshold, silenceDuration]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    stopInterval();
    recorderRef.current?.stop();
    ctxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    setStatus('idle');
  }, [stopInterval]);

  const drain = useCallback(() => chunkSettled.current, []);

  return { status, start, stop, drain };
}
