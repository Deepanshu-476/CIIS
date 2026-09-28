// CIIS Network marketing site — Solutions & Use Cases (/usecases, /solutions).
import React from "react";
import SiteNav from "../components/SiteNav.jsx";
import MkLink from "../components/MkLink.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const USECASES = [
  {
    id: "it",
    n: "IT Companies & Software Houses",
    i: "code",
    color: "#2563eb",
    prob: "Project status, developer attendance, task deadlines and client updates live in 4 different tools. Daily standups take 45 minutes just to figure out what happened yesterday.",
    help: "Tasks, projects, developer attendance and client deliverables connect directly to each employee's record with automated progress tracking.",
    modules: [
      { name: "Task Management", href: "/work/tasks", icon: "task_alt" },
      { name: "Project Management", href: "/work/projects", icon: "account_tree" },
      { name: "Smart Attendance", href: "/people/attendance", icon: "fingerprint" },
      { name: "Client Portal", href: "/clients/client-management", icon: "open_in_browser" }
    ],
    stats: [["35%", "Time saved in standups"], ["100%", "Accurate client billing"], ["0", "Missing task handoffs"]]
  },
  {
    id: "agencies",
    n: "Digital & Creative Agencies",
    i: "campaign",
    color: "#7c3aed",
    prob: "Client approvals get lost in WhatsApp groups. Creative revisions are scattered across email threads and nobody knows if work is on track.",
    help: "Every client has a dedicated portal for services, deliverables, revision tasks, and real-time meeting schedules.",
    modules: [
      { name: "Client Management", href: "/clients/client-management", icon: "business_center" },
      { name: "Task Management", href: "/work/tasks", icon: "task_alt" },
      { name: "Meetings", href: "/work/meetings", icon: "video_call" },
      { name: "Team Chat", href: "/work/chat", icon: "chat" }
    ],
    stats: [["4x", "Faster client sign-offs"], ["1", "Central workspace"], ["24/7", "Client visibility"]]
  },
  {
    id: "realestate",
    n: "Real Estate & Construction",
    i: "apartment",
    color: "#0891b2",
    prob: "Site staff and sales executives work in the field. Fake attendance, delayed site reports, and lost property leads cause major revenue leaks.",
    help: "Geo-fenced GPS & selfie clock-in verifies real site presence. Daily site work is tracked as checklists with photo updates.",
    modules: [
      { name: "Attendance & GPS", href: "/people/attendance", icon: "fingerprint" },
      { name: "Task Management", href: "/work/tasks", icon: "task_alt" },
      { name: "Company Assets", href: "/people/assets", icon: "devices" },
      { name: "Alerts & Push", href: "/work/alerts", icon: "notifications_active" }
    ],
    stats: [["100%", "Verified field presence"], ["0%", "Proxy attendance"], ["Instant", "Site updates"]]
  },
  {
    id: "education",
    n: "Education & Coaching Institutes",
    i: "school",
    color: "#ea580c",
    prob: "Faculty timings, branch schedules and monthly faculty payroll are tracked across paper registers and separate Excel sheets.",
    help: "Shift-based attendance rules, automated half-day deductions, and 1-click salary generation for teaching and non-teaching staff.",
    modules: [
      { name: "Shift Management", href: "/people/shifts", icon: "schedule" },
      { name: "Attendance", href: "/people/attendance", icon: "fingerprint" },
      { name: "Payroll", href: "/people/payroll", icon: "payments" },
      { name: "Leave Approvals", href: "/people/leave", icon: "event_available" }
    ],
    stats: [["2 hours", "Monthly payroll processing"], ["Multi-shift", "Flexible timing rules"], ["100%", "Leave compliance"]]
  },
  {
    id: "services",
    n: "Field Service & Operations",
    i: "home_repair_service",
    color: "#059669",
    prob: "Customer tickets arrive through calls and WhatsApp. No visibility into technician workload, ticket assignment, or inventory used.",
    help: "Tickets automatically convert into assigned technician tasks. Managers track SLA resolution, technician locations, and client signoffs.",
    modules: [
      { name: "Support Desk", href: "/clients/support", icon: "support_agent" },
      { name: "Task Management", href: "/work/tasks", icon: "task_alt" },
      { name: "Asset Tracking", href: "/people/assets", icon: "devices" },
      { name: "Team Chat", href: "/work/chat", icon: "chat" }
    ],
    stats: [["50%", "Faster ticket resolution"], ["Full", "Technician visibility"], ["Live", "Inventory tracking"]]
  },
  {
    id: "enterprise",
    n: "Multi-Branch & Growing Enterprises",
    i: "account_balance",
    color: "#1d4ed8",
    prob: "Head office receives branch attendance, sales, and employee data weeks late. Fragmented software prevents a consolidated view.",
    help: "Single dashboard with branch-level access control, unified organizational hierarchy, and company-wide real-time audit reports.",
    modules: [
      { name: "Employee Directory", href: "/people/employees", icon: "badge" },
      { name: "Payroll Process", href: "/people/payroll", icon: "payments" },
      { name: "Attendance Insights", href: "/insights", icon: "insights" },
      { name: "Client Management", href: "/clients/client-management", icon: "business_center" }
    ],
    stats: [["Unified", "All branches in 1 view"], ["Role-based", "Page level permissions"], ["Live", "Company analytics"]]
  }
];

