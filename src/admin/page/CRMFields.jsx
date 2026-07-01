import React, { useState } from 'react';
import {
  Box, Typography, Button, IconButton, TextField, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, MenuItem, Select,
  Divider
} from '@mui/material';
import {
  Add, ExpandMore, Search, MoreVert, ImportExport
} from '@mui/icons-material';

const customOptions = [
  "Hot Followup",
  "Sales Closed",
  "Cold Followup",
  "Appointment Fixed",
  "Not contacted",
  "Not interested",
  "Others"
];

const stageOptions = ["Start", "In Progress", "Closed Won", "Closed Lost"];

const defaultFields = [
  { label: 'Mobile No', required: true, icon: '123' },
  { label: 'Name', icon: 'ABC' },
  { label: 'Email', icon: 'ABC' },
  { label: 'Address', icon: 'ABC' },
  { label: 'City', icon: 'ABC' },
  { label: 'State', icon: 'ABC' },
  { label: 'Country', icon: 'ABC' },
  { label: 'Pincode', icon: '123' },
  { label: 'Company name', icon: 'ABC', editable: true },
  { label: 'Alternate name', icon: 'ABC', editable: true },
  { label: 'Alternate phone', icon: 'ABC', editable: true },
  { label: 'Upload Documents', icon: '🏠' },
  { label: 'Location', icon: '📍' },
  { label: 'Notes', icon: 'ABC' },
  { label: 'Assign To', icon: '☰' },
];

const CRMFields = () => {
  const [expanded, setExpanded] = useState('status');
  const [tabValue, setTabValue] = useState(0);
  const [stageValues, setStageValues] = useState({});

  const handleStageChange = (option, value) => {
    setStageValues(prev => ({
      ...prev,
      [option]: value
    }));
  };

  return (
    <Box p={3}>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" fontWeight={600}>
            CRM Fields
          </Typography>
          <Select size="small" defaultValue="Default process">
            <MenuItem value="Default process">Default process</MenuItem>
          </Select>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" size="small">Preview</Button>
          <Button variant="outlined" size="small" endIcon={<ImportExport />}>Import</Button>
          <Button variant="contained" sx={{ bgcolor: "#ff7a59" }} startIcon={<Add />}>Add Field</Button>
        </Box>
      </Box>

      
      <Tabs
        value={tabValue}
        onChange={(e, newVal) => setTabValue(newVal)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 2 }}
      >
        <Tab label="Custom Fields" />
        <Tab label="Default Fields" />
      </Tabs>

      
      {tabValue === 0 && (
        <>
          <TextField
            size="small"
            fullWidth
            placeholder="Search a field"
            InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
            sx={{ mb: 2 }}
          />

          <Accordion expanded={expanded === 'source'} onChange={() => setExpanded(expanded === 'source' ? false : 'source')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography><strong>Source</strong> <span style={{ fontWeight: 400, color: '#666' }}>↔ 3</span></Typography>
            </AccordionSummary>
          </Accordion>

          <Accordion expanded={expanded === 'status'} onChange={() => setExpanded(expanded === 'status' ? false : 'status')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography><strong>Status</strong> <span style={{ color: 'red' }}>*</span></Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>OPTIONS</Typography>
              {customOptions.map((option, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  px={2} py={1} mb={1}
                  border="1px solid #e0e0e0"
                  borderRadius={1}
                >
                  <Typography>
                    <span style={{ fontSize: "1rem", marginRight: 5 }}>☰</span> {option}
                    {option === "Not contacted" && <Typography component="span" color="text.secondary" ml={1}>📞 2</Typography>}
                    {["Hot Followup", "Cold Followup", "Sales Closed", "Appointment Fixed"].includes(option) && <Typography component="span" color="text.secondary" ml={1}>📞 1</Typography>}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary"><em>Stage:</em></Typography>
                    <Select
                      size="small"
                      value={stageValues[option] || ""}
                      onChange={(e) => handleStageChange(option, e.target.value)}
                      displayEmpty
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {stageOptions.map((stage, i) => (
                        <MenuItem key={i} value={stage}>{stage}</MenuItem>
                      ))}
                    </Select>
                    <IconButton size="small"><MoreVert fontSize="small" /></IconButton>
                  </Box>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" gap={2}>
                <Button startIcon={<Add />} size="small" color="error">Add Option</Button>
                <Button startIcon={<Add />} size="small" color="error">Add Bulk Options</Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {tabValue === 1 && (
        <Box>
          {defaultFields.map((field, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              border="1px solid #e0e0e0"
              px={2} py={1} mb={1} borderRadius={1}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">{field.icon}</Typography>
                <Typography>{field.label} {field.required && <span style={{ color: 'red' }}>*</span>}</Typography>
              </Box>
              <IconButton><MoreVert fontSize="small" /></IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CRMFields;
