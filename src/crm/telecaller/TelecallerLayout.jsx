import React, { useEffect, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { TELECALLER_BASE as BASE, TELECALLER_PAGES, hasTelecallerCompanyAccess } from "./telecallerPages";
import { DEMO_DATE, leads, initialCalls } from "./demoData";
import {
  getCurrentUserId,
  loadPagePermission,
  hasPageAccess,
} from "../../utils/pageAccess";
import "./Telecaller.css";
import "./DashboardComponents.css";
import "./CallComponents.css";
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
  const previewKey = `ciis-telecaller-preview:${getCompany()?._id || "company"}:${getCurrentUserId()}`;
  return <TelecallerSession key={previewKey} {...{ slug, previewKey }} />;
}

function TelecallerSession({ slug, previewKey }) {
  const [calls, setCalls] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(previewKey));
      return Array.isArray(saved) &&
        saved.every(
          (call) =>
            call?.id &&
            leads.some((lead) => lead.id === call.leadId) &&
            typeof call.date === "string",
        )
        ? saved
        : initialCalls;
    } catch {
      return initialCalls;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(previewKey, JSON.stringify(calls));
    } catch {
      /* Preview remains usable without browser storage. */
    }
  }, [calls, previewKey]);

  const [access, setAccess] = useState([]);
  const [editAllowed, setEditAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAccess([]);
    setEditAllowed(false);
    const company = getCompany();
    Promise.all(
      TELECALLER_PAGES.map(async (page) => {
        if (!hasTelecallerCompanyAccess(page, company)) return null;
        try {
          const permission = await loadPagePermission(page.path);
          return hasPageAccess(permission, getCurrentUserId(), "view")
            ? {
                slug: page.slug,
                edit: hasPageAccess(permission, getCurrentUserId(), "edit"),
              }
            : null;
        } catch {
          return null;
        }
      }),
    ).then((pages) => {
      if (!cancelled) {
        setAccess(pages.filter(Boolean).map((p) => p.slug));
        setEditAllowed(
          Boolean(pages.find((p) => p?.slug === "call-workspace")?.edit),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const can = (key) => access.includes(key);

  const enriched = calls.map((call) => ({
    ...leads.find((lead) => lead.id === call.leadId),
    ...call,
    id: call.leadId,
    rowId: call.id,
  }));

  const assigned = leads.map((lead) => {
    const last = calls.find((call) => call.leadId === lead.id);
    return {
      ...lead,
      ...(last || {}),
      id: lead.id,
      status: last?.outcome === "Converted" ? "Converted" : lead.status,
    };
  });

  const today = enriched.filter((row) => row.date && row.date.startsWith(DEMO_DATE));
  const followups = assigned.filter(
    (row) => row.followUp && row.status !== "Converted",
  );
  const pending = assigned.filter(
    (row) => !row.date && row.status !== "Converted",
  );
  const converted = assigned.filter((row) => row.status === "Converted");
  const page = TELECALLER_PAGES.find((page) => page.slug === slug);
  const saveCall = (call) => setCalls((current) => [call, ...current]);

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

        <Outlet />
      </main>
    </TelecallerContext.Provider>
  );
}
