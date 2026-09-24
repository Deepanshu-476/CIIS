import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Clock,
  Hourglass,
  ArrowUp,
  User,
  PhoneCall,
  Calendar
} from "lucide-react";
import { formatDate } from "./liveData";
import { TELECALLER_BASE as BASE } from "./telecallerPages";
import "./DashboardComponents.css";

export const outcomeColors = [
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
  "#f59e0b",
  "#06b6d4",
  "#10b981",
  "#94a3b8"
];

export const quickLinks = [
  ["assigned-calls", User, "View calls assigned to you", "blue"],
  ["todays-calls", Phone, "View calls made today", "green"],
  ["pending-calls", Hourglass, "Calls awaiting action", "orange"],
  ["scheduled-calls", Calendar, "Upcoming callbacks", "purple"],
  ["completed-calls", PhoneCall, "Successfully completed calls", "blue"],
  ["call-history", Clock, "View previous call records", "green"]
];

export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`haps-card ${className}`}>
      <header className="haps-card-header">
        <div>
          <h2 className="haps-card-title">{title}</h2>
          {subtitle && <span className="haps-header-sub">{subtitle}</span>}
        </div>
        {action}
      </header>
      <div className="haps-card-body">{children}</div>
    </section>
  );
}

export function Metrics({ items }) {
  return (
    <div className="haps-kpis-grid">
      {items.map(({ label, value, Icon, tone = "purple", badgeText, badgeTone, changeText, changeTone, hint }) => {
        const text = badgeText || hint || changeText || "0 from yesterday";
        const t = badgeTone || changeTone || tone;

        return (
          <div className={`haps-kpi-card tone-${tone}`} key={label}>
            <div className="haps-kpi-top">
              <div className={`haps-kpi-icon-box tone-${tone}`}>
                <Icon size={20} />
              </div>
              <div className="haps-kpi-info">
                <span className="haps-kpi-value">{value}</span>
                <span className="haps-kpi-label">{label}</span>
              </div>
            </div>
            <div className={`haps-kpi-bottom tone-${t}`}>
              {badgeText || hint ? (
                <span className={`haps-kpi-pill-badge tone-${t}`}>{text}</span>
              ) : (
                <>
                  {t === "gray" ? (
                    <span className="haps-kpi-dot-neutral" aria-hidden="true" />
                  ) : (
                    <ArrowUp size={12} />
                  )}
                  <span>{text}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Schedule({ rows = [], upcoming, can }) {
  return (
    <table className="haps-data-table" style={{ margin: 0 }}>
      <thead>
        <tr>
          <th>CUSTOMER</th>
          <th>TIME</th>
          <th>{upcoming ? "PURPOSE" : "STATUS"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <strong>{row.name}</strong>
              <small style={{ display: 'block', color: '#94a3b8', fontSize: 10 }}>{row.phone}</small>
            </td>
            <td>
              <span className="haps-badge calltype-outbound">{formatDate(row.followUp)}</span>
            </td>
            <td>
              <span className="haps-badge source-facebook">{row.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
      {!rows.length && (
        <tfoot>
          <tr>
            <td colSpan={3} className="haps-empty-cell">
              No scheduled follow-ups
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
