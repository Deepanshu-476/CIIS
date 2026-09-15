import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  WifiOff,
  UserX,
  Ban,
  Languages,
  Copy,
  MailWarning,
  Lock,
  Mail,
  MapPin,
  Info,
} from "lucide-react";
import { formatDate } from "./demoData";
import { TELECALLER_BASE as BASE } from "./telecallerPages";
import "./LeadComponents.css";

export const outcomeIcons = [
  PhoneCall,
  ThumbsUp,
  ThumbsDown,
  PhoneIncoming,
  Calendar,
  Clock,
  PhoneMissed,
  PhoneOff,
  Smartphone,
  WifiOff,
  AlertTriangle,
  UserX,
  Ban,
  Languages,
  PhoneOff,
  Copy,
  MailWarning,
  Lock,
  CheckCircle,
];
export const outcomeTones = [
  "green",
  "green",
  "red",
  "cyan",
  "purple",
  "orange",
  "orange",
  "red",
  "dark",
  "blue",
  "red",
  "blue",
  "red",
  "cyan",
  "red",
  "blue",
  "red",
  "dark",
  "green",
];
export const dateLabel = (value) => (value ? formatDate(value) : "—");
export const Badge = ({ children, tone = "" }) => (
  <span className={`tc-badge ${tone}`}>{children}</span>
);
export function Card({
  title,
  icon: Icon = Info,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`tc-card tlv-card ${className}`}>
      <header>
        <h2>
          <Icon size={14} />
          {title}
        </h2>
        {action}
      </header>
      <div className="tc-card-body">{children}</div>
    </section>
  );
}
export function PreviousCalls({ calls }) {
  return (
    <div className="tc-table-scroll">
      <table>
        <thead>
          <tr>
            {["Date", "Type", "Outcome", "Follow-up", "Notes"].map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id}>
              <td>{dateLabel(call.date)}</td>
              <td>
                <Badge>{call.callType}</Badge>
              </td>
              <td>
                <Badge>{call.outcome}</Badge>
              </td>
              <td>{dateLabel(call.followUp)}</td>
              <td className="tlv-note-cell">{call.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!calls.length && (
        <div className="tlv-empty">No previous calls for this lead.</div>
      )}
    </div>
  );
}

export function LeadContact({ lead, workspace = false, can }) {
  const contactLinks = (
    <div className="tlv-contact-links">
      <a href={`mailto:${lead.email}`}>
        <Mail size={13} />
        {lead.email}
      </a>
      <a href={`tel:${lead.phone}`}>
        <Phone size={13} />
        {lead.phone}
      </a>
      <span>
        <MapPin size={13} />
        {lead.city}
      </span>
    </div>
  );
  const callButton = workspace ? (
    <a className="tc-primary tlv-call" href={`tel:${lead.phone}`}>
      <PhoneCall size={13} /> Call
    </a>
  ) : (
    can("call-workspace") && (
      <Link className="tc-primary" to={`${BASE}/call-workspace/${lead.id}`}>
        <PhoneCall size={13} /> Call
      </Link>
    )
  );
  const contact = (
    <section
      className={`tlv-contact ${workspace ? "tlv-contact-workspace" : ""}`}
    >
      <div className="tlv-person">
        <span className="tc-avatar">{lead.name[0]}</span>
        <div>
          <strong>{lead.name}</strong>
          <div className="tlv-source">
            <Badge>{lead.source}</Badge>
            <Badge tone="green">{lead.type}</Badge>
          </div>
        </div>
        {!workspace && callButton}
      </div>
      <div className="tlv-contact-bottom">
        {contactLinks}
        {workspace && callButton}
      </div>
    </section>
  );
  return contact;
}
export function ContactLinks({ lead }) {
  const contactLinks = (
    <div className="tlv-contact-links">
      <a href={`mailto:${lead.email}`}>
        <Mail size={13} />
        {lead.email}
      </a>
      <a href={`tel:${lead.phone}`}>
        <Phone size={13} />
        {lead.phone}
      </a>
      <span>
        <MapPin size={13} />
        {lead.city}
      </span>
    </div>
  );
  return contactLinks;
}
export function SelectLead({ can }) {
  return (
    <Card title="Select a lead">
      <p>Open a lead using the call or view button in a calls list.</p>
      {can("assigned-calls") && (
        <Link to={BASE + "/assigned-calls"}>Go to My Assigned Calls</Link>
      )}
    </Card>
  );
}
