import React, { useRef, useState } from 'react';
import AIChatDrawer from './AIChatDrawer';
import './AIAssistant.css';

export default function AIQuickWidget() {
    const [open, setOpen] = useState(false);
    const drawerRef = useRef(null);

    const handleVoiceClick = () => {
        setOpen(true);
        // Start microphone synchronously inside click call stack
        drawerRef.current?.startVoiceMode?.();
    };

    return (
        <>
            <div className="ai-scope">
                <div className="ai-card">
                    <div className="ai-card-head">
                        <h3 className="ai-card-title">⚡ AI Assistant</h3>
                        <span className="ai-live">LIVE</span>
                    </div>
                    <button
                        type="button"
                        className="ai-voice-main-btn"
                        onClick={handleVoiceClick}
                        title="Voice Task Agent"
                    >
                        🎙️ Voice Task Agent
                    </button>
                </div>
            </div>

            <AIChatDrawer
                ref={drawerRef}
                open={open}
                variant="voice"
                startWithMic={true}
                onClose={() => setOpen(false)}
            />
        </>
    );
}