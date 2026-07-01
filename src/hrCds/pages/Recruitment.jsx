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

const initialJobs = [
  { id: 1, title: 'Technical Recruiter', positions: '1', application: '0/0', shortlists: '0/0', screening: '0/0', interviews: '0/0', preOffered: '0/1', offered: '0/0' }
];

const Recruitment = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [jobFilter, setJobFilter] = useState('All Jobs');
    const [search, setSearch] = useState('');
    const [jobs, setJobs] = useState(initialJobs);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ title: '', positions: '', application: '', shortlists: '', screening: '', interviews: '', preOffered: '', offered: '' });

    
    const jobStats = [
        { label: 'Open Jobs', count: jobs.length, color: '#2ecc71' },
        { label: 'Total Applications', count: jobs.reduce((a, b) => a + parseInt(b.application.split('/')[0] || 0, 10), 0), color: '#3498db' },
        { label: 'Applications Actioned', count: jobs.reduce((a, b) => a + parseInt(b.shortlists.split('/')[0] || 0, 10), 0), color: '#f1c40f' }
    ];

    
    const handleOpen = (job = null) => {
      if (job) {
        setEditId(job.id);
        setForm(job);
      } else {
        setEditId(null);
        setForm({ title: '', positions: '', application: '', shortlists: '', screening: '', interviews: '', preOffered: '', offered: '' });
      }
      setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleSubmit = e => {
      e.preventDefault();
      if (editId) {
        setJobs(jobs.map(j => j.id === editId ? { ...form, id: editId } : j));
      } else {
        setJobs([...jobs, { ...form, id: Date.now() }]);
      }
      setOpen(false);
    };
    const handleDelete = id => setJobs(jobs.filter(j => j.id !== id));

    
    const filteredJobs = jobs.filter(job =>
      (jobFilter === 'All Jobs' || (jobFilter === 'Open Jobs' && job.positions !== '0') || (jobFilter === 'Closed Jobs' && job.positions === '0')) &&
      (search ? job.title.toLowerCase().includes(search.toLowerCase()) : true)
    );

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>Recruitment</Typography>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 2 }}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="Job" />
                <Tab label="Interview" />
                <Tab label="Referrals" />
                <Tab label="Available Internal Positions" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>Job Listings</Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            {jobStats.map((stat, index) => (
                                <Paper key={index} sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ color: stat.color }}>{stat.count}</Typography>
                                    <Typography variant="body2">{stat.label}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Select
                                value={jobFilter}
                                onChange={e => setJobFilter(e.target.value)}
                                size="small"
                                sx={{ minWidth: 120 }}
                            >
                                <MenuItem value="All Jobs">All Jobs</MenuItem>
                                <MenuItem value="Open Jobs">Open Jobs</MenuItem>
                                <MenuItem value="Closed Jobs">Closed Jobs</MenuItem>
                            </Select>
                            <Select size="small" sx={{ minWidth: 120 }} defaultValue="Job Title">
                                <MenuItem value="Job Title">Job Title</MenuItem>
                                <MenuItem value="Department">Department</MenuItem>
                                <MenuItem value="Location">Location</MenuItem>
                            </Select>
                            <input
                                type="text"
                                placeholder="Search By"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 160 }}
                            />
                            <Button variant="contained" onClick={() => handleOpen()}>+ New Job Requisition</Button>
                        </Box>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>No. Of Positions</TableCell>
                                        <TableCell>Application</TableCell>
                                        <TableCell>Shortlists</TableCell>
                                        <TableCell>Screening</TableCell>
                                        <TableCell>Interviews</TableCell>
                                        <TableCell>Pre-Offered</TableCell>
                                        <TableCell>Offered</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredJobs.map((job, index) => (
                                        <TableRow key={job.id}>
                                            <TableCell>{job.title}</TableCell>
                                            <TableCell>{job.positions}</TableCell>
                                            <TableCell>{job.application}</TableCell>
                                            <TableCell>{job.shortlists}</TableCell>
                                            <TableCell sx={{ color: '#f39c12' }}>{job.screening}</TableCell>
                                            <TableCell>{job.interviews}</TableCell>
                                            <TableCell>{job.preOffered}</TableCell>
                                            <TableCell>{job.offered}</TableCell>
                                            <TableCell>
                                                <IconButton color="primary" onClick={() => handleOpen(job)}><EditIcon /></IconButton>
                                                <IconButton color="error" onClick={() => handleDelete(job.id)}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredJobs.length === 0 && (
                                        <TableRow><TableCell colSpan={9} align="center">No jobs found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                          <DialogTitle>{editId ? 'Edit Job' : 'Add Job'}</DialogTitle>
                          <form onSubmit={handleSubmit}>
                            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <TextField label="Title" name="title" value={form.title} onChange={handleChange} required fullWidth />
                              <TextField label="No. Of Positions" name="positions" value={form.positions} onChange={handleChange} required fullWidth />
                              <TextField label="Application" name="application" value={form.application} onChange={handleChange} fullWidth />
                              <TextField label="Shortlists" name="shortlists" value={form.shortlists} onChange={handleChange} fullWidth />
                              <TextField label="Screening" name="screening" value={form.screening} onChange={handleChange} fullWidth />
                              <TextField label="Interviews" name="interviews" value={form.interviews} onChange={handleChange} fullWidth />
                              <TextField label="Pre-Offered" name="preOffered" value={form.preOffered} onChange={handleChange} fullWidth />
                              <TextField label="Offered" name="offered" value={form.offered} onChange={handleChange} fullWidth />
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={handleClose}>Cancel</Button>
                              <Button type="submit" variant="contained">{editId ? 'Update' : 'Add'}</Button>
                            </DialogActions>
                          </form>
                        </Dialog>
                    </Box>
                )}
                {activeTab === 1 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">Interview</Typography>
                        <Typography>No interviews scheduled.</Typography>
                    </Paper>
                )}
                {activeTab === 2 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">Referrals</Typography>
                        <Typography>No referrals available.</Typography>
                    </Paper>
                )}
                {activeTab === 3 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6">Available Internal Positions</Typography>
                        <Typography>No internal positions available.</Typography>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default Recruitment;