import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  X,
  Mic,
  Send,
  Paperclip,
  Volume2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import TaskPreviewCard from './TaskPreviewCard';
import './MyAiChatView.css';

const AuraFluidRing = lazy(() => import('./AuraFluidRing'));

const MOCK_GREETING = `Namaste! Main CIIS AI Assistant hoon.

Task create karne ke liye mujhe ye jaankari chahiye:
1. Kiske liye (assignee - khud ke liye ya kisi aur ke liye)
2. Task ka naam (zaroori)
3. Description
4. Due date aur time (zaroori)
5. Priority (Low / Medium / High)
6. Status (Pending / In Progress / Completed / On Hold)
7. Reminder
8. Priority Days
9. Repeat Task
10. Checkpoints
11. Attachments (photo / file / voice note)

Aap sab ek saath bol sakte hain ya main ek ek karke poochunga. Jo nahi dena, 'koi nahi' bol dein, wo blank rahega.`;

const MOCK_PREVIEW = {
  title: 'Client proposal review meeting',
  description: 'Discuss Q4 deliverables and final proposal pricing with team',
  assigneeName: 'Kanika Sharma',
  dueDateTime: '2026-10-24T18:00:00+05:30',
  priority: 'High',
  status: 'Pending',
  reminder: true,
  checkpoints: ['Check budget figures', 'Slide deck review', 'Approval signature'],
};

const MOCK_CANDIDATES = [
  { id: 'usr_1', name: 'Kanika Sharma', jobRole: 'HR Executive', department: 'Human Resources' },
  { id: 'usr_2', name: 'Kanika Verma', jobRole: 'Telecaller', department: 'Sales' },
];

const LONG_MESSAGES = [
  { id: 1, role: 'assistant', text: MOCK_GREETING },
  { id: 2, role: 'user', text: 'Kal subah 10 baje ek task schedule kar do.' },
  { id: 3, role: 'assistant', text: 'Ji, task ka title kya rakhna chahenge?' },
  { id: 4, role: 'user', text: 'Quarterly financial audit presentation and client deck preparation' },
  { id: 5, role: 'assistant', text: 'Kise assign karna hai ye task? Aur priority kya hogi?' },
  { id: 6, role: 'user', text: 'Kanika Sharma ko assign karo, priority high rahegi.' },
  { id: 7, role: 'assistant', text: 'Due date kal shaam 6 baje set kar doon ya subah 10 baje hi?' },
  { id: 8, role: 'user', text: 'Kal shaam 6 baje tak ka time de do.' },
  { id: 9, role: 'assistant', text: 'Kya koi checkpoints ya reminders add karne hain?' },
  { id: 10, role: 'user', text: 'Haan, reminder 1 ghante pehle hona chahiye, aur checkpoints me balance sheet verification daal do.' },
  { id: 11, role: 'assistant', text: 'Main summary draft kar rahi hoon. Koi files attach karni hain?' },
  { id: 12, role: 'user', text: 'Nahi, abhi koi file nahi hai, task confirm karo.' },
  { id: 13, role: 'assistant', text: 'Task summary check karein aur confirm karein.' },
];

