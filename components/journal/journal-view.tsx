'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useVoiceRecorder } from './use-voice-recorder';
import type { ClassificationResult, JournalStatus } from '@/lib/journal/types';

// ── Markdown formatting helpers ───────────────────────────────────────────────

function wrapSelection(
  content: string,
  s: number,
  e: number,
  prefix: string,
  suffix = prefix,
): [string, number, number] {
  const selected = content.slice(s, e);
  // Toggle off if already wrapped
  if (
    content.slice(s - prefix.length, s) === prefix &&
    content.slice(e, e + suffix.length) === suffix
  ) {
    return [
      content.slice(0, s - prefix.length) + selected + content.slice(e + suffix.length),
      s - prefix.length,
      e - prefix.length,
    ];
  }
  return [
    content.slice(0, s) + prefix + selected + suffix + content.slice(e),
    s + prefix.length,
    e + prefix.length,
  ];
}

function prefixLine(
  content: string,
  s: number,
  prefix: string,
): [string, number, number] {
  const lineStart = content.lastIndexOf('\n', s - 1) + 1;
  const lineEnd = content.indexOf('\n', s);
  const end = lineEnd === -1 ? content.length : lineEnd;
  const line = content.slice(lineStart, end);

  if (line.startsWith(prefix)) {
    const next = content.slice(0, lineStart) + line.slice(prefix.length) + content.slice(end);
    const delta = -prefix.length;
    return [next, s + delta, s + delta];
  }
  const next = content.slice(0, lineStart) + prefix + line + content.slice(end);
  return [next, s + prefix.length, s + prefix.length];
}

// ── Selection toolbar ─────────────────────────────────────────────────────────

interface ToolbarProps {
  visible: boolean;
  onFormat: (type: string) => void;
}

const TOOLS: { key: string; label: string; title: string; style?: string }[] = [
  { key: 'bold',   label: 'B',  title: 'Bold (⌘B)',   style: 'font-bold' },
  { key: 'italic', label: 'I',  title: 'Italic (⌘I)', style: 'italic' },
  { key: 'h1',     label: 'H1', title: 'Heading 1' },
  { key: 'h2',     label: 'H2', title: 'Heading 2' },
  { key: 'h3',     label: 'H3', title: 'Heading 3' },
  { key: 'quote',  label: '❝',  title: 'Blockquote' },
  { key: 'code',   label: '<>', title: 'Inline code' },
];

