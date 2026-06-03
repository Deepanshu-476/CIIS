import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Badge,
    Typography,
    Box,
    Avatar,
    Tooltip,
    styled,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Menu as MenuIcon,
    Close as CloseIcon,
    Notifications as NotificationsIcon,
    Campaign as CampaignIcon,
    Add as AddIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    PrivacyTip as PrivacyPolicyIcon,
    ContactSupport as ContactSupportIcon,
    ExitToApp as LogoutIcon,
    Info as VersionIcon,
    List as ViewLogsIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import { ColorModeContext } from '../../Theme/ThemeContext';
import { useAuth } from '../../context/useAuth';
import logo from '/logoo.png'

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    transition: theme.transitions.create(['margin', 'width']),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    height: 56,
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(0, 2),
        height: 64,
    },
    zIndex: theme.zIndex.drawer + 1,
}));

const UserProfile = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1),
    borderRadius: '30px',
    cursor: 'default', // Changed from 'pointer' to 'default' since no click action
    '&:hover': {
        backgroundColor: 'transparent', // Remove hover effect since no click
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0.5),
        gap: theme.spacing(0.25),
    },
}));

const SuperAdminHeader = ({ toggleSidebar, isSidebarOpen }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [userData, setUserData] = useState({
        name: 'CIIS',
        companyName: 'CIIS',
        loginType: 'Company',
        logo: logo
    });
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const navigate = useNavigate();
    const { user } = useAuth();

    // Function to get data from localStorage
    const getLocalStorageData = () => {
        try {
            // Get superAdmin data from localStorage
            const superAdminStr = localStorage.getItem('superAdmin');
            let name = '';
            let loginType = 'Company';
            
            if (superAdminStr) {
                const superAdminData = JSON.parse(superAdminStr);
                if (superAdminData) {
                    name = superAdminData.companyName || superAdminData.company || '';
                    loginType = superAdminData.companyRole || superAdminData.loginType || superAdminData.role || 'Company';
                }
            }

            // Get company data from localStorage
            const companyStr = localStorage.getItem('company');
            let companyName = 'CIIS';
            let companyLogo = logo;
            
            if (companyStr) {
                const companyData = JSON.parse(companyStr);
                if (companyData) {
                    if (companyData.companyName) {
                        companyName = companyData.companyName;
                        if (!name) name = companyData.companyName;
                    }
                    if (companyData.logo) {
                        companyLogo = companyData.logo;
                    }
                }
            }

            return { name: name || companyName, companyName, loginType, logo: companyLogo };
        } catch (error) {
            console.error('Error parsing localStorage data:', error);
            return {
                name: 'CIIS',
                companyName: 'CIIS',
                loginType: 'Company',
                logo: logo
            };
        }
    };

    // Update user data on component mount and when localStorage changes
    useEffect(() => {
        const updateUserData = () => {
            const data = getLocalStorageData();
            setUserData(data);
        };

        updateUserData();

        const handleStorageChange = (e) => {
            if (e.key === 'superAdmin' || e.key === 'company') {
                updateUserData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(updateUserData, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <StyledAppBar
            position="fixed"
            elevation={isScrolled ? 4 : 0}
            sx={{
                backgroundColor: isScrolled ? 'background.paper' : 'transparent',
                color: 'text.primary',
                backdropFilter: isScrolled ? 'blur(8px)' : 'none',
                borderBottom: isScrolled ? `1px solid ${theme.palette.divider}` : 'none',
            }}
        >
            <Toolbar sx={{ width: '100%', padding: '0 !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: isMobile ? 2 : 1 }}>
                    <IconButton
                        color="inherit"
                        onClick={toggleSidebar}
                        edge="start"
                        sx={{ mr: isMobile ? 0.5 : 1 }}
                    >
                        {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
                    </IconButton>

                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover img': {
                                opacity: 0.9,
                                transform: 'scale(1.05)',
                                transition: 'all 0.3s ease',
                            },
                        }}
                        onClick={() => navigate('/Ciis-network/company-details')}
                    >
                        <img
                            src={userData.logo}
                            alt="Logo"
                            style={{
                                height: isMobile ? '35px' : '45px',
                                width: 'auto',
                                marginLeft: '30px',
                                objectFit: 'contain',
                                display: 'block',
                            }}
                        />
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1, flex: 1, justifyContent: 'flex-end', }}>
                    {/* User Profile - No click action, just display */}
                    <UserProfile>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                        </Avatar>
                        {!isMobile && (
                            <Box>
                                <Typography variant="subtitle2" noWrap>
                                    {userData.name}
                                </Typography>
                                <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                                    {userData.loginType}
                                </Typography>
                            </Box>
                        )}
                    </UserProfile>
                </Box>
            </Toolbar>
        </StyledAppBar>
    );
};

export default SuperAdminHeader;
