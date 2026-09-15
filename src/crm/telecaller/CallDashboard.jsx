import React from "react";
import { Link } from "react-router-dom";
import {
  PhoneIncoming,
  Users,
  Calendar,
  ThumbsUp,
  Eye,
  ChevronRight,
  PhoneCall,
  Clock,
  Hourglass,
  CalendarClock
} from "lucide-react";

import { DEMO_DATE } from "./demoData";
import { TELECALLER_BASE as BASE, TELECALLER_PAGES } from "./telecallerPages";
import {
  Panel,
  Metrics,
  Schedule,
  quickLinks,
} from "./DashboardComponents";
import { DataTable } from "./CallComponents";
import { useTelecaller } from "./useTelecaller";

export default function CallDashboard() {
  const { enriched, assigned, today, followups, can } = useTelecaller();

  const metrics = [
    {
      label: "My Assigned Leads",
      value: assigned.filter((row) => row.status !== "Converted").length || 2,
      Icon: Users,
      tone: "purple",
      badgeText: "👥 Active Leads",
      badgeTone: "purple"
    },
    {
      label: "Today's Calls",
      value: today.length || 0,
      Icon: PhoneIncoming,
      tone: "teal",
      badgeText: "🗂 Completed Today",
      badgeTone: "teal"
    },
    {
      label: "Pending Follow Ups",
      value: followups.length || 0,
      Icon: Calendar,
      tone: "orange",
      badgeText: "🕒 Needs Attention",
      badgeTone: "orange"
    },
    {
      label: "Interested Leads",
      value: assigned.filter((row) => row.outcome === "Interested").length || 0,
      Icon: ThumbsUp,
      tone: "cyan",
      badgeText: "↗ Positive Response",
      badgeTone: "cyan"
    },
  ];

  const dueToday = followups.filter((row) =>
    row.followUp && row.followUp.startsWith(DEMO_DATE)
  );
  const upcoming = followups
    .filter((row) => row.followUp && row.followUp.slice(0, 10) >= DEMO_DATE)
    .sort((a, b) => a.followUp.localeCompare(b.followUp));

  return (
    <div className="tcd-dashboard">
      <Metrics items={metrics} />

      {/* Quick Access Grid Card */}
      <Panel title="Quick Access" subtitle="Navigate to call sections">
        <div className="haps-quick-grid">
          {quickLinks
            .filter(([key]) => can(key))
            .map(([key, Icon, description, tone]) => (
              <Link key={key} to={`${BASE}/${key}`} className="haps-quick-card">
                <span className={`haps-quick-icon tone-${tone}`}>
                  <Icon size={18} />
                </span>
                <div className="haps-quick-info">
                  <strong className="haps-quick-title">
                    {TELECALLER_PAGES.find((page) => page.slug === key)?.name}
                  </strong>
                  <span className="haps-quick-desc">{description}</span>
                </div>
                <ChevronRight size={16} className="haps-quick-arrow" />
              </Link>
            ))}
        </div>
      </Panel>

      {/* Two Column Schedules */}
      <div className="haps-schedule-grid">
        <Panel
          title="Today's Follow-ups"
          action={
            <span className="haps-pill-counter counter-orange">
              {dueToday.length} Due
            </span>
          }
        >
          <Schedule rows={dueToday} can={can} />
        </Panel>

        <Panel
          title="Upcoming Scheduled Calls"
          action={
            <span className="haps-pill-counter counter-purple">
              {dueToday.length} Today
            </span>
          }
        >
          <Schedule rows={upcoming} upcoming can={can} />
        </Panel>
      </div>

      {/* Recent Calls Table Card */}
      <DataTable
        rows={enriched}
        title="Recent Calls"
        can={can}
        showViewAll={true}
      />
    </div>
  );
}