export default function DevMyAiPreview() {
  const [scenario, setScenario] = useState('long-middle'); // 'long-middle' | 'long-bottom' | 'listening' | 'thinking' | 'speaking' | 'ready' | 'greeting' | 'error'
  const [isExpanded, setIsExpanded] = useState(false);
  const [smallHeightMode, setSmallHeightMode] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const scrollContainerRef = useRef(null);

  // Determine state parameters based on active scenario
  let orbState = 'paused';
  let statusText = 'Tap to talk';
  let messages = [];
  let showChips = false;
  let candidates = [];
  let isReady = false;
  let isThinking = false;
  let interimText = '';

  if (scenario === 'long-middle') {
    messages = LONG_MESSAGES;
    orbState = 'listening';
    statusText = 'Listening...';
  } else if (scenario === 'long-bottom') {
    messages = LONG_MESSAGES;
    orbState = 'listening';
    statusText = 'Listening...';
  } else if (scenario === 'listening') {
    messages = [
      { id: 1, role: 'assistant', text: MOCK_GREETING },
      { id: 2, role: 'user', text: 'Kanika ko ek task assign karo' },
      { id: 3, role: 'assistant', text: 'Task ka title aur due date batayein?' },
    ];
    interimText = 'Kal shaam 6 baje audit review meeting karwani hai';
    orbState = 'listening';
    statusText = 'Listening...';
  } else if (scenario === 'thinking') {
    messages = [
      { id: 1, role: 'assistant', text: MOCK_GREETING },
      { id: 2, role: 'user', text: 'Kal subah 10 baje team meeting rakh do' },
    ];
    isThinking = true;
    orbState = 'thinking';
    statusText = 'Thinking...';
  } else if (scenario === 'speaking') {
    messages = [
      { id: 1, role: 'assistant', text: MOCK_GREETING },
      { id: 2, role: 'user', text: 'Kal subah 10 baje team meeting rakh do' },
      { id: 3, role: 'assistant', text: 'Team meeting ka description ya koi agenda jodna chahenge?' },
    ];
    orbState = 'speaking';
    statusText = 'Speaking...';
  } else if (scenario === 'ready') {
    messages = [
      { id: 1, role: 'assistant', text: MOCK_GREETING },
      { id: 2, role: 'user', text: 'Kanika ko assign kardo kal shaam 6 baje high priority' },
      { id: 3, role: 'assistant', text: 'Task summary ready hai. Kya ise create kar doon?' },
    ];
    isReady = true;
    orbState = 'listening';
    statusText = 'Listening...';
  } else if (scenario === 'greeting') {
    messages = [{ id: 1, role: 'assistant', text: MOCK_GREETING }];
    showChips = true;
    orbState = 'paused';
    statusText = 'Tap to talk';
  } else if (scenario === 'error') {
    messages = [
      { id: 1, role: 'assistant', text: MOCK_GREETING },
      { id: 2, role: 'user', text: 'Create task' },
      { id: 3, role: 'assistant', text: 'Request timeout ho gaya (25s). AI se response nahi mila.', isError: true },
    ];
    orbState = 'paused';
    statusText = 'Tap to talk';
  }

  // Handle scrolling for middle vs bottom verification scenarios
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (scenario === 'long-middle') {
      setTimeout(() => {
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      }, 50);
    } else if (scenario === 'long-bottom') {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, [scenario]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Dev Control Toolbar */}
      <div style={{ background: '#1e293b', padding: '14px 18px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px', maxWidth: '880px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>🛠️ CIIS AI DEV VERIFICATION PREVIEW</span>
            <span style={{ fontSize: '11px', background: '#0369a1', color: '#ffffff', padding: '2px 8px', borderRadius: '6px' }}>Dev Only (import.meta.env.DEV)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSmallHeightMode((prev) => !prev)}
              style={{ background: smallHeightMode ? '#ea580c' : '#334155', color: '#ffffff', border: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              title="Toggle small viewport height simulation (520px)"
            >
              {smallHeightMode ? 'Height: 520px (Simulated Small)' : 'Height: Default'}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              style={{ background: isExpanded ? '#2563eb' : '#334155', color: '#ffffff', border: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            >
              {isExpanded ? 'Collapse to Compact (390px)' : 'Expand Full Size (840px)'}
            </button>
          </div>
        </div>

        {/* Scenario Switcher Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'long-middle', label: '1. Scrolled Middle (Header Fixed + Radial Mask)' },
            { id: 'long-bottom', label: '2. Scrolled Bottom (Rests Above Orb)' },
            { id: 'listening', label: '3. Listening (Interim Bubble)' },
            { id: 'thinking', label: '4. Thinking State' },
            { id: 'speaking', label: '5. Speaking State (Active Orb)' },
            { id: 'ready', label: '6. Ready State (Preview Card)' },
            { id: 'greeting', label: '7. Greeting + Chips' },
            { id: 'error', label: '8. Visible Error Bubble' },
          ].map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setScenario(sc.id)}
              style={{
                background: scenario === sc.id ? '#38bdf8' : '#0f172a',
                color: scenario === sc.id ? '#0f172a' : '#94a3b8',
                border: '1px solid',
                borderColor: scenario === sc.id ? '#38bdf8' : '#334155',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Container (Simulating .fb-messenger-dropdown) */}
      <div
        className={`fb-messenger-dropdown ${isExpanded ? 'is-expanded' : ''}`}
        style={{
          position: 'relative',
          bottom: 'auto',
          right: 'auto',
          width: isExpanded ? 'min(840px, calc(100vw - 32px))' : '390px',
          height: smallHeightMode
            ? '520px'
            : isExpanded
            ? 'min(780px, calc(100dvh - 120px))'
            : '620px',
          maxHeight: smallHeightMode ? '520px' : 'calc(100dvh - 120px)',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className={`my-ai-view-container ${isExpanded ? 'is-expanded' : ''}`}>
          {/* Header (Always flex-shrink: 0 and visible) */}
          <header className="my-ai-header">
            <div className="my-ai-header-left">
              <button type="button" className="my-ai-back-btn" title="Back to chats" aria-label="Back to chats">
                <ChevronLeft size={20} />
              </button>
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
              <span className="my-ai-icon-btn">🎙️ Whisper</span>
              <span className="my-ai-icon-btn lang-badge">हिं</span>
              <span className="my-ai-icon-btn"><Volume2 size={16} /></span>
              <button
                type="button"
                className="my-ai-icon-btn"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? 'Collapse popup' : 'Expand full screen'}
                aria-label={isExpanded ? 'Collapse popup' : 'Expand full screen'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button type="button" className="my-ai-icon-btn close-btn" title="Close CIIS AI" aria-label="Close CIIS AI">
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Scrollable Message Area (The ONLY scroll container: flex 1 1 0, min-height 0, overflow-y auto) */}
          <main ref={scrollContainerRef} className="my-ai-thread-scroll">
            <div className="my-ai-messages-list">
              {messages.map((m) => (
                <div key={m.id} className={`my-ai-message-row ${m.role}`}>
                  <div className={`my-ai-bubble ${m.role} ${m.isError ? 'error-bubble' : ''}`}>
                    {m.isError ? (
                      <div className="my-ai-assistant-text is-error">
                        <AlertCircle size={15} className="my-ai-error-icon" />
                        <span>{m.text}</span>
                      </div>
                    ) : (
                      <span>{m.text}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Live interim user speech bubble */}
              {interimText && (
                <div className="my-ai-message-row user interim-row">
                  <div className="my-ai-bubble user interim-bubble">
                    <span>{interimText}</span>
                    <span className="my-ai-interim-pulse" />
                  </div>
                </div>
              )}

              {showChips && (
                <div className="my-ai-example-chips-tray">
                  <span className="my-ai-example-chips-heading">
                    <Sparkles size={13} /> Try asking:
                  </span>
                  <div className="my-ai-example-chips-list">
                    <button type="button" className="my-ai-example-chip" onClick={() => setScenario('thinking')}>
                      Kal subah 10 baje team meeting rakh do
                    </button>
                    <button type="button" className="my-ai-example-chip" onClick={() => setScenario('listening')}>
                      Urgent task banao: Client proposal review
                    </button>
                    <button type="button" className="my-ai-example-chip" onClick={() => setScenario('ready')}>
                      Call follow-up task 2 din baad
                    </button>
                  </div>
                </div>
              )}

              {isThinking && (
                <div className="my-ai-message-row assistant">
                  <div className="my-ai-bubble assistant thinking-bubble">
                    <span className="my-ai-pulse-dot" />
                    <span>Soch raha hoon…</span>
                  </div>
                </div>
              )}

              {candidates.length > 0 && (
                <div className="my-ai-candidates-tray">
                  <span className="my-ai-candidates-label">Kise assign karna hai?</span>
                  <div className="my-ai-candidates-list">
                    {candidates.map((c) => (
                      <button key={c.id} type="button" className="my-ai-candidate-pill" onClick={() => setScenario('ready')}>
                        <strong>{c.name}</strong>
                        <small>{c.jobRole} • {c.department}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isReady && (
                <div className="my-ai-preview-card-wrap">
                  <div className="my-ai-countdown-banner">
                    <Clock size={14} className="countdown-clock-icon" />
                    <span>Task create ho raha hai… (3s)</span>
                    <button type="button" className="my-ai-cancel-countdown-btn" onClick={() => setScenario('greeting')}>
                      Cancel
                    </button>
                  </div>
                  <TaskPreviewCard
                    preview={MOCK_PREVIEW}
                    files={[]}
                    busy={false}
                    uploadProgress={null}
                    onConfirm={() => alert('Task confirmed!')}
                    onEdit={() => setScenario('speaking')}
                    onCancel={() => setScenario('greeting')}
                  />
                </div>
              )}
            </div>
          </main>

          {/* Region 3: Transparent Voice Orb Overlay centered above composer */}
          <div className="my-ai-orb-overlay" aria-hidden="true">
            <Suspense fallback={<div className={`my-ai-css-orb ${orbState}`} />}>
              <AuraFluidRing orbState={orbState} onClick={() => {}} size={isExpanded ? 185 : 130} />
            </Suspense>
          </div>

          {/* Region 4: Pinned Composer Dock */}
          <footer className="my-ai-composer-dock">
            <form className="my-ai-composer-form" onSubmit={(e) => e.preventDefault()}>
              <div className="my-ai-composer-pill">
                <button type="button" className="my-ai-composer-icon-btn" title="Attach file" aria-label="Attach file">
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  className={`my-ai-composer-icon-btn ${scenario === 'listening' ? 'is-listening' : ''}`}
                  title="Mic chalu hai"
                  aria-label="Mic listening"
                >
                  <Mic size={18} className={scenario === 'listening' ? 'text-red-600' : ''} />
                </button>
                <input
                  className="my-ai-composer-input"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={
                    scenario === 'listening'
                      ? 'Sun raha hoon…'
                      : scenario === 'thinking'
                      ? 'Samajh raha hoon…'
                      : 'Task likhein ya bolein…'
                  }
                />
                <button type="submit" className="my-ai-composer-submit-btn" disabled={!inputVal.trim()} aria-label="Send">
                  <Send size={15} />
                </button>
              </div>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
}
