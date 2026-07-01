import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialCompensationData = {
    'Nov 2023': {
        totalCTC: 1250000,
        components: [
            { name: 'Basic Salary', amount: 500000, percentage: 40, color: '#3498db' },
            { name: 'HRA', amount: 375000, percentage: 30, color: '#2ecc71' },
            { name: 'Special Allowance', amount: 250000, percentage: 20, color: '#f1c40f' },
            { name: 'Bonus', amount: 75000, percentage: 6, color: '#9b59b6' },
            { name: 'PF Contribution', amount: 50000, percentage: 4, color: '#e74c3c' }
        ]
    },
    'Nov 2022': {
        totalCTC: 1100000,
        components: [
            { name: 'Basic Salary', amount: 440000, percentage: 40, color: '#3498db' },
            { name: 'HRA', amount: 330000, percentage: 30, color: '#2ecc71' },
            { name: 'Special Allowance', amount: 220000, percentage: 20, color: '#f1c40f' },
            { name: 'Bonus', amount: 66000, percentage: 6, color: '#9b59b6' },
            { name: 'PF Contribution', amount: 44000, percentage: 4, color: '#e74c3c' }
        ]
    },
    'Nov 2021': {
        totalCTC: 950000,
        components: [
            { name: 'Basic Salary', amount: 380000, percentage: 40, color: '#3498db' },
            { name: 'HRA', amount: 285000, percentage: 30, color: '#2ecc71' },
            { name: 'Special Allowance', amount: 190000, percentage: 20, color: '#f1c40f' },
            { name: 'Bonus', amount: 57000, percentage: 6, color: '#9b59b6' },
            { name: 'PF Contribution', amount: 38000, percentage: 4, color: '#e74c3c' }
        ]
    }
};

