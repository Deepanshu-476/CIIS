import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePremium.css";
import Header from "../components/CiisNavbar";
import Footer from "../components/CiisFooter";
import BookDemoModal from "../components/landing/BookDemoModal";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBox,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCpu,
  FiDatabase,
  FiGrid,
  FiLayers,
  FiMessageSquare,
  FiMonitor,
  FiPlayCircle,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiZap
} from "react-icons/fi";

const productViews = [
  {
    id: "people",
    label: "People",
    kicker: "HR & workforce",
    title: "Everything about your people, in one place.",
    copy: "Employee records, attendance, leave, roles, branches and approvals stay connected instead of living in separate tools.",
    bullets: ["Central employee directory", "Attendance and leave visibility", "Role-based access by business"],
    stats: [["Present", "856"], ["Late", "32"], ["On leave", "18"]]
  },
  {
    id: "work",
    label: "Work",
    kicker: "Tasks & projects",
    title: "Know what is moving, blocked or overdue.",
    copy: "Assign work, track ownership and see delivery status across teams without chasing updates in multiple chats.",
    bullets: ["Live task ownership", "Priority and due-date tracking", "Cross-team visibility"],
    stats: [["Open tasks", "342"], ["In progress", "128"], ["Overdue", "17"]]
  },
  {
    id: "crm",
    label: "CRM",
    kicker: "Clients & revenue",
    title: "Turn every lead into an accountable workflow.",
    copy: "Keep leads, clients, follow-ups and assigned owners connected to the same operating system used by the rest of your business.",
    bullets: ["Lead and client pipeline", "Follow-up ownership", "Activity history"],
    stats: [["New leads", "48"], ["Follow-ups", "21"], ["Won", "12"]]
  },
  {
    id: "assets",
    label: "Assets",
    kicker: "Operations",
    title: "Track what your business owns and who is using it.",
    copy: "Manage company assets, requests and assignments with business and branch context built in.",
    bullets: ["Asset inventory", "Employee assignment history", "Request and approval flow"],
    stats: [["Assigned", "246"], ["Available", "64"], ["Requests", "9"]]
  },
  {
    id: "reports",
    label: "Reports",
    kicker: "Insights",
    title: "See what needs attention before it becomes a problem.",
    copy: "Operational reports combine workforce, work and performance data so owners can act from one view.",
    bullets: ["Cross-business summaries", "Attendance and task trends", "Export-ready reporting"],
    stats: [["Businesses", "3"], ["Branches", "8"], ["Reports", "24"]]
  },
  {
    id: "ai",
    label: "AI",
    kicker: "Business assistant",
    title: "Ask your business a question. Get an actionable answer.",
    copy: "CIIS AI is designed to read connected business context and surface what needs attention without hunting through screens.",
    bullets: ["Natural-language questions", "Instant operational summaries", "Action-oriented insights"],
    stats: [["Alerts", "7"], ["Insights", "14"], ["Actions", "5"]]
  }
];

const roles = [
  { icon: FiBriefcase, title: "Owner / Super Admin", text: "Central control across businesses, branches, teams and reports." },
  { icon: FiUsers, title: "Manager", text: "Assigned teams, attendance, tasks, clients and operational visibility." },
  { icon: FiTarget, title: "Team Lead", text: "Daily execution, team workload, attendance and task ownership." },
  { icon: FiUser, title: "Employee", text: "Simple access to tasks, attendance, leave and profile information." }
];

const useReveal = () => {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return undefined;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.13, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
};

