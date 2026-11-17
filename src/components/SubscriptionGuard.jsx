import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import api from '../utils/axiosConfig';
import {isPlatformAccount, isSubscriptionExpired, isWriteAction} from '../utils/subscriptionPolicy';
import {setSubscriptionCompany, subscriptionIsReadOnly, showExpiredPlan} from '../utils/subscriptionRuntime';
import './SubscriptionGuard.css';

export default function SubscriptionGuard() {
  const {token, user} = useAuth();
  const [company, setCompany] = useState(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, tick] = useState(0);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const {data} = await api.get('/company/subscription/current', {noCache: true, cache: false, _skipErrorNotify: true});
      if (localStorage.getItem('token') !== token) return;
      setCompany(data.company);
      setSubscriptionCompany(data.company, user);
      localStorage.setItem('companyDetails', JSON.stringify(data.company));
      localStorage.setItem('company', JSON.stringify(data.company));
      window.dispatchEvent(new window.CustomEvent('ciis-company-subscription-changed', {detail: data.company}));
    } catch { /* Keep the last known subscription during a connection failure. */ }
  }, [token, user]);

  useEffect(() => {
    setOpen(false);
    setCompany(null);
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('companyDetails') || localStorage.getItem('company') || 'null'); } catch {}
    setSubscriptionCompany(token ? stored : null, user);
    if (token) setCompany(stored);
    void refresh();
    const interval = setInterval(() => { tick(n => n + 1); void refresh(); }, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh); setSubscriptionCompany(null, null); };
  }, [refresh, token, user]);

  useEffect(() => {
    const expired = () => { if (token && !isPlatformAccount(user)) { setReason('expired'); setOpen(true); } };
    const viewPlans = () => { if (token) {setReason('plans'); setOpen(true);} };
    const click = event => {
      if (!subscriptionIsReadOnly() || event.target.closest('[data-subscription-dialog]')) return;
      const button = event.target.closest('button, [role="button"], input[type="submit"], a');
      if (!button) return;
      const label = [button.textContent, button.getAttribute('aria-label'), button.getAttribute('title'), button.getAttribute('value')].filter(Boolean).join(' ');
      const hint = `${button.getAttribute('href') || ''} ${button.getAttribute('class') || ''}`;
      if (button.getAttribute('type') === 'submit' || isWriteAction(label, hint)) {
        event.preventDefault(); event.stopPropagation(); showExpiredPlan();
      }
    };
    window.addEventListener('ciis-plan-expired', expired);
    window.addEventListener('ciis-view-plans', viewPlans);
    document.addEventListener('click', click, true);
    const submit = event => { if (subscriptionIsReadOnly()) { event.preventDefault(); event.stopPropagation(); showExpiredPlan(); } };
    document.addEventListener('submit', submit, true);
    return () => { window.removeEventListener('ciis-plan-expired', expired); window.removeEventListener('ciis-view-plans', viewPlans); document.removeEventListener('click', click, true); document.removeEventListener('submit', submit, true); };
  }, [token, user]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError('');
    api.get('/plans', {noCache: true, cache: false}).then(({data}) => {
      if (active) setPlans(data.plans || []);
    }).catch(() => { if (active) setError('Could not load plans. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  if (!token || isPlatformAccount(user)) return null;
  const expired = isSubscriptionExpired(company);
  const title = expired || reason === 'expired' ? 'Plan expired' : 'Available plans';
  return <>
    {expired && <div className="subscription-notice">Plan expired. You can view your data. <button onClick={() => setOpen(true)}>View plans</button></div>}
    {open && <div className="subscription-backdrop" data-subscription-dialog onClick={() => setOpen(false)}>
      <section className="subscription-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <button className="subscription-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <h2>{title}</h2><p>{title === 'Plan expired' ? 'You can log in and view your data. Renew a plan to create, edit or make other changes.' : 'Choose from the current plans below and contact the platform administrator to upgrade or renew.'}</p>
        {loading ? <p>Loading plans…</p> : error ? <p role="alert">{error}</p> : plans.length ? <div className="subscription-plans">{plans.map(plan => <article key={plan._id}>
          <h3>{plan.name}</h3><strong>₹{Number(plan.price).toLocaleString('en-IN')} / {plan.durationDays} days</strong>
          <p>{plan.description}</p><p>{plan.allowedPages?.length || 0} pages included</p>
          {plan.features?.length > 0 && <ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>}
        </article>)}</div> : <p>No active plans available. Please contact the platform administrator.</p>}
        <p>Contact the platform administrator to renew or assign one of these plans.</p>
        <button onClick={() => { void refresh().then(() => setOpen(false)); }}>Check renewal status</button>
        <button onClick={() => setOpen(false)}>Continue viewing</button>
      </section>
    </div>}
  </>;
}
