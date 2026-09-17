import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Eye,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  Calendar,
  CheckCircle
} from "lucide-react";
import { TELECALLER_BASE as BASE } from "./telecallerPages";
import { todayKey, outcomes, formatDate } from "./liveData";
import "./CallComponents.css";

export const day = (value) => String(value || "").slice(0, 10);

export const dateText = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(String(value).includes("T")
          ? { hour: "2-digit", minute: "2-digit", hour12: true }
          : {}),
      })
    : "—";

export const followStatus = (row) =>
  day(row.followUp) < todayKey()
    ? "Overdue"
    : day(row.followUp) === todayKey()
      ? "Today"
      : "Upcoming";

const getBadgeClass = (key, val) => {
  if (key === "source") return "haps-badge source-facebook";
  if (key === "type") return "haps-badge type-neet";
  if (key === "callType") return val === "Inbound" ? "haps-badge calltype-inbound" : "haps-badge calltype-outbound";
  if (key === "outcome") {
    if (val === "Converted") return "haps-badge outcome-converted";
    if (val === "Follow-up") return "haps-badge outcome-followup";
    if (val === "Connected") return "haps-badge outcome-connected";
    if (val === "Interested") return "haps-badge outcome-interested";
    return "haps-badge outcome-default";
  }
  if (key === "priority") return val === "High" ? "haps-badge priority-high" : "haps-badge priority-normal";
  if (key === "status") return val === "Converted" ? "haps-badge outcome-converted" : "haps-badge source-facebook";
  if (key === "followStatus") return val === "Overdue" ? "haps-badge priority-high" : val === "Today" ? "haps-badge outcome-followup" : "haps-badge calltype-outbound";
  return "haps-badge";
};

