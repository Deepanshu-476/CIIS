import React, { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/SalaryComponent.css";

const emptyForm = {
  name: "", code: "", type: "earning", sortOrder: "", status: "active",
  proRata: true, taxable: true, grossSalary: true, pfWage: false, esiWage: false, ptWage: false,
};

const settingFields = [
  ["proRata", "Apply Pro-rata", "Adjust the amount based on attendance and loss of pay"],
  ["taxable", "Taxable Component", "Include this component in income tax calculations"],
  ["grossSalary", "Include in Gross Salary", "Include this component in gross salary"],
  ["pfWage", "Include in PF Wage", "Include this component in the PF wage base"],
  ["esiWage", "Include in ESI Wage", "Include this component in the ESI wage base"],
  ["ptWage", "Include in PT Wage", "Include this component in Professional Tax calculations"],
];

export default function SalaryComponent() {
  const [components, setComponents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const loadComponents = async () => {
      try {
        const response = await axiosInstance.get("/salary-components");
        if (active) setComponents(Array.isArray(response.data?.components) ? response.data.components : []);
      } catch (error) {
        if (active) setMessage({ type: "error", text: error.response?.data?.message || "Unable to load salary components." });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadComponents();
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => components
    .filter(item => `${item.name} ${item.code} ${item.type}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)), [components, search]);

  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const resetForm = () => { setForm(emptyForm); setEditingId(""); setMessage(null); };
  const saveComponent = async event => {
    event.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code || !form.sortOrder) return setMessage({ type: "error", text: "Component name, code, and sort order are required." });
    if (components.some(item => item.code.toUpperCase() === code && item._id !== editingId)) return setMessage({ type: "error", text: "This component code is already in use." });
    const record = { ...form, name, code, sortOrder: Number(form.sortOrder) };
    setSaving(true);
    try {
      const response = editingId
        ? await axiosInstance.put(`/salary-components/${editingId}`, record)
        : await axiosInstance.post("/salary-components", record);
      const saved = response.data?.component;
      setComponents(current => editingId
        ? current.map(item => item._id === editingId ? saved : item)
        : [...current, saved]);
      setMessage({ type: "success", text: response.data?.message || "Salary component saved successfully." });
      setForm(emptyForm); setEditingId("");
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save salary component." });
    } finally {
      setSaving(false);
    }
  };

  const editComponent = item => { setEditingId(item._id); setForm({ ...emptyForm, ...item, sortOrder: String(item.sortOrder) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteComponent = async id => {
    if (!window.confirm("Are you sure you want to delete this salary component?")) return;
    try {
      const response = await axiosInstance.delete(`/salary-components/${id}`);
      setComponents(current => current.filter(item => item._id !== id));
      setMessage({ type: "success", text: response.data?.message || "Salary component deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to delete salary component." });
    }
  };

  return <main className="salary-component-page">
    <header className="salary-component-heading">
      <div><h1>Salary Component Master</h1><p>Create and manage earning, deduction, and statutory components.</p></div>
      <nav aria-label="Breadcrumb"><span>Payroll</span><b>/</b><span>Salary Components</span></nav>
    </header>

    <form className="salary-component-panel" onSubmit={saveComponent}>
      <div className="salary-component-panel-title"><div><h2>{editingId ? "Edit" : "Add"} Salary Component</h2><p>Define component details and payroll calculation settings.</p></div></div>
      <div className="salary-component-fields">
        <label><span>Component Name *</span><input value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="e.g. Basic Salary" /></label>
        <label><span>Component Code *</span><input value={form.code} onChange={e => updateForm("code", e.target.value.toUpperCase())} placeholder="e.g. BASIC" /></label>
        <label><span>Component Type *</span><select value={form.type} onChange={e => updateForm("type", e.target.value)}><option value="earning">Earning</option><option value="deduction">Deduction</option></select></label>
        <label><span>Sort Order *</span><input type="number" min="1" value={form.sortOrder} onChange={e => updateForm("sortOrder", e.target.value)} placeholder="1" /></label>
        <label><span>Status *</span><select value={form.status} onChange={e => updateForm("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
      <section className="salary-component-settings"><h3>Payroll Settings</h3><div className="salary-component-setting-grid">
        {settingFields.map(([key, label, help]) => <label className="salary-component-check" key={key}><input type="checkbox" checked={form[key]} onChange={e => updateForm(key, e.target.checked)} /><span><strong>{label}</strong><small>{help}</small></span></label>)}
      </div></section>
      {message && <div className={`salary-component-message ${message.type}`}>{message.text}</div>}
      <footer className="salary-component-form-actions"><button type="button" onClick={resetForm}>Reset</button><button type="submit" className="primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Component" : "Save Component"}</button></footer>
    </form>

    <section className="salary-component-panel salary-component-list">
      <div className="salary-component-panel-title"><div><h2>Salary Component List</h2><p>{components.length} components configured</p></div><button className="salary-component-add" onClick={resetForm}><FiPlus /> Add Component</button></div>
      <div className="salary-component-search"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search component..." /></div>
      <div className="salary-component-table-wrap"><table><thead><tr><th>Code</th><th>Component Name</th><th>Type</th><th>Taxable</th><th>In Gross</th><th>PF Wage</th><th>ESI Wage</th><th>PT Wage</th><th>Order</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{rows.map(item => <tr key={item._id}><td><strong>{item.code}</strong></td><td>{item.name}</td><td><span className={`salary-component-badge ${item.type}`}>{item.type}</span></td>{["taxable", "grossSalary", "pfWage", "esiWage", "ptWage"].map(key => <td key={key} className={item[key] ? "yes" : "no"}>{item[key] ? "Yes" : "No"}</td>)}<td>{item.sortOrder}</td><td><span className={`salary-component-badge ${item.status}`}>{item.status}</span></td><td><div className="salary-component-row-actions"><button type="button" onClick={() => editComponent(item)} aria-label="Edit"><FiEdit2 /></button><button type="button" className="delete" onClick={() => deleteComponent(item._id)} aria-label="Delete"><FiTrash2 /></button></div></td></tr>)}</tbody>
      </table>{!loading && rows.length === 0 && <div className="salary-component-empty">No salary components found.</div>}{loading && <div className="salary-component-empty">Loading salary components...</div>}</div>
    </section>
  </main>;
}
