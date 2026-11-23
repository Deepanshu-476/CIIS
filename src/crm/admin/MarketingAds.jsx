import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleHelp, RefreshCw, X } from 'lucide-react';
import api from '../../utils/axiosConfig';
import './MarketingAds.css';

const base = '/crm/marketing-ads';
const labels = { meta: 'Meta Ads', google: 'Google Ads' };
const logStatuses = ['queued', 'processing', 'retrying', 'failed', 'created', 'duplicate', 'test'];
const dateTime = value => value ? new Date(value).toLocaleString() : '—';

const guides = {
  meta: {
    items: [
      'Select Connect Meta Account and sign in with the Facebook account that manages your Page.',
      'Approve Page permissions and lead access.',
      'Choose the business, Facebook Page and lead forms. Linked Instagram details appear when Meta provides them.',
      'Save, then use Test Connection and send a test lead from Meta. Leads from the selected forms appear in All Leads.'
    ],
    links: [
      ['Meta Lead Ads setup', 'https://developers.facebook.com/docs/marketing-api/guides/lead-ads/'],
      ['Meta webhook permissions and troubleshooting', 'https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen/']
    ]
  },
  google: {
    items: [
      'Select Connect Google Ads Account. Sign in and grant Google Ads access.',
      'Choose your advertiser account and save the connection.',
      'Open Webhook Setup for that account and copy its URL and secret key.',
      'Paste both values in the Google Ads lead form webhook settings and send test data from Google Ads.',
      'Check the test result in CRM. New submissions appear in All Leads.'
    ],
    links: [
      ['Google webhook setup', 'https://developers.google.com/google-ads/webhook/docs/overview'],
      ['Google webhook testing and troubleshooting', 'https://developers.google.com/google-ads/webhook/docs/testing']
    ]
  }
};

