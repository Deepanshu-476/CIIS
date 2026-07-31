import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  MousePointerClick,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  clearApiMonitorEntries,
  installApiClickTracker,
  subscribeApiMonitor,
} from "../utils/apiMonitor";
import "./ApiMonitorConsole.css";

const formatTime = (date) => {
  if (!date) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getDurationClass = (durationMs) => {
  if (durationMs == null) return "pending";
  if (durationMs > 2000) return "slow";
  if (durationMs > 800) return "medium";
  return "fast";
};

const ApiMonitorConsole = () => {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    installApiClickTracker();
    return subscribeApiMonitor(setEntries);
  }, []);

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.triggerType === filter);
  }, [entries, filter]);

  const summary = useMemo(() => {
    const completed = entries.filter((entry) => entry.durationMs != null);
    const slowest = completed.reduce(
      (max, entry) => (entry.durationMs > (max?.durationMs || 0) ? entry : max),
      null
    );
    const average = completed.length
      ? Math.round(completed.reduce((sum, entry) => sum + entry.durationMs, 0) / completed.length)
      : 0;

    return {
      total: entries.length,
      pending: entries.filter((entry) => entry.status === "pending").length,
      average,
      slowest,
    };
  }, [entries]);

  return (
    <aside className={`api-monitor ${open ? "api-monitor-open" : ""}`}>
      <button
        type="button"
        className="api-monitor-toggle"
        onClick={() => setOpen((value) => !value)}
        title={open ? "Hide API console" : "Show API console"}
        aria-label={open ? "Hide API console" : "Show API console"}
      >
        <Activity size={18} />
        <span>API</span>
        {summary.pending > 0 && <strong>{summary.pending}</strong>}
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {open && (
        <div className="api-monitor-panel">
          <div className="api-monitor-header">
            <div>
              <h2>API Console</h2>
              <p>Screen load aur click based calls</p>
            </div>
            <button
              type="button"
              className="api-monitor-icon-button"
              onClick={clearApiMonitorEntries}
              title="Clear logs"
              aria-label="Clear API logs"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="api-monitor-stats">
            <div>
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
            <div>
              <span>Avg</span>
              <strong>{summary.average}ms</strong>
            </div>
            <div>
              <span>Slowest</span>
              <strong>{summary.slowest?.durationMs || 0}ms</strong>
            </div>
          </div>

          <div className="api-monitor-filters" aria-label="API log filters">
            {["all", "screen", "click"].map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "all" ? "All" : item === "screen" ? "Screen" : "Clicks"}
              </button>
            ))}
          </div>

          <div className="api-monitor-list">
            {filteredEntries.length === 0 ? (
              <div className="api-monitor-empty">
                <RotateCcw size={18} />
                <span>No API calls captured yet</span>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <article key={entry.id} className="api-monitor-row">
                  <div className="api-monitor-row-top">
                    <span className={`api-monitor-method method-${entry.method.toLowerCase()}`}>
                      {entry.method}
                    </span>
                    <span className={`api-monitor-duration ${getDurationClass(entry.durationMs)}`}>
                      {entry.durationMs == null ? "running" : `${entry.durationMs}ms`}
                    </span>
                    {entry.httpStatus && <span className="api-monitor-status">{entry.httpStatus}</span>}
                  </div>
                  <div className="api-monitor-url" title={`${entry.baseURL}${entry.url}`}>
                    {entry.url}
                  </div>
                  <div className="api-monitor-meta">
                    <span title={entry.triggerLabel}>
                      {entry.triggerType === "click" ? (
                        <MousePointerClick size={13} />
                      ) : (
                        <Clock size={13} />
                      )}
                      {entry.triggerLabel}
                    </span>
                    <span title={entry.route}>{entry.route}</span>
                    <span>{formatTime(entry.startedAtDate)}</span>
                  </div>
                  {entry.error && <div className="api-monitor-error">{entry.error}</div>}
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ApiMonitorConsole;
