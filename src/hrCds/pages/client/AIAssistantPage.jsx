import React, { useState } from 'react';
import { FiSend, FiZap, FiSmartphone, FiMessageCircle } from 'react-icons/fi';
import './AIAssistantPage.css';

const prompts = [
  'Draft a campaign brief for my upcoming launch',
  'Summarize the current SEO performance',
  'Suggest priorities for the next quarter',
  'Create a client feedback email template'
];

const AIAssistantPage = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi there! I can help with strategy, copy, reports, and recommendations.' }
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages((current) => [...current, { role: 'user', text: query }, { role: 'assistant', text: 'Here is a polished response based on your input.' }]);
    setQuery('');
  };

  return (
    <section className="ClientPageBase-root">
      <div className="ClientPageBase-header">
        <div>
          <p>AI Assistant</p>
          <h1>Collaborate with an intelligent business partner</h1>
        </div>
      </div>

      <div className="ClientPageBase-ai-topics">
        <button><FiZap /> Quick Ideas</button>
        <button><FiSmartphone /> Content Drafts</button>
        <button><FiMessageCircle /> Support Copy</button>
      </div>

      <section className="ClientPageBase-card ClientPageBase-ai-card">
        <div className="ClientPageBase-ai-messages">
          {messages.map((message, index) => (
            <div key={index} className={`ClientPageBase-ai-message ${message.role}`}>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
        <div className="ClientPageBase-ai-input-row">
          <input
            placeholder="Ask the assistant to generate text, review strategy, or summarize a report"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend}><FiSend /></button>
        </div>
      </section>

      <section className="ClientPageBase-card ClientPageBase-insight-card">
        <h2>Some ways to use AI today</h2>
        <ul>
          <li>Optimize campaign messaging for high-conversion audiences</li>
          <li>Translate insights into action plans</li>
          <li>Generate monthly status updates</li>
          <li>Create onboarding and client communication copy</li>
        </ul>
      </section>
    </section>
  );
};

export default AIAssistantPage;