function Guide({ platform }) {
  return <>
    <ol>{guides[platform].items.map(step => <li key={step}>{step}</li>)}</ol>
    <ul>{guides[platform].links.map(([text, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{text}</a></li>)}</ul>
  </>;
}

function Dialog({ title, children, close }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="ads-dialog" aria-label={title} onCancel={event => { event.preventDefault(); close(); }}>
    <header><h2>{title}</h2><button type="button" className="ads-icon" onClick={close} aria-label="Close"><X size={18} /></button></header>
    {children}
  </dialog>;
}

function FormPicker({ forms, selected, change }) {
  if (!forms.length) return <p>No lead forms available for this Page.</p>;
  return <fieldset><legend>Lead Forms</legend>
    {forms.map(form => <label className="ads-check" key={form.id}>
      <input type="checkbox" checked={selected.includes(form.id)} onChange={event =>
        change(event.target.checked ? [...selected, form.id] : selected.filter(id => id !== form.id))} />
      {form.name || form.id}
    </label>)}
  </fieldset>;
}

function OAuthSelection({ id, pending, busy, close, save, report, feedback }) {
  const [accountId, selectAccount] = useState(pending.existing?.externalAccountId || '');
  const [business, setBusiness] = useState('');
  const [forms, setForms] = useState([]);
  const [selected, setSelected] = useState(pending.existing?.forms?.map(form => form.id) || []);
  const [loadingForms, setLoadingForms] = useState(Boolean(pending.existing?.externalAccountId && pending.platform === 'meta'));
  const meta = pending.platform === 'meta';
  const account = pending.items.find(row => row.id === accountId);
  const companies = [...new Set(pending.items.map(row => row.businessName).filter(Boolean))];
  useEffect(() => {
    if (!meta || !accountId) return;
    const abort = new AbortController();
    api.get(`${base}/oauth/sessions/${id}/forms/${accountId}`, { cache: false, signal: abort.signal })
      .then(({ data }) => { setForms(data.items); setLoadingForms(false); })
      .catch(error => {
        if (!abort.signal.aborted) {
          report(error);
          setLoadingForms(false);
        }
      });
    return () => abort.abort();
  }, [id, meta, accountId, report]);
  const update = value => { selectAccount(value); setSelected([]); setForms([]); setLoadingForms(meta && Boolean(value)); };
  return <Dialog title={`Connect ${labels[pending.platform]}`} close={close}>
    {feedback}
    <form className="ads-form" onSubmit={event => { event.preventDefault(); save({ accountId, formIds: selected.filter(id => forms.some(form => form.id === id)) }); }}>
      {meta && companies.length > 0 && !pending.existing && <label>Business
        <select value={business} onChange={event => { setBusiness(event.target.value); update(''); }}>
          <option value="">All businesses</option>
          {companies.map(name => <option key={name}>{name}</option>)}
        </select>
      </label>}
      <label>{meta ? 'Facebook Page' : 'Google Ads account'}
        <select value={accountId} onChange={event => update(event.target.value)} required disabled={Boolean(pending.existing)}>
          <option value="">Select an account</option>
          {pending.items.filter(row => !business || row.businessName === business).map(row => (
            <option key={row.id} value={row.id}>{row.name}{!meta ? ` (${row.id})` : ''}</option>
          ))}
        </select>
      </label>
      {!pending.items.length && <p>No eligible accounts are available for this sign-in.</p>}
      {account?.instagramName && <p>Linked Instagram account · {account.instagramName}</p>}
      {meta && accountId && (loadingForms ? <p>Loading lead forms…</p> :
        <FormPicker forms={forms} selected={selected} change={setSelected} />)}
      <footer><button type="submit" disabled={!account || busy || (meta && (loadingForms || !selected.some(id => forms.some(form => form.id === id))))}>
        Save Connection
      </button></footer>
    </form>
  </Dialog>;
}

function ConnectionSettings({ item, statuses, options, forms, busy, close, save, feedback }) {
  const [selected, setSelected] = useState(item.forms.map(form => form.id).filter(id => !forms || forms.some(form => form.id === id)));
  const [mappings, setMappings] = useState(item.mappings || []);
  const [formId, setFormId] = useState('');
  const active = mappings.find(row => row.formId === formId);
  const fields = active?.fields || [];
  const updateField = (index, property, value) => {
    const updated = Array.from({ length: 4 }, (_, i) => ({
      ...(fields[i] || { key: '', label: '' }), ...(i === index && { [property]: value })
    }));
    setMappings(previous => [...previous.filter(row => row.formId !== formId), { formId, fields: updated }]);
  };
  const submit = event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const validMappings = mappings.filter(row => item.platform === 'google' || !row.formId || selected.includes(row.formId))
      .map(row => ({ formId: row.formId, fields: row.fields.filter(field => field.key.trim() || field.label.trim()) }));
    save({ ...values, mappings: validMappings, ...(forms && { formIds: selected }) });
  };
  const questions = forms?.find(form => form.id === formId)?.questions || [];
  const assignment = [['assignedTo', 'Default employee', options.staff], ['department', 'Default team / department', options.departments],
    ['branch', 'Default branch', options.branches]];
  return <Dialog title={`Edit ${item.accountName || item.externalAccountId}`} close={close}>
    {feedback}
    <form className="ads-form" onSubmit={submit}>
      {forms && <FormPicker forms={forms} selected={selected} change={ids => {
        setSelected(ids);
        if (formId && !ids.includes(formId)) setFormId('');
      }} />}
      <fieldset>
        <legend>Ad Form Custom Fields</legend>
        <p>Set up to four question keys and display labels per form. Unanswered questions stay blank. Without a mapping, up to four extra answers are captured automatically.</p>
        {item.platform === 'meta' ? <label>Form
          <select value={formId} onChange={event => setFormId(event.target.value)}>
            <option value="">Default for all forms</option>
            {(forms || item.forms).filter(form => selected.includes(form.id)).map(form => <option key={form.id} value={form.id}>{form.name || form.id}</option>)}
          </select>
        </label> : <label>Google Form ID <input value={formId} inputMode="numeric" maxLength={30} list="ads-form-ids"
          placeholder="Blank for all forms" onChange={event => setFormId(event.target.value.replace(/\D/g, ''))} />
          <datalist id="ads-form-ids">{mappings.filter(row => row.formId).map(row => <option key={row.formId} value={row.formId} />)}</datalist>
        </label>}
        <datalist id="ads-question-keys">{questions.map(question => <option key={question.key} value={question.key}>{question.label}</option>)}</datalist>
        {Array.from({ length: 4 }, (_, index) => <div className="ads-grid ads-field-row" key={index}>
          <label>Question key {index + 1}<input value={fields[index]?.key || ''} list="ads-question-keys" maxLength={150}
            placeholder={item.platform === 'google' ? 'e.g. JOB_TITLE' : 'e.g. preferred_location'}
            onChange={event => updateField(index, 'key', event.target.value)} /></label>
          <label>Display label {index + 1}<input value={fields[index]?.label || ''} maxLength={80}
            placeholder="e.g. Preferred Location" onChange={event => updateField(index, 'label', event.target.value)} /></label>
        </div>)}
        {active && <button type="button" className="ads-secondary"
          onClick={() => setMappings(previous => previous.filter(row => row.formId !== formId))}>Remove form mapping</button>}
      </fieldset>
      <fieldset className="ads-grid">
        <legend>Lead Assignment</legend>
        {assignment.map(([key, label, rows]) => <label key={key}>{label}
          <select name={key} defaultValue={item[key] || ''}>
            <option value="">None</option>
            {rows.map(row => <option key={row._id} value={row._id}>{row.name}</option>)}
          </select>
        </label>)}
        <label>Default lead status<select name="leadStatus" defaultValue={item.leadStatus || 'new'}>
          {statuses.map(status => <option key={status}>{status}</option>)}
        </select></label>
      </fieldset>
      <footer><button disabled={busy || (forms && !selected.length)}>Save Settings</button></footer>
    </form>
  </Dialog>;
}

function AccountCard({ item, busy, actions }) {
  const active = ['connected', 'reconnect'].includes(item.status);
  return <article className="ads-account">
    <header><div><h3>{item.accountName || item.externalAccountId}</h3><small>{item.externalAccountId}</small></div>
      <span className={`ads-status ads-status-${item.status}`}>{item.status === 'connecting' ? 'Setup pending' : item.status}</span>
    </header>
    <dl>
      {item.businessName && <div><dt>Business</dt><dd>{item.businessName}</dd></div>}
      {item.platform === 'meta' && <>
        <div><dt>Facebook Page</dt><dd>{item.accountName || item.externalAccountId}</dd></div>
        {item.instagramName && <div><dt>Instagram</dt><dd>{item.instagramName}</dd></div>}
        <div><dt>Lead forms</dt><dd>{item.forms.map(form => form.name || form.id).join(', ') || '—'}</dd></div>
      </>}
      <div><dt>Leads created</dt><dd>{item.leads}</dd></div>
      <div><dt>Last lead</dt><dd>{dateTime(item.lastLeadReceivedAt)}</dd></div>
      <div><dt>Last sync</dt><dd>{dateTime(item.lastSyncAt)}</dd></div>
    </dl>
    {item.campaigns?.length > 0 && <details><summary>{item.campaigns.length} campaigns</summary>
      <ul>{item.campaigns.map(row => <li key={row.id}>{row.name} · {row.id}</li>)}</ul>
    </details>}
    <div className="ads-actions">
      {active && <>
        <button className="ads-secondary" disabled={busy} onClick={() => actions.settings(item)}>Edit Settings</button>
        <button className="ads-secondary" disabled={busy} onClick={() => actions.test(item)}>Test Connection</button>
        {item.platform === 'google' && <button className="ads-secondary" disabled={busy} onClick={() => actions.webhook(item)}>Webhook Setup</button>}
      </>}
      <button className="ads-secondary" disabled={busy} onClick={() => actions.connect(item.platform, item._id)}>Reconnect</button>
      {item.status !== 'disconnected' && <button className="ads-danger" disabled={busy} onClick={() => actions.disconnect(item)}>Disconnect</button>}
    </div>
  </article>;
}

function WebhookDialog({ item, info, close, copy, test, busy, feedback }) {
  return <Dialog title="Google Ads Webhook" close={close}>
    {feedback}
    <div className="ads-form">
      <p>Paste these values into the webhook settings of the lead form in {item.accountName || item.externalAccountId}, then send test data from Google Ads.</p>
      <label>Webhook URL<input readOnly value={info.url} /></label>
      <button type="button" className="ads-secondary" onClick={() => copy(info.url, 'Webhook URL')}>Copy Webhook URL</button>
      <label>Secret key<input readOnly type="password" value={info.key} /></label>
      <button type="button" className="ads-secondary" onClick={() => copy(info.key, 'Secret key')}>Copy Secret Key</button>
      <p>Last successful webhook test · {dateTime(item.lastWebhookTestAt)}</p>
      <footer><button type="button" disabled={busy} onClick={() => test(item)}>Test Webhook</button></footer>
    </div>
  </Dialog>;
}

export default function MarketingAds() {
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const session = /^[a-f0-9]{24}$/.test(sessionId || '') ? sessionId : null;
  const oauth = sessionId && !session ? 'expired' : params.get('oauth');
  const [dashboard, setDashboard] = useState(null);
  const [pending, setPending] = useState(null);
  const [logs, setLogs] = useState({ items: [], total: 0, page: 1 });
  const [filters, setFilters] = useState({ platform: '', account: '', status: '', date: '', page: 1 });
  const [connectionStatus, setConnectionStatus] = useState('');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const working = useRef(false);
  const report = React.useCallback(err => setError(err.response?.data?.message || err.message || 'Could not complete this request.'), []);
  const loadDashboard = React.useCallback(() => api.get(`${base}/accounts`, { cache: false }).then(({ data }) => setDashboard(data)), []);
  const loadLogs = React.useCallback((signal) => api.get(`${base}/logs`, { params: filters, cache: false, signal }).then(({ data }) => setLogs(data)), [filters]);

  useEffect(() => { loadDashboard().catch(report); }, [loadDashboard, report]);
  useEffect(() => {
    const abort = new AbortController();
    loadLogs(abort.signal).catch(err => { if (!abort.signal.aborted) report(err); });
    return () => abort.abort();
  }, [loadLogs, report]);
  useEffect(() => {
    if (!session) return;
    const abort = new AbortController();
    api.get(`${base}/oauth/sessions/${session}`, { cache: false, signal: abort.signal }).then(({ data }) => setPending(data))
      .catch(err => { if (!abort.signal.aborted) report(err); });
    return () => abort.abort();
  }, [session, report]);

  async function act(action) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try { await action(); } catch (err) { report(err); }
    finally { working.current = false; setBusy(false); }
  }
  const refresh = () => Promise.all([loadDashboard(), loadLogs()]);
  const closePending = () => { setPending(null); setParams({}, { replace: true }); };
  const actions = {
    connect: (platform, connectionId) => act(async () => {
      const { data } = await api.post(`${base}/oauth/${platform}/start`, { connectionId });
      window.location.assign(data.url);
    }),
    settings: item => act(async () => {
      const options = await api.get(`${base}/assignment-options`, { cache: false });
      let forms = null;
      if (item.platform === 'meta' && item.status === 'connected') {
        forms = (await api.get(`${base}/accounts/${item._id}/forms`, { cache: false })).data.items;
      }
      setDialog({ type: 'settings', item, options: options.data, forms });
    }),
    test: item => act(async () => {
      try {
        const { data } = await api.post(`${base}/accounts/${item._id}/test`);
        setNotice(data.message);
      } finally { await loadDashboard(); }
    }),
    webhook: item => act(async () => {
      const { data } = await api.get(`${base}/accounts/${item._id}/webhook`, { cache: false });
      setDialog({ type: 'webhook', item, info: data });
    }),
    disconnect: item => setDialog({ type: 'disconnect', item })
  };
  const close = () => setDialog(null);
  const items = dashboard?.items || [];
  const accounts = new Map(items.map(item => [item._id, item.accountName || item.externalAccountId]));
  const filter = (key, value) => setFilters(previous => ({
    ...previous, [key]: value, ...(key !== 'page' && { page: 1 }), ...(key === 'platform' && { account: '' })
  }));
  const lastLead = items.map(item => item.lastLeadReceivedAt).filter(Boolean).sort().at(-1);
  const oauthMessage = new Map(Object.entries({ denied: 'Ads sign-in was cancelled.', expired: 'Ads sign-in expired. Connect again.', failed: 'Ads sign-in failed. Check provider permissions and connect again.' })).get(oauth);
  const feedback = <>{error && <p role="alert" className="ads-error">{error}</p>}{notice && <p role="status">{notice}</p>}</>;

  return <main className="marketing-ads">
    <header className="ads-heading">
      <div><Link to="/ciisUser/crm/admin/lead-sources">Lead Sources</Link><h1>Marketing Ads</h1></div>
      <button className="ads-secondary" disabled={busy} onClick={() => act(refresh)}><RefreshCw size={14} /> Refresh</button>
    </header>
    {!dialog && !pending && feedback}
    {oauthMessage && <p role="status">{oauthMessage}</p>}
    {session && !pending && !error && <p role="status">Loading available accounts…</p>}
    {dashboard && <dl className="ads-summary">
      <div><dt>Connected Meta accounts</dt><dd>{items.filter(item => item.platform === 'meta' && item.status === 'connected').length}</dd></div>
      <div><dt>Connected Google accounts</dt><dd>{items.filter(item => item.platform === 'google' && item.status === 'connected').length}</dd></div>
      <div><dt>Leads today (UTC)</dt><dd>{dashboard.summary.receivedToday}</dd></div>
      <div><dt>Total Ads leads</dt><dd>{dashboard.summary.total}</dd></div>
      <div><dt>Failed webhooks</dt><dd>{dashboard.summary.failed}</dd></div>
      <div><dt>Last lead</dt><dd>{dateTime(lastLead)}</dd></div>
    </dl>}
    <label className="ads-connection-filter">Connection status
      <select value={connectionStatus} onChange={event => setConnectionStatus(event.target.value)}>
        <option value="">All statuses</option>
        {['connected', 'connecting', 'reconnect', 'disconnected'].map(status => <option key={status}>{status}</option>)}
      </select>
    </label>
    <div className="ads-grid">
      {Object.entries(labels).map(([platform, name]) => {
        const rows = items.filter(item => item.platform === platform && (!connectionStatus || item.status === connectionStatus));
        return <section className="ads-card" key={platform}>
          <header><h2>{name}</h2>
            <div className="ads-help">
              <button className="ads-icon" aria-label={`Help for ${name}`} onClick={() => setDialog({ type: 'help', platform })}><CircleHelp size={21} /></button>
              <div className="ads-popover"><Guide platform={platform} /></div>
            </div>
          </header>
          <p>{platform === 'meta' ? 'Facebook and Instagram lead forms' : 'Google Ads lead forms'}</p>
          <button disabled={busy || !dashboard?.available[platform]} onClick={() => actions.connect(platform)}>Connect {platform === 'meta' ? 'Meta' : 'Google Ads'} Account</button>
          {dashboard && !dashboard.available[platform] && <p>Server setup required.</p>}
          {rows.map(item => <AccountCard key={item._id} item={item} busy={busy} actions={actions} />)}
          {dashboard && !rows.length && <p>No matching connections.</p>}
        </section>;
      })}
    </div>
    <section className="ads-card ads-logs">
      <header><h2>Webhook Deliveries</h2></header>
      <div className="ads-grid ads-filters">
        <label>Platform<select value={filters.platform} onChange={event => filter('platform', event.target.value)}><option value="">All platforms</option>
          {Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Account<select value={filters.account} onChange={event => filter('account', event.target.value)}><option value="">All accounts</option>
          {items.filter(item => !filters.platform || item.platform === filters.platform).map(item => <option key={item._id} value={item._id}>{accounts.get(item._id)}</option>)}</select></label>
        <label>Delivery status<select value={filters.status} onChange={event => filter('status', event.target.value)}><option value="">All statuses</option>
          {logStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
        <label>Received date (UTC)<input type="date" value={filters.date} onChange={event => filter('date', event.target.value)} /></label>
      </div>
      <div className="ads-table-wrap"><table><thead><tr><th>Received</th><th>Account</th><th>Lead ID</th><th>Form ID</th><th>Status</th><th>Details</th><th>Action</th></tr></thead>
        <tbody>{logs.items.map(log => <tr key={log._id}>
          <td>{dateTime(log.receivedAt)}</td><td>{labels[log.platform]} · {accounts.get(log.integration) || '—'}</td>
          <td>{log.externalLeadId || '—'}</td><td>{log.formId || '—'}</td><td>{log.status}</td>
          <td>{log.error || (!log.duplicates ? '—' : '')}{Boolean(log.duplicates) && <div>{log.duplicates} repeat deliveries</div>}</td>
          <td>{log.status === 'failed' && <button className="ads-secondary" disabled={busy} onClick={() => act(async () => {
            const { data } = await api.post(`${base}/logs/${log._id}/retry`);
            setNotice(data.message); await refresh();
          })}>Retry</button>}</td>
        </tr>)}
        {!logs.items.length && <tr><td colSpan="7">No matching deliveries.</td></tr>}</tbody>
      </table></div>
      {logs.total > 25 && <footer>
        <button className="ads-secondary" disabled={filters.page === 1} onClick={() => filter('page', filters.page - 1)}>Previous</button>
        <span>Page {filters.page} of {Math.ceil(logs.total / 25)}</span>
        <button className="ads-secondary" disabled={filters.page * 25 >= logs.total} onClick={() => filter('page', filters.page + 1)}>Next</button>
      </footer>}
    </section>

    {pending && session && <OAuthSelection id={session} pending={pending} busy={busy} report={report} close={closePending}
      feedback={feedback} save={body => act(async () => {
        await api.post(`${base}/oauth/sessions/${session}/save`, body);
        closePending(); setNotice('Ads account connected.'); await refresh();
      })} />}
    {dialog?.type === 'help' && <Dialog title={`${labels[dialog.platform]} Setup`} close={close}><Guide platform={dialog.platform} /></Dialog>}
    {dialog?.type === 'settings' && <ConnectionSettings {...dialog} statuses={dashboard.leadStatuses} busy={busy} close={close}
      feedback={feedback} save={body => act(async () => {
        await api.patch(`${base}/accounts/${dialog.item._id}`, body);
        close(); setNotice('Connection settings saved.'); await loadDashboard();
      })} />}
    {dialog?.type === 'webhook' && <WebhookDialog {...dialog} item={items.find(item => item._id === dialog.item._id) || dialog.item}
      close={close} feedback={feedback} busy={busy} copy={(value, label) => act(async () => {
        await navigator.clipboard.writeText(value); setNotice(`${label} copied.`);
      })} test={item => act(async () => {
        const { data } = await api.post(`${base}/accounts/${item._id}/test-webhook`);
        setNotice(data.message); await refresh();
      })} />}
    {dialog?.type === 'disconnect' && <Dialog title="Disconnect ads account" close={close}>
      {feedback}
      <p>Future submissions from {dialog.item.accountName || dialog.item.externalAccountId} will stop arriving in CRM.</p>
      <footer><button className="ads-secondary" onClick={close}>Cancel</button><button className="ads-danger" disabled={busy} onClick={() => act(async () => {
        await api.delete(`${base}/accounts/${dialog.item._id}`);
        close(); setNotice('Ads account disconnected.'); await loadDashboard();
      })}>Disconnect</button></footer>
    </Dialog>}
  </main>;
}
