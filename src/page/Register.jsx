  import { useState } from 'react';
  import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    InputAdornment,
    IconButton,
    CircularProgress,
    Paper,
    Link,
    Zoom
  } from '@mui/material';
  import { Visibility, VisibilityOff, HowToReg } from '@mui/icons-material';
  import axios from '../utils/axiosConfig';
  import { useNavigate } from 'react-router-dom';
  import { toast } from 'react-toastify';
  import BackgroundImage from '../image/login.jpg';

  const Register = () => {
    const [form, setForm] = useState({ 
      name: '',
      email: '', 
      password: '',
      confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
      }
      if (!form.email.includes('@')) {
        toast.error('Please enter a valid email address');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
      }
      if (form.name.length < 3) {
        toast.error('Name must be at least 3 characters');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
      }
      return true;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      setLoading(true);

      try {
        await axios.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password
        });
        toast.success("Registration successful! 🎉");
        navigate('/login');
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Registration failed. Please try again. ❌');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
          <Zoom in timeout={500}>
            <Paper
              elevation={10}
              sx={{
                padding: { xs: 3, sm: 4 },
                borderRadius: 3,
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                color: '#fff',
                transform: shake ? 'translateX(-5px)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
              }}
            >
              <Box textAlign="center" mb={3}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    color: '#fff',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    mb: 1
                  }}
                >
                  Create Account
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Join us to get started
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <TextField
                  label="Full Name"
                  name="name"
                  fullWidth
                  margin="normal"
                  value={form.name}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(144, 202, 249, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#90caf9',
                      },
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      color: 'rgba(144, 202, 249, 0.7)',
                    }
                  }}
                  InputProps={{
                    style: {
                      color: '#fff',
                    },
                  }}
                />

                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={form.email}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(144, 202, 249, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#90caf9',
                      },
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      color: 'rgba(144, 202, 249, 0.7)',
                    }
                  }}
                  InputProps={{
                    style: {
                      color: '#fff',
                    },
                  }}
                />

                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  value={form.password}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(144, 202, 249, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#90caf9',
                      },
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      color: 'rgba(144, 202, 249, 0.7)',
                    }
                  }}
                  InputProps={{
                    style: {
                      color: '#fff',
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              color: '#90caf9',
                              backgroundColor: 'rgba(144, 202, 249, 0.1)'
                            }
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(144, 202, 249, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#90caf9',
                      },
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      color: 'rgba(144, 202, 249, 0.7)',
                    }
                  }}
                  InputProps={{
                    style: {
                      color: '#fff',
                    },
                  }}
                />

                <Box mt={4}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .2)',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                      },
                      '&:disabled': {
                        background: 'rgba(25, 118, 210, 0.5)',
                      }
                    }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HowToReg />}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                </Box>
              </form>

              <Box mt={4} textAlign="center">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Already have an account?{' '}
                  <Link
                    onClick={() => navigate('/login')}
                    sx={{
                      color: '#90caf9',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    Login
                  </Link>
                </Typography>
              </Box>

              <Box mt={2} textAlign="center">
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  By registering, you agree to our Terms and Privacy Policy
                </Typography>
              </Box>
            </Paper>
          </Zoom>
        </Container>
      </Box>
    );
  };

  export default Register;