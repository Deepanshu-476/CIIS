import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const initialMyCourses = [
    { id: 1, title: 'Introduction to Project Management', progress: 75, dueDate: 'July 30, 2025', status: 'In Progress' },
    { id: 2, title: 'Effective Communication Skills', progress: 100, completedDate: 'June 15, 2025', status: 'Completed' },
    { id: 3, title: 'Leadership Fundamentals', progress: 0, dueDate: 'August 15, 2025', status: 'Not Started' }
];
const initialCatalogCourses = [
    { id: 101, title: 'Advanced Excel Techniques', duration: '4 hours', category: 'Technical Skills' },
    { id: 102, title: 'Presentation Mastery', duration: '3 hours', category: 'Soft Skills' },
    { id: 103, title: 'Time Management Essentials', duration: '2 hours', category: 'Productivity' },
    { id: 104, title: 'Introduction to Data Analysis', duration: '6 hours', category: 'Technical Skills' }
];

const MyLearning = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [courseFilter, setCourseFilter] = useState('All Courses');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogFilter, setCatalogFilter] = useState('All');
    const [myCourses, setMyCourses] = useState(initialMyCourses);
    const [catalogCourses, setCatalogCourses] = useState(initialCatalogCourses);
    const [courseDialogOpen, setCourseDialogOpen] = useState(false);
    const [editCourseId, setEditCourseId] = useState(null);
    const [courseForm, setCourseForm] = useState({ title: '', progress: 0, dueDate: '', completedDate: '', status: 'Not Started' });

    
    const completedCount = myCourses.filter(c => c.status === 'Completed').length;
    const streak = myCourses.filter(c => c.status === 'Completed').length >= 7;
    const skillMaster = myCourses.filter(c => c.status === 'Completed' && c.category === 'Technical Skills').length >= 2;

    
    const handleOpenCourseDialog = (course = null) => {
        if (course) {
            setEditCourseId(course.id);
            setCourseForm(course);
        } else {
            setEditCourseId(null);
            setCourseForm({ title: '', progress: 0, dueDate: '', completedDate: '', status: 'Not Started' });
        }
        setCourseDialogOpen(true);
    };
    const handleCloseCourseDialog = () => setCourseDialogOpen(false);
    const handleCourseFormChange = (e) => {
        setCourseForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const handleCourseSubmit = (e) => {
        e.preventDefault();
        if (editCourseId) {
            setMyCourses(myCourses.map(c => c.id === editCourseId ? { ...courseForm, id: editCourseId } : c));
        } else {
            setMyCourses([{ ...courseForm, id: Date.now() }, ...myCourses]);
        }
        setCourseDialogOpen(false);
    };
    const handleDeleteCourse = (id) => {
        setMyCourses(myCourses.filter(c => c.id !== id));
    };
    
    const handleEnroll = (course) => {
        setMyCourses([{ ...course, id: Date.now(), progress: 0, status: 'Not Started' }, ...myCourses]);
    };
    
    const handleCourseAction = (course) => {
        if (course.status === 'Not Started') {
            setMyCourses(myCourses.map(c => c.id === course.id ? { ...c, status: 'In Progress', progress: 10 } : c));
        } else if (course.status === 'In Progress') {
            const newProgress = Math.min(100, c.progress + 25);
            setMyCourses(myCourses.map(c => c.id === course.id ? { ...c, progress: newProgress, status: newProgress === 100 ? 'Completed' : 'In Progress', completedDate: newProgress === 100 ? new Date().toLocaleDateString('en-GB') : '' } : c));
        }
    };
    
    const filteredMyCourses = myCourses.filter(c => courseFilter === 'All Courses' || c.status === courseFilter);
    
    const filteredCatalog = catalogCourses.filter(course => (catalogFilter === 'All' || course.category === catalogFilter) && course.title.toLowerCase().includes(catalogSearch.toLowerCase()));

    return (
        <Box sx={{ p: 3, background: '#fff', minHeight: '100vh' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>My Learning</Typography>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 3 }}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="My Courses" />
                <Tab label="Course Catalog" />
                <Tab label="Achievements" />
                <Tab label="Learning Path" />
            </Tabs>
            <Box>
                {activeTab === 0 && (
                    <Box>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6">My Courses</Typography>
                            <Select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} size="small" sx={{ minWidth: 140, width: { xs: '100%', sm: 140 } }}>
                                <MenuItem value="All Courses">All Courses</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Not Started">Not Started</MenuItem>
                            </Select>
                            <Button variant="contained" onClick={() => handleOpenCourseDialog()}>Add Course</Button>
                        </Stack>
                        <Stack spacing={2}>
                            {filteredMyCourses.map(course => (
                                <Paper key={course.id} sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="h6">{course.title}</Typography>
                                        <Chip label={course.status} color={course.status === 'Completed' ? 'success' : course.status === 'In Progress' ? 'warning' : 'default'} />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <LinearProgress variant="determinate" value={course.progress} sx={{ height: 8, borderRadius: 4, mb: 0.5 }} />
                                            <Typography variant="caption">{course.progress}% Complete</Typography>
                                        </Box>
                                        {course.dueDate && <Typography color="text.secondary">Due: {course.dueDate}</Typography>}
                                        {course.completedDate && <Typography color="text.secondary">Completed: {course.completedDate}</Typography>}
                                        <Button variant="contained" color="primary" onClick={() => handleCourseAction(course)}>
                                            {course.status === 'Completed' ? 'Review' : course.status === 'Not Started' ? 'Start' : 'Continue'}
                                        </Button>
                                        <Button variant="outlined" color="primary" onClick={() => handleOpenCourseDialog(course)}>Edit</Button>
                                        <Button variant="outlined" color="error" onClick={() => handleDeleteCourse(course.id)}>Delete</Button>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                        
                        <Dialog open={courseDialogOpen} onClose={handleCloseCourseDialog} maxWidth="xs" fullWidth>
                            <DialogTitle>{editCourseId ? 'Edit Course' : 'Add Course'}</DialogTitle>
                            <form onSubmit={handleCourseSubmit}>
                                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Title" name="title" value={courseForm.title} onChange={handleCourseFormChange} required fullWidth />
                                    <TextField label="Progress (%)" name="progress" type="number" value={courseForm.progress} onChange={handleCourseFormChange} fullWidth />
                                    <TextField label="Due Date" name="dueDate" value={courseForm.dueDate} onChange={handleCourseFormChange} fullWidth />
                                    <TextField label="Completed Date" name="completedDate" value={courseForm.completedDate} onChange={handleCourseFormChange} fullWidth />
                                    <Select label="Status" name="status" value={courseForm.status} onChange={handleCourseFormChange} fullWidth>
                                        <MenuItem value="Not Started">Not Started</MenuItem>
                                        <MenuItem value="In Progress">In Progress</MenuItem>
                                        <MenuItem value="Completed">Completed</MenuItem>
                                    </Select>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleCloseCourseDialog}>Cancel</Button>
                                    <Button type="submit" variant="contained">{editCourseId ? 'Update' : 'Add'}</Button>
                                </DialogActions>
                            </form>
                        </Dialog>
                    </Box>
                )}
                {activeTab === 1 && (
                    <Box>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6">Course Catalog</Typography>
                            <TextField
                                value={catalogSearch}
                                onChange={e => setCatalogSearch(e.target.value)}
                                size="small"
                                placeholder="Search courses..."
                                sx={{ minWidth: 200 }}
                            />
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            {['All', 'Technical Skills', 'Soft Skills', 'Leadership', 'Productivity'].map(label => (
                                <Button
                                    key={label}
                                    variant={catalogFilter === label ? 'contained' : 'outlined'}
                                    onClick={() => setCatalogFilter(label)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </Stack>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                            {filteredCatalog.map(course => (
                                <Paper key={course.id} sx={{ p: 2, borderRadius: 2, minWidth: 220, flex: 1 }}>
                                    <Typography variant="h6">{course.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{course.duration} | {course.category}</Typography>
                                    <Button variant="contained" color="primary" sx={{ mt: 1 }} onClick={() => handleEnroll(course)}>Enroll</Button>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}
                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>My Achievements</Typography>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Paper sx={{ p: 2, borderRadius: 2, minWidth: 200, textAlign: 'center', background: '#fffde7' }}>
                                <Typography variant="h3">🏆</Typography>
                                <Typography variant="h6">Course Completion</Typography>
                                <Typography>Completed {completedCount} courses</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2, minWidth: 200, textAlign: 'center', background: streak ? '#fffde7' : '#f5f5f5', color: streak ? 'inherit' : '#aaa' }}>
                                <Typography variant="h3">🔒</Typography>
                                <Typography variant="h6">Learning Streak</Typography>
                                <Typography>{streak ? 'Streak Achieved!' : 'Complete courses for 7 consecutive days'}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2, minWidth: 200, textAlign: 'center', background: skillMaster ? '#fffde7' : '#f5f5f5', color: skillMaster ? 'inherit' : '#aaa' }}>
                                <Typography variant="h3">🔒</Typography>
                                <Typography variant="h6">Skill Master</Typography>
                                <Typography>{skillMaster ? 'Mastered Technical Skills!' : 'Complete all courses in a skill category'}</Typography>
                            </Paper>
                        </Stack>
                    </Box>
                )}
                {activeTab === 3 && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>My Learning Path</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: 2, background: '#c8e6c9', minWidth: 120, textAlign: 'center' }}>
                                <Typography variant="h5">✓</Typography>
                                <Typography>Onboarding</Typography>
                            </Paper>
                            <Box sx={{ width: 40, height: 4, background: '#bdbdbd', borderRadius: 2 }} />
                            <Paper sx={{ p: 2, borderRadius: 2, background: '#ffe082', minWidth: 120, textAlign: 'center', border: '2px solid #ffb300' }}>
                                <Typography variant="h5">2</Typography>
                                <Typography>Core Skills</Typography>
                            </Paper>
                            <Box sx={{ width: 40, height: 4, background: '#bdbdbd', borderRadius: 2 }} />
                            <Paper sx={{ p: 2, borderRadius: 2, background: '#f5f5f5', minWidth: 120, textAlign: 'center' }}>
                                <Typography variant="h5">3</Typography>
                                <Typography>Advanced Skills</Typography>
                            </Paper>
                            <Box sx={{ width: 40, height: 4, background: '#bdbdbd', borderRadius: 2 }} />
                            <Paper sx={{ p: 2, borderRadius: 2, background: '#f5f5f5', minWidth: 120, textAlign: 'center' }}>
                                <Typography variant="h5">4</Typography>
                                <Typography>Leadership</Typography>
                            </Paper>
                        </Stack>
                        <Box>
                            <Typography variant="subtitle1">Core Skills - In Progress</Typography>
                            <Typography>Complete the following courses to advance to the next level:</Typography>
                                <ul>
                                    <li>Effective Communication Skills - Completed</li>
                                    <li>Project Management Fundamentals - In Progress (75%)</li>
                                    <li>Time Management Essentials - Not Started</li>
                                </ul>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MyLearning;