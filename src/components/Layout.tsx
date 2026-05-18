import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Avatar, 
  Button, 
  useMediaQuery, 
  useTheme as useMuiTheme,
  Divider,
  Paper
} from '@mui/material';
import { 
  Home, 
  BookOpen, 
  User, 
  LogIn, 
  LogOut, 
  Menu as MenuIcon, 
  Mic2, 
  Radio,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Detection', icon: Home },
  { id: 'training', label: 'Training', icon: BookOpen },
  { id: 'pronunciation', label: 'Pronunciation', icon: Mic2 },
  { id: 'live', label: 'Live', icon: Radio },
  { id: 'profile', label: 'Profile', icon: User },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (id: string) => void;
}

const DRAWER_WIDTH = 260;

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { user, signIn, logout } = useAuth();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(!isMobile);

  const handleDrawerToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const SidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0A0908' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: 80 }}>
        <Box sx={{ 
          width: 32, 
          height: 32, 
          borderRadius: 1, 
          bgcolor: 'primary.main', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Mic2 size={20} color="#0A0908" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -1 }}>
          LingoLens
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, px: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  onTabChange(item.id);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? '#0A0908' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#0A0908' : 'text.primary',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 44 }}>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {item.label}
                    </Typography>
                  } 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {user ? (
          <ListItemButton
            onClick={() => logout()}
            sx={{ borderRadius: 3, color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white', opacity: 0.1 } }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 44 }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Logout
                </Typography>
              } 
            />
          </ListItemButton>
        ) : (
          <ListItemButton
            onClick={() => signIn()}
            sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 44 }}>
              <LogIn size={20} />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Sign In
                </Typography>
              } 
            />
          </ListItemButton>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0A0908' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isSidebarOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid #1C1A18',
          },
        }}
      >
        {SidebarContent}
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ height: 80, px: { xs: 2, md: 4 }, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton onClick={handleDrawerToggle} color="inherit" edge="start">
                  <MenuIcon />
                </IconButton>
              )}
              <Typography 
                variant="overline" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 700, 
                  letterSpacing: 2, 
                  display: { xs: 'none', sm: 'block' } 
                }}
              >
                {NAV_ITEMS.find(i => i.id === activeTab)?.label}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user ? (
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: '99px',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid #1C1A18',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, ml: 1, display: { xs: 'none', sm: 'block' } }}>
                    {user.displayName}
                  </Typography>
                  <Avatar 
                    src={user.photoURL || ''} 
                    sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Paper>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<LogIn size={18} />}
                  onClick={signIn}
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 6 }, position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};