function SelectionToolbar({ visible, onFormat }: ToolbarProps) {
  return (
    <div
      className="flex items-center gap-0.5 px-1 py-0.5 transition-all duration-150"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        borderBottom: visible ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      {TOOLS.map(({ key, label, title, style }) => (
        <button
          key={key}
          title={title}
          onMouseDown={(e) => {
            e.preventDefault(); // don't lose textarea focus
            onFormat(key);
          }}
          className={`font-mono text-xs px-2 py-1 rounded-sm text-muted hover:text-foreground hover:bg-black/5 transition-colors ${style ?? ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Auto-grow textarea via CSS grid trick ────────────────────────────────────

interface GrowTextareaProps {
  value: string;
  onChange: (v: string) => void;
  onSelectionChange: (s: number, e: number) => void;
  placeholder?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

function GrowTextarea({ value, onChange, onSelectionChange, placeholder, textareaRef }: GrowTextareaProps) {
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

  const reportSelection = () => {
    const el = textareaRef.current;
    if (el) onSelectionChange(el.selectionStart, el.selectionEnd);
  };

  return (
    <div style={{ display: 'grid' }}>
      <div aria-hidden style={{ ...sharedStyle, visibility: 'hidden', pointerEvents: 'none' }}>
        {value + '\n'}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); reportSelection(); }}
        onSelect={reportSelection}
        onKeyUp={reportSelection}
        onClick={reportSelection}
        placeholder={placeholder}
        spellCheck
        style={{ ...sharedStyle, resize: 'none', overflow: 'hidden', outline: 'none' }}
        className="bg-transparent text-foreground placeholder:text-muted"
        onKeyDown={(e) => {
          // Tab → two spaces
          if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart: s, selectionEnd: end } = el;
            onChange(value.slice(0, s) + '  ' + value.slice(end));
            requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
            return;
          }
          // ⌘B / ⌘I shortcuts
          if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); onFormat('bold'); }
          if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); onFormat('italic'); }
        }}
      />
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  function onFormat(_type: string) { /* placeholder — wired in parent */ }
}

// ── Markdown preview rendered as React elements (no innerHTML) ───────────────

function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) return <p className="text-muted">nothing yet</p>;
  const els: React.ReactNode[] = [];
  let k = 0;
  for (const line of content.split('\n')) {
    if (line.startsWith('### '))      els.push(<h3 key={k++} className="font-mono text-xs uppercase tracking-[0.16em] mt-4 mb-1">{line.slice(4)}</h3>);
    else if (line.startsWith('## ')) els.push(<h2 key={k++} className="font-mono text-sm uppercase tracking-[0.16em] mt-6 mb-2">{line.slice(3)}</h2>);
    else if (line.startsWith('# '))  els.push(<h1 key={k++} className="font-mono text-sm uppercase tracking-[0.22em] mt-8 mb-3">{line.slice(2)}</h1>);
    else if (line.startsWith('> '))  els.push(<blockquote key={k++} className="border-l-2 border-muted pl-3 text-muted italic">{line.slice(2)}</blockquote>);
    else if (line.startsWith('- '))  els.push(<li key={k++} className="ml-4 leading-7">{line.slice(2)}</li>);
    else if (line === '')             els.push(<br key={k++} />);
    else                              els.push(<p key={k++} className="leading-7">{line}</p>);
  }
  return <>{els}</>;
}

// ── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<JournalStatus, string> = {
  idle: 'idle', recording: 'recording', listening: 'listening...', processing: 'processing',
};

// ── Main view ────────────────────────────────────────────────────────────────

export function JournalView() {
  const today = new Date().toISOString().slice(0, 10);

  const [content, setContent]       = useState('');
  const [question, setQuestion]     = useState('');
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [savedPath, setSavedPath]   = useState('');
  const [preview, setPreview]       = useState(false);
  const [apiStatus, setApiStatus]   = useState<JournalStatus>('idle');
  const [sel, setSel]               = useState<[number, number]>([0, 0]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousQuestionsRef = useRef<string[]>([]);

  const hasSelection = sel[0] !== sel[1];

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  }, []);

  // Apply markdown formatting to current selection
  const applyFormat = useCallback((type: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;

    let next: [string, number, number];
    switch (type) {
      case 'bold':   next = wrapSelection(content, s, e, '**'); break;
      case 'italic': next = wrapSelection(content, s, e, '_'); break;
      case 'code':   next = wrapSelection(content, s, e, '`'); break;
      case 'h1':     next = prefixLine(content, s, '# '); break;
      case 'h2':     next = prefixLine(content, s, '## '); break;
      case 'h3':     next = prefixLine(content, s, '### '); break;
      case 'quote':  next = prefixLine(content, s, '> '); break;
      default: return;
    }

    const [newContent, newS, newE] = next;
    setContent(newContent);
    setSel([newS, newE]);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = newS;
      el.selectionEnd = newE;
    });
  }, [content]);

  const onChunk = useCallback(async (blob: Blob) => {
    const form = new FormData();
    form.append('file', blob, 'chunk.webm');
    let text = '';
    try {
      const res = await fetch('/api/journal/transcribe', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`${res.status}`);
      text = ((await res.json() as { text: string }).text ?? '').trim();
    } catch {
      showError('Transcription failed for this chunk');
      return;
    }
    if (!text) return;

    // Insert at cursor, or append if no focus
    const el = textareaRef.current;
    const insertAt = el ? el.selectionStart : content.length;
    const before = content.slice(0, insertAt);
    const after = content.slice(insertAt);
    const separator = before && !before.endsWith('\n') ? '\n\n' : '';
    setContent(before + separator + text + after);

    setApiStatus('processing');
    try {
      const res = await fetch('/api/journal/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, previousQuestions: previousQuestionsRef.current }),
      });
      if (res.ok) {
        const { question: q } = await res.json() as { question: string };
        previousQuestionsRef.current.push(q);
        setQuestion(q);
      }
    } catch { /* best-effort */ } finally {
      setApiStatus('idle');
    }
  }, [content, showError]);

  const { status: recStatus, start, stop, drain } = useVoiceRecorder({ onChunk });

  const status: JournalStatus =
    apiStatus === 'processing' && recStatus === 'idle' ? 'processing' : recStatus;
  const isRecording = recStatus === 'recording' || recStatus === 'listening';

  const handleRecord = useCallback(async () => {
    if (isRecording) { stop(); await drain(); }
    else {
      previousQuestionsRef.current = [];
      try { await start(); }
      catch (err) { showError(err instanceof Error ? err.message : 'Microphone error'); }
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
      const fm =
        `---\ntype: journal-entry\ndate: ${today}\n` +
        `title: "${escYaml(cl.title)}"\nmood: "${escYaml(cl.mood)}"\n` +
        `tags:\n${cl.tags.map((t) => `  - ${t}`).join('\n')}\n` +
        `themes:\n${cl.themes.map((t) => `  - ${t}`).join('\n')}\n` +
        `summary: "${escYaml(cl.oneLineSummary)}"\n---`;

      const filename = `${today} - ${cl.title.replace(/[/\\?%*:|"<>]/g, '-')}`;
      const saveRes = await fetch('/api/journal/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fm + '\n\n' + content, filename }),
      });
      if (!saveRes.ok) throw new Error('Save failed');
      const { filePath } = await saveRes.json() as { filePath: string };

      setSavedPath(filePath);
      setContent(''); setQuestion('');
      previousQuestionsRef.current = [];
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
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
        <span className="font-mono text-xs uppercase tracking-[0.22em]">journal</span>
        <span className="font-mono text-xs text-muted">{today}</span>
      </div>

      {/* Banners */}
      {error && (
        <div className="font-mono text-xs text-red-500 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {savedPath && (
        <div className="font-mono text-xs text-muted border border-border rounded px-3 py-2">
          saved → {savedPath}
        </div>
      )}

      {/* Follow-up question */}
      {question && (
        <div className="font-mono text-sm text-muted border-l-2 pl-4" style={{ borderColor: 'var(--coin)' }}>
          {question}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 section-shell overflow-hidden rounded-sm text-sm">
        {/* Formatting toolbar — visible when text is selected */}
        <SelectionToolbar visible={hasSelection && !preview} onFormat={applyFormat} />

        {preview ? (
          <div className="px-5 py-5 text-foreground">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <GrowTextarea
            value={content}
            onChange={(v) => { setContent(v); setSavedPath(''); }}
            onSelectionChange={(s, e) => setSel([s, e])}
            placeholder="start typing, or press record…"
            textareaRef={textareaRef}
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
