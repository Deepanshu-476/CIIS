import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Grid,
  Avatar,
  Link,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';

const industries = ['Technology', 'Healthcare', 'Education', 'Finance'];
const countries = ['India', 'USA', 'UK', 'Canada'];

const CompanyDetails = () => {
  const [formData, setFormData] = useState({
    companyName: 'Career Infowis IT Solution Pvt Ltd',
    industry: '',
    address: 'Flat No 1101 Tower 5A Suncity Parikrama',
    city: 'Panchkula',
    state: 'Haryana',
    country: 'India',
    pinCode: '134117',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box p={4} maxWidth={900} mx="auto" bgcolor="#f9fbfc" borderRadius={2}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Company Details
      </Typography>

      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Choose Industry</InputLabel>
            <Select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              label="Choose Industry"
            >
              {industries.map((item, i) => (
                <MenuItem key={i} value={item}>{item}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        
        <Grid item xs={12} sm={2}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar
              variant="square"
              src="/company-logo.png"
              alt="Company Logo"
              sx={{ width: 100, height: 50 }}
            />
            <Box mt={1}>
              <Link href="#" underline="hover" mr={2}>Edit</Link>
              <Link href="#" underline="hover" color="error">Remove</Link>
            </Box>
          </Box>
        </Grid>

        
        <Grid item xs={12} sm={10}>
          <TextField
            fullWidth
            required
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Country</InputLabel>
            <Select
              name="country"
              value={formData.country}
              onChange={handleChange}
              label="Country"
            >
              {countries.map((item, i) => (
                <MenuItem key={i} value={item}>{item}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="PinCode"
            name="pinCode"
            value={formData.pinCode}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Box textAlign="center">
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(to right, #f857a6, #ff5858)',
                color: '#fff',
                px: 5,
                py: 1.5,
                borderRadius: 2,
                mt: 2
              }}
            >
              Save
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyDetails;
