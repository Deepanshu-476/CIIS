// CIIS Network marketing site — Resources & FAQ (/resources, /faq).
import React from "react";
import SiteNav from "../components/SiteNav.jsx";
import MkLink from "../components/MkLink.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const FAQS = [
  {
    q: "Can I buy only the Attendance module?",
    a: "Yes. CIIS Network is completely modular. You can start with only Smart Attendance on its own and add other modules (like Payroll, Tasks, or Projects) whenever you are ready. Your attendance data will already be connected seamlessly."
  },
  {
    q: "Can I use only the Payroll module without Attendance?",
    a: "Payroll can be used on its own by entering working days directly. However, it works best alongside Attendance because working days, late marks, half-days, and approved leaves flow automatically into salary calculations without manual data entry."
  },
  {
    q: "Can we add more modules or employees later as we grow?",
    a: "Yes. You can activate new modules or upgrade employee counts anytime from your dashboard. New modules instantly use the same employees, branches, and logins — nothing needs to be re-entered."
  },
  {
    q: "Can employees use CIIS on Android and iOS mobile devices?",
    a: "Yes. Employees can clock in with GPS and selfie verification, view their monthly attendance calendar, apply for leave, check tasks, join meetings, and receive push notifications from the CIIS mobile app on both Android and iOS."
  },
  {
    q: "Does CIIS support multiple departments, branches, and custom shifts?",
    a: "Yes. You can structure your entire organization with multi-branch management, department hierarchies, and custom shifts (morning, evening, rotational, night) with custom grace periods and half-day rules."
  },
  {
    q: "Can managers see real-time employee attendance and task performance?",
    a: "Yes. Managers and team leads get live visibility into who is clocked in, who is working on which tasks, overdue deliverables, and team attendance trends, controlled strictly by role-based permissions."
  },
  {
    q: "Can clients access their own dedicated Client Portal?",
    a: "Yes. The Client Portal provides each client an exclusive branded login where they can track ongoing service deliverables, review task updates, access shared documents, view invoice payments, and open support tickets."
  },
  {
    q: "How does the 90-day free trial work?",
    a: "You get full access to CIIS Network for 90 days for your company with zero credit card commitment. You can configure your branches, onboard employees, test GPS attendance, and experience the full platform before selecting a plan."
  },
  {
    q: "Where is company data stored and how secure is it?",
    a: "CIIS Network uses enterprise-grade encrypted cloud infrastructure, encrypted session tokens, strict role-based access control (RBAC), and automated daily backups to ensure your company records remain safe and confidential."
  }
];

const GUIDES = [
  {
    title: "Quick-Start Guide",
    desc: "Set up company branches, departments, and invite your first 10 employees in under 5 minutes.",
    icon: "rocket_launch",
    color: "#2563eb",
    linkText: "Get Started Free",
    href: "/RegisterCompany"
  },
  {
    title: "Attendance & Geo-Fencing",
    desc: "How to configure office GPS coordinates, radius tolerances, and selfie facial recognition rules.",
    icon: "pin_drop",
    color: "#0891b2",
    linkText: "Explore Attendance",
    href: "/people/attendance"
  },
  {
    title: "Automated Payroll Run",
    desc: "Step-by-step walkthrough on setting up salary structures, allowances, deductions, and generating payslips.",
    icon: "receipt_long",
    color: "#16a34a",
    linkText: "Explore Payroll",
    href: "/people/payroll"
  },
  {
    title: "Client Portal Onboarding",
    desc: "How to invite clients to their self-service portal for live project updates and invoice tracking.",
    icon: "storefront",
    color: "#7c3aed",
    linkText: "Client Portal Guide",
    href: "/clients/client-management"
  }
];

export default class ResourcesPage extends React.Component {
  state = { openFaq: 0 };

  toggleFaq = (idx) => {
    this.setState(s => ({ openFaq: s.openFaq === idx ? -1 : idx }));
  };

  render() {
    const { openFaq } = this.state;

    return (
      <>
        <SiteNav active="resources" />

        <header id="top" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(65% 60% at 50% 15%, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%), linear-gradient(180deg, #070d24 0%, #0b1437 75%, #0f1b4d 100%)", color: "#fff", padding: "clamp(140px, 13vw, 170px) clamp(18px, 5vw, 64px) clamp(48px, 6vw, 72px)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px)", backgroundSize: "56px 56px", WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)", maskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", maxWidth: "980px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "20px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 16px", borderRadius: "999px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", fontSize: "13px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#93c5fd" }}>
              <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px" }}>help_center</span>
              Resources & Knowledge Base
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 64px)", lineHeight: "1.05", letterSpacing: "-.04em", fontWeight: "800", textWrap: "balance" }}>
              Answers, guides and <span style={{ background: "linear-gradient(90deg, #93c5fd 0%, #60a5fa 50%, #a5b4fc 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>product resources.</span>
            </h1>
            <p style={{ margin: 0, fontSize: "clamp(16px, 1.5vw, 20px)", lineHeight: "1.6", color: "#cbd5e1", maxWidth: "720px" }}>
              Everything you need to learn how CIIS Network streamlines people, work, clients, and insights. Find answers to common questions or connect with our product team.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
              <MkLink href="/book-demo" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 26px", borderRadius: "999px", background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)", color: "#fff", fontWeight: "600", fontSize: "15px", textDecoration: "none", boxShadow: "0 8px 24px rgba(37,99,235,.4)" }}>
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "20px" }}>support_agent</span>
                Talk to Product Specialist
              </MkLink>
              <MkLink href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 24px", borderRadius: "999px", background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontWeight: "600", fontSize: "15px", textDecoration: "none" }}>
                Contact Support
              </MkLink>
            </div>
          </div>
        </header>

