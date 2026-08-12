import React from 'react';
import {
  FiArrowRight,
  FiCheck,
  FiCpu,
  FiMessageSquare,
  FiSend,
  FiX,
  FiZap
} from 'react-icons/fi';
import {
  LuChartNoAxesCombined,
  LuFingerprint,
  LuMonitorSmartphone,
  LuPanelsTopLeft,
  LuScanFace,
  LuSmartphone,
  LuTabletSmartphone
} from 'react-icons/lu';
import './AttendanceAiSection.css';

const workflow = [
  { title: 'Fingerprint Devices', description: 'Connect any biometric machine', icon: LuFingerprint, tone: 'teal' },
  { title: 'Face Recognition', description: 'Modern face recognition support', icon: LuScanFace, tone: 'violet' },
  { title: 'Mobile Attendance', description: 'Use any Android device as kiosk', icon: LuSmartphone, tone: 'blue' },
  { title: 'Web & Mobile', description: 'Clock in from anywhere', icon: LuMonitorSmartphone, tone: 'blue' },
  { title: '', icon: LuTabletSmartphone, tone: 'device', featured: true },
  { title: 'CIIS Attendance Gateway', tone: 'gateway', featured: true },
  { title: 'Live Attendance Dashboard', icon: LuPanelsTopLeft, tone: 'violet', featured: true },
  { title: 'Reports & Analytics', icon: LuChartNoAxesCombined, tone: 'teal', featured: true }
];

const benefits = [
  'Ask questions in simple English',
  'Get instant reports and summaries',
  'Understand trends and performance',
  'Automate routine tasks and workflows'
];

const overdueEmployees = [
  ['Mike Davis', '3 tasks'],
  ['Sarah Johnson', '2 tasks'],
  ['James Anderson', '2 tasks'],
  ['Emma Wilson', '1 task'],
  ['Rahul Sharma', '1 task']
];

const WorkflowCard = ({ item }) => {
  const Icon = item.icon;
  if (item.tone === 'gateway') {
    return (
      <article className="aa-workflow-item aa-gateway is-featured">
        <span className="aa-workflow-icon aa-gateway-card"><strong>{item.title}</strong></span>
      </article>
    );
  }
  return (
    <article className={`aa-workflow-item aa-${item.tone} ${item.featured ? 'is-featured' : ''}`}>
      <span className="aa-workflow-icon" aria-hidden="true">{Icon && <Icon />}</span>
      {item.title && <h3>{item.title}</h3>}
      {item.description && <p>{item.description}</p>}
    </article>
  );
};

const RobotIllustration = () => (
  <div className="aa-robot" aria-hidden="true">
    <span className="aa-chat-bubble bubble-a"><FiMessageSquare /></span>
    <span className="aa-chat-bubble bubble-b"><FiMessageSquare /></span>
    <span className="aa-chat-bubble bubble-c"><FiMessageSquare /></span>
    <div className="aa-robot-antenna"></div>
    <div className="aa-robot-head"><div className="aa-robot-face"><i></i><i></i><b></b></div></div>
    <div className="aa-robot-body"><FiZap /></div>
    <div className="aa-robot-arm"></div>
    <div className="aa-robot-shadow"></div>
  </div>
);

const AiChatPreview = () => (
  <article className="aa-chat-card" aria-label="CIIS AI Assistant chat preview">
    <header>
      <span><FiCpu aria-hidden="true" /> CIIS AI Assistant</span>
      <FiX className="aa-chat-close" aria-hidden="true" />
    </header>
    <p className="aa-chat-intro"><FiZap aria-hidden="true" />How can I help you today?</p>
    <div className="aa-chat-messages">
      <p className="aa-user-bubble">Which employees have overdue tasks?</p>
      <div className="aa-message-row assistant">
        <span aria-hidden="true"><FiCpu /></span>
        <div>
          <p>Here are 5 employees with overdue tasks:</p>
          <ul>{overdueEmployees.map(([name, tasks]) => <li key={name}><span>{name}</span> — {tasks}</li>)}</ul>
        </div>
      </div>
    </div>
    <div className="aa-preview-input" role="textbox" aria-label="Ask anything" aria-disabled="true">
      <span>Ask anything...</span><FiSend aria-hidden="true" />
    </div>
  </article>
);

const AttendanceAiSection = () => (
  <section className="aa-section" aria-label="Attendance workflow and AI business assistant">
    <article className="aa-attendance-card">
      <h2>Attendance That Works Your Way</h2>
      <div className="aa-workflow-container">
        <div className="aa-workflow-methods">
          <div className="aa-workflow-item aa-teal">
            <span className="aa-workflow-icon green"><LuFingerprint /></span>
            <h3>Fingerprint Devices</h3>
            <p>Connect any biometric machine</p>
          </div>
          <div className="aa-workflow-item aa-violet">
            <span className="aa-workflow-icon purple"><LuScanFace /></span>
            <h3>Face Recognition</h3>
            <p>Modern face recognition support</p>
          </div>
          <div className="aa-workflow-item aa-blue">
            <span className="aa-workflow-icon blue"><LuSmartphone /></span>
            <h3>Mobile Attendance</h3>
            <p>Use any Android device as kiosk</p>
          </div>
          <div className="aa-workflow-item aa-blue">
            <span className="aa-workflow-icon blue"><LuMonitorSmartphone /></span>
            <h3>Web &amp; Mobile</h3>
            <p>Clock in from anywhere</p>
          </div>
        </div>

        <FiArrowRight className="aa-main-connector" aria-hidden="true" />

        <div className="aa-workflow-pipeline">
          <div className="aa-pipeline-flow">
            <span className="aa-pipeline-icon device-icon" aria-hidden="true"><LuTabletSmartphone /></span>
            <FiArrowRight className="aa-pipeline-arrow" aria-hidden="true" />
            <div className="aa-gateway-pill">
              <strong><span>CIIS Attendance</span><br />Gateway</strong>
            </div>
            <FiArrowRight className="aa-pipeline-arrow" aria-hidden="true" />
            <span className="aa-pipeline-icon laptop-icon" aria-hidden="true"><LuPanelsTopLeft /></span>
            <FiArrowRight className="aa-pipeline-arrow" aria-hidden="true" />
            <div className="aa-reports-box">
              <span className="aa-pipeline-icon reports-icon" aria-hidden="true"><LuChartNoAxesCombined /></span>
              <h3>Reports &amp; Analytics</h3>
            </div>
          </div>
          <p className="aa-supporting-text">All punches in real-time <b>•</b> Smart rules <b>•</b> Accurate reports</p>
        </div>
      </div>
    </article>

    <article className="aa-assistant-card">
      <AiChatPreview />
      <div className="aa-assistant-copy">
        <h2>Meet Your AI Business Assistant</h2>
        <p>Get instant answers, insights and reports using natural language.</p>
        <ul>{benefits.map((benefit) => <li key={benefit}><span aria-hidden="true"><FiCheck /></span><p>{benefit}</p></li>)}</ul>
      </div>
      <RobotIllustration />
    </article>
  </section>
);

export default AttendanceAiSection;