const DashboardPreview = ({ active = "people" }) => {
  const view = productViews.find((item) => item.id === active) || productViews[0];

  return (
    <div className="ph-dashboard-shell">
      <aside className="ph-dashboard-sidebar">
        <div className="ph-dashboard-logo">
          <span>CI</span>
          <strong>CIIS</strong>
        </div>
        {[
          ["Dashboard", FiGrid],
          ["Employees", FiUsers],
          ["Attendance", FiClock],
          ["Tasks", FiCheckCircle],
          ["CRM", FiBriefcase],
          ["Assets", FiBox],
          ["Reports", FiBarChart2],
          ["AI Assistant", FiCpu]
        ].map(([label, Icon], index) => (
          <div className={`ph-side-row ${index === 0 ? "active" : ""}`} key={label}>
            <Icon />
            <span>{label}</span>
          </div>
        ))}
      </aside>

      <div className="ph-dashboard-main">
        <div className="ph-dashboard-topbar">
          <div>
            <small>Workspace overview</small>
            <strong>{view.label} Dashboard</strong>
          </div>
          <div className="ph-dashboard-actions">
            <span><FiSearch /></span>
            <span className="ph-bell"><FiBell /><i /></span>
            <b>AR</b>
          </div>
        </div>

        <div className="ph-dashboard-stat-grid">
          {view.stats.map(([label, value], index) => (
            <article key={label}>
              <span className={`tone-${index + 1}`}><FiActivity /></span>
              <div><small>{label}</small><strong>{value}</strong></div>
              <em>{index === 1 ? "-2.4%" : "+8.6%"}</em>
            </article>
          ))}
        </div>

        <div className="ph-dashboard-content-grid">
          <section className="ph-chart-panel">
            <header><strong>{view.kicker}</strong><small>Last 30 days</small></header>
            <div className="ph-chart">
              <i className="line line-1" />
              <i className="line line-2" />
              <i className="line line-3" />
              <svg viewBox="0 0 520 180" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="phArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity=".24" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="ph-area" d="M0 151 C48 126,75 142,112 111 C158 73,182 98,223 75 C261 54,298 86,333 55 C372 24,407 57,445 34 C476 16,496 28,520 18 L520 180 L0 180 Z" />
                <path className="ph-line-path" d="M0 151 C48 126,75 142,112 111 C158 73,182 98,223 75 C261 54,298 86,333 55 C372 24,407 57,445 34 C476 16,496 28,520 18" />
              </svg>
            </div>
          </section>

          <section className="ph-work-panel">
            <header><strong>Needs attention</strong><small>Live preview</small></header>
            {[
              ["Attendance exception", "4 employees", "urgent"],
              ["Client follow-up", "Due today", "warning"],
              ["Task review", "8 items", "normal"]
            ].map(([title, meta, tone]) => (
              <div className="ph-work-row" key={title}>
                <span className={tone} />
                <div><strong>{title}</strong><small>{meta}</small></div>
                <FiChevronRight />
              </div>
            ))}
          </section>
        </div>

        <div className="ph-activity-strip">
          <span><b /><strong>Live</strong> operations synced</span>
          <span>Updated a few seconds ago</span>
        </div>
      </div>
    </div>
  );
};

const QuickRegister = ({ onSubmit, values, setValues, errors }) => (
  <form className="ph-register-card" onSubmit={onSubmit}>
    <div className="ph-register-head">
      <div>
        <span>Start your workspace</span>
        <h2>Register your company</h2>
      </div>
      <i><FiZap /></i>
    </div>

    <div className="ph-register-fields">
      <label className={errors.company ? "has-error" : ""}>
        <span>Company name</span>
        <input
          value={values.company}
          onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))}
          placeholder="Acme Technologies"
          autoComplete="organization"
        />
      </label>

      <label className={errors.name ? "has-error" : ""}>
        <span>Your name</span>
        <input
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          placeholder="Full name"
          autoComplete="name"
        />
      </label>

      <label className={errors.email ? "has-error" : ""}>
        <span>Work email</span>
        <input
          type="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </label>

      <label className={errors.phone ? "has-error" : ""}>
        <span>Mobile number</span>
        <input
          inputMode="numeric"
          value={values.phone}
          onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))}
          placeholder="10-digit number"
          autoComplete="tel"
        />
      </label>
    </div>

    <button className="ph-register-submit" type="submit">
      Continue company setup <FiArrowRight />
    </button>

    <p><FiShield /> Secure registration. Complete plan and company details on the next step.</p>
  </form>
);

