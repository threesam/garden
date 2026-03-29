'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useVoiceRecorder } from './use-voice-recorder';
import type { ClassificationResult, JournalStatus } from '@/lib/journal/types';

// ── Markdown preview rendered as React elements (no innerHTML) ───────────────
function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-muted">nothing yet</p>;
  }
  const elements: React.ReactNode[] = [];
  let key = 0;
  for (const line of content.split('\n')) {
    if (line.startsWith('### '))      elements.push(<h3 key={key++} className="font-mono text-xs uppercase tracking-[0.16em] mt-4 mb-1">{line.slice(4)}</h3>);
    else if (line.startsWith('## ')) elements.push(<h2 key={key++} className="font-mono text-sm uppercase tracking-[0.16em] mt-6 mb-2">{line.slice(3)}</h2>);
    else if (line.startsWith('# '))  elements.push(<h1 key={key++} className="font-mono text-sm uppercase tracking-[0.22em] mt-8 mb-3">{line.slice(2)}</h1>);
    else if (line.startsWith('- '))  elements.push(<li key={key++} className="ml-4 leading-7">{line.slice(2)}</li>);
    else if (line === '')             elements.push(<br key={key++} />);
    else                              elements.push(<p key={key++} className="leading-7">{line}</p>);
  }
  return <>{elements}</>;
}

// ── Auto-grow textarea via CSS grid trick ────────────────────────────────────
function GrowTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const sharedStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: '1.75',
    padding: '1.25rem',
    gridArea: '1 / 1',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minHeight: '40vh',
  };

  return (
    <div style={{ display: 'grid' }}>
      {/* invisible shadow div that drives the container height */}
      <div aria-hidden style={{ ...sharedStyle, visibility: 'hidden', pointerEvents: 'none' }}>
        {value + '\n'}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck
        style={{ ...sharedStyle, resize: 'none', overflow: 'hidden', outline: 'none' }}
        className="bg-transparent text-foreground placeholder:text-muted"
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart: s, selectionEnd: end } = el;
            onChange(value.slice(0, s) + '  ' + value.slice(end));
            requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
          }
        }}
      />
    </div>
  );
}

// ── Status badge labels ───────────────────────────────────────────────────────
const STATUS_LABEL: Record<JournalStatus, string> = {
  idle: 'idle',
  recording: 'recording',
  listening: 'listening...',
  processing: 'processing',
};

// ── Main view ────────────────────────────────────────────────────────────────
export function JournalView() {
  const today = new Date().toISOString().slice(0, 10);

  const [content, setContent]     = useState('');
  const [question, setQuestion]   = useState('');
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [savedPath, setSavedPath] = useState('');
  const [preview, setPreview]     = useState(false);
  const [apiStatus, setApiStatus] = useState<JournalStatus>('idle');

  const previousQuestionsRef = useRef<string[]>([]);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  }, []);

  const onChunk = useCallback(async (blob: Blob) => {
    const form = new FormData();
    form.append('file', blob, 'chunk.webm');

    let text = '';
    try {
      const res = await fetch('/api/journal/transcribe', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`transcribe ${res.status}`);
      const data = await res.json() as { text: string };
      text = data.text?.trim() ?? '';
    } catch {
      showError('Transcription failed for this chunk');
      return;
    }

    if (!text) return;

    setContent((prev) => prev ? prev + '\n\n' + text : text);

    setApiStatus('processing');
    try {
      const res = await fetch('/api/journal/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          previousQuestions: previousQuestionsRef.current,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { question: string };
        previousQuestionsRef.current.push(data.question);
        setQuestion(data.question);
      }
    } catch {
      // follow-up questions are best-effort
    } finally {
      setApiStatus('idle');
    }
  }, [showError]);

  const { status: recStatus, start, stop, drain } = useVoiceRecorder({ onChunk });

  const status: JournalStatus =
    apiStatus === 'processing' && recStatus === 'idle' ? 'processing' : recStatus;

  const isRecording = recStatus === 'recording' || recStatus === 'listening';

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      stop();
      await drain();
    } else {
      previousQuestionsRef.current = [];
      try {
        await start();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Could not access microphone');
      }
    }
  }, [isRecording, start, stop, drain, showError]);

  const handleSave = useCallback(async () => {
    if (!content.trim()) { showError('Nothing to save'); return; }
    setSaving(true);
    try {
      const classRes = await fetch('/api/journal/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: content }),
      });
      if (!classRes.ok) throw new Error('Classification failed');
      const cl = await classRes.json() as ClassificationResult;

      const escYaml = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const frontmatter =
        `---\n` +
        `type: journal-entry\n` +
        `date: ${today}\n` +
        `title: "${escYaml(cl.title)}"\n` +
        `mood: "${escYaml(cl.mood)}"\n` +
        `tags:\n${cl.tags.map((t) => `  - ${t}`).join('\n')}\n` +
        `themes:\n${cl.themes.map((t) => `  - ${t}`).join('\n')}\n` +
        `summary: "${escYaml(cl.oneLineSummary)}"\n` +
        `---`;

      const filename = `${today} - ${cl.title.replace(/[/\\?%*:|"<>]/g, '-')}`;

      const saveRes = await fetch('/api/journal/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: frontmatter + '\n\n' + content, filename }),
      });
      if (!saveRes.ok) throw new Error('Save failed');
      const saved = await saveRes.json() as { filePath: string };

      setSavedPath(saved.filePath);
      setContent('');
      setQuestion('');
      previousQuestionsRef.current = [];
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [content, today, showError]);

  useEffect(() => {
    if (!savedPath) return;
    const t = setTimeout(() => setSavedPath(''), 4000);
    return () => clearTimeout(t);
  }, [savedPath]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 min-h-screen flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-foreground">
          journal
        </span>
        <span className="font-mono text-xs text-muted">{today}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="font-mono text-xs text-red-500 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Saved confirmation */}
      {savedPath && (
        <div className="font-mono text-xs text-muted border border-border rounded px-3 py-2">
          saved → {savedPath}
        </div>
      )}

      {/* Follow-up question */}
      {question && (
        <div
          className="font-mono text-sm text-muted border-l-2 pl-4"
          style={{ borderColor: 'var(--coin)' }}
        >
          {question}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 section-shell overflow-hidden rounded-sm text-sm">
        {preview ? (
          <div className="px-5 py-5 text-foreground">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <GrowTextarea
            value={content}
            onChange={(v) => { setContent(v); setSavedPath(''); }}
            placeholder="start typing, or press record…"
          />
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => void handleRecord()}
          disabled={saving || status === 'processing'}
          className="font-mono text-xs uppercase tracking-[0.16em] px-4 py-2 border border-border rounded-sm hover:border-foreground transition-colors disabled:opacity-40"
        >
          {isRecording ? '■ stop' : '● record'}
        </button>

        <span className="font-mono text-xs text-muted">{STATUS_LABEL[status]}</span>

        <div className="flex-1" />

        <button
          onClick={() => setPreview((p) => !p)}
          className="font-mono text-xs uppercase tracking-[0.16em] px-3 py-2 text-muted hover:text-foreground transition-colors"
        >
          {preview ? 'edit' : 'preview'}
        </button>

        <button
          onClick={() => void handleSave()}
          disabled={saving || !content.trim() || isRecording}
          className="font-mono text-xs uppercase tracking-[0.16em] px-4 py-2 border border-border rounded-sm hover:border-foreground transition-colors disabled:opacity-40"
        >
          {saving ? 'saving…' : 'save entry'}
        </button>
      </div>

    </div>
  );
}