export default class SolutionsPage extends React.Component {
  state = { selectedId: "it" };

  render() {
    const selected = USECASES.find(u => u.id === this.state.selectedId) || USECASES[0];

    return (
      <>
        <SiteNav active="solutions" />
        
        <header id="top" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(65% 60% at 50% 15%, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%), linear-gradient(180deg, #070d24 0%, #0b1437 75%, #0f1b4d 100%)", color: "#fff", padding: "clamp(140px, 13vw, 170px) clamp(18px, 5vw, 64px) clamp(48px, 6vw, 72px)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px)", backgroundSize: "56px 56px", WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)", maskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", maxWidth: "980px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "20px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 16px", borderRadius: "999px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", fontSize: "13px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#93c5fd" }}>
              <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px" }}>hub</span>
              Solutions & Use Cases
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 64px)", lineHeight: "1.05", letterSpacing: "-.04em", fontWeight: "800", textWrap: "balance" }}>
              Built for how your business <span style={{ background: "linear-gradient(90deg, #93c5fd 0%, #60a5fa 50%, #a5b4fc 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>actually works.</span>
            </h1>
            <p style={{ margin: 0, fontSize: "clamp(16px, 1.5vw, 20px)", lineHeight: "1.6", color: "#cbd5e1", maxWidth: "700px" }}>
              See how IT firms, digital agencies, field teams, and multi-branch companies run their entire operations with one connected system instead of disconnected tools.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
              <MkLink href="/book-demo" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 26px", borderRadius: "999px", background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)", color: "#fff", fontWeight: "600", fontSize: "15px", textDecoration: "none", boxShadow: "0 8px 24px rgba(37,99,235,.4)" }}>
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "20px" }}>play_circle</span>
                Schedule a Tailored Demo
              </MkLink>
              <MkLink href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 24px", borderRadius: "999px", background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontWeight: "600", fontSize: "15px", textDecoration: "none" }}>
                View Plans & Pricing
              </MkLink>
            </div>
          </div>
        </header>

