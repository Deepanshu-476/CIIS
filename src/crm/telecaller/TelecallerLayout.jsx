import React, { useEffect, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { TELECALLER_BASE as BASE, TELECALLER_PAGES, hasTelecallerCompanyAccess } from "./telecallerPages";
import { normalizeLead, todayKey, isTerminal } from "./liveData";
import api from '../../utils/axiosConfig';
import {
  getCurrentUserId,
  loadPagePermission,
  hasPageAccess,
} from "../../utils/pageAccess";
import { AlertCircle } from "lucide-react";
import TelecallerSkeleton from "./TelecallerSkeleton";
import "./Telecaller.css";
import "./DashboardComponents.css";
import "./CallComponents.css";
import "./ResponsiveLayout.css";
import { TelecallerContext } from "./useTelecaller";

const getCompany = () => {
  try {
    return JSON.parse(localStorage.getItem("companyDetails") || "{}");
  } catch {
    return {};
  }
};

export default function TelecallerLayout() {
  const location = useLocation();
  const slug = location.pathname.split("/")[3] || "dashboard";
  const sessionKey = `${getCompany()?._id || "company"}:${getCurrentUserId()}`;
  return <TelecallerSession key={sessionKey} slug={slug} />;
}

function TelecallerSession({ slug }) {
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/crm/telecaller', { noCache: true })
      .then(({ data }) => {
        if (!Array.isArray(data?.items)) throw new Error('Unable to load assigned leads: invalid server response.');
        if (active) setAssigned(data.items.map(normalizeLead));
      })
      .catch(error => {
        if (active) {
          setAssigned([]);
          setError(error.response?.data?.message || error.message || 'Unable to load assigned leads. Please retry.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [version]);

  const [access, setAccess] = useState([]);
  const [editAllowed, setEditAllowed] = useState(false);

  useEffect(() => {
    const company = getCompany();
    const accessible = TELECALLER_PAGES.filter(p => hasTelecallerCompanyAccess(p, company)).map(p => p.slug);
    let active = true;
    setAccess([]);
    setEditAllowed(false);
    Promise.all(TELECALLER_PAGES.filter(p => accessible.includes(p.slug)).map(async page => {
      const permission = await loadPagePermission(page.path);
      return { page, permission };
    })).then(results => {
      if (!active) return;
      const userId = getCurrentUserId();
      setAccess(results.filter(({ permission }) => hasPageAccess(permission, userId, 'view')).map(({ page }) => page.slug));
      const current = results.find(({ page }) => page.slug === slug);
      const workspace = results.find(({ page }) => page.slug === 'call-workspace');
      const targetPermission = slug === 'lead-detail' ? (workspace?.permission || current?.permission) : current?.permission;
      setEditAllowed(Boolean(hasPageAccess(targetPermission, userId, 'edit')));
    }).catch(() => { if (active) setEditAllowed(false); });
    return () => { active = false; };
  }, [slug]);

  const can = (key) => access.includes(key);
  const calls = assigned
    .flatMap(lead => Array.isArray(lead?.calls) ? lead.calls : [])
    .filter(Boolean)
    .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
  const enriched = calls.map((call) => {
    const parentLead = assigned.find((lead) => lead?.id === call?.leadId) || {};
    return {
      ...parentLead,
      ...call,
      id: call?.leadId || parentLead?.id,
      rowId: call?.id,
    };
  }).filter(call => call && call.outcome !== 'Note Added');
  const today = enriched.filter((row) => typeof row?.date === 'string' && row.date.startsWith(todayKey()));
  const followups = assigned.filter(
    (row) => row && row.followUp && !isTerminal(row),
  );
  const pending = assigned.filter(
    (row) => row && !row.date && !isTerminal(row),
  );
  const converted = assigned.filter((row) => row && row.status === "Converted");
  const page = TELECALLER_PAGES.find((page) => page.slug === slug);

  const saveCall = async call => {
    const { data } = await api.post(`/crm/telecaller/${call.leadId}/calls`, {
      id: call.id, outcome: call.outcome, callType: call.callType, notes: call.notes,
      followUp: call.followUp ? new Date(call.followUp).toISOString() : null,
      duration: call.duration,
      callLogId: call.callLogId,
    });
    if (!data?.item?._id || String(data.item._id) !== String(call.leadId)) {
      throw new Error('Save could not be confirmed. Please retry.');
    }
    const savedLead = normalizeLead(data.item);
    setAssigned(current => current.some(lead => lead.id === savedLead.id)
      ? current.map(lead => lead.id === savedLead.id ? savedLead : lead)
      : [...current, savedLead]);
    return data.item;
  };

  const value = {
    calls,
    enriched,
    assigned,
    today,
    followups,
    pending,
    converted,
    can,
    editAllowed,
    saveCall,
    refresh: () => setVersion(v => v + 1),
  };

  const pageTitle = ["dashboard", "call-dashboard"].includes(slug)
    ? "Call Management"
    : slug === "assigned-calls"
      ? "Assigned Calls"
      : slug === "todays-calls"
        ? "Today's Calls"
        : slug === "pending-calls"
          ? "Pending Calls"
          : slug === "scheduled-calls"
            ? "Scheduled Calls"
            : slug === "completed-calls"
              ? "Completed Calls"
              : slug === "call-history"
                ? "Call History"
                : slug === "follow-ups"
                  ? "Follow-Up Center"
                  : slug === "converted-leads"
                    ? "Converted Leads"
                    : page?.name || "Telecaller";

  const isSubPage = !["dashboard", "call-dashboard"].includes(slug);

  return (
    <TelecallerContext.Provider value={value}>
      <main className="haps-page-wrapper">
        <div className="haps-top-header">
          <h1 className="haps-page-title">{pageTitle}</h1>
          <button type="button" className="cw-btn-nav" disabled={loading} onClick={() => setVersion(v => v + 1)}>Refresh leads</button>
          <div className="haps-breadcrumbs">
            {slug === "converted-leads" ? (
              <>
                <Link to={`${BASE}/dashboard`}>Call Workspace</Link>
                <span>&gt;</span>
                <span className="haps-crumb-current">Converted Leads</span>
              </>
            ) : slug === "follow-ups" ? (
              <>
                <Link to={`${BASE}/dashboard`}>Dashboard</Link>
                <span>&gt;</span>
                <span className="haps-crumb-current">Follow-Up Center</span>
              </>
            ) : isSubPage ? (
              <>
                <Link to={`${BASE}/dashboard`}>Dashboard</Link>
                <span>&gt;</span>
                <Link to={`${BASE}/call-dashboard`}>Call Management</Link>
                <span>&gt;</span>
                <span className="haps-crumb-current">{pageTitle}</span>
              </>
            ) : (
              <>
                <Link to={`${BASE}/dashboard`}>Dashboard</Link>
                <span>&gt;</span>
                <span className="haps-crumb-current">Call Management</span>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <TelecallerSkeleton slug={slug} />
        ) : error ? (
          <div className="tc-error-state" role="alert">
            <AlertCircle size={32} className="tc-error-icon" />
            <h3>Unable to load leads</h3>
            <p>{error}</p>
            <button
              type="button"
              className="cw-btn-nav"
              style={{ background: "#6366f1", color: "#ffffff", borderColor: "#6366f1" }}
              onClick={() => setVersion(v => v + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </TelecallerContext.Provider>
  );
}
