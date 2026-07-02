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
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialObjectives = [
    {
        id: 1,
        objective: 'Laptop Security Implementation',
        description: 'Implement BitDefender security solution across all company laptops to enhance data protection.',
        owners: [{ name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' }],
        keyResults: [
            'Complete BitDefender installation on 100% of devices',
            'Train all employees on security best practices',
            'Reduce security incidents by 50%'
        ],
        collaborators: [{ name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' }],
        updatedOn: '01-Dec-2024',
        startDate: '01-Sept-2024',
        endDate: '15-Sept-2024',
        timeline: '10-Sept-2024',
        status: 'Over Due',
        progress: 65,
        comments: [
            { id: 1, user: 'John Doe', text: 'Facing issues with legacy systems', date: '05-Sept-2024' },
            { id: 2, user: 'Jane Smith', text: 'Additional training scheduled', date: '07-Sept-2024' }
        ]
    },
    {
        id: 2,
        objective: 'Q4 Marketing Campaign',
        description: 'Launch new product marketing campaign to increase brand awareness and sales.',
        owners: [{ name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }],
        keyResults: [
            'Reach 1M impressions across platforms',
            'Achieve 5% conversion rate',
            'Generate 500 qualified leads'
        ],
        collaborators: [
            { name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=4' },
            { name: 'David Brown', avatar: 'https://i.pravatar.cc/150?img=5' }
        ],
        updatedOn: '15-Nov-2024',
        startDate: '01-Oct-2024',
        endDate: '31-Dec-2024',
        timeline: '15-Dec-2024',
        status: 'Ongoing',
        progress: 35,
        comments: []
    },
    {
        id: 3,
        objective: 'Employee Training Program',
        description: 'Develop and implement new employee training curriculum for professional development.',
        owners: [{ name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?img=6' }],
        keyResults: [
            'Train 100% of employees by year end',
            'Achieve 90% satisfaction rate',
            'Develop 5 new training modules'
        ],
        collaborators: [
            { name: 'Robert Wilson', avatar: 'https://i.pravatar.cc/150?img=7' },
            { name: 'Lisa Taylor', avatar: 'https://i.pravatar.cc/150?img=8' }
        ],
        updatedOn: '20-Nov-2024',
        startDate: '01-Nov-2024',
        endDate: '30-Nov-2024',
        timeline: '25-Nov-2024',
        status: 'Completed',
        progress: 100,
        comments: [
            { id: 1, user: 'Emily Davis', text: 'All modules completed ahead of schedule', date: '25-Nov-2024' }
        ]
    }
];

const MyOKR = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [expandedRow, setExpandedRow] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [objectives, setObjectives] = useState(initialObjectives);
    const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
    const [editObjectiveId, setEditObjectiveId] = useState(null);
    const [objectiveForm, setObjectiveForm] = useState({
        objective: '',
        description: '',
        owners: [{ name: '', avatar: '' }],
        keyResults: [''],
        startDate: '',
        endDate: '',
        status: 'Not Started',
        progress: 0
    });
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [commentObjectiveId, setCommentObjectiveId] = useState(null);
    const [commentForm, setCommentForm] = useState({ text: '', user: 'You', date: new Date().toISOString().slice(0, 10) });
    const [editCommentId, setEditCommentId] = useState(null);

    
    const statusData = [
        { status: 'Not Started', count: objectives.filter(o => o.status === 'Not Started').length, color: '#3498db' },
        { status: 'Ongoing', count: objectives.filter(o => o.status === 'Ongoing').length, color: '#2ecc71' },
        { status: 'Over Due', count: objectives.filter(o => o.status === 'Over Due').length, color: '#e74c3c' },
        { status: 'Completed', count: objectives.filter(o => o.status === 'Completed').length, color: '#27ae60' },
        { status: 'Completed Over TAT', count: objectives.filter(o => o.status === 'Completed Over TAT').length, color: '#f1c40f' }
    ];
    const totalCount = statusData.reduce((sum, item) => sum + item.count, 0);
    const statusWithPercentages = statusData.map(item => ({
        ...item,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
    }));

    
    const filteredObjectives = objectives.filter(obj =>
        obj.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    
    const objectivesPerPage = 5;
    const totalPages = Math.ceil(filteredObjectives.length / objectivesPerPage);
    const paginatedObjectives = filteredObjectives.slice(
        (currentPage - 1) * objectivesPerPage,
        currentPage * objectivesPerPage
    );

    
    const generatePieChartPaths = () => {
        let cumulativePercentage = 0;
        return statusWithPercentages.map((item, index) => {
            const startX = 50 + 50 * Math.cos(2 * Math.PI * cumulativePercentage);
            const startY = 50 + 50 * Math.sin(2 * Math.PI * cumulativePercentage);
            cumulativePercentage += item.percentage / 100;
            const endX = 50 + 50 * Math.cos(2 * Math.PI * cumulativePercentage);
            const endY = 50 + 50 * Math.sin(2 * Math.PI * cumulativePercentage);
            const largeArcFlag = item.percentage > 50 ? 1 : 0;
            return {
                path: `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
                ...item
            };
        });
    };
    const pieChartPaths = generatePieChartPaths();

    const toggleRowExpand = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };
    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    
    const handleOpenObjectiveDialog = (obj = null) => {
        if (obj) {
            setEditObjectiveId(obj.id);
            setObjectiveForm({
                objective: obj.objective,
                description: obj.description,
                owners: obj.owners,
                keyResults: obj.keyResults,
                startDate: obj.startDate,
                endDate: obj.endDate,
                status: obj.status,
                progress: obj.progress
            });
        } else {
            setEditObjectiveId(null);
            setObjectiveForm({
                objective: '',
                description: '',
                owners: [{ name: '', avatar: '' }],
                keyResults: [''],
                startDate: '',
                endDate: '',
                status: 'Not Started',
                progress: 0
            });
        }
        setObjectiveDialogOpen(true);
    };
    const handleCloseObjectiveDialog = () => setObjectiveDialogOpen(false);
    const handleObjectiveFormChange = (e) => {
        setObjectiveForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const handleKeyResultChange = (idx, value) => {
        setObjectiveForm(f => ({ ...f, keyResults: f.keyResults.map((kr, i) => i === idx ? value : kr) }));
    };
    const handleAddKeyResult = () => {
        setObjectiveForm(f => ({ ...f, keyResults: [...f.keyResults, ''] }));
    };
    const handleRemoveKeyResult = (idx) => {
        setObjectiveForm(f => ({ ...f, keyResults: f.keyResults.filter((_, i) => i !== idx) }));
    };
    const handleObjectiveSubmit = (e) => {
        e.preventDefault();
        if (editObjectiveId) {
            setObjectives(objectives.map(obj => obj.id === editObjectiveId ? { ...obj, ...objectiveForm } : obj));
        } else {
            setObjectives([{ ...objectiveForm, id: Date.now(), comments: [] }, ...objectives]);
        }
        setObjectiveDialogOpen(false);
    };
    const handleDeleteObjective = (id) => {
        setObjectives(objectives.filter(obj => obj.id !== id));
    };

    
    const handleOpenCommentDialog = (objectiveId, comment = null) => {
        setCommentObjectiveId(objectiveId);
        if (comment) {
            setEditCommentId(comment.id);
            setCommentForm({ text: comment.text, user: comment.user, date: comment.date });
        } else {
            setEditCommentId(null);
            setCommentForm({ text: '', user: 'You', date: new Date().toISOString().slice(0, 10) });
        }
        setCommentDialogOpen(true);
    };
    const handleCloseCommentDialog = () => setCommentDialogOpen(false);
    const handleCommentFormChange = (e) => {
        setCommentForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const handleCommentSubmit = (e) => {
        e.preventDefault();
        setObjectives(objectives.map(obj => {
            if (obj.id !== commentObjectiveId) return obj;
            if (editCommentId) {
                return {
                    ...obj,
                    comments: obj.comments.map(c => c.id === editCommentId ? { ...c, ...commentForm } : c)
                };
            } else {
                return {
                    ...obj,
                    comments: [...obj.comments, { ...commentForm, id: Date.now() }]
                };
            }
        }));
        setCommentDialogOpen(false);
    };
    const handleDeleteComment = (objectiveId, commentId) => {
        setObjectives(objectives.map(obj =>
            obj.id === objectiveId ? { ...obj, comments: obj.comments.filter(c => c.id !== commentId) } : obj
        ));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Objectives & Key Results</Typography>
                <Box>
                    <Button variant="contained" sx={{ mr: 1 }} onClick={() => handleOpenObjectiveDialog()}>Create Objective</Button>
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
                <Tab label="Company" />
                <Tab label="Following" />
                <Tab label="Public" />
            </Tabs>
            <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                <Box>
                    <svg width="200" height="200" viewBox="0 0 100 100">
                        {pieChartPaths.map((segment, index) => (
                            <path
                                key={index}
                                d={segment.path}
                                fill={segment.color}
                                style={{ opacity: 0.8 }}
                            />
                        ))}
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold">
                            {totalCount}
                            <tspan x="50" dy="1.2em" fontSize="6">Objectives</tspan>
                        </text>
                    </svg>
                </Box>
                <Box>
                    <Box sx={{ display: 'flex', fontWeight: 700, mb: 1 }}>
                        <Box sx={{ width: 100 }}>Status</Box>
                        <Box sx={{ width: 60 }}>Count</Box>
                        <Box sx={{ width: 40 }}>%</Box>
                    </Box>
                    {statusWithPercentages.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: 16, height: 16, background: item.color, borderRadius: '50%', mr: 1 }} />
                            <Box sx={{ width: 84 }}>{item.status}</Box>
                            <Box sx={{ width: 60 }}>{item.count}</Box>
                            <Box sx={{ width: 40 }}>{item.percentage}%</Box>
                        </Box>
                    ))}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">🔍</Typography>
                        <input
                            type="text"
                            placeholder="Search objectives..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 200 }}
                    />
                </Box>
                <Select size="small" sx={{ minWidth: 120 }} defaultValue="All Status">
                    <MenuItem value="All Status">All Status</MenuItem>
                    <MenuItem value="Not Started">Not Started</MenuItem>
                    <MenuItem value="Ongoing">Ongoing</MenuItem>
                    <MenuItem value="Over Due">Over Due</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                </Select>
                <Select size="small" sx={{ minWidth: 120 }} defaultValue="All Time">
                    <MenuItem value="All Time">All Time</MenuItem>
                    <MenuItem value="This Quarter">This Quarter</MenuItem>
                    <MenuItem value="This Month">This Month</MenuItem>
                    <MenuItem value="This Week">This Week</MenuItem>
                </Select>
            </Box>
            <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Objective</TableCell>
                            <TableCell>Owners</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Timeline</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                            {paginatedObjectives.map((objective) => (
                                <React.Fragment key={objective.id}>
                                <TableRow hover selected={expandedRow === objective.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleRowExpand(objective.id)}>
                                            <Typography sx={{ fontWeight: 600 }}>{objective.objective}</Typography>
                                            <Button size="small" sx={{ ml: 1 }}>{expandedRow === objective.id ? '▲' : '▼'}</Button>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {objective.owners.map((owner, idx) => (
                                                <Avatar key={idx} src={owner.avatar} alt={owner.name} sx={{ width: 28, height: 28 }} />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ minWidth: 120 }}>
                                            <LinearProgress variant="determinate" value={objective.progress} sx={{ height: 8, borderRadius: 4, mb: 0.5 }} />
                                            <Typography variant="caption">{objective.progress}%</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={objective.status} color={objective.status === 'Completed' ? 'success' : objective.status === 'Ongoing' ? 'primary' : objective.status === 'Over Due' ? 'error' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{objective.timeline}</Typography>
                                                    {objective.status === 'Over Due' && (
                                            <Typography variant="caption" color="error">+{Math.floor((new Date() - new Date(objective.timeline)) / (1000 * 60 * 60 * 24))} days</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton color="primary" onClick={() => handleOpenObjectiveDialog(objective)}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteObjective(objective.id)}><DeleteIcon /></IconButton>
                                        <Button variant="outlined" size="small" sx={{ ml: 1 }} onClick={() => handleOpenCommentDialog(objective.id)}>Comment{objective.comments.length > 0 ? ` (${objective.comments.length})` : ''}</Button>
                                    </TableCell>
                                </TableRow>
                                    {expandedRow === objective.id && (
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ background: '#fafafa' }}>
                                            <Box sx={{ display: 'flex', gap: 4 }}>
                                                <Box sx={{ flex: 2 }}>
                                                    <Typography variant="subtitle1">Description</Typography>
                                                    <Typography variant="body2" sx={{ mb: 2 }}>{objective.description}</Typography>
                                                    <Typography variant="subtitle1">Key Results</Typography>
                                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                                            {objective.keyResults.map((kr, idx) => (
                                                                <li key={idx}>{kr}</li>
                                                            ))}
                                                        </ul>
                                                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Timeline</Typography>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Typography variant="body2">Start: <b>{objective.startDate}</b></Typography>
                                                        <Typography variant="body2">End: <b>{objective.endDate}</b></Typography>
                                                        <Typography variant="body2">Last Updated: <b>{objective.updatedOn}</b></Typography>
                                                    </Box>
                                                </Box>
                                                    {objective.comments.length > 0 && (
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="subtitle1">Comments</Typography>
                                                                {objective.comments.map((comment, idx) => (
                                                            <Box key={comment.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                                                <Avatar src={objective.owners.find(o => o.name === comment.user)?.avatar || 'https://i.pravatar.cc/150?img=0'} sx={{ width: 24, height: 24, mr: 1 }} />
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={600}>{comment.user}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">{comment.date}</Typography>
                                                                    <Typography variant="body2">{comment.text}</Typography>
                                                                    <IconButton size="small" onClick={() => handleOpenCommentDialog(objective.id, comment)}><EditIcon fontSize="small" /></IconButton>
                                                                    <IconButton size="small" color="error" onClick={() => handleDeleteComment(objective.id, comment.id)}><DeleteIcon fontSize="small" /></IconButton>
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" />
            </Box>
            
            <Dialog open={objectiveDialogOpen} onClose={handleCloseObjectiveDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editObjectiveId ? 'Edit Objective' : 'Add Objective'}</DialogTitle>
                <form onSubmit={handleObjectiveSubmit}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Objective" name="objective" value={objectiveForm.objective} onChange={handleObjectiveFormChange} required fullWidth />
                        <TextField label="Description" name="description" value={objectiveForm.description} onChange={handleObjectiveFormChange} required fullWidth />
                        <Typography variant="subtitle2">Key Results</Typography>
                        {objectiveForm.keyResults.map((kr, idx) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField value={kr} onChange={e => handleKeyResultChange(idx, e.target.value)} fullWidth />
                                <IconButton onClick={() => handleRemoveKeyResult(idx)} disabled={objectiveForm.keyResults.length === 1}><DeleteIcon /></IconButton>
                            </Box>
                        ))}
                        <Button onClick={handleAddKeyResult} size="small" variant="outlined">Add Key Result</Button>
                        <TextField label="Start Date" name="startDate" value={objectiveForm.startDate} onChange={handleObjectiveFormChange} fullWidth />
                        <TextField label="End Date" name="endDate" value={objectiveForm.endDate} onChange={handleObjectiveFormChange} fullWidth />
                        <Select label="Status" name="status" value={objectiveForm.status} onChange={handleObjectiveFormChange} fullWidth>
                            <MenuItem value="Not Started">Not Started</MenuItem>
                            <MenuItem value="Ongoing">Ongoing</MenuItem>
                            <MenuItem value="Over Due">Over Due</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Completed Over TAT">Completed Over TAT</MenuItem>
                        </Select>
                        <TextField label="Progress (%)" name="progress" type="number" value={objectiveForm.progress} onChange={handleObjectiveFormChange} fullWidth />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseObjectiveDialog}>Cancel</Button>
                        <Button type="submit" variant="contained">{editObjectiveId ? 'Update' : 'Add'}</Button>
                    </DialogActions>
                </form>
            </Dialog>
            
            <Dialog open={commentDialogOpen} onClose={handleCloseCommentDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{editCommentId ? 'Edit Comment' : 'Add Comment'}</DialogTitle>
                <form onSubmit={handleCommentSubmit}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Comment" name="text" value={commentForm.text} onChange={handleCommentFormChange} required fullWidth />
                        <TextField label="User" name="user" value={commentForm.user} onChange={handleCommentFormChange} required fullWidth />
                        <TextField label="Date" name="date" value={commentForm.date} onChange={handleCommentFormChange} fullWidth />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCommentDialog}>Cancel</Button>
                        <Button type="submit" variant="contained">{editCommentId ? 'Update' : 'Add'}</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default MyOKR;