const MyCompensation = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [compensationData, setCompensationData] = useState(initialCompensationData);
    const [salaryRevision, setSalaryRevision] = useState('Nov 2023');
    const [showTaxProjection, setShowTaxProjection] = useState(false);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
    const [editRevision, setEditRevision] = useState(null);
    const [revisionForm, setRevisionForm] = useState({ year: '', totalCTC: 0 });
    const [componentDialogOpen, setComponentDialogOpen] = useState(false);
    const [editComponentIdx, setEditComponentIdx] = useState(null);
    const [componentForm, setComponentForm] = useState({ name: '', amount: 0, percentage: 0, color: '#3498db' });

    const currentYears = Object.keys(compensationData);
    const currentData = compensationData[salaryRevision];
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    
    const generatePieChartPaths = () => {
        let cumulativePercentage = 0;
        return currentData.components.map((component, index) => {
            const startX = 50 + 50 * Math.cos(2 * Math.PI * cumulativePercentage);
            const startY = 50 + 50 * Math.sin(2 * Math.PI * cumulativePercentage);
            cumulativePercentage += component.percentage / 100;
            const endX = 50 + 50 * Math.cos(2 * Math.PI * cumulativePercentage);
            const endY = 50 + 50 * Math.sin(2 * Math.PI * cumulativePercentage);
            const largeArcFlag = component.percentage > 50 ? 1 : 0;
            return {
                path: `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
                ...component
            };
        });
    };
    const pieChartPaths = generatePieChartPaths();

    
    const handleOpenRevisionDialog = (year = null) => {
        if (year) {
            setEditRevision(year);
            setRevisionForm({ year, totalCTC: compensationData[year].totalCTC });
        } else {
            setEditRevision(null);
            setRevisionForm({ year: '', totalCTC: 0 });
        }
        setRevisionDialogOpen(true);
    };
    const handleCloseRevisionDialog = () => setRevisionDialogOpen(false);
    const handleRevisionFormChange = (e) => {
        setRevisionForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const handleRevisionSubmit = (e) => {
        e.preventDefault();
        setCompensationData(prev => {
            const newData = { ...prev };
            if (editRevision) {
                newData[editRevision] = { ...newData[editRevision], totalCTC: Number(revisionForm.totalCTC) };
            } else {
                newData[revisionForm.year] = { totalCTC: Number(revisionForm.totalCTC), components: [] };
            }
            return newData;
        });
        setSalaryRevision(revisionForm.year);
        setRevisionDialogOpen(false);
    };
    const handleDeleteRevision = (year) => {
        setCompensationData(prev => {
            const newData = { ...prev };
            delete newData[year];
            return newData;
        });
        setSalaryRevision(Object.keys(compensationData)[0]);
    };

    
    const handleOpenComponentDialog = (idx = null) => {
        if (idx !== null) {
            setEditComponentIdx(idx);
            setComponentForm(currentData.components[idx]);
        } else {
            setEditComponentIdx(null);
            setComponentForm({ name: '', amount: 0, percentage: 0, color: '#3498db' });
        }
        setComponentDialogOpen(true);
    };
    const handleCloseComponentDialog = () => setComponentDialogOpen(false);
    const handleComponentFormChange = (e) => {
        setComponentForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const handleComponentSubmit = (e) => {
        e.preventDefault();
        setCompensationData(prev => {
            const newData = { ...prev };
            const comps = [...newData[salaryRevision].components];
            if (editComponentIdx !== null) {
                comps[editComponentIdx] = { ...componentForm, amount: Number(componentForm.amount), percentage: Number(componentForm.percentage) };
            } else {
                comps.push({ ...componentForm, amount: Number(componentForm.amount), percentage: Number(componentForm.percentage) });
            }
            newData[salaryRevision].components = comps;
            return newData;
        });
        setComponentDialogOpen(false);
    };
    const handleDeleteComponent = (idx) => {
        setCompensationData(prev => {
            const newData = { ...prev };
            newData[salaryRevision].components = newData[salaryRevision].components.filter((_, i) => i !== idx);
            return newData;
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Typography variant="h4">My Compensation</Typography>
                <Box sx={{ mt: { xs: 2, md: 0 } }}>
                    <Button variant="outlined" sx={{ mr: 1 }}>Download Payslip</Button>
                    <Button variant="outlined">Help</Button>
                </Box>
            </Box>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 2 }}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="Summary" />
                <Tab label="My Pay" />
                <Tab label="History" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">CTC Components</Typography>
                            <Box>
                                <Select
                                    value={salaryRevision}
                                    onChange={e => setSalaryRevision(e.target.value)}
                                    size="small"
                                    sx={{ mr: 2, minWidth: 120 }}
                                >
                                    {currentYears.map(year => (
                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                    ))}
                                </Select>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={() => handleOpenRevisionDialog()}>Add Revision</Button>
                                <Button variant="outlined" sx={{ mr: 1 }} onClick={() => handleOpenRevisionDialog(salaryRevision)}>Edit Revision</Button>
                                <Button variant="outlined" color="error" onClick={() => handleDeleteRevision(salaryRevision)}>Delete Revision</Button>
                                <Button
                                    variant={showTaxProjection ? 'contained' : 'outlined'}
                                    color="secondary"
                                    onClick={() => setShowTaxProjection(!showTaxProjection)}
                                >
                                    Tax Projection
                                </Button>
                            </Box>
                        </Box>
                        
                        <Dialog open={revisionDialogOpen} onClose={handleCloseRevisionDialog} maxWidth="xs" fullWidth>
                            <DialogTitle>{editRevision ? 'Edit Revision' : 'Add Revision'}</DialogTitle>
                            <form onSubmit={handleRevisionSubmit}>
                                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Year" name="year" value={revisionForm.year} onChange={handleRevisionFormChange} required fullWidth disabled={!!editRevision} />
                                    <TextField label="Total CTC" name="totalCTC" type="number" value={revisionForm.totalCTC} onChange={handleRevisionFormChange} required fullWidth />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleCloseRevisionDialog}>Cancel</Button>
                                    <Button type="submit" variant="contained">{editRevision ? 'Update' : 'Add'}</Button>
                                </DialogActions>
                            </form>
                        </Dialog>
                        {showTaxProjection && (
                            <Paper sx={{ p: 2, mb: 2, background: '#f9fbe7' }}>
                                <Typography variant="h6">Estimated Tax Liability for FY 2023-24</Typography>
                                <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                                    <Box>
                                        <Typography>Total Taxable Income: {formatCurrency(980000)}</Typography>
                                        <Typography>Tax Before Rebate: {formatCurrency(112500)}</Typography>
                                        <Typography>Rebate Under Section 87A: {formatCurrency(12500)}</Typography>
                                        <Typography fontWeight="bold">Total Tax Payable: {formatCurrency(100000)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1">Potential Savings</Typography>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                            <li>Invest ₹50,000 in ELSS to save ₹15,000 tax</li>
                                            <li>Pay ₹25,000 health insurance to save ₹7,500 tax</li>
                                        </ul>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6">Total Annual Cost to Company</Typography>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>{formatCurrency(currentData.totalCTC)}</Typography>
                            <Typography color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                ▲ 13.6% from last year
                            </Typography>
                        </Paper>
                        <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                            <Box>
                                <svg width="200" height="200" viewBox="0 0 100 100">
                                    {pieChartPaths.map((segment, index) => (
                                        <path
                                            key={index}
                                            d={segment.path}
                                            fill={segment.color}
                                            onMouseEnter={() => setHoveredSegment(index)}
                                            onMouseLeave={() => setHoveredSegment(null)}
                                            style={{ opacity: hoveredSegment === index ? 0.7 : 1, cursor: 'pointer' }}
                                        />
                                    ))}
                                    {hoveredSegment !== null && (
                                        <text
                                            x="50"
                                            y="50"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="6"
                                            fontWeight="bold"
                                        >
                                            {currentData.components[hoveredSegment].name}
                                            <tspan x="50" dy="1.2em">{currentData.components[hoveredSegment].percentage}%</tspan>
                                        </text>
                                    )}
                                </svg>
                            </Box>
                            <Box>
                                {currentData.components.map((component, index) => (
                                    <Box
                                        key={index}
                                        sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: hoveredSegment === index ? 700 : 400, opacity: hoveredSegment === index ? 1 : 0.7, cursor: 'pointer' }}
                                        onMouseEnter={() => setHoveredSegment(index)}
                                        onMouseLeave={() => setHoveredSegment(null)}
                                    >
                                        <Box sx={{ width: 16, height: 16, background: component.color, borderRadius: '50%', mr: 1 }} />
                                        <Typography sx={{ flex: 1 }}>{component.name}</Typography>
                                        <Typography sx={{ minWidth: 80 }}>{formatCurrency(component.amount)}</Typography>
                                        <Typography sx={{ minWidth: 40 }}>{component.percentage}%</Typography>
                                        <IconButton size="small" onClick={() => handleOpenComponentDialog(index)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteComponent(index)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                ))}
                                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => handleOpenComponentDialog()}>Add Component</Button>
                            </Box>
                        </Box>
                        
                        <Dialog open={componentDialogOpen} onClose={handleCloseComponentDialog} maxWidth="xs" fullWidth>
                            <DialogTitle>{editComponentIdx !== null ? 'Edit Component' : 'Add Component'}</DialogTitle>
                            <form onSubmit={handleComponentSubmit}>
                                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Name" name="name" value={componentForm.name} onChange={handleComponentFormChange} required fullWidth />
                                    <TextField label="Amount" name="amount" type="number" value={componentForm.amount} onChange={handleComponentFormChange} required fullWidth />
                                    <TextField label="Percentage" name="percentage" type="number" value={componentForm.percentage} onChange={handleComponentFormChange} required fullWidth />
                                    <TextField label="Color" name="color" value={componentForm.color} onChange={handleComponentFormChange} fullWidth />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleCloseComponentDialog}>Cancel</Button>
                                    <Button type="submit" variant="contained">{editComponentIdx !== null ? 'Update' : 'Add'}</Button>
                                </DialogActions>
                            </form>
                        </Dialog>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Gross Salary</Typography>
                                <Typography variant="h6">{formatCurrency(currentData.totalCTC / 12)}</Typography>
                                <Typography variant="body2" color="text.secondary">per month</Typography>
                            </Paper>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Take Home</Typography>
                                <Typography variant="h6">{formatCurrency(currentData.totalCTC * 0.65 / 12)}</Typography>
                                <Typography variant="body2" color="text.secondary">after deductions</Typography>
                            </Paper>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Tax Deducted</Typography>
                                <Typography variant="h6">{formatCurrency(currentData.totalCTC * 0.1 / 12)}</Typography>
                                <Typography variant="body2" color="text.secondary">monthly TDS</Typography>
                            </Paper>
                        </Box>
                    </Box>
                )}
                {activeTab === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Salary Details</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button variant="outlined">&lt;</Button>
                                <Typography>December 2023</Typography>
                                <Button variant="outlined">&gt;</Button>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">Earnings</Typography>
                                <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Component</TableCell>
                                                <TableCell>Amount (₹)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {currentData.components.filter(c => !['PF Contribution'].includes(c.name)).map((component, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{component.name}</TableCell>
                                                    <TableCell>{formatCurrency(component.amount / 12)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ background: '#f5f5f5' }}>
                                                <TableCell><b>Gross Salary</b></TableCell>
                                                <TableCell>{formatCurrency(currentData.totalCTC / 12)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">Deductions</Typography>
                                <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Component</TableCell>
                                                <TableCell>Amount (₹)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Professional Tax</TableCell>
                                                <TableCell>{formatCurrency(200)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>TDS</TableCell>
                                                <TableCell>{formatCurrency(8500)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>PF Contribution</TableCell>
                                                <TableCell>{formatCurrency(1800)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ background: '#f5f5f5' }}>
                                                <TableCell><b>Total Deductions</b></TableCell>
                                                <TableCell>{formatCurrency(10500)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                        <Paper sx={{ mt: 2, p: 2, textAlign: 'center' }}>
                            <Typography variant="subtitle1">Net Pay for December 2023</Typography>
                            <Typography variant="h5" color="primary">{formatCurrency(currentData.totalCTC * 0.65 / 12)}</Typography>
                            <Typography variant="body2" color="text.secondary">Credited on: 1 Jan 2024 | Bank: HDFC Bank (XXXX7890)</Typography>
                        </Paper>
                    </Box>
                )}
                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>Compensation History</Typography>
                        <Box>
                            {Object.entries(compensationData).map(([year, data], index) => (
                                <Paper key={index} sx={{ mb: 2, p: 2 }}>
                                    <Typography variant="subtitle1">{year}</Typography>
                                    <Typography>CTC: <b>{formatCurrency(data.totalCTC)}</b> {index > 0 && (
                                        <Chip
                                            label={((data.totalCTC / compensationData[Object.keys(compensationData)[index - 1]].totalCTC - 1) * 100).toFixed(1) + '%'}
                                            color={data.totalCTC > compensationData[Object.keys(compensationData)[index - 1]].totalCTC ? 'success' : 'error'}
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    )}</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                                            {data.components.map((comp, i) => (
                                            <Paper key={i} sx={{ p: 1, minWidth: 120, textAlign: 'center' }}>
                                                <Typography variant="body2">{comp.name}</Typography>
                                                <Typography variant="body2">{formatCurrency(comp.amount)}</Typography>
                                                <Typography variant="caption">{comp.percentage}%</Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MyCompensation;