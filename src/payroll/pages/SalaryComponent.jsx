import React, { useEffect, useMemo, useState } from "react";
import {
  FiChevronRight,
  FiEdit2,
  FiFileText,
  FiHash,
  FiPlus,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX
} from "react-icons/fi";
import { LuArrowUpDown } from "react-icons/lu";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/SalaryComponent.css";

const emptyForm = {
  name: "",
  code: "",
  type: "earning",
  sortOrder: "",
  status: "active",
  proRata: true,
  taxable: true,
  grossSalary: true,
  pfWage: false,
  esiWage: false,
  ptWage: false,
};

const KNOWN_CODES = {
  "HOUSE RENT ALLOWANCE": "HRA",
  "HRA": "HRA",
  "BASIC SALARY": "BASIC",
  "BASIC": "BASIC",
  "SPECIAL ALLOWANCE": "SPL",
  "SPECIAL": "SPL",
  "PROVIDENT FUND": "PF",
  "EMPLOYEE PROVIDENT FUND": "EPF",
  "EMPLOYEE STATE INSURANCE": "ESI",
  "DEARNESS ALLOWANCE": "DA",
  "MEDICAL ALLOWANCE": "MED",
  "CONVEYANCE ALLOWANCE": "CONV",
  "PERFORMANCE BONUS": "BONUS",
  "BONUS": "BONUS",
  "PROFESSIONAL TAX": "PT",
  "MANAGEMENT ALLOWANCE": "MANAGEMENT",
  "OTHER ALLOWANCE": "OTHER",
  "FLEXIBLE BENEFIT ALLOWANCE": "FBA",
  "UNIFORM ALLOWANCE": "UNIFORM",
  "TRAVEL ALLOWANCE": "TRAVEL",
  "LEAVE TRAVEL ALLOWANCE": "LTA",
  "OVERTIME": "OT",
  "OVERTIME ALLOWANCE": "OT"
};

const previewCode = (name) => {
  const clean = String(name || "").trim().toUpperCase();
  if (!clean) return "";
  if (KNOWN_CODES[clean]) return KNOWN_CODES[clean];

  const words = clean.match(/[A-Z0-9]+/g) || [];
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 10);

  return words.map(w => w[0]).join("").slice(0, 10);
};

