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
  MicOff,
  Send,
  Paperclip,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock,
  Square,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useMyAi } from '../../context/MyAiContext';
import useTaskAgentSession from '../../hooks/useTaskAgentSession';
import { formatCandidateDate, shouldShowDebugOverlay } from '../../hooks/taskAgentPureLogic';
import TaskPreviewCard from './TaskPreviewCard';
import GptVoiceOrb from './GptVoiceOrb';
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
 * Formats markdown syntax (**bold**, *italic*, list bullets) into React elements
 * so words appear truly bold and clean instead of displaying raw asterisks (** or *).
 */
function renderFormattedMarkdown(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return lines.map((rawLine, lineIdx) => {
    // 1. Convert leading markdown list bullets (* or - or + followed by space) into clean bullet character •
    const line = rawLine.replace(/^(\s*)[*+-]\s+/g, '$1• ');

    const parts = [];
    let lastIndex = 0;
    // Matches: 1) ***bold-italic***, 2) **bold**, 3) *italic*, 4) _italic_
    const regex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*\s](?:[^*]*[^*\s])?)\*|_([^_]+)_)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        // Strip any stray/unclosed asterisks so no raw asterisks leak to the user
        const plain = line.substring(lastIndex, match.index).replace(/\*+/g, '');
        if (plain) parts.push(plain);
      }

      if (match[2]) {
        // ***bold-italic***
        parts.push(
          <strong key={`${lineIdx}-${match.index}`} className="my-ai-bold">
            <em className="my-ai-em">{match[2].trim()}</em>
          </strong>
        );
      } else if (match[3]) {
        // **bold**
        parts.push(
          <strong key={`${lineIdx}-${match.index}`} className="my-ai-bold">
            {match[3].trim()}
          </strong>
        );
      } else if (match[4]) {
        // *italic*
        parts.push(
          <em key={`${lineIdx}-${match.index}`} className="my-ai-em">
            {match[4].trim()}
          </em>
        );
      } else if (match[5]) {
        // _italic_
        parts.push(
          <em key={`${lineIdx}-${match.index}`} className="my-ai-em">
            {match[5].trim()}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      const remainder = line.substring(lastIndex);
      // If remainder starts with unclosed **text, turn it into bold
      if (/^\s*\*\*([^*]+)/.test(remainder)) {
        const boldMatch = remainder.match(/^\s*\*\*([^*]+)/);
        parts.push(
          <strong key={`${lineIdx}-trailing`} className="my-ai-bold">
            {boldMatch[1].trim()}
          </strong>
        );
      } else {
        // Strip any dangling asterisks
        const cleanRemainder = remainder.replace(/\*+/g, '');
        if (cleanRemainder) parts.push(cleanRemainder);
      }
    }

    return (
      <React.Fragment key={lineIdx}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
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
      <span className="my-ai-assistant-body">{renderFormattedMarkdown(displayedText)}</span>
      {isLatest && displayedText.length < text.length && <span className="my-ai-cursor">|</span>}
    </div>
  );
}