        {/* Tab selection */}
        <section style={{ padding: "40px clamp(18px, 5vw, 64px) 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "12px", scrollbarWidth: "none" }}>
              {USECASES.map(u => {
                const isActive = u.id === selected.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => this.setState({ selectedId: u.id })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      borderRadius: "14px",
                      border: isActive ? `2px solid ${u.color}` : "1px solid #cbd5e1",
                      background: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                      color: isActive ? "#0f172a" : "#64748b",
                      fontWeight: isActive ? "700" : "600",
                      fontSize: "14.5px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: isActive ? "0 4px 14px -3px rgba(15,23,42,0.12)" : "none",
                      transition: "all .2s ease"
                    }}
                  >
                    <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "20px", color: isActive ? u.color : "#94a3b8" }}>{u.i}</span>
                    {u.n}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Active Selected Case Deep Dive */}
        <section style={{ padding: "clamp(48px, 6vw, 80px) clamp(18px, 5vw, 64px)", background: "#ffffff" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))", gap: "40px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${selected.color}15`, color: selected.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Material Symbols Rounded'", fontSize: "26px" }}>
                  {selected.i}
                </span>
                <div>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", letterSpacing: ".08em", textTransform: "uppercase", color: selected.color }}>Solution Spotlight</span>
                  <h2 style={{ margin: 0, fontSize: "clamp(26px, 3.2vw, 38px)", fontWeight: "800", color: "#0f172a", letterSpacing: "-.02em" }}>{selected.n}</h2>
                </div>
              </div>

              {/* Before vs After */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "16px 20px", borderRadius: "16px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", color: "#ef4444", flex: "none" }}>cancel</span>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#b91c1c", display: "block", marginBottom: "2px" }}>The Problem With Separate Apps</span>
                    <p style={{ margin: 0, fontSize: "14.5px", lineHeight: "1.55", color: "#7f1d1d" }}>{selected.prob}</p>
                  </div>
                </div>

                <div style={{ padding: "16px 20px", borderRadius: "16px", background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", color: "#10b981", flex: "none" }}>check_circle</span>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#047857", display: "block", marginBottom: "2px" }}>How CIIS Network Solves It</span>
                    <p style={{ margin: 0, fontSize: "14.5px", lineHeight: "1.55", color: "#065f46" }}>{selected.help}</p>
                  </div>
                </div>
              </div>

              {/* Connected Modules */}
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", letterSpacing: ".06em", display: "block", marginBottom: "12px" }}>Key Connected Modules</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                  {selected.modules.map((m, i) => (
                    <MkLink
                      key={i}
                      href={m.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: "#0f172a",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "14px",
                        transition: "all .2s ease"
                      }}
                    >
                      <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "20px", color: selected.color }}>{m.icon}</span>
                      <span>{m.name}</span>
                      <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px", color: "#94a3b8", marginLeft: "auto" }}>arrow_forward</span>
                    </MkLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Right card: Stats & visual summary */}
            <div style={{ padding: "36px", borderRadius: "28px", background: "linear-gradient(135deg, #0b1437 0%, #172554 100%)", color: "#fff", display: "flex", flexDirection: "column", gap: "28px", boxShadow: "0 24px 60px -16px rgba(11,20,55,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "#93c5fd" }}>Impact Summary</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.12)" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }}></span>
                  Validated
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", textAlign: "center" }}>
                {selected.stats.map(([num, lbl], i) => (
                  <div key={i} style={{ padding: "16px 10px", borderRadius: "18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "clamp(24px, 2.5vw, 32px)", fontWeight: "800", color: "#93c5fd", letterSpacing: "-.02em" }}>{num}</div>
                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px", lineHeight: "1.3" }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "20px", borderRadius: "18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "700", color: "#bfdbfe" }}>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px" }}>verified</span>
                  Why Companies Switch to CIIS
                </div>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.6", color: "#e2e8f0" }}>
                  Instead of paying ₹1,500+ per employee across 5 different software tools, CIIS Network offers an integrated suite starting with only what you need, expanding seamlessly with zero data re-entry.
                </p>
              </div>

              <MkLink href="/RegisterCompany" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "15px 24px", borderRadius: "999px", background: "#ffffff", color: "#0b1437", fontWeight: "700", fontSize: "15px", textDecoration: "none" }}>
                Start 90 Days Free for {selected.n}
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px" }}>arrow_forward</span>
              </MkLink>
            </div>
          </div>
        </section>

        {/* All industries grid */}
        <section style={{ padding: "clamp(48px, 6vw, 80px) clamp(18px, 5vw, 64px)", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".1em", color: "#2563eb" }}>Explore All Verticals</span>
              <h2 style={{ margin: "8px 0 0", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: "800", color: "#0f172a", letterSpacing: "-.03em" }}>Every Team. Every Industry.</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "20px" }}>
              {USECASES.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    this.setState({ selectedId: u.id });
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  style={{
                    padding: "26px",
                    borderRadius: "22px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                    transition: "all .25s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${u.color}15`, color: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Material Symbols Rounded'", fontSize: "22px" }}>
                      {u.i}
                    </span>
                    <span style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>{u.n}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.55", color: "#475569" }}>{u.help}</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13.5px", fontWeight: "600", color: u.color, marginTop: "auto" }}>
                    View tailored workflows
                    <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px" }}>arrow_forward</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SiteFooter headline="Ready to modernize your company's workflows?" sub="Experience CIIS Network configured for your specific industry with a live guided tour." />
      </>
    );
  }
}
