import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Holidays.css';

const Holidays = () => {
    // ==================== STATES ====================
    const [holidays, setHolidays] = useState([]);
    const [filteredHolidays, setFilteredHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        month: '',
        description: ''
    });
    
    // Filter states
    const [selectedMonth, setSelectedMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Months array
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // ==================== GET CURRENT MONTH ====================
    const getCurrentMonth = () => {
        const date = new Date();
        return months[date.getMonth()];
    };

    // ==================== FETCH HOLIDAYS ====================
    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Build URL with month filter if selected
            let url = '/api/holidays';
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
            setError('Holidays fetch karne me problem hui');
        } finally {
            setLoading(false);
        }
    };

    // ==================== USE EFFECT ====================
    useEffect(() => {
        fetchHolidays();
    }, [selectedMonth]); // Refetch when month changes

    // ==================== SEARCH FILTER ====================
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredHolidays(holidays);
        } else {
            const filtered = holidays.filter(holiday =>
                holiday.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                holiday.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredHolidays(filtered);
        }
    }, [searchTerm, holidays]);

    // ==================== HANDLE INPUT CHANGE ====================
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Auto-set month based on date
        if (name === 'date' && value) {
            const date = new Date(value);
            const monthName = months[date.getMonth()];
            setFormData(prev => ({
                ...prev,
                month: monthName
            }));
        }
    };

    // ==================== RESET FORM ====================
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

    // ==================== HANDLE SUBMIT ====================
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            // Validation
            if (!formData.title || !formData.date || !formData.month) {
                setError('Title, date aur month dena zaroori hai');
                return;
            }
            
            let response;
            
            if (editingId) {
                // Update holiday
                response = await axios.put(`/api/holidays/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Holiday successfully update ho gaya!');
            } else {
                // Add holiday
                response = await axios.post('/api/holidays/add', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Holiday successfully add ho gaya!');
            }
            
            if (response.data.success) {
                resetForm();
                fetchHolidays();
                
                // Auto hide success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Submit error:', err);
            if (err.response?.status === 409) {
                setError('Ye holiday already exists is company me!');
            } else {
                setError(err.response?.data?.message || 'Kuch problem hui');
            }
        }
    };

    // ==================== EDIT HOLIDAY ====================
    const handleEdit = (holiday) => {
        // Format date for input (YYYY-MM-DD)
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
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ==================== DELETE HOLIDAY ====================
    const handleDelete = async (id, title) => {
        if (!window.confirm(`"${title}" ko delete karna chahte ho?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`/api/holidays/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSuccess('Holiday successfully delete ho gaya!');
                fetchHolidays();
                
                // Auto hide success message
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.message || 'Delete karne me problem hui');
        }
    };

    // ==================== FORMAT DATE ====================
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('hi-IN', options);
    };

    // ==================== RENDER ====================
    return (
        <div className="holidays-container">
            {/* Header */}
            <div className="holidays-header">
                <h1>🏖️ Holiday Management</h1>
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

            {/* Success/Error Messages */}
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Add/Edit Form */}
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
                                placeholder="Holiday ke baare mein kuch details..."
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

            {/* Filters */}
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

            {/* Holidays List */}
            <div className="holidays-list">
                {loading ? (
                    <div className="loading">Loading holidays...</div>
                ) : filteredHolidays.length === 0 ? (
                    <div className="no-data">
                        <p>😔 Koi holiday nahi mila</p>
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
                                        <h3>{holiday.title}</h3>
                                        <span className="month-badge">{holiday.month}</span>
                                    </div>
                                    
                                    <div className="holiday-card-body">
                                        <div className="holiday-date">
                                            📅 {formatDate(holiday.date)}
                                        </div>
                                        
                                        {holiday.description && (
                                            <div className="holiday-description">
                                                📝 {holiday.description}
                                            </div>
                                        )}
                                        
                                        <div className="holiday-meta">
                                            <small>
                                                Added by: {holiday.createdBy?.name || 'Unknown'}
                                            </small>
                                            <small>
                                                {new Date(holiday.createdAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                    
                                    <div className="holiday-card-footer">
                                        <button 
                                            className="edit-btn"
                                            onClick={() => handleEdit(holiday)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDelete(holiday._id, holiday.title)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Quick Stats */}
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