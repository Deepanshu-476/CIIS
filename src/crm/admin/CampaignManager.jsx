import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/axiosConfig';
import './CrmPipeline.css';

const EMPTY = { id: '', name: '', description: '', target: '', startDate: '', endDate: '', status: 'active', outcomes: [] };
const STATUS_LABELS = { active: 'Active', paused: 'Paused', completed: 'Completed' };

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    try {
      const { data } = await api.get('/crm/leads/campaigns', { cache: false, _skipErrorNotify: true });
      setCampaigns(Array.isArray(data?.items) ? data.items : []);
      setOutcomes(Array.isArray(data?.outcomes) ? data.outcomes : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load campaigns.');
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { campaigns, outcomes, error, reload };
};

export const CampaignProgress = ({ campaign }) => (
  <div className="cp-progress">
    <div className="cp-progress-bar"><span style={{ width: `${campaign.progress}%` }} /></div>
    <div className="cp-progress-stats">
      <span><strong>{campaign.stats.total}</strong> leads</span>
      <span><strong>{campaign.stats.called}</strong> called</span>
      <span><strong>{campaign.stats.interested}</strong> interested</span>
      <span><strong>{campaign.stats.converted}</strong>{campaign.target ? ` / ${campaign.target}` : ''} won</span>
      <span className="cp-progress-pct">{campaign.progress}%</span>
    </div>
  </div>
);

// Campaigns (All Leads page): progress, create/edit/delete, and adding the leads the table is filtered to.
export default function CampaignManager({ open, onClose, filterParams, filteredTotal, campaignsState, onChanged }) {
  const { campaigns, outcomes, error: loadError, reload } = campaignsState;
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm(null); setMessage(''); setError(''); reload(); }
  }, [open, reload]);

  if (!open) return null;

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, target: Number(form.target || 0) };
      if (form.id) await api.put(`/crm/leads/campaigns/${form.id}`, payload);
      else await api.post('/crm/leads/campaigns', payload);
      setForm(null);
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the campaign.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async campaign => {
    if (!window.confirm(`Delete "${campaign.name}"? Its leads stay in the CRM and just leave the campaign.`)) return;
    setBusyId(campaign.id);
    try {
      await api.delete(`/crm/leads/campaigns/${campaign.id}`);
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the campaign.');
    } finally {
      setBusyId('');
    }
  };

  const addFiltered = async campaign => {
    if (!window.confirm(`Add the ${filteredTotal} leads shown in the table to "${campaign.name}"? Leads already in another campaign move to this one.`)) return;
    setBusyId(campaign.id);
    setMessage('');
    try {
      const { data } = await api.post(`/crm/leads/campaigns/${campaign.id}/leads`, { filters: filterParams });
      setMessage(`${data?.updated ?? 0} leads added to ${campaign.name}.`);
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the leads.');
    } finally {
      setBusyId('');
    }
  };

  const toggleOutcome = outcome => setForm(current => ({
    ...current,
    outcomes: current.outcomes.includes(outcome) ? current.outcomes.filter(item => item !== outcome) : [...current.outcomes, outcome],
  }));

  return (
    <div className="cp-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-campaign-title" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="cp-modal">
        <header className="cp-modal-head">
          <h3 id="cp-campaign-title">{form ? (form.id ? 'Edit campaign' : 'New campaign') : 'Campaigns'}</h3>
          <button type="button" className="cp-close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        {(error || loadError) && <div className="cp-error" role="alert">{error || loadError}</div>}
        {message && <div className="cp-success" role="status">{message}</div>}

        {form ? (
          <form className="cp-form" onSubmit={save}>
            <label>Campaign name *<input value={form.name} maxLength={80} placeholder="e.g. Diwali offer list" onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Description<textarea rows={2} value={form.description} maxLength={500} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
            <div className="cp-form-row">
              <label>Target (conversions)<input type="number" min="0" value={form.target} placeholder="0 = no target" onChange={e => setForm({ ...form, target: e.target.value })} /></label>
              <label>Status
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="cp-form-row">
              <label>Start date<input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
              <label>End date<input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></label>
            </div>
            <fieldset className="cp-outcomes">
              <legend>Call outcomes for this campaign</legend>
              <small>Telecallers see only these outcomes for the campaign's leads. Leave all unticked to allow every outcome.</small>
              <div>
                {outcomes.map(outcome => (
                  <label key={outcome} className={form.outcomes.includes(outcome) ? 'is-on' : ''}>
                    <input type="checkbox" checked={form.outcomes.includes(outcome)} onChange={() => toggleOutcome(outcome)} />{outcome}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="cp-actions">
              <button type="button" className="cp-btn-secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="cp-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save campaign'}</button>
            </div>
          </form>
        ) : (
          <>
            {!campaigns.length && <p className="cp-empty">No campaigns yet. Create one, then add leads to it from the table filters.</p>}
            {campaigns.map(campaign => (
              <div key={campaign.id} className="cp-campaign">
                <div className="cp-campaign-head">
                  <div>
                    <strong>{campaign.name}</strong>
                    <span className={`cp-status cp-status-${campaign.status}`}>{STATUS_LABELS[campaign.status]}</span>
                    {(campaign.startDate || campaign.endDate) && <small>{campaign.startDate || '…'} → {campaign.endDate || '…'}</small>}
                  </div>
                  <div className="cp-campaign-actions">
                    <button type="button" onClick={() => setForm({ ...EMPTY, ...campaign, target: campaign.target || '' })}>Edit</button>
                    <button type="button" className="danger" disabled={busyId === campaign.id} onClick={() => remove(campaign)}>Delete</button>
                  </div>
                </div>
                {campaign.description && <p className="cp-campaign-desc">{campaign.description}</p>}
                <CampaignProgress campaign={campaign} />
                <button type="button" className="cp-btn-link" disabled={busyId === campaign.id || !filteredTotal} onClick={() => addFiltered(campaign)}>
                  + Add the {filteredTotal} leads shown in the table
                </button>
              </div>
            ))}
            <div className="cp-actions">
              <button type="button" className="cp-btn-primary" onClick={() => setForm({ ...EMPTY })}>+ New campaign</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