const Home = () => {
  useReveal();
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState("people");
  const [registerValues, setRegisterValues] = useState({ company: "", name: "", email: "", phone: "" });
  const [registerErrors, setRegisterErrors] = useState({});
  const activeView = useMemo(
    () => productViews.find((item) => item.id === activeProduct) || productViews[0],
    [activeProduct]
  );

  const handleRegistrationStart = (event) => {
    event.preventDefault();
    const errors = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerValues.email.trim());

    if (!registerValues.company.trim()) errors.company = true;
    if (!registerValues.name.trim()) errors.name = true;
    if (!emailOk) errors.email = true;
    if (!/^\d{10}$/.test(registerValues.phone)) errors.phone = true;

    setRegisterErrors(errors);
    if (Object.keys(errors).length) return;

    const registrationDraft = {
      companyName: registerValues.company.trim(),
      companyEmail: registerValues.email.trim(),
      companyPhone: registerValues.phone,
      ownerName: registerValues.name.trim(),
      ownerEmail: registerValues.email.trim()
    };

    try {
      sessionStorage.setItem("ciisCompanyRegistrationDraft", JSON.stringify(registrationDraft));
    } catch (error) {
      console.warn("Unable to save registration draft", error);
    }

    navigate("/RegisterCompany", {
      state: {
        registrationDraft,
        source: "homepage",
        returnTo: "/"
      }
    });
  };

  return (
    <>
      <Header onBookDemo={() => setIsDemoModalOpen(true)} />
      <main className="ph-page">
        <section className="ph-hero">
          <div className="ph-aurora ph-aurora-one" />
          <div className="ph-aurora ph-aurora-two" />
          <div className="ph-hero-grid-bg" />

          <div className="ph-shell ph-hero-layout">
            <div className="ph-hero-copy" data-reveal>
              <div className="ph-eyebrow"><FiZap /> AI-powered business operating system</div>
              <h1>
                Run your entire business from one
                <span> intelligent workspace.</span>
              </h1>
              <p>
                Employees, attendance, tasks, CRM, assets, reports and AI stay connected across every business,
                branch and team.
              </p>

              <div className="ph-hero-actions">
                <button className="ph-btn ph-btn-primary" onClick={() => setIsDemoModalOpen(true)} type="button">
                  Book free demo <FiArrowRight />
                </button>
                <button className="ph-btn ph-btn-ghost" onClick={() => document.getElementById("product-experience")?.scrollIntoView({ behavior: "smooth" })} type="button">
                  <FiPlayCircle /> Explore platform
                </button>
              </div>

              <div className="ph-proof-row">
                <span><FiCheck /> Multi-business ready</span>
                <span><FiCheck /> Role-based access</span>
                <span><FiCheck /> Web, mobile & desktop</span>
              </div>

              <div className="ph-hero-word-rail" aria-label="CIIS Network modules">
                <div>
                  <span>Employees</span><i />
                  <span>Attendance</span><i />
                  <span>Tasks</span><i />
                  <span>CRM</span><i />
                  <span>Assets</span><i />
                  <span>AI</span>
                </div>
              </div>
            </div>

            <div className="ph-hero-stage" data-reveal>
              <div className="ph-stage-glow" />
              <div className="ph-dashboard-wrap">
                <DashboardPreview active="people" />
              </div>

              <div className="ph-float-card ph-float-card-one">
                <span><FiTrendingUp /></span>
                <div><small>Team productivity</small><strong>+24%</strong></div>
              </div>

              <div className="ph-float-card ph-float-card-two">
                <span><FiCpu /></span>
                <div><small>AI insight</small><strong>5 actions found</strong></div>
              </div>

              <QuickRegister
                onSubmit={handleRegistrationStart}
                values={registerValues}
                setValues={setRegisterValues}
                errors={registerErrors}
              />
            </div>
          </div>

          <div className="ph-hero-bottom-fade" />
        </section>

        <section className="ph-capability-strip">
          <div className="ph-shell ph-capability-grid" data-reveal>
            {[
              [FiLayers, "10+ connected modules", "One operating system"],
              [FiBriefcase, "Multi-business control", "Business → branch → team"],
              [FiSmartphone, "Flexible attendance", "Web, mobile & biometric-ready"],
              [FiShield, "Role-based access", "Right data for every role"]
            ].map(([Icon, title, text]) => (
              <article key={title}>
                <span><Icon /></span>
                <div><strong>{title}</strong><small>{text}</small></div>
              </article>
            ))}
          </div>
        </section>

        <section className="ph-section ph-ecosystem">
          <div className="ph-shell">
            <div className="ph-section-head" data-reveal>
              <span>One connected platform</span>
              <h2>Your business tools should work together, not against each other.</h2>
              <p>CIIS connects people, work, customers, assets, reports and AI around the same business context.</p>
            </div>

            <div className="ph-orbit-scene" data-reveal>
              <div className="ph-orbit-ring ring-one" />
              <div className="ph-orbit-ring ring-two" />
              <div className="ph-orbit-core">
                <span>CIIS</span>
                <strong>NETWORK</strong>
                <small>Business OS</small>
              </div>

              {[
                ["Employees", FiUsers, "o-1"],
                ["Attendance", FiClock, "o-2"],
                ["Tasks", FiCheckCircle, "o-3"],
                ["CRM", FiBriefcase, "o-4"],
                ["Assets", FiBox, "o-5"],
                ["Reports", FiBarChart2, "o-6"],
                ["AI", FiCpu, "o-7"],
                ["Security", FiShield, "o-8"]
              ].map(([label, Icon, cls]) => (
                <article className={`ph-orbit-node ${cls}`} key={label}>
                  <span><Icon /></span>
                  <strong>{label}</strong>
                </article>
              ))}

              <div className="ph-orbit-caption">
                <span><FiDatabase /> Shared business context</span>
                <span><FiZap /> Automated workflows</span>
                <span><FiActivity /> Live operational visibility</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-product-section" id="product-experience">
          <div className="ph-shell">
            <div className="ph-section-head ph-section-head-left" data-reveal>
              <span>Interactive product tour</span>
              <h2>See the operating system behind your business.</h2>
              <p>Switch between modules to understand how CIIS keeps everyday operations in one connected workspace.</p>
            </div>

            <div className="ph-product-layout" data-reveal>
              <aside className="ph-product-nav">
                {productViews.map((item) => (
                  <button
                    type="button"
                    className={item.id === activeProduct ? "active" : ""}
                    onClick={() => setActiveProduct(item.id)}
                    key={item.id}
                  >
                    <span>{item.label}</span>
                    <small>{item.kicker}</small>
                    <FiChevronRight />
                  </button>
                ))}
              </aside>

              <div className="ph-product-copy">
                <span>{activeView.kicker}</span>
                <h3>{activeView.title}</h3>
                <p>{activeView.copy}</p>
                <ul>
                  {activeView.bullets.map((bullet) => <li key={bullet}><FiCheckCircle />{bullet}</li>)}
                </ul>
                <button type="button" onClick={() => navigate("/RegisterCompany")}>
                  Start with CIIS <FiArrowRight />
                </button>
              </div>

              <div className="ph-product-preview">
                <DashboardPreview active={activeProduct} />
              </div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-multibusiness">
          <div className="ph-shell ph-multibusiness-layout">
            <div className="ph-multibusiness-copy" data-reveal>
              <span>Built for business groups</span>
              <h2>One login. Multiple businesses. Complete control.</h2>
              <p>
                Keep businesses separated where they need to be, while giving owners a central view across branches,
                departments, managers and teams.
              </p>
              <ul>
                <li><FiCheck /> Central owner / super-admin control</li>
                <li><FiCheck /> Business, branch and department structure</li>
                <li><FiCheck /> Fine-grained role permissions</li>
                <li><FiCheck /> Consolidated operational reporting</li>
              </ul>
              <button type="button" onClick={() => setIsDemoModalOpen(true)}>See multi-business demo <FiArrowRight /></button>
            </div>

            <div className="ph-org-canvas" data-reveal>
              <div className="ph-org-owner"><span><FiUser /></span><div><small>Owner / Super Admin</small><strong>Central Workspace</strong></div></div>
              <div className="ph-org-line line-main" />
              <div className="ph-org-business-grid">
                {[
                  ["Business 1", "Head Office", "24"],
                  ["Business 2", "Regional Office", "18"],
                  ["Business 3", "Branch Network", "32"]
                ].map(([name, type, people], index) => (
                  <article key={name}>
                    <span className={`org-icon org-${index + 1}`}><FiBriefcase /></span>
                    <strong>{name}</strong>
                    <small>{type}</small>
                    <div><i /><span>{people} people</span></div>
                    <footer>
                      <span><FiUsers /> Teams</span>
                      <span><FiLayers /> Branches</span>
                    </footer>
                  </article>
                ))}
              </div>
              <div className="ph-org-live"><i /> Live data isolation by business</div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-attendance">
          <div className="ph-shell">
            <div className="ph-section-head" data-reveal>
              <span>Smart attendance infrastructure</span>
              <h2>Attendance that works the way your company works.</h2>
              <p>Capture punches from different sources, apply company rules and turn them into clean attendance records and reports.</p>
            </div>

            <div className="ph-attendance-flow" data-reveal>
              <div className="ph-attendance-source-group">
                {[
                  [FiActivity, "Fingerprint"],
                  [FiUser, "Face recognition"],
                  [FiSmartphone, "Mobile"],
                  [FiMonitor, "Web check-in"]
                ].map(([Icon, label]) => (
                  <article key={label}><span><Icon /></span><strong>{label}</strong></article>
                ))}
              </div>

              <div className="ph-flow-arrow"><i /><FiArrowRight /></div>

              <article className="ph-flow-engine">
                <span><FiCpu /></span>
                <small>CIIS</small>
                <strong>Attendance Engine</strong>
                <i className="pulse-one" /><i className="pulse-two" />
              </article>

              <div className="ph-flow-arrow"><i /><FiArrowRight /></div>

              <article className="ph-flow-rules">
                <span>Rules</span>
                <strong>Shift · Grace · Late · OT</strong>
                <small>Company policy applied automatically</small>
              </article>

              <div className="ph-flow-arrow"><i /><FiArrowRight /></div>

              <article className="ph-flow-result">
                <span><FiBarChart2 /></span>
                <strong>Reports & payroll-ready data</strong>
                <small>Accurate, traceable and export-ready</small>
              </article>
            </div>

            <div className="ph-attendance-stats" data-reveal>
              {[
                ["Present", "856", "good"],
                ["Late", "32", "warn"],
                ["On leave", "18", "info"],
                ["Missing punch", "4", "danger"]
              ].map(([label, value, tone]) => (
                <article className={tone} key={label}><span>{value}</span><strong>{label}</strong><small>Demo preview</small></article>
              ))}
            </div>
          </div>
        </section>

        <section className="ph-section ph-ai-section">
          <div className="ph-shell ph-ai-layout">
            <div className="ph-ai-chat" data-reveal>
              <header>
                <div><span><FiCpu /></span><strong>CIIS AI Assistant</strong></div>
                <small><i /> Online</small>
              </header>

              <div className="ph-ai-conversation">
                <div className="ph-ai-question">Who needs my attention today?</div>
                <div className="ph-ai-answer">
                  <span><FiZap /></span>
                  <div>
                    <strong>Here is what needs attention:</strong>
                    <ul>
                      <li><b>12 employees</b> have attendance exceptions.</li>
                      <li><b>5 tasks</b> are overdue across two teams.</li>
                      <li><b>3 leads</b> need follow-up today.</li>
                      <li><b>1 device</b> has not synced recently.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="ph-ai-actions">
                <button type="button">Review attendance</button>
                <button type="button">Open overdue tasks</button>
                <button type="button">Follow up leads</button>
              </div>

              <div className="ph-ai-input"><span>Ask anything about your business...</span><FiArrowRight /></div>
            </div>

            <div className="ph-ai-copy" data-reveal>
              <span>Not just another chatbot</span>
              <h2>Meet your AI business assistant.</h2>
              <p>
                CIIS AI is positioned inside the operating system, so answers can be connected to real business context,
                teams and workflows.
              </p>
              <div className="ph-ai-feature-grid">
                {[
                  [FiMessageSquare, "Ask", "Natural-language questions"],
                  [FiBarChart2, "Summarize", "Instant business summaries"],
                  [FiActivity, "Detect", "Surface anomalies and delays"],
                  [FiZap, "Act", "Move from insight to workflow"]
                ].map(([Icon, title, text]) => (
                  <article key={title}><span><Icon /></span><div><strong>{title}</strong><small>{text}</small></div></article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ph-section ph-role-section">
          <div className="ph-shell">
            <div className="ph-section-head" data-reveal>
              <span>Right experience for every role</span>
              <h2>Simple for employees. Powerful for owners.</h2>
              <p>Each person sees only the tools and data they are allowed to access.</p>
            </div>

            <div className="ph-role-grid" data-reveal>
              {roles.map(({ icon: Icon, title, text }, index) => (
                <article key={title}>
                  <span className={`role-tone-${index + 1}`}><Icon /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <i><FiArrowRight /></i>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ph-section ph-final-cta">
          <div className="ph-shell" data-reveal>
            <div className="ph-final-panel">
              <div className="ph-final-grid" />
              <div>
                <span>Ready when you are</span>
                <h2>Build one connected operating system for your business.</h2>
                <p>Register your company or book a guided product walkthrough with the CIIS Network team.</p>
              </div>
              <div className="ph-final-actions">
                <button type="button" onClick={() => navigate("/RegisterCompany")}>Register your company <FiArrowRight /></button>
                <button type="button" onClick={() => setIsDemoModalOpen(true)}>Book free demo</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BookDemoModal open={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  );
};

export default Home;