export default function SalaryComponent() {
  const [components, setComponents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadComponents = async () => {
    try {
      const response = await axiosInstance.get("/salary-components");
      const list = response.data?.components;
      if (Array.isArray(list) && list.length > 0) {
        setComponents(list);
      } else {
        setComponents([]);
      }
    } catch (error) {
      console.error("Unable to load salary components", error);
      setComponents([]);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  const updateForm = (key, value) => {
    setForm(current => {
      const next = { ...current, [key]: value };
      if (key === "name" && !editingId) {
        next.code = previewCode(value);
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setMessage(null);
  };

  const saveComponent = async (event) => {
    event.preventDefault();
    const name = form.name.trim();

    if (!name || !form.sortOrder) {
      return setMessage({
        type: "error",
        text: "Component name and sort order are required."
      });
    }

    const record = {
      ...form,
      name,
      code: (form.code || previewCode(name)).trim().toUpperCase(),
      sortOrder: Number(form.sortOrder)
    };

    setSaving(true);
    try {
      let response;
      if (editingId) {
        response = await axiosInstance.put(`/salary-components/${editingId}`, record);
      } else {
        response = await axiosInstance.post("/salary-components", record);
      }

      const saved = response.data?.component;
      setComponents(current =>
        editingId
          ? current.map(item => (item._id === editingId ? saved : item))
          : [...current, saved]
      );

      setMessage({
        type: "success",
        text: response.data?.message || "Salary component saved successfully."
      });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to save salary component."
      });
    } finally {
      setSaving(false);
    }
  };

  const editComponent = (item) => {
    setEditingId(item._id);
    setForm({
      ...emptyForm,
      ...item,
      sortOrder: String(item.sortOrder)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteComponent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salary component?")) return;
    try {
      const response = await axiosInstance.delete(`/salary-components/${id}`);
      setComponents(current => current.filter(item => item._id !== id));
      setMessage({
        type: "success",
        text: response.data?.message || "Salary component deleted successfully."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to delete salary component."
      });
    }
  };

  // Filter and sort components
  const filteredList = useMemo(() => {
    return components
      .filter(item =>
        `${item.name} ${item.code} ${item.type}`.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
  }, [components, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredList.length / entriesPerPage) || 1;
  const paginatedComponents = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredList.slice(start, start + entriesPerPage);
  }, [filteredList, currentPage, entriesPerPage]);

  return (
    <main className="scm-container">
      {/* Alert Message */}
      {message && (
        <div className={`scm-alert ${message.type}`}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Top Card: Add / Edit Salary Component Form */}
      <section className="scm-card">
        <div className="scm-card-title">
          <h2>{editingId ? "Edit Salary Component" : "Add Salary Component"}</h2>
        </div>

        <form onSubmit={saveComponent}>
          {/* Row 1: 4 columns */}
          <div className="scm-grid-4">
            {/* Component Name */}
            <div className="scm-form-group">
              <label>
                Component Name <span className="req">*</span>
              </label>
              <div className="scm-input-wrap">
                <FiFileText className="scm-input-icon" />
                <input
                  type="text"
                  className="scm-input"
                  placeholder="Enter component name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Component Code */}
            <div className="scm-form-group">
              <label>
                Component Code
              </label>
              <div className="scm-input-wrap">
                <FiHash className="scm-input-icon" />
                <input
                  type="text"
                  className="scm-input"
                  placeholder="e.g. SPL"
                  value={form.code !== undefined ? form.code : previewCode(form.name)}
                  onChange={(e) => updateForm("code", e.target.value.toUpperCase())}
                  title="Auto-generated code. You can also edit manually."
                />
              </div>
            </div>

            {/* Component Type */}
            <div className="scm-form-group">
              <label>
                Component Type <span className="req">*</span>
              </label>
              <select
                className="scm-select"
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value)}
              >
                <option value="earning">Earning</option>
                <option value="deduction">Deduction</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="scm-form-group">
              <label>
                Sort Order <span className="req">*</span>
              </label>
              <div className="scm-input-wrap">
                <LuArrowUpDown className="scm-input-icon" />
                <input
                  type="number"
                  min="1"
                  className="scm-input"
                  placeholder="Enter sort order"
                  value={form.sortOrder}
                  onChange={(e) => updateForm("sortOrder", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Status + Horizontal Payroll Settings */}
          <div className="scm-row-2">
            {/* Status Select */}
            <div className="scm-status-box">
              <div className="scm-form-group">
                <label>
                  Status <span className="req">*</span>
                </label>
                <div className="scm-select-status">
                  <span className={`scm-status-dot ${form.status}`} />
                  <select
                    className="scm-select"
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payroll Settings Checkboxes */}
            <div className="scm-settings-box">
              <h4>Payroll Settings</h4>
              <div className="scm-checkbox-row">
                <label className="scm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.proRata}
                    onChange={(e) => updateForm("proRata", e.target.checked)}
                  />
                  <span>Apply Pro-rata (Attendance based)</span>
                </label>

                <label className="scm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.taxable}
                    onChange={(e) => updateForm("taxable", e.target.checked)}
                  />
                  <span>Is Taxable</span>
                </label>

                <label className="scm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.grossSalary}
                    onChange={(e) => updateForm("grossSalary", e.target.checked)}
                  />
                  <span>Include in Gross Salary</span>
                </label>

                <label className="scm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.pfWage}
                    onChange={(e) => updateForm("pfWage", e.target.checked)}
                  />
                  <span>Include in PF Wage</span>
                </label>

                <label className="scm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.esiWage}
                    onChange={(e) => updateForm("esiWage", e.target.checked)}
                  />
                  <span>Include in ESI Wage</span>
                </label>

                <label className="scm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.ptWage}
                    onChange={(e) => updateForm("ptWage", e.target.checked)}
                  />
                  <span>Include in PT Wage</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="scm-form-actions">
            <button type="button" className="scm-btn-reset" onClick={resetForm}>
              Reset
            </button>
            <button type="submit" className="scm-btn-save" disabled={saving}>
              <FiSave /> {saving ? "Saving..." : editingId ? "Update Component" : "Save Component"}
            </button>
          </div>
        </form>
      </section>

      {/* Bottom Card: Salary Component List */}
      <section className="scm-card">
        <div className="scm-card-title-plain" style={{ marginBottom: 18 }}>
          <h2>Salary Component List</h2>
        </div>

        {/* Toolbar: Show Entries + Search + Add Button */}
        <div className="scm-toolbar">
          <div className="scm-entries-select">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
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

          <div className="scm-toolbar-right">
            <div className="scm-search-wrap">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search component..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <button
              type="button"
              className="scm-btn-add"
              onClick={() => {
                resetForm();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <FiPlus /> Add Component
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="scm-table-wrap">
          <table className="scm-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>SL</th>
                <th>Component Code</th>
                <th>Component Name</th>
                <th>Type</th>
                <th>Taxable</th>
                <th>In Gross</th>
                <th>PF Wage</th>
                <th>ESI Wage</th>
                <th>PT Wage</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: 28, color: "#64748b" }}>
                    Loading salary components...
                  </td>
                </tr>
              ) : paginatedComponents.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: 28, color: "#64748b" }}>
                    No salary components found.
                  </td>
                </tr>
              ) : (
                paginatedComponents.map((item, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  const isDeduction = item.type === "deduction";
                  return (
                    <tr key={item._id}>
                      <td>{sl}</td>
                      <td className="scm-code-cell">{item.code}</td>
                      <td>{item.name}</td>
                      <td>
                        <span className={`scm-badge ${item.type}`}>
                          {item.type === "earning" ? "Earning" : "Deduction"}
                        </span>
                      </td>
                      <td>
                        <span className={item.taxable ? "scm-val-yes" : "scm-val-no"}>
                          {item.taxable ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={item.grossSalary ? "scm-val-yes" : "scm-val-no"}>
                          {item.grossSalary ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        {isDeduction && !item.pfWage ? (
                          <span className="scm-val-dash">-</span>
                        ) : (
                          <span className={item.pfWage ? "scm-val-yes" : "scm-val-no"}>
                            {item.pfWage ? "Yes" : "No"}
                          </span>
                        )}
                      </td>
                      <td>
                        {isDeduction && !item.esiWage ? (
                          <span className="scm-val-dash">-</span>
                        ) : (
                          <span className={item.esiWage ? "scm-val-yes" : "scm-val-no"}>
                            {item.esiWage ? "Yes" : "No"}
                          </span>
                        )}
                      </td>
                      <td>
                        {isDeduction && !item.ptWage ? (
                          <span className="scm-val-dash">-</span>
                        ) : (
                          <span className={item.ptWage ? "scm-val-yes" : "scm-val-no"}>
                            {item.ptWage ? "Yes" : "No"}
                          </span>
                        )}
                      </td>
                      <td>{item.sortOrder}</td>
                      <td>
                        <span className={`scm-badge ${item.status}`}>
                          {item.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="scm-actions" style={{ justifyContent: "center" }}>
                          <button
                            type="button"
                            className="scm-action-btn edit"
                            title="Edit Component"
                            onClick={() => editComponent(item)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="scm-action-btn delete"
                            title="Delete Component"
                            onClick={() => deleteComponent(item._id)}
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
        <div className="scm-table-footer">
          <div>
            Showing{" "}
            {filteredList.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{" "}
            {Math.min(currentPage * entriesPerPage, filteredList.length)} of {filteredList.length} entries
          </div>

          <div className="scm-pagination">
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
    </main>
  );
}
