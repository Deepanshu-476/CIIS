import React from 'react';
import {
  FiBarChart2, FiBell, FiBox, FiBriefcase, FiCalendar, FiCheckCircle, FiClock, FiCpu,
  FiBattery, FiGrid, FiMenu, FiUserCheck, FiUsers, FiWifi, FiX, FiUser, FiClipboard
} from 'react-icons/fi';
import { LuFingerprint, LuClipboardCheck } from 'react-icons/lu';
import './BusinessOperationsSection.css';

const capabilities = [
  { title:'Employee & HR', text:'Complete employee lifecycle management in one place.', icon:FiUser, tone:'purple' },
  { title:'Attendance & Shifts', text:'Biometric, mobile & web attendance with smart rules.', icon:LuFingerprint, tone:'teal' },
  { title:'Tasks & Projects', text:'Assign, track and complete tasks on time.', icon:LuClipboardCheck, tone:'orange' },
  { title:'Clients & CRM', text:'Manage clients, deals, communications and follow-ups.', icon:FiUsers, tone:'blue' },
  { title:'Assets & Operations', text:'Track company assets, requests and maintenance.', icon:FiBox, tone:'pink' },
  { title:'Reports & Performance', text:'Powerful reports and insights to grow your business.', icon:FiBarChart2, tone:'cyan' }
];

const tabs = [
  { id:'attendance', label:'HR & Attendance' }, { id:'tasks', label:'Tasks & Projects' },
  { id:'crm', label:'CRM' }, { id:'assets', label:'Assets' },
  { id:'reports', label:'Reports' }, { id:'assistant', label:'AI Assistant' }
];

const attendanceFeatures = ['Biometric and mobile attendance','Shift, late, half day & overtime rules','Leave and holiday management','Attendance approvals & corrections','Detailed attendance reports'];
const sidebarItems = [
  ['Dashboard',FiGrid],['Employees',FiUsers],['Attendance',FiClock],['Leaves',FiCheckCircle],['Shifts',FiCalendar],
  ['Assets',FiBox],['Clients / CRM',FiBriefcase],['Reports',FiGrid],['Performance',FiBarChart2],['AI Assistant',FiCpu]
];
const metrics = [
  ['Present','856','ops-green',FiUserCheck],['Absent','112','ops-red',FiX],
  ['Late','78','ops-orange',FiClock],['Half Day','36','ops-blue',FiUsers]
];
const employees = [
  ['Sarah Johnson','09:02 AM','06:15 PM','2 mins','Present'],
  ['Mike Davis','09:15 AM','06:05 PM','15 mins','Late'],
  ['James Anderson','08:59 AM','06:00 PM','-','Present'],
  ['Emma Wilson','-','-','-','Absent']
];

const AttendanceDashboard = () => (
  <div className="ops-desktop-preview">
    <aside><strong>CIIS NETWORK</strong>{sidebarItems.map(([item,Icon])=><span className={item==='Attendance'?'active':''} key={item}>{React.createElement(Icon,{'aria-hidden':true})}{item}</span>)}</aside>
    <div className="ops-attendance-content">
      <header><div><h3>Attendance</h3><b>Wednesday, 5 Aug 2026</b></div><button type="button"><FiClock aria-hidden="true"/>Today</button></header>
      <div className="ops-metrics">{metrics.map(([label,value,tone,Icon])=><article className={tone} key={label}><span>{React.createElement(Icon,{'aria-hidden':true})}</span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
      <div className="ops-table-wrap"><div className="ops-table">
        <div className="head"><span>Employee</span><span>Check In</span><span>Check Out</span><span>Late</span><span>Status</span></div>
        {employees.map(([name,inTime,outTime,late,status])=><div key={name}><span><i>{name[0]}</i>{name}</span><span>{inTime}</span><span>{outTime}</span><span>{late}</span><span className={status.toLowerCase()}>{status}</span></div>)}
      </div></div>
    </div>
  </div>
);

const PhonePreview = () => (
  <div className="ops-phone" aria-label="Mobile attendance preview">
    <i className="ops-phone-notch"></i><div className="ops-statusbar"><b>9:41</b><span className="ops-phone-indicators"><i className="ops-signal"><b></b><b></b><b></b><b></b></i><FiWifi aria-hidden="true"/><FiBattery aria-hidden="true"/></span></div><header><button aria-label="Open menu"><FiMenu/></button><strong>My Attendance</strong><button aria-label="Notifications"><FiBell/></button></header>
    <div className="ops-checkin"><FiClock aria-hidden="true"/><b>Check In</b></div>
    <section><h4>Today's Summary</h4><p><span>Check In</span><b>09:02 AM</b></p><p><span>Check Out</span><b>—</b></p><p><span>Total Work</span><b>08h 15m</b></p><p><span>Status</span><em>Present</em></p></section><i className="ops-home-indicator"></i>
  </div>
);

const BusinessOperationsSection = () => {
  return <section className="ops-section" aria-labelledby="ops-heading">
    <h2 id="ops-heading">Everything Your Business Needs,<br className="ops-heading-break"/>Without Switching Between <em>10 Tools</em></h2>
    <div className="ops-capabilities">{capabilities.map(({title,text:description,icon,tone})=><article key={title}><span className={tone}>{React.createElement(icon,{'aria-hidden':true})}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
    <div className="ops-showcase">
      <h2>All Your Operations in One Platform</h2>
      <div className="ops-tabs" aria-label="Available operation modules">{tabs.map(tab=><button type="button" className={tab.id==='attendance'?'active':''} disabled={tab.id!=='attendance'} aria-current={tab.id==='attendance'?'true':undefined} key={tab.id}>{tab.label}</button>)}</div>
      <div className="ops-tab-panel">
        <ul className="ops-feature-list">{attendanceFeatures.map(item=><li key={item}><FiCheckCircle aria-hidden="true"/>{item}</li>)}</ul><AttendanceDashboard/><PhonePreview/>
      </div>
    </div>
  </section>;
};

export default BusinessOperationsSection;
