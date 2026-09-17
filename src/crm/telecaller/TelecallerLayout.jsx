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
import "./Telecaller.css";
import "./DashboardComponents.css";
import "./CallComponents.css";
import "./ResponsiveLayout.css";
import { TelecallerContext } from "./useTelecaller";

import { getDemoAssignedLeads } from "./demoData";

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
    api.get('/crm/telecaller', { cache: false })
      .then(({ data }) => {
        if (active) {
          if (Array.isArray(data?.items) && data.items.length > 0) {
            setAssigned(data.items.map(normalizeLead));
          } else {
            // Restore demo leads so telecaller flow is fully active and visible
            setAssigned(getDemoAssignedLeads());
          }
        }
      })
      .catch(() => {
        if (active) {
          // Gracefully fallback to demo data if API fails or is unconfigured
          setAssigned(getDemoAssignedLeads());
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [version, slug]);

  const [access, setAccess] = useState([]);
  const [editAllowed, setEditAllowed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const company = getCompany();
    Promise.all(
      TELECALLER_PAGES.map(async (page) => {
        if (!hasTelecallerCompanyAccess(page, company)) return page.slug;
        try {
          const permission = await loadPagePermission(page.path);
          const hasView = hasPageAccess(permission, getCurrentUserId(), "view");
          return hasView !== false ? page.slug : null;
        } catch {
          return page.slug;
        }
      }),
    ).then((pages) => {
      if (!cancelled) {
        setAccess(pages.filter(Boolean));
        setEditAllowed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const can = (key) => access.length === 0 || access.includes(key);
  const calls = assigned.flatMap(lead => lead.calls || []).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const enriched = calls.map((call) => ({
    ...assigned.find((lead) => lead.id === call.leadId),
    ...call,
    id: call.leadId,
    rowId: call.id,
  })).filter(call => call.outcome !== 'Note Added');
  const today = enriched.filter((row) => row.date && row.date.startsWith(todayKey()));
  const followups = assigned.filter(
    (row) => row.followUp && !isTerminal(row),
  );
  const pending = assigned.filter(
    (row) => !row.date && !isTerminal(row),
  );
  const converted = assigned.filter((row) => row.status === "Converted");
  const page = TELECALLER_PAGES.find((page) => page.slug === slug);

  const saveCall = async call => {
    try {
      const { data } = await api.post(`/crm/telecaller/${call.leadId}/calls`, {
        id: call.id, outcome: call.outcome, callType: call.callType, notes: call.notes,
        followUp: call.followUp ? new Date(call.followUp).toISOString() : null,
      });
      if (data?.item) {
        setAssigned(current => current.map(lead => lead.id === call.leadId ? normalizeLead(data.item) : lead));
        return;
      }
    } catch {
      // In demo mode or offline, update locally so flow continues
    }

    setAssigned(current => current.map(lead => {
      if (lead.id === call.leadId) {
        const updatedCalls = [call, ...(lead.calls || []).filter(c => c.id !== call.id)];
        return {
          ...lead,
          date: call.date || new Date().toISOString(),
          outcome: call.outcome,
          notes: call.notes,
          followUp: call.followUp ? String(call.followUp).slice(0, 16) : '',
          calls: updatedCalls,
          status: call.outcome === 'Converted' ? 'Converted' : lead.status
        };
      }
      return lead;
    }));
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

        {loading ? <p role="status">Loading assigned leads...</p> : error ? <div role="alert">{error} <button onClick={() => setVersion(v => v + 1)}>Retry</button></div> : <Outlet />}
      </main>
    </TelecallerContext.Provider>
  );
}
