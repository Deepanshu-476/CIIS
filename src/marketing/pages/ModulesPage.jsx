// CIIS Network marketing site — Module Explorer (/modules).
import React from "react";
import SiteNav from "../components/SiteNav.jsx";
import MkLink from "../components/MkLink.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const PILLARS = [
  { id: "all", name: "All Modules", count: 18, color: "#2563eb" },
  { id: "people", name: "People", count: 6, color: "#2563eb", icon: "groups" },
  { id: "work", name: "Work", count: 5, color: "#4f46e5", icon: "task_alt" },
  { id: "clients", name: "Clients", count: 4, color: "#0891b2", icon: "handshake" },
  { id: "insights", name: "Insights", count: 3, color: "#ea580c", icon: "insights" }
];

const MODULES = [
  {
    pillar: "people",
    name: "Employees Directory",
    icon: "badge",
    color: "#2563eb",
    tagline: "Central employee directory with permissions",
    desc: "Profiles with branches, departments, job roles and granular page-level permissions. One master employee record for all tools.",
    bullets: ["Multi-branch hierarchy", "Role-based permissions", "Document management"],
    href: "/people/employees"
  },
  {
    pillar: "people",
    name: "Smart Attendance",
    icon: "fingerprint",
    color: "#2563eb",
    tagline: "GPS, selfie and shift-based attendance",
    desc: "Location-verified mobile and web clock-in inside your office radius. Automatic calculation of present, late marks, half-days and overtime.",
    bullets: ["Office geo-radius verification", "Selfie capture with live timer", "Shift rules & grace periods"],
    href: "/people/attendance"
  },
  {
    pillar: "people",
    name: "Shift Management",
    icon: "schedule",
    color: "#2563eb",
    tagline: "Multi-shift rules and rotation",
    desc: "Configure morning, evening, rotational and flexible shifts with customized break times and grace allowances.",
    bullets: ["Custom shifts per department", "Half-day cutoffs", "Late coming policies"],
    href: "/people/shifts"
  },
  {
    pillar: "people",
    name: "Leave Management",
    icon: "event_available",
    color: "#2563eb",
    tagline: "Policies, balances and approvals",
    desc: "Leave types, quotas, instant mobile applications, and multi-level manager approvals linked straight into attendance.",
    bullets: ["Paid & unpaid leave tracking", "Calendar balance overview", "1-click manager approvals"],
    href: "/people/leave"
  },
  {
    pillar: "people",
    name: "Payroll Processing",
    icon: "payments",
    color: "#2563eb",
    tagline: "Salary structures, calculations & payslips",
    desc: "Turn verified attendance directly into accurate salaries with allowances, deductions, PF/ESI structures, and downloadable payslips.",
    bullets: ["Dynamic salary components", "Attendance-driven calculations", "PDF payslip generation"],
    href: "/people/payroll"
  },
  {
    pillar: "people",
    name: "Asset Management",
    icon: "devices",
    color: "#2563eb",
    tagline: "Company asset inventory and custody",
    desc: "Track company laptops, phones, ID badges and equipment with serial numbers, warranty, and return handovers when employees leave.",
    bullets: ["Hardware & software custody", "Employee request workflow", "Asset audit trail"],
    href: "/people/assets"
  },
  {
    pillar: "work",
    name: "Task Management",
    icon: "task_alt",
    color: "#4f46e5",
    tagline: "Personal, department and company tasks",
    desc: "Assign tasks with deadlines, subtasks and priorities. See pending, in-progress, overdue and completed work at a single glance.",
    bullets: ["Status boards & task timers", "Recurring tasks & checklists", "Performance metrics"],
    href: "/work/tasks"
  },
  {
    pillar: "work",
    name: "Project Management",
    icon: "account_tree",
    color: "#4f46e5",
    tagline: "Milestones, contributors and progress",
    desc: "Organize client and internal projects. Progress bars auto-advance as team members complete their assigned tasks.",
    bullets: ["Project milestones & deadlines", "Team member assignments", "Live progress indicators"],
    href: "/work/projects"
  },
  {
    pillar: "work",
    name: "Meetings",
    icon: "video_call",
    color: "#4f46e5",
    tagline: "Team and client video meetings",
    desc: "Schedule internal standups and external client video conferences in the same workspace where tasks and documents live.",
    bullets: ["Calendar schedule syncing", "Integrated meeting links", "Client meeting history"],
    href: "/work/meetings"
  },
  {
    pillar: "work",
    name: "Team Chat & Calling",
    icon: "chat",
    color: "#4f46e5",
    tagline: "Channels, direct messages and calls",
    desc: "Stop mixing work and personal chats on WhatsApp. Built-in direct messages, department channels, and voice/video calling.",
    bullets: ["Department channels", "File and document sharing", "Direct audio/video calls"],
    href: "/work/chat"
  },
  {
    pillar: "work",
    name: "Alerts & Broadcasts",
    icon: "notifications_active",
    color: "#4f46e5",
    tagline: "Instant push notifications & bulletins",
    desc: "Broadcast company-wide announcements, policy changes, urgent notices, or department-specific alerts directly to mobile and web.",
    bullets: ["Mobile push notifications", "Targeted audience alerts", "Read receipts tracking"],
    href: "/work/alerts"
  },
  {
    pillar: "clients",
    name: "Client Management",
    icon: "business_center",
    color: "#0891b2",
    tagline: "Accounts, services, plans and leads",
    desc: "Centralized client profiles with account managers, ongoing services, active projects, payment history, and contact books.",
    bullets: ["Client service assignments", "Lead and deal tracking", "Account manager tagging"],
    href: "/clients/client-management"
  },
  {
    pillar: "clients",
    name: "Client Portal",
    icon: "open_in_browser",
    color: "#0891b2",
    tagline: "Self-service dashboard for clients",
    desc: "Give your clients their own branded login to track task progress, download shared documents, review invoices, and raise support tickets.",
    bullets: ["Real-time task updates", "Invoice and payment records", "Self-service document vault"],
    href: "/clients/client-management"
  },
  {
    pillar: "clients",
    name: "Support Desk",
    icon: "support_agent",
    color: "#0891b2",
    tagline: "Ticket management and resolution operations",
    desc: "Handle customer and client issues with full account context. Convert support tickets into assigned employee tasks with SLA tracking.",
    bullets: ["Ticket queue with priorities", "Auto-assignment to staff", "SLA resolution stats"],
    href: "/clients/support"
  },
  {
    pillar: "insights",
    name: "Attendance Insights",
    icon: "calendar_month",
    color: "#ea580c",
    tagline: "Presence, late marks and leave trends",
    desc: "Understand workforce presence without manual reporting. Visual breakdown of punctuality, shift adherence, and absenteeism by department.",
    bullets: ["Department attendance heatmaps", "Late mark trends", "Work-from-home statistics"],
    href: "/insights"
  },
  {
    pillar: "insights",
    name: "Task & Project Analytics",
    icon: "donut_large",
    color: "#ea580c",
    tagline: "Completion rates, bottlenecks and overdue tasks",
    desc: "Monitor execution velocity. Identify which departments are over-capacity and which projects are lagging behind schedule.",
    bullets: ["Task completion velocity", "Overdue workload alerts", "Individual contributor output"],
    href: "/insights"
  },
  {
    pillar: "insights",
    name: "Payroll Reports",
    icon: "summarize",
    color: "#ea580c",
    tagline: "Monthly salary summaries and payout audits",
    desc: "Complete financial transparency for executive leadership. Download salary summaries, tax deductions, and historical payroll costs.",
    bullets: ["Department salary breakdown", "Historical payout trends", "Audit-ready export reports"],
    href: "/insights"
  }
];

