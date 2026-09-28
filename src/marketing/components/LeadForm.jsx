// CIIS Network marketing site — LeadForm. Generated from the approved design; layout is inline-styled to match it exactly.
import React from "react";
import MkLink from "./MkLink.jsx";
import { submitLead, isValidIndianMobile } from "../api/leads.js";

const MODS = [['Employees / HR', 'badge'], ['Attendance', 'fingerprint'], ['Payroll', 'payments'], ['Tasks', 'task_alt'], ['Projects', 'account_tree'], ['Clients', 'handshake'], ['Communication', 'chat'], ['Support', 'support_agent'], ['Analytics', 'insights']];
const SIZES = [['', 'Select'], ['1-10', '1–10'], ['11-25', '11–25'], ['26-50', '26–50'], ['51-100', '51–100'], ['101-250', '101–250'], ['250+', '250+']];
const KINDS = {
  demo: { title: 'Book a Live Demo', sub: 'See CIIS Network running for a company like yours. We’ll confirm a time by email.', btn: 'Request my demo', event: 'demo_form_submit', modLabel: 'Modules you’re interested in', modReq: false,
    fields: ['name', 'company', 'email', 'phone', 'employees', 'datetime', 'message'], doneTitle: 'Demo request received', doneSub: 'Thank you — our team will contact you to confirm your demo time.' },
  trial: { title: 'Start your 90-Day Launch Trial', sub: 'Tell us about your company and we’ll set up your trial workspace.', btn: 'Request my trial', event: 'trial_form_submit', modLabel: 'Required modules', modReq: true,
    fields: ['name', 'company', 'email', 'phone', 'employees', 'branches'], doneTitle: 'Trial request received', doneSub: 'Thank you — our team will contact you to set up your trial workspace.' },
  contact: { title: 'Contact CIIS Network', sub: 'Questions about CIIS? Send us a message and we’ll reply by email.', btn: 'Send message', event: 'contact_form_submit', modLabel: '', modReq: false,
    fields: ['name', 'company', 'email', 'phone', 'message'], doneTitle: 'Message sent', doneSub: 'Thank you — we’ll get back to you by email.' },
};
const F = {
  name: { label: 'Full name', type: 'text', req: true, ph: 'Your name' },
  company: { label: 'Company', type: 'text', req: true, ph: 'Company name' },
  email: { label: 'Work email', type: 'email', req: true, ph: 'you@company.com' },
  phone: { label: 'Phone', type: 'tel', req: true, ph: '+91 98xxxxxx10' },
  employees: { label: 'Number of employees', select: SIZES, req: true },
  branches: { label: 'Number of branches', type: 'number', req: true, ph: '1' },
  datetime: { label: 'Preferred demo date & time', type: 'datetime-local', req: false },
  message: { label: 'Message', area: true, req: false, ph: 'Anything we should know?' },
};
const RX = { email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, phone: /^[+\d][\d\s-]{7,15}$/ };

class LeadForm extends React.Component {
  state = { v: {}, sel: {}, err: {}, modErr: false, sending: false, done: false, failed: false, touched: false };
  track(ev, data) { try { (window.dataLayer = window.dataLayer || []).push({ event: ev, ...data }); if (window.fbq) window.fbq('trackCustom', ev, data); } catch (e) {} }
  validate() {
    const K = KINDS[this.props.kind || 'demo'], v = this.state.v, err = {};
    K.fields.forEach(n => { const d = F[n], val = String(v[n] || '').trim();
      if (d.req && !val) err[n] = 'Required';
      else if (val && n === 'email' && !RX.email.test(val)) err[n] = 'Enter a valid email';
      else if (val && n === 'phone' && !RX.phone.test(val)) err[n] = 'Enter a valid phone number';
      else if (val && n === 'phone' && (this.props.kind || 'demo') === 'demo' && !isValidIndianMobile(val)) err[n] = 'Enter a valid 10-digit mobile number';
      else if (val && n === 'branches' && !(+val >= 1)) err[n] = 'Enter 1 or more'; });
    const modErr = K.modReq && !Object.values(this.state.sel).some(Boolean);
    return { err, modErr, ok: !Object.keys(err).length && !modErr };
  }
  async submit(e) {
    e.preventDefault();
    const kind = this.props.kind || 'demo', K = KINDS[kind], r = this.validate();
    this.setState({ err: r.err, modErr: r.modErr, touched: true, failed: false, failMsg: '' });
    if (!r.ok) return;
    this.setState({ sending: true });
    const modules = Object.keys(this.state.sel).filter(k => this.state.sel[k]);
    try {
      await submitLead(kind, { ...this.state.v, modules, source: window.location.pathname });
      this.track(K.event, { modules: modules.length, employees: this.state.v.employees || '' });
      this.setState({ sending: false, done: true });
    } catch (x) {
      this.setState({ sending: false, failed: true, failMsg: (x && x.userMessage) || '' });
    }
  }
  renderVals() {
    const kind = this.props.kind || 'demo', K = KINDS[kind], s = this.state;
    const set = n => ev => { const val = ev.target.value; this.setState(st => ({ v: { ...st.v, [n]: val }, err: st.touched ? { ...st.err, [n]: undefined } : st.err })); };
    return {
      showForm: !s.done, done: s.done, doneTitle: K.doneTitle, doneSub: K.doneSub, title: K.title, sub: K.sub, failed: s.failed, failMsg: s.failMsg || 'Something went wrong sending your request. Please try again, or email us directly.', sending: s.sending,
      btnText: s.sending ? 'Sending…' : K.btn, btnOp: s.sending ? 0.7 : 1, submit: e => this.submit(e),
      fields: K.fields.map(n => { const d = F[n], er = s.err[n];
        return { name: n, label: d.label, star: d.req ? ' *' : '', type: d.type || 'text', ph: d.ph || '', value: s.v[n] || '', onInput: set(n), isInput: !d.select && !d.area, isSelect: !!d.select, isArea: !!d.area,
          opts: (d.select || []).map(([v, l]) => ({ v, l })), span: d.area ? '1 / -1' : 'auto', hasErr: !!er, err: er || '', invalid: er ? 'true' : 'false', bd: er ? '#f87171' : '#e2e8f0' }; }),
      hasModules: !!K.modLabel, modLabel: K.modLabel, modStar: K.modReq ? ' *' : '', modErr: s.modErr,
      mods: MODS.map(([n, ic]) => { const on = !!s.sel[n]; return { n, ic, on: on ? 'true' : 'false', bg: on ? '#0b1437' : '#ffffff', fg: on ? '#ffffff' : '#0f172a', bd: on ? '#0b1437' : '#e2e8f0',
        toggle: () => this.setState(st => ({ sel: { ...st.sel, [n]: !st.sel[n] }, modErr: false })) }; }),
    };
  }

