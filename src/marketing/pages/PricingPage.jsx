// CIIS Network marketing site — Pricing (/pricing). Generated from the approved design; layout is inline-styled to match it exactly.
import React from "react";
import SiteNav from "../components/SiteNav.jsx";
import MkLink from "../components/MkLink.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import axiosInstance from "../../utils/axiosConfig";

const MODS = [['Employees / HR', 'badge'], ['Attendance', 'fingerprint'], ['Payroll', 'payments'], ['Tasks', 'task_alt'], ['Projects', 'account_tree'], ['Clients', 'handshake'], ['Communication', 'chat'], ['Support', 'support_agent'], ['Analytics', 'insights']];

const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

const getPlanStaticData = (p) => {
  const n = String(p.name || '').trim().toLowerCase();
  const price = Number(p.price || 0);

  if (n.includes('free') || n.includes('trial') || price === 0) {
    return {
      who: "Try the core CIIS platform experience on web and mobile.",
      from: "Free 90-Day Trial",
      note: "Up to 25 active employees",
      pts: ["GPS & selfie attendance", "Tasks & team chat", "Web + mobile app", "No credit card required"],
      tag: "Free 90 Days",
      cta: "Start 90 Days Free",
      href: "/RegisterCompany"
    };
  }
  if (n.includes('payroll') || n.includes('salary')) {
    return {
      who: "Automated payroll processing, salary structures and payslips.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Salary structure assignment", "Attendance-linked payroll", "One-click payslip generation", "Monthly payroll reports"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('crm') || n.includes('telecaller')) {
    return {
      who: "Admin CRM, lead assignment and telecaller call workspace.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Lead management & sources", "Telecaller calling workspace", "Call history & follow-ups", "Live CRM performance reports"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('asset')) {
    return {
      who: "Company asset inventory, employee allocations and requests.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Company asset register", "Issue & track hardware", "Employee asset requests", "Audit-ready assignment logs"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n === 'client task' || n.includes('client task')) {
    return {
      who: "Combined client account management and deliverable tracking.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Client accounts & agreements", "Service-linked task delivery", "Live client task updates", "Web + mobile access"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('client')) {
    if (price >= 10000) {
      return {
        who: "High-volume client operations and custom business workflows.",
        from: "Starting",
        note: "Custom team size & requirements",
        pts: ["Full client operations suite", "Custom volume employee seats", "Multi-branch deployment", "Dedicated support manager"],
        cta: "Talk to us",
        href: "/book-demo",
        ent: true
      };
    }
    return {
      who: "Client account management with dedicated client portal.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Client accounts & services", "Client self-service portal", "Document & file sharing", "Client support tickets"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('task')) {
    return {
      who: "Assign, track and complete tasks across teams and departments.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Create & assign tasks", "Company-wide task tracking", "Status updates & deadlines", "Mobile push alerts"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('project')) {
    return {
      who: "Project planning, team milestones and execution tracking.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Project workspace & members", "Task milestones & progress", "Team & client meetings", "Deliverables tracking"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('hr') || n.includes('people') || n.includes('employee')) {
    return {
      who: "Complete people operations, employee profiles and attendance.",
      from: "Per month",
      note: "Up to 25 active employees",
      pts: ["Employee profiles & directory", "GPS & selfie attendance", "Leave policies & approvals", "Web + mobile access"],
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('premium') || n.includes('pro') || n.includes('suite') || n.includes('complete')) {
    return {
      who: "The complete CIIS ecosystem with all operational modules.",
      from: p.durationDays === 365 ? "Billed annually" : "Per month",
      note: "All modules · Up to 50 active employees",
      pts: ["Every CIIS module unlocked", "People, Work, Clients, Insights", "Admin CRM & client portal", "Priority onboarding & updates"],
      tag: "Best value",
      hl: true,
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (n.includes('normal') || n.includes('growth') || (price >= 3000 && price < 8000)) {
    return {
      who: "Multi-module operations bundle for a growing team.",
      from: "Per month",
      note: "Up to 50 active employees",
      pts: ["Connected operations data", "Department & role permissions", "Tasks, attendance & groups", "Web + mobile app"],
      tag: "Popular",
      cta: "Build My Plan",
      href: "#build"
    };
  }
  if (price >= 8000) {
    return {
      who: "Larger teams, customized workflows and specific requirements.",
      from: "Starting",
      note: "Based on employees, modules & requirements",
      pts: ["Custom volume rate", "Multiple branches & departments", "Tailored onboarding & SLA", "Dedicated account manager"],
      cta: "Talk to us",
      href: "/book-demo",
      ent: true
    };
  }

  const fallbackPts = (Array.isArray(p.features) && p.features.length > 1 && !p.features.includes('test'))
    ? p.features
    : [
        "Core " + (p.name || "module") + " workspace",
        "Web + mobile app access",
        "Live synced company data",
        "Up to 25 active employees"
      ];
  return {
    who: (p.description && p.description.length > 8 && !p.description.toLowerCase().includes('test'))
      ? p.description
      : "Reliable, easy-to-use module for your daily business operations.",
    from: "Per month",
    note: "Up to 25 active employees",
    pts: fallbackPts,
    cta: "Build My Plan",
    href: "#build"
  };
};

const DEFAULT_PLANS = [
  { name: 'Single Module', who: 'One module, e.g. only Attendance or only Payroll.', from: 'Starting', price: 699, durationDays: 30, note: 'Up to 25 active employees', pts: ['Any one CIIS module', 'Web + mobile', 'Module-specific pricing may differ'] },
  { name: 'Any 2 Modules', who: 'Combine two modules that work together.', from: '', price: 1499, durationDays: 30, note: 'Up to 25 active employees', pts: ['Any two modules', 'Connected data between them', 'Web + mobile'] },
  { name: 'Growth', who: 'Any 4 modules for a growing team.', from: '', price: 2999, durationDays: 30, note: 'Up to 50 active employees', pts: ['Any four modules', '₹49 per extra active employee', 'Web + mobile'], tag: 'Popular' },
  { name: 'Business Suite', who: 'The complete CIIS platform.', from: '', price: 3999, durationDays: 30, note: 'Up to 50 active employees', pts: ['Every CIIS module', 'People, Work, Clients, Insights', '₹69 per extra active employee'], hl: true },
  { name: 'Enterprise', who: 'Larger teams and specific requirements.', from: 'Starting', price: 7999, durationDays: 30, note: 'Based on employees, modules and requirements', pts: ['Custom volume rate', 'Multiple branches', 'Tailored onboarding'], ent: true },
];


class PricingPage extends React.Component {
  state = { annual: false, emp: 25, sel: { Attendance: true }, dbPlans: [] };

  fetchPlans = async () => {
    try {
      const response = await axiosInstance.get("/plans");
      const list = response.data?.plans || [];
      const active = list.filter(p => p.isActive !== false);
      if (active.length > 0) {
        active.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        this.setState({ dbPlans: active });
      }
    } catch (e) {
      console.warn("Could not fetch plans for pricing page:", e);
    }
  };
  componentDidMount() { this.track('pricing_view', {}); this.fetchPlans(); }
  track(ev, d) { try { (window.dataLayer = window.dataLayer || []).push({ event: ev, ...d }); if (window.fbq) window.fbq('trackCustom', ev, d); } catch (e) {} }
  calc() {
    const e = Math.max(1, this.state.emp || 1), c = Object.values(this.state.sel).filter(Boolean).length;
    const suite = 3999 + Math.max(0, e - 50) * 69;
    if (c === 0) return { rec: 'Choose a module', note: 'Select at least one module to see a plan.', base: null };
    if (e > 150) return { rec: 'Enterprise', note: 'For teams above 150 active employees we recommend a custom Enterprise plan.', base: 7999, from: true, lines: [['Enterprise', 'from ' + inr(7999)]] };
    if (c >= 5) return { rec: 'Business Suite', note: 'Five or more modules — the complete suite is the better value.', base: suite, lines: [['Business Suite (50 incl.)', inr(3999)], ...(e > 50 ? [[(e - 50) + ' extra × ₹69', inr((e - 50) * 69)]] : [])] };
    if (c >= 3 || e > 25) { const g = 2999 + Math.max(0, e - 50) * 49; if (g >= suite) return { rec: 'Business Suite', note: 'At this size the full suite costs about the same as Growth.', base: suite, lines: [['Business Suite (50 incl.)', inr(3999)], ...(e > 50 ? [[(e - 50) + ' extra × ₹69', inr((e - 50) * 69)]] : [])] };
      return { rec: 'Growth', note: 'Up to four modules' + (e > 25 ? ' — Growth includes 50 active employees.' : '.'), base: g, lines: [['Growth (50 incl.)', inr(2999)], ...(e > 50 ? [[(e - 50) + ' extra × ₹49', inr((e - 50) * 49)]] : [])] }; }
    if (c === 2) return { rec: 'Any 2 Modules', note: 'Two connected modules for up to 25 active employees.', base: 1499, lines: [['Any 2 Modules', inr(1499)]] };
    return { rec: 'Single Module', note: 'One module for up to 25 active employees. Module-specific pricing may differ.', base: 699, from: true, lines: [['Single module', 'from ' + inr(699)]] };
  }
  renderVals() {
    const s = this.state, A = s.annual, f = A ? 0.9 : 1, r = this.calc();
    const setEmp = v => this.setState({ emp: Math.max(1, Math.min(2000, parseInt(v, 10) || 1)) });
    const rawPlans = (s.dbPlans && s.dbPlans.length > 0) ? s.dbPlans : DEFAULT_PLANS;
    const plans = rawPlans.map((p, idx) => {
      const staticData = getPlanStaticData(p);
      const isFree = (Number(p.price) === 0 || staticData.tag === 'Free 90 Days');
      const numPrice = Number(p.price || 0);
      const calcPrice = isFree ? 'Free' : inr(numPrice * f);
      const durationText = isFree
        ? ('· Free for ' + (p.durationDays || 90) + ' days')
        : (p.durationDays === 365 ? '/ year' : '/ month');
      const fromLabel = staticData.from || (A ? 'Billed annually' : 'Per month');
      const hasTag = Boolean(staticData.tag);
      const hl = Boolean(staticData.hl || (rawPlans.length > 2 && idx === rawPlans.length - 2 && !staticData.ent));
      const ent = Boolean(staticData.ent);

      return {
        ...staticData,
        name: p.name,
        price: calcPrice,
        durationText,
        from: fromLabel,
        hasTag,
        tag: staticData.tag || '',
        pts: (staticData.pts || []).map(t => ({ t })),
        bg: hl ? 'linear-gradient(160deg,#0b1437 0%,#1e3a8a 100%)' : '#ffffff',
        fg: hl ? '#ffffff' : '#0f172a',
        sub: hl ? '#cbd5e1' : '#64748b',
        eb: hl ? '#93c5fd' : '#2563eb',
        line: hl ? 'rgba(255,255,255,.14)' : '#f1f5f9',
        ck: hl ? '#6ee7b7' : '#10b981',
        bd: hl ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
        sh: hl ? '0 40px 80px -40px rgba(37,99,235,.7)' : 'none',
        cta: staticData.cta || (ent ? 'Talk to us' : 'Build My Plan'),
        href: staticData.href || (ent ? '/book-demo' : '#build'),
        click: () => this.track('build_plan_click', { plan: p.name }),
        btnBg: hl ? '#ffffff' : '#0b1437',
        btnFg: hl ? '#0b1437' : '#ffffff',
        btnBd: '0'
      };
    });
    return {
      setMonthly: () => this.setState({ annual: false }), setAnnual: () => this.setState({ annual: true }),
      mBg: A ? 'transparent' : '#ffffff', mFg: A ? '#e2e8f0' : '#0b1437', aBg: A ? '#ffffff' : 'transparent', aFg: A ? '#0b1437' : '#e2e8f0', mPressed: A ? 'false' : 'true', aPressed: A ? 'true' : 'false',
      plans,
      emp: s.emp, empSlider: Math.min(300, s.emp), onEmp: e => setEmp(e.target.value), onEmpNum: e => setEmp(e.target.value),
      cnt: Object.values(s.sel).filter(Boolean).length,
      mods: MODS.map(([n, ic]) => { const on = !!s.sel[n]; return { n, ic, on: on ? 'true' : 'false', bg: on ? '#0b1437' : '#ffffff', fg: on ? '#ffffff' : '#0f172a', bd: on ? '#0b1437' : '#e2e8f0', toggle: () => this.setState(st => ({ sel: { ...st.sel, [n]: !st.sel[n] } })) }; }),
      rec: r.rec, recNote: r.note, est: r.base == null ? '—' : ((r.from ? 'from ' : '') + inr(r.base * f)), estSuffix: r.base == null ? '' : ('/ month + GST' + (A ? ' · billed annually' : '')),
      lines: (r.lines || []).map(([a, b]) => ({ a, b })),
      demoClick: () => this.track('book_demo_click', { from: 'pricing' }), trialClick: () => this.track('trial_click', { from: 'pricing' }),
    };
  }

  render() {
    const v = { ...this.props, ...this.renderVals() };
    return (
      <><SiteNav active="overview" /><header id="top" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(60% 55% at 70% 10%,rgba(37,99,235,.5) 0%,rgba(37,99,235,0) 70%),linear-gradient(180deg,#070d24 0%,#0b1437 75%,#0f1b4d 100%)", color: "#fff", padding: "clamp(150px,14vw,176px) clamp(18px,5vw,64px) clamp(56px,7vw,88px)" }}><div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(148,163,184,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.07) 1px,transparent 1px)", backgroundSize: "56px 56px", WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%,#000 30%,transparent 80%)", maskImage: "radial-gradient(70% 60% at 50% 30%,#000 30%,transparent 80%)", pointerEvents: "none" }}></div><div style={{ position: "relative", maxWidth: "980px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "20px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 14px", borderRadius: "999px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", fontSize: "13px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#dbeafe" }}>Pricing</span><h1 style={{ margin: "0", fontSize: "clamp(36px,5.4vw,68px)", lineHeight: "1.02", letterSpacing: "-.045em", fontWeight: "800", textWrap: "balance" }}>{"Pay for what you use. "}<span style={{ background: "linear-gradient(90deg,#93c5fd 0%,#60a5fa 50%,#a5b4fc 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Grow into the whole platform.</span></h1><p style={{ margin: "0", fontSize: "clamp(17px,1.6vw,20px)", lineHeight: "1.6", color: "#cbd5e1", maxWidth: "680px", textWrap: "pretty" }}>Start with one module, combine a few, or run your whole company on CIIS Network. All prices are per month for your company, plus GST.</p><div role="group" aria-label="Billing period" style={{ display: "inline-flex", padding: "5px", borderRadius: "999px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", marginTop: "6px" }}><button onClick={v.setMonthly} aria-pressed={v.mPressed} style={{ minHeight: "44px", border: "0", cursor: "pointer", padding: "10px 20px", borderRadius: "999px", fontSize: "15px", fontWeight: "600", background: v.mBg, color: v.mFg }}>Monthly</button><button onClick={v.setAnnual} aria-pressed={v.aPressed} style={{ minHeight: "44px", border: "0", cursor: "pointer", padding: "10px 20px", borderRadius: "999px", fontSize: "15px", fontWeight: "600", background: v.aBg, color: v.aFg, display: "inline-flex", alignItems: "center", gap: "8px" }}>Annual<span style={{ fontSize: "11.5px", fontWeight: "700", padding: "3px 8px", borderRadius: "999px", background: "#10b981", color: "#fff" }}>Save 10%</span></button></div></div></header><section id="plans" style={{ padding: "clamp(56px,7vw,100px) clamp(18px,5vw,64px)", background: "#f8fafc" }}><div style={{ maxWidth: "1280px", margin: "-40px auto 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(230px,calc(20.00% - 14px))),1fr))", gap: "14px", position: "relative" }}>{(v.plans || []).map((p, $index) => (<React.Fragment key={$index}><div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "14px", padding: "24px 22px", borderRadius: "26px", background: p?.bg, color: p?.fg, border: p?.bd, boxShadow: p?.sh }}>{p?.hasTag ? (<><span style={{ position: "absolute", top: "-12px", left: "22px", padding: "5px 12px", borderRadius: "999px", background: "linear-gradient(135deg,#f59e0b,#f26b1d)", color: "#fff", fontSize: "11.5px", fontWeight: "700", letterSpacing: ".04em" }}>{p?.tag}</span></>) : null}<span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: ".08em", textTransform: "uppercase", color: p?.eb }}>{p?.name}</span><span style={{ fontSize: "15px", lineHeight: "1.45", color: p?.sub, minHeight: "44px" }}>{p?.who}</span><span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "12.5px", color: p?.sub }}>{p?.from}</span><span style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}><span style={{ fontSize: "clamp(28px,2.6vw,36px)", fontWeight: "800", letterSpacing: "-.03em" }}>{p?.price}</span><span style={{ fontSize: "14px", color: p?.sub }}>{p?.durationText}</span></span><span style={{ fontSize: "12.5px", color: p?.sub }}>{p?.note}</span></span><div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "14px", borderTop: `1px solid ${p?.line ?? ""}` }}>{(p?.pts || []).map((t, $index) => (<React.Fragment key={$index}><span style={{ display: "flex", gap: "8px", fontSize: "14px", lineHeight: "1.45" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1.1", color: p?.ck }}>check_circle</span>{t?.t}</span></React.Fragment>))}</div><MkLink href={p?.href} onClick={p?.click} style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "48px", borderRadius: "999px", fontSize: "15px", fontWeight: "700", background: p?.btnBg, color: p?.btnFg, border: p?.btnBd }}>{p?.cta}</MkLink></div></React.Fragment>))}</div><p style={{ maxWidth: "1280px", margin: "18px auto 0", fontSize: "14px", lineHeight: "1.6", color: "#475569", textAlign: "center" }}>All prices exclude GST. Billed per active employee — archived or inactive employees are not counted. Module-specific pricing may differ for single modules.</p></section><section id="build" style={{ padding: "clamp(56px,7vw,100px) clamp(18px,5vw,64px)", background: "#ffffff" }}><div style={{ maxWidth: "1200px", margin: "0 auto" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "14px", maxWidth: "760px", margin: "0 auto" }}><span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "#2563eb" }}>Build My Plan</span><h2 style={{ margin: "0", fontSize: "clamp(30px,4.4vw,52px)", lineHeight: "1.05", letterSpacing: "-.035em", fontWeight: "700", textWrap: "balance" }}>Pick your modules. See your plan.</h2><p style={{ margin: "0", fontSize: "clamp(17px,1.5vw,20px)", lineHeight: "1.6", color: "#475569" }}>Buy only Attendance, only Payroll, only Projects or only Clients — or combine as many as you need.</p></div><div style={{ marginTop: "clamp(28px,4vw,44px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(320px,calc(50.00% - 20px))),1fr))", gap: "20px", alignItems: "start" }}><div style={{ padding: "clamp(20px,3vw,28px)", borderRadius: "28px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "22px" }}><label style={{ display: "flex", flexDirection: "column", gap: "10px" }}><span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "15px", fontWeight: "700" }}>Active employees</span><input type="number" min="1" max="2000" value={v.emp} onChange={v.onEmpNum} aria-label="Number of active employees" style={{ width: "96px", minHeight: "44px", padding: "8px 12px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "16px", fontWeight: "700", textAlign: "right", fontFamily: "inherit" }} /></span><input type="range" min="5" max="300" step="5" value={v.empSlider} onChange={v.onEmp} aria-label="Employees slider" style={{ width: "100%", accentColor: "#2563eb", height: "28px" }} /></label><div style={{ display: "flex", flexDirection: "column", gap: "10px" }}><span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "15px", fontWeight: "700" }}>Modules</span><span style={{ fontSize: "13.5px", color: "#64748b" }}>{v.cnt}{" selected"}</span></span><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "8px" }}>{(v.mods || []).map((m, $index) => (<React.Fragment key={$index}><button onClick={m?.toggle} aria-pressed={m?.on} style={{ minHeight: "48px", display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "14px", border: `1.5px solid ${m?.bd ?? ""}`, background: m?.bg, color: m?.fg, fontSize: "14.5px", fontWeight: "600", cursor: "pointer", textAlign: "left" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>{m?.ic}</span>{m?.n}</button></React.Fragment>))}</div></div></div><div style={{ position: "sticky", top: "110px", padding: "clamp(22px,3vw,30px)", borderRadius: "28px", background: "radial-gradient(80% 70% at 100% 0%,rgba(96,165,250,.35) 0%,rgba(96,165,250,0) 60%),linear-gradient(160deg,#0b1437 0%,#1e3a8a 100%)", color: "#fff", display: "flex", flexDirection: "column", gap: "18px", boxShadow: "0 40px 80px -40px rgba(37,99,235,.7)" }}><span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "#93c5fd" }}>Recommended plan</span><span style={{ fontSize: "clamp(26px,3vw,34px)", fontWeight: "800", letterSpacing: "-.02em", lineHeight: "1.1" }}>{v.rec}</span><span style={{ fontSize: "15px", lineHeight: "1.55", color: "#cbd5e1" }}>{v.recNote}</span><div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "18px", borderRadius: "18px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)" }}><span style={{ fontSize: "13px", color: "#93c5fd", fontWeight: "600" }}>Estimated monthly price</span><span style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}><span style={{ fontSize: "clamp(34px,4vw,48px)", fontWeight: "800", letterSpacing: "-.03em" }}>{v.est}</span><span style={{ fontSize: "14px", color: "#cbd5e1" }}>{v.estSuffix}</span></span>{(v.lines || []).map((l, $index) => (<React.Fragment key={$index}><span style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "13.5px", color: "#cbd5e1", paddingTop: "6px" }}><span>{l?.a}</span><span style={{ fontWeight: "600", color: "#fff" }}>{l?.b}</span></span></React.Fragment>))}</div><div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}><MkLink className="mk-eyy05p" href="/book-demo" onClick={v.demoClick} style={{ flex: "1", minWidth: "180px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", minHeight: "50px", borderRadius: "999px", background: "#fff", color: "#0b1437", fontSize: "15.5px", fontWeight: "700" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>play_circle</span>Book a Live Demo</MkLink><MkLink className="mk-nkkc79" href="/RegisterCompany" onClick={v.trialClick} style={{ flex: "1", minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50px", borderRadius: "999px", border: "1px solid rgba(255,255,255,.35)", color: "#fff", fontSize: "15.5px", fontWeight: "600" }}>Start 90 Days Free</MkLink></div><span style={{ fontSize: "12.5px", lineHeight: "1.5", color: "#94a3b8" }}>Estimate only, excluding GST. Your final quote depends on employees, modules and requirements.</span></div></div></div></section><section id="trial-terms" style={{ padding: "clamp(56px,7vw,100px) clamp(18px,5vw,64px)", background: "#f8fafc" }}><div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(320px,calc(50.00% - 24px))),1fr))", gap: "24px", alignItems: "start" }}><div style={{ display: "flex", flexDirection: "column", gap: "14px" }}><span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "#2563eb" }}>90-Day Launch Trial</span><h2 style={{ margin: "0", fontSize: "clamp(28px,3.8vw,44px)", lineHeight: "1.08", letterSpacing: "-.035em", fontWeight: "700", textWrap: "balance" }}>Run CIIS in your company for 90 days.</h2><p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "#475569" }}>Try the core CIIS experience on web and mobile with your own team.</p><div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "6px" }}><MkLink className="mk-ifpe91" href="/book-demo" style={{ display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", color: "#fff", fontSize: "16px", fontWeight: "600", padding: "15px 28px", borderRadius: "999px", background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#4f46e5 100%)", border: "1px solid rgba(255,255,255,.18)", boxShadow: "0 10px 30px rgba(37,99,235,.45)" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "20px", lineHeight: "1" }}>play_circle</span>Book a Live Demo</MkLink><MkLink className="mk-ecym50" href="/RegisterCompany" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", color: "#0f172a", fontSize: "16px", fontWeight: "600", padding: "15px 26px", borderRadius: "999px", background: "#fff", border: "1px solid #cbd5e1" }}>Start 90 Days Free</MkLink></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "12px" }}><div style={{ padding: "22px", borderRadius: "24px", background: "#fff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}><span style={{ fontSize: "15px", fontWeight: "700", color: "#047857" }}>Included in the trial</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#10b981" }}>check_circle</span>Up to 25 active employees</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#10b981" }}>check_circle</span>One company, one branch</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#10b981" }}>check_circle</span>Up to 5 GB storage</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#10b981" }}>check_circle</span>Web + mobile access</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#10b981" }}>check_circle</span>Core CIIS product experience</span></div><div style={{ padding: "22px", borderRadius: "24px", background: "#fff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}><span style={{ fontSize: "15px", fontWeight: "700", color: "#475569" }}>Charged separately</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45", color: "#475569" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#94a3b8" }}>remove_circle</span>Biometric hardware or connectors</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45", color: "#475569" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#94a3b8" }}>remove_circle</span>Paid third-party API usage</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45", color: "#475569" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#94a3b8" }}>remove_circle</span>WhatsApp / SMS usage</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45", color: "#475569" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#94a3b8" }}>remove_circle</span>Custom development and integrations</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45", color: "#475569" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#94a3b8" }}>remove_circle</span>Large data migrations</span><span style={{ display: "flex", gap: "8px", fontSize: "15px", lineHeight: "1.45", color: "#475569" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1", color: "#94a3b8" }}>remove_circle</span>Additional storage</span></div></div></div></section><section id="faq" style={{ padding: "clamp(56px,7vw,100px) clamp(18px,5vw,64px)", background: "#ffffff" }}><div style={{ maxWidth: "880px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}><h2 style={{ margin: "0 0 14px", textAlign: "center", fontSize: "clamp(28px,3.8vw,44px)", letterSpacing: "-.035em", fontWeight: "700" }}>Pricing questions</h2><details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 20px" }}><summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "60px", padding: "14px 0", fontSize: "16px", fontWeight: "600" }}>Can I buy just one module?<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", lineHeight: "1", color: "#64748b" }}>expand_more</span></summary><p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>Yes. Single modules start at ₹699/month for up to 25 active employees. Module-specific pricing may differ.</p></details><details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 20px" }}><summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "60px", padding: "14px 0", fontSize: "16px", fontWeight: "600" }}>What counts as an active employee?<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", lineHeight: "1", color: "#64748b" }}>expand_more</span></summary><p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>Employees who are active in CIIS. Archived or inactive employees are not billed as active seats.</p></details><details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 20px" }}><summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "60px", padding: "14px 0", fontSize: "16px", fontWeight: "600" }}>What if we have more employees than the plan includes?<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", lineHeight: "1", color: "#64748b" }}>expand_more</span></summary><p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>Growth adds ₹49 and Business Suite adds ₹69 per additional active employee per month above 50. Single-module add-on rates depend on the module.</p></details><details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 20px" }}><summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "60px", padding: "14px 0", fontSize: "16px", fontWeight: "600" }}>Is there an annual discount?<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", lineHeight: "1", color: "#64748b" }}>expand_more</span></summary><p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>Yes. Annual billing saves 10%.</p></details><details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 20px" }}><summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "60px", padding: "14px 0", fontSize: "16px", fontWeight: "600" }}>Are prices inclusive of GST?<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", lineHeight: "1", color: "#64748b" }}>expand_more</span></summary><p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>No. GST is applicable on all plans.</p></details><details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 20px" }}><summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "60px", padding: "14px 0", fontSize: "16px", fontWeight: "600" }}>When should I choose Enterprise?<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "22px", lineHeight: "1", color: "#64748b" }}>expand_more</span></summary><p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>For larger teams, multiple branches or specific requirements. Enterprise starts at ₹7,999/month with pricing based on employees, modules and requirements.</p></details></div></section><SiteFooter headline="Find the right plan for your company." sub="Book a walkthrough and we’ll help you choose modules for your team." /></>
    );
  }
}

export default PricingPage;