        {/* Guides Cards */}
        <section style={{ padding: "clamp(48px, 6vw, 72px) clamp(18px, 5vw, 64px)", background: "#f8fafc" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 36px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".1em", color: "#2563eb" }}>Platform Guides</span>
              <h2 style={{ margin: "8px 0 0", fontSize: "clamp(26px, 3.2vw, 38px)", fontWeight: "800", color: "#0f172a", letterSpacing: "-.02em" }}>Learn How CIIS Operates</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "20px" }}>
              {GUIDES.map((g, i) => (
                <div key={i} style={{ padding: "26px", borderRadius: "22px", background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 2px 10px rgba(15,23,42,0.04)" }}>
                  <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: `${g.color}15`, color: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Material Symbols Rounded'", fontSize: "24px" }}>
                    {g.icon}
                  </span>
                  <div>
                    <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{g.title}</h3>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.55", color: "#475569" }}>{g.desc}</p>
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: "10px" }}>
                    <MkLink href={g.href} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "700", color: g.color, textDecoration: "none" }}>
                      {g.linkText}
                      <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px" }}>arrow_forward</span>
                    </MkLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section style={{ padding: "clamp(48px, 6vw, 84px) clamp(18px, 5vw, 64px)", background: "#ffffff" }}>
          <div style={{ maxWidth: "880px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".1em", color: "#2563eb" }}>Frequently Asked Questions</span>
              <h2 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: "800", color: "#0f172a", letterSpacing: "-.03em" }}>Everything You Need to Know</h2>
              <p style={{ margin: "10px auto 0", fontSize: "15px", color: "#64748b", maxWidth: "560px" }}>Common questions business owners, HR managers, and IT heads ask when evaluating CIIS Network.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: "18px",
                      border: "1px solid #e2e8f0",
                      background: isOpen ? "#f8fafc" : "#ffffff",
                      overflow: "hidden",
                      transition: "all .2s ease"
                    }}
                  >
                    <button
                      onClick={() => this.toggleFaq(idx)}
                      style={{
                        width: "100%",
                        padding: "20px 22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        background: "none",
                        border: 0,
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#0f172a"
                      }}
                    >
                      <span style={{ fontSize: "16.5px", fontWeight: "700", lineHeight: "1.4" }}>{faq.q}</span>
                      <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: isOpen ? "#2563eb" : "#f1f5f9", color: isOpen ? "#ffffff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Material Symbols Rounded'", fontSize: "20px", flex: "none", transition: "all .2s ease" }}>
                        {isOpen ? "remove" : "add"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div style={{ padding: "0 22px 20px 22px", fontSize: "15px", lineHeight: "1.65", color: "#475569", borderTop: "1px solid #edf2f7" }}>
                        <p style={{ margin: 0, paddingTop: "14px" }}>{faq.a}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Support & Contact Help Banner */}
        <section style={{ padding: "60px clamp(18px, 5vw, 64px)", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px", borderRadius: "28px", background: "radial-gradient(60% 90% at 100% 0%, rgba(96,165,250,.4) 0%, rgba(96,165,250,0) 60%), #0b1437", color: "#fff", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
            <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".1em", color: "#93c5fd" }}>Have a unique question?</span>
              <h2 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: "800", letterSpacing: "-.02em" }}>Talk directly with our solutions team.</h2>
              <p style={{ margin: 0, fontSize: "14.5px", color: "#cbd5e1", lineHeight: "1.6" }}>
                We help companies migrate from spreadsheets, biometric devices, or disconnected tools with tailored setup assistance.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <MkLink href="/contact" style={{ padding: "14px 24px", borderRadius: "999px", background: "#ffffff", color: "#0b1437", fontWeight: "700", fontSize: "15px", textDecoration: "none", whiteSpace: "nowrap" }}>
                Send a Message
              </MkLink>
              <MkLink href="/book-demo" style={{ padding: "14px 24px", borderRadius: "999px", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#ffffff", fontWeight: "700", fontSize: "15px", textDecoration: "none", whiteSpace: "nowrap" }}>
                Book Live Demo
              </MkLink>
            </div>
          </div>
        </section>

        <SiteFooter headline="One connected system for people, work, and clients." sub="Join growing businesses running their company operations on CIIS Network." />
      </>
    );
  }
}
