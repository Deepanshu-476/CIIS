import React from "react";
import "./Telecaller.css";

export default function TelecallerSkeleton({ slug = "dashboard" }) {
  const isDashboard = ["dashboard", "call-dashboard"].includes(slug);
  const isWorkspace = ["call-workspace", "lead-detail"].includes(slug);

  if (isWorkspace) {
    return (
      <div className="tc-skeleton-wrapper" role="status" aria-busy="true" aria-label="Loading workspace">
        <div className="tc-skel-workspace">
          <div className="tc-skel-card tc-skel-lead-header">
            <div className="tc-skel-line w-40 h-20" />
            <div className="tc-skel-line w-25 h-14" />
          </div>
          <div className="tc-skel-workspace-grid">
            <div className="tc-skel-card tc-skel-ws-left">
              <div className="tc-skel-line w-60 h-16 mb-16" />
              <div className="tc-skel-line w-100 h-14 mb-10" />
              <div className="tc-skel-line w-80 h-14 mb-10" />
              <div className="tc-skel-line w-90 h-14 mb-10" />
              <div className="tc-skel-line w-50 h-14" />
            </div>
            <div className="tc-skel-card tc-skel-ws-right">
              <div className="tc-skel-line w-40 h-16 mb-16" />
              <div className="tc-skel-box h-120 mb-16" />
              <div className="tc-skel-box h-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isDashboard) {
    // Sub-pages with data table (Assigned Calls, Today's Calls, Pending Calls, etc.)
    return (
      <div className="tc-skeleton-wrapper" role="status" aria-busy="true" aria-label="Loading calls data">
        {/* Table Toolbar Skeleton */}
        <div className="tc-skel-toolbar">
          <div className="tc-skel-box w-200 h-36" />
          <div className="tc-skel-toolbar-right">
            <div className="tc-skel-box w-140 h-36" />
            <div className="tc-skel-box w-140 h-36" />
            <div className="tc-skel-box w-100 h-36" />
          </div>
        </div>

        {/* Data Table Skeleton */}
        <div className="tc-skel-card tc-skel-table-card">
          <div className="tc-skel-table-header">
            <div className="tc-skel-line w-15 h-16" />
            <div className="tc-skel-line w-10 h-16" />
          </div>
          <div className="tc-skel-table">
            <div className="tc-skel-tr tc-skel-th">
              <div className="tc-skel-cell w-30" />
              <div className="tc-skel-cell w-100" />
              <div className="tc-skel-cell w-120" />
              <div className="tc-skel-cell w-90" />
              <div className="tc-skel-cell w-90" />
              <div className="tc-skel-cell w-80" />
              <div className="tc-skel-cell w-70" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="tc-skel-tr" key={i}>
                <div className="tc-skel-cell w-30" />
                <div className="tc-skel-cell w-110" />
                <div className="tc-skel-cell w-130" />
                <div className="tc-skel-cell w-90" />
                <div className="tc-skel-cell w-85" />
                <div className="tc-skel-cell w-75" />
                <div className="tc-skel-cell w-60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard skeleton (KPIs + Charts + Table)
  return (
    <div className="tc-skeleton-wrapper" role="status" aria-busy="true" aria-label="Loading call management">
      {/* 4 KPI Cards Skeleton */}
      <div className="tc-skel-kpis-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="tc-skel-card tc-skel-kpi" key={i}>
            <div className="tc-skel-kpi-top">
              <div className="tc-skel-circle-icon" />
              <div className="tc-skel-line w-60 h-24" />
            </div>
            <div className="tc-skel-line w-40 h-12 mt-12" />
            <div className="tc-skel-line w-50 h-10 mt-6" />
          </div>
        ))}
      </div>

      {/* Two-Column Analytics Charts Skeleton */}
      <div className="tc-skel-charts-grid">
        {/* Left: Call Trends Skeleton */}
        <div className="tc-skel-card tc-skel-chart-card">
          <div className="tc-skel-chart-header">
            <div>
              <div className="tc-skel-line w-120 h-18 mb-6" />
              <div className="tc-skel-line w-180 h-12" />
            </div>
            <div className="tc-skel-box w-130 h-28" />
          </div>
          <div className="tc-skel-chart-legend">
            <div className="tc-skel-box w-80 h-14" />
            <div className="tc-skel-box w-80 h-14" />
          </div>
          <div className="tc-skel-chart-graphic">
            <div className="tc-skel-wave-placeholder" />
          </div>
        </div>

        {/* Right: Call Outcomes Donut Skeleton */}
        <div className="tc-skel-card tc-skel-outcomes-card">
          <div className="tc-skel-chart-header">
            <div className="tc-skel-line w-110 h-18" />
          </div>
          <div className="tc-skel-donut-body">
            <div className="tc-skel-donut-circle" />
            <div className="tc-skel-donut-lines">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="tc-skel-line-group" key={i}>
                  <div className="tc-skel-line w-80 h-12 mb-4" />
                  <div className="tc-skel-line w-100 h-6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calls Table Skeleton */}
      <div className="tc-skel-card tc-skel-table-card">
        <div className="tc-skel-table-header">
          <div className="tc-skel-line w-100 h-18" />
          <div className="tc-skel-box w-80 h-28" />
        </div>
        <div className="tc-skel-table">
          <div className="tc-skel-tr tc-skel-th">
            <div className="tc-skel-cell w-30" />
            <div className="tc-skel-cell w-100" />
            <div className="tc-skel-cell w-120" />
            <div className="tc-skel-cell w-90" />
            <div className="tc-skel-cell w-90" />
            <div className="tc-skel-cell w-80" />
            <div className="tc-skel-cell w-70" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="tc-skel-tr" key={i}>
              <div className="tc-skel-cell w-30" />
              <div className="tc-skel-cell w-110" />
              <div className="tc-skel-cell w-130" />
              <div className="tc-skel-cell w-90" />
              <div className="tc-skel-cell w-85" />
              <div className="tc-skel-cell w-75" />
              <div className="tc-skel-cell w-60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

