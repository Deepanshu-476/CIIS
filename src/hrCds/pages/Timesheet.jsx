import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const defaultHours = { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '', total: '' };

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; 
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}
function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function getWeekDays(monday) {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            key: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][i],
            date: d,
            label: `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${d.getDate()}`
        };
    });
}

const Timesheet = () => {
    const [activeTab, setActiveTab] = useState(0);
    
    const [currentMonday, setCurrentMonday] = useState(getMonday(new Date('2025-02-10'))); 
    
    const [weekData, setWeekData] = useState({
        [currentMonday.toISOString()]: [
            { client: 'Peoplesense', job: 'Test Job Group...', hours: { ...defaultHours }, isEditing: false },
            { client: 'Qandle', job: 'Test Job Group...', hours: { ...defaultHours }, isEditing: false }
        ]
    });
    const [newEntry, setNewEntry] = useState({ client: '', job: '', hours: { ...defaultHours } });
    const [editCache, setEditCache] = useState({});

    const weekDays = getWeekDays(currentMonday);
    const dateRange = `${formatDate(weekDays[0].date)} - ${formatDate(weekDays[6].date)}`;
    const weekKey = currentMonday.toISOString();
    const timesheetData = weekData[weekKey] || [];

    
    const calcTotal = (hours) => {
        let totalMins = 0;
        weekDays.forEach(day => {
            const val = hours[day.key];
            if (!val) return;
            const [h, m] = val.split('h').map(s => s.replace('m', '').trim());
            totalMins += (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
        });
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return `${h}h ${m}m`;
    };

    const getTotalHours = () => {
        let total = {};
        weekDays.forEach(day => { total[day.key] = 0; });
        total.total = 0;
        timesheetData.forEach(row => {
            weekDays.forEach(day => {
                const val = row.hours[day.key];
                if (!val) return;
                const [h, m] = val.split('h').map(s => s.replace('m', '').trim());
                total[day.key] += (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
            });
        });
        weekDays.forEach(day => {
            total.total += total[day.key];
            total[day.key] = `${Math.floor(total[day.key] / 60)}h ${total[day.key] % 60}m`;
        });
        total.total = `${Math.floor(total.total / 60)}h ${total.total % 60}m`;
        return total;
    };

    
    const handleAdd = () => {
        if (!newEntry.client || !newEntry.job) return;
        const entry = {
            ...newEntry,
            hours: { ...newEntry.hours, total: calcTotal(newEntry.hours) },
            isEditing: false
        };
        setWeekData(prev => ({
            ...prev,
            [weekKey]: [...(prev[weekKey] || []), entry]
        }));
        setNewEntry({ client: '', job: '', hours: { ...defaultHours } });
    };

    const handleEdit = (idx) => {
        setEditCache({ ...timesheetData[idx] });
        setWeekData(prev => ({
            ...prev,
            [weekKey]: prev[weekKey].map((row, i) => i === idx ? { ...row, isEditing: true } : row)
        }));
    };

    const handleCancel = (idx) => {
        setWeekData(prev => ({
            ...prev,
            [weekKey]: prev[weekKey].map((row, i) => i === idx ? { ...editCache, isEditing: false } : row)
        }));
        setEditCache({});
    };

    const handleSave = (idx) => {
        setWeekData(prev => ({
            ...prev,
            [weekKey]: prev[weekKey].map((row, i) => {
                if (i === idx) {
                    const updated = { ...row, hours: { ...row.hours, total: calcTotal(row.hours) }, isEditing: false };
                    return updated;
                }
                return row;
            })
        }));
        setEditCache({});
    };

    const handleDelete = (idx) => {
        setWeekData(prev => ({
            ...prev,
            [weekKey]: prev[weekKey].filter((_, i) => i !== idx)
        }));
    };

    const handleRowChange = (idx, field, value) => {
        setWeekData(prev => ({
            ...prev,
            [weekKey]: prev[weekKey].map((row, i) => i === idx ? { ...row, [field]: value } : row)
        }));
    };

    const handleHourChange = (idx, day, value) => {
        setWeekData(prev => ({
            ...prev,
            [weekKey]: prev[weekKey].map((row, i) => i === idx ? { ...row, hours: { ...row.hours, [day]: value } } : row)
        }));
    };

    const handleNewEntryChange = (field, value) => {
        setNewEntry({ ...newEntry, [field]: value });
    };

    const handleNewHourChange = (day, value) => {
        setNewEntry({ ...newEntry, hours: { ...newEntry.hours, [day]: value } });
    };

    const totalHours = getTotalHours();

    
    const handlePrevWeek = () => {
        const prev = new Date(currentMonday);
        prev.setDate(currentMonday.getDate() - 7);
        setCurrentMonday(getMonday(prev));
    };
    const handleNextWeek = () => {
        const next = new Date(currentMonday);
        next.setDate(currentMonday.getDate() + 7);
        setCurrentMonday(getMonday(next));
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>Timesheet</Typography>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 2 }}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="Employee Tracker" />
                <Tab label="Summary" />
            </Tabs>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant="outlined" onClick={handlePrevWeek}>&lt;</Button>
                <Typography variant="subtitle1">{dateRange}</Typography>
                <Button variant="outlined" onClick={handleNextWeek}>&gt;</Button>
            </Box>
            <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Client</TableCell>
                            <TableCell>Job</TableCell>
                            {weekDays.map(day => (
                                <TableCell key={day.key}>{day.label}</TableCell>
                            ))}
                            <TableCell>Total</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        
                        <TableRow>
                            <TableCell>
                                <TextField size="small" value={newEntry.client} onChange={e => handleNewEntryChange('client', e.target.value)} placeholder="Client" />
                            </TableCell>
                            <TableCell>
                                <TextField size="small" value={newEntry.job} onChange={e => handleNewEntryChange('job', e.target.value)} placeholder="Job" />
                            </TableCell>
                            {weekDays.map(day => (
                                <TableCell key={day.key}>
                                    <TextField size="small" value={newEntry.hours[day.key]} onChange={e => handleNewHourChange(day.key, e.target.value)} placeholder="0h 0m" />
                                </TableCell>
                            ))}
                            <TableCell>{calcTotal(newEntry.hours)}</TableCell>
                            <TableCell>
                                <Button variant="contained" size="small" onClick={handleAdd}>Add</Button>
                            </TableCell>
                        </TableRow>
                        
                        {timesheetData.map((row, index) => (
                            <TableRow key={index}>
                                {row.isEditing ? (
                                    <>
                                        <TableCell>
                                            <TextField size="small" value={row.client} onChange={e => handleRowChange(index, 'client', e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField size="small" value={row.job} onChange={e => handleRowChange(index, 'job', e.target.value)} />
                                        </TableCell>
                                        {weekDays.map(day => (
                                            <TableCell key={day.key}>
                                                <TextField size="small" value={row.hours[day.key]} onChange={e => handleHourChange(index, day.key, e.target.value)} />
                                            </TableCell>
                                        ))}
                                        <TableCell>{calcTotal(row.hours)}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleSave(index)}><SaveIcon /></IconButton>
                                            <IconButton color="secondary" onClick={() => handleCancel(index)}><CancelIcon /></IconButton>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>{row.client}</TableCell>
                                        <TableCell>{row.job}</TableCell>
                                        {weekDays.map(day => (
                                            <TableCell key={day.key}>{row.hours[day.key]}</TableCell>
                                        ))}
                                        <TableCell>{row.hours.total}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleEdit(index)}><EditIcon /></IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(index)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                        
                        <TableRow sx={{ background: '#f5f5f5' }}>
                            <TableCell colSpan={2}><b>Total Task Hours</b></TableCell>
                            {weekDays.map(day => (
                                <TableCell key={day.key}>{totalHours[day.key]}</TableCell>
                            ))}
                            <TableCell>{totalHours.total}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ textAlign: 'right' }}>
                <Button variant="contained" color="primary">Submit Timesheet</Button>
            </Box>
        </Box>
    );
};

export default Timesheet;