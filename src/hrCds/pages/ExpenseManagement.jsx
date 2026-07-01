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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialTravelRequests = [
    { id: 1, from: 'Mumbai (BOM)', to: 'Pune (PNQ)', oneWay: true, duration: '20-Jan-2025', requestDate: '05-Dec-2024', reason: 'Conference', approvalStatus: 'Approved', requestStatus: 'Auto Approved' }
];
const initialExpenses = [
    { id: 1, type: 'Meal', amount: 500, date: '2025-01-15', status: 'Approved', description: 'Lunch with client' }
];
const initialAdvances = [
    { id: 1, type: 'Travel', amount: 2000, date: '2025-01-10', status: 'Pending', description: 'Advance for business trip' }
];

const ExpenseManagement = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [travelStatus, setTravelStatus] = useState('All Requests');
    const [travelRequests, setTravelRequests] = useState(initialTravelRequests);
    const [expenses, setExpenses] = useState(initialExpenses);
    const [advances, setAdvances] = useState(initialAdvances);
    
    const [openDialog, setOpenDialog] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});
    
    const [dialogType, setDialogType] = useState('travel');

    
    const userInfo = {
        name: 'Ankit Rai',
        level: 'Manager Level',
        division: 'Division A - GAN001'
    };

    
    const handleOpenDialog = (type, item = null) => {
        setDialogType(type);
        setEditId(item ? item.id : null);
        if (item) {
            setForm(item);
        } else if (type === 'travel') {
            setForm({ from: '', to: '', oneWay: false, duration: '', requestDate: '', reason: '', approvalStatus: 'Pending', requestStatus: 'Pending' });
        } else if (type === 'expense') {
            setForm({ type: '', amount: '', date: '', status: 'Pending', description: '' });
        } else if (type === 'advance') {
            setForm({ type: '', amount: '', date: '', status: 'Pending', description: '' });
        }
        setOpenDialog(true);
    };
    const handleCloseDialog = () => setOpenDialog(false);
    const handleFormChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleSubmit = e => {
        e.preventDefault();
        if (dialogType === 'travel') {
            if (editId) {
                setTravelRequests(travelRequests.map(r => r.id === editId ? { ...form, id: editId } : r));
            } else {
                setTravelRequests([{ ...form, id: Date.now() }, ...travelRequests]);
            }
        } else if (dialogType === 'expense') {
            if (editId) {
                setExpenses(expenses.map(r => r.id === editId ? { ...form, id: editId } : r));
            } else {
                setExpenses([{ ...form, id: Date.now() }, ...expenses]);
            }
        } else if (dialogType === 'advance') {
            if (editId) {
                setAdvances(advances.map(r => r.id === editId ? { ...form, id: editId } : r));
            } else {
                setAdvances([{ ...form, id: Date.now() }, ...advances]);
            }
        }
        setOpenDialog(false);
    };
    const handleDelete = (type, id) => {
        if (type === 'travel') setTravelRequests(travelRequests.filter(r => r.id !== id));
        if (type === 'expense') setExpenses(expenses.filter(r => r.id !== id));
        if (type === 'advance') setAdvances(advances.filter(r => r.id !== id));
    };

    
    const filteredTravelRequests = travelRequests.filter(r => travelStatus === 'All Requests' || r.approvalStatus === travelStatus);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>Expense Management</Typography>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 2 }}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="Travel" />
                <Tab label="Expenses" />
                <Tab label="Advances" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">Travel</Typography>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1">{userInfo.name}</Typography>
                                <Typography variant="body2">{userInfo.level}</Typography>
                                <Typography variant="body2">{userInfo.division}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography>Travel Status:</Typography>
                                <Select
                                    value={travelStatus}
                                    onChange={e => setTravelStatus(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="All Requests">All Requests</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Approved">Approved</MenuItem>
                                    <MenuItem value="Rejected">Rejected</MenuItem>
                                </Select>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Button variant="outlined">ASSIGN DELEGATE</Button>
                            <Button variant="contained" onClick={() => handleOpenDialog('travel')}>+ New Travel</Button>
                        </Box>
                        <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>From</TableCell>
                                        <TableCell>To</TableCell>
                                        <TableCell>Travel Duration</TableCell>
                                        <TableCell>Request Date</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Approval Status</TableCell>
                                        <TableCell>Request Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTravelRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>{request.from}</TableCell>
                                            <TableCell>
                                                {request.to}
                                                {request.oneWay && <Typography variant="caption" color="text.secondary"> (one-way)</Typography>}
                                            </TableCell>
                                            <TableCell>{request.duration}</TableCell>
                                            <TableCell>{request.requestDate}</TableCell>
                                            <TableCell>{request.reason}</TableCell>
                                            <TableCell>
                                                <Typography color={request.approvalStatus === 'Approved' ? 'success.main' : request.approvalStatus === 'Rejected' ? 'error.main' : 'warning.main'}>
                                                    {request.approvalStatus}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography color={request.requestStatus === 'Auto Approved' ? 'success.main' : 'warning.main'}>
                                                    {request.requestStatus}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton color="primary" onClick={() => handleOpenDialog('travel', request)}><EditIcon /></IconButton>
                                                <IconButton color="error" onClick={() => handleDelete('travel', request.id)}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
                {activeTab === 1 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">Expenses</Typography>
                        <Button variant="contained" sx={{ mb: 2 }} onClick={() => handleOpenDialog('expense')}>+ New Expense</Button>
                        <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {expenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{expense.type}</TableCell>
                                            <TableCell>{expense.amount}</TableCell>
                                            <TableCell>{expense.date}</TableCell>
                                            <TableCell>{expense.status}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell>
                                                <IconButton color="primary" onClick={() => handleOpenDialog('expense', expense)}><EditIcon /></IconButton>
                                                <IconButton color="error" onClick={() => handleDelete('expense', expense.id)}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
                {activeTab === 2 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">Advances</Typography>
                        <Button variant="contained" sx={{ mb: 2 }} onClick={() => handleOpenDialog('advance')}>+ New Advance</Button>
                        <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {advances.map((advance) => (
                                        <TableRow key={advance.id}>
                                            <TableCell>{advance.type}</TableCell>
                                            <TableCell>{advance.amount}</TableCell>
                                            <TableCell>{advance.date}</TableCell>
                                            <TableCell>{advance.status}</TableCell>
                                            <TableCell>{advance.description}</TableCell>
                                            <TableCell>
                                                <IconButton color="primary" onClick={() => handleOpenDialog('advance', advance)}><EditIcon /></IconButton>
                                                <IconButton color="error" onClick={() => handleDelete('advance', advance.id)}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Box>
            
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{editId ? 'Edit' : 'Add'} {dialogType === 'travel' ? 'Travel' : dialogType === 'expense' ? 'Expense' : 'Advance'}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dialogType === 'travel' && (
                            <>
                                <TextField label="From" name="from" value={form.from} onChange={handleFormChange} required fullWidth />
                                <TextField label="To" name="to" value={form.to} onChange={handleFormChange} required fullWidth />
                                <TextField label="Travel Duration" name="duration" value={form.duration} onChange={handleFormChange} required fullWidth />
                                <TextField label="Request Date" name="requestDate" value={form.requestDate} onChange={handleFormChange} required fullWidth />
                                <TextField label="Reason" name="reason" value={form.reason} onChange={handleFormChange} required fullWidth />
                                <Select label="Approval Status" name="approvalStatus" value={form.approvalStatus} onChange={handleFormChange} fullWidth>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Approved">Approved</MenuItem>
                                    <MenuItem value="Rejected">Rejected</MenuItem>
                                </Select>
                                <Select label="Request Status" name="requestStatus" value={form.requestStatus} onChange={handleFormChange} fullWidth>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Auto Approved">Auto Approved</MenuItem>
                                </Select>
                            </>
                        )}
                        {dialogType !== 'travel' && (
                            <>
                                <TextField label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth />
                                <TextField label="Amount" name="amount" type="number" value={form.amount} onChange={handleFormChange} required fullWidth />
                                <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} required fullWidth />
                                <Select label="Status" name="status" value={form.status} onChange={handleFormChange} fullWidth>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Approved">Approved</MenuItem>
                                    <MenuItem value="Rejected">Rejected</MenuItem>
                                </Select>
                                <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} fullWidth />
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained">{editId ? 'Update' : 'Add'}</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default ExpenseManagement;