export function Stats({ items }) {
  return (
    <div className="haps-kpis-grid">
      {items.map((item) => {
        const label = item.label || item[0];
        const value = item.value !== undefined ? item.value : (item[1] !== undefined ? item[1] : 0);
        const Icon = item.Icon || item[2] || Phone;
        const tone = item.tone || item[3] || "purple";
        const hasBottom = item.changeText || item.hint || item.badgeText || item[4];

        return (
          <div className={`haps-kpi-card tone-${tone}`} key={label}>
            <div className="haps-kpi-top">
              <div className="haps-kpi-info-left">
                <span className="haps-kpi-label">{label}</span>
                <span className="haps-kpi-value">{value}</span>
              </div>
              <div className={`haps-kpi-icon-box tone-${tone}`}>
                <Icon size={18} />
              </div>
            </div>
            {hasBottom && (
              <div className={`haps-kpi-bottom tone-${tone}`}>
                <ArrowUp size={12} />
                <span>{item.badgeText || item.hint || item.changeText || item[4]}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Card({ title, children, action, className = "" }) {
  return (
    <section className={`haps-card ${className}`}>
      {title && (
        <header className="haps-card-header">
          <h2 className="haps-card-title">{title}</h2>
          {action}
        </header>
      )}
      <div className="haps-card-body">{children}</div>
    </section>
  );
}

export function FollowupCalendar({ rows = [], can = () => false }) {
  const [month, setMonth] = useState(() => todayKey().slice(0, 7));
  const [year, m] = month.split("-").map(Number);
  const days = new Date(year, m, 0).getDate();
  const offset = new Date(year, m - 1, 1).getDay();

  return (
    <section className="haps-card">
      <header className="haps-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="haps-card-title">Follow-Up Calendar</h2>
        <input
          type="month"
          className="haps-month-picker"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
        />
      </header>
      <div className="haps-card-body" style={{ padding: 0 }}>
        <div className="haps-calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="haps-cal-head">
              {d}
            </div>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div key={`blank-${i}`} className="haps-cal-cell blank" />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            const matches = rows.filter((row) => row.followUp && row.followUp.startsWith(date));
            return (
              <div key={date} className={`haps-cal-cell ${matches.length ? "has-events" : ""}`}>
                <span className="haps-cal-num">{i + 1}</span>
                {matches.map((row) =>
                  can("lead-detail") ? (
                    <Link key={row.id} to={`${BASE}/lead-detail/${row.id}`} className="haps-cal-event">
                      {row.name}
                    </Link>
                  ) : (
                    <span key={row.id} className="haps-cal-event">
                      {row.name}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function DataTable({
  rows = [],
  kind = "history",
  can = () => false,
  title = "Recent Calls",
  showViewAll = false,
  emptyTitle,
  emptySubtitle
}) {
  const [search, setSearch] = useState("");
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "", asc: true });

  const columns = useMemo(() => {
    if (kind === "assigned") {
      return [
        ["id", "LEAD ID"],
        ["name", "LEAD"],
        ["phone", "PHONE"],
        ["source", "SOURCE"],
        ["type", "TYPE"],
        ["status", "STATUS"],
        ["assigned", "ASSIGNED AGE"]
      ];
    }
    if (kind === "pending") {
      return [
        ["id", "LEAD"],
        ["name", "NAME"],
        ["phone", "PHONE"],
        ["source", "SOURCE"],
        ["type", "LEAD TYPE"],
        ["status", "STATUS"],
        ["date", "LAST CALL"],
        ["followUp", "NEXT FOLLOW UP"],
        ["assigned", "ASSIGNED AGE"],
        ["priority", "PRIORITY"]
      ];
    }
    if (kind === "scheduled") {
      return [
        ["id", "LEAD"],
        ["name", "NAME"],
        ["phone", "PHONE"],
        ["source", "SOURCE"],
        ["type", "LEAD TYPE"],
        ["status", "STATUS"],
        ["date", "LAST CALL"],
        ["followUp", "SCHEDULED DATE"],
        ["assigned", "ASSIGNED AGE"],
        ["attempts", "ATTEMPTS"]
      ];
    }
    if (kind === "completed") {
      return [
        ["id", "LEAD"],
        ["name", "NAME"],
        ["phone", "PHONE"],
        ["source", "SOURCE"],
        ["type", "LEAD TYPE"],
        ["status", "LEAD STATUS"],
        ["outcome", "OUTCOME"],
        ["callType", "CALL TYPE"],
        ["date", "COMPLETED AT"],
        ["attempts", "ATTEMPTS"]
      ];
    }
    if (kind === "follow-ups") {
      return [
        ["id", "LEAD"],
        ["name", "NAME"],
        ["phone", "PHONE"],
        ["source", "SOURCE"],
        ["type", "LEAD TYPE"],
        ["followStatus", "FOLLOW-UP STATUS"],
        ["followUp", "NEXT FOLLOW UP"],
        ["priority", "PRIORITY"]
      ];
    }
    if (kind === "converted") {
      return [
        ["id", "LEAD ID"],
        ["name", "CUSTOMER"],
        ["phone", "CONTACT"],
        ["source", "SOURCE"],
        ["type", "TYPE"],
        ["date", "CONVERTED ON"],
        ["status", "STATUS"]
      ];
    }
    return [
      ["id", "LEAD"],
      ["name", "NAME"],
      ["phone", "PHONE"],
      ["source", "SOURCE"],
      ["type", "LEAD TYPE"],
      ["callType", "CALL TYPE"],
      ["outcome", "OUTCOME"],
      ["notes", "REMARKS"],
      ["date", "CALL TIME"]
    ];
  }, [kind]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (!q) return true;
        return [row.id, row.name, row.phone, row.source, row.type, row.status, row.outcome, row.notes]
          .some((v) => String(v || "").toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (!sort.key) return 0;
        const valA = sort.key === "followStatus" ? followStatus(a) : a[sort.key];
        const valB = sort.key === "followStatus" ? followStatus(b) : b[sort.key];
        return String(valA || "").localeCompare(String(valB || "")) * (sort.asc ? 1 : -1);
      });
  }, [rows, search, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * size, current * size);

  return (
    <section className="haps-card haps-table-card">
      <header className="haps-card-header">
        <h2 className="haps-card-title">{title}</h2>
        {kind === "converted" && (
          <span className="haps-records-badge">{filtered.length} records</span>
        )}
        {showViewAll && can("call-history") && (
          <Link to={`${BASE}/call-history`} className="haps-btn-view-all">
            <Eye size={13} /> View All
          </Link>
        )}
      </header>

      {kind !== "converted" && (
        <div className="haps-table-toolbar">
          <div className="haps-entries-select">
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries per page</span>
          </div>
          <div className="haps-search-box">
            <label>Search:</label>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      <div className="haps-table-wrap">
        <table className="haps-data-table">
          <thead>
            <tr>
              {kind !== "converted" && (
                <th style={{ width: "65px" }}>
                  <div className="haps-th-content">
                    SL. NO. <span className="haps-sort-arrows">⇅</span>
                  </div>
                </th>
              )}
              {columns.map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    className="haps-th-btn"
                    onClick={() => setSort({ key, asc: sort.key === key ? !sort.asc : true })}
                  >
                    {label} {sort.key === key ? (sort.asc ? "↑" : "↓") : ""}
                  </button>
                </th>
              ))}
              <th style={{ width: kind === "converted" ? "95px" : "80px", textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.rowId || row.id}>
                {kind !== "converted" && <td>{(current - 1) * size + index + 1}</td>}
                {columns.map(([key]) => (
                  <td key={key}>
                    {key === "id" ? (
                      <span className="haps-lead-code">#{row.id}</span>
                    ) : key === "name" ? (
                      kind === "assigned" || kind === "converted" ? (
                        <div className="haps-lead-info-cell">
                          <span className="haps-lead-name">{row.name}</span>
                          <small className="haps-lead-sub">{kind === "converted" ? (row.email || "zara.nair67@gmail.com") : "Student inquiry"}</small>
                        </div>
                      ) : (
                        <span className="haps-lead-name">{row.name}</span>
                      )
                    ) : key === "phone" ? (
                      <span className="haps-lead-phone">{row.phone}</span>
                    ) : key === "notes" ? (
                      <span className="haps-remarks-text">{row.notes || "—"}</span>
                    ) : key === "followStatus" ? (
                      <span className={getBadgeClass(key, followStatus(row))}>
                        {followStatus(row)}
                      </span>
                    ) : (kind === "pending" || kind === "scheduled") && key === "date" ? (
                      row.date ? (
                        <div className="haps-time-cell">
                          <span className="haps-time-main">{formatDate(row.date)}</span>
                          <span className="haps-time-sub">{row.timeAgo || ""}</span>
                        </div>
                      ) : (
                        <span className="haps-badge outcome-interested">Never Called</span>
                      )
                    ) : kind === "pending" && key === "followUp" ? (
                      <span className="haps-badge calltype-outbound">
                        {row.followUp ? formatDate(row.followUp) : "Not Scheduled"}
                      </span>
                    ) : kind === "scheduled" && key === "followUp" ? (
                      row.followUp ? (
                        <div className="haps-time-cell">
                          <span className="haps-time-main">{formatDate(row.followUp)}</span>
                        </div>
                      ) : (
                        <span className="haps-badge calltype-outbound">Not Scheduled</span>
                      )
                    ) : key === "attempts" ? (
                      <span className="haps-attempts-badge">{row.attempts !== undefined ? row.attempts : 0}</span>
                    ) : kind === "assigned" && key === "assigned" ? (
                      <span className="haps-assigned-age">{formatDate(row.assigned)}</span>
                    ) : kind === "converted" && key === "status" ? (
                      <span className="haps-badge-pill-green">
                        <CheckCircle size={11} style={{ marginRight: 3, verticalAlign: "-1px" }} /> Converted
                      </span>
                    ) : kind === "converted" && key === "date" ? (
                      <span className="haps-time-main">{formatDate(row.date)}</span>
                    ) : ["date", "followUp", "assigned"].includes(key) ? (
                      row[key] || key === "assigned" ? (
                        <div className="haps-time-cell">
                          <span className="haps-time-main">{formatDate(row[key])}</span>
                          <span className="haps-time-sub">{row.timeAgo || ""}</span>
                        </div>
                      ) : (
                        "—"
                      )
                    ) : ["source", "type", "status", "outcome", "callType", "priority"].includes(key) ? (
                      <span className={getBadgeClass(key, row[key] || (key === "priority" ? "High" : key === "status" ? "Assigned" : ""))}>
                        {row[key] || (key === "priority" ? "High" : key === "status" ? "Assigned" : "—")}
                      </span>
                    ) : (
                      row[key] || "—"
                    )}
                  </td>
                ))}
                <td style={{ textAlign: "center" }}>
                  {kind === "converted" ? (
                    can("lead-detail") && (
                      <Link
                        className="haps-btn-view-pill"
                        title={`View ${row.name}`}
                        to={`${BASE}/lead-detail/${row.id}`}
                      >
                        <Eye size={12} /> View
                      </Link>
                    )
                  ) : (
                    <div className="haps-actions-group">
                      {kind !== "converted" && kind !== "completed" && kind !== "history" && can("call-workspace") && (
                        <Link
                          className="haps-icon-btn haps-call-btn"
                          title={`Call ${row.name}`}
                          to={`${BASE}/call-workspace/${row.id}`}
                        >
                          <Phone size={13} />
                        </Link>
                      )}
                      {can("lead-detail") && (
                        <Link
                          className="haps-icon-btn haps-view-btn"
                          title={`View ${row.name}`}
                          to={`${BASE}/lead-detail/${row.id}`}
                        >
                          <Eye size={13} />
                        </Link>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!visible.length && (
          <div className="haps-empty-state">
            <div className="haps-empty-icon-wrap">
              <Calendar size={28} />
            </div>
            <p className="haps-empty-title">{emptyTitle || `No ${title.toLowerCase()} found.`}</p>
            <p className="haps-empty-sub">
              {emptySubtitle || "Your records will appear here as activity occurs."}
            </p>
          </div>
        )}
      </div>

      {kind !== "converted" && (
        <footer className="haps-table-footer">
          <span className="haps-pagination-info">
            Showing {filtered.length ? (current - 1) * size + 1 : 0} to{" "}
            {Math.min(current * size, filtered.length)} of {filtered.length} entries
          </span>
          <div className="haps-pagination-controls">
            <button
              type="button"
              disabled={current === 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              type="button"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pages }, (_, idx) => (
              <button
                key={idx + 1}
                type="button"
                className={current === idx + 1 ? "active" : ""}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              disabled={current === pages}
              onClick={() => setPage(pages)}
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}

export function Filters({ onApply, kind, rows = [] }) {
  const [values, setValues] = useState({});

  const field = (key, label, options, type = "text", placeholder = "") => (
    <label key={key} className="haps-filter-label">
      <span>{label}</span>
      {options ? (
        <select
          value={values[key] || ""}
          onChange={(e) => setValues({ ...values, [key]: e.target.value })}
        >
          <option value="">{placeholder || `All ${label}`}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={values[key] || ""}
          onChange={(e) => setValues({ ...values, [key]: e.target.value })}
        />
      )}
    </label>
  );

  return (
    <form
      className="haps-card haps-filters-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(values);
      }}
    >
      {kind === "pending" ? (
        <>
          {field("source", "Lead Source", [...new Set(rows.map(row => row.source).filter(Boolean))], null, "All Sources")}
          {field("type", "Lead Type", [...new Set(rows.map(row => row.type).filter(Boolean))], null, "All Types")}
          {field("status", "Status", ["Assigned", "Interested", "Follow-up"], null, "All Status")}
          {field("attempts", "Attempts", ["Never Called", "1–3 Calls", "4+ Calls"], null, "Any")}
        </>
      ) : kind === "scheduled" ? (
        <>
          {field("scheduledDate", "Schedule Date", null, "date", "01 Sep, 2026")}
          {field("scheduleStatus", "Schedule Status", ["Pending", "Today", "Upcoming", "Overdue"], null, "All")}
          {field("source", "Lead Source", [...new Set(rows.map(row => row.source).filter(Boolean))], null, "All Sources")}
          {field("type", "Lead Type", [...new Set(rows.map(row => row.type).filter(Boolean))], null, "All Types")}
        </>
      ) : kind === "completed" ? (
        <>
          {field("outcome", "Outcome", outcomes, null, "All Outcomes")}
          {field("callType", "Call Type", ["Outbound", "Inbound"], null, "All Types")}
          {field("source", "Lead Source", [...new Set(rows.map(row => row.source).filter(Boolean))], null, "All Sources")}
          {field("type", "Lead Type", [...new Set(rows.map(row => row.type).filter(Boolean))], null, "All Types")}
          {field("completedDate", "Completed Date", null, "date", "01 Sep, 2026")}
        </>
      ) : (
        <>
          {kind === "history" && field("search", "Search Lead", null, "text", "Search lead...")}
          {field("source", "Source", [...new Set(rows.map(row => row.source).filter(Boolean))], null, "Select Lead Source")}
          {field("type", "Lead Type", [...new Set(rows.map(row => row.type).filter(Boolean))], null, "Select Lead Type")}
          {kind === "today" ? (
            field("callType", "Call Type", ["Outbound", "Inbound"], null, "All Calls")
          ) : (
            ["history", "completed"].includes(kind) && field("callType", "Call Types", ["Outbound", "Inbound"])
          )}
          {["history", "completed"].includes(kind) && field("outcome", "Outcomes", outcomes)}
          {kind === "today" && field("timeFrom", "Time From", null, "time", "--:--")}
          {kind === "today" && field("timeTo", "Time To", null, "time", "--:--")}
          {kind !== "today" && field("from", kind === "scheduled" ? "Schedule From" : "Date From", null, "date", "DD-MM-YYYY")}
          {kind !== "today" && field("to", "Date To", null, "date", "01 Sep, 2026")}
        </>
      )}

      <div className="haps-filter-buttons">
        <button className="haps-btn-apply" type="submit">
          <Filter size={13} /> Apply
        </button>
        <button
          type="button"
          className="haps-btn-reset"
          onClick={() => {
            setValues({});
            onApply({});
          }}
          title="Reset filters"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </form>
  );
}
