import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/axiosConfig';
import './CrmPipeline.css';

// Pipeline stages in board order; contacted and negotiation are set only from this board.
export const PIPELINE_STAGES = [
  { status: 'new', label: 'New', color: '#2563eb' },
  { status: 'contacted', label: 'Contacted', color: '#0891b2' },
  { status: 'follow-up', label: 'Follow-up', color: '#d97706' },
  { status: 'interested', label: 'Interested', color: '#16a34a' },
  { status: 'negotiation', label: 'Negotiation', color: '#9333ea' },
  { status: 'converted', label: 'Won (Converted)', color: '#15803d' },
  { status: 'not interested', label: 'Not Interested', color: '#dc2626' },
  { status: 'closed', label: 'Lost (Closed)', color: '#475569' },
];
const PAGE_SIZE = 20;

const emptyColumns = () => Object.fromEntries(PIPELINE_STAGES.map(stage => [stage.status, { items: [], total: 0, page: 0, loading: true }]));

// Kanban view of All Leads: one column per stage, filtered like the table; drag a card to change its stage.
export default function PipelineBoard({ params, onOpenLead, canEdit = true }) {
  const [columns, setColumns] = useState(emptyColumns);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState('');
  const [error, setError] = useState('');
  const paramsKey = JSON.stringify(params);

  const loadColumn = useCallback(async (status, page) => {
    setColumns(current => ({ ...current, [status]: { ...current[status], loading: true } }));
    try {
      const { data } = await api.get('/crm/leads', {
        params: { ...JSON.parse(paramsKey), status, page, limit: PAGE_SIZE },
        cache: false,
        _skipErrorNotify: true,
      });
      setColumns(current => ({
        ...current,
        [status]: {
          items: page === 1 ? (data?.items || []) : [...current[status].items, ...(data?.items || [])],
          total: Number(data?.total) || 0,
          page,
          loading: false,
        },
      }));
    } catch (err) {
      setColumns(current => ({ ...current, [status]: { ...current[status], loading: false } }));
      setError(err.response?.data?.message || 'Could not load the pipeline.');
    }
  }, [paramsKey]);

  useEffect(() => {
    setError('');
    setColumns(emptyColumns());
    PIPELINE_STAGES.forEach(stage => loadColumn(stage.status, 1));
  }, [loadColumn]);

  const moveLead = async (lead, from, to) => {
    if (!lead || from === to) return;
    setError('');
    // Move the card right away; put it back if the server refuses.
    const apply = (source, target, item) => setColumns(current => ({
      ...current,
      [source]: { ...current[source], items: current[source].items.filter(row => row._id !== item._id), total: Math.max(0, current[source].total - 1) },
      [target]: { ...current[target], items: [{ ...item, status: target }, ...current[target].items], total: current[target].total + 1 },
    }));
    apply(from, to, lead);
    try {
      await api.patch(`/crm/leads/${lead._id}/status`, { status: to });
    } catch (err) {
      apply(to, from, { ...lead, status: from });
      setError(err.response?.data?.message || 'Could not move the lead. Please try again.');
    }
  };

  return (
    <div className="cp-board-wrap">
      {error && <div className="cp-error" role="alert">{error}</div>}
      {canEdit && <p className="cp-board-hint">Drag a card to another column to change its stage.</p>}
      <div className="cp-board">
        {PIPELINE_STAGES.map(stage => {
          const column = columns[stage.status];
          return (
            <section
              key={stage.status}
              className={`cp-column ${dropTarget === stage.status ? 'is-drop-target' : ''}`}
              onDragOver={event => {
                if (!dragging || !canEdit) return;
                event.preventDefault();
                setDropTarget(stage.status);
              }}
              onDragLeave={() => setDropTarget(current => (current === stage.status ? '' : current))}
              onDrop={event => {
                event.preventDefault();
                setDropTarget('');
                if (dragging) moveLead(dragging.lead, dragging.from, stage.status);
                setDragging(null);
              }}
            >
              <header className="cp-column-head" style={{ borderTopColor: stage.color }}>
                <span>{stage.label}</span>
                <span className="cp-count" style={{ color: stage.color }}>{column.total}</span>
              </header>
              <div className="cp-cards">
                {column.items.map(lead => (
                  <article
                    key={lead._id}
                    className="cp-card"
                    draggable={canEdit}
                    onDragStart={event => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', lead._id);
                      setDragging({ lead, from: stage.status });
                    }}
                    onDragEnd={() => { setDragging(null); setDropTarget(''); }}
                    onClick={() => onOpenLead?.(lead)}
                  >
                    <strong>{lead.name || 'Unnamed lead'}</strong>
                    <span className="cp-card-phone">{lead.phone}</span>
                    <div className="cp-card-meta">
                      {lead.campaignName && <span className="cp-tag cp-tag-campaign">{lead.campaignName}</span>}
                      {(lead.leadTypeName || lead.leadType?.name) && <span className="cp-tag">{lead.leadTypeName || lead.leadType?.name}</span>}
                    </div>
                    <span className="cp-card-owner">{lead.assignedToName || lead.assignedTo?.name || 'Unassigned'}</span>
                  </article>
                ))}
                {!column.loading && !column.items.length && <p className="cp-empty">No leads</p>}
                {column.loading && <p className="cp-empty">Loading...</p>}
                {!column.loading && column.items.length < column.total && (
                  <button type="button" className="cp-more" onClick={() => loadColumn(stage.status, column.page + 1)}>
                    Load more ({column.total - column.items.length})
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
