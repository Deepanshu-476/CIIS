import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './Holidays.css';
import API_URL, { API_URL_IMG } from "../config"; 

const Holidays = () => {
    
    const [holidays, setHolidays] = useState([]);
    const [filteredHolidays, setFilteredHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        month: '',
        description: ''
    });
    
    
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    
    const getCurrentMonth = () => {
        const date = new Date();
        return months[date.getMonth()];
    };

    const formatInputDate = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseExcelDate = (value) => {
        if (!value) return null;

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        if (typeof value === 'number') {
            const parsed = XLSX.SSF.parse_date_code(value);
            if (!parsed) return null;
            return new Date(parsed.y, parsed.m - 1, parsed.d);
        }

        const text = String(value).trim();
        if (!text) return null;

        const slashDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
        if (slashDate) {
            const day = Number(slashDate[1]);
            const month = Number(slashDate[2]);
            const rawYear = Number(slashDate[3]);
            const year = rawYear < 100 ? 2000 + rawYear : rawYear;
            const date = new Date(year, month - 1, day);
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const date = new Date(text);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const getCellValue = (row, keys) => {
        const normalizedRow = Object.entries(row).reduce((acc, [key, value]) => {
            acc[String(key).trim().toLowerCase()] = value;
            return acc;
        }, {});

        for (const key of keys) {
            const value = normalizedRow[key.toLowerCase()];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                return value;
            }
        }
        return '';
    };

    const handleExcelUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            setUploadingExcel(true);
            setError('');
            setSuccess('');

            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            if (!rows.length) {
                setError('The Excel file is empty. Please upload valid holiday rows.');
                return;
            }

            const parsedHolidays = rows
                .map((row) => {
                    const title = String(getCellValue(row, ['title', 'holiday', 'holiday title', 'name', 'occasion'])).trim();
                    const rawDate = getCellValue(row, ['date', 'holiday date', 'day']);
                    const description = String(getCellValue(row, ['description', 'details', 'remark', 'remarks'])).trim();
                    const date = parseExcelDate(rawDate);
                    const formattedDate = formatInputDate(date);

                    if (!title || !formattedDate) return null;

                    return {
                        title,
                        date: formattedDate,
                        month: months[date.getMonth()],
                        description,
                    };
                })
                .filter(Boolean);

            if (!parsedHolidays.length) {
                setError('No valid holiday data found in Excel. Columns Title/Holiday/Name and Date are required.');
                return;
            }

            const existingKeys = new Set(
                holidays.map(holiday => `${holiday.title?.trim().toLowerCase()}|${formatInputDate(new Date(holiday.date))}`)
            );
            const uniqueHolidays = parsedHolidays.filter(holiday => {
                const key = `${holiday.title.toLowerCase()}|${holiday.date}`;
                if (existingKeys.has(key)) return false;
                existingKeys.add(key);
                return true;
            });

            if (!uniqueHolidays.length) {
                setError('All holidays in the Excel file are already added.');
                return;
            }

            const token = localStorage.getItem('token');
            let added = 0;
            let skipped = parsedHolidays.length - uniqueHolidays.length;

            for (const holiday of uniqueHolidays) {
                try {
                    const response = await axios.post(`${API_URL}/holidays/add`, holiday, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data?.success) added += 1;
                } catch (err) {
                    if (err.response?.status === 409) {
                        skipped += 1;
                    } else {
                        throw err;
                    }
                }
            }

            await fetchHolidays();
            setSuccess(`${added} holidays added from Excel${skipped ? `, ${skipped} duplicate/invalid rows skipped` : ''}.`);
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Excel upload error:', err);
            setError(err.response?.data?.message || 'An error occurred while uploading the Excel file.');
        } finally {
            setUploadingExcel(false);
        }
    };

    
    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            
            let url = `${API_URL}/holidays`; 
            if (selectedMonth) {
                url += `?month=${selectedMonth}`;
            }
            
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setHolidays(response.data.holidays);
                setFilteredHolidays(response.data.holidays);
            }
            setError('');
        } catch (err) {
            console.error('Error fetching holidays:', err);
           setError('Error fetching holidays');
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        fetchHolidays();
    }, [selectedMonth]); 

    
    useEffect(() => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        const filtered = holidays.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            const holidayYear = String(holidayDate.getFullYear());
            const holidayType = getHolidayType(holiday);
            const matchesSearch = !cleanSearch ||
                holiday.title.toLowerCase().includes(cleanSearch) ||
                holiday.description?.toLowerCase().includes(cleanSearch);
            const matchesYear = !selectedYear || holidayYear === selectedYear;
            const matchesType = !selectedType || holidayType === selectedType;
            return matchesSearch && matchesYear && matchesType;
        });
        setFilteredHolidays(filtered);
    }, [searchTerm, holidays, selectedYear, selectedType]);

    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        
        if (name === 'date' && value) {
            const date = new Date(value);
            const monthName = months[date.getMonth()];
            setFormData(prev => ({
                ...prev,
                month: monthName
            }));
        }
    };

    
    const resetForm = () => {
        setFormData({
            title: '',
            date: '',
            month: '',
            description: ''
        });
        setEditingId(null);
        setShowForm(false);
        setError('');
        setSuccess('');
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            
            if (!formData.title || !formData.date || !formData.month) {
               setError('Title, date and month are required');
                return;
            }
            
            let response;
            
            if (editingId) {
                
                response = await axios.put(`${API_URL}/holidays/${editingId}`, formData, { 
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Holiday updated successfully!');
            } else {
                
                response = await axios.post(`${API_URL}/holidays/add`, formData, { 
                    headers: { Authorization: `Bearer ${token}` }
                });
             setSuccess('Holiday added successfully!');
            }
            
            if (response.data.success) {
                resetForm();
                fetchHolidays();
                
                
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Submit error:', err);
            if (err.response?.status === 409) {
                setError('Ye holiday already exists is company me!');
            } else {
                setError(err.response?.data?.message || 'Something went wrong');
            }
        }
    };

    
    const handleEdit = (holiday) => {
        
        const formattedDate = new Date(holiday.date).toISOString().split('T')[0];
        
        setFormData({
            title: holiday.title,
            date: formattedDate,
            month: holiday.month,
            description: holiday.description || ''
        });
        setEditingId(holiday._id);
        setShowForm(true);
        setError('');
        
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    
    const handleDelete = async (id, title) => {
        if (!window.confirm(`Do you want to delete "${title}"?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/holidays/${id}`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
               setSuccess('Holiday deleted successfully!');
                fetchHolidays();
                
                
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.message || 'Error deleting holiday');
        }
    };

    
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    const formatTableDate = (dateString) => {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    const getHolidayType = (holiday) => {
        const text = `${holiday.title || ''} ${holiday.description || ''}`.toLowerCase();
        return text.includes('optional') ? 'Optional Holiday' : 'Public Holiday';
    };

    const getHolidayYears = () => {
        const years = holidays
            .map(holiday => new Date(holiday.date).getFullYear())
            .filter(year => !Number.isNaN(year));
        return [...new Set([new Date().getFullYear(), ...years])].sort((a, b) => b - a);
    };

    const currentYear = new Date().getFullYear();
    const yearHolidays = holidays.filter(holiday => new Date(holiday.date).getFullYear() === Number(selectedYear || currentYear));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingCount = holidays.filter(holiday => new Date(holiday.date) >= today).length;
    const optionalCount = holidays.filter(holiday => getHolidayType(holiday) === 'Optional Holiday').length;

    
    return (
        <div className="holidays-container">
            
            <div className="holidays-header">
                <h1>Holiday Management</h1>
                <div className="holiday-breadcrumb">
                    <span>Dashboard</span>
                    <span>Holiday Management</span>
                </div>
                <label className={`excel-upload-btn ${uploadingExcel ? 'disabled' : ''}`}>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleExcelUpload}
                        disabled={uploadingExcel}
                    />
                    {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
                </label>
                <button 
                    className="add-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? '✖ Cancel' : '➕ Add Holiday'}
                </button>
            </div>

            <div className="holiday-summary-grid">
                <div className="holiday-summary-card blue">
                    <span className="holiday-summary-icon">Cal</span>
                    <div>
                        <strong>{holidays.length}</strong>
                        <p>Total Holidays</p>
                        <small>All Time</small>
                    </div>
                </div>
                <div className="holiday-summary-card green">
                    <span className="holiday-summary-icon">Up</span>
                    <div>
                        <strong>{upcomingCount}</strong>
                        <p>Upcoming Holidays</p>
                        <small>This Year</small>
                    </div>
                </div>
                <div className="holiday-summary-card orange">
                    <span className="holiday-summary-icon">Re</span>
                    <div>
                        <strong>{yearHolidays.length}</strong>
                        <p>Recurring Holidays</p>
                        <small>Every Year</small>
                    </div>
                </div>
                <div className="holiday-summary-card purple">
                    <span className="holiday-summary-icon">Dep</span>
                    <div>
                        <strong>{optionalCount}</strong>
                        <p>Optional Holidays</p>
                        <small>Configured</small>
                    </div>
                </div>
            </div>

            
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            
            {showForm && (
                <div className="holiday-form-container">
                    <h2>{editingId ? '✏️ Edit Holiday' : '➕ Add New Holiday'}</h2>
                    <form onSubmit={handleSubmit} className="holiday-form">
                        <div className="form-group">
                            <label>Holiday Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Diwali, Holi, Christmas..."
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Month *</label>
                                <select
                                    name="month"
                                    value={formData.month}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Month</option>
                                    {months.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Add some details about the holiday..."
                                rows="3"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-btn">
                                {editingId ? 'Update Holiday' : 'Add Holiday'}
                            </button>
                            <button type="button" className="cancel-btn" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <section className="holiday-table-card">
                <div className="holiday-table-header">
                    <h2>Holiday List</h2>
                    <div className="holiday-toolbar">
                        <select
                            value={selectedYear}
                            onChange={(event) => setSelectedYear(event.target.value)}
                            className="holiday-control"
                        >
                            <option value="">All Years</option>
                            {getHolidayYears().map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <select
                            value={selectedType}
                            onChange={(event) => setSelectedType(event.target.value)}
                            className="holiday-control"
                        >
                            <option value="">All Types</option>
                            <option value="Public Holiday">Public Holiday</option>
                            <option value="Optional Holiday">Optional Holiday</option>
                        </select>
                        <label className={`holiday-table-upload ${uploadingExcel ? 'disabled' : ''}`}>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleExcelUpload}
                                disabled={uploadingExcel}
                            />
                            {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
                        </label>
                        <button
                            className="holiday-add-table-btn"
                            onClick={() => {
                                resetForm();
                                setShowForm(!showForm);
                            }}
                        >
                            + Add Holiday
                        </button>
                    </div>
                </div>

                <div className="holiday-table-search">
                    <input
                        type="text"
                        placeholder="Search holidays..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="holiday-table-empty">Loading holidays...</div>
                ) : filteredHolidays.length === 0 ? (
                    <div className="holiday-table-empty">
                        <p>No holidays found</p>
                        <button onClick={() => setShowForm(true)} className="holiday-add-table-btn">
                            Add First Holiday
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="holiday-table-wrap">
                            <table className="holiday-management-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Holiday Name</th>
                                        <th>Date</th>
                                        <th>Day</th>
                                        <th>Type</th>
                                        <th>Repeat</th>
                                        <th>Departments</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHolidays.map((holiday, index) => {
                                        const holidayType = getHolidayType(holiday);
                                        const date = new Date(holiday.date);
                                        return (
                                            <tr key={holiday._id}>
                                                <td>{index + 1}</td>
                                                <td className="holiday-name-cell">{holiday.title}</td>
                                                <td>{formatTableDate(holiday.date)}</td>
                                                <td>{date.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                                                <td>
                                                    <span className={`holiday-type-pill ${holidayType === 'Optional Holiday' ? 'optional' : 'public'}`}>
                                                        {holidayType}
                                                    </span>
                                                </td>
                                                <td><span className="holiday-repeat-pill">Yes</span></td>
                                                <td>All Departments</td>
                                                <td>
                                                    <div className="holiday-action-buttons">
                                                        <button className="holiday-icon-action edit" onClick={() => handleEdit(holiday)}>Edit</button>
                                                        <button className="holiday-icon-action delete" onClick={() => handleDelete(holiday._id, holiday.title)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="holiday-table-footer">
                            <span>Showing 1 to {filteredHolidays.length} of {holidays.length} entries</span>
                            <div className="holiday-pagination">
                                <button disabled>&lt;</button>
                                <button className="active">1</button>
                                <button>2</button>
                                <button>3</button>
                                <button>&gt;</button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            
            <div className="filters-section">
                <div className="filter-group">
                    <label>Filter by Month:</label>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="month-filter"
                    >
                        <option value="">All Months</option>
                        {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </div>

                <div className="search-group">
                    <input
                        type="text"
                        placeholder="🔍 Search holidays..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            
            <div className="holidays-list">
                {loading ? (
                    <div className="loading">Loading holidays...</div>
                ) : filteredHolidays.length === 0 ? (
                    <div className="no-data">
                        <p>😔 No holidays found</p>
                        <button onClick={() => setShowForm(true)} className="add-first-btn">
                            Add First Holiday
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="holidays-count">
                            Total Holidays: {filteredHolidays.length}
                        </div>
                        
                    <div className="holidays-grid">
    {filteredHolidays.map(holiday => (
        <div key={holiday._id} className="holiday-card">
            
            <div className="holiday-card-header">
                <div className="header-left">
                    <h3>{holiday.title}</h3>
                    <span className="month-badge">{holiday.month}</span>
                </div>
                <div className="header-actions">
                    
                </div>
            </div>
            
            
            <div className="holiday-card-body">
                
                <div className="holiday-date">
                    <span className="date-text">{formatDate(holiday.date)}</span>
                </div>
                
                
                {holiday.description && (
                    <div className="holiday-description">
                        <span className="description-label">About this holiday</span>
                        <p>{holiday.description}</p>
                    </div>
                )}
                
                
                <div className="holiday-meta">
                    <div className="meta-item">
                        <span className="meta-icon">👤</span>
                        <span className="meta-text">Added by: {holiday.createdBy?.name || 'Unknown'}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-icon">📆</span>
                        <span className="meta-text">{new Date(holiday.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}</span>
                    </div>
                </div>
            </div>
            
            
            <div className="holiday-card-footer">
                <button 
                    className="edit-btn"
                    onClick={() => handleEdit(holiday)}
                >
                    <span className="btn-icon">✏️</span>
                    <span className="btn-text">Edit</span>
                </button>
                <button 
                    className="delete-btn"
                    onClick={() => handleDelete(holiday._id, holiday.title)}
                >
                    <span className="btn-icon">🗑️</span>
                    <span className="btn-text">Delete</span>
                </button>
            </div>
            
            
            <div className="card-accent"></div>
        </div>
    ))}
</div>
                    </>
                )}
            </div>

            
            <div className="holidays-stats">
                <h3>📊 Quick Stats</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-value">{holidays.length}</span>
                        <span className="stat-label">Total Holidays</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">
                            {months[new Date().getMonth()]}
                        </span>
                        <span className="stat-label">Current Month</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">
                            {holidays.filter(h => h.month === getCurrentMonth()).length}
                        </span>
                        <span className="stat-label">This Month</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Holidays;
