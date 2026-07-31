const maxEntries = 200;
const clickWindowMs = 2500;
const subscribers = new Set();
const entries = [];

let installedClickTracker = false;
let lastClick = null;
let sequence = 0;

const now = () => {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
};

const getRoute = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
};

const compactText = (value, fallback = "") => {
  const text = String(value || fallback || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
};

const getElementLabel = (element) => {
  if (!element) return "Unknown click";

  const target = element.closest?.(
    "button, a, [role='button'], input, select, textarea, [data-api-label], [aria-label], [title]"
  ) || element;

  const label =
    target.getAttribute?.("data-api-label") ||
    target.getAttribute?.("aria-label") ||
    target.getAttribute?.("title") ||
    target.innerText ||
    target.value ||
    target.name ||
    target.id ||
    target.className;

  const tagName = target.tagName ? target.tagName.toLowerCase() : "element";
  return compactText(label, tagName);
};

const notify = () => {
  const snapshot = entries.slice();
  subscribers.forEach((subscriber) => subscriber(snapshot));
};

export const installApiClickTracker = () => {
  if (installedClickTracker || typeof document === "undefined") return;
  installedClickTracker = true;

  document.addEventListener(
    "click",
    (event) => {
      lastClick = {
        at: now(),
        label: getElementLabel(event.target),
        route: getRoute(),
      };
    },
    true
  );
};

export const getApiTriggerContext = () => {
  const route = getRoute();
  if (lastClick && now() - lastClick.at <= clickWindowMs) {
    return {
      type: "click",
      label: lastClick.label,
      route: lastClick.route || route,
    };
  }

  return {
    type: "screen",
    label: "Screen open / route load",
    route,
  };
};

export const createApiMonitorEntry = ({ method, url, baseURL, trigger }) => {
  const id = `${Date.now()}-${sequence += 1}`;
  const entry = {
    id,
    method: String(method || "GET").toUpperCase(),
    url: String(url || ""),
    baseURL: String(baseURL || ""),
    route: trigger?.route || getRoute(),
    triggerType: trigger?.type || "screen",
    triggerLabel: trigger?.label || "Screen open / route load",
    startedAt: now(),
    startedAtDate: new Date(),
    status: "pending",
    durationMs: null,
    httpStatus: null,
    error: "",
  };

  entries.unshift(entry);
  if (entries.length > maxEntries) entries.pop();
  notify();
  return id;
};

export const finishApiMonitorEntry = (id, patch = {}) => {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  entry.durationMs = Math.max(0, Math.round(now() - entry.startedAt));
  entry.status = patch.status || entry.status;
  entry.httpStatus = patch.httpStatus ?? entry.httpStatus;
  entry.error = patch.error || "";
  notify();
};

export const subscribeApiMonitor = (subscriber) => {
  subscribers.add(subscriber);
  subscriber(entries.slice());
  return () => {
    subscribers.delete(subscriber);
  };
};

export const clearApiMonitorEntries = () => {
  entries.splice(0, entries.length);
  notify();
};