export default class ModulesPage extends React.Component {
  state = { activePillar: "all", search: "" };

  render() {
    const { activePillar, search } = this.state;
    const query = search.trim().toLowerCase();

    const filtered = MODULES.filter(m => {
      const matchPillar = activePillar === "all" || m.pillar === activePillar;
      const matchQuery = !query || m.name.toLowerCase().includes(query) || m.tagline.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query);
      return matchPillar && matchQuery;
    });

    return (
      <>
        <SiteNav active="modules" />

        <header id="top" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(65% 60% at 50% 15%, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%), linear-gradient(180deg, #070d24 0%, #0b1437 75%, #0f1b4d 100%)", color: "#fff", padding: "clamp(140px, 13vw, 170px) clamp(18px, 5vw, 64px) clamp(48px, 6vw, 72px)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px)", backgroundSize: "56px 56px", WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)", maskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", maxWidth: "980px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "20px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 16px", borderRadius: "999px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", fontSize: "13px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#93c5fd" }}>
              <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px" }}>widgets</span>
              Platform Modules Directory
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 64px)", lineHeight: "1.05", letterSpacing: "-.04em", fontWeight: "800", textWrap: "balance" }}>
              Every tool you need. <span style={{ background: "linear-gradient(90deg, #93c5fd 0%, #60a5fa 50%, #a5b4fc 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>One shared database.</span>
            </h1>
            <p style={{ margin: 0, fontSize: "clamp(16px, 1.5vw, 20px)", lineHeight: "1.6", color: "#cbd5e1", maxWidth: "720px" }}>
              Start with a single module or activate the full ecosystem. Explore our 18+ business modules across People, Work, Clients and Analytics.
            </p>

            {/* Quick search input */}
            <div style={{ position: "relative", width: "100%", maxWidth: "480px", marginTop: "10px" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontFamily: "'Material Symbols Rounded'", fontSize: "20px" }}>search</span>
              <input
                type="text"
                value={this.state.search}
                onChange={e => this.setState({ search: e.target.value })}
                placeholder="Search modules (e.g. attendance, payroll, tasks)..."
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
                }}
              />
              {this.state.search ? (
                <button onClick={() => this.setState({ search: "" })} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "#cbd5e1", cursor: "pointer", fontFamily: "'Material Symbols Rounded'", fontSize: "18px" }}>
                  close
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {/* Filter Pills */}
        <section style={{ padding: "28px clamp(18px, 5vw, 64px) 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {PILLARS.map(p => {
              const isActive = activePillar === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => this.setState({ activePillar: p.id })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "999px",
                    border: isActive ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: isActive ? "#2563eb" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 4px 12px rgba(37,99,235,0.25)" : "none",
                    transition: "all .2s ease"
                  }}
                >
                  {p.icon ? <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px" }}>{p.icon}</span> : null}
                  {p.name}
                  <span style={{ fontSize: "12px", opacity: 0.8, padding: "2px 7px", borderRadius: "999px", background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9" }}>
                    {p.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Modules Grid */}
        <section style={{ padding: "clamp(48px, 6vw, 80px) clamp(18px, 5vw, 64px)", background: "#ffffff" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "48px", color: "#cbd5e1" }}>search_off</span>
                <h3 style={{ margin: "12px 0 6px", fontSize: "18px", color: "#0f172a" }}>No modules found</h3>
                <p style={{ margin: 0, fontSize: "14px" }}>Try searching for a different keyword or reset the filter.</p>
                <button onClick={() => this.setState({ activePillar: "all", search: "" })} style={{ marginTop: "16px", padding: "10px 20px", borderRadius: "999px", background: "#0b1437", color: "#fff", border: 0, fontWeight: "600", cursor: "pointer" }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "22px" }}>
                {filtered.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: "24px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      padding: "26px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      boxShadow: "0 4px 16px -4px rgba(15,23,42,0.06)",
                      transition: "transform .2s ease, box-shadow .2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${m.color}14`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Material Symbols Rounded'", fontSize: "26px" }}>
                        {m.icon}
                      </span>
                      <span style={{ padding: "4px 10px", borderRadius: "999px", background: "#f1f5f9", fontSize: "11.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".06em", color: "#475569" }}>
                        {m.pillar}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "19px", fontWeight: "700", color: "#0f172a" }}>{m.name}</h3>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: m.color }}>{m.tagline}</span>
                    </div>

                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.55", color: "#475569" }}>
                      {m.desc}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                      {m.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                          <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px", color: "#10b981" }}>check</span>
                          {b}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                      <MkLink
                        href={m.href}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "14px",
                          fontWeight: "700",
                          color: m.color,
                          textDecoration: "none"
                        }}
                      >
                        Explore Module
                        <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px" }}>arrow_forward</span>
                      </MkLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Modular Pricing Banner */}
        <section style={{ padding: "60px clamp(18px, 5vw, 64px)", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px", borderRadius: "28px", background: "linear-gradient(135deg, #0b1437 0%, #1e3a8a 100%)", color: "#fff", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
            <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".1em", color: "#93c5fd" }}>Simple Modular Pricing</span>
              <h2 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: "800", letterSpacing: "-.02em" }}>Pick only the modules your business needs.</h2>
              <p style={{ margin: 0, fontSize: "14.5px", color: "#cbd5e1", lineHeight: "1.6" }}>
                Need just Attendance and Payroll? Or full Projects and CRM? Build your custom plan with transparent per-employee pricing.
              </p>
            </div>
            <MkLink href="/pricing" style={{ padding: "15px 28px", borderRadius: "999px", background: "#ffffff", color: "#0b1437", fontWeight: "700", fontSize: "15px", textDecoration: "none", whiteSpace: "nowrap" }}>
              View Pricing Plans
            </MkLink>
          </div>
        </section>

        <SiteFooter headline="Start with one module. Expand at your own pace." sub="Connect your employees, attendance, payroll, tasks and clients in minutes." />
      </>
    );
  }
}