  render() {
    const v = { ...this.props, ...this.renderVals() };
    return (
      <>{v.showForm ? (<><form onSubmit={v.submit} noValidate={true} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "clamp(20px,3vw,32px)", borderRadius: "28px", background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 40px 80px -48px rgba(15,23,42,.45)", color: "#0f172a" }}><div style={{ display: "flex", flexDirection: "column", gap: "6px" }}><span style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.02em" }}>{v.title}</span><span style={{ fontSize: "15px", lineHeight: "1.5", color: "#475569" }}>{v.sub}</span></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "14px" }}>{(v.fields || []).map((f, $index) => (<React.Fragment key={$index}><label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0", gridColumn: f?.span }}><span style={{ fontSize: "13.5px", fontWeight: "600", color: "#0f172a" }}>{f?.label}<span style={{ color: "#dc2626" }}>{f?.star}</span></span>{f?.isInput ? (<><input className="mk-1lpvwqa" name={f?.name} type={f?.type} value={f?.value} onChange={f?.onInput} placeholder={f?.ph} aria-invalid={f?.invalid} style={{ minHeight: "48px", padding: "12px 14px", borderRadius: "12px", border: `1.5px solid ${f?.bd ?? ""}`, background: "#f8fafc", fontSize: "15.5px", color: "#0f172a", fontFamily: "inherit", outline: "none", width: "100%" }} /></>) : null}{f?.isSelect ? (<><select name={f?.name} value={f?.value} onChange={f?.onInput} style={{ minHeight: "48px", padding: "12px 14px", borderRadius: "12px", border: `1.5px solid ${f?.bd ?? ""}`, background: "#f8fafc", fontSize: "15.5px", color: "#0f172a", fontFamily: "inherit", width: "100%" }}>{(f?.opts || []).map((o, $index) => (<React.Fragment key={$index}><option value={o?.v}>{o?.l}</option></React.Fragment>))}</select></>) : null}{f?.isArea ? (<><textarea name={f?.name} rows="3" value={f?.value} onChange={f?.onInput} placeholder={f?.ph} style={{ padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: "15.5px", color: "#0f172a", fontFamily: "inherit", resize: "vertical", width: "100%" }}></textarea></>) : null}{f?.hasErr ? (<><span role="alert" style={{ fontSize: "13px", color: "#b91c1c" }}>{f?.err}</span></>) : null}</label></React.Fragment>))}</div>{v.hasModules ? (<><div style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "13.5px", fontWeight: "600" }}>{v.modLabel}<span style={{ color: "#dc2626" }}>{v.modStar}</span></span><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{(v.mods || []).map((m, $index) => (<React.Fragment key={$index}><button type="button" onClick={m?.toggle} aria-pressed={m?.on} style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 14px", borderRadius: "12px", border: `1.5px solid ${m?.bd ?? ""}`, background: m?.bg, color: m?.fg, fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}><span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "17px", lineHeight: "1" }}>{m?.ic}</span>{m?.n}</button></React.Fragment>))}</div>{v.modErr ? (<><span role="alert" style={{ fontSize: "13px", color: "#b91c1c" }}>Choose at least one module.</span></>) : null}</div></>) : null}{v.failed ? (<><div role="alert" style={{ padding: "12px 14px", borderRadius: "12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "14px" }}>{v.failMsg}</div></>) : null}<button type="submit" disabled={v.sending} style={{ minHeight: "52px", border: "0", borderRadius: "999px", background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#4f46e5 100%)", color: "#ffffff", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 28px rgba(37,99,235,.4)", opacity: v.btnOp }}>{v.btnText}</button><span style={{ fontSize: "12.5px", lineHeight: "1.5", color: "#64748b" }}>{"By submitting, you agree to be contacted about CIIS Network. See our "}<MkLink href="/privacy-policy">Privacy Policy</MkLink>.</span></form></>) : null}{v.done ? (<><div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px", padding: "clamp(24px,3vw,36px)", borderRadius: "28px", background: "#ffffff", border: "1px solid #a7f3d0", boxShadow: "0 40px 80px -48px rgba(15,23,42,.45)", color: "#0f172a" }}><span style={{ width: "52px", height: "52px", borderRadius: "16px", background: "#d1fae5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Material Symbols Rounded'", fontSize: "28px", lineHeight: "1" }}>check_circle</span><span style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-.02em" }}>{v.doneTitle}</span><span style={{ fontSize: "15.5px", lineHeight: "1.6", color: "#475569" }}>{v.doneSub}</span><MkLink href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "15px", fontWeight: "600", padding: "10px 0" }}>Back to CIIS Network<span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1" }}>arrow_forward</span></MkLink></div></>) : null}</>
    );
  }
}

export default LeadForm;
