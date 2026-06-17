import React, { useState } from 'react';
import { FiSend, FiZap, FiSmartphone, FiMessageCircle } from 'react-icons/fi';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  calculateTaskStats,
  getClientDisplayName,
  getTaskTitle,
  useClientPortalData
} from '../../utils/clientPortalData';
import './AIAssistantPage.css';

const AIAssistantPage = () => {
  const { client, services, tasks, loading } = useClientPortalData();
  const clientName = getClientDisplayName(client);
  const stats = calculateTaskStats(tasks);
  const prompts = [
    `Summarize ${clientName} current services`,
    `Create a status update for ${services[0] || 'my service'}`,
    `List overdue and pending task priorities`,
    `Draft a client email about ${getTaskTitle(tasks[0])}`
  ];
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi ${clientName}! I can help with your ${services.length} services, ${stats.totalTasks} tasks, reports, and recommendations.` }
  ]);

  if (loading) {
    return <CIISLoader />;
  }

  const handleSend = () => {
    if (!query.trim()) return;
    const serviceSummary = services.length ? services.join(', ') : 'no active services found';
    setMessages((current) => [
      ...current,
      { role: 'user', text: query },
      {
        role: 'assistant',
        text: `For ${clientName}: active services are ${serviceSummary}. Current task summary is ${stats.completedTasks} completed, ${stats.pendingTasks} pending, and ${stats.overdueTasks} overdue.`
      }
    ]);
    setQuery('');
  };

  return (
    <section className="ClientPageBase-root">
      <div className="ClientPageBase-header">
        <div>
          <p>AI Assistant</p>
          <h1>Collaborate with an intelligent business partner for {clientName}</h1>
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
          {prompts.map(prompt => <li key={prompt}>{prompt}</li>)}
        </ul>
      </section>
    </section>
  );
};

export default AIAssistantPage;
