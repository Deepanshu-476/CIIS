import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RateReview as ReviewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Diversity3 as AudienceIcon,
  AssignmentTurnedIn as SubmittedIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Send as PaperPlaneIcon,
  InfoOutlined as InfoIcon,
  StarBorder as StarBorderIcon,
  DragIndicator as DragIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import './FeedbackQuestionnaireManagement.css';

const getId = value => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || value.value || '');
  return String(value);
};

const getCompanyLabel = company => {
  if (!company) return '';
  return company.companyCode ? `${company.companyName} (${company.companyCode})` : company.companyName;
};

const getBranchLabel = branch => {
  if (!branch) return '';
  return branch.branchCode ? `${branch.name} (${branch.branchCode})` : branch.name;
};

const readStoredJson = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getLoggedCompany = () => {
  const storedCompany = readStoredJson('company') || readStoredJson('companyDetails');
  const storedUser = readStoredJson('user') || readStoredJson('superAdmin');
  const candidates = [
    storedCompany,
    storedUser?.companyDetails,
    storedUser?.company,
    storedUser?.companyId,
  ];

  for (const candidate of candidates) {
    const id = getId(candidate);
    if (!id) continue;
    const source = typeof candidate === 'object' ? candidate : {};
    return {
      _id: id,
      companyName: source.companyName || source.name || storedUser?.companyName || 'Company',
      companyCode: source.companyCode || storedUser?.companyCode || localStorage.getItem('companyCode') || '',
    };
  }

  return null;
};

const emptyQuestion = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  type: 'text',
  required: true,
  optionsText: '',
  maxRating: 5,
  placeholder: '',
});

const normalizeQuestion = question => ({
  label: String(question.label || '').trim(),
  type: String(question.type || 'text'),
  required: Boolean(question.required),
  options: String(question.optionsText || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean),
  maxRating: Number(question.maxRating || 5),
  placeholder: String(question.placeholder || '').trim(),
});

const FeedbackQuestionnaireManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [responsesDialog, setResponsesDialog] = useState({ open: false, loading: false, questionnaire: null, responses: [] });
  const [form, setForm] = useState({
    title: 'Feedback Questionnaire',
    description: '',
    targetScope: 'company',
    recipientMode: 'all',
    company: null,
    branch: null,
    targetedUsers: [],
    nameVisibility: 'show_name',
    questions: [emptyQuestion()],
  });
  const loggedCompany = useMemo(() => getLoggedCompany(), []);
  const lockedCompanyId = getId(loggedCompany);

  const headers = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  };

  const filteredBranches = useMemo(() => {
    const companyId = getId(form.company);
    if (!companyId) return [];
    return branches.filter(branch => String(branch.company?._id || branch.company) === companyId);
  }, [branches, form.company]);

  const filteredUsers = useMemo(() => {
    const companyId = getId(form.company);
    const branchId = getId(form.branch);

    return users.filter(user => {
      const userCompanyId = getId(user.company);
      const userBranchId = getId(user.branch);
      const assignedBranches = Array.isArray(user.assignedBranches) ? user.assignedBranches.map(getId) : [];

      if (form.targetScope !== 'user' && companyId && userCompanyId !== companyId) {
        return false;
      }

      if (form.targetScope === 'branch' && branchId) {
        return userBranchId === branchId || assignedBranches.includes(branchId);
      }

      return true;
    });
  }, [users, form.company, form.branch, form.targetScope]);

  const recipientPreviewCount = useMemo(() => {
    if (form.targetScope === 'user') {
      return form.targetedUsers.length || 0;
    }
    if (form.recipientMode === 'specific') {
      return form.targetedUsers.length;
    }
    if (form.targetScope === 'branch') {
      const branchId = getId(form.branch);
      return filteredUsers.filter(user => {
        const assignedBranches = Array.isArray(user.assignedBranches) ? user.assignedBranches.map(getId) : [];
        return getId(user.branch) === branchId || assignedBranches.includes(branchId);
      }).length;
    }
    if (form.targetScope === 'company') {
      const companyId = getId(form.company);
      return filteredUsers.filter(user => String(user.company?._id || user.company) === companyId).length;
    }
    return filteredUsers.length;
  }, [form, filteredUsers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companyRes, userRes, questionnaireRes] = await Promise.all([
        axiosInstance.get('/superAdmin/companies'),
        axiosInstance.get('/superAdmin/users'),
        axiosInstance.get('/feedback/questionnaires?limit=100'),
      ]);

      const allCompanies = Array.isArray(companyRes.data) ? companyRes.data : [];
      const matchedCompany = lockedCompanyId
        ? allCompanies.find(company => getId(company) === lockedCompanyId) || loggedCompany
        : null;
      setCompanies(matchedCompany ? [matchedCompany] : allCompanies);
      if (matchedCompany) {
        setForm(prev => ({
          ...prev,
          company: matchedCompany,
          branch: getId(prev.company) === getId(matchedCompany) ? prev.branch : null,
        }));
      }
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
      setQuestionnaires(Array.isArray(questionnaireRes.data?.data?.questionnaires) ? questionnaireRes.data.data.questionnaires : []);
    } catch (error) {
      setNotice({ severity: 'error', message: error.response?.data?.message || 'Failed to load questionnaire data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async companyId => {
    if (!companyId) {
      setBranches([]);
      return;
    }

    try {
      const response = await axiosInstance.get(`/branches/company/${companyId}`);
      setBranches(Array.isArray(response.data?.branches) ? response.data.branches : []);
    } catch (error) {
      setBranches([]);
      setNotice({ severity: 'warning', message: error.response?.data?.message || 'Could not load branches for selected company' });
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (form.targetScope === 'branch' || form.targetScope === 'company') {
      void fetchBranches(getId(form.company));
    }
  }, [form.company, form.targetScope]);

  useEffect(() => {
    if (form.targetScope === 'user' && form.recipientMode !== 'specific') {
      setForm(prev => ({ ...prev, recipientMode: 'specific' }));
    }
    if (form.targetScope === 'user' && form.targetedUsers.length > 1) {
      setForm(prev => ({ ...prev, targetedUsers: prev.targetedUsers.slice(0, 1) }));
    }
    if (form.targetScope !== 'user' && form.recipientMode === 'specific' && !form.targetedUsers.length) {
      setForm(prev => ({ ...prev, targetedUsers: [] }));
    }
  }, [form.targetScope]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const setTargetScope = scope => {
    setForm(prev => ({
      ...prev,
      targetScope: scope,
      recipientMode: scope === 'user' ? 'specific' : prev.recipientMode,
      branch: scope === 'branch' ? prev.branch : null,
      targetedUsers: scope === 'user' ? prev.targetedUsers.slice(0, 1) : [],
    }));
  };

  const updateQuestion = (questionId, key, value) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(question => (
        question.id === questionId ? { ...question, [key]: value } : question
      )),
    }));
  };

  const addQuestion = () => {
    setForm(prev => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  };

  const removeQuestion = questionId => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.length === 1
        ? prev.questions
        : prev.questions.filter(question => question.id !== questionId),
    }));
  };

  const resetForm = () => {
    setForm({
      title: 'Feedback Questionnaire',
      description: '',
      targetScope: 'company',
      recipientMode: 'all',
      company: loggedCompany || null,
      branch: null,
      targetedUsers: [],
      nameVisibility: 'show_name',
      questions: [emptyQuestion()],
    });
  };

  const submitQuestionnaire = async event => {
    event.preventDefault();
    const preparedQuestions = form.questions.map(normalizeQuestion);

    if (!form.title.trim()) {
      setNotice({ severity: 'warning', message: 'Please enter a title' });
      return;
    }
    if (!preparedQuestions.length) {
      setNotice({ severity: 'warning', message: 'Add at least one question' });
      return;
    }

    if (form.targetScope === 'company' && !form.company) {
      setNotice({ severity: 'warning', message: 'Select a company' });
      return;
    }
    if (form.targetScope === 'branch' && (!form.company || !form.branch)) {
      setNotice({ severity: 'warning', message: 'Select company and branch' });
      return;
    }
    if (form.targetScope === 'user' && !form.targetedUsers.length) {
      setNotice({ severity: 'warning', message: 'Select at least one user' });
      return;
    }

    const invalidChoice = preparedQuestions.find(question =>
      ['single_choice', 'multiple_choice'].includes(question.type) && question.options.length < 2
    );
    if (invalidChoice) {
      setNotice({ severity: 'warning', message: `Add at least two options for "${invalidChoice.label}"` });
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post('/feedback/questionnaires', {
        title: form.title.trim(),
        description: form.description.trim(),
        targetScope: form.targetScope,
        recipientMode: form.recipientMode,
        company: getId(form.company),
        branch: getId(form.branch),
        targetedUsers: form.targetedUsers.map(getId).filter(Boolean),
        nameVisibility: form.nameVisibility,
        questions: preparedQuestions,
      });

      setNotice({ severity: 'success', message: 'Questionnaire created and sent successfully' });
      resetForm();
      await fetchData();
    } catch (error) {
      setNotice({ severity: 'error', message: error.response?.data?.message || 'Failed to create questionnaire' });
    } finally {
      setSaving(false);
    }
  };

  const openResponses = async questionnaire => {
    setResponsesDialog({ open: true, loading: true, questionnaire, responses: [] });
    try {
      const response = await axiosInstance.get(`/feedback/questionnaires/${questionnaire._id}/responses`);
      setResponsesDialog({
        open: true,
        loading: false,
        questionnaire: response.data?.data?.questionnaire || questionnaire,
        responses: Array.isArray(response.data?.data?.responses) ? response.data.data.responses : [],
      });
    } catch (error) {
      setResponsesDialog({
        open: true,
        loading: false,
        questionnaire,
        responses: [],
      });
      setNotice({ severity: 'error', message: error.response?.data?.message || 'Failed to load responses' });
    }
  };

  const questionnaireStats = useMemo(() => ({
    total: questionnaires.length,
    anonymous: questionnaires.filter(item => item.nameVisibility === 'anonymous').length,
    visible: questionnaires.filter(item => item.nameVisibility !== 'anonymous').length,
  }), [questionnaires]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="FeedbackQuestionnaire-shell">
      {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      <Box className="FeedbackQuestionnaire-page">
        <Box className="FeedbackQuestionnaire-heading">
          <Typography variant="h4">Create Feedback / Questionnaire</Typography>
          <Typography>Design and send feedback forms to collect valuable insights.</Typography>
        </Box>

        <Box component="form" id="feedback-form" onSubmit={submitQuestionnaire} className="FeedbackQuestionnaire-layout">
          <Box className="FeedbackQuestionnaire-left">
            <Card className="FeedbackQuestionnaire-panel target-panel">
              <CardContent>
                <Typography className="panel-title"><AudienceIcon /> <span>1. Feedback For</span></Typography>
                <Box className="target-options">
                  {[{ label: 'Company', hint: 'For entire company', value: 'company', icon: <BusinessIcon /> }, { label: 'Branch', hint: 'For selected branch', value: 'branch', icon: <BusinessIcon /> }, { label: 'Specific Users', hint: 'For selected users', value: 'user', icon: <PersonIcon /> }].map(option => (
                    <Button key={option.value} className={`target-option ${form.targetScope === option.value ? 'active' : ''}`} onClick={() => setTargetScope(option.value)}>
                      <span className="target-radio" />
                      <strong>{option.label}</strong>
                      <small>{option.hint}</small>
                    </Button>
                  ))}
                </Box>
                {(form.targetScope === 'company' || form.targetScope === 'branch') && <Autocomplete
                  options={companies} value={form.company} disabled={!!lockedCompanyId} onChange={(_, value) => { updateForm('company', value); if (!value) updateForm('branch', null); }}
                  getOptionLabel={getCompanyLabel} isOptionEqualToValue={(option, value) => getId(option) === getId(value)}
                  renderInput={params => <TextField {...params} label="Company" placeholder="Select company" helperText={lockedCompanyId ? 'Logged-in company selected automatically' : ''} />}
                />}
                {form.targetScope === 'branch' && <Autocomplete
                  options={filteredBranches} value={form.branch} onChange={(_, value) => updateForm('branch', value)}
                  getOptionLabel={getBranchLabel} isOptionEqualToValue={(option, value) => getId(option) === getId(value)} disabled={!form.company}
                  renderInput={params => <TextField {...params} label="Branch" placeholder="Select branch" />}
                />}
                {form.targetScope === 'user' && <Autocomplete
                  options={filteredUsers} value={form.targetedUsers[0] || null} onChange={(_, value) => updateForm('targetedUsers', value ? [value] : [])}
                  getOptionLabel={option => option.name || option.email || 'User'} isOptionEqualToValue={(option, value) => getId(option) === getId(value)}
                  renderInput={params => <TextField {...params} label="Specific User" placeholder="Select user" />}
                />}
              </CardContent>
            </Card>

            <Card className="FeedbackQuestionnaire-panel questions-panel">
              <CardContent>
                <Box className="section-heading-row"><Typography className="panel-title"><ReviewIcon /> <span>3. Questions</span></Typography><Button startIcon={<AddIcon />} onClick={addQuestion}>Add Question</Button></Box>
                <Stack spacing={1.1}>
                  {form.questions.map((question, index) => {
                    const options = question.optionsText.split('\n').map(item => item.trim()).filter(Boolean);
                    return <Card key={question.id} className="question-card" variant="outlined">
                      <CardContent>
                        <Box className="question-card-top"><DragIcon className="drag-icon" /><Typography className="question-number">Q{index + 1}</Typography><IconButton onClick={() => removeQuestion(question.id)} disabled={form.questions.length === 1}><DeleteIcon /></IconButton></Box>
                        <Box className="question-editor-grid"><TextField value={question.label} onChange={event => updateQuestion(question.id, 'label', event.target.value)} placeholder="Enter your question" label="Question" />
                          <TextField select value={question.type} onChange={event => updateQuestion(question.id, 'type', event.target.value)} label="Question Type"><MenuItem value="text">Text (Short Answer)</MenuItem><MenuItem value="textarea">Long Text</MenuItem><MenuItem value="single_choice">Single Choice</MenuItem><MenuItem value="multiple_choice">Multiple Choice</MenuItem><MenuItem value="rating">Rating (1-5)</MenuItem><MenuItem value="number">Number</MenuItem></TextField></Box>
                        {(question.type === 'single_choice' || question.type === 'multiple_choice') && <Box className="options-editor"><Typography variant="caption">Options</Typography>{options.map(option => <TextField key={option} size="small" value={option} InputProps={{ readOnly: true, endAdornment: <IconButton size="small"><CloseIcon fontSize="small" /></IconButton> }} />)}<TextField size="small" value={question.optionsText} onChange={event => updateQuestion(question.id, 'optionsText', event.target.value)} placeholder="Add options, one per line" multiline minRows={2} /></Box>}
                        <Box className="required-row"><Typography variant="caption">Required</Typography><input type="checkbox" checked={question.required} onChange={event => updateQuestion(question.id, 'required', event.target.checked)} /></Box>
                      </CardContent>
                    </Card>;
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box className="FeedbackQuestionnaire-middle">
            <Card className="FeedbackQuestionnaire-panel send-panel"><CardContent>
              <Typography className="panel-title"><PaperPlaneIcon /> <span>2. Send To</span></Typography>
              <Typography className="field-label">Target Audience</Typography><Chip label={form.targetScope === 'company' ? 'Entire Company' : form.targetScope === 'branch' ? 'Selected Branch' : 'Specific User'} className="audience-chip" />
              <Typography className="field-label users-label">Total Users</Typography><Typography className="user-count"><AudienceIcon /> <strong>{recipientPreviewCount || 0}</strong> Users will receive this feedback</Typography>
              {form.targetScope !== 'user' && <FormControl className="recipient-control"><FormLabel>Send to</FormLabel><RadioGroup value={form.recipientMode} onChange={event => updateForm('recipientMode', event.target.value)}><FormControlLabel value="all" control={<Radio />} label="All matching users" /><FormControlLabel value="specific" control={<Radio />} label="Specific users" /></RadioGroup></FormControl>}
              {(form.targetScope !== 'user' && form.recipientMode === 'specific') && <Autocomplete multiple options={filteredUsers} value={form.targetedUsers} onChange={(_, value) => updateForm('targetedUsers', value)} getOptionLabel={option => option.name || option.email || 'User'} isOptionEqualToValue={(option, value) => getId(option) === getId(value)} renderInput={params => <TextField {...params} label="Select Recipients" />} />}
            </CardContent></Card>

            <Card className="FeedbackQuestionnaire-panel visibility-panel"><CardContent>
              <Typography className="panel-title"><PersonIcon /> <span>4. Name Visibility</span></Typography><Typography className="panel-help">Choose whether respondent name will be visible to admin.</Typography>
              <RadioGroup value={form.nameVisibility} onChange={event => updateForm('nameVisibility', event.target.value)}>
                <FormControlLabel className={`visibility-option ${form.nameVisibility === 'show_name' ? 'active' : ''}`} value="show_name" control={<Radio />} label={<span><strong>Show Name</strong><small>Admin can see the name of users who submit feedback</small></span>} />
                <FormControlLabel className={`visibility-option ${form.nameVisibility === 'anonymous' ? 'active' : ''}`} value="anonymous" control={<Radio />} label={<span><strong>Hide Name (Anonymous)</strong><small>Admin will not see the name of users</small></span>} />
              </RadioGroup>
              <Box className="visibility-message"><VisibilityOffIcon /><span><strong>User will see this message:</strong><br />"Your response is anonymous. Your name will not be shown to admin."</span></Box>
            </CardContent></Card>

            <Card className="FeedbackQuestionnaire-panel schedule-panel"><CardContent><Typography className="panel-title"><CalendarIcon /> <span>5. Schedule <small>(Optional)</small></span></Typography><TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }} fullWidth /><TextField type="date" label="End Date" InputLabelProps={{ shrink: true }} fullWidth /></CardContent></Card>
          </Box>

          <Card className="FeedbackQuestionnaire-preview"><CardContent>
            <Typography className="preview-title"><VisibilityIcon /> User Will See <small>(Preview)</small></Typography>
            <Box className="preview-window"><Box className="preview-bubble"><ReviewIcon /></Box><Typography variant="h6">We value your feedback!</Typography><Typography className="preview-copy">Please take a few moments to<br />share your feedback.</Typography><Box className="preview-anonymous"><InfoIcon /><span><strong>{form.nameVisibility === 'anonymous' ? 'Your response is anonymous.' : 'Your name will be visible.'}</strong><br />{form.nameVisibility === 'anonymous' ? 'Your name will not be shown.' : 'Admin can see your name.'}</span></Box><Divider />{form.questions.map((question, index) => <Box key={question.id} className="preview-question"><Typography><strong>{index + 1}. {question.label || 'Your question will appear here'}</strong></Typography>{question.type === 'rating' ? <Box className="preview-stars">{[1, 2, 3, 4, 5].map(item => <StarBorderIcon key={item} />)}</Box> : question.type === 'multiple_choice' || question.type === 'single_choice' ? <Stack spacing={.5}>{question.optionsText.split('\n').filter(Boolean).slice(0, 4).map(option => <Typography key={option} className="preview-option"><span className="fake-checkbox" />{option}</Typography>)}</Stack> : <TextField fullWidth multiline minRows={2} placeholder={question.placeholder || 'Write your answer...'} />}</Box>)}<Button variant="contained" fullWidth disabled>Submit Feedback</Button><Typography className="thank-you">Thank you!</Typography></Box>
          </CardContent></Card>
        </Box>
        <Box className="FeedbackQuestionnaire-actions"><Button variant="outlined" startIcon={<CalendarIcon />} disabled>Save as Draft</Button><Button variant="outlined" onClick={resetForm}>Cancel</Button><Button type="submit" form="feedback-form" variant="contained" startIcon={<SendIcon />} disabled={saving}>{saving ? 'Sending...' : 'Create & Send Feedback'}</Button></Box>
      </Box>

      <Card className="FeedbackQuestionnaire-card recent-responses-card"><CardContent><Box className="section-heading-row"><Typography className="panel-title"><SubmittedIcon /> <span>Recent Questionnaires & Responses</span></Typography><IconButton size="small" onClick={fetchData}><RefreshIcon /></IconButton></Box>{questionnaires.length === 0 ? <Alert severity="info">No questionnaires found.</Alert> : <Stack spacing={1}>{questionnaires.map(item => <Box key={item._id} className="recent-item"><Box><Typography fontWeight={800}>{item.title}</Typography><Typography variant="body2">{item.targetSummary || item.targetScope} • {item.responseCount || 0} responses</Typography></Box><Button size="small" onClick={() => openResponses(item)}>View Responses</Button></Box>)}</Stack>}</CardContent></Card>

      <Dialog
        open={responsesDialog.open}
        onClose={() => setResponsesDialog(prev => ({ ...prev, open: false }))}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
          <ReviewIcon />
          {responsesDialog.questionnaire?.title || 'Responses'}
          <IconButton
            onClick={() => setResponsesDialog(prev => ({ ...prev, open: false }))}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {responsesDialog.loading ? (
            <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : responsesDialog.responses.length === 0 ? (
            <Alert severity="info">No responses yet.</Alert>
          ) : (
            <Stack spacing={2}>
              {responsesDialog.responses.map(response => (
                <Card key={response._id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography sx={{ fontWeight: 800 }}>
                          {response.respondent?.name || response.recipientNameSnapshot || 'Anonymous'}
                        </Typography>
                        <Chip size="small" label={new Date(response.submittedAt).toLocaleString()} />
                      </Stack>

                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {response.respondent?.email || response.recipientEmailSnapshot || 'Anonymous submission'}
                      </Typography>

                      <Divider />

                      <Stack spacing={1}>
                        {(response.answers || []).map(answer => (
                          <Box key={answer.questionId} sx={{ borderRadius: 2, bgcolor: '#f8fbff', p: 1.5 }}>
                            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{answer.label}</Typography>
                            <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
                              {Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FeedbackQuestionnaireManagement;