function BulkTaskPreviewCard({ bulkPreview, busy, onConfirm, onEdit, onCancel, isPast }) {
  if (!bulkPreview || !Array.isArray(bulkPreview.validTasks)) return null;
  const isAssigned = bulkPreview.taskType === 'assigned';

  return (
    <div style={{
      margin: '8px 0',
      padding: '14px 16px',
      backgroundColor: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
      fontSize: '13px',
      opacity: isPast ? 0.75 : 1,
      width: '100%',
      maxWidth: '620px'
    }}>
      {/* Header with Type & Count Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
            📋 Bulk Tasks Review
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: isAssigned ? '#e0e7ff' : '#ecfdf5',
            color: isAssigned ? '#3730a3' : '#065f46',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isAssigned ? '👥 Assigned Tasks' : '📄 Personal Tasks'}
          </span>
          {isPast && (
            <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
              (Previous Version)
            </span>
          )}
        </div>
        <span style={{
          fontSize: '11px',
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: bulkPreview.invalidCount > 0 ? '#fef3c7' : '#dcfce7',
          color: bulkPreview.invalidCount > 0 ? '#b45309' : '#15803d',
          fontWeight: 600
        }}>
          {bulkPreview.validCount} Valid {bulkPreview.invalidCount > 0 ? `• ${bulkPreview.invalidCount} Incomplete` : ''}
        </span>
      </div>

      {/* Tasks List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '220px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {bulkPreview.validTasks.map((vt, i) => {
          const assigneeName = typeof vt.assignee === 'object'
            ? (vt.assignee?.name || vt.assignee?.email || vt.assignee?.id)
            : (vt.assignee ? String(vt.assignee) : null);

          return (
            <div key={i} style={{
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                    #{i + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={vt.title}>
                    {vt.title}
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: vt.priority === 'high' ? '#fee2e2' : vt.priority === 'low' ? '#f1f5f9' : '#fef3c7',
                  color: vt.priority === 'high' ? '#dc2626' : vt.priority === 'low' ? '#475569' : '#b45309',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  flexShrink: 0
                }}>
                  {vt.priority || 'Medium'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', flexWrap: 'wrap', gap: '4px' }}>
                {isAssigned && assigneeName && (
                  <span>👤 <strong>{assigneeName}</strong></span>
                )}
                <span>
                  📅 {vt.dueDate || (vt.dueDateTime ? new Date(vt.dueDateTime).toLocaleDateString() : 'Today')} {vt.dueTime ? `⏰ ${vt.dueTime}` : ''}
                </span>
                {vt.repeatPattern && vt.repeatPattern !== 'none' && (
                  <span style={{ color: '#0284c7' }}>🔄 {typeof vt.repeatPattern === 'object' ? JSON.stringify(vt.repeatPattern) : String(vt.repeatPattern)}</span>
                )}
              </div>

              {vt.description && (
                <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={vt.description}>
                  {vt.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons: only active on latest card */}
      {!isPast && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || bulkPreview.validTasks.length === 0}
            style={{
              flex: 2,
              padding: '8px 12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: (busy || bulkPreview.validTasks.length === 0) ? 0.6 : 1
            }}
          >
            ✓ Create Tasks ({bulkPreview.validTasks.length})
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            style={{
              flex: 1,
              padding: '8px 10px',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              onCancel?.();
            }}
            style={{
              flex: 1,
              padding: '8px 10px',
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            ❌ Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyAiChatView({ onBack, onClose }) {
  const { user: authUser } = useAuth();
  const { isExpanded, toggleExpanded, closeMyAi } = useMyAi();
  const cancelSpeechRef = useRef(null);

  const handleClose = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    cancelSpeechRef.current?.();
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
    startWithMic: true,
    user: authUser,
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
    micSkipReason,
    micPermission,
    lastTranscriptDiag,
    pendingStartRef,
    userMuted,
    isTypingRef,
    isSpeaking,
    isTranscribing,
    speechError,
    speechNotice,
    setSpeechError,
    setNotice,
    cancelSpeech,
    recordingVoiceNote,
    voiceInfo,
    allVoices,
    speakDiag,
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
    start,
    stop,
    clearUserMute,
    vadStats,
    chatSessions,
    loadChatSession,
    deleteChatSession,
    startNewChat,
    isAiDisabled,
  } = session;

  cancelSpeechRef.current = cancelSpeech;

  const [showHistory, setShowHistory] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [selectedMultiChips, setSelectedMultiChips] = useState([]);
  const containerRef = useRef(null);
  const threadEndRef = useRef(null);
  const localInputRef = useRef(null);
  const inputRef = session?.inputRef || localInputRef;

  // Prevent background page from scrolling when scrolling inside AI assistant
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      const scrollable = el.querySelector('.my-ai-history-list') || el.querySelector('.my-ai-thread-scroll');
      if (!scrollable) {
        e.preventDefault();
        return;
      }

      const { deltaY } = e;
      const isScrollable = scrollable.scrollHeight > scrollable.clientHeight;

      if (!isScrollable) {
        e.preventDefault();
        return;
      }

      const atTop = scrollable.scrollTop <= 0 && deltaY < 0;
      const atBottom = Math.ceil(scrollable.scrollTop + scrollable.clientHeight) >= scrollable.scrollHeight && deltaY > 0;

      if (atTop || atBottom) {
        e.preventDefault();
        return;
      }

      // If wheel occurred outside scrollable thread (e.g. on header or composer), forward scroll directly
      if (!e.target.closest('.my-ai-thread-scroll') && !e.target.closest('.my-ai-history-list')) {
        e.preventDefault();
        scrollable.scrollTop += deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleEnterVoiceMode = () => {
    setIsVoiceMode(true);
    setAutoSpeak(true);
    clearUserMute();
    start({ force: true });
  };

  const handleExitVoiceMode = () => {
    setIsVoiceMode(false);
    if (listening) {
      stop('manual');
    }
    cancelSpeech();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleToggleVoiceMode = () => {
    if (isVoiceMode) {
      handleExitVoiceMode();
    } else {
      handleEnterVoiceMode();
    }
  };

  // Reset selected chips when moving to another field
  const currentField = result?.field;
  useEffect(() => {
    setSelectedMultiChips([]);
  }, [currentField]);

  const isMultiSelectFlow = Boolean(
    result?.field === 'services' ||
    result?.field === 'team' ||
    result?.field === 'projectManager' ||
    result?.field === 'members' ||
    chips.some((c) => c.action?.type === 'add_member' || c.action?.type === 'add_client_service') ||
    chips.some((c) => c.label === 'Done' || c.label === 'Ho gaya' || c.action?.type === 'finish_members' || c.action?.type === 'finish_client_services')
  );

  const handleChipClick = (c) => {
    if (!c) return;
    const isCancelAction = c.action?.type === 'cancel' || c.action?.type === 'cancel_bulk_tasks' || c.action?.type === 'cancel_pending_spreadsheet' || c.label === 'Cancel' || c.label === '❌ Cancel' || c.label === 'Abhi nahi';
    if (isCancelAction) {
      setSelectedMultiChips([]);
      handleCancel();
      return;
    }

    if (!isMultiSelectFlow) {
      handleChip(c);
      return;
    }

    const isHoGaya = c.label?.includes('Done') || c.label?.includes('Ho gaya') || c.action?.type === 'finish_members' || c.action?.type === 'finish_client_services';
    const isControlChip = c.label === 'Cancel' || c.label === 'Abhi nahi' || c.label === 'Sirf main' || c.label === 'Aur dikhao' || c.action?.type === 'cancel' || c.action?.type === 'cancel_bulk_tasks' || c.action?.type === 'show_more_members';

    if (isControlChip) {
      setSelectedMultiChips([]);
      handleChip(c);
      return;
    }

    if (isHoGaya) {
      if (selectedMultiChips.length > 0) {
        const isMemberField = Boolean(
          result?.field === 'team' ||
          result?.field === 'projectManager' ||
          result?.field === 'members' ||
          chips.some((ch) => ch.action?.type === 'add_member' || ch.action?.userId)
        );
        if (isMemberField) {
          sendTurn({
            action: {
              type: 'set_team_members',
              members: selectedMultiChips.map((ch) => ch.action?.name || ch.label.replace(/^[✓\s]+/, '').split(' (')[0].trim()),
              userIds: selectedMultiChips.map((ch) => ch.action?.userId).filter(Boolean),
            },
            display: selectedMultiChips.map((ch) => ch.action?.name || ch.label.replace(/^[✓\s]+/, '').split(' (')[0].trim()).join(', '),
            source: 'chip',
          });
        } else {
          sendTurn({
            action: {
              type: 'set_client_services',
              services: selectedMultiChips.map((ch) => ch.action?.service || ch.label.replace(/^[✓\s]+/, '')),
            },
            display: selectedMultiChips.map((ch) => ch.action?.service || ch.label.replace(/^[✓\s]+/, '')).join(', '),
            source: 'chip',
          });
        }
        setSelectedMultiChips([]);
      } else {
        handleChip(c);
      }
      return;
    }

    // Toggle chip in selectedMultiChips
    const chipKey = c.action?.name || c.action?.service || c.action?.userId || c.label;
    const isAlreadySelected = selectedMultiChips.some(
      (sc) => (sc.action?.name || sc.action?.service || sc.action?.userId || sc.label) === chipKey
    );

    if (isAlreadySelected) {
      setSelectedMultiChips((prev) =>
        prev.filter((sc) => (sc.action?.name || sc.action?.service || sc.action?.userId || sc.label) !== chipKey)
      );
    } else {
      setSelectedMultiChips((prev) => [...prev, c]);
    }
  };

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

  // Collapse textarea height back to single line whenever input is cleared (WhatsApp style)
  useEffect(() => {
    if (!input && inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input]);

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
  } else if (autoSpeak && userMuted) {
    statusText = 'Mic paused - sending your next message resumes it';
  } else if (autoSpeak) {
    statusText = 'Mic: auto';
  } else if (orbState === 'paused') {
    statusText = 'Tap to talk';
  }

  return (
    <div ref={containerRef} className={`my-ai-view-container ${isExpanded ? 'is-expanded' : ''} ${isVoiceMode ? 'is-voice-mode' : ''}`}>
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
            {isExpanded && <span className="my-ai-subtitle-badge">Assistant</span>}
          </div>

          {/* ChatGPT-style Voice Mode toggle pill right at the top */}
          <button
            type="button"
            className={`my-ai-voice-toggle-pill ${isVoiceMode ? 'active' : ''}`}
            onClick={handleToggleVoiceMode}
            title={isVoiceMode ? 'Voice Mode Active - Click to switch to Text Mode' : 'Switch to Voice Mode'}
          >
            <span className={`voice-toggle-dot ${isVoiceMode ? (listening ? 'listening' : orbState) : 'idle'}`} />
            <Mic size={13} className={isVoiceMode ? 'text-blue-500' : 'text-slate-500'} />
            <span>Voice Mode</span>
          </button>
        </div>

        <div className="my-ai-header-right">
          {/* Engine toggle & Language cycle: clean display in expanded view */}
          {isExpanded && (
            <>
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
                <span style={{ marginLeft: 3 }}>{engine === 'whisper' ? 'Whisper' : 'Browser'}</span>
              </button>

              <button
                type="button"
                className="my-ai-icon-btn lang-badge"
                onClick={cycleLanguage}
                title={`Language: ${lang === 'hi-IN' ? 'Hindi/Hinglish (hi-IN)' : lang === 'en-IN' ? 'English (en-IN)' : 'Auto-detect'}`}
              >
                {lang === 'hi-IN' ? 'हिं' : lang === 'en-IN' ? 'EN' : 'Auto'}
              </button>
            </>
          )}

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

          {/* Chat History Toggle (0 Groq tokens) */}
          <button
            type="button"
            className={`my-ai-icon-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory((prev) => !prev)}
            title="Chat History"
            aria-label="Chat History"
          >
            <Clock size={16} />
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
          REGION 1B: CHAT HISTORY DRAWER (ChatGPT style, 0 Groq API tokens)
          ===================================================================== */}
      {showHistory && (
        <div className="my-ai-history-drawer">
          <div className="my-ai-history-header">
            <div className="my-ai-history-title-wrap">
              <Clock size={16} className="my-ai-history-icon" />
              <h3>Chat History</h3>
            </div>
            <div className="my-ai-history-actions">
              <button
                type="button"
                className="my-ai-new-chat-btn"
                onClick={() => {
                  startNewChat();
                  setShowHistory(false);
                }}
                title="Start a fresh conversation"
              >
                <Plus size={14} /> New Chat
              </button>
              <button
                type="button"
                className="my-ai-icon-btn close-history-btn"
                onClick={() => setShowHistory(false)}
                title="Close History"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="my-ai-history-list">
            {(!chatSessions || chatSessions.length === 0) ? (
              <div className="my-ai-history-empty">
                <MessageSquare size={32} className="my-ai-history-empty-icon" />
                <p>No past chat history yet.</p>
                <span>Start chatting to save conversations locally!</span>
              </div>
            ) : (
              chatSessions.map((s) => (
                <div
                  key={s.id}
                  className="my-ai-history-item"
                  onClick={() => {
                    loadChatSession(s);
                    setShowHistory(false);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="my-ai-history-item-left">
                    <MessageSquare size={16} className="my-ai-history-item-icon" />
                    <div className="my-ai-history-item-content">
                      <span className="my-ai-history-item-title">{s.title || 'Conversation'}</span>
                      <span className="my-ai-history-item-time">
                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        {Array.isArray(s.messages) && ` • ${s.messages.length} msgs`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="my-ai-history-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChatSession(s.id);
                    }}
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          REGION 2: SCROLLABLE MESSAGE STREAM (flex: 1, overflow-y: auto)
          ===================================================================== */}
      <main className="my-ai-thread-scroll">
        <div className="my-ai-messages-list">
          {(() => {
            const lastPreviewIdx = messages.reduce((last, m, idx) => m.preview ? idx : last, -1);
            const lastBulkPreviewIdx = messages.reduce((last, m, idx) => m.bulkPreview ? idx : last, -1);
            return messages.map((m, idx) => {
              const isUser = m.role === 'user';
              const isLatestAssistant = !isUser && idx === messages.length - 1;
              const isPastPreview = Boolean(m.preview && idx < lastPreviewIdx);
              const isBulkActive = (status === 'bulk_preview' || Boolean(result?.bulkPreview));
              const isPastBulkPreview = !isBulkActive || Boolean(m.bulkPreview && idx < lastBulkPreviewIdx);

              return (
                <React.Fragment key={m.id || idx}>
                  {m.text && (
                    <div className={`my-ai-message-row ${isUser ? 'user' : 'assistant'}`}>
                      <div
                        className={`my-ai-bubble ${isUser ? 'user' : 'assistant'} ${m.isError ? 'error-bubble' : ''
                          }`}
                      >
                        {isUser ? (
                          <span>{renderFormattedMarkdown(m.text)}</span>
                        ) : (
                          <AssistantMessageContent
                            text={m.text}
                            isLatest={isLatestAssistant}
                            isError={m.isError}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {!isUser && m.preview && (
                    <div className="my-ai-message-row assistant preview-card-row">
                      <div className="my-ai-preview-card-wrap">
                        <TaskPreviewCard
                          preview={m.preview}
                          files={files}
                          busy={creating}
                          uploadProgress={uploadProgress}
                          onConfirm={() => handleConfirm(m.payload || result?.payload)}
                          onEdit={handleEdit}
                          onCancel={handleCancel}
                          isPast={isPastPreview}
                        />
                      </div>
                    </div>
                  )}

                  {!isUser && m.bulkPreview && (
                    <div className="my-ai-message-row assistant preview-card-row">
                      <div className="my-ai-preview-card-wrap" style={{ width: '100%', maxWidth: '640px' }}>
                        <BulkTaskPreviewCard
                          bulkPreview={m.bulkPreview}
                          busy={creating}
                          onConfirm={() => handleChipClick({
                            label: 'Create Tasks',
                            action: {
                              type: 'bulk_create_confirm',
                              tasks: m.bulkPreview.validTasks,
                              taskType: m.bulkPreview.taskType
                            }
                          })}
                          onEdit={() => handleChipClick({ label: 'Edit', action: { type: 'edit_bulk_tasks' } })}
                          onCancel={handleCancel}
                          isPast={isPastBulkPreview}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            });
          })()}

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



          {/* Slot-filling choice chips (hide redundant chips when preview card is displayed in ready state or bulk preview card) */}
          {!isAiDisabled && chips.length > 0 && status !== 'ready' && status !== 'bulk_preview' && !result?.bulkPreview && !chips.some((c) => c.action?.type === 'confirm') && (
            <div className="my-ai-chips-container">
              {(() => {
                const hasHoGayaInChips = chips.some(
                  (c) => c.label.includes('Done') || c.label.includes('Ho gaya') || c.action?.type === 'finish_members' || c.action?.type === 'finish_client_services'
                );

                const renderChipButton = (c, keyPrefix = '') => {
                  const chipKey = c.action?.name || c.action?.service || c.action?.userId || c.label;
                  const isSelected = selectedMultiChips.some(
                    (sc) => (sc.action?.name || sc.action?.service || sc.action?.userId || sc.label) === chipKey
                  );
                  const isHoGaya = c.label.includes('Done') || c.label.includes('Ho gaya') || c.action?.type === 'finish_members' || c.action?.type === 'finish_client_services';

                  let buttonLabel = c.label === 'Ho gaya' ? 'Done' : c.label;
                  if (isHoGaya && selectedMultiChips.length > 0) {
                    buttonLabel = `✓ Done (${selectedMultiChips.length} selected)`;
                  } else if (isSelected) {
                    buttonLabel = `✓ ${c.label.replace(/^[✓\s]+/, '')}`;
                  }

                  const chipClass = [
                    'my-ai-choice-chip',
                    isSelected ? 'is-selected' : '',
                    (isHoGaya && selectedMultiChips.length > 0) ? 'my-ai-submit-multi-chip' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <button
                      key={`${keyPrefix}${c.label}-${c.value || ''}-${c.action?.userId || ''}`}
                      type="button"
                      className={chipClass}
                      disabled={loading}
                      onClick={() => handleChipClick(c)}
                    >
                      {buttonLabel}
                    </button>
                  );
                };

                return (
                  <>
                    {isMultiSelectFlow && !hasHoGayaInChips && selectedMultiChips.length > 0 && (
                      <button
                        key="multi-submit-fallback"
                        type="button"
                        className="my-ai-choice-chip my-ai-submit-multi-chip"
                        disabled={loading}
                        onClick={() => handleChipClick({ label: 'Done', action: { type: 'finish_client_services' } })}
                      >
                        {`✓ Done (${selectedMultiChips.length} selected)`}
                      </button>
                    )}
                    {chips.map((c) => renderChipButton(c))}
                  </>
                );
              })()}
            </div>
          )}

          {/* Inline Task Preview Card on Ready State (only if no message holds it) */}
          {status === 'ready' && result?.preview && !messages.some(m => m.preview) && (
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

          {/* Attachment tray strip (hidden when preview card is displayed in ready state) */}
          {(files.length > 0 || voiceNoteBlob) && status !== 'ready' && !messages.some(m => m.preview) && (
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

          {/* Centered ChatGPT Voice Orb Stage (visible in voice mode with previous chat visible above) */}
          {isVoiceMode && (
            <div className="my-ai-voice-orb-stage animate-fadeIn">
              <div
                className="my-ai-voice-orb-wrapper"
                onClick={handleOrbClick}
                role="button"
                tabIndex={0}
                title={listening ? 'Tap orb to pause' : 'Tap orb to speak'}
              >
                <GptVoiceOrb
                  state={orbState}
                  onClick={handleOrbClick}
                  size={isExpanded ? 160 : 125}
                />
              </div>

              {/* Status and dynamic transcript feedback */}
              <div className="my-ai-voice-orb-caption">
                <span className={`my-ai-voice-status-pill ${orbState}`}>
                  <span className="voice-status-pulse-dot" />
                  {orbState === 'listening'
                    ? 'Listening…'
                    : orbState === 'thinking'
                    ? 'Thinking…'
                    : orbState === 'speaking'
                    ? 'Speaking…'
                    : 'Paused'}
                </span>
                {interim ? (
                  <span className="live-transcript">"{interim}"</span>
                ) : isSpeaking ? (
                  <span className="ai-speech-hint">CIIS AI bol raha hai…</span>
                ) : (
                  <span className="idle-speech-hint">Aap boliye, sun raha hoon</span>
                )}
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>
      </main>

      {/* =====================================================================
          REGION 4: PINNED COMPOSER DOCK
          Always pinned at bottom, flex-shrink 0, clean container
          When in Voice Mode, displays the ChatGPT floating dock (+ Type, Mic, Close)
          ===================================================================== */}
      <footer className="my-ai-composer-dock">
        {isVoiceMode ? (
          <div className="my-ai-voice-dock animate-fadeIn">
            <button
              type="button"
              className="my-ai-voice-dock-type-btn"
              onClick={handleExitVoiceMode}
              title="Switch to typing"
            >
              <Plus size={16} />
              <span>Task likhein ya type karein…</span>
            </button>
            <div className="my-ai-voice-dock-controls">
              <button
                type="button"
                className={`my-ai-voice-dock-mic-btn ${listening ? 'active' : 'muted'}`}
                onClick={() => {
                  if (listening) {
                    stop('silence');
                  } else {
                    clearUserMute();
                    start({ force: true });
                  }
                }}
                title={listening ? 'Done speaking (Send)' : 'Tap to speak'}
              >
                {listening ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
              <button
                type="button"
                className="my-ai-voice-dock-close-btn"
                onClick={handleExitVoiceMode}
                title="End voice mode"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form className="my-ai-composer-form" onSubmit={onSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            multiple={result?.payload?.maxFiles !== 1}
            accept={result?.payload?.accept ? (Array.isArray(result.payload.accept) ? result.payload.accept.join(',') : result.payload.accept) : ".csv,.xlsx,.xls,.jpg,.jpeg,.png,.pdf,.mp4,.mp3,.wav,.avi,.mkv,.webm,image/*,application/pdf,video/*,audio/*"}
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
              disabled={isAiDisabled}
              title={isAiDisabled ? 'AI Assistant access disabled by admin' : 'File ya photo attach karein'}
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {/* Mic listening toggle & active indicator */}
            <button
              type="button"
              className={`my-ai-composer-icon-btn mic-btn ${listening ? 'is-listening' : ''} ${recordingVoiceNote ? 'recording' : ''}`}
              disabled={isAiDisabled}
              onClick={() => {
                if (isAiDisabled) return;
                if (isSpeaking) {
                  cancelSpeech();
                }
                handleEnterVoiceMode();
              }}
              title={isAiDisabled ? 'AI Assistant access disabled by admin' : 'Voice Mode start karein'}
              aria-label="Start Voice Mode"
            >
              <Mic size={18} className={listening || recordingVoiceNote ? 'text-blue-500' : ''} />
            </button>

            {/* WhatsApp-style auto-expanding multi-line textarea */}
            <textarea
              ref={inputRef}
              rows={1}
              className="my-ai-composer-input"
              value={input}
              disabled={isAiDisabled}
              onChange={(e) => {
                if (isAiDisabled) return;
                const val = e.target.value;
                setInput(val);
                if (isTypingRef) isTypingRef.current = Boolean(val && val.trim().length > 0);
                cancelReadyCountdown();
                if (isSpeaking) {
                  cancelSpeech();
                }
                if (val.trim() && listening) {
                  stop('typing');
                }
                // Auto-expand like WhatsApp (up to max-height 120px)
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (isAiDisabled) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading && !isTranscribing && input.trim()) {
                    onSubmit(e);
                    if (inputRef.current) {
                      inputRef.current.style.height = 'auto';
                    }
                  }
                }
              }}
              placeholder={
                isAiDisabled
                  ? "You don't have access to use CIIS AI"
                  : isTranscribing
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
                onClick={() => stop('silence')}
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
                disabled={isAiDisabled || loading || isTranscribing || !input.trim()}
                title={isAiDisabled ? 'AI Assistant access disabled' : 'Send message'}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            )}
          </div>
          {autoSpeak && userMuted && !listening && !isSpeaking && (
            <div className="my-ai-mic-indicator-hint paused">
              <span>Mic paused - sending your next message resumes it</span>
            </div>
          )}
          {autoSpeak && !userMuted && !listening && !isSpeaking && (
            <div className="my-ai-mic-indicator-hint auto">
              <span>Mic: auto</span>
            </div>
          )}
        </form>
        )}

        {/* Dev-only live VAD diagnostic overlay - hidden by default unless ?aidebug=1 or localStorage 'ciis_ai_debug' === '1' */}
        {shouldShowDebugOverlay() && (
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
            <span>Mic State: <strong>{
              listening ? 'active'
                : (isSpeaking || (typeof window !== 'undefined' && window.__ciisVoiceSpeaking)) ? 'speaking'
                  : micSkipReason ? `idle - skipped: ${micSkipReason}`
                    : userMuted ? 'idle - skipped: muted'
                      : (isTypingRef?.current || input?.trim?.()) ? 'idle - skipped: typing'
                        : !autoSpeak ? 'idle - skipped: speaker off'
                          : (micPermission === 'denied' || speechError === 'not-allowed') ? 'idle - skipped: permission'
                            : 'idle'
            }</strong>
              {!listening && (
                <span style={{ marginLeft: 6, fontSize: '0.85em', opacity: 0.85 }}>
                  (speakerOn: {autoSpeak ? 'true' : 'false'}, awaitingAnswer: {(!status || ['needs_input', 'needs_disambiguation', 'ready', 'open', 'idle'].includes(status)) ? 'true' : 'false'}, muted: {userMuted ? 'true' : 'false'}, typing: {(isTypingRef?.current || input?.trim?.()) ? 'true' : 'false'}, listening: {listening ? 'true' : 'false'}, speaking: {(isSpeaking || (typeof window !== 'undefined' && window.__ciisVoiceSpeaking)) ? 'true' : 'false'}, permission: {micPermission || (speechError === 'not-allowed' ? 'denied' : 'prompt')}, pendingStart: {pendingStartRef?.current ? 'true' : 'false'})
                </span>
              )}
            </span>
            <div style={{ width: '100%', marginTop: 2, fontSize: '0.9em' }}>
              <span>Speak: <strong>{speakDiag ? (speakDiag.status === 'skipped' ? `skipped(${speakDiag.reason})` : speakDiag.status) : 'idle'}</strong></span>
            </div>
            <div style={{ width: '100%', marginTop: 2, fontSize: '0.9em' }}>
              <span>Voice: <strong>{voiceInfo?.name ? `${voiceInfo.name} (${voiceInfo.lang})${voiceInfo.isFallback ? ' [fallback]' : ''}` : 'none'}</strong>
                {allVoices && allVoices.length > 0 && (
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>| All: [{allVoices.map((v) => v.name).join(', ')}]</span>
                )}
              </span>
            </div>
            <div style={{ width: '100%', marginTop: 2, fontSize: '0.9em' }}>
              <span>Last Transcript: <strong>{
                lastTranscriptDiag ? (
                  lastTranscriptDiag.dropped
                    ? `"${lastTranscriptDiag.text || ''}" - DROPPED: ${lastTranscriptDiag.reason || 'other'} (${lastTranscriptDiag.durationMs || 0}ms)`
                    : `"${lastTranscriptDiag.text}" (${lastTranscriptDiag.durationMs || 0}ms)`
                ) : 'none'
              }</strong></span>
            </div>
            {listening && vadStats && (
              <>
                <span>RMS: <strong>{vadStats.rms}</strong></span>
                <span>Floor: <strong>{vadStats.noiseFloor}</strong></span>
                <span>SpeechThresh: <strong>{vadStats.speechThreshold}</strong></span>
                <span>SilThresh: <strong>{vadStats.silenceThreshold}</strong></span>
                <span>SilTimer: <strong>{vadStats.silenceMs}ms / 1350ms</strong></span>
                <span>SpeechDur: <strong>{vadStats.speechDurationMs}ms / 600ms</strong></span>
              </>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
