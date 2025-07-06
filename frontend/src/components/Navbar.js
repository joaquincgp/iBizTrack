import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Calculate as CalculateIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotifications = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const menuItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Buscar Productos', path: '/products', icon: <SearchIcon /> },
    { text: 'Gestión de Órdenes', path: '/orders', icon: <ShoppingCartIcon /> },
    { text: 'Calculadora SENAE', path: '/calculator', icon: <CalculateIcon /> },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="sticky" elevation={2} sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
      <Toolbar>
        {/* Logo y Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <BusinessIcon sx={{ mr: 1, fontSize: 28 }} />
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', lineHeight: 1, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              iBizTrack
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, lineHeight: 1, display: { xs: 'none', sm: 'block' } }}
            >
              iBusiness Ecuador
            </Typography>
          </Box>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {menuItems.map((item) => (
            <Tooltip key={item.path} title={item.text}>
              <Button
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: isActive(item.path) ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box sx={{ display: { md: 'none', lg: 'block' } }}>
                  {item.text}
                </Box>
              </Button>
            </Tooltip>
          ))}
        </Box>

        {/* Notifications */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Tooltip title="Notificaciones">
            <IconButton
              color="inherit"
              onClick={handleNotifications}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Account */}
          <Tooltip title="Cuenta">
            <IconButton
              color="inherit"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <AccountIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Mobile Navigation */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 200,
              }
            }}
          >
            {menuItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {item.icon}
                  <Typography variant="body1">{item.text}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 300,
              maxWidth: 400,
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notificaciones
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="primary" gutterBottom>
                Nueva orden creada
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Orden IBT-20241207-ABC123 por $299.99
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="warning.main" gutterBottom>
                Producto con tarifa alta
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Echo Dot excede límites de categoría B
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="success.main" gutterBottom>
                Cálculo completado
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tarifas SENAE actualizadas exitosamente
              </Typography>
            </Box>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;