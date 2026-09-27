// Lead submission for the marketing forms (Book Demo, Start Trial, Contact).
// Uses the app's existing axios instance, so requests go to `${VITE_API_URL}` (e.g. https://backendcds.ciisnetwork.in/api).
import api from "../../utils/axiosConfig";

export class LeadSubmitError extends Error {
  constructor(message, userMessage, cause) {
    super(message);
    this.name = "LeadSubmitError";
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

const digits = (v) => String(v || "").replace(/\D/g, "");

// Accepts 98xxxxxx10, +91 98xxxxxx10, 091-98xxxxxx10 → returns the 10-digit mobile or "".
export function toIndianMobile(v) {
  let d = digits(v);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}

export const isValidIndianMobile = (v) => toIndianMobile(v) !== "";

const clean = (v) => String(v || "").trim();

function serverMessage(err) {
  const m = err && err.response && err.response.data && err.response.data.message;
  return typeof m === "string" && m.trim() ? m.trim() : "";
}

// Verified endpoint: POST /api/demo-requests (same contract as src/components/landing/BookDemoModal.jsx).
async function submitDemo(data) {
  const extra = [];
  if (clean(data.message)) extra.push(clean(data.message));
  if (clean(data.datetime)) extra.push(`Preferred demo date & time: ${clean(data.datetime).replace("T", " ")}`);
  const payload = {
    name: clean(data.name),
    email: clean(data.email),
    phone: toIndianMobile(data.phone),
    companyName: clean(data.company),
    employeeCount: clean(data.employees),
    requirements: (data.modules || []).join(", "),
    message: extra.join("\n\n"),
  };
  try {
    const res = await api.post("/demo-requests", payload, { _skipErrorNotify: true });
    return res.data;
  } catch (err) {
    throw new LeadSubmitError(
      "demo-request failed",
      serverMessage(err) || "We couldn’t send your demo request. Please check your connection and try again.",
      err
    );
  }
}

// NOT YET VERIFIED — see BACKEND-CONNECTIONS.md. Until an endpoint is configured the form shows an honest error, never a fake success.
async function submitConfigured(kind, endpoint, data) {
  if (!endpoint) {
    throw new LeadSubmitError(
      `${kind} endpoint not configured`,
      kind === "trial"
        ? "Online trial requests aren’t connected yet. Please book a live demo and our team will set up your trial workspace with you."
        : "Online messages aren’t connected yet. Please book a live demo and our team will get back to you."
    );
  }
  const payload = {
    type: kind,
    name: clean(data.name),
    companyName: clean(data.company),
    email: clean(data.email),
    phone: clean(data.phone),
    employeeCount: clean(data.employees),
    branches: data.branches ? Number(data.branches) : undefined,
    modules: data.modules || [],
    message: clean(data.message),
    source: data.source || "",
  };
  try {
    const res = await api.post(endpoint, payload, { _skipErrorNotify: true });
    return res.data;
  } catch (err) {
    throw new LeadSubmitError(`${kind} failed`, serverMessage(err) || "We couldn’t send your request. Please try again.", err);
  }
}

export async function submitLead(kind, data) {
  if (kind === "demo") return submitDemo(data);
  if (kind === "trial") return submitConfigured("trial", import.meta.env.VITE_MARKETING_TRIAL_ENDPOINT, data);
  if (kind === "contact") return submitConfigured("contact", import.meta.env.VITE_MARKETING_CONTACT_ENDPOINT, data);
  throw new LeadSubmitError(`unknown form ${kind}`, "This form isn’t available right now.");
}
