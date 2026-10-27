import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  X,
  Mic,
  Send,
  Paperclip,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock,
  Sparkles,
  Square,
} from 'lucide-react';
import { useMyAi } from '../../context/MyAiContext';
import useTaskAgentSession from '../../hooks/useTaskAgentSession';
import { formatCandidateDate } from '../../hooks/taskAgentPureLogic';
import TaskPreviewCard from './TaskPreviewCard';
import './MyAiChatView.css';

// Lazy-load Three.js AuraFluidRing for code-splitting
const AuraFluidRing = lazy(() => import('./AuraFluidRing'));

/**
 * Lightweight CSS Orb Fallback for non-WebGL / reduced-motion environments
 */
function CssOrbFallback({ orbState = 'paused', onClick, title }) {
  return (
    <div
      className={`my-ai-css-orb ${orbState}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={title}
      aria-label={`Voice Orb status: ${orbState}`}
    />
  );
}

/**
 * Typewriter message renderer for the latest assistant message.
 */
function AssistantMessageContent({ text, isLatest, isError }) {
  const [displayedText, setDisplayedText] = useState(() => (isLatest ? '' : text));

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text);
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      currentIndex += 3;
      if (currentIndex >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, currentIndex));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return (
    <div className={`my-ai-assistant-text ${isError ? 'is-error' : ''}`}>
      {isError && <AlertCircle size={15} className="my-ai-error-icon" />}
      <span>{displayedText}</span>
      {isLatest && displayedText.length < text.length && <span className="my-ai-cursor">|</span>}
    </div>
  );
}

/**
 * Initial Quick Suggestion Chips (displayed only underneath initial greeting)
 */
const EXAMPLE_CHIPS = [
  'Kal subah 10 baje team meeting rakh do',
  'Urgent task banao: Client proposal review',
  'Project Website Redesign mein task banao',
  'Call follow-up task 2 din baad',
];

export default function MyAiChatView({ onBack, onClose }) {
  const { isExpanded, toggleExpanded, closeMyAi } = useMyAi();

  const handleClose = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMyAi();
    if (onClose) {
      onClose();
    }
    window.dispatchEvent(new CustomEvent('close-messenger-widget'));
  }, [closeMyAi, onClose]);

  // Single source of truth: Voice task agent session hook
  const session = useTaskAgentSession({
    open: true,
    onClose: handleClose,
    variant: 'voice',
    startWithMic: false,
  });

  const {
    messages,
    input,
    setInput,
    loading,
    creating,
    uploadProgress,
    result,
    autoSpeak,
    setAutoSpeak,
    readyCountdown,
    files,
    voiceNoteBlob,
    setVoiceNoteBlob,
    fileError,
    highlightPaperclip,
    liveTranscriptText,
    engine,
    setEngine,
    lang,
    listening,
    isSpeaking,
    isTranscribing,
    speechNotice,
    setSpeechError,
    setNotice,
    cancelSpeech,
    recordingVoiceNote,
    handleAddFiles,
    handleRemoveFile,
    toggleVoiceNote,
    handleConfirm,
    handleCancel,
    handleEdit,
    handleChip,
    handlePick,
    onSubmit,
    handleOrbClick,
    cycleLanguage,
    cancelReadyCountdown,
    status,
    chips,
    candidates,
    micErrorText,
    browserHint,
    orbState,
    formatDueChip,
    fileInputRef,
    sendTurn,
    interim,
    stop,
    vadStats,
  } = session;

  const [hasWebGL, setHasWebGL] = useState(true);
  const threadEndRef = useRef(null);
  const inputRef = useRef(null);

  // WebGL support test
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const supported = Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setHasWebGL(supported);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, result, readyCountdown, interim]);

  // Handle click on example suggestion chip
  const handleExampleChipClick = (chipText) => {
    sendTurn({ text: chipText });
  };

  // Derive human-friendly status text for the header: Listening -> Transcribing -> Thinking
  let statusText = 'Tap to talk';
  if (creating) {
    statusText = 'Creating...';
  } else if (isSpeaking || (typeof window !== 'undefined' && window.__ciisVoiceSpeaking)) {
    statusText = 'Speaking...';
  } else if (loading) {
    statusText = 'Thinking...';
  } else if (isTranscribing) {
    statusText = 'Transcribing...';
  } else if (listening) {
    statusText = 'Listening...';
  } else if (orbState === 'paused') {
    statusText = 'Tap to talk';
  }

  return (
    <div className={`my-ai-view-container ${isExpanded ? 'is-expanded' : ''}`}>
      {/* =====================================================================
          REGION 1: TOP HEADER (~56px)
          Clean title, no "Astra", no internal STT counter ("Voice 0/12").
          ===================================================================== */}
      <header className="my-ai-header">
        <div className="my-ai-header-left">
          {onBack && (
            <button
              type="button"
              className="my-ai-back-btn"
              title="Back to chats"
              onClick={onBack}
              aria-label="Back to chats"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="my-ai-header-title-wrap">
            <h2 className="my-ai-title">CIIS AI</h2>
            <span className="my-ai-subtitle-badge">Assistant</span>
            <div className={`my-ai-status-indicator ${orbState}`}>
              <span className={`my-ai-status-dot ${orbState}`} />
              <span className="my-ai-status-label">{statusText}</span>
            </div>
          </div>
        </div>

        <div className="my-ai-header-right">
          {/* Engine toggle: Whisper vs Browser */}
          <button
            type="button"
            className="my-ai-icon-btn engine-toggle-btn"
            onClick={() => {
              setSpeechError?.(null);
              setNotice(null);
              setEngine((curr) => (curr === 'whisper' ? 'browser' : 'whisper'));
            }}
            title={`Speech engine: ${engine === 'whisper' ? 'Accurate (Whisper)' : 'Live (Browser)'}`}
          >
            {engine === 'whisper' ? '🎙️' : '⚡'}
            {isExpanded && <span style={{ marginLeft: 3 }}>{engine === 'whisper' ? 'Whisper' : 'Browser'}</span>}
          </button>

          {/* Language cycle: hi-IN -> en-IN -> auto */}
          <button
            type="button"
            className="my-ai-icon-btn lang-badge"
            onClick={cycleLanguage}
            title={`Language: ${lang === 'hi-IN' ? 'Hindi/Hinglish (hi-IN)' : lang === 'en-IN' ? 'English (en-IN)' : 'Auto-detect'}`}
          >
            {lang === 'hi-IN' ? 'हिं' : lang === 'en-IN' ? 'EN' : 'Auto'}
          </button>

          {/* TTS voice reply toggle */}
          <button
            type="button"
            className="my-ai-icon-btn"
            onClick={() => {
              setAutoSpeak((v) => !v);
              cancelSpeech();
            }}
            title={autoSpeak ? 'Mute AI voice reply' : 'Enable AI voice reply'}
            aria-label="Toggle AI speech replies"
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            type="button"
            className="my-ai-icon-btn"
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse popup' : 'Expand full screen'}
            aria-label={isExpanded ? 'Collapse popup' : 'Expand full screen'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            className="my-ai-icon-btn close-btn"
            onClick={handleClose}
            title="Close CIIS AI"
            aria-label="Close CIIS AI"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* =====================================================================
          REGION 2: SCROLLABLE MESSAGE STREAM (flex: 1, overflow-y: auto)
          ===================================================================== */}
      <main className="my-ai-thread-scroll">
        <div className="my-ai-messages-list">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const isLatestAssistant = !isUser && idx === messages.length - 1;

            return (
              <div
                key={m.id || idx}
                className={`my-ai-message-row ${isUser ? 'user' : 'assistant'}`}
              >
                <div
                  className={`my-ai-bubble ${isUser ? 'user' : 'assistant'} ${
                    m.isError ? 'error-bubble' : ''
                  }`}
                >
                  {isUser ? (
                    <span>{m.text}</span>
                  ) : (
                    <AssistantMessageContent
                      text={m.text}
                      isLatest={isLatestAssistant}
                      isError={m.isError}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Example suggestion chips: Shown ONLY underneath initial greeting (when messages <= 1) */}
          {messages.length <= 1 && (
            <div className="my-ai-example-chips-tray">
              <span className="my-ai-example-chips-heading">
                <Sparkles size={13} /> Try asking:
              </span>
              <div className="my-ai-example-chips-list">
                {EXAMPLE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="my-ai-example-chip"
                    onClick={() => handleExampleChipClick(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thinking bubble when waiting for parse / task creation */}
          {loading && (
            <div className="my-ai-message-row assistant">
              <div className="my-ai-bubble assistant thinking-bubble">
                <span className="my-ai-pulse-dot" />
                <span>Soch raha hoon…</span>
              </div>
            </div>
          )}

          {/* Assignee or Project disambiguation candidate buttons */}
          {candidates.length > 0 && (
            <div className="my-ai-candidates-tray">
              <span className="my-ai-candidates-label">
                {result?.field === 'project' ? 'Konsa project chunna hai?' : 'Kise assign karna hai?'}
              </span>
              <div className="my-ai-candidates-list">
                {candidates.map((c) => {
                  const id = c.id || c._id || c.userId || c.assigneeId || c.projectId;
                  const label = c.name || c.projectName || c.label;
                  const subtitle = result?.field === 'project'
                    ? [
                        c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1)) : null,
                        c.startDate ? `Start: ${formatCandidateDate(c.startDate)}` : null,
                        Array.isArray(c.users) ? `${c.users.length} members` : (c.memberCount ? `${c.memberCount} members` : null),
                        c._id ? `#${String(c._id).slice(-6)}` : null,
                      ].filter(Boolean).join(' • ')
                    : [c.employeeId, c.jobRole || c.role, c.department]
                        .filter(Boolean)
                        .join(' • ');

                  return (
                    <button
                      key={id}
                      type="button"
                      className="my-ai-candidate-pill"
                      disabled={loading}
                      onClick={() => handlePick(c)}
                    >
                      <strong>{label}</strong>
                      {subtitle && <small>{subtitle}</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slot-filling choice chips */}
          {chips.length > 0 && (
            <div className="my-ai-chips-container">
              {chips.map((c) => (
                <button
                  key={`${c.label}-${c.value || ''}`}
                  type="button"
                  className="my-ai-choice-chip"
                  disabled={loading}
                  onClick={() => handleChip(c)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Inline Task Preview Card on Ready State */}
          {status === 'ready' && result?.preview && (
            <div className="my-ai-preview-card-wrap">
              {readyCountdown !== null && (
                <div className="my-ai-countdown-banner">
                  <Clock size={14} className="countdown-clock-icon" />
                  <span>Task create ho raha hai… ({readyCountdown}s)</span>
                  <button
                    type="button"
                    className="my-ai-cancel-countdown-btn"
                    onClick={cancelReadyCountdown}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <TaskPreviewCard
                preview={result.preview}
                files={files}
                busy={creating}
                uploadProgress={uploadProgress}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Attachment tray strip */}
          {(files.length > 0 || voiceNoteBlob) && (
            <div className="my-ai-attached-strip">
              <span className="my-ai-attached-label">Attachments ({files.length}):</span>
              <div className="my-ai-attached-chips">
                {files.map((file, idx) => (
                  <div key={idx} className="my-ai-attached-chip">
                    <span>{file.type?.startsWith('image/') ? '🖼️' : '📄'} {file.name}</span>
                    <button
                      type="button"
                      className="my-ai-remove-file-btn"
                      onClick={() => handleRemoveFile(idx)}
                      title="Hatao"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {voiceNoteBlob && (
                  <div className="my-ai-attached-chip voice-chip">
                    <span>🎙️ Voice Note</span>
                    <button
                      type="button"
                      className="my-ai-remove-file-btn"
                      onClick={() => setVoiceNoteBlob(null)}
                      title="Hatao"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachment errors & speech errors */}
          {fileError && <p className="my-ai-form-note err">{fileError}</p>}
          {micErrorText && <p className="my-ai-form-note err">{micErrorText}</p>}
          {speechNotice && <p className="my-ai-form-note notice">{speechNotice}</p>}
          {browserHint && <p className="my-ai-form-note hint">{browserHint}</p>}

          {/* Live speech transcript shown as interim user bubble (replaced by final user text) */}
          {interim && (
            <div className="my-ai-message-row user interim-row">
              <div className="my-ai-bubble user interim-bubble">
                <span>{interim}</span>
                <span className="my-ai-interim-pulse" />
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>
      </main>

      {/* =====================================================================
          REGION 3: TRANSPARENT VOICE ORB OVERLAY
          Centered above composer, pointer-events none, transparent canvas.
          Message stream extends underneath with soft radial mask.
          ===================================================================== */}
      <div className="my-ai-orb-overlay" aria-hidden="true">
        <Suspense fallback={<CssOrbFallback orbState={orbState} onClick={handleOrbClick} />}>
          {hasWebGL ? (
            <AuraFluidRing orbState={orbState} onClick={handleOrbClick} size={isExpanded ? 185 : 130} />
          ) : (
            <CssOrbFallback orbState={orbState} onClick={handleOrbClick} />
          )}
        </Suspense>
      </div>

      {/* =====================================================================
          REGION 4: PINNED COMPOSER DOCK
          Always pinned at bottom, flex-shrink 0, clean container
          ===================================================================== */}
      <footer className="my-ai-composer-dock">
        <form className="my-ai-composer-form" onSubmit={onSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            multiple={result?.payload?.maxFiles !== 1}
            accept={result?.payload?.accept ? (Array.isArray(result.payload.accept) ? result.payload.accept.join(',') : result.payload.accept) : ".jpg,.jpeg,.png,.pdf,.mp4,.mp3,.wav,.avi,.mkv,.webm,image/*,application/pdf,video/*,audio/*"}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />

          <div className="my-ai-composer-pill">
            {/* Paperclip attachment button */}
            <button
              type="button"
              className={`my-ai-composer-icon-btn ${highlightPaperclip ? 'highlighted' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="File ya photo attach karein"
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {/* Mic listening toggle & active red indicator */}
            <button
              type="button"
              className={`my-ai-composer-icon-btn mic-btn ${listening ? 'is-listening' : ''} ${recordingVoiceNote ? 'recording' : ''}`}
              onClick={handleOrbClick}
              title={listening ? 'AI sun raha hai (Tap to pause)' : 'Mic chalu karein'}
              aria-label={listening ? 'Mic on, listening' : 'Mic off'}
            >
              <Mic size={18} className={listening || recordingVoiceNote ? 'text-red-600' : ''} />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              className="my-ai-composer-input"
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                cancelReadyCountdown();
                if (val.trim() && listening) {
                  stop('typing');
                }
              }}
              placeholder={
                isTranscribing
                  ? 'Transcribing…'
                  : loading
                  ? 'Thinking…'
                  : listening
                  ? 'Listening… (Mic ON)'
                  : 'Task likhein ya mic dabayein…'
              }
              maxLength={600}
            />

            {/* Send / Stop Button: when listening, acts as immediate Stop/Send */}
            {listening ? (
              <button
                type="button"
                className="my-ai-composer-submit-btn is-stop-btn"
                onClick={() => stop('user-stop')}
                title="Stop recording and transcribe"
                aria-label="Stop recording"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
              >
                <Square size={13} fill="#fff" />
              </button>
            ) : (
              <button
                type="submit"
                className="my-ai-composer-submit-btn"
                disabled={loading || isTranscribing || !input.trim()}
                title="Send message"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            )}
          </div>
        </form>

        {/* Dev-only live VAD diagnostic overlay */}
        {import.meta.env?.DEV && listening && vadStats && (
          <div style={{
            padding: '3px 8px',
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#34d399',
            fontSize: '10.5px',
            fontFamily: 'monospace',
            borderTop: '1px solid #374151',
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <span>RMS: <strong>{vadStats.rms}</strong></span>
            <span>Floor: <strong>{vadStats.noiseFloor}</strong></span>
            <span>SpeechThresh: <strong>{vadStats.speechThreshold}</strong></span>
            <span>SilThresh: <strong>{vadStats.silenceThreshold}</strong></span>
            <span>SilTimer: <strong>{vadStats.silenceMs}ms / 1350ms</strong></span>
            <span>SpeechDur: <strong>{vadStats.speechDurationMs}ms / 600ms</strong></span>
          </div>
        )}
      </footer>
    </div>
  );
}
