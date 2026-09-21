import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiPlusCircle, FiX } from 'react-icons/fi';
import './LeadSources.css';
import './LeadTypes.css';
import api from '../../utils/axiosConfig';

export default function LeadSources(){
  const [items,setItems]=useState([]); const [search,setSearch]=useState(''); const [limit,setLimit]=useState(10); const [page,setPage]=useState(1); const [modal,setModal]=useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    api.get('/crm/lead-sources', { cache: false }).then(({data}) => {
      if (active) setItems(data.items.map(item => ({ ...item, id: item._id })));
    }).catch(err => { if (active) setError(err.response?.data?.message || 'Could not load lead sources. Please reload to try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const filtered=useMemo(()=>items.filter(item=>item.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name)),[items,search]);
  const pages=Math.max(1,Math.ceil(filtered.length/limit)); const current=Math.min(page,pages); const start=(current-1)*limit; const visible=filtered.slice(start,start+limit);
  const save=async e=>{
    e.preventDefault();
    if (inFlight.current) return;
    const data=new FormData(e.currentTarget);
    const payload={name:String(data.get('name')||'').trim(),status:String(data.get('status'))};
    inFlight.current=true; setBusy(true); setError('');
    try {
      const response=modal?.item ? await api.put(`/crm/lead-sources/${modal.item.id}`,payload) : await api.post('/crm/lead-sources',payload);
      const item={...response.data.item,id:response.data.item._id};
      setItems(old=>modal?.item ? old.map(row=>row.id===item.id?item:row) : [...old,item]);
      setModal(null);
    } catch(err) { setError(err.response?.data?.message || 'Could not save lead source. Please try again.'); }
    finally {inFlight.current=false;setBusy(false);}
  };
  return <main className="ls-root">
    <header className="ls-page-header"><h1 className="ls-page-title">Lead Source</h1><div className="ls-breadcrumb"><span>Dashboard</span><span className="separator">›</span><span className="active">Lead Source</span></div></header>
    {error && !modal && <p role="alert" className="ls-empty-row">{error}</p>}
    <section className="ls-card"><header className="ls-card-header flex-between"><h2 className="ls-card-title">Lead Source</h2><button type="button" className="ls-btn-add" disabled={loading || busy} onClick={()=>{setError('');setModal({})}}><FiPlusCircle size={15}/> Add Lead Source</button></header>
      <div className="ls-table-controls"><div className="ls-entries-selector"><select value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1)}}><option>10</option><option>25</option><option>50</option><option>100</option></select><span>entries per page</span></div><div className="ls-search-box"><label>Search:</label><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div></div>
      <div className="ls-table-responsive"><table className="ls-table"><thead><tr><th style={{width:80}}>SL NO.</th><th>LEAD SOURCE</th><th style={{width:120}}>STATUS</th><th style={{width:100}}>ACTION</th></tr></thead><tbody>{visible.map((item,index)=><tr key={item.id}><td className="ls-sl-col">{String(start+index+1).padStart(3,'0')}</td><td>{item.name}</td><td><span className={`lt-status-pill ${item.status === 'Active' ? 'is-active' : 'is-inactive'}`}><span aria-hidden="true" />{item.status}</span></td><td><div className="ls-action-btns"><button type="button" className="ls-btn-edit" aria-label={`Edit ${item.name}`} title="Edit" disabled={busy} onClick={()=>{setError('');setModal({item})}}><FiEdit2 size={12}/></button></div></td></tr>)}{!visible.length&&<tr><td colSpan="4" className="ls-empty-row">{loading ? 'Loading lead sources...' : 'No lead sources found.'}</td></tr>}</tbody></table></div>
      <footer className="ls-table-footer"><div className="ls-entries-info">Showing {filtered.length?start+1:0} to {Math.min(start+limit,filtered.length)} of {filtered.length} entries</div><div className="ls-pagination"><button className="page-btn" disabled={current===1} onClick={()=>setPage(1)}>«</button><button className="page-btn" disabled={current===1} onClick={()=>setPage(current-1)}><FiChevronLeft size={12}/></button>{Array.from({length:pages},(_,i)=>i+1).map(number=><button className={`page-btn ${number===current?'active':''}`} key={number} onClick={()=>setPage(number)}>{number}</button>)}<button className="page-btn" disabled={current===pages} onClick={()=>setPage(current+1)}><FiChevronRight size={12}/></button><button className="page-btn" disabled={current===pages} onClick={()=>setPage(pages)}>»</button></div></footer>
    </section>
    {modal&&<div className="ls-modal-overlay"><form className="ls-modal-card" onSubmit={save}><header className="ls-modal-header"><h3>{modal.item?'Edit':'Add'} Lead Source</h3><button type="button" className="ls-modal-close" disabled={busy} onClick={()=>setModal(null)}><FiX/></button></header><div className="ls-modal-body">{error && <p role="alert">{error}</p>}<div className="ls-field"><label>Lead Source Name *</label><input name="name" defaultValue={modal.item?.name||''} maxLength={100} required autoFocus/></div><fieldset className="lt-status-field" disabled={busy}><legend>Status</legend><div className="lt-status-options">{['Active', 'Inactive'].map(status => <label className={`lt-status-option ${status.toLowerCase()}`} key={status}><input type="radio" name="status" value={status} defaultChecked={(modal.item?.status || 'Active') === status} /><span><span className="lt-choice-dot" aria-hidden="true" />{status}</span></label>)}</div></fieldset></div><footer className="ls-modal-footer"><button type="button" className="ls-modal-cancel" disabled={busy} onClick={()=>setModal(null)}>Cancel</button><button type="submit" disabled={busy} className="ls-modal-save">{busy ? 'Saving...' : 'Save Source'}</button></footer></form></div>}
  </main>;
}
