import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const initialPosts = [
    { id: 1, author: 'Anonymous', content: "What's up?", likes: 0, isAnonymous: true },
    { id: 2, author: 'Muhammad Salman', position: 'Manager Level | Division A', content: 'Hello!', likes: 2, isAnonymous: false },
    { id: 3, author: 'Amit Sharma', position: 'Manager Level | Division A', content: 'Good Job!', likes: 0, isAnonymous: false, highlight: { title: 'Employee of the month!', color: '#ffc107' } }
];
const initialPolls = [
    { id: 1, title: 'Manageable Poll Q1', endDate: '30-04-2024' }
];
const initialSurveys = [
    { id: 1, title: 'Manageable Survey Q1', endDate: '30-04-2023', status: 'Participate' }
];

const Intranet = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [postText, setPostText] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [posts, setPosts] = useState(initialPosts);
    const [editId, setEditId] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({ content: '', isAnonymous: false });
    const [polls, setPolls] = useState(initialPolls);
    const [surveys, setSurveys] = useState(initialSurveys);
    const [pollDialogOpen, setPollDialogOpen] = useState(false);
    const [pollForm, setPollForm] = useState({ title: '', endDate: '' });
    const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
    const [surveyForm, setSurveyForm] = useState({ title: '', endDate: '', status: 'Participate' });

    
    const handlePostSubmit = () => {
        if (postText.trim()) {
            setPosts([
                { id: Date.now(), author: anonymous ? 'Anonymous' : 'You', content: postText, likes: 0, isAnonymous: anonymous },
                ...posts
            ]);
            setPostText('');
            setAnonymous(false);
        }
    };
    const handleLike = (postId) => {
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    };
    const handleDeletePost = (postId) => {
        setPosts(posts.filter(p => p.id !== postId));
    };
    const handleEditPostOpen = (post) => {
        setEditId(post.id);
        setEditForm({ content: post.content, isAnonymous: post.isAnonymous });
        setEditDialogOpen(true);
    };
    const handleEditPostClose = () => setEditDialogOpen(false);
    const handleEditPostSubmit = (e) => {
        e.preventDefault();
        setPosts(posts.map(p => p.id === editId ? { ...p, content: editForm.content, isAnonymous: editForm.isAnonymous } : p));
        setEditDialogOpen(false);
    };

    
    const handleAddPoll = () => {
        setPollForm({ title: '', endDate: '' });
        setPollDialogOpen(true);
    };
    const handlePollSubmit = (e) => {
        e.preventDefault();
        setPolls([...polls, { ...pollForm, id: Date.now() }]);
        setPollDialogOpen(false);
    };
    const handleDeletePoll = (id) => setPolls(polls.filter(p => p.id !== id));

    
    const handleAddSurvey = () => {
        setSurveyForm({ title: '', endDate: '', status: 'Participate' });
        setSurveyDialogOpen(true);
    };
    const handleSurveySubmit = (e) => {
        e.preventDefault();
        setSurveys([...surveys, { ...surveyForm, id: Date.now() }]);
        setSurveyDialogOpen(false);
    };
    const handleDeleteSurvey = (id) => setSurveys(surveys.filter(s => s.id !== id));

    return (
        <Box sx={{ p: 3, background: '#fff', minHeight: '100vh' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Intranet</Typography>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 3 }}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="WALL" />
                <Tab label="COMMUNITY" />
                <Tab label="IDEA BOX" />
            </Tabs>
            <Box>
                {activeTab === 0 && (
                    <Box>
                        
                        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                            <Stack spacing={2}>
                                <TextField
                                    multiline
                                    minRows={2}
                                    placeholder="What's in your mind?"
                                    value={postText}
                                    onChange={e => setPostText(e.target.value)}
                                    fullWidth
                                />
                                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={1}>
                                        <Button variant={anonymous ? 'contained' : 'outlined'} size="small" onClick={() => setAnonymous(a => !a)}>
                                            {anonymous ? 'Anonymous' : 'Not Anonymous'}
                                        </Button>
                                        <Button variant="outlined" size="small">Photos/Files</Button>
                                        <Button variant="outlined" size="small">Share a Mood</Button>
                                    </Stack>
                                    <Button
                                        variant="contained"
                                        onClick={handlePostSubmit}
                                        disabled={!postText.trim()}
                                    >
                                        Post
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                        
                        <Stack spacing={2} sx={{ mb: 3 }}>
                            {posts.map(post => (
                                <Paper
                                    key={post.id}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        background: post.highlight ? post.highlight.color : '#fafafa',
                                        position: 'relative',
                                    }}
                                >
                                    {post.highlight && (
                                        <Chip label={post.highlight.title} color="warning" sx={{ position: 'absolute', top: 12, right: 12 }} />
                                    )}
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                                        <Avatar sx={{ bgcolor: post.isAnonymous ? '#bdbdbd' : '#1976d2' }}>
                                            {post.isAnonymous ? '?' : post.author[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>{post.author}</Typography>
                                            {!post.isAnonymous && post.position && (
                                                <Typography variant="caption" color="text.secondary">{post.position}</Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                    <Typography variant="body1" sx={{ mb: 1 }}>{post.content}</Typography>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Button size="small" variant="outlined" onClick={() => handleLike(post.id)}>Like</Button>
                                        <Typography variant="caption">{post.likes}</Typography>
                                        <IconButton size="small" onClick={() => handleEditPostOpen(post)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeletePost(post.id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                        
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Paper sx={{ p: 2, borderRadius: 2, flex: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" sx={{ mb: 1 }}>Polls</Typography>
                                    <Button size="small" variant="outlined" onClick={handleAddPoll}>Add Poll</Button>
                                </Stack>
                                {polls.map(poll => (
                                    <Box key={poll.id} sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle1">{poll.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">End date: {poll.endDate}</Typography>
                                        </Box>
                                        <IconButton size="small" color="error" onClick={() => handleDeletePoll(poll.id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                ))}
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2, flex: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" sx={{ mb: 1 }}>Surveys</Typography>
                                    <Button size="small" variant="outlined" onClick={handleAddSurvey}>Add Survey</Button>
                                </Stack>
                                {surveys.map(survey => (
                                    <Box key={survey.id} sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle1">{survey.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">End date: {survey.endDate}</Typography>
                                            <Button variant="contained" size="small" sx={{ mt: 1 }}>{survey.status}</Button>
                                        </Box>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteSurvey(survey.id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                ))}
                            </Paper>
                        </Stack>
                        
                        <Dialog open={editDialogOpen} onClose={handleEditPostClose} maxWidth="xs" fullWidth>
                            <DialogTitle>Edit Post</DialogTitle>
                            <form onSubmit={handleEditPostSubmit}>
                                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Content" name="content" value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} required fullWidth />
                                    <Button variant={editForm.isAnonymous ? 'contained' : 'outlined'} size="small" onClick={() => setEditForm(f => ({ ...f, isAnonymous: !f.isAnonymous }))}>
                                        {editForm.isAnonymous ? 'Anonymous' : 'Not Anonymous'}
                                    </Button>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleEditPostClose}>Cancel</Button>
                                    <Button type="submit" variant="contained">Update</Button>
                                </DialogActions>
                            </form>
                        </Dialog>
                        
                        <Dialog open={pollDialogOpen} onClose={() => setPollDialogOpen(false)} maxWidth="xs" fullWidth>
                            <DialogTitle>Add Poll</DialogTitle>
                            <form onSubmit={handlePollSubmit}>
                                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Title" name="title" value={pollForm.title} onChange={e => setPollForm(f => ({ ...f, title: e.target.value }))} required fullWidth />
                                    <TextField label="End Date" name="endDate" value={pollForm.endDate} onChange={e => setPollForm(f => ({ ...f, endDate: e.target.value }))} required fullWidth />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setPollDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="contained">Add</Button>
                                </DialogActions>
                            </form>
                        </Dialog>
                        
                        <Dialog open={surveyDialogOpen} onClose={() => setSurveyDialogOpen(false)} maxWidth="xs" fullWidth>
                            <DialogTitle>Add Survey</DialogTitle>
                            <form onSubmit={handleSurveySubmit}>
                                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Title" name="title" value={surveyForm.title} onChange={e => setSurveyForm(f => ({ ...f, title: e.target.value }))} required fullWidth />
                                    <TextField label="End Date" name="endDate" value={surveyForm.endDate} onChange={e => setSurveyForm(f => ({ ...f, endDate: e.target.value }))} required fullWidth />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setSurveyDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="contained">Add</Button>
                                </DialogActions>
                            </form>
                        </Dialog>
                    </Box>
                )}
                {activeTab === 1 && (
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                        <Typography variant="h2" sx={{ mb: 2 }}>🚧</Typography>
                        <Typography variant="h5">Coming Soon</Typography>
                        <Typography>The Community feature is currently under development.</Typography>
                    </Box>
                )}
                {activeTab === 2 && (
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                        <Typography variant="h2" sx={{ mb: 2 }}>🚧</Typography>
                        <Typography variant="h5">Coming Soon</Typography>
                        <Typography>The Idea Box feature is currently under development.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Intranet;