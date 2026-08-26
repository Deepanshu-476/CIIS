import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronDown,
  FiEdit2,
  FiEye,
  FiFileText,
  FiHash,
  FiPlus,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX
} from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/SalaryStructure.css";
import "../styles/SalaryStructureOverrides.css";

const emptyStructureForm = {
  name: "",
  code: "",
  salaryType: "monthly",
  salaryInputType: "gross",
  description: "",
  status: "active",
  components: []
};

const rowFor = (component, order) => ({
  component,
  calculationType: "manual",
  calculationBase: "",
  value: "",
  formula: "",
  sortOrder: order
});

export default function SalaryStructure() {
  const [form, setForm] = useState(emptyStructureForm);
  const [masters, setMasters] = useState([]);
  const [structures, setStructures] = useState([]);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const addDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const used = useMemo(
    () => new Set(form.components.map(r => String(r.component?._id || r.component))),
    [form.components]
  );

  const availableComponents = useMemo(() => {
    return masters.filter(x => !used.has(String(x._id)));
  }, [masters, used]);

  const nextStructureCode = useMemo(() => {
    const largest = structures.reduce((max, item) => {
      const match = String(item.code || "").match(/^SAL-(\d+)$/i);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `SAL-${String(largest + 1).padStart(3, "0")}`;
  }, [structures]);

  const loadData = async () => {
    try {
      const [compRes, structRes] = await Promise.allSettled([
        axiosInstance.get("/salary-components", { noCache: true }),
        axiosInstance.get("/salary-structures", { noCache: true })
      ]);

      if (compRes.status === "fulfilled") {
        const compList = compRes.value.data?.components || [];
        if (compList.length > 0) {
          setMasters(compList.filter(x => x.status === "active"));
        } else {
          setMasters([]);
        }
      }

      if (structRes.status === "fulfilled") {
        const structList = structRes.value.data?.structures || [];
        if (structList.length > 0) {
          setStructures(structList);
        } else {
          setStructures([]);
        }
      }
    } catch (err) {
      console.error("Unable to load salary structure data", err);
      setMasters([]);
      setStructures([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const addComponentDirect = (component) => {
    if (!component || used.has(String(component._id))) return;
    change("components", [...form.components, rowFor(component, form.components.length + 1)]);
    setAddDropdownOpen(false);
  };

  const rowChange = (index, key, value) =>
    change("components", form.components.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  const calculationChange = (index, type) =>
    change("components", form.components.map((r, i) =>
      i === index
        ? {
            ...r,
            calculationType: type,
            calculationBase: type === "percentage" ? r.calculationBase || "Gross Salary" : "",
            value: type === "formula" ? "" : r.value,
            formula: type === "formula" ? r.formula || "Gross - (Basic + HRA + CONV)" : ""
          }
        : r
    ));

  const removeRow = index =>
    change("components", form.components.filter((_, i) => i !== index).map((r, i) => ({ ...r, sortOrder: i + 1 })));

  const reset = () => {
    setForm(emptyStructureForm);
    setEditingId("");
    setMessage(null);
  };

  const edit = item => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      code: item.code || "",
      salaryType: item.salaryType || "monthly",
      salaryInputType: item.salaryInputType || "gross",
      description: item.description || "",
      status: item.status || "active",
      components: (item.components || []).map((r, i) => ({
        component: r.component,
        calculationType: r.calculationType || "manual",
        calculationBase: r.calculationBase || "",
        value: r.value !== undefined ? String(r.value) : "",
        formula: r.formula || "",
        sortOrder: r.sortOrder || i + 1
      }))
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async id => {
    if (!window.confirm("Are you sure you want to delete this salary structure?")) return;
    try {
      const res = await axiosInstance.delete(`/salary-structures/${id}`);
      setStructures(list => list.filter(x => x._id !== id));
      setMessage({ type: "success", text: res.data?.message || "Salary structure deleted successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Unable to delete salary structure." });
    }
  };

  const payload = () => ({
    ...form,
    name: form.name.trim(),
    code: editingId ? form.code : nextStructureCode,
    components: form.components.map((r, i) => ({
      component: r.component?._id || r.component,
      name: r.component?.name || r.name,
      code: r.component?.code || r.code,
      type: r.component?.type || r.type,
      calculationType: r.calculationType || "manual",
      calculationBase: r.calculationBase || "",
      value: Number(r.value || 0),
      formula: r.formula || "",
      sortOrder: Number(r.sortOrder || i + 1)
    }))
  });

  const save = async e => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setMessage({ type: "error", text: "Structure name is required." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.components.length) {
      setMessage({ type: "error", text: "Please add at least one salary component to this structure." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const isRealObjectId = editingId && editingId.length === 24 && !editingId.startsWith("struct-");
      const res = isRealObjectId
        ? await axiosInstance.put(`/salary-structures/${editingId}`, payload())
        : await axiosInstance.post("/salary-structures", payload());
      const item = res.data?.structure;
      if (item) {
        setStructures(list => {
          const exists = list.some(x => x._id === item._id || x.code === item.code);
          return exists ? list.map(x => (x._id === item._id || x.code === item.code ? item : x)) : [item, ...list];
        });
      }
      setMessage({ type: "success", text: res.data?.message || "Salary structure saved successfully." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      reset();
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: err.response?.data?.message || "Unable to save salary structure." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // Filter and sort structures
  const filteredStructures = useMemo(() => {
    return structures.filter(x =>
      `${x.name} ${x.code} ${x.salaryType} ${x.salaryInputType}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [structures, search]);

  const totalPages = Math.ceil(filteredStructures.length / entriesPerPage) || 1;
  const paginatedStructures = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredStructures.slice(start, start + entriesPerPage);
  }, [filteredStructures, currentPage, entriesPerPage]);

  return (
    <main className="salary-structure-page">
      {/* Alert Message */}
      {message && (
        <div className={`ss-alert ${message.type}`}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Main Card: Add / Edit Salary Structure */}
      <form className="ss-card" onSubmit={save}>
        <div className="ss-card-title">
          <h2>{editingId ? "Edit Salary Structure" : "Add Salary Structure"}</h2>
        </div>

        <div className="ss-form-grid">
          {/* Structure Name */}
          <div className="ss-form-group">
            <label>
              Structure Name <span className="req">*</span>
            </label>
            <div className="ss-input-wrap">
              <FiFileText className="ss-input-icon" />
              <input
                type="text"
                className="ss-input"
                value={form.name}
                onChange={e => change("name", e.target.value)}
                placeholder="e.g. Standard - Gross Based"
                required
              />
            </div>
          </div>

          {/* Structure Code */}
          <div className="ss-form-group">
            <label>
              Structure Code
            </label>
            <div className="ss-input-wrap">
              <FiHash className="ss-input-icon" />
              <input
                type="text"
                className="ss-input"
                value={editingId ? form.code : nextStructureCode}
                placeholder="Auto-generated on save (SAL-001)"
                readOnly
                title="Code is generated automatically and cannot be changed"
              />
            </div>
          </div>

          {/* Salary Type */}
          <div className="ss-form-group">
            <label>Salary Type</label>
            <select
              className="ss-select"
              value={form.salaryType}
              onChange={e => change("salaryType", e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          {/* Salary Input Type */}
          <div className="ss-form-group">
            <label>Salary Input Type</label>
            <select
              className="ss-select"
              value={form.salaryInputType}
              onChange={e => change("salaryInputType", e.target.value)}
            >
              <option value="gross">Gross</option>
              <option value="ctc">CTC</option>
            </select>
          </div>

          {/* Status */}
          <div className="ss-form-group">
            <label>
              Status <span className="req">*</span>
            </label>
            <div className="ss-select-status">
              <span className={`ss-status-dot ${form.status}`} />
              <select
                className="ss-select"
                value={form.status}
                onChange={e => change("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="ss-form-group ss-span-2">
            <label>Description</label>
            <input
              type="text"
              className="ss-input"
              value={form.description}
              onChange={e => change("description", e.target.value)}
              placeholder="Optional description / notes..."
            />
          </div>
        </div>

        {/* Components Table Section */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #e2e8f0" }}>
          <div className="ss-between" style={{ marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#1e40af", margin: "0 0 2px" }}>
                Structure Components
              </h3>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                Add components and choose a fixed amount or percentage calculation.
              </p>
            </div>

            {/* + Add Component Button with Attached Dropdown */}
            <div className="ss-btn-dropdown-wrap" ref={addDropdownRef}>
              <button
                type="button"
                className="ss-btn-add"
                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              >
                <FiPlus /> Add Component{" "}
                <FiChevronDown
                  style={{
                    marginLeft: 4,
                    transition: "transform 0.2s",
                    transform: addDropdownOpen ? "rotate(180deg)" : "none"
                  }}
                />
              </button>

              {addDropdownOpen && (
                <div className="ss-btn-dropdown-menu">
                  <div className="ss-btn-dropdown-header">Select Component to Add:</div>
                  {availableComponents.length === 0 ? (
                    <div className="ss-btn-dropdown-empty">
                      All configured components are already added to this structure.
                    </div>
                  ) : (
                    availableComponents.map(comp => (
                      <div
                        key={comp._id}
                        className="ss-btn-dropdown-item"
                        onClick={() => addComponentDirect(comp)}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <strong style={{ fontSize: 12.5, color: "#0f172a" }}>{comp.name}</strong>
                          <small style={{ fontSize: 11, color: "#64748b" }}>Code: {comp.code}</small>
                        </div>
                        <span className={`ss-badge ${comp.type || "earning"}`}>
                          {comp.type === "earning" ? "Earning" : "Deduction"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ss-table-wrap">
            <table className="ss-table">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>#</th>
                  <th>Component</th>
                  <th style={{ width: 100 }}>Type</th>
                  <th style={{ width: 140 }}>Calculation Type</th>
                  <th style={{ width: 180 }}>Calculation Base</th>
                  <th style={{ width: 130 }}>Value / %</th>
                  <th style={{ width: 60, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.components.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                      No components added yet. Click <strong>"+ Add Component"</strong> above to pick a component.
                    </td>
                  </tr>
                ) : (
                  form.components.map((r, i) => (
                    <tr key={r._id || r.component?._id || i}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{r.component?.name || "Component"}</strong>{" "}
                        <span style={{ color: "#64748b" }}>({r.component?.code || ""})</span>
                      </td>
                      <td>
                        <span className={`ss-badge ${r.component?.type || "earning"}`}>
                          {r.component?.type === "earning" ? "Earning" : "Deduction"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="ss-table-select"
                          value={r.calculationType}
                          onChange={e => calculationChange(i, e.target.value)}
                        >
                          <option value="manual">Manual</option>
                          <option value="percentage">Percentage</option>
                          {!["manual", "percentage"].includes(r.calculationType) && (
                            <option value={r.calculationType} disabled>Legacy {r.calculationType}</option>
                          )}
                        </select>
                      </td>
                      <td>
                        {r.calculationType === "percentage" ? (
                          <select
                            className="ss-table-select"
                            value={r.calculationBase}
                            onChange={e => rowChange(i, "calculationBase", e.target.value)}
                          >
                            <option value="">Select base</option>
                            <optgroup label="Salary Base">
                              <option value="Gross Salary">Gross Salary</option>
                            </optgroup>
                            {form.components
                              .filter((_, baseIndex) => baseIndex !== i)
                              .filter(base => String(base.component?.name || "").trim())
                              .length > 0 && (
                              <optgroup label="Selected Components">
                                {form.components
                                  .filter((_, baseIndex) => baseIndex !== i)
                                  .filter(base => String(base.component?.name || "").trim())
                                  .map(base => (
                                    <option
                                      key={base.component?._id || base.component}
                                      value={base.component?.name || base.component?.code}
                                    >
                                      {base.component?.name} ({base.component?.code})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          </select>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td>
                        {r.calculationType !== "formula" && r.calculationType !== "balance" ? (
                          <div className="ss-val-input-group">
                            <input
                              type="number"
                              min="0"
                              max={r.calculationType === "percentage" ? 100 : undefined}
                              className="ss-table-input"
                              value={r.value}
                              onChange={e => rowChange(i, "value", e.target.value)}
                              placeholder={r.calculationType === "percentage" ? "50" : "Amount"}
                            />
                            {r.calculationType === "percentage" && <span className="unit">%</span>}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td style={{ display: "none" }}>
                        {r.calculationType === "formula" ? (
                          <input
                            type="text"
                            className="ss-table-input"
                            value={r.formula}
                            onChange={e => rowChange(i, "formula", e.target.value)}
                            placeholder="Gross - (Basic + HRA + CONV)"
                          />
                        ) : r.calculationType === "balance" ? (
                          <span>Gross − Other Earnings</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td style={{ display: "none" }}>
                        <input
                          type="number"
                          min="1"
                          style={{ width: 55 }}
                          className="ss-table-input"
                          value={r.sortOrder}
                          onChange={e => rowChange(i, "sortOrder", e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="ss-action-btn delete"
                          onClick={() => removeRow(i)}
                          title="Remove component"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions Row */}
        <div className="ss-actions-row">
          <button type="button" className="ss-btn-reset" onClick={reset}>
            Reset
          </button>
          <button type="submit" className="ss-btn-save" disabled={saving}>
            <FiSave /> {saving ? "Saving..." : editingId ? "Update Structure" : "Save Structure"}
          </button>
        </div>
      </form>

      {/* Bottom Card: Salary Structure List */}
      <section className="ss-card">
        <div className="ss-card-title-plain" style={{ marginBottom: 18 }}>
          <h2>Salary Structure List</h2>
        </div>

        {/* Toolbar */}
        <div className="ss-toolbar">
          <div className="ss-entries-select">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={e => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="ss-toolbar-right">
            <div className="ss-search-wrap">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search structure..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <button
              type="button"
              className="ss-btn-add"
              onClick={() => {
                reset();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <FiPlus /> Add Structure
            </button>
          </div>
        </div>

        {/* Structures Table */}
        <div className="ss-table-wrap">
          <table className="ss-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>SL</th>
                <th>Structure Code</th>
                <th>Structure Name</th>
                <th>Salary Type</th>
                <th>Input Type</th>
                <th>Effective From</th>
                <th>Components</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: 28, color: "#64748b" }}>
                    Loading salary structures...
                  </td>
                </tr>
              ) : paginatedStructures.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: 28, color: "#64748b" }}>
                    No salary structures found. Create your first structure above.
                  </td>
                </tr>
              ) : (
                paginatedStructures.map((x, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  return (
                    <tr key={x._id}>
                      <td>{sl}</td>
                      <td className="ss-code-cell">{x.code}</td>
                      <td>
                        <strong>{x.name}</strong>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{x.salaryType}</td>
                      <td style={{ textTransform: "uppercase" }}>{x.salaryInputType}</td>
                      <td>
                        {x.effectiveFrom
                          ? new Date(x.effectiveFrom).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#2563eb" }}>
                          {x.components?.length || 0}
                        </span>{" "}
                        component(s)
                      </td>
                      <td>
                        <span className={`ss-badge ${x.status}`}>
                          {x.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="ss-row-actions" style={{ justifyContent: "center" }}>
                          <button
                            type="button"
                            className="ss-action-btn view"
                            title="Preview Details"
                            onClick={() => setPreviewItem(x)}
                          >
                            <FiEye />
                          </button>
                          <button
                            type="button"
                            className="ss-action-btn edit"
                            title="Edit"
                            onClick={() => edit(x)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="ss-action-btn delete"
                            title="Delete"
                            onClick={() => remove(x._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 12.5, color: "#64748b", flexWrap: "wrap", gap: 12 }}>
          <div>
            Showing{" "}
            {filteredStructures.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{" "}
            {Math.min(currentPage * entriesPerPage, filteredStructures.length)} of {filteredStructures.length} entries
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              className="scm-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                className={`scm-page-btn ${page === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="scm-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Preview Structure Details */}
      {previewItem && (
        <div className="ss-modal-backdrop" onMouseDown={() => setPreviewItem(null)}>
          <div
            className="ss-modal"
            style={{ width: "min(750px, 96%)", maxHeight: "85vh", overflowY: "auto" }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>
                  {previewItem.name}{" "}
                  <span style={{ color: "#2563eb" }}>({previewItem.code})</span>
                </h3>
                <p style={{ margin: "4px 0 8px" }}>
                  Type: <strong style={{ textTransform: "capitalize" }}>{previewItem.salaryType}</strong> | Input: <strong style={{ textTransform: "uppercase" }}>{previewItem.salaryInputType}</strong> | Effective: <strong>{previewItem.effectiveFrom ? new Date(previewItem.effectiveFrom).toLocaleDateString("en-IN") : "—"}</strong> | Status: <span className={`ss-badge ${previewItem.status}`}>{previewItem.status}</span>
                </p>
                {previewItem.description && (
                  <p style={{ margin: "0 0 12px", color: "#64748b", fontStyle: "italic" }}>
                    {previewItem.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="ss-action-btn"
                onClick={() => setPreviewItem(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="ss-table-wrap">
              <table className="ss-table">
                <thead>
                  <tr>
                    <th style={{ width: 45 }}>#</th>
                    <th>Component</th>
                    <th>Type</th>
                    <th>Calculation Type</th>
                    <th>Calculation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewItem.components || []).map((r, i) => (
                    <tr key={r._id || i}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{r.component?.name || "Component"}</strong>{" "}
                        <span style={{ color: "#64748b" }}>({r.component?.code || ""})</span>
                      </td>
                      <td>
                        <span className={`ss-badge ${r.component?.type || "earning"}`}>
                          {r.component?.type === "earning" ? "Earning" : "Deduction"}
                        </span>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{r.calculationType}</td>
                      <td>
                        {r.calculationType === "percentage" && (
                          <span>{r.value}% of {r.calculationBase || "Gross"}</span>
                        )}
                        {r.calculationType === "formula" && (
                          <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                            {r.formula}
                          </code>
                        )}
                        {r.calculationType === "manual" && (
                          <span>Fixed / ₹{r.value || 0}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!previewItem.components || previewItem.components.length === 0) && (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>
                  No components configured for this structure.
                </div>
              )}
            </div>

            <div className="ss-modal-footer">
              <button
                type="button"
                className="ss-btn-save"
                onClick={() => setPreviewItